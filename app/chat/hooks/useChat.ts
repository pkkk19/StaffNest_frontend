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

  const loadConversationDetails = useCallback(async (conversationIdStr: string) => {
    try {
      // Get conversations list to find this specific conversation
      const conversations = await chatService.getConversations();
      const currentConversation = conversations.find(
        (conv: any) => conv._id === conversationIdStr
      );
      
      if (currentConversation) {
        console.log('✅ Conversation details loaded');
        setConversation(currentConversation);
      } else {
        // Fallback if conversation not found in list
        console.log('⚠️ Using fallback conversation data');
        setConversation({
          _id: conversationIdStr,
          participants: [],
          name: 'Unknown Conversation'
        });
      }
    } catch (error) {
      console.error('Error loading conversation details:', error);
      // Basic fallback
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
      
      // Load conversation details on initial load
      if (!loadMore) {
        await loadConversationDetails(conversationIdStr);
      }

      const currentPage = loadMore ? page + 1 : 1;
      
      const response = await chatService.getMessages(conversationIdStr, currentPage, 30);

      if (response.messages && response.messages.length > 0) {
        // Sort messages by createdAt in ascending order (oldest first)
        const sortedMessages = [...response.messages].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        if (loadMore) {
          setMessages(prev => [...sortedMessages, ...prev]);
          setPage(currentPage);
        } else {
          setMessages(sortedMessages);
        }
        
        setHasMore(response.hasMore);
      } else if (!loadMore) {
        setMessages([]);
        setHasMore(false);
      }
      
    } catch (error: any) {
      console.error('Error loading chat:', error);
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
    setNewMessage('');
    setSending(true);

    try {
      const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;
      const sentMessage = await chatService.sendMessage(conversationIdStr, messageToSend);
      
      setMessages(prev => [...prev, sentMessage]);
      isAtBottomRef.current = true;
      
    } catch (error: any) {
      console.error('Send message error:', error);
      Alert.alert('Error', error.message || 'Failed to send message');
      setNewMessage(messageToSend);
    } finally {
      setSending(false);
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

  // WebSocket setup
  useEffect(() => {
    let isSubscribed = true;

    const setupWebSocket = async () => {
      if (!conversationId || !isSubscribed) return;
      
      try {
        const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;
        await socketService.connect();
        await socketService.joinConversation(conversationIdStr);
        
        const handleNewMessage = (newMessage: any) => {
          if (!isSubscribed) return;
          
          setMessages(prev => {
            if (prev.some(msg => msg._id === newMessage._id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        };
        
        socketService.on('new_message', handleNewMessage);
        
        return () => {
          socketService.off('new_message', handleNewMessage);
          socketService.leaveConversation(conversationIdStr);
        };
        
      } catch (error) {
        console.error('WebSocket setup failed:', error);
      }
    };

    const cleanup = setupWebSocket();
    
    return () => {
      isSubscribed = false;
      cleanup?.then(fn => fn?.());
    };
  }, [conversationId]);

  // Load data on mount
  useEffect(() => {
    loadChatData();
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
    user
  };
};