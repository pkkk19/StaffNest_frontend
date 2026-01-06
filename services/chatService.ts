// services/chatService.ts
import api from './api';
import { socketService } from './socketService';
import { encryptionService } from './encryptionService';

interface SendMessageOptions {
  encrypt?: boolean;
  replyTo?: string;
}

interface SendMessageData {
  conversationId: string;
  content: string;
  senderId: string;
  isEncrypted?: boolean;
  messageHash?: string;
  replyTo?: string;
  messageId?: string;
  createdAt?: string;
}

export const chatService = {
  // Initialize chat service
  async initialize(userId: string) {
    try {
      console.log('🔐 Chat service initializing...');
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Failed to initialize chat service:', error);
      throw error;
    }
  },

  // Get conversations list
  async getConversations() {
    try {
      const response = await api.get('/chat/conversations');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching conversations:', error);
      throw error.response?.data || error;
    }
  },

  // Get messages for a conversation
  async getMessages(conversationId: string, page: number = 1, limit: number = 30) {
    try {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
      );
      
      // Decrypt messages if needed
      const messages = response.data || [];
      const decryptedMessages = messages.map((message: any) => {
        if (message.isEncrypted && message.content) {
          try {
            const decryptedContent = encryptionService.decryptMessage(message.content);
            return {
              ...message,
              content: decryptedContent,
              decrypted: true
            };
          } catch (error) {
            console.error('❌ Failed to decrypt message:', error);
            return {
              ...message,
              content: '[Encrypted message - decryption failed]',
              decryptionError: true
            };
          }
        }
        return message;
      });
      
      return {
        messages: decryptedMessages,
        hasMore: decryptedMessages.length === limit,
        page
      };
    } catch (error: any) {
      console.error('❌ Error fetching messages:', error);
      throw error.response?.data || error;
    }
  },

  // Send a message (SIMPLIFIED - No encryption issues)
  async sendMessage(conversationId: string, content: string, senderId: string, options?: SendMessageOptions) {
    try {
      console.log('📤 Sending message...');
      
      // SIMPLIFIED: Always send plain text for now
      const finalContent = content;
      const isEncrypted = false;
      const messageHash = '';
      
      // Send via HTTP API
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content: finalContent,
        isEncrypted,
        messageHash,
        replyTo: options?.replyTo
      });

      const messageData = response.data;
      
      // Prepare socket data
      const socketData: SendMessageData = {
        conversationId,
        content: finalContent,
        senderId,
        isEncrypted,
        messageHash,
        replyTo: options?.replyTo,
        messageId: messageData._id,
        createdAt: messageData.createdAt
      };
      
      // Also send via socket for real-time
      socketService.sendMessage(socketData);

      console.log('✅ Message sent successfully');
      return messageData;
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send message';
      throw new Error(errorMessage);
    }
  },

  // Alternative: Send with encryption (if you want to enable it later)
  async sendEncryptedMessage(conversationId: string, content: string, senderId: string, options?: SendMessageOptions) {
    try {
      console.log('🔐 Sending encrypted message...');
      
      let finalContent = content;
      let isEncrypted = false;
      let messageHash = '';

      // Check encryption status
      const keyStatus = encryptionService.getKeyStatus();
      if (!keyStatus.hasKey || !keyStatus.isReady) {
        console.warn('⚠️ Encryption not ready, sending as plain text');
        return this.sendMessage(conversationId, content, senderId, options);
      }

      // Try to encrypt
      try {
        finalContent = encryptionService.encryptMessage(content);
        isEncrypted = true;
        messageHash = encryptionService.generateHMAC(content);
        console.log('✅ Message encrypted');
      } catch (encryptionError) {
        console.error('❌ Encryption failed, sending as plain text:', encryptionError);
        return this.sendMessage(conversationId, content, senderId, options);
      }

      // Send via HTTP API
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content: finalContent,
        isEncrypted,
        messageHash,
        replyTo: options?.replyTo
      });

      const messageData = response.data;
      
      // Prepare socket data
      const socketData: SendMessageData = {
        conversationId,
        content: finalContent,
        senderId,
        isEncrypted,
        messageHash,
        replyTo: options?.replyTo,
        messageId: messageData._id,
        createdAt: messageData.createdAt
      };
      
      // Send via socket
      socketService.sendMessage(socketData);

      console.log('✅ Encrypted message sent');
      return {
        ...messageData,
        decryptedContent: content // Include original for UI
      };
    } catch (error: any) {
      console.error('❌ Error sending encrypted message:', error);
      throw error;
    }
  },

  // Create conversation
  async createConversation(participantIds: string[], name?: string, enableEncryption: boolean = false) {
    try {
      const response = await api.post('/chat/conversations', {
        participantIds,
        name,
        enableEncryption
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating conversation:', error);
      throw error.response?.data || error;
    }
  },

  // Mark messages as read
  async markAsRead(conversationId: string, messageIds: string[]) {
    try {
      const response = await api.put(`/chat/conversations/${conversationId}/read`, {
        messageIds,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  // Delete message
  async deleteMessage(messageId: string) {
    try {
      // TODO: Implement actual API endpoint
      console.log('🗑️ Delete message:', messageId);
      return { success: true, messageId };
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  // Update message
  async updateMessage(messageId: string, content: string, encrypt: boolean = false) {
    try {
      console.log('✏️ Update message:', messageId);
      // TODO: Implement actual API endpoint
      return { 
        success: true, 
        messageId, 
        content,
        isEncrypted: false,
        edited: true,
        updatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  // Socket methods
  joinConversationRoom: (conversationId: string) => {
    socketService.joinConversation(conversationId);
  },
  
  leaveConversationRoom: (conversationId: string) => {
    socketService.leaveConversation(conversationId);
  },
  
  sendTypingIndicator: (conversationId: string) => {
    socketService.sendTyping(conversationId);
  },
  
  sendStopTypingIndicator: (conversationId: string) => {
    socketService.sendStopTyping(conversationId);
  },

  // Encryption status
  getEncryptionStatus: () => {
    return encryptionService.getKeyStatus();
  },

  // Clear encryption
  clearEncryption: async () => {
    await encryptionService.clearKey();
  }
};