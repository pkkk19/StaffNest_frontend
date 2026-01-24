import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import io, { Socket } from 'socket.io-client';
import { BASE_URL } from '@/services/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const auth = useAuth();
  const user = auth.user;
  const authToken = (auth as any).authToken ?? (auth as any).token ?? (auth as any).accessToken ?? null;
  const { loadMessages, loadConversations } = useChat();

  useEffect(() => {
    if (!user || !authToken) return;

    // Initialize socket connection - use your backend URL
    const newSocket = io(BASE_URL, {
      auth: {
        token: authToken,
      },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('new_message', (message) => {
      // Handle new incoming message
      console.log('New message received:', message);
      // You might want to update your chat context here
    });

    newSocket.on('user_typing', (data) => {
      // Handle typing indicators
      console.log('User typing:', data);
    });

    newSocket.on('new_friend_request', (request) => {
      // Handle new friend request notification
      console.log('New friend request:', request);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, authToken]);

  const joinConversation = (conversationId: string) => {
    if (socket) {
      socket.emit('join_conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socket) {
      socket.emit('leave_conversation', conversationId);
    }
  };

  const sendTypingStart = (conversationId: string) => {
    if (socket && user) {
      socket.emit('typing_start', { conversationId, userId: user._id });
    }
  };

  const sendTypingStop = (conversationId: string) => {
    if (socket && user) {
      socket.emit('typing_stop', { conversationId, userId: user._id });
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      joinConversation,
      leaveConversation,
      sendTypingStart,
      sendTypingStop
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}