// services/socketService.ts - FIXED VERSION WITH COMPLETE SENDER DATA
import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from './api';

interface SocketAuth {
  token?: string;
  userId?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentUserId: string | null = null;
  private currentUserData: any = null;

  async connect(token?: string) {
    try {
      // If already connecting or connected with same token, skip
      if (this.socket?.connected || this.connectionState === 'connecting') {
        console.log('🔌 Socket already connected or connecting');
        return;
      }

      let authToken: string | undefined = token;
      
      if (!authToken) {
        try {
          authToken = await AsyncStorage.getItem('authaccess_token') || undefined;
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      }

      if (!authToken) {
        console.log('❌ No authentication token available for socket connection');
        this.emitEvent('connect_error', { message: 'No auth token' });
        return;
      }

      // Get current user data from AsyncStorage for sender info
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          this.currentUserId = user._id;
          this.currentUserData = {
            _id: user._id,
            first_name: user.first_name || 'User',
            last_name: user.last_name || '',
            profile_picture_url: user.profile_picture_url || null
          };
          console.log('👤 Loaded current user data for socket:', {
            userId: this.currentUserId,
            name: `${this.currentUserData.first_name} ${this.currentUserData.last_name}`
          });
        }
      } catch (error) {
        console.error('Error loading user data for socket:', error);
      }

      const SOCKET_URL = BASE_URL;

      console.log('🔗 Connecting socket to:', SOCKET_URL);

      // Clean up existing socket
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      this.connectionState = 'connecting';
      
      // Create new socket connection with proper options
      this.socket = io(SOCKET_URL, {
        auth: { 
          token: authToken,
          platform: Platform.OS,
          timestamp: Date.now(),
          userId: this.currentUserId
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        forceNew: false,
        query: {
          clientType: 'mobile',
          platform: Platform.OS,
          version: '1.0.0',
          userId: this.currentUserId
        }
      });

      this.setupListeners();

      // Set connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
      }
      
      this.connectionTimeout = setTimeout(() => {
        if (this.connectionState === 'connecting') {
          console.log('⏰ Socket connection timeout');
          this.connectionState = 'disconnected';
          this.emitEvent('connect_error', { message: 'Connection timeout' });
          
          if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
          }
        }
      }, 15000);

    } catch (error) {
      console.error('❌ Error connecting socket:', error);
      this.connectionState = 'disconnected';
      this.emitEvent('connect_error', error);
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully, ID:', this.socket?.id);
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      this.emitEvent('connect', { socketId: this.socket?.id });
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Socket connection error:', error.message);
      this.connectionState = 'disconnected';
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('⚠️ Max reconnect attempts reached');
        this.emitEvent('connection_failed', { 
          message: 'Max reconnect attempts reached',
          attempts: this.reconnectAttempts 
        });
      }
      
      this.emitEvent('connect_error', error);
    });

    this.socket.on('connected', (data: any) => {
      console.log('✅ Server confirmed connection:', data);
      this.emitEvent('connected', data);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
      this.connectionState = 'disconnected';
      this.emitEvent('disconnect', { reason });
      
      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        setTimeout(() => {
          if (!this.socket?.connected) {
            console.log('🔄 Attempting to reconnect...');
            this.connect();
          }
        }, 3000);
      }
    });

    // CORE FIX: Handle incoming messages - ADD DEBUG LOGGING
    this.socket.on('new_message', (data: any) => {
      console.log('📨 New message received via socket:', {
        conversationId: data.conversationId,
        messageId: data._id,
        senderId: data.sender?._id,
        senderName: data.sender ? `${data.sender.first_name} ${data.sender.last_name}` : 'Unknown',
        hasProfilePic: !!data.sender?.profile_picture_url,
        content: data.content?.substring(0, 50) + '...'
      });
      
      // FIX: Ensure sender object is complete
      if (data.sender && !data.sender.profile_picture_url) {
        console.log('⚠️ Socket message missing profile picture');
      }
      
      this.emitEvent('new_message', data);
    });

    // Handle message sent confirmation
    this.socket.on('message_sent', (data: any) => {
      console.log('✅ Message sent confirmation:', {
        messageId: data.messageId,
        senderId: data.sender?._id
      });
      this.emitEvent('message_sent', data);
    });

    // Handle typing indicators
    this.socket.on('user_typing', (data: any) => {
      console.log('✍️ User typing:', data);
      this.emitEvent('user_typing', data);
    });

    this.socket.on('user_stop_typing', (data: any) => {
      console.log('✋ User stopped typing:', data);
      this.emitEvent('user_stop_typing', data);
    });

    // Handle conversation events
    this.socket.on('joined_conversation', (data: any) => {
      console.log('✅ Joined conversation:', data);
      this.emitEvent('joined_conversation', data);
    });

    this.socket.on('conversation_updated', (data: any) => {
      console.log('🔄 Conversation updated:', data.conversationId);
      this.emitEvent('conversation_updated', data);
    });

    // Handle errors
    this.socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
      this.emitEvent('error', error);
    });

    this.socket.on('message_error', (error: any) => {
      console.error('❌ Message error:', error);
      this.emitEvent('message_error', error);
    });

    // Debug events
    this.socket.on('ping', (data: any) => {
      console.log('🏓 Ping received:', data);
      this.socket?.emit('pong', { ...data, receivedAt: Date.now() });
    });

    this.socket.on('pong', (data: any) => {
      console.log('🏓 Pong received:', data);
    });
  }

  // Join a specific conversation room
  joinConversation(conversationId: string, userId?: string) {
    if (this.socket?.connected) {
      console.log(`🎯 Joining conversation: ${conversationId}`);
      this.socket.emit('join_conversation', { 
        conversationId, 
        userId: userId || this.currentUserId || 'unknown' 
      });
    } else {
      console.warn('⚠️ Cannot join conversation: Socket not connected');
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      console.log(`🚪 Leaving conversation: ${conversationId}`);
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  // Send typing indicator
  sendTyping(conversationId: string, userId?: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { 
        conversationId, 
        userId: userId || this.currentUserId || 'unknown' 
      });
    }
  }

  // Send stop typing indicator
  sendStopTyping(conversationId: string, userId?: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { 
        conversationId, 
        userId: userId || this.currentUserId || 'unknown' 
      });
    }
  }

  // Send a message via socket (for real-time delivery) - FIXED WITH COMPLETE SENDER DATA
  sendMessage(data: {
    conversationId: string;
    content: string;
    senderId: string;
    senderName?: string;
    isEncrypted?: boolean;
    messageHash?: string;
    replyTo?: string;
    messageId?: string;
    createdAt?: string;
  }) {
    if (this.socket?.connected) {
      // Use stored user data for complete sender information
      const senderData = this.currentUserData || {
        _id: data.senderId,
        first_name: data.senderName?.split(' ')[0] || 'User',
        last_name: data.senderName?.split(' ')[1] || '',
        profile_picture_url: null
      };
      
      const socketPayload = {
        conversationId: data.conversationId,
        message: {
          content: data.content,
          isEncrypted: data.isEncrypted || false,
          messageHash: data.messageHash || null,
          replyTo: data.replyTo || null,
          sender: senderData, // Use complete sender data
          _id: data.messageId,
          createdAt: data.createdAt || new Date().toISOString()
        }
      };
      
      console.log('📤 Sending message via socket:', {
        conversationId: data.conversationId,
        messageId: data.messageId,
        senderId: senderData._id,
        senderName: `${senderData.first_name} ${senderData.last_name}`,
        hasProfilePic: !!senderData.profile_picture_url,
        contentLength: data.content.length
      });
      
      this.socket.emit('send_message', socketPayload);
    } else {
      console.warn('⚠️ Socket not connected, message not sent via socket');
      this.emitEvent('socket_disconnected', { 
        message: 'Socket not connected', 
        data 
      });
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      // Use setTimeout to ensure async execution
      setTimeout(() => {
        callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`❌ Error in ${event} callback:`, error);
          }
        });
      }, 0);
    }
  }

  // Clean disconnect
  disconnect() {
    console.log('🔌 Manually disconnecting socket');
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connectionState = 'disconnected';
    this.listeners.clear();
    this.currentUserId = null;
    this.currentUserData = null;
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Get connection state
  getConnectionState() {
    return this.connectionState;
  }

  // Get current user ID
  getCurrentUserId() {
    return this.currentUserId;
  }

  // Get current user data
  getCurrentUserData() {
    return this.currentUserData;
  }

  // Test connection
  async testConnection() {
    console.log('🔍 Testing socket connection...');
    
    return new Promise((resolve) => {
      const testTimeout = setTimeout(() => {
        resolve({
          connected: this.isConnected(),
          socketId: this.socket?.id,
          connectionState: this.connectionState,
          userId: this.currentUserId
        });
      }, 1000);
    });
  }


  onIncomingCall(callback: (data: any) => void) {
    this.socket?.on('incoming_call', callback);
  }

  offIncomingCall(callback: (data: any) => void) {
    this.socket?.off('incoming_call', callback);
  }

  onCallAccepted(callback: (data: any) => void) {
    this.socket?.on('call_accepted', callback);
  }

  onCallRejected(callback: (data: any) => void) {
    this.socket?.on('call_rejected', callback);
  }

  onCallEnded(callback: (data: any) => void) {
    this.socket?.on('call_ended', callback);
  }

  acceptCall(callId: string) {
    this.socket?.emit('accept_call', callId);
  }

  rejectCall(callId: string) {
    this.socket?.emit('reject_call', callId);
  }

  endCall(callId: string) {
    this.socket?.emit('end_call', callId);
  }

  initiateCallNotification(data: any) {
    this.socket?.emit('initiate_call', data);
  }
}

export const socketService = new SocketService();