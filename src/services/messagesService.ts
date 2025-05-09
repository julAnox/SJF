import api from "./api";

export interface Message {
  id: number;
  chat: number;
  sender: number;
  content: string;
  message_type: string;
  metadata?: any;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageWithSenderDetails extends Message {
  senderName: string;
  senderAvatar: string;
}

// Cache configuration
const CACHE_DURATION = 60000; // 1 minute cache
let messageCache: Record<string, { data: any; timestamp: number }> = {};

// Helper function to check if cache is valid
const isCacheValid = (key: string): boolean => {
  return (
    messageCache[key] &&
    Date.now() - messageCache[key].timestamp < CACHE_DURATION
  );
};

export const messagesService = {
  getAll: async (): Promise<Message[]> => {
    const cacheKey = "all_messages";

    // Return cached data if valid
    if (isCacheValid(cacheKey)) {
      return messageCache[cacheKey].data;
    }

    try {
      const response = await api.get("/messages/");

      // Cache the result
      messageCache[cacheKey] = {
        data: response.data,
        timestamp: Date.now(),
      };

      return response.data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Message> => {
    const cacheKey = `message_${id}`;

    // Return cached data if valid
    if (isCacheValid(cacheKey)) {
      return messageCache[cacheKey].data;
    }

    try {
      const response = await api.get(`/messages/${id}/`);

      // Cache the result
      messageCache[cacheKey] = {
        data: response.data,
        timestamp: Date.now(),
      };

      return response.data;
    } catch (error) {
      console.error(`Error fetching message ${id}:`, error);
      throw error;
    }
  },

  getByChatId: async (chatId: string): Promise<Message[]> => {
    const cacheKey = `chat_messages_${chatId}`;

    // Return cached data if valid
    if (isCacheValid(cacheKey)) {
      return messageCache[cacheKey].data;
    }

    try {
      const response = await api.get(`/messages/?chat=${chatId}`);

      // Cache the result
      messageCache[cacheKey] = {
        data: response.data,
        timestamp: Date.now(),
      };

      // Update window cache for chat messages
      if (window.chatMessagesCache) {
        window.chatMessagesCache[chatId] = {
          messages: response.data,
          timestamp: Date.now(),
        };
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching messages for chat ${chatId}:`, error);
      throw error;
    }
  },

  getUnreadByChatId: async (
    chatId: string,
    userId: string
  ): Promise<Message[]> => {
    try {
      // Try to use cached messages if available
      const cacheKey = `chat_messages_${chatId}`;
      let messages;

      if (isCacheValid(cacheKey)) {
        messages = messageCache[cacheKey].data;
      } else {
        messages = await messagesService.getByChatId(chatId);
      }

      return messages.filter(
        (message) => !message.read && message.sender.toString() !== userId
      );
    } catch (error) {
      console.error(
        `Error fetching unread messages for chat ${chatId}:`,
        error
      );
      throw error;
    }
  },

  create: async (messageData: Partial<Message>): Promise<Message> => {
    try {
      const maxRetries = 3;
      let retries = 0;
      let lastError;

      while (retries < maxRetries) {
        try {
          const response = await api.post("/messages/", messageData);

          // Invalidate relevant caches
          const chatId = messageData.chat?.toString();
          if (chatId) {
            delete messageCache[`chat_messages_${chatId}`];

            // Also clear window caches for this chat
            if (window.chatMessagesCache && window.chatMessagesCache[chatId]) {
              delete window.chatMessagesCache[chatId];
            }

            if (window.messagesCache) {
              const messagesCacheKey = `messages_${chatId}`;
              delete window.messagesCache[messagesCacheKey];
            }
          }

          // Clear all messages cache
          delete messageCache["all_messages"];

          // Clear chat data cache to force refresh of chat list
          if (window.chatDataCache) {
            delete window.chatDataCache;
          }

          // Trigger event to update unread counts
          const event = new CustomEvent("unreadMessagesUpdated");
          window.dispatchEvent(event);

          return response.data;
        } catch (error) {
          lastError = error;
          retries++;
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
    try {
      const response = await api.patch(`/messages/${id}/`, messageData);

      // Invalidate relevant caches
      delete messageCache[`message_${id}`];
      delete messageCache["all_messages"];

      // If we know the chat ID, invalidate that cache too
      if (response.data.chat) {
        delete messageCache[`chat_messages_${response.data.chat}`];
      }

      // Trigger event to update unread counts
      const event = new CustomEvent("unreadMessagesUpdated");
      window.dispatchEvent(event);

      return response.data;
    } catch (error) {
      console.error(`Error updating message ${id}:`, error);
      throw error;
    }
  },

  markAsRead: async (id: string): Promise<Message> => {
    try {
      const response = await api.patch(`/messages/${id}/mark_as_read/`);

      // Invalidate relevant caches
      delete messageCache[`message_${id}`];
      delete messageCache["all_messages"];

      // If we know the chat ID, invalidate that cache too
      if (response.data.chat) {
        delete messageCache[`chat_messages_${response.data.chat}`];
      }

      // Trigger event to update unread counts
      const event = new CustomEvent("unreadMessagesUpdated");
      window.dispatchEvent(event);

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
      const response = await api.post(`/messages/mark_all_as_read/`, {
        chat_id: chatId,
        user_id: userId,
      });

      // Invalidate relevant caches
      delete messageCache[`chat_messages_${chatId}`];
      delete messageCache["all_messages"];

      // Clear window caches thoroughly
      if (window.messagesCache) {
        // Clear specific chat messages cache
        const messagesCacheKey = `messages_${chatId}`;
        delete window.messagesCache[messagesCacheKey];

        // Also clear any other related caches that might contain this chat's messages
        Object.keys(window.messagesCache).forEach((key) => {
          if (key.includes(chatId)) {
            delete window.messagesCache[key];
          }
        });
      }

      if (window.chatMessagesCache) {
        // Clear this chat's messages
        delete window.chatMessagesCache[chatId];
      }

      // Force refresh of chat data
      if (window.chatDataCache) {
        delete window.chatDataCache;
      }

      if (window.chatRelatedDataCache) {
        // Update the timestamp to force a refresh
        window.chatRelatedDataCache.timestamp = 0;
      }

      // Trigger event to update unread counts
      const event = new CustomEvent("unreadMessagesUpdated");
      window.dispatchEvent(event);

      // Dispatch a second event after a small delay to ensure UI updates
      setTimeout(() => {
        const secondEvent = new CustomEvent("unreadMessagesUpdated");
        window.dispatchEvent(secondEvent);
      }, 300);
    } catch (error) {
      console.error(
        `Error marking all messages as read in chat ${chatId}:`,
        error
      );
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      // Get the message first to know which chat it belongs to
      const message = await messagesService.getById(id);
      const chatId = message.chat.toString();

      await api.delete(`/messages/${id}/`);

      // Invalidate relevant caches
      delete messageCache[`message_${id}`];
      delete messageCache[`chat_messages_${chatId}`];
      delete messageCache["all_messages"];

      // Trigger event to update unread counts
      const event = new CustomEvent("unreadMessagesUpdated");
      window.dispatchEvent(event);
    } catch (error) {
      console.error(`Error deleting message ${id}:`, error);
      throw error;
    }
  },

  deleteAllInChat: async (chatId: string): Promise<void> => {
    try {
      await api.post(`/messages/delete_all/`, { chat_id: chatId });

      // Invalidate relevant caches
      delete messageCache[`chat_messages_${chatId}`];
      delete messageCache["all_messages"];

      // Clear window caches
      if (window.messagesCache) {
        const messagesCacheKey = `messages_${chatId}`;
        delete window.messagesCache[messagesCacheKey];
      }

      if (window.chatMessagesCache && window.chatMessagesCache[chatId]) {
        delete window.chatMessagesCache[chatId];
      }

      // Trigger event to update unread counts
      const event = new CustomEvent("unreadMessagesUpdated");
      window.dispatchEvent(event);
    } catch (error) {
      // Fallback to individual deletion if bulk delete endpoint doesn't exist
      try {
        const messages = await messagesService.getByChatId(chatId);
        const deletePromises = messages.map((message) =>
          api.delete(`/messages/${message.id}/`)
        );
        await Promise.all(deletePromises);

        // Invalidate relevant caches
        delete messageCache[`chat_messages_${chatId}`];
        delete messageCache["all_messages"];

        // Clear window caches
        if (window.messagesCache) {
          const messagesCacheKey = `messages_${chatId}`;
          delete window.messagesCache[messagesCacheKey];
        }

        if (window.chatMessagesCache && window.chatMessagesCache[chatId]) {
          delete window.chatMessagesCache[chatId];
        }

        // Trigger event to update unread counts
        const event = new CustomEvent("unreadMessagesUpdated");
        window.dispatchEvent(event);
      } catch (innerError) {
        console.error("Error deleting all messages in chat:", innerError);
        throw innerError;
      }
    }
  },

  // Clear cache method for testing or manual cache invalidation
  clearCache: () => {
    messageCache = {};
  },
};

export default messagesService;
