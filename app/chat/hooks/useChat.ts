// app/chat/hooks/useChat.ts - UPDATED VERSION
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';
import { socketService } from '@/services/socketService';

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
  readBy: string[];
  isEncrypted?: boolean;
  isSending?: boolean;
  temp?: boolean;
  replyTo?: any;
}

interface Conversation {
  _id: string;
  name?: string;
  participants: any[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // Add replyMessage state here
  const [replyMessage, setReplyMessage] = useState<any>(null);
  
  const { user } = useAuth();

  // Initialize encryption when user is available
  useEffect(() => {
    if (user?._id) {
      chatService.initialize(user._id).catch(error => {
        console.warn('⚠️ Encryption initialization failed:', error);
      });
    }
  }, [user?._id]);

  // Load conversation
  useEffect(() => {
    const loadConversation = async () => {
      try {
        // You'll need to implement this API endpoint or fetch from conversations list
        // For now, we'll just set a basic conversation object
        setConversation({
          _id: conversationId,
          participants: [],
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    };

    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  // Load messages
  const loadMessages = useCallback(async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await chatService.getMessages(conversationId, pageNum);
      
      if (pageNum === 1) {
        setMessages(result.messages || []);
      } else {
        setMessages(prev => [...prev, ...(result.messages || [])]);
      }
      
      setHasMore(result.hasMore);
      setPage(pageNum);
      
    } catch (error: any) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    if (conversationId) {
      loadMessages(1);
    }
  }, [conversationId, loadMessages]);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    
    await loadMessages(page + 1);
  }, [hasMore, loadingMore, loading, page, loadMessages]);

  // Refresh messages
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessages(1);
    setRefreshing(false);
  }, [loadMessages]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || !user) return;
    
    setSending(true);
    
    try {
      // Prepare temp message for immediate display
      const tempMessage: Message = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        content: newMessage,
        sender: user,
        conversationId: conversationId,
        createdAt: new Date().toISOString(),
        readBy: [user._id],
        isSending: true,
        temp: true,
        isEncrypted: false,
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      // Send the actual message with encryption
      const sentMessage = await chatService.sendMessage(
        conversationId, 
        newMessage, 
        user._id,
        {
          encrypt: true,
          replyTo: replyMessage?._id
        }
      );
      
      // Replace temp message with actual message
      setMessages(prev => prev.map(msg => 
        msg._id === tempMessage._id ? sentMessage : msg
      ));
      
      // Clear reply if exists
      if (replyMessage) {
        setReplyMessage(null);
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.temp));
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [newMessage, conversationId, user, sending, replyMessage]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  }, []);

  // Update message
  const updateMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const updated = await chatService.updateMessage(messageId, content, true);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, ...updated } : msg
      ));
    } catch (error) {
      console.error('Error updating message:', error);
      Alert.alert('Error', 'Failed to update message');
    }
  }, []);

  // Setup socket listeners for real-time messages
  useEffect(() => {
    if (!conversationId) return;

    // Join conversation room
    chatService.joinConversationRoom(conversationId);

    const handleIncomingMessage = (messageData: any) => {
      if (messageData.conversationId === conversationId) {
        console.log('📨 Real-time message received:', messageData);
        
        // Check if this is a message from current user (via socket echo)
        const isFromCurrentUser = messageData.sender?._id === user?._id;
        
        if (!isFromCurrentUser) {
          setMessages(prev => {
            // Check if message already exists
            const exists = prev.some(msg => msg._id === messageData._id);
            if (exists) return prev;
            
            // Decrypt message if needed
            if (messageData.isEncrypted && messageData.content) {
              try {
                // Message will be decrypted by chatService.getMessages
                // For now, just add it
                return [...prev, messageData];
              } catch (error) {
                console.error('❌ Failed to decrypt incoming message:', error);
                return prev;
              }
            }
            
            return [...prev, messageData];
          });
        }
      }
    };

    const handleTyping = (data: any) => {
      // Handle typing indicators if needed
      console.log('✍️ User typing:', data);
    };

    const handleStopTyping = (data: any) => {
      // Handle stop typing if needed
      console.log('⏹️ User stopped typing:', data);
    };

    // Listen to socket events
    socketService.on('new_message', handleIncomingMessage);
    socketService.on('user_typing', handleTyping);
    socketService.on('user_stop_typing', handleStopTyping);

    return () => {
      // Leave conversation room
      chatService.leaveConversationRoom(conversationId);
      
      // Clean up listeners
      socketService.off('new_message', handleIncomingMessage);
      socketService.off('user_typing', handleTyping);
      socketService.off('user_stop_typing', handleStopTyping);
    };
  }, [conversationId, user?._id]);

  return {
    messages,
    conversation,
    newMessage,
    setNewMessage,
    loading,
    sending,
    refreshing,
    loadingMore,
    hasMore,
    sendMessage,
    onRefresh,
    loadMoreMessages,
    user,
    deleteMessage,
    updateMessage,
    // Export replyMessage and setReplyMessage
    replyMessage,
    setReplyMessage,
  };
};