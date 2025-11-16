import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { chatAPI } from '@/services/api';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  conversationId: string;
  createdAt: string;
  readBy: string[];
}

interface Conversation {
  _id: string;
  name?: string;
  participants: Array<{
    _id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
    position?: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  selectConversation: (conversation: Conversation) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatAPI.getConversations();
      setConversations(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load conversations');
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatAPI.getMessages(conversationId);
      setMessages(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load messages');
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      setError(null);
      const response = await chatAPI.sendMessage(conversationId, content);
      const newMessage = response.data;
      
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversations list with new last message
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, lastMessage: newMessage, updatedAt: new Date().toISOString() }
            : conv
        )
      );
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send message');
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      messages,
      loading,
      error,
      sendMessage,
      selectConversation,
      loadConversations,
      loadMessages,
      clearError,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}