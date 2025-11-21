// services/socketService.ts
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  // services/socketService.ts - Add this method
async testConnection(): Promise<boolean> {
  try {
    await this.connect();
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}
  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        // Directly get token from AsyncStorage (same key as your AuthContext)
        const token = await AsyncStorage.getItem('authaccess_token');
        
        if (!token) {
          console.error('❌ No auth token available for WebSocket');
          reject(new Error('No auth token available'));
          return;
        }

        console.log('🔌 Connecting to WebSocket...');
        
        this.socket = io('https://b724f27df006.ngrok-free.app', {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason);
          this.isConnected = false;
          this.connectionPromise = null;
        });

        this.socket.on('connect_error', (error) => {
  console.error('❌ WebSocket connection error:', error);
  console.error('❌ Error details:', {
    message: error.message,
    name: error.name
  });
  this.isConnected = false;
  this.connectionPromise = null;
  reject(error);
});

        this.socket.on('new_message', (message) => {
          console.log('📨 [SOCKET] New message received:', message);
          this.emit('new_message', message);
        });

        this.socket.on('user_typing', (data) => {
          this.emit('user_typing', data);
        });

      } catch (error) {
        console.error('❌ WebSocket setup error:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  async joinConversation(conversationId: string): Promise<void> {
    if (!this.socket || !this.isConnected) {
      console.log('🔌 WebSocket not connected, connecting first...');
      await this.connect();
    }

    if (this.socket) {
      console.log('🔗 Joining conversation:', conversationId);
      this.socket.emit('join_conversation', conversationId);
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket && this.isConnected) {
      console.log('🔗 Leaving conversation:', conversationId);
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      console.log(`📢 [SOCKET] Emitting ${event} to ${eventListeners.length} listeners`);
      eventListeners.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionPromise = null;
    }
  }
}

export const socketService = new SocketService();