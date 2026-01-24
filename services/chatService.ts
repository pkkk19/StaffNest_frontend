// services/chatService.ts - FIXED VERSION (Socket Only)
import api from './api';
import { socketService } from './socketService';
import { encryptionService } from './encryptionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SendMessageOptions {
  encrypt?: boolean;
  replyTo?: string;
  socketEmit?: boolean;
}

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
  conversationId: string;
  createdAt: string;
  updatedAt: string;
  readBy: string[];
  isEncrypted?: boolean;
  messageHash?: string;
  replyTo?: any;
  decrypted?: boolean;
  decryptionError?: boolean;
  decryptedContent?: string;
  edited?: boolean;
  isSending?: boolean;
  temp?: boolean;
}

interface Conversation {
  _id: string;
  name?: string;
  participants: any[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  email?: string;
}

// Cache for user data to avoid repeated API calls
const userCache = new Map<string, User>();

// Helper function to handle expired S3 URLs
const getProfileImageUrl = (profile_picture_url?: string, userId?: string): string | undefined => {
  if (!profile_picture_url || profile_picture_url === 'null') return undefined;
  
  // Check if URL is expired (contains old date from logs)
  const isExpired = profile_picture_url.includes('20251224') || 
                    profile_picture_url.includes('X-Amz-Date=20251224');
  
  if (isExpired && userId) {
    // Return a fresh URL by appending timestamp
    return `${profile_picture_url.split('?')[0]}?t=${Date.now()}`;
  }
  
  return profile_picture_url;
};

const fetchSingleUser = async (userId: string): Promise<User | null> => {
  try {
    const response = await api.get(`/users/chat/${userId}`);
    
    if (response.data?._id) {
      const userData = {
        ...response.data,
        profile_picture_url: getProfileImageUrl(response.data.profile_picture_url, userId)
      };
      return userData;
    }
    
    return null;
  } catch (error: any) {
    console.error(`Error fetching chat user ${userId}:`, error.message);
    return null;
  }
};

// Helper function to process participants - ALWAYS fetches user details
const processParticipants = async (participants: any[], currentUserId?: string): Promise<any[]> => {
  if (!participants || participants.length === 0) return [];
  
  const processedParticipants = [];
  
  for (const participant of participants) {
    let userId: string | undefined;
    
    // Handle different participant formats
    if (typeof participant === 'string') {
      userId = participant;
    } else if (participant?.$oid) {
      userId = participant.$oid;
    } else if (participant?._id) {
      userId = participant._id;
    }
    
    if (userId && userId !== currentUserId) {
      // Check cache first
      const cachedUser = userCache.get(userId);
      
      if (cachedUser) {
        processedParticipants.push(cachedUser);
      } else {
        // Always fetch user details from API to get profile picture
        const fetchedUser = await fetchSingleUser(userId);
        if (fetchedUser) {
          userCache.set(userId, fetchedUser);
          processedParticipants.push(fetchedUser);
        } else {
          // Create placeholder if user not found
          processedParticipants.push({
            _id: userId,
            first_name: 'User',
            last_name: '',
            email: 'unknown@example.com'
          });
        }
      }
    }
  }
  
  return processedParticipants;
};

export const chatService = {
  // Initialize chat service
  async initialize(userId: string) {
    try {
      await encryptionService.initialize(userId);
      
      if (!socketService.isConnected()) {
        await socketService.connect();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return Promise.resolve();
    } catch (error: any) {
      console.error('Failed to initialize chat service:', error);
      throw error;
    }
  },

  // Get conversations list with populated user data
  async getConversations(currentUserId?: string): Promise<Conversation[]> {
    try {
      const response = await api.get('/chat/conversations');
      let conversations = response.data || [];
      
      // Process each conversation
      const processedConversations = [];
      
      for (const conversation of conversations) {
        // Process participants - always fetch user details
        const processedParticipants = await processParticipants(
          conversation.participants || [], 
          currentUserId
        );
        
        // Handle last message
        let processedLastMessage = conversation.lastMessage;
        if (processedLastMessage?.content) {
          const decryptedContent = encryptionService.getDecryptedContent(
            processedLastMessage.content,
            processedLastMessage.isEncrypted
          );
          
          // Get sender details for last message if needed
          if (processedLastMessage.sender?._id && !processedLastMessage.sender.profile_picture_url) {
            const senderDetails = await this.getUserById(processedLastMessage.sender._id);
            if (senderDetails) {
              processedLastMessage = {
                ...processedLastMessage,
                content: decryptedContent,
                sender: {
                  ...processedLastMessage.sender,
                  profile_picture_url: senderDetails.profile_picture_url
                }
              };
            } else {
              processedLastMessage = {
                ...processedLastMessage,
                content: decryptedContent
              };
            }
          } else {
            processedLastMessage = {
              ...processedLastMessage,
              content: decryptedContent
            };
          }
        }
        
        processedConversations.push({
          ...conversation,
          participants: processedParticipants,
          lastMessage: processedLastMessage
        });
      }
      
      return processedConversations;
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      throw error.response?.data || error;
    }
  },

  // Get messages for a conversation
  async getMessages(conversationId: string, page: number = 1, limit: number = 30): Promise<{
    messages: Message[];
    hasMore: boolean;
    page: number;
  }> {
    try {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
      );
      
      const messages: Message[] = response.data || [];
      
      // Process messages with proper sender details
      const processedMessages: Message[] = [];
      
      for (const message of messages) {
        const decryptedContent = encryptionService.getDecryptedContent(
          message.content,
          message.isEncrypted
        );
        
        // Get sender with profile picture
        let sender = message.sender || { 
          _id: 'unknown', 
          first_name: 'Unknown', 
          last_name: 'User' 
        };
        
        // Always fetch sender details if available
        if (sender._id && sender._id !== 'unknown') {
          const senderDetails = await this.getUserById(sender._id);
          if (senderDetails) {
            sender = {
              ...sender,
              profile_picture_url: senderDetails.profile_picture_url
            };
          }
        }
        
        processedMessages.push({
          ...message,
          content: decryptedContent,
          decrypted: message.isEncrypted,
          sender: sender
        });
      }
      
      return {
        messages: processedMessages,
        hasMore: processedMessages.length === limit,
        page
      };
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      throw error.response?.data || error;
    }
  },

  // Get user by ID (with caching)
  async getUserById(userId: string): Promise<User | null> {
    // Check cache first
    const cachedUser = userCache.get(userId);
    if (cachedUser) {
      return cachedUser;
    }
    
    // Fetch from API
    const user = await fetchSingleUser(userId);
    if (user) {
      userCache.set(userId, user);
    }
    
    return user;
  },

  // Clear user cache
  clearUserCache() {
    userCache.clear();
  },

  // Send a message - SOCKET ONLY VERSION
  async sendMessage(
    conversationId: string, 
    content: string, 
    senderId: string, 
    options?: SendMessageOptions
  ): Promise<Message> {
    try {
      // Get user info for socket
      let senderName = '';
      let senderProfilePic = '';
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          senderName = `${user.first_name} ${user.last_name}`;
          senderProfilePic = getProfileImageUrl(user.profile_picture_url, senderId) || '';
        }
      } catch (error) {
        console.warn('Could not get user data for socket:', error);
      }
      
      // Generate message hash if encrypting
      let messageHash = undefined;
      let encryptedContent = content;
      
      if (options?.encrypt) {
        messageHash = encryptionService.generateHMAC(content);
        encryptedContent = encryptionService.encryptMessage(content);
      }
      
      // Generate temp ID for immediate UI display
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Send via SOCKET ONLY (no HTTP API call)
      if (socketService.isConnected()) {
        socketService.sendMessage({
          conversationId,
          content: encryptedContent,
          senderId,
          senderName,
          isEncrypted: options?.encrypt || false,
          messageHash: messageHash,
          replyTo: options?.replyTo,
          messageId: tempId,
          createdAt: new Date().toISOString()
        });
      } else {
        console.warn('Socket not connected, message not sent');
        throw new Error('Socket not connected');
      }
      
      // Return temp message for immediate UI display
      const tempMessage: Message = {
        _id: tempId,
        content: content,
        sender: {
          _id: senderId,
          first_name: senderName?.split(' ')[0] || 'You',
          last_name: senderName?.split(' ')[1] || '',
          profile_picture_url: senderProfilePic
        },
        conversationId: conversationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readBy: [senderId],
        isSending: true,
        temp: true,
        isEncrypted: options?.encrypt || false,
        decryptedContent: content,
        messageHash: messageHash
      };
      
      console.log('📤 Message sent via socket (temp ID):', tempId);
      return tempMessage;
      
    } catch (error: any) {
      console.error('Error sending message via socket:', error);
      const errorMessage = error.message || 'Failed to send message';
      throw new Error(errorMessage);
    }
  },

  // Alternative: Send with encryption
  async sendEncryptedMessage(
    conversationId: string, 
    content: string, 
    senderId: string, 
    options?: SendMessageOptions
  ): Promise<Message> {
    return this.sendMessage(conversationId, content, senderId, {
      ...options,
      encrypt: true
    });
  },

  // Create conversation with proper participant processing
  async createConversation(
    participantIds: string[], 
    name?: string, 
    enableEncryption: boolean = false
  ): Promise<Conversation> {
    try {
      const response = await api.post('/chat/conversations', {
        participantIds,
        name,
        enableEncryption
      });
      
      // Process the returned conversation
      const conversation = response.data;
      if (conversation) {
        conversation.participants = await processParticipants(
          conversation.participants || []
        );
      }
      
      return conversation;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      throw error.response?.data || error;
    }
  },

  // Mark messages as read
  async markAsRead(conversationId: string, messageIds: string[]) {
    try {
      const response = await api.put(`/chat/conversations/${conversationId}/read`, {
        messageIds,
      });
      
      // Also emit via socket if connected
      if (socketService.isConnected() && messageIds.length > 0) {
        const userId = await AsyncStorage.getItem('userId') || 'unknown';
        socketService.getSocket()?.emit('messages_read', {
          conversationId,
          messageIds,
          userId
        });
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      throw error.response?.data || error;
    }
  },

  // Delete message
  async deleteMessage(messageId: string): Promise<{ success: boolean; messageId: string }> {
    try {
      // Send delete via HTTP API
      await api.delete(`/chat/messages/${messageId}`);
      return { success: true, messageId };
    } catch (error: any) {
      console.error('Error deleting message:', error);
      throw error.response?.data || error;
    }
  },

  // Update message
  async updateMessage(
    messageId: string, 
    content: string, 
    encrypt: boolean = false
  ): Promise<Message> {
    try {
      // Get user info for sender
      let senderName = '';
      let senderId = '';
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          senderName = `${user.first_name} ${user.last_name}`;
          senderId = user._id;
        }
      } catch (error) {
        console.warn('Could not get user data for update:', error);
      }
      
      // Update via HTTP API
      const payload: any = {
        content: content,
        isEncrypted: encrypt
      };
      
      if (encrypt) {
        payload.messageHash = encryptionService.generateHMAC(content);
        payload.content = encryptionService.encryptMessage(content);
      }
      
      const response = await api.put(`/chat/messages/${messageId}`, payload);
      
      return {
        _id: messageId,
        content: content,
        sender: { 
          _id: senderId || 'current', 
          first_name: senderName?.split(' ')[0] || 'You', 
          last_name: senderName?.split(' ')[1] || '',
          profile_picture_url: '' 
        },
        conversationId: response.data.conversationId || 'temp',
        createdAt: response.data.createdAt || new Date().toISOString(),
        updatedAt: response.data.updatedAt || new Date().toISOString(),
        readBy: response.data.readBy || [],
        isEncrypted: encrypt,
        edited: true
      } as Message;
    } catch (error: any) {
      console.error('Error updating message:', error);
      throw error.response?.data || error;
    }
  },

  // Socket methods for conversation rooms
  joinConversationRoom: (conversationId: string, userId?: string) => {
    socketService.joinConversation(conversationId, userId);
  },
  
  leaveConversationRoom: (conversationId: string) => {
    socketService.leaveConversation(conversationId);
  },
  
  // Typing indicators
  sendTypingIndicator: (conversationId: string, userId?: string) => {
    if (socketService.isConnected()) {
      socketService.sendTyping(conversationId, userId);
    }
  },
  
  sendStopTypingIndicator: (conversationId: string, userId?: string) => {
    if (socketService.isConnected()) {
      socketService.sendStopTyping(conversationId, userId);
    }
  },

  // Get encryption status
  getEncryptionStatus: () => {
    return encryptionService.getKeyStatus();
  },

  // Clear encryption
  clearEncryption: async () => {
    await encryptionService.clearKey();
  },

  // Check socket connection
  isSocketConnected: () => {
    return socketService.isConnected();
  },

  // Manual socket connection
  connectSocket: async () => {
    await socketService.connect();
  },

  // Additional helper methods
  async testEncryption(): Promise<boolean> {
    try {
      const testMessage = "Hello, this is a test message for encryption!";
      const encrypted = encryptionService.encryptMessage(testMessage);
      const decrypted = encryptionService.decryptMessage(encrypted);
      return decrypted === testMessage;
    } catch (error) {
      console.error('Encryption test failed:', error);
      return false;
    }
  },

  // Get encryption key fingerprint
  getKeyFingerprint(): string {
    return encryptionService.getKeyFingerprint();
  },

  // Check if message content is encrypted
  isMessageEncrypted(content: string): boolean {
    return encryptionService.isEncrypted(content);
  }
};