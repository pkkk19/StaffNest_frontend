// app/chat/hooks/useChat.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { chatService } from '@/services/chatService';
import { socketService } from '@/services/socketService';
import { useAuth } from '@/contexts/AuthContext';

export const useChat = (conversationId: string | string[]) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const isAtBottomRef = useRef(true);
  const tempMessagesRef = useRef<Map<string, string>>(new Map()); // tempId -> realId mapping
  const pendingMessagesRef = useRef<Set<string>>(new Set()); // Track messages being sent
  const socketInitializedRef = useRef(false);

  const loadConversationDetails = useCallback(async (conversationIdStr: string) => {
    try {
      const conversations = await chatService.getConversations();
      const currentConversation = conversations.find(
        (conv: any) => conv._id === conversationIdStr
      );
      
      if (currentConversation) {
        console.log('✅ Conversation details loaded');
        setConversation(currentConversation);
      } else {
        console.log('⚠️ Using fallback conversation data');
        setConversation({
          _id: conversationIdStr,
          participants: [],
          name: 'Unknown Conversation'
        });
      }
    } catch (error) {
      console.error('Error loading conversation details:', error);
      setConversation({
        _id: conversationIdStr,
        participants: [],
        name: 'Unknown Conversation'
      });
    }
  }, []);

  const loadChatData = useCallback(async (loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
        setHasMore(true);
      }

      const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;
      
      if (!loadMore) {
        await loadConversationDetails(conversationIdStr);
      }

      const currentPage = loadMore ? page + 1 : 1;
      
      const response = await chatService.getMessages(conversationIdStr, currentPage, 30);
      console.log('📱 Loaded messages:', response.messages?.length || 0);

      if (response.messages && response.messages.length > 0) {
        // Sort messages by createdAt in ASCENDING order (oldest first, newest last)
        const sortedMessages = [...response.messages].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        console.log('📊 Sorted messages count:', sortedMessages.length);

        // Simplified filtering - only filter out temp messages we know about
        const filteredMessages = sortedMessages.filter(msg => {
          // Check if this message ID is mapped from a temp ID
          const isMappedTemp = Array.from(tempMessagesRef.current.values()).includes(msg._id);
          return !isMappedTemp;
        });

        console.log('✅ Filtered messages count:', filteredMessages.length);

        if (loadMore) {
          // When loading more, add to the BEGINNING (since we're loading older messages)
          setMessages(prev => {
            // Combine and remove duplicates by ID
            const allMessages = [...filteredMessages, ...prev];
            const uniqueMessages = allMessages.filter((msg, index, self) =>
              index === self.findIndex(m => m._id === msg._id)
            );
            return uniqueMessages;
          });
          setPage(currentPage);
        } else {
          // Initial load, set the messages
          setMessages(filteredMessages);
          // Auto-scroll to bottom after initial load
          setTimeout(() => {
            isAtBottomRef.current = true;
          }, 100);
        }
        
        setHasMore(response.hasMore);
      } else if (!loadMore) {
        console.log('📭 No messages found');
        setMessages([]);
        setHasMore(false);
      }
      
    } catch (error: any) {
      console.error('❌ Error loading chat:', error);
      if (!loadMore) {
        Alert.alert('Error', 'Failed to load chat messages');
      }
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [conversationId, page, loadConversationDetails]);

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;
    await loadChatData(true);
  };

  const sendMessage = async () => {
    if (!conversationId || !newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    const content = messageToSend;
    setNewMessage('');
    setSending(true);

    // Generate a unique temporary ID for the optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Track this content as pending
    pendingMessagesRef.current.add(tempId);

    // Create optimistic message
    const optimisticMessage = {
      _id: tempId,
      content: content,
      sender: user,
      conversationId: Array.isArray(conversationId) ? conversationId[0] : conversationId,
      createdAt: new Date().toISOString(),
      isSending: true,
      status: 'sending',
      readBy: [user?._id] // Initially marked as read by sender
    };

    console.log('📤 Sending optimistic message:', optimisticMessage._id);

    // Add optimistic message
    setMessages(prev => [...prev, optimisticMessage]);
    isAtBottomRef.current = true;

    try {
      const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;
      const sentMessage = await chatService.sendMessage(conversationIdStr, content);
      
      console.log('✅ Message sent successfully:', sentMessage._id);
      
      // Map temp ID to real ID
      tempMessagesRef.current.set(tempId, sentMessage._id);
      
      // Remove the optimistic message and add the real one
      setMessages(prev => {
        // Remove the optimistic message by its temp ID
        const filtered = prev.filter(msg => msg._id !== tempId);
        
        // Check if the real message already exists (from WebSocket)
        if (!filtered.some(msg => msg._id === sentMessage._id)) {
          console.log('➕ Adding real message to state');
          return [...filtered, sentMessage];
        }
        console.log('🔄 Real message already exists, keeping as is');
        return filtered;
      });
      
      // Remove from pending set
      pendingMessagesRef.current.delete(tempId);
      
    } catch (error: any) {
      console.error('❌ Send message error:', error);
      
      // Update the optimistic message to show error state
      setMessages(prev => prev.map(msg => 
        msg._id === tempId 
          ? { ...msg, error: true, status: 'failed', errorMessage: error.message }
          : msg
      ));
      
      // Keep in temp set for error handling
      setTimeout(() => {
        tempMessagesRef.current.delete(tempId);
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        setNewMessage(content);
        pendingMessagesRef.current.delete(tempId);
      }, 3000);
      
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ADDED: Delete message function
  const deleteMessage = async (messageId: string) => {
    try {
      // First, remove the message optimistically
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      
      // TODO: Make API call to delete message from backend
      // await chatService.deleteMessage(messageId);
      
      Alert.alert('Success', 'Message deleted successfully');
    } catch (error: any) {
      console.error('Delete message error:', error);
      Alert.alert('Error', 'Failed to delete message');
      // Reload messages to restore the deleted message
      await loadChatData();
    }
  };

  // ADDED: Update message function
  const updateMessage = async (messageId: string, newContent: string) => {
    try {
      if (!newContent.trim()) return;
      
      // Update optimistically
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, content: newContent, edited: true, updatedAt: new Date().toISOString() }
          : msg
      ));
      
      // TODO: Make API call to update message on backend
      // await chatService.updateMessage(messageId, newContent);
      
      Alert.alert('Success', 'Message updated successfully');
    } catch (error: any) {
      console.error('Update message error:', error);
      Alert.alert('Error', 'Failed to update message');
      // Reload messages to restore original content
      await loadChatData();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatData();
    setRefreshing(false);
  };

  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    const paddingToBottom = 20;
    isAtBottomRef.current = 
      contentOffset.y >= contentSize.height - layoutMeasurement.height - paddingToBottom;
  }, []);

  // WebSocket setup - FIXED VERSION
  useEffect(() => {
    let isSubscribed = true;
    let socketCleanup: (() => void) | undefined;

    const setupWebSocket = async () => {
      if (!conversationId || !isSubscribed) return;
      
      try {
        const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;
        
        console.log('🔌 Setting up WebSocket for conversation:', conversationIdStr);
        
        // Connect to socket if not already connected
        await socketService.connect();
        
        // Join the conversation room
        await socketService.joinConversation(conversationIdStr);
        
        const handleNewMessage = (incomingMessage: any) => {
          if (!isSubscribed) return;
          
          console.log('📨 WebSocket received message:', incomingMessage._id, incomingMessage.content?.substring(0, 50));
          
          // Check if this is our own message via optimistic update
          const isOwnMessage = incomingMessage.sender?._id === user?._id;
          
          setMessages(prev => {
            // Check for duplicates by ID first
            if (prev.some(msg => msg._id === incomingMessage._id)) {
              console.log('🔄 Duplicate message, skipping');
              return prev;
            }
            
            console.log('✅ Adding WebSocket message to state');
            
            // Check if we have a temp message that should be replaced
            const tempId = Array.from(tempMessagesRef.current.entries())
              .find(([_, realId]) => realId === incomingMessage._id)?.[0];
            
            if (tempId) {
              console.log('🔄 Replacing temp message:', tempId, 'with real message:', incomingMessage._id);
              // Replace the temp message with the real one
              const newMessages = prev.map(msg => 
                msg._id === tempId ? incomingMessage : msg
              );
              tempMessagesRef.current.delete(tempId);
              pendingMessagesRef.current.delete(tempId);
              return newMessages;
            }
            
            // If it's our own message but we don't have a temp version, still add it
            // This handles cases where WebSocket arrives before API response
            if (isOwnMessage) {
              console.log('➕ Adding own message from WebSocket');
              return [...prev, incomingMessage];
            }
            
            // For other messages
            console.log('➕ Adding other user message from WebSocket');
            return [...prev, incomingMessage];
          });
        };
        
        // Set up the listener
        socketService.on('new_message', handleNewMessage);
        
        // Return cleanup function
        return () => {
          console.log('🧹 Cleaning up WebSocket for conversation:', conversationIdStr);
          socketService.off('new_message', handleNewMessage);
          socketService.leaveConversation(conversationIdStr);
        };
        
      } catch (error) {
        console.error('❌ WebSocket setup failed:', error);
      }
    };

    setupWebSocket().then(cleanup => {
      socketCleanup = cleanup;
    });
    
    return () => {
      console.log('🧹 Unsubscribing from WebSocket');
      isSubscribed = false;
      if (socketCleanup) {
        socketCleanup();
      }
    };
  }, [conversationId]); // Removed user from dependencies to prevent reconnection on user change

  // Load data on mount
  useEffect(() => {
    console.log('🚀 Initializing chat for conversation:', conversationId);
    loadChatData();
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up chat hook');
      tempMessagesRef.current.clear();
      pendingMessagesRef.current.clear();
    };
  }, [conversationId]);

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
    handleScroll,
    isAtBottomRef,
    user,
    deleteMessage,
    updateMessage,
  };
};