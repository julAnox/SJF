import api from "./api";

export interface PinnedChat {
  id: number;
  user: number;
  chat: number;
  created_at: string;
}

export const pinnedChatsService = {
  getBaseUrl: () => api.defaults.baseURL,

  getByUserId: async (userId: string): Promise<PinnedChat[]> => {
    try {
      const response = await api.get(`/pinned-chats/user/${userId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching pinned chats for user ${userId}:`, error);
      throw error;
    }
  },

  create: async (pinnedChatData: {
    user: number;
    chat: number;
  }): Promise<PinnedChat> => {
    try {
      const response = await api.post("/pinned-chats/", pinnedChatData);
      return response.data;
    } catch (error) {
      console.error("Error creating pinned chat:", error);
      throw error;
    }
  },

  delete: async (userId: string, chatId: string): Promise<void> => {
    try {
      await api.delete(`/pinned-chats/user/${userId}/chat/${chatId}/`);
    } catch (error) {
      console.error(
        `Error deleting pinned chat for user ${userId}, chat ${chatId}:`,
        error
      );
      throw error;
    }
  },
};

export default pinnedChatsService;
