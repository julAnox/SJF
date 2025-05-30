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
  ArrowDown,
  Clock,
  ImageIcon,
  Smile,
  Paperclip,
  Pin,
  File,
  X,
  GraduationCap,
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
import { resumeApplicationsService } from "../../services/resumeApplicationsService";
import pinnedChatsService from "../../services/pinnedChatsService";
import ShareContactModal from "../../components/Modals/ShareContactModal";
import { toast } from "../../utils/toast";
import EmojiPicker from "emoji-picker-react";

// Add this type declaration at the top of the file, after the imports
declare global {
  interface Window {
    chatDataCache?: {
      chats: any[];
      timestamp: number;
    };
    chatRelatedDataCache?: {
      applications: any[];
      resumeApplications: any[];
      jobs: any[];
      users: any[];
      companies: any[];
      resumes: any[];
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

// Define allowed file types for uploads
const ALLOWED_FILE_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
};

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const initialScrollDone = useRef<boolean>(false);

  // Add user scroll tracking to prevent automatic scrolling when user is manually scrolling
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add these new state variables for scroll-to-bottom button
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  // Add state for total unread count
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Add state for emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Add state for pinned chats
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  // Add state for file uploads
  const [uploadedFiles, setUploadedFiles] = useState<
    { file: File; preview: string; type: string }[]
  >([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Load pinned chats from the server
  useEffect(() => {
    const fetchPinnedChats = async () => {
      if (!user) return;

      try {
        console.log("Fetching pinned chats for user:", user.id);
        const userPinnedChats = await pinnedChatsService.getByUserId(user.id);
        console.log("Received pinned chats:", userPinnedChats);

        // Преобразуем в массив строковых ID
        const pinnedChatIds = userPinnedChats.map((pc) => pc.chat.toString());
        setPinnedChats(pinnedChatIds);

        // Сохраняем в localStorage для резервного копирования
        localStorage.setItem("pinnedChats", JSON.stringify(pinnedChatIds));

        // Обновляем список чатов, чтобы отразить закрепленные статусы
        setChats((prevChats) => {
          if (!prevChats || prevChats.length === 0) return prevChats;

          return prevChats.map((chat) => ({
            ...chat,
            isPinned: pinnedChatIds.includes(chat.id.toString()),
          }));
        });
      } catch (error) {
        console.error("Error fetching pinned chats:", error);
        // Используем localStorage, если API не работает
        const savedPinnedChats = localStorage.getItem("pinnedChats");
        if (savedPinnedChats) {
          try {
            const pinnedChatIds = JSON.parse(savedPinnedChats);
            setPinnedChats(pinnedChatIds);

            // Обновляем список чатов, чтобы отразить закрепленные статусы из localStorage
            setChats((prevChats) => {
              if (!prevChats || prevChats.length === 0) return prevChats;

              return prevChats.map((chat) => ({
                ...chat,
                isPinned: pinnedChatIds.includes(chat.id.toString()),
              }));
            });
          } catch (e) {
            console.error("Error parsing pinned chats from localStorage:", e);
          }
        }
      }
    };

    fetchPinnedChats();
  }, [user]);

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

  // Handle pinning/unpinning chats
  const togglePinChat = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent chat selection when clicking pin

    if (!user) return;

    try {
      if (pinnedChats.includes(chatId)) {
        // Unpin the chat
        await pinnedChatsService.delete(user.id, chatId);
        setPinnedChats(pinnedChats.filter((id) => id !== chatId));

        // Update chat list immediately
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId ? { ...chat, isPinned: false } : chat
          )
        );
      } else {
        // Pin the chat, but limit to 3 pinned chats
        if (pinnedChats.length < 3) {
          await pinnedChatsService.create({
            user: Number.parseInt(user.id),
            chat: Number.parseInt(chatId),
          });
          setPinnedChats([...pinnedChats, chatId]);

          // Update chat list immediately
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === chatId ? { ...chat, isPinned: true } : chat
            )
          );
        } else {
          toast.error("You can only pin up to 3 chats. Unpin one first.");
        }
      }

      // Update localStorage as a backup
      localStorage.setItem(
        "pinnedChats",
        JSON.stringify(
          pinnedChats.includes(chatId)
            ? pinnedChats.filter((id) => id !== chatId)
            : pinnedChats.length < 3
            ? [...pinnedChats, chatId]
            : pinnedChats
        )
      );
    } catch (error) {
      console.error("Error toggling pinned chat:", error);
      toast.error("Failed to update pinned chats. Please try again.");
    }
  };

  // Handle file selection
  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: "document" | "image"
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((file) => {
      // Create preview for images
      let preview = "";
      if (ALLOWED_FILE_TYPES.images.includes(file.type)) {
        preview = URL.createObjectURL(file);
        console.log(`Created preview URL for image: ${preview}`);
      } else {
        // Use a generic file icon for documents
        preview = "/file-icon.png";
      }

      return {
        file,
        preview,
        type: fileType,
      };
    });

    console.log(`Added ${newFiles.length} files to upload queue`);
    setUploadedFiles([...uploadedFiles, ...newFiles]);

    // Reset the input
    event.target.value = "";
  };

  // Remove a file from the upload list
  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];

    // Revoke the object URL to prevent memory leaks
    if (newFiles[index].preview.startsWith("blob:")) {
      URL.revokeObjectURL(newFiles[index].preview);
    }

    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

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

        // Calculate total unread count from cached chats
        const totalUnread = window.chatDataCache.chats.reduce(
          (total, chat) => total + chat.unreadCount,
          0
        );
        setTotalUnreadCount(totalUnread);

        setIsLoading(false);
        return;
      }

      // Fetch data
      const allChats = await chatsService.getAll();
      console.log(`Fetched ${allChats.length} chats from API`);

      // If no chats or forcing refresh, fetch all related data
      // Otherwise, use cached related data when possible
      let allApplications,
        allResumeApplications,
        allJobs,
        allUsers,
        allCompanies,
        allResumes;

      if (
        !window.chatRelatedDataCache ||
        forceRefresh ||
        allChats.length !== window.chatRelatedDataCache.chatCount
      ) {
        allApplications = await applicationsService.getAll();
        allResumeApplications = await resumeApplicationsService.getAll();
        allJobs = await jobsApi.getAll();
        allUsers = await usersApi.getAll();
        allCompanies = await companiesApi.getAll();
        allResumes = await resumesApi.getAll();

        // Cache related data
        window.chatRelatedDataCache = {
          applications: allApplications,
          resumeApplications: allResumeApplications,
          jobs: allJobs,
          users: allUsers,
          companies: allCompanies,
          resumes: allResumes,
          chatCount: allChats.length,
          timestamp: now,
        };
      } else {
        // Use cached related data
        allApplications = window.chatRelatedDataCache.applications;
        allResumeApplications = window.chatRelatedDataCache.resumeApplications;
        allJobs = window.chatRelatedDataCache.jobs;
        allUsers = window.chatRelatedDataCache.users;
        allCompanies = window.chatRelatedDataCache.companies;
        allResumes = window.chatRelatedDataCache.resumes;
      }

      // Process chats based on user role
      const processedChats = [];
      let totalUnreadMessages = 0;

      for (const chat of allChats) {
        // Handle job application chats
        if (chat.application) {
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

          // Always fetch messages for unread count to ensure accuracy
          chatMessages = await messagesService.getByChatId(chat.id.toString());
          console.log(
            `Fetched ${chatMessages.length} messages for job application chat ${chat.id}`
          );

          // Cache messages for this chat
          if (!window.chatMessagesCache) window.chatMessagesCache = {};
          window.chatMessagesCache[chat.id] = {
            messages: chatMessages,
            timestamp: now,
          };

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
            totalUnreadMessages += unreadCount;
          }

          // Get company or applicant name and avatar
          let name = "";
          let avatarUrl = "";
          if (user.role === "student") {
            // For students, show the company name and avatar
            try {
              const companyId =
                typeof job.company === "number" ? job.company : job.company.id;
              const companyDetails = allCompanies.find(
                (c) => c.id === companyId
              );
              name = companyDetails?.name || "Company";

              // Get company user for avatar
              const companyUser = allUsers.find(
                (u) => u.id === (companyDetails?.user || job.company)
              );
              avatarUrl =
                companyUser?.avatar ||
                `https://ui-avatars.com/api/?name=${name.charAt(
                  0
                )}&background=10B981&color=fff`;
            } catch (error) {
              name = "Company";
              avatarUrl = `https://ui-avatars.com/api/?name=C&background=10B981&color=fff`;
            }
          } else {
            // For companies, show the applicant name and avatar
            const applicant = allUsers.find((u) => u.id === application.user);
            name = applicant
              ? `${applicant.first_name} ${applicant.last_name}`
              : "Applicant";
            avatarUrl =
              applicant?.avatar ||
              `https://ui-avatars.com/api/?name=${name.charAt(
                0
              )}&background=10B981&color=fff`;
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
            isPinned: pinnedChats.includes(chat.id.toString()),
            avatarUrl,
            isResumeChat: false,
          });
        }
        // Handle resume application chats
        else if (chat.resume_application) {
          try {
            // Get the resume application
            const resumeApplication = allResumeApplications.find(
              (app) => app.id === chat.resume_application
            );
            if (!resumeApplication) {
              console.error(
                `Resume application ${chat.resume_application} not found for chat ${chat.id}`
              );
              continue;
            }

            // Get the resume
            const resume = allResumes.find(
              (r) => r.id === resumeApplication.resume
            );
            if (!resume) {
              console.error(
                `Resume ${resumeApplication.resume} not found for resume application ${resumeApplication.id}`
              );
              continue;
            }

            let isRelevant = false;

            if (user.role === "student") {
              // For students, show chats where they are the resume owner
              isRelevant = resume.user === Number.parseInt(user.id);
              console.log(
                `Student check: resume.user=${resume.user}, user.id=${user.id}, isRelevant=${isRelevant}`
              );
            } else if (user.role === "company") {
              // For companies, show chats where they are the company that contacted the student
              const userCompany = allCompanies.find(
                (company) => company.user === Number.parseInt(user.id)
              );
              if (userCompany) {
                isRelevant = resumeApplication.company === userCompany.id;
                console.log(
                  `Company check: resumeApplication.company=${resumeApplication.company}, userCompany.id=${userCompany.id}, isRelevant=${isRelevant}`
                );
              }
            }

            // Debug logging
            console.log(
              `Processing resume chat ${chat.id}: isRelevant=${isRelevant}, user.role=${user.role}`
            );

            if (!isRelevant) {
              console.log(`Chat ${chat.id} not relevant for current user`);
              continue;
            }

            // Get messages for this chat
            let chatMessages;
            let lastMessage = null;
            let unreadCount = 0;

            chatMessages = await messagesService.getByChatId(
              chat.id.toString()
            );
            console.log(
              `Fetched ${chatMessages.length} messages for resume application chat ${chat.id}`
            );

            // Cache messages for this chat
            if (!window.chatMessagesCache) window.chatMessagesCache = {};
            window.chatMessagesCache[chat.id] = {
              messages: chatMessages,
              timestamp: now,
            };

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
              totalUnreadMessages += unreadCount;
            }

            // Get student or company name and avatar
            let name = "";
            let avatarUrl = "";

            if (user.role === "student") {
              // For students, show the company name and avatar
              const companyDetails = allCompanies.find(
                (c) => c.id === resumeApplication.company
              );
              name = companyDetails?.name || "Company";

              // Get company user for avatar
              const companyUser = allUsers.find(
                (u) =>
                  u.id === (companyDetails?.user || resumeApplication.company)
              );
              avatarUrl =
                companyUser?.avatar ||
                `https://ui-avatars.com/api/?name=${name.charAt(
                  0
                )}&background=10B981&color=fff`;
            } else {
              // For companies, show the student name and avatar
              const student = allUsers.find((u) => u.id === resume.user);
              name = student
                ? `${student.first_name} ${student.last_name}`
                : "Student";
              avatarUrl =
                student?.avatar ||
                `https://ui-avatars.com/api/?name=${name.charAt(
                  0
                )}&background=10B981&color=fff`;
            }

            processedChats.push({
              id: chat.id.toString(),
              companyName: name,
              jobTitle: resume.profession || "Resume", // Use profession as the "job title"
              lastMessage:
                lastMessage?.content || resumeApplication.message || "",
              timestamp: lastMessage?.created_at || chat.created_at,
              unreadCount,
              status: chat.status as "active" | "closed" | "blocked",
              resumeApplication,
              resume,
              isPinned: pinnedChats.includes(chat.id.toString()),
              avatarUrl,
              isResumeChat: true, // Flag to identify resume chats
            });
          } catch (error) {
            console.error("Error processing resume application chat:", error);
          }
        }
      }

      // Sort by pinned status first, then by timestamp
      processedChats.sort((a, b) => {
        // First sort by pinned status
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // Then sort by timestamp
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });

      // Cache the processed chats
      window.chatDataCache = {
        chats: processedChats,
        timestamp: now,
      };

      setChats(processedChats);
      setTotalUnreadCount(totalUnreadMessages);
      console.log(
        `Processed ${processedChats.length} relevant chats with ${totalUnreadMessages} unread messages`
      );

      // Force refresh the unread count in the header
      const event = new CustomEvent("unreadMessagesUpdated", {
        detail: { unreadCount: totalUnreadMessages },
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error fetching chats:", error);
      console.log(`Error fetching chats: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle scroll events in the messages container
  const handleMessagesScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    // Show/hide scroll button based on scroll position
    setShowScrollButton(!isNearBottom);

    // Set user scrolling state
    setIsUserScrolling(true);

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Reset user scrolling state after 1 second of inactivity
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
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

      // Add event listener for new chat creation
      const handleChatCreated = (event: CustomEvent) => {
        console.log("Chat created event received:", event.detail);
        fetchChats(true); // Force refresh when a new chat is created

        // If chatId is provided, select it
        if (event.detail?.chatId) {
          setSelectedChat(event.detail.chatId);
        }
      };

      window.addEventListener("focus", handleFocus);
      window.addEventListener(
        "chatCreated",
        handleChatCreated as EventListener
      );

      return () => {
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener(
          "chatCreated",
          handleChatCreated as EventListener
        );
      };
    }
  }, [user, location.pathname, selectedChat]);

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

      let otherUserDetails;

      // Handle job application chats
      if (chat.application) {
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
        otherUserDetails = await usersApi.getById(otherUserId);
      }
      // Handle resume application chats
      else if (chat.resume_application) {
        // Get resume application details
        const resumeApplication = await resumeApplicationsService.getById(
          chat.resume_application.toString()
        );

        // Get resume details
        const resume = await resumesApi.getById(
          resumeApplication.resume.toString()
        );

        // Get company or student details
        const isCompany = user.role === "company";
        const otherUserId = isCompany
          ? resume.user
          : await (async () => {
              const company = await companiesApi.getById(
                resumeApplication.company.toString()
              );
              return company.user;
            })();

        otherUserDetails = await usersApi.getById(otherUserId);
      }

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
      initialScrollDone.current = false;

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
      await chatsService.markAllAsRead(chatId, user.id);
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
      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) => {
          if (chat.id === chatId) {
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        });

        // Recalculate total unread count
        const newTotalUnread = updatedChats.reduce(
          (total, chat) => total + chat.unreadCount,
          0
        );
        setTotalUnreadCount(newTotalUnread);

        return updatedChats;
      });

      // Reset new message indicators
      setHasNewMessages(false);
      setNewMessageCount(0);

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
          setChats((prev) => {
            const updatedChats = prev.map((chat) =>
              chat.id === selectedChat ? { ...chat, unreadCount: 0 } : chat
            );

            // Recalculate total unread count
            const newTotalUnread = updatedChats.reduce(
              (total, chat) => total + chat.unreadCount,
              0
            );
            setTotalUnreadCount(newTotalUnread);

            return updatedChats;
          });

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

  // Check for new messages in the current chat
  const checkForNewChatMessages = async () => {
    if (!selectedChat || !user) return;

    try {
      const chatMessages = await messagesService.getByChatId(selectedChat);

      // Check if we have new messages in the current chat
      if (chatMessages.length > messages.length) {
        // Calculate how many new messages we have
        const newCount = chatMessages.length - messages.length;

        // Check if we're near the bottom before deciding to auto-scroll
        const isNearBottom = messagesContainerRef.current
          ? messagesContainerRef.current.scrollHeight -
              messagesContainerRef.current.scrollTop -
              messagesContainerRef.current.clientHeight <
            100
          : false;

        // Update the messages in state regardless
        await fetchMessages(true);

        // If user is scrolling/reading previous messages, don't auto-scroll
        if (isUserScrolling || !isNearBottom) {
          setNewMessageCount((prev) => prev + newCount);
          setHasNewMessages(true);
          setShowScrollButton(true);
        } else {
          // User is at the bottom and not scrolling, so mark as read
          markMessagesAsRead(selectedChat);
        }
      }
    } catch (error) {
      console.error("Error checking for new chat messages:", error);
      console.log(`Error checking for new chat messages: ${error}`);
    }
  };

  // Add a function to scroll to the bottom and reset new message indicators
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessages(false);
    setNewMessageCount(0);
    setShowScrollButton(false);

    // Mark messages as read when scrolling to bottom
    if (selectedChat) {
      markMessagesAsRead(selectedChat);
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    // Only auto-scroll in two cases:
    // 1. Initial load of messages
    // 2. When the user sends a new message themselves

    const isInitialLoad = !initialScrollDone.current && messages.length > 0;
    const isNewMessageFromCurrentUser =
      messages.length > 0 &&
      messages[messages.length - 1]?.senderId === user?.id;

    if (isInitialLoad) {
      // Initial load - scroll to bottom immediately
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        initialScrollDone.current = true;
      }, 100);
    } else if (isNewMessageFromCurrentUser && !isUserScrolling) {
      // User sent a message - scroll smoothly
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else if (messages.length > 0 && !isUserScrolling && !isInitialLoad) {
      // New message from other user - just show the scroll button
      setShowScrollButton(true);
    }
  }, [messages, user?.id]);

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
      let newTotalUnread = 0;

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
          newTotalUnread += unreadCount;
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
        setTotalUnreadCount(newTotalUnread);
      }

      if (hasNewMessages && !needsUpdate) {
        // If we have new messages but didn't update counts, do a full refresh
        fetchChats(true);
      }

      // Force refresh the unread count in the header
      const event = new CustomEvent("unreadMessagesUpdated", {
        detail: { unreadCount: newTotalUnread },
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error checking for new messages:", error);
      console.log(`Error checking for new messages: ${error}`);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emojiData: any) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Upload files to server
  const uploadFile = async (file: File): Promise<string> => {
    console.log(`Uploading file: ${file.name}, type: ${file.type}`);

    // В реальном приложении здесь должна быть загрузка на сервер
    // Для демонстрации используем временный URL
    return new Promise((resolve) => {
      // Simulate upload delay
      setTimeout(() => {
        // Для изображений используем data URL для гарантированного отображения
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log(`Created data URL for image: ${file.name}`);
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            console.error(`Failed to create data URL for: ${file.name}`);
            resolve(`https://example.com/uploads/${file.name}`);
          };
          reader.readAsDataURL(file);
        } else {
          // Для других файлов используем обычный URL
          resolve(`https://example.com/uploads/${file.name}`);
        }
      }, 500);
    });
  };

  const generateCoverLetter = async (application: any, job: any) => {
    if (!selectedChat || !user) return;

    try {
      // Get user's resume for context
      const userResumes = await resumesApi.getByUserId(user.id);
      const latestResume = userResumes[0]; // Get the most recent resume

      // Generate cover letter content
      const coverLetterContent = `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${
        job.company?.name || "your company"
      }. 

${
  latestResume
    ? `With my background in ${
        latestResume.profession || "the field"
      } and experience in ${
        latestResume.specialization || "relevant technologies"
      }, I am confident that I would be a valuable addition to your team.`
    : "I am excited about the opportunity to contribute to your team."
}

Key qualifications I bring:
${
  latestResume?.skills
    ? Object.entries(latestResume.skills)
        .map(([skill, level]) => `• ${skill}: ${level}`)
        .join("\n")
    : "• Strong technical skills\n• Problem-solving abilities\n• Team collaboration"
}

${
  latestResume?.experience
    ? `My experience includes: ${latestResume.experience}`
    : "I am eager to apply my skills and learn new technologies in this role."
}

I would welcome the opportunity to discuss how my background and enthusiasm can contribute to your team's success.

Thank you for your consideration.

Best regards,
${user.first_name} ${user.last_name}`;

      // Create cover letter message
      const messageData = {
        chat: Number.parseInt(selectedChat),
        sender: Number.parseInt(user.id),
        content: coverLetterContent,
        message_type: "coverLetter",
        metadata: {
          applicationId: application.id,
          jobId: job.id,
          resumeId: latestResume?.id,
        },
        read: false,
      };

      // Add message to state immediately
      const tempId = `temp-cover-${Date.now()}`;
      const tempMessage = {
        id: tempId,
        senderId: user.id,
        content: coverLetterContent,
        type: "coverLetter",
        metadata: messageData.metadata,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Send to server
      const createdMessage = await messagesService.create(messageData);

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                id: createdMessage.id.toString(),
                timestamp: createdMessage.created_at,
              }
            : msg
        )
      );

      // Update application with cover letter
      await applicationsService.update(application.id.toString(), {
        cover_letter: coverLetterContent,
      });

      toast.success("Cover letter generated and sent!");
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast.error("Failed to generate cover letter. Please try again.");
      // Remove temp message on error
      setMessages((prev) =>
        prev.filter((msg) => !msg.id.startsWith("temp-cover-"))
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!newMessage.trim() && uploadedFiles.length === 0) ||
      !selectedChat ||
      !user
    )
      return;

    try {
      // Handle file uploads first if any
      const filePromises = uploadedFiles.map(async (fileObj) => {
        const fileUrl = await uploadFile(fileObj.file);

        // Create message data for each file
        return {
          chat: Number.parseInt(selectedChat),
          sender: Number.parseInt(user.id),
          content: fileObj.file.name,
          message_type: ALLOWED_FILE_TYPES.images.includes(fileObj.file.type)
            ? "image"
            : "document",
          metadata: {
            fileUrl,
            fileName: fileObj.file.name,
            fileType: fileObj.file.type,
            fileSize: fileObj.file.size,
          },
          read: false,
        };
      });

      // Send text message if there is any
      if (newMessage.trim()) {
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

        // Actually send the message to the server
        const createdMessage = await messagesService.create(messageData);
        console.log(`Created new text message with ID ${createdMessage.id}`);

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
      }

      // Process file messages
      if (filePromises.length > 0) {
        // Add temporary file messages to state for better UX
        const tempFileMessages = uploadedFiles.map((fileObj, index) => ({
          id: `temp-file-${Date.now()}-${index}`,
          senderId: user.id,
          content: fileObj.file.name,
          type: ALLOWED_FILE_TYPES.images.includes(fileObj.file.type)
            ? "image"
            : "document",
          metadata: {
            fileUrl: fileObj.preview,
            fileName: fileObj.file.name,
            fileType: fileObj.file.type,
            fileSize: fileObj.file.size,
          },
          timestamp: new Date().toISOString(),
          read: false,
        }));

        setMessages((prev) => [...prev, ...tempFileMessages]);

        // Send all file messages to server
        const fileMessageResults = await Promise.all(
          filePromises.map(async (fileData) => {
            return messagesService.create(await fileData);
          })
        );

        console.log(`Created ${fileMessageResults.length} file messages`);

        // Clear uploaded files
        setUploadedFiles([]);
      }

      // Scroll to bottom only when user sends a message
      setTimeout(() => {
        // Only force scroll to bottom when user sends a message
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // Update cache
      if (
        window.messagesCache &&
        window.messagesCache[`messages_${selectedChat}`]
      ) {
        window.messagesCache[`messages_${selectedChat}`].messages = messages;
        window.messagesCache[`messages_${selectedChat}`].timestamp = Date.now();
      }

      // Update the chat list to show the latest message
      fetchChats(true);
    } catch (error) {
      console.error("Error sending message:", error);
      console.log(`Error sending message: ${error}`);
      // Remove the temporary message if sending failed
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
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

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
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

  // Добавить эту функцию перед функцией renderMessageContent
  const fixFileUrl = (url: string): string => {
    if (!url) return "/placeholder.svg";

    // If URL is already absolute or a data URL, return as is
    if (
      url.startsWith("http") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    ) {
      return url;
    }

    // Otherwise add the base URL from the API service
    const baseUrl = chatsService.getBaseUrl() || "";
    return baseUrl + (url.startsWith("/") ? url : "/" + url);
  };

  const renderMessageContent = (message: any) => {
    // Проверяем, является ли URL относительным или абсолютным
    if (message.type === "image" && message.metadata?.fileUrl) {
      // Use the fixFileUrl function to handle the URL properly
      const imageUrl = fixFileUrl(message.metadata.fileUrl);

      console.log(`Rendering image with URL: ${imageUrl}`);

      return (
        <div className="mb-2">
          <div className="relative group">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={message.metadata.fileName || "Image"}
              className="rounded-md max-w-full max-h-64 object-contain cursor-pointer"
              onClick={() => {
                // Open image in new tab when clicked
                window.open(imageUrl, "_blank");
              }}
              onError={(e) => {
                console.error(`Failed to load image: ${imageUrl}`);
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
              <button
                className="opacity-0 group-hover:opacity-100 p-2 bg-gray-900 bg-opacity-70 rounded-full transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(imageUrl, "_blank");
                }}
              >
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      );
    } else if (message.type === "document" && message.metadata?.fileUrl) {
      // Use the fixFileUrl function to handle the URL properly
      const fileUrl = fixFileUrl(message.metadata.fileUrl);
      const fileName = message.metadata.fileName || "Document";
      const fileType = message.metadata.fileType || "";

      // Determine file icon based on type
      const FileIcon = File;
      let iconColor = "text-emerald-400";

      if (fileType.includes("pdf")) {
        iconColor = "text-red-400";
      } else if (
        fileType.includes("word") ||
        fileName.endsWith(".doc") ||
        fileName.endsWith(".docx")
      ) {
        iconColor = "text-blue-400";
      } else if (
        fileType.includes("excel") ||
        fileName.endsWith(".xls") ||
        fileName.endsWith(".xlsx")
      ) {
        iconColor = "text-green-400";
      }

      return (
        <div className="flex flex-col mb-3">
          <div className="flex items-center gap-2 bg-gray-800/30 p-3 rounded-lg hover:bg-gray-700/30 transition-colors">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700/50 ${iconColor}`}
            >
              <File className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <span className="block truncate text-sm font-medium">
                {fileName}
              </span>
              {message.metadata.fileSize && (
                <span className="text-xs text-gray-400">
                  {(message.metadata.fileSize / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
            <button
              className="p-2 bg-gray-700/50 hover:bg-emerald-500/30 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();

                try {
                  // Create a download link element
                  const a = document.createElement("a");
                  a.href = fileUrl;
                  a.download = fileName;
                  a.target = "_blank";
                  document.body.appendChild(a);
                  a.click();

                  // Clean up
                  setTimeout(() => {
                    document.body.removeChild(a);
                  }, 100);

                  toast.success("File download started");
                } catch (error) {
                  console.error("Download failed:", error);
                  toast.error("Error downloading file");
                  // Fallback to opening in new tab
                  window.open(fileUrl, "_blank");
                }
              }}
            >
              <Download className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-1 ml-1">
            Click to download
          </div>
        </div>
      );
    } else if (message.type === "resume") {
      return (
        <div className="flex items-center justify-between gap-2 mb-2 bg-gray-800/30 p-2 rounded">
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
      );
    } else if (message.type === "coverLetter") {
      return (
        <div className="border border-gray-800/30 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 bg-gray-800/30 p-3 border-b border-gray-800/20">
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium truncate">
              {t("chat.messages.coverLetter")}
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm p-4 bg-gray-900/10">
            {message.content}
          </div>
        </div>
      );
    } else if (message.type === "jobOffer") {
      return (
        <div className="flex items-center gap-2 mb-2 bg-gray-800/30 p-2 rounded">
          <Briefcase className="w-5 h-5" />
          <span>{t("chat.messages.jobOffer")}</span>
        </div>
      );
    }

    return <p className="leading-relaxed break-words">{message.content}</p>;
  };

  // Auto-scroll when messages change - only for user sent messages
  useEffect(() => {
    // Предотвращает сброс состояния прокрутки пользователя
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      // Устанавливаем флаг прокрутки пользователем
      setIsUserScrolling(true);
    };

    messagesContainer.addEventListener("scroll", handleScroll);

    return () => {
      messagesContainer.removeEventListener("scroll", handleScroll);
    };
  }, [messagesContainerRef.current]);

  // Добавить useEffect для сохранения состояния прокрутки пользователя:

  const filteredChats = chats.filter(
    (chat) =>
      chat.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return null;
  }

  // Group messages by date for rendering
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div
      className="fixed inset-0 pt-20 bg-gray-900 flex"
      onClick={() => {
        // Ensure polling is active when user interacts with the chat page
        if (!chatUpdateIntervalRef.current) {
          startPolling();
        }

        // Close emoji picker when clicking outside
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
        }
      }}
    >
      {/* Chat List */}
      <div className="w-96 border-r border-gray-700 bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder={t("chat.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className={`p-4 hover:bg-gray-800 cursor-pointer transition-colors ${
                  selectedChat === chat.id ? "bg-gray-800" : ""
                } ${chat.isPinned ? "border-l-4 border-emerald-500" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold overflow-hidden">
                      {chat.avatarUrl ? (
                        <img
                          src={chat.avatarUrl || "/placeholder.svg"}
                          alt={chat.companyName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (
                              e.target as HTMLImageElement
                            ).src = `https://ui-avatars.com/api/?name=${chat.companyName.charAt(
                              0
                            )}&background=FF4500&color=fff`;
                          }}
                        />
                      ) : (
                        <span>{chat.companyName.charAt(0)}</span>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        {chat.companyName}
                        {user?.role === "student" ? (
                          <Briefcase
                            className="w-4 h-4 text-blue-400"
                            title="Company"
                          />
                        ) : (
                          <GraduationCap
                            className="w-4 h-4 text-emerald-400"
                            title="Student"
                          />
                        )}
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
                  <button
                    onClick={(e) => togglePinChat(chat.id, e)}
                    className={`p-1 rounded-full ${
                      chat.isPinned
                        ? "text-emerald-500 hover:text-emerald-400"
                        : "text-gray-500 hover:text-gray-400"
                    } transition-colors`}
                    title={chat.isPinned ? "Unpin chat" : "Pin chat"}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
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
        <div className="flex-1 flex flex-col bg-gray-900">
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
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold overflow-hidden">
                  {chats.find((c) => c.id === selectedChat)?.avatarUrl ? (
                    <img
                      src={
                        chats.find((c) => c.id === selectedChat)?.avatarUrl ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt={
                        chats.find((c) => c.id === selectedChat)?.companyName
                      }
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const chatName =
                          chats.find((c) => c.id === selectedChat)
                            ?.companyName || "User";
                        (
                          e.target as HTMLImageElement
                        ).src = `https://ui-avatars.com/api/?name=${chatName.charAt(
                          0
                        )}&background=FF4500&color=fff`;
                      }}
                    />
                  ) : (
                    <span>
                      {chats
                        .find((c) => c.id === selectedChat)
                        ?.companyName.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    {chats.find((c) => c.id === selectedChat)?.companyName}
                    {user?.role === "student" ? (
                      <Briefcase
                        className="w-4 h-4 text-blue-400"
                        title="Company"
                      />
                    ) : (
                      <GraduationCap
                        className="w-4 h-4 text-emerald-400"
                        title="Student"
                      />
                    )}
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
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 messages-container bg-gradient-to-b from-gray-900 to-gray-800"
            onScroll={handleMessagesScroll}
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : groupedMessages.length > 0 ? (
              groupedMessages.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full flex items-center shadow-md">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(group.messages[0].timestamp)}
                    </div>
                  </div>

                  {group.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === user?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 shadow-md ${
                          message.senderId === user?.id
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-800 text-white"
                        }`}
                      >
                        {renderMessageContent(message)}
                        <div className="flex justify-between items-center mt-1 gap-2">
                          <span className="text-xs opacity-75 block">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.senderId === user?.id && (
                            <div className="text-lg">
                              {message.read ? (
                                <div className="text-gray-900" title="Read">
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
                  ))}
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

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <div
              className="fixed bottom-24 right-8 bg-gray-900 text-white rounded-full p-3 shadow-lg cursor-pointer z-10 hover:bg-emerald-600 transition-colors"
              onClick={scrollToBottom}
            >
              <ArrowDown className="w-5 h-5 text-white" />
            </div>
          )}

          {/* File preview area */}
          {uploadedFiles.length > 0 && (
            <div className="p-2 border-t border-gray-700 bg-gray-800 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  {ALLOWED_FILE_TYPES.images.includes(file.file.type) ? (
                    <div className="w-16 h-16 rounded overflow-hidden">
                      <img
                        src={file.preview || "/placeholder.svg"}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded bg-gray-700 flex flex-col items-center justify-center p-1">
                      <File className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400 truncate w-full text-center">
                        {file.file.name.substring(0, 10)}...
                      </span>
                    </div>
                  )}
                  <button
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

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
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e, "document")}
                  className="hidden"
                  accept={ALLOWED_FILE_TYPES.documents.join(",")}
                  multiple
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-emerald-400 transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={(e) => handleFileSelect(e, "image")}
                  className="hidden"
                  accept={ALLOWED_FILE_TYPES.images.join(",")}
                  multiple
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-emerald-400 transition-colors"
                  title="Add image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className="p-2 text-gray-400 hover:text-emerald-400 transition-colors"
                    title="Add emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {showEmojiPicker && (
                    <div
                      className="absolute bottom-12 left-0 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t("chat.input.placeholder")}
                  className="flex-grow px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t("chat.input.send")}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-gray-400 bg-gradient-to-b from-gray-900 to-gray-800">
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

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default Chat;
