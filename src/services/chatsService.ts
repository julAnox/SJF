import api from "./api";

export interface Chat {
  id: number;
  application: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChatWithDetails extends Chat {
  companyName: string;
  jobTitle: string;
  lastMessage: string;
  unreadCount: number;
}

export const chatsService = {
  getBaseUrl: () => api.defaults.baseURL,

  getAll: async (): Promise<Chat[]> => {
    try {
      const response = await api.get("/chats/");
      return response.data;
    } catch (error) {
      console.error("Error fetching chats:", error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Chat> => {
    try {
      const response = await api.get(`/chats/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching chat ${id}:`, error);
      throw error;
    }
  },

  getByApplicationId: async (applicationId: string): Promise<Chat[]> => {
    try {
      const response = await api.get(
        `/chats/?job_applications=${applicationId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching chats for application ${applicationId}:`,
        error
      );
      throw error;
    }
  },

  getByUserId: async (userId: string): Promise<Chat[]> => {
    const allChats = await chatsService.getAll();
    return allChats;
  },

  create: async (chatData: Partial<Chat>): Promise<Chat> => {
    try {
      const maxRetries = 3;
      let retries = 0;
      let lastError;

      while (retries < maxRetries) {
        try {
          const response = await api.post("/chats/", chatData);
          return response.data;
        } catch (error) {
          lastError = error;
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        }
      }

      console.error("Error creating chat after retries:", lastError);
      throw lastError;
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  },

  update: async (id: string, chatData: Partial<Chat>): Promise<Chat> => {
    try {
      const response = await api.patch(`/chats/${id}/`, chatData);
      return response.data;
    } catch (error) {
      console.error(`Error updating chat ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: string): Promise<Chat> => {
    try {
      const response = await api.patch(`/chats/${id}/`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating status for chat ${id}:`, error);
      throw error;
    }
  },

  markAllAsRead: async (id: string, userId: string): Promise<void> => {
    try {
      const response = await api.post(`/chats/${id}/mark_all_read/`, {
        user_id: userId,
      });
      console.log(`Marked all messages as read in chat ${id}:`, response.data);

      const event = new CustomEvent("unreadMessagesUpdated");
      window.dispatchEvent(event);
    } catch (error) {
      console.error(`Error marking all messages as read in chat ${id}:`, error);
      throw error;
    }
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    try {
      const response = await api.get(`/chats/unread_count/?user_id=${userId}`);
      return response.data.unread_count;
    } catch (error) {
      console.error(`Error getting unread count for user ${userId}:`, error);
      return 0;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/chats/${id}/`);
    } catch (error) {
      console.error(`Error deleting chat ${id}:`, error);
      throw error;
    }
  },
};

export default chatsService;
