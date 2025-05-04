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
      const response = await api.get(`/chats/?application=${applicationId}`);
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
    // This requires custom backend endpoint or client-side filtering
    const allChats = await chatsService.getAll();
    // Filter chats by user ID would need to be implemented based on your backend structure
    return allChats;
  },

  create: async (chatData: Partial<Chat>): Promise<Chat> => {
    try {
      // Add retry logic
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
          // Wait before retrying (exponential backoff)
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
