import api from './api';

export const chatService = {
  // Get conversations list
  getConversations: async () => {
    try {
      const response = await api.get('/chat/conversations');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  // Get messages for a conversation with pagination
  getMessages: async (conversationId: string, page: number = 1, limit: number = 30) => {
    try {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
      );
      
      return {
        messages: response.data || [],
        hasMore: response.data?.length === limit,
        page
      };
    } catch (error: any) {
      console.error('❌ [CHAT SERVICE] Error fetching messages:', error);
      throw error.response?.data || error;
    }
  },

  // Send a message
  sendMessage: async (conversationId: string, content: string) => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  // Create a new conversation
  createConversation: async (participantIds: string[], name?: string) => {
    try {
      const response = await api.post('/chat/conversations', {
        participantIds,
        name,
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ [CHAT SERVICE] Create conversation error:', error);
      throw error.response?.data || error;
    }
  },

  // Mark messages as read
  markAsRead: async (conversationId: string, messageIds: string[]) => {
    try {
      const response = await api.put(`/chat/conversations/${conversationId}/read`, {
        messageIds,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
};