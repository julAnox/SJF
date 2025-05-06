"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import {
  Search,
  MessagesSquare,
  MoreVertical,
  Trash2,
  Share2,
  XCircle,
  Ban,
  Send,
  FileText,
  Briefcase,
  Download,
  CheckCheck,
} from "lucide-react";
import {
  jobsApi,
  usersApi,
  companiesApi,
  resumesApi,
} from "../../services/api";
import chatsService from "../../services/chatsService";
import messagesService from "../../services/messagesService";
import applicationsService from "../../services/applicationsService";
import ShareContactModal from "../../components/Modals/ShareContactModal";
import { toast } from "../../utils/toast";

// Add this type declaration at the top of the file, after the imports
declare global {
  interface Window {
    chatDataCache?: {
      chats: any[];
      timestamp: number;
    };
    chatRelatedDataCache?: {
      applications: any[];
      jobs: any[];
      users: any[];
      companies: any[];
      chatCount: number;
      timestamp: number;
    };
    chatMessagesCache?: {
      [chatId: string]: {
        messages: any[];
        timestamp: number;
      };
    };
    messagesCache?: {
      [key: string]: {
        messages: any[];
        status: "active" | "closed" | "blocked";
        otherUser: any;
        timestamp: number;
      };
    };
    currentOpenChat?: string;
  }
}

const Chat = () => {
  const { t } = useTranslation();
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(
    chatId || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [chatStatus, setChatStatus] = useState<"active" | "closed" | "blocked">(
    "active"
  );
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageActive = useRef<boolean>(true);
  const [shareableChats, setShareableChats] = useState<
    Array<{ id: string; userName: string; userAvatar: string }>
  >([]);
  const hasMarkedMessagesAsRead = useRef<boolean>(false);
  const markingInProgress = useRef<boolean>(false);

  // Add user scroll tracking to prevent automatic scrolling when user is manually scrolling
  // Add these new state variables after the other state declarations:
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageActive.current = document.visibilityState === "visible";

      // If page becomes visible and we're on the chat page, refresh data
      if (isPageActive.current && location.pathname.includes("/chat")) {
        fetchChats(true);
        if (selectedChat) {
          fetchMessages(true);
        }
      }
    };

    // Track when user switches tabs
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Track when user navigates to/from the chat page
    const handleRouteChange = () => {
      const isChatPage = location.pathname.includes("/chat");

      // Start or stop polling based on whether we're on the chat page
      if (isChatPage) {
        startPolling();
      } else {
        stopPolling();
      }
    };

    // Initial check
    handleRouteChange();

    // Listen for route changes
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("popstate", handleRouteChange);
      stopPolling(); // Clean up intervals when component unmounts

      // Add this:
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [location.pathname]);

  // Fetch chats
  const fetchChats = async (forceRefresh = false) => {
    if (!user) return;

    try {
      console.log(`Fetching chats (forceRefresh: ${forceRefresh})`);

      // Use cached data if available and not forcing refresh
      const now = Date.now();
      const cacheExpiry = 30000; // 30 seconds cache

      // Only fetch if forcing refresh or cache expired
      if (
        !forceRefresh &&
        window.chatDataCache &&
        now - window.chatDataCache.timestamp < cacheExpiry
      ) {
        setChats(window.chatDataCache.chats);
        setIsLoading(false);
        return;
      }

      // Fetch data
      const allChats = await chatsService.getAll();
      console.log(`Fetched ${allChats.length} chats from API`);

      // If no chats or forcing refresh, fetch all related data
      // Otherwise, use cached related data when possible
      let allApplications, allJobs, allUsers, allCompanies;

      if (
        !window.chatRelatedDataCache ||
        forceRefresh ||
        allChats.length !== window.chatRelatedDataCache.chatCount
      ) {
        allApplications = await applicationsService.getAll();
        allJobs = await jobsApi.getAll();
        allUsers = await usersApi.getAll();
        allCompanies = await companiesApi.getAll();

        // Cache related data
        window.chatRelatedDataCache = {
          applications: allApplications,
          jobs: allJobs,
          users: allUsers,
          companies: allCompanies,
          chatCount: allChats.length,
          timestamp: now,
        };
      } else {
        // Use cached related data
        allApplications = window.chatRelatedDataCache.applications;
        allJobs = window.chatRelatedDataCache.jobs;
        allUsers = window.chatRelatedDataCache.users;
        allCompanies = window.chatRelatedDataCache.companies;
      }

      // Process chats based on user role
      const processedChats = [];

      for (const chat of allChats) {
        const application = allApplications.find(
          (app) => app.id === chat.application
        );
        if (!application) continue;

        const job = allJobs.find((j) => j.id === application.job);
        if (!job) continue;

        let isRelevant = false;

        if (user.role === "student") {
          // For students, show chats where they are the applicant
          isRelevant = application.user === Number.parseInt(user.id);
        } else if (user.role === "company") {
          // For companies, we need to check if this job belongs to the company
          // First, find the company associated with the current user
          const userCompany = allCompanies.find(
            (company) => company.user === Number.parseInt(user.id)
          );

          if (userCompany) {
            // Check if the job belongs to this company
            isRelevant =
              typeof job.company === "number"
                ? job.company === userCompany.id
                : job.company.id === userCompany.id;
          } else {
            // Fallback to direct user ID comparison if company not found
            isRelevant =
              typeof job.company === "number"
                ? job.company === Number.parseInt(user.id)
                : job.company.id === Number.parseInt(user.id);
          }
        }

        if (!isRelevant) continue;

        // Get messages for this chat - only fetch if needed
        let chatMessages;
        let lastMessage = null;
        let unreadCount = 0;

        // Only fetch messages if we need to (for unread count or last message)
        if (
          forceRefresh ||
          !window.chatMessagesCache ||
          !window.chatMessagesCache[chat.id]
        ) {
          chatMessages = await messagesService.getByChatId(chat.id.toString());
          console.log(
            `Fetched ${chatMessages.length} messages for chat ${chat.id}`
          );

          // Cache messages for this chat
          if (!window.chatMessagesCache) window.chatMessagesCache = {};
          window.chatMessagesCache[chat.id] = {
            messages: chatMessages,
            timestamp: now,
          };
        } else {
          chatMessages = window.chatMessagesCache[chat.id].messages;
        }

        lastMessage =
          chatMessages.length > 0
            ? chatMessages[chatMessages.length - 1]
            : null;

        // Check if this chat is currently open
        const isChatOpen =
          selectedChat === chat.id.toString() ||
          window.currentOpenChat === chat.id.toString();

        // If the chat is currently open, set unread count to 0
        if (isChatOpen) {
          unreadCount = 0;
        } else {
          unreadCount = chatMessages.filter(
            (msg) => !msg.read && msg.sender !== Number.parseInt(user.id)
          ).length;
        }

        // Get company or applicant name
        let name = "";
        if (user.role === "student") {
          // For students, show the company name
          try {
            // Try to get company details from companies API
            const companyId =
              typeof job.company === "number" ? job.company : job.company.id;
            const companyDetails = allCompanies.find((c) => c.id === companyId);
            name = companyDetails?.name || "Company";

            if (!name || name === "Company") {
              // Fallback to user name if company name not found
              const companyUser = allUsers.find(
                (u) =>
                  u.id ===
                  (typeof job.company === "number"
                    ? job.company
                    : job.company.user)
              );
              name = companyUser ? companyUser.first_name : "Company";
            }
          } catch (error) {
            name = "Company";
          }
        } else {
          // For companies, show the applicant name
          const applicant = allUsers.find((u) => u.id === application.user);
          name = applicant
            ? `${applicant.first_name} ${applicant.last_name}`
            : "Applicant";
        }

        processedChats.push({
          id: chat.id.toString(),
          companyName: name,
          jobTitle: job.title,
          lastMessage: lastMessage?.content || "",
          timestamp: lastMessage?.created_at || chat.created_at,
          unreadCount,
          status: chat.status as "active" | "closed" | "blocked",
          application,
          job,
        });
      }

      // Sort by timestamp (newest first)
      processedChats.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Cache the processed chats
      window.chatDataCache = {
        chats: processedChats,
        timestamp: now,
      };

      setChats(processedChats);
      console.log(`Processed ${processedChats.length} relevant chats`);
    } catch (error) {
      console.error("Error fetching chats:", error);
      console.log(`Error fetching chats: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a scroll handler function after the other function declarations:
  const handleMessagesScroll = () => {
    setIsUserScrolling(true);

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set a timeout to reset the scrolling state after user stops scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000); // Reset after 1 second of no scrolling
  };

  // Initial fetch of chats
  useEffect(() => {
    if (user) {
      // Only fetch on initial load, then rely on manual refresh or visibility changes
      fetchChats();

      // Add event listener for focus/blur to detect when user returns to the tab
      const handleFocus = () => {
        if (location.pathname.includes("/chat")) {
          fetchChats(true); // Force refresh when user returns to the tab
          if (selectedChat) {
            fetchMessages(true);
          }
        }
      };

      window.addEventListener("focus", handleFocus);

      return () => {
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [user]);

  // Fetch messages when selected chat changes
  const fetchMessages = async (forceRefresh = false) => {
    if (!selectedChat || !user) return;

    try {
      console.log(
        `Fetching messages for chat ${selectedChat} (forceRefresh: ${forceRefresh})`
      );

      const now = Date.now();
      const messagesCacheKey = `messages_${selectedChat}`;
      const cacheExpiry = 10000; // 10 seconds cache for messages

      // Use cached data if available and not forcing refresh
      if (
        !forceRefresh &&
        window.messagesCache &&
        window.messagesCache[messagesCacheKey] &&
        now - window.messagesCache[messagesCacheKey].timestamp < cacheExpiry
      ) {
        setMessages(window.messagesCache[messagesCacheKey].messages);
        setChatStatus(window.messagesCache[messagesCacheKey].status);
        setOtherUser(window.messagesCache[messagesCacheKey].otherUser);

        // Mark messages as read even when using cached data
        markMessagesAsRead(selectedChat);
        return;
      }

      // Get chat details
      const chat = await chatsService.getById(selectedChat);
      setChatStatus(chat.status as "active" | "closed" | "blocked");

      // Get application details
      const application = await applicationsService.getById(
        chat.application.toString()
      );

      // Get job details
      const job = await jobsApi.getById(application.job.toString());

      // Get company or applicant details
      const isCompany = user.role === "company";
      const otherUserId = isCompany
        ? application.user
        : typeof job.company === "number"
        ? job.company
        : job.company.id;
      const otherUserDetails = await usersApi.getById(otherUserId);
      setOtherUser(otherUserDetails);

      // Get messages
      const chatMessages = await messagesService.getByChatId(selectedChat);
      console.log(
        `Fetched ${chatMessages.length} messages for chat ${selectedChat}`
      );

      // Transform messages
      const transformedMessages = chatMessages.map((msg) => ({
        id: msg.id.toString(),
        senderId: msg.sender.toString(),
        content: msg.content,
        type: msg.message_type,
        metadata: msg.metadata,
        timestamp: msg.created_at,
        read: msg.read,
      }));

      // Cache the messages
      if (!window.messagesCache) window.messagesCache = {};
      window.messagesCache[messagesCacheKey] = {
        messages: transformedMessages,
        status: chat.status as "active" | "closed" | "blocked",
        otherUser: otherUserDetails,
        timestamp: now,
      };

      setMessages(transformedMessages);

      // Mark unread messages as read
      await markMessagesAsRead(selectedChat);
    } catch (error) {
      console.error("Error fetching messages:", error);
      console.log(`Error fetching messages: ${error}`);
    }
  };

  // Initial fetch of messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      // Store the current open chat in window for reference
      window.currentOpenChat = selectedChat;

      setIsLoading(true);
      hasMarkedMessagesAsRead.current = false;

      fetchMessages(true).finally(() => {
        setIsLoading(false);
        // Immediately mark messages as read when opening a chat
        if (user && !hasMarkedMessagesAsRead.current) {
          markMessagesAsRead(selectedChat);

          // Force update the chat list to reflect the changes
          setTimeout(() => {
            fetchChats(true);
          }, 500);
        }
      });
    }

    // Clean up when chat changes
    return () => {
      if (messagesUpdateIntervalRef.current) {
        clearInterval(messagesUpdateIntervalRef.current);
        messagesUpdateIntervalRef.current = null;
      }

      // Clear the current open chat when component unmounts
      window.currentOpenChat = undefined;
    };
  }, [selectedChat, user]);

  // Mark messages as read when chat is opened or when new messages arrive
  const markMessagesAsRead = async (chatId: string) => {
    if (!user || markingInProgress.current) return;

    try {
      markingInProgress.current = true;
      console.log(`Attempting to mark messages as read in chat ${chatId}`);

      // Use the new bulk endpoint to mark all messages as read
      await messagesService.markAllAsReadInChat(chatId, user.id);
      hasMarkedMessagesAsRead.current = true;

      // Update the messages in state to reflect they are read
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.senderId !== user.id && !msg.read) {
            return { ...msg, read: true };
          }
          return msg;
        })
      );

      // Update the unread count in the chat list
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === chatId) {
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        })
      );

      // Force a refresh of the chat list to update unread counts
      fetchChats(true);

      // Force refresh the unread count in the header by triggering a global event
      const event = new CustomEvent("unreadMessagesUpdated");
      window.dispatchEvent(event);

      console.log(`Successfully marked all messages as read in chat ${chatId}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      console.log(`Error marking messages as read: ${error}`);
    } finally {
      markingInProgress.current = false;
    }
  };

  // Add a function to immediately mark messages as read when entering a chat
  useEffect(() => {
    // This effect runs when the URL changes to a chat
    if (selectedChat && location.pathname.includes(`/chat/${selectedChat}`)) {
      // Mark all messages as read immediately when entering a chat
      const markAllMessagesAsRead = async () => {
        if (!user) return;

        try {
          console.log(
            `Marking all messages as read in chat ${selectedChat} via markAllAsReadInChat`
          );
          // Call the service to mark all messages as read
          await messagesService.markAllAsReadInChat(selectedChat, user.id);
          hasMarkedMessagesAsRead.current = true;

          // Update local state
          setMessages((prev) =>
            prev.map((msg) => ({
              ...msg,
              read: msg.senderId === user.id ? msg.read : true,
            }))
          );

          // Update chat list to show zero unread messages for this chat
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === selectedChat ? { ...chat, unreadCount: 0 } : chat
            )
          );

          // Force refresh the chat list and header unread counts
          fetchChats(true);

          // Dispatch event to update header
          const event = new CustomEvent("unreadMessagesUpdated");
          window.dispatchEvent(event);
        } catch (error) {
          console.error("Error marking all messages as read:", error);
          console.log(`Error in markAllMessagesAsRead: ${error}`);
        }
      };

      markAllMessagesAsRead();
    }
  }, [selectedChat, location.pathname, user]);

  // Modify the useEffect that handles scrolling to bottom when messages change:
  // Find this useEffect:
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  // }, [messages])

  // Replace it with:
  useEffect(() => {
    // Only auto-scroll if user is not manually scrolling
    // or if this is a new message from the current user
    const isNewMessageFromCurrentUser =
      messages.length > 0 &&
      messages[messages.length - 1]?.senderId === user?.id;

    if (!isUserScrolling || isNewMessageFromCurrentUser) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isUserScrolling, user?.id]);

  // Update URL when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      navigate(`/chat/${selectedChat}`);
    } else {
      navigate("/chat");
    }
  }, [selectedChat, navigate]);

  // Update selected chat when URL param changes
  useEffect(() => {
    if (chatId) {
      setSelectedChat(chatId);
    }
  }, [chatId]);

  // Mark messages as read when the user is viewing the chat
  useEffect(() => {
    if (selectedChat && location.pathname.includes(`/chat/${selectedChat}`)) {
      markMessagesAsRead(selectedChat);
    }
  }, [selectedChat, location.pathname]);

  // Add useEffect to mark messages as read when viewing a chat
  // This ensures messages are marked as read when the user is actively viewing them
  useEffect(() => {
    // Check if user is currently viewing a chat
    if (
      selectedChat &&
      user &&
      location.pathname.includes(`/chat/${selectedChat}`)
    ) {
      // Create an observer to check if user is viewing the messages
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // User is viewing the messages, mark them as read
              markMessagesAsRead(selectedChat);
            }
          });
        },
        { threshold: 0.1 } // Trigger when at least 10% of the element is visible
      );

      // Observe the messages container
      const messagesContainer = document.querySelector(".messages-container");
      if (messagesContainer) {
        observer.observe(messagesContainer);
      }

      return () => {
        if (messagesContainer) {
          observer.unobserve(messagesContainer);
        }
      };
    }
  }, [selectedChat, user, location.pathname]);

  // Start polling functions
  const startPolling = () => {
    // Clear any existing intervals first
    stopPolling();

    // Only start polling if we're on the chat page and the tab is visible
    if (location.pathname.includes("/chat") && isPageActive.current) {
      // Initial fetch
      fetchChats();

      // Set up chat list polling
      chatUpdateIntervalRef.current = setInterval(() => {
        if (isPageActive.current && document.hasFocus()) {
          // Check for new messages
          checkForNewMessages();
        }
      }, 2000); // Check every 2 seconds

      // Set up messages polling if a chat is selected
      if (selectedChat) {
        messagesUpdateIntervalRef.current = setInterval(() => {
          if (isPageActive.current && document.hasFocus()) {
            checkForNewChatMessages();
          }
        }, 2000); // Check every 2 seconds
      }
    }
  };

  // Stop polling function
  const stopPolling = () => {
    if (chatUpdateIntervalRef.current) {
      clearInterval(chatUpdateIntervalRef.current);
      chatUpdateIntervalRef.current = null;
    }

    if (messagesUpdateIntervalRef.current) {
      clearInterval(messagesUpdateIntervalRef.current);
      messagesUpdateIntervalRef.current = null;
    }
  };

  // Update the checkForNewMessages function to properly handle the currently open chat
  const checkForNewMessages = async () => {
    if (!user) return;

    try {
      // Only check for new messages, not full data
      const allChats = await chatsService.getAll();

      // If chat count changed, do a full refresh
      if (
        !window.chatRelatedDataCache ||
        allChats.length !== window.chatRelatedDataCache.chatCount
      ) {
        fetchChats(true);
        return;
      }

      // Check for new messages in existing chats
      let hasNewMessages = false;
      let updatedChats = [...chats];
      let needsUpdate = false;

      for (const chat of chats) {
        const chatMessages = await messagesService.getByChatId(chat.id);

        // Check if this chat is currently open
        const isChatOpen =
          selectedChat === chat.id || window.currentOpenChat === chat.id;

        // Get unread messages count - if chat is open, count should be 0
        let unreadCount = 0;
        if (!isChatOpen) {
          unreadCount = chatMessages.filter(
            (msg) => !msg.read && msg.sender !== Number.parseInt(user.id)
          ).length;
        }

        // Check if unread count changed
        if (unreadCount !== chat.unreadCount) {
          hasNewMessages = true;
          updatedChats = updatedChats.map((c) =>
            c.id === chat.id ? { ...c, unreadCount } : c
          );
          needsUpdate = true;
        }

        // Check if we have new messages
        if (
          !window.chatMessagesCache ||
          !window.chatMessagesCache[chat.id] ||
          chatMessages.length >
            window.chatMessagesCache[chat.id].messages.length
        ) {
          hasNewMessages = true;

          // Update cache
          if (!window.chatMessagesCache) window.chatMessagesCache = {};
          window.chatMessagesCache[chat.id] = {
            messages: chatMessages,
            timestamp: Date.now(),
          };

          // If this is the currently selected chat, update the messages and mark as read
          if (isChatOpen) {
            fetchMessages(true);
            markMessagesAsRead(chat.id);
          }
        }
      }

      if (needsUpdate) {
        // Update chat list with new unread counts without full refresh
        setChats(updatedChats);
      }

      if (hasNewMessages && !needsUpdate) {
        // If we have new messages but didn't update counts, do a full refresh
        fetchChats(true);
      }

      // Force refresh the unread count in the header
      const event = new CustomEvent("unreadMessagesUpdated");
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error checking for new messages:", error);
      console.log(`Error checking for new messages: ${error}`);
    }
  };

  const checkForNewChatMessages = async () => {
    if (!selectedChat || !user) return;

    try {
      const chatMessages = await messagesService.getByChatId(selectedChat);

      // Check if we have new messages in the current chat
      if (chatMessages.length > messages.length) {
        fetchMessages(true);
      }
    } catch (error) {
      console.error("Error checking for new chat messages:", error);
      console.log(`Error checking for new chat messages: ${error}`);
    }
  };

  // Enhance the handleSendMessage function to properly handle message status
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    try {
      // Create message
      const messageData = {
        chat: Number.parseInt(selectedChat),
        sender: Number.parseInt(user.id),
        content: newMessage,
        message_type: "text",
        read: false,
      };

      // Add message to state immediately with temporary ID for better UX
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        id: tempId,
        senderId: user.id,
        content: newMessage,
        type: "text",
        metadata: null,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");

      // Scroll to bottom
      setTimeout(() => {
        // Force scroll to bottom when user sends a message, regardless of scroll state
        setIsUserScrolling(false);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // Actually send the message to the server
      const createdMessage = await messagesService.create(messageData);
      console.log(`Created new message with ID ${createdMessage.id}`);

      // Replace the temporary message with the real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                id: createdMessage.id.toString(),
                senderId: user.id,
                content: newMessage,
                type: "text",
                metadata: null,
                timestamp: createdMessage.created_at,
                read: false,
              }
            : msg
        )
      );

      // Update cache
      if (
        window.messagesCache &&
        window.messagesCache[`messages_${selectedChat}`]
      ) {
        window.messagesCache[`messages_${selectedChat}`].messages = messages;
        window.messagesCache[`messages_${selectedChat}`].timestamp = Date.now();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      console.log(`Error sending message: ${error}`);
      // Remove the temporary message if sending failed
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== `temp-${Date.now()}`)
      );
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleChatAction = async (
    action: "delete" | "clear" | "share" | "close" | "block"
  ) => {
    if (!selectedChat) return;

    try {
      switch (action) {
        case "delete":
          if (window.confirm(t("chat.settings.confirmDelete"))) {
            // First delete all messages in the chat
            await messagesService.deleteAllInChat(selectedChat);
            // Then delete the chat itself
            await chatsService.delete(selectedChat);
            toast.success("Chat deleted successfully");
            setSelectedChat(null);
            // Refresh the chat list
            fetchChats();
          }
          break;
        case "clear":
          if (window.confirm(t("chat.settings.confirmClear"))) {
            // Delete all messages
            await messagesService.deleteAllInChat(selectedChat);
            setMessages([]);
            toast.success("Messages cleared successfully");
          }
          break;
        case "block":
          if (window.confirm(t("chat.settings.confirmBlock"))) {
            await chatsService.updateStatus(selectedChat, "blocked");
            setChatStatus("blocked");
            toast.success("Chat blocked successfully");
          }
          break;
        case "close":
          await chatsService.updateStatus(selectedChat, "closed");
          setChatStatus("closed");
          toast.success("Chat closed successfully");
          break;
        case "share":
          // Prepare shareable chats data
          const otherChats = chats
            .filter((chat) => chat.id !== selectedChat)
            .map((chat) => ({
              id: chat.id,
              userName: chat.companyName,
              userAvatar: `https://ui-avatars.com/api/?name=${chat.companyName.charAt(
                0
              )}&background=10B981&color=fff`,
            }));

          setShareableChats(otherChats);
          setShowShareModal(true);
          break;
      }
      setShowSettings(false);
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      console.log(`Error performing action ${action}: ${error}`);
      toast.error(`Failed to ${action} chat. Please try again.`);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadResume = async (message: any) => {
    if (message.type !== "resume" || !message.metadata?.resumeId) return;

    try {
      const resume = await resumesApi.getById(message.metadata.resumeId);

      // Create resume content
      const content = `
Resume: ${resume.profession || "Resume"}

Personal Information:
-------------------
Name: ${otherUser?.first_name} ${otherUser?.last_name}
Email: ${otherUser?.email}
Phone: ${otherUser?.phone || "Not provided"}

Skills:
-------
${
  resume.skills
    ? Object.entries(resume.skills)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")
    : "Not provided"
}

Experience:
----------
${resume.experience || "Not provided"}

Education:
---------
${resume.education || "Not provided"}
Institution: ${resume.institutionName || "Not provided"}
Graduation Year: ${resume.graduationYear || "Not provided"}
Specialization: ${resume.specialization || "Not provided"}
      `.trim();

      // Create and download file
      const blob = new Blob([content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${otherUser?.first_name || "Applicant"}_Resume.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading resume:", error);
      console.log(`Error downloading resume: ${error}`);
    }
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pt-20 bg-gray-900 flex"
      onClick={() => {
        // Ensure polling is active when user interacts with the chat page
        if (!chatUpdateIntervalRef.current) {
          startPolling();
        }
      }}
    >
      {/* Chat List */}
      <div className="w-96 border-r border-gray-700 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder={t("chat.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && !selectedChat ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`p-4 hover:bg-gray-700 cursor-pointer transition-colors ${
                  selectedChat === chat.id ? "bg-gray-700" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {chat.companyName.charAt(0)}
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                        {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-white">
                        {chat.companyName}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {formatTime(chat.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {chat.jobTitle}
                    </p>
                    {chat.lastMessage && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {chat.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <p>No chats</p>
              <button
                onClick={() => navigate("/jobs")}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-sm"
              >
                Browse Jobs
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
            {isLoading ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-3 w-24 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                  {chats
                    .find((c) => c.id === selectedChat)
                    ?.companyName.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold text-white">
                    {chats.find((c) => c.id === selectedChat)?.companyName}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {chats.find((c) => c.id === selectedChat)?.jobTitle}
                  </p>
                </div>
              </div>
            )}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <MoreVertical className="w-6 h-6" />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                  <button
                    onClick={() => handleChatAction("delete")}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("chat.settings.delete")}
                  </button>
                  <button
                    onClick={() => handleChatAction("clear")}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {t("chat.settings.clear")}
                  </button>
                  <button
                    onClick={() => handleChatAction("share")}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    {t("chat.settings.share")}
                  </button>
                  <button
                    onClick={() => handleChatAction("block")}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    {t("chat.settings.block")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 messages-container"
            onScroll={handleMessagesScroll}
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.senderId === user?.id
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {message.type === "resume" && (
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          <span>{t("chat.messages.resume")}</span>
                        </div>
                        <button
                          onClick={() => handleDownloadResume(message)}
                          className="p-1 hover:bg-emerald-500/20 rounded transition-colors"
                          title="Download Resume"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {message.type === "coverLetter" && (
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5" />
                        <span>{t("chat.messages.coverLetter")}</span>
                      </div>
                    )}
                    {message.type === "jobOffer" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-5 h-5" />
                        <span>{t("chat.messages.jobOffer")}</span>
                      </div>
                    )}
                    <p>{message.content}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs opacity-75 block">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.senderId === user?.id && (
                        <div className="text-xs">
                          {message.read ? (
                            <div className="text-gray-800" title="Read">
                              <CheckCheck className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="text-gray-300" title="Sent">
                              <CheckCheck className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessagesSquare className="w-12 h-12 mb-2" />
                <p>No messages yet</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {chatStatus === "blocked" ? (
            <div className="p-4 border-t border-gray-700 bg-gray-800 text-center">
              <p className="text-gray-400">{t("chat.blocked")}</p>
              <button
                onClick={async () => {
                  if (selectedChat) {
                    await chatsService.updateStatus(selectedChat, "active");
                    setChatStatus("active");
                  }
                }}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
              >
                {t("chat.unblock")}
              </button>
            </div>
          ) : chatStatus === "closed" ? (
            <div className="p-4 border-t border-gray-700 bg-gray-800 text-center">
              <p className="text-gray-400">{t("chat.closed")}</p>
            </div>
          ) : (
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-700 bg-gray-800"
            >
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t("chat.input.placeholder")}
                  className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t("chat.input.send")}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MessagesSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No messages yet</p>
            <p className="mt-2 text-sm">Select a chat</p>
          </div>
        </div>
      )}

      {/* Share Contact Modal */}
      <ShareContactModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={(chatId) => {
          if (selectedChat && otherUser) {
            // Handle sharing contact to selected chat
            toast.success(`Contact shared to chat`);
          }
        }}
        chats={shareableChats}
      />
    </div>
  );
};

export default Chat;
