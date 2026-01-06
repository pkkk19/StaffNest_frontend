// /services/socketService.ts - FIXED
import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import directly
import api from './api';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

// In socketService.ts, update connect() method:
async connect(token?: string) {
  // If already connected with same token, don't reconnect
  if (this.socket?.connected) {
    const currentAuth = this.socket.auth as { token?: string } | undefined;
     const currentToken = currentAuth?.token;
    const newToken = token || await AsyncStorage.getItem('authaccess_token');
    
    if (currentToken === newToken) {
      console.log('✅ Socket already connected with same token');
      return;
    }
  }

  let authToken: string | undefined = token;
  
  if (!authToken) {
    try {
      const storedToken = await AsyncStorage.getItem('authaccess_token');
      authToken = storedToken || undefined;
      console.log(`🔑 Retrieved token: ${authToken ? 'YES' : 'NO'}`);
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
  }

  if (!authToken) {
    console.log('❌ No authentication token available for socket connection');
    return;
  }

  const SOCKET_URL = 'https://staffnest-backend-production.up.railway.app';

  console.log('🔗 Connecting socket with token...');

  // Clean up existing socket
  if (this.socket) {
    console.log('🔄 Cleaning up previous socket connection');
    this.socket.disconnect();
    this.socket = null;
  }

  this.socket = io(SOCKET_URL, {
    auth: { token: authToken },
    transports: ['websocket', 'polling'],
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    autoConnect: true,
  });

  this.setupListeners();
}


async testConnection() {
  console.log('🔍 Testing WebSocket connection...');
  // Test 2: Try with socket.io client
  console.log('\n🔍 Test 2: Testing Socket.io connection...');
  try {
    // Get token for auth test
    const authToken = await AsyncStorage.getItem('authaccess_token') || 
                    await AsyncStorage.getItem('authToken');
    console.log(`🔑 Token available: ${authToken ? 'YES' : 'NO'}`);
    
    if (!authToken) {
      console.log('⚠️ Test 2 SKIP: No auth token available');
    } else {
      // Test with auth token
      const testSocket = io('https://staffnest-backend-production.up.railway.app', {
        auth: { token: authToken },
        transports: ['websocket', 'polling'],
        forceNew: true,
        timeout: 5000,
      });

      // Set up test listeners
      testSocket.on('connect', () => {
        console.log('✅ Test 2 PASS: Socket.io connected with auth token');
        // Test emit/receive
        testSocket.emit('test_ping', { timestamp: Date.now() });
        
        // Clean up after test
        setTimeout(() => {
          testSocket.disconnect();
        }, 1000);
      });

      testSocket.on('connect_error', (error) => {
        console.error('❌ Test 2 FAIL: Socket.io connection error:', error.message);
        testSocket.disconnect();
      });

      testSocket.on('test_pong', (data) => {
        console.log('✅ Test 2: Received test response:', data);
      });

      testSocket.on('disconnect', (reason) => {
        console.log(`🔒 Test 2: Socket disconnected. Reason: ${reason}`);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (testSocket.connected) {
          console.log('⏱️ Test 2: Connection timeout - cleaning up');
          testSocket.disconnect();
        }
      }, 10000);
    }
  } catch (error) {
    console.error('❌ Test 2 FAIL: Socket.io test error:', error);
  }

  // Test 3: Test HTTP endpoint availability
  console.log('\n🔍 Test 3: Testing HTTP endpoints...');
  try {
    const response = await fetch('https://staffnest-backend-production.up.railway.app', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log(`✅ Test 3 PASS: Server is reachable. Status: ${response.status}`);
    
    // Try to get server info if available
    try {
      const data = await response.json();
      console.log('📊 Server info:', data);
    } catch {
      console.log('ℹ️ No JSON response from server root');
    }
  } catch (error) {
    console.error('❌ Test 3 FAIL: HTTP test failed:', error);
  }

  // Test 4: Test specific socket.io path
  console.log('\n🔍 Test 4: Testing socket.io handshake...');
  try {
    const response = await fetch('https://staffnest-backend-production.up.railway.app/socket.io/?EIO=4&transport=polling', {
      method: 'GET',
    });
    
    console.log(`✅ Test 4 PASS: Socket.io handshake successful. Status: ${response.status}`);
    
    const text = await response.text();
    if (text.includes('sid')) {
      console.log('✅ Socket.io session ID found');
    } else {
      console.log('⚠️ Unexpected handshake response:', text.substring(0, 100));
    }
  } catch (error) {
    console.error('❌ Test 4 FAIL: Socket.io handshake test failed:', error);
  }

  // Test 5: Test with current socket instance
  console.log('\n🔍 Test 5: Testing current socket instance...');
  if (this.socket) {
    console.log(`ℹ️ Current socket status:`);
    console.log(`  - Connected: ${this.socket.connected}`);
    console.log(`  - ID: ${this.socket.id || 'No ID'}`);
    console.log(`  - Active: ${!!this.socket}`);
    
    // Try to ping the server if connected
    if (this.socket.connected) {
      this.socket.emit('ping', { test: Date.now() });
      console.log('✅ Test 5: Ping sent to server');
    } else {
      console.log('⚠️ Test 5: Socket exists but not connected');
    }
  } else {
    console.log('ℹ️ Test 5: No active socket instance');
  }

  console.log('\n🔍 Test 6: Testing AsyncStorage token...');
  try {
    const tokens = {
      authToken: await AsyncStorage.getItem('authToken'),
      authaccess_token: await AsyncStorage.getItem('authaccess_token'),
      access_token: await AsyncStorage.getItem('access_token'),
    };
    
    console.log('🔑 Available tokens:', tokens);
    
    // Find which token we should use
    const activeToken = tokens.authaccess_token || tokens.access_token || tokens.authToken;
    if (activeToken) {
      
      // Validate token format (simple JWT check)
      if (activeToken.includes('.')) {
        const parts = activeToken.split('.');
        console.log(`  - Token appears to be JWT with ${parts.length} parts`);
        try {
          const payload = JSON.parse(atob(parts[1]));
          console.log(`  - Token payload:`, {
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiry',
            iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'No issue time',
            sub: payload.sub || 'No user ID',
            role: payload.role || 'No role',
          });
        } catch {
          console.log('  - Could not decode token payload');
        }
      }
    } else {
      console.log('❌ Test 6 FAIL: No auth tokens found');
    }
  } catch (error) {
    console.error('❌ Test 6 FAIL: Token test error:', error);
  }

  console.log('\n🎯 Connection tests completed!');
}

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.emitEvent('connect', {});
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.emitEvent('connect_error', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.emitEvent('disconnect', { reason });
    });

    this.socket.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      this.emitEvent('new_message', data);
    });

    this.socket.on('message_sent', (data) => {
      console.log('✅ Message sent confirmation:', data);
      this.emitEvent('message_sent', data);
    });

    this.socket.on('conversation_updated', (data) => {
      console.log('🔄 Conversation updated:', data);
      this.emitEvent('conversation_updated', data);
    });

    this.socket.on('user_typing', (data) => {
      console.log('✍️ User typing:', data);
      this.emitEvent('user_typing', data);
    });

    this.socket.on('user_stop_typing', (data) => {
      console.log('⏹️ User stopped typing:', data);
      this.emitEvent('user_stop_typing', data);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.emitEvent('error', error);
    });
  }

  joinConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  sendTyping(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { conversationId });
    }
  }

  sendStopTyping(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('stop_typing', { conversationId });
    }
  }

  sendMessage(data: {
    conversationId: string;
    content: string;
    senderId: string;
    isEncrypted?: boolean;
    messageHash?: string;
    replyTo?: string;
    messageId?: string;
    createdAt?: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', data);
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
      callbacks.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();