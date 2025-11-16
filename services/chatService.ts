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

  // Get messages for a conversation
  getMessages: async (conversationId: string, page: number = 1) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages?page=${page}`);
      return response.data;
    } catch (error: any) {
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
// In your chatService.ts
createConversation: async (participantIds: string[], name?: string) => {
  try {
    console.log('📱 [CHAT SERVICE] Creating conversation with participants:', participantIds);
    
    const response = await api.post('/chat/conversations', {
      participantIds,
      name,
    });
    
    console.log('✅ [CHAT SERVICE] Full response:', response);
    console.log('✅ [CHAT SERVICE] Response data:', response.data);
    console.log('✅ [CHAT SERVICE] Conversation ID:', response.data._id);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ [CHAT SERVICE] Create conversation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
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