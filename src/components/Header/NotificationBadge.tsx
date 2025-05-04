"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import messagesService from "../../services/messagesService";
import chatsService from "../../services/chatsService";
import applicationsService from "../../services/applicationsService";
import notificationsService from "../../services/notificationsService";
import jobsApi from "../../services/jobsService";

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
        // First try to get unread count from notifications service if it exists
        try {
          const notificationsEndpointExists =
            await notificationsService.endpointExists();
          if (notificationsEndpointExists) {
            const unreadNotifications =
              await notificationsService.getUnreadCount(user.id);
            if (unreadNotifications > 0) {
              setUnreadCount(unreadNotifications);
              return;
            }
          }
        } catch (error) {
          console.log(
            "Notifications service not available, falling back to message counting"
          );
        }

        // Fall back to counting unread messages
        const allMessages = await messagesService.getAll();
        const allChats = await chatsService.getAll();
        const allApplications = await applicationsService.getAll();
        const allJobs = await jobsApi.getAll();

        // Filter messages based on user role
        let relevantUnreadMessages = 0;

        if (user.role === "student") {
          // For students, count unread messages in chats where they are the applicant
          for (const chat of allChats) {
            const application = allApplications.find(
              (app) => app.id === chat.application
            );
            if (!application || application.user !== Number.parseInt(user.id))
              continue;

            const chatMessages = allMessages.filter(
              (msg) =>
                msg.chat === chat.id &&
                !msg.read &&
                msg.sender !== Number.parseInt(user.id)
            );

            relevantUnreadMessages += chatMessages.length;
          }
        } else if (user.role === "company") {
          // For companies, count unread messages in chats for jobs they posted
          for (const chat of allChats) {
            const application = allApplications.find(
              (app) => app.id === chat.application
            );
            if (!application) continue;

            // Get job details
            const job = allJobs.find((j) => j.id === application.job);
            if (!job) continue;

            // Check if this job belongs to the current company user
            const isCompanyJob =
              typeof job.company === "number"
                ? job.company === Number.parseInt(user.id)
                : job.company.id === Number.parseInt(user.id);

            if (!isCompanyJob) continue;

            const chatMessages = allMessages.filter(
              (msg) =>
                msg.chat === chat.id &&
                !msg.read &&
                msg.sender !== Number.parseInt(user.id)
            );

            relevantUnreadMessages += chatMessages.length;
          }
        }

        setUnreadCount(relevantUnreadMessages);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    };

    fetchUnreadMessages();

    // Set up polling for new messages
    const interval = setInterval(fetchUnreadMessages, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
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
