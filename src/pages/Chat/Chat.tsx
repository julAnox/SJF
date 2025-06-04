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
  Bell,
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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  const [uploadedFiles, setUploadedFiles] = useState<
    { file: File; preview: string; type: string }[]
  >([]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  /*
useEffect(() => {
  const fetchPinnedChats = async () => {
    if (!user) return

    try {
      const userPinnedChats = await pinnedChatsService.getByUserId(user.id)
      const pinnedChatIds = userPinnedChats.map((pc) => pc.chat.toString())
      setPinnedChats(pinnedChatIds)
      localStorage.setItem("pinnedChats", JSON.stringify(pinnedChatIds))
    } catch (error) {
      console.error("Error fetching pinned chats:", error)
      const savedPinnedChats = localStorage.getItem("pinnedChats")
      if (savedPinnedChats) {
        try {
          const pinnedChatIds = JSON.parse(savedPinnedChats)
          setPinnedChats(pinnedChatIds)
        } catch (e) {
          console.error("Error parsing pinned chats from localStorage:", e)
        }
      }
    }
  }

  fetchPinnedChats()
}, [user])
*/

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageActive.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopPolling();
    };
  }, []);

  const togglePinChat = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!user) return;

    try {
      if (pinnedChats.includes(chatId)) {
        await pinnedChatsService.delete(user.id, chatId);
        setPinnedChats(pinnedChats.filter((id) => id !== chatId));
      } else {
        if (pinnedChats.length < 3) {
          await pinnedChatsService.create({
            user: Number.parseInt(user.id),
            chat: Number.parseInt(chatId),
          });
          setPinnedChats([...pinnedChats, chatId]);
        } else {
          toast.error("You can only pin up to 3 chats. Unpin one first.");
        }
      }

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

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: "document" | "image"
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((file) => {
      let preview = "";
      if (ALLOWED_FILE_TYPES.images.includes(file.type)) {
        preview = URL.createObjectURL(file);
      } else {
        preview = "/file-icon.png";
      }

      return {
        file,
        preview,
        type: fileType,
      };
    });

    setUploadedFiles([...uploadedFiles, ...newFiles]);
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];

    if (newFiles[index].preview.startsWith("blob:")) {
      URL.revokeObjectURL(newFiles[index].preview);
    }

    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  const clearAllCaches = () => {
    messagesService.clearCache();

    if (typeof window !== "undefined") {
      delete window.chatDataCache;
      delete window.chatRelatedDataCache;
      delete window.chatMessagesCache;
      delete window.messagesCache;
    }
  };

  const fetchChats = async () => {
    if (!user) return;

    try {
      console.log(
        `[${new Date().toISOString()}] 🔄 Fetching fresh chats data...`
      );

      clearAllCaches();

      // Получаем все данные заново
      const allChats = await chatsService.getAll();
      const allApplications = await applicationsService.getAll();
      const allResumeApplications = await resumeApplicationsService.getAll();
      const allJobs = await jobsApi.getAll();
      const allUsers = await usersApi.getAll();
      const allCompanies = await companiesApi.getAll();
      const allResumes = await resumesApi.getAll();

      console.log(
        `[${new Date().toISOString()}] 📊 Got ${
          allChats.length
        } chats from server`
      );

      const processedChats = [];
      let totalUnreadMessages = 0;

      for (const chat of allChats) {
        if (chat.application) {
          const application = allApplications.find(
            (app) => app.id === chat.application
          );
          if (!application) continue;

          const job = allJobs.find((j) => j.id === application.job);
          if (!job) continue;

          let isRelevant = false;

          if (user.role === "student") {
            isRelevant = application.user === Number.parseInt(user.id);
          } else if (user.role === "company") {
            const userCompany = allCompanies.find(
              (company) => company.user === Number.parseInt(user.id)
            );

            if (userCompany) {
              isRelevant =
                typeof job.company === "number"
                  ? job.company === userCompany.id
                  : job.company.id === userCompany.id;
            } else {
              isRelevant =
                typeof job.company === "number"
                  ? job.company === Number.parseInt(user.id)
                  : job.company.id === Number.parseInt(user.id);
            }
          }

          if (!isRelevant) continue;

          // Получаем сообщения для каждого чата заново
          const chatMessages = await messagesService.getByChatId(
            chat.id.toString()
          );
          const lastMessage =
            chatMessages.length > 0
              ? chatMessages[chatMessages.length - 1]
              : null;

          const isChatOpen = selectedChat === chat.id.toString();
          let unreadCount = 0;

          if (!isChatOpen) {
            unreadCount = chatMessages.filter(
              (msg) => !msg.read && msg.sender !== Number.parseInt(user.id)
            ).length;
            totalUnreadMessages += unreadCount;
          }

          let name = "";
          let avatarUrl = "";
          if (user.role === "student") {
            try {
              const companyId =
                typeof job.company === "number" ? job.company : job.company.id;
              const companyDetails = allCompanies.find(
                (c) => c.id === companyId
              );
              name = companyDetails?.name || "Company";

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
        } else if (chat.resume_application) {
          try {
            const resumeApplication = allResumeApplications.find(
              (app) => app.id === chat.resume_application
            );
            if (!resumeApplication) continue;

            const resume = allResumes.find(
              (r) => r.id === resumeApplication.resume
            );
            if (!resume) continue;

            let isRelevant = false;

            if (user.role === "student") {
              isRelevant = resume.user === Number.parseInt(user.id);
            } else if (user.role === "company") {
              const userCompany = allCompanies.find(
                (company) => company.user === Number.parseInt(user.id)
              );
              if (userCompany) {
                isRelevant = resumeApplication.company === userCompany.id;
              }
            }

            if (!isRelevant) continue;

            const chatMessages = await messagesService.getByChatId(
              chat.id.toString()
            );
            const lastMessage =
              chatMessages.length > 0
                ? chatMessages[chatMessages.length - 1]
                : null;

            const isChatOpen = selectedChat === chat.id.toString();
            let unreadCount = 0;

            if (!isChatOpen) {
              unreadCount = chatMessages.filter(
                (msg) => !msg.read && msg.sender !== Number.parseInt(user.id)
              ).length;
              totalUnreadMessages += unreadCount;
            }

            let name = "";
            let avatarUrl = "";

            if (user.role === "student") {
              const companyDetails = allCompanies.find(
                (c) => c.id === resumeApplication.company
              );
              name = companyDetails?.name || "Company";

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
              jobTitle: resume.profession || "Resume",
              lastMessage:
                lastMessage?.content || resumeApplication.message || "",
              timestamp: lastMessage?.created_at || chat.created_at,
              unreadCount,
              status: chat.status as "active" | "closed" | "blocked",
              resumeApplication,
              resume,
              isPinned: pinnedChats.includes(chat.id.toString()),
              avatarUrl,
              isResumeChat: true,
            });
          } catch (error) {
            console.error("Error processing resume application chat:", error);
          }
        }
      }

      processedChats.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });

      setChats(processedChats);

      try {
        const userPinnedChats = await pinnedChatsService.getByUserId(user.id);
        const pinnedChatIds = userPinnedChats.map((pc) => pc.chat.toString());

        // Обновляем состояние только если изменилось
        if (JSON.stringify(pinnedChatIds) !== JSON.stringify(pinnedChats)) {
          setPinnedChats(pinnedChatIds);
          localStorage.setItem("pinnedChats", JSON.stringify(pinnedChatIds));
          console.log(
            `[${new Date().toISOString()}] 📌 Updated pinned chats:`,
            pinnedChatIds
          );
        }

        const updatedChatsWithPins = processedChats.map((chat) => ({
          ...chat,
          isPinned: pinnedChatIds.includes(chat.id.toString()),
        }));

        updatedChatsWithPins.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });

        setChats(updatedChatsWithPins);
      } catch (error) {
        console.error("Error updating pinned chats:", error);
        // Используем локальные данные как fallback
        const savedPinnedChats = localStorage.getItem("pinnedChats");
        if (savedPinnedChats) {
          try {
            const pinnedChatIds = JSON.parse(savedPinnedChats);
            const updatedChatsWithPins = processedChats.map((chat) => ({
              ...chat,
              isPinned: pinnedChatIds.includes(chat.id.toString()),
            }));

            updatedChatsWithPins.sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return (
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
              );
            });

            setChats(updatedChatsWithPins);
          } catch (e) {
            console.error("Error parsing saved pinned chats:", e);
            setChats(processedChats);
          }
        } else {
          setChats(processedChats);
        }
      }

      setTotalUnreadCount(totalUnreadMessages);

      console.log(
        `[${new Date().toISOString()}] ✅ Updated ${
          processedChats.length
        } chats, ${totalUnreadMessages} unread`
      );

      const event = new CustomEvent("unreadMessagesUpdated", {
        detail: { unreadCount: totalUnreadMessages },
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("❌ Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat || !user) return;

    try {
      console.log(
        `[${new Date().toISOString()}] 💬 Fetching fresh messages for chat ${selectedChat}`
      );

      messagesService.clearCache();

      const chat = await chatsService.getById(selectedChat);
      setChatStatus(chat.status as "active" | "closed" | "blocked");

      let otherUserDetails;

      if (chat.application) {
        const application = await applicationsService.getById(
          chat.application.toString()
        );
        const job = await jobsApi.getById(application.job.toString());

        const isCompany = user.role === "company";
        const otherUserId = isCompany
          ? application.user
          : typeof job.company === "number"
          ? job.company
          : job.company.id;
        otherUserDetails = await usersApi.getById(otherUserId);
      } else if (chat.resume_application) {
        const resumeApplication = await resumeApplicationsService.getById(
          chat.resume_application.toString()
        );
        const resume = await resumesApi.getById(
          resumeApplication.resume.toString()
        );

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

      const chatMessages = await messagesService.getByChatId(selectedChat);
      console.log(
        `[${new Date().toISOString()}] 📨 Got ${
          chatMessages.length
        } messages for chat ${selectedChat}`
      );

      const transformedMessages = chatMessages.map((msg) => ({
        id: msg.id.toString(),
        senderId: msg.sender.toString(),
        content: msg.content,
        type: msg.message_type,
        metadata: msg.metadata,
        timestamp: msg.created_at,
        read: msg.read,
      }));

      if (transformedMessages.length !== messages.length) {
        console.log(
          `[${new Date().toISOString()}] 🆕 Messages count changed: ${
            messages.length
          } -> ${transformedMessages.length}`
        );
        setMessages(transformedMessages);

        setTimeout(() => {
          if (!isUserScrolling) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        const hasChanges = transformedMessages.some((newMsg, index) => {
          const oldMsg = messages[index];
          return (
            !oldMsg ||
            oldMsg.read !== newMsg.read ||
            oldMsg.content !== newMsg.content
          );
        });

        if (hasChanges) {
          console.log(
            `[${new Date().toISOString()}] 🔄 Messages content changed, updating...`
          );
          setMessages(transformedMessages);
        }
      }

      await markMessagesAsRead(selectedChat);
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async (chatId: string) => {
    if (!user || markingInProgress.current) return;

    try {
      markingInProgress.current = true;
      await chatsService.markAllAsRead(chatId, user.id);
      hasMarkedMessagesAsRead.current = true;

      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.senderId !== user.id && !msg.read) {
            return { ...msg, read: true };
          }
          return msg;
        })
      );

      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) => {
          if (chat.id === chatId) {
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        });

        const newTotalUnread = updatedChats.reduce(
          (total, chat) => total + chat.unreadCount,
          0
        );
        setTotalUnreadCount(newTotalUnread);

        return updatedChats;
      });

      const event = new CustomEvent("unreadMessagesUpdated");
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    } finally {
      markingInProgress.current = false;
    }
  };

  const handleMessagesScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShowScrollButton(!isNearBottom);

    setIsUserScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessages(false);
    setNewMessageCount(0);
    setShowScrollButton(false);

    if (selectedChat) {
      markMessagesAsRead(selectedChat);
    }
  };

  const startPolling = () => {
    console.log(`[${new Date().toISOString()}] 🚀 Starting fresh polling...`);
    stopPolling();

    if (location.pathname.includes("/chat")) {
      fetchChats();
      if (selectedChat) {
        fetchMessages();
      }

      pollingIntervalRef.current = setInterval(() => {
        if (isPageActive.current && document.hasFocus()) {
          console.log(`[${new Date().toISOString()}] 🔄 Polling update...`);
          fetchChats();
          if (selectedChat) {
            fetchMessages();
          }
        }
      }, 2000);

      console.log(`[${new Date().toISOString()}] ✅ Polling started`);
    }
  };

  const stopPolling = () => {
    console.log(`[${new Date().toISOString()}] ⏹️ Stopping polling...`);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (user && location.pathname.includes("/chat")) {
      startPolling();

      return () => {
        stopPolling();
      };
    }
  }, [user, location.pathname, selectedChat]);

  useEffect(() => {
    if (selectedChat) {
      setIsLoading(true);
      hasMarkedMessagesAsRead.current = false;
      initialScrollDone.current = false;

      fetchMessages().finally(() => {
        setIsLoading(false);
      });
    }
  }, [selectedChat, user]);

  useEffect(() => {
    const isInitialLoad = !initialScrollDone.current && messages.length > 0;
    const isNewMessageFromCurrentUser =
      messages.length > 0 &&
      messages[messages.length - 1]?.senderId === user?.id;

    if (isInitialLoad) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        initialScrollDone.current = true;
      }, 100);
    } else if (isNewMessageFromCurrentUser && !isUserScrolling) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, user?.id]);

  useEffect(() => {
    if (selectedChat) {
      navigate(`/chat/${selectedChat}`);
    } else {
      navigate("/chat");
    }
  }, [selectedChat, navigate]);

  useEffect(() => {
    if (chatId) {
      setSelectedChat(chatId);
    }
  }, [chatId]);

  const handleEmojiSelect = (emojiData: any) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            resolve(`https://example.com/uploads/${file.name}`);
          };
          reader.readAsDataURL(file);
        } else {
          resolve(`https://example.com/uploads/${file.name}`);
        }
      }, 500);
    });
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
      const filePromises = uploadedFiles.map(async (fileObj) => {
        const fileUrl = await uploadFile(fileObj.file);

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

      if (newMessage.trim()) {
        const messageData = {
          chat: Number.parseInt(selectedChat),
          sender: Number.parseInt(user.id),
          content: newMessage,
          message_type: "text",
          read: false,
        };

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

        clearAllCaches();

        const createdMessage = await messagesService.create(messageData);

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

      if (filePromises.length > 0) {
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

        clearAllCaches();

        await Promise.all(
          filePromises.map(async (fileData) => {
            return messagesService.create(await fileData);
          })
        );

        setUploadedFiles([]);
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      setTimeout(() => {
        clearAllCaches();
        fetchChats();
      }, 500);
    } catch (error) {
      console.error("Error sending message:", error);
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
            await messagesService.deleteAllInChat(selectedChat);
            await chatsService.delete(selectedChat);
            toast.success("Chat deleted successfully");
            setSelectedChat(null);
            clearAllCaches();
            fetchChats();
          }
          break;
        case "clear":
          if (window.confirm(t("chat.settings.confirmClear"))) {
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
    }
  };

  const fixFileUrl = (url: string): string => {
    if (!url) return "/placeholder.svg";

    if (
      url.startsWith("http") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    ) {
      return url;
    }

    const baseUrl = chatsService.getBaseUrl() || "";
    return baseUrl + (url.startsWith("/") ? url : "/" + url);
  };

  const renderMessageContent = (message: any) => {
    if (message.type === "notification") {
      return (
        <div className="flex items-center gap-2 p-3 bg-blue-600/20 border border-blue-600/30 rounded-lg">
          <Bell className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <span className="text-blue-300 font-medium">{message.content}</span>
        </div>
      );
    }

    const currentChat = chats.find((c) => c.id === selectedChat);
    const isResumeChat = currentChat?.isResumeChat;

    if (message.type === "text" && isResumeChat) {
      const isFromCurrentUser = message.senderId === user?.id;

      if (isFromCurrentUser && user?.role === "company") {
        return (
          <div className="space-y-2">
            <div className="text-sm text-emerald-200 font-medium flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              Вы отправили отклик на резюме: {currentChat?.jobTitle || "Резюме"}
            </div>
            <div className="bg-emerald-700/30 rounded-lg p-3 border-l-4 border-emerald-500">
              <p className="leading-relaxed break-words">{message.content}</p>
            </div>
          </div>
        );
      } else if (!isFromCurrentUser && user?.role === "student") {
        return (
          <div className="space-y-2">
            <div className="text-sm text-blue-200 font-medium flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              На ваше резюме откликнулись:{" "}
              {currentChat?.companyName || "Компания"}
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3 border-l-4 border-blue-500">
              <p className="leading-relaxed break-words">{message.content}</p>
            </div>
          </div>
        );
      }
    }

    if (message.type === "image" && message.metadata?.fileUrl) {
      const imageUrl = fixFileUrl(message.metadata.fileUrl);

      return (
        <div className="mb-2">
          <div className="relative group">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={message.metadata.fileName || "Image"}
              className="rounded-md max-w-full max-h-64 object-contain cursor-pointer"
              onClick={() => {
                window.open(imageUrl, "_blank");
              }}
              onError={(e) => {
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
      const fileUrl = fixFileUrl(message.metadata.fileUrl);
      const fileName = message.metadata.fileName || "Document";
      const fileType = message.metadata.fileType || "";

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
                  const a = document.createElement("a");
                  a.href = fileUrl;
                  a.download = fileName;
                  a.target = "_blank";
                  document.body.appendChild(a);
                  a.click();

                  setTimeout(() => {
                    document.body.removeChild(a);
                  }, 100);

                  toast.success("File download started");
                } catch (error) {
                  console.error("Download failed:", error);
                  toast.error("Error downloading file");
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

  const filteredChats = chats.filter(
    (chat) =>
      chat.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return null;
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div
      className="fixed inset-0 pt-20 bg-gray-900 flex"
      onClick={() => {
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
                          message.type === "notification"
                            ? "bg-transparent p-0 max-w-[90%]"
                            : message.senderId === user?.id
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-800 text-white"
                        }`}
                      >
                        {renderMessageContent(message)}
                        {message.type !== "notification" && (
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
                        )}
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
            toast.success(`Contact shared to chat`);
          }
        }}
        chats={shareableChats}
      />
    </div>
  );
};

export default Chat;
