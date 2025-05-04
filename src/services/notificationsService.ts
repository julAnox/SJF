import api from "./api";

export interface Notification {
  id: number;
  user: number;
  type: string; // message, application_status, etc.
  content: string;
  related_id: number | null; // ID of related object (chat, application, etc.)
  read: boolean;
  created_at: string;
}

export const notificationsService = {
  // Check if notifications endpoint exists
  endpointExists: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${api.defaults.baseURL}/notifications/`, {
        method: "HEAD",
      });
      return response.ok;
    } catch (error) {
      console.error("Error checking notifications endpoint:", error);
      return false;
    }
  },

  getAll: async (): Promise<Notification[]> => {
    try {
      if (!(await notificationsService.endpointExists())) {
        return [];
      }
      const response = await api.get("/notifications/");
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  },

  getByUserId: async (userId: string): Promise<Notification[]> => {
    try {
      if (!(await notificationsService.endpointExists())) {
        return [];
      }
      const response = await api.get(`/notifications/?user=${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      return [];
    }
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    try {
      if (!(await notificationsService.endpointExists())) {
        return 0;
      }
      const response = await api.get(
        `/notifications/?user=${userId}&read=false`
      );
      return response.data.length;
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
      return 0;
    }
  },

  create: async (
    notificationData: Partial<Notification>
  ): Promise<Notification | null> => {
    try {
      if (!(await notificationsService.endpointExists())) {
        console.log(
          "Notifications endpoint not available, skipping notification creation"
        );
        return null;
      }
      const response = await api.post("/notifications/", notificationData);
      return response.data;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  },

  markAsRead: async (id: string): Promise<Notification | null> => {
    try {
      if (!(await notificationsService.endpointExists())) {
        return null;
      }
      const response = await api.patch(`/notifications/${id}/`, { read: true });
      return response.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return null;
    }
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    try {
      if (!(await notificationsService.endpointExists())) {
        return;
      }
      const notifications = await notificationsService.getByUserId(userId);
      const unreadNotifications = notifications.filter(
        (notification) => !notification.read
      );

      for (const notification of unreadNotifications) {
        await notificationsService.markAsRead(notification.id.toString());
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      if (!(await notificationsService.endpointExists())) {
        return;
      }
      await api.delete(`/notifications/${id}/`);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  },
};

export default notificationsService;
