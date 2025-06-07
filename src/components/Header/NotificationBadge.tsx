"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import messagesService from "../../services/messagesService";
import chatsService from "../../services/chatsService";
import notificationsService from "../../services/notificationsService";

interface NotificationBadgeProps {
  onClick?: () => void;
}

const NotificationBadge = ({ onClick }: NotificationBadgeProps) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!user) return;

      try {
        try {
          const notificationsEndpointExists =
            await notificationsService.endpointExists();
          if (notificationsEndpointExists) {
            const unreadNotifications =
              await notificationsService.getUnreadCount(user.id);
            setUnreadCount(unreadNotifications);
            return;
          }
        } catch (error) {
          console.log(
            "Notifications service not available, falling back to message counting"
          );
        }

        try {
          const response = await fetch(
            `${chatsService.getBaseUrl()}/chats/unread_count/?user_id=${
              user.id
            }`
          );
          if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.unread_count);
            return;
          }
        } catch (error) {
          console.log(
            "Chat unread_count endpoint not available, falling back to manual counting"
          );
        }

        const allChats = await chatsService.getAll();
        let totalUnread = 0;

        for (const chat of allChats) {
          const chatMessages = await messagesService.getByChatId(
            chat.id.toString()
          );
          const unreadMessages = chatMessages.filter(
            (msg) => !msg.read && msg.sender !== Number.parseInt(user.id)
          );
          totalUnread += unreadMessages.length;
        }

        setUnreadCount(totalUnread);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    };

    fetchUnreadMessages();

    const interval = setInterval(fetchUnreadMessages, 2000);

    const handleUnreadMessagesUpdated = () => {
      fetchUnreadMessages();
    };
    window.addEventListener(
      "unreadMessagesUpdated",
      handleUnreadMessagesUpdated
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "unreadMessagesUpdated",
        handleUnreadMessagesUpdated
      );
    };
  }, [user]);

  return (
    <div className="relative" onClick={onClick}>
      <Bell className="w-6 h-6 text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
          {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;
