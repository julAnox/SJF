import api from "./api";

export interface Message {
  id: number;
  chat: number;
  sender: number;
  content: string;
  message_type: string;
  metadata: any;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageWithSenderDetails extends Message {
  senderName: string;
  senderAvatar: string;
}

export const messagesService = {
  getAll: async (): Promise<Message[]> => {
    const response = await api.get("/messages/");
    return response.data;
  },

  getById: async (id: string): Promise<Message> => {
    const response = await api.get(`/messages/${id}/`);
    return response.data;
  },

  getByChatId: async (chatId: string): Promise<Message[]> => {
    const response = await api.get(`/messages/?chat=${chatId}`);
    return response.data;
  },

  getUnreadByChatId: async (
    chatId: string,
    userId: string
  ): Promise<Message[]> => {
    const messages = await messagesService.getByChatId(chatId);
    return messages.filter(
      (message) => !message.read && message.sender.toString() !== userId
    );
  },

  create: async (messageData: Partial<Message>): Promise<Message> => {
    try {
      // Add retry logic
      const maxRetries = 3;
      let retries = 0;
      let lastError;

      while (retries < maxRetries) {
        try {
          const response = await api.post("/messages/", messageData);
          return response.data;
        } catch (error) {
          lastError = error;
          retries++;
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        }
      }

      console.error("Error creating message after retries:", lastError);
      throw lastError;
    } catch (error) {
      console.error("Error creating message:", error);
      throw error;
    }
  },

  update: async (
    id: string,
    messageData: Partial<Message>
  ): Promise<Message> => {
    const response = await api.patch(`/messages/${id}/`, messageData);
    return response.data;
  },

  markAsRead: async (id: string): Promise<Message> => {
    try {
      const response = await api.patch(`/messages/${id}/`, { read: true });
      return response.data;
    } catch (error) {
      console.error(`Error marking message ${id} as read:`, error);
      throw error;
    }
  },

  markAllAsReadInChat: async (
    chatId: string,
    userId: string
  ): Promise<void> => {
    try {
      const unreadMessages = await messagesService.getUnreadByChatId(
        chatId,
        userId
      );

      if (unreadMessages.length === 0) return;

      // Use Promise.all to mark all messages as read in parallel
      const markPromises = unreadMessages.map((message) =>
        messagesService.markAsRead(message.id.toString())
      );

      await Promise.all(markPromises);

      // Dispatch an event to notify that unread messages have been updated
      const event = new CustomEvent("unreadMessagesUpdated");
      window.dispatchEvent(event);
    } catch (error) {
      console.error(
        `Error marking all messages as read in chat ${chatId}:`,
        error
      );
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/messages/${id}/`);
  },

  deleteAllInChat: async (chatId: string): Promise<void> => {
    try {
      const messages = await messagesService.getByChatId(chatId);
      const deletePromises = messages.map((message) =>
        api.delete(`/messages/${message.id}/`)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error deleting all messages in chat:", error);
      throw error;
    }
  },
};

export default messagesService;
