// app/chat/hooks/useChat.ts - FIXED VERSION (No Duplicates)
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';
import { socketService } from '@/services/socketService';
import { notificationService } from '@/services/notificationService';
import { encryptionService } from '@/services/encryptionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  decrypted?: boolean;
  decryptionError?: boolean;
  decryptedContent?: string;
  edited?: boolean;
}

interface Conversation {
  _id: string;
  name?: string;
  participants: any[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

// Key for storing encryption preference
const ENCRYPTION_PREF_KEY = 'chat_encryption_preference';

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
  const [replyMessage, setReplyMessage] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string>('');
  const [useEncryption, setUseEncryption] = useState<boolean>(true);
  
  const { user } = useAuth();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const messagesRef = useRef<Message[]>([]);
  const userRef = useRef(user);
  const socketConnectedRef = useRef(false);
  
  // Track processed messages to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set());
  const pendingTempMessages = useRef<Map<string, {tempId: string, content: string, createdAt: string, isFromCurrentUser: boolean}>>(new Map());
  const isProcessingMessage = useRef<boolean>(false);
  const lastSocketMessageRef = useRef<string | null>(null);

  // Keep refs updated
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Load encryption preference
  useEffect(() => {
    loadEncryptionPreference();
  }, []);

  const loadEncryptionPreference = async () => {
    try {
      const preference = await AsyncStorage.getItem(ENCRYPTION_PREF_KEY);
      if (preference !== null) {
        setUseEncryption(preference === 'true');
      }
    } catch (error) {
      console.error('Failed to load encryption preference:', error);
    }
  };

  const saveEncryptionPreference = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(ENCRYPTION_PREF_KEY, value.toString());
      setUseEncryption(value);
    } catch (error) {
      console.error('Failed to save encryption preference:', error);
    }
  };

  // Initialize encryption and mark conversation as active
  useEffect(() => {
    if (user?._id && conversationId) {
      chatService.initialize(user._id).catch(error => {
        console.warn('⚠️ Encryption initialization failed:', error);
      });
      
      notificationService.markConversationAsActive(conversationId);
    }

    return () => {
      if (conversationId) {
        notificationService.markConversationAsInactive(conversationId);
      }
      processedMessageIds.current.clear();
      pendingTempMessages.current.clear();
      lastSocketMessageRef.current = null;
    };
  }, [user?._id, conversationId]);

  // Helper to find and update temp message
  const updateTempMessage = useCallback((tempId: string, actualMessage: any, isFromCurrentUser: boolean = true) => {
    console.log(`🔄 Updating temp message ${tempId} with actual message ${actualMessage._id}`);
    
    setMessages(prev => {
      const newMessages = prev.map(msg => {
        // Update the temp message with actual message data
        if (msg._id === tempId) {
          console.log(`✅ Found and updated temp message: ${tempId} -> ${actualMessage._id}`);
          return {
            ...actualMessage,
            _id: actualMessage._id,
            sender: isFromCurrentUser ? {
              ...actualMessage.sender,
              _id: userRef.current?._id || actualMessage.sender?._id,
              first_name: userRef.current?.first_name || actualMessage.sender?.first_name,
              last_name: userRef.current?.last_name || actualMessage.sender?.last_name
            } : actualMessage.sender,
            readBy: [userRef.current?._id || actualMessage.sender?._id],
            isSending: false,
            temp: false,
            isEncrypted: actualMessage.isEncrypted || useEncryption,
            content: actualMessage.decryptedContent || actualMessage.content || msg.content,
          };
        }
        return msg;
      });
      
      // Filter out any duplicate actual messages
      const filteredMessages = newMessages.filter((msg, index, self) => {
        // Keep first occurrence of each message ID
        return index === self.findIndex(m => m._id === msg._id);
      });
      
      return filteredMessages;
    });
    
    // Remove from pending temp messages
    pendingTempMessages.current.delete(tempId);
    if (actualMessage._id) {
      processedMessageIds.current.add(actualMessage._id);
    }
  }, [useEncryption]);

  // Load messages
  const loadMessages = useCallback(async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        processedMessageIds.current.clear();
        pendingTempMessages.current.clear();
        lastSocketMessageRef.current = null;
      } else {
        setLoadingMore(true);
      }

      const result = await chatService.getMessages(conversationId, pageNum);
      
      // Filter out any messages already processed to prevent duplicates
      const newMessages = (result.messages || []).filter((msg: any) => {
        const shouldKeep = !processedMessageIds.current.has(msg._id);
        if (!shouldKeep) {
          console.log(`🔄 Skipping already processed message: ${msg._id}`);
        }
        return shouldKeep;
      });
      
      // Add new message IDs to processed set
      newMessages.forEach((msg: any) => {
        processedMessageIds.current.add(msg._id);
      });
      
      if (pageNum === 1) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
      }
      
      setHasMore(result.hasMore);
      setPage(pageNum);
      
      // Load conversation details
      if (pageNum === 1) {
        try {
          const conversations = await chatService.getConversations();
          const foundConversation = conversations.find((c: any) => c._id === conversationId);
          if (foundConversation) {
            setConversation(foundConversation);
          }
        } catch (error) {
          console.error('Error loading conversation:', error);
        }
      }
      
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

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (!conversationId || !user?._id) return;

    console.log('🔌 Setting up socket listeners for conversation:', conversationId);
    
    // Track socket connection
    const checkSocketConnection = () => {
      const isConnected = socketService.isConnected();
      socketConnectedRef.current = isConnected;
      
      if (isConnected) {
        console.log(`🎯 Joining conversation room: ${conversationId}`);
        chatService.joinConversationRoom(conversationId, user._id);
      }
    };
    
    checkSocketConnection();

    // Handle incoming socket messages
    const handleIncomingMessage = (messageData: any) => {
      if (isProcessingMessage.current) {
        console.log('⏳ Another message processing in progress, skipping');
        return;
      }
      
      isProcessingMessage.current = true;
      
      try {
        console.log('📨 SOCKET MESSAGE RECEIVED:', {
          messageId: messageData._id,
          conversationId: messageData.conversationId,
          senderId: messageData.sender?._id,
          isFromCurrentUser: messageData.sender?._id === user._id
        });
        
        if (messageData.conversationId !== conversationId) {
          console.log('❌ Message not for this conversation, ignoring');
          return;
        }
        
        const isFromCurrentUser = messageData.sender?._id === user._id;
        
        // Check if this is the same as last socket message (prevent echo duplicates)
        const messageKey = `${messageData._id}-${messageData.sender?._id}-${messageData.content}`;
        if (lastSocketMessageRef.current === messageKey) {
          console.log('🔄 Same as last socket message, skipping');
          return;
        }
        lastSocketMessageRef.current = messageKey;
        
        // Check if we've already processed this message
        if (messageData._id && processedMessageIds.current.has(messageData._id)) {
          console.log('🔄 Message already processed, skipping');
          
          // CRITICAL: Still check if this is a socket echo for a temp message from current user
          if (isFromCurrentUser) {
            const pendingTempId = Array.from(pendingTempMessages.current.entries())
              .find(([tempId, tempData]) => {
                return tempData.isFromCurrentUser && (
                  tempData.content === messageData.content ||
                  Math.abs(
                    new Date(tempData.createdAt).getTime() - 
                    new Date(messageData.createdAt || Date.now()).getTime()
                  ) < 3000
                );
              });
            
            if (pendingTempId) {
              const [tempId] = pendingTempId;
              console.log(`🔄 Found matching temp message for socket echo: ${tempId}`);
              // Remove the temp message and replace with socket message
              setMessages(prev => prev.filter(msg => msg._id !== tempId));
              
              // Process the socket message normally below
            } else {
              isProcessingMessage.current = false;
              return;
            }
          } else {
            isProcessingMessage.current = false;
            return;
          }
        }
        
        // AUTO-DECRYPT using encryption service
        let content = messageData.content;
        let isEncrypted = messageData.isEncrypted || false;
        
        if (isEncrypted && content) {
          content = encryptionService.getDecryptedContent(content, true);
          // If decryption failed, keep encrypted content
          if (content === messageData.content && messageData.content !== '') {
            console.log('⚠️ Decryption may have failed for encrypted message');
          }
        }
        
        // FIX: If message is from current user, check for matching temp message FIRST
        if (isFromCurrentUser) {
          const pendingTempId = Array.from(pendingTempMessages.current.entries())
            .find(([tempId, tempData]) => {
              return tempData.isFromCurrentUser && (
                tempData.content === content ||
                Math.abs(
                  new Date(tempData.createdAt).getTime() - 
                  new Date(messageData.createdAt || Date.now()).getTime()
                ) < 3000
              );
            });
          
          if (pendingTempId) {
            const [tempId] = pendingTempId;
            console.log(`🔄 Found matching temp message for current user: ${tempId}`);
            
            // Remove the temp message and replace with socket message
            pendingTempMessages.current.delete(tempId);
            
            // Add to processed set immediately
            if (messageData._id) {
              processedMessageIds.current.add(messageData._id);
            }
            
            // Create processed message
            const processedMessage: Message = {
              ...messageData,
              content: content,
              isEncrypted: isEncrypted,
              sender: {
                ...messageData.sender,
                _id: messageData.sender?._id || 'unknown',
                first_name: messageData.sender?.first_name || 'You',
                last_name: messageData.sender?.last_name || '',
                profile_picture_url: messageData.sender?.profile_picture_url
              },
              readBy: [...(messageData.readBy || []), user._id].filter(Boolean),
              isSending: false,
              temp: false
            };
            
            // Replace temp message with socket message
            setMessages(prev => {
              const filtered = prev.filter(msg => msg._id !== tempId);
              
              // Check if message already exists
              const alreadyExists = filtered.some(msg => msg._id === processedMessage._id);
              if (alreadyExists) {
                console.log('⚠️ Duplicate message detected, skipping');
                return filtered;
              }
              
              return [...filtered, processedMessage];
            });
            
            isProcessingMessage.current = false;
            return;
          }
        }
        
        // Add to processed set immediately to prevent duplicates
        if (messageData._id) {
          processedMessageIds.current.add(messageData._id);
        }
        
        // Create processed message
        const processedMessage: Message = {
          ...messageData,
          content: content,
          isEncrypted: isEncrypted,
          sender: {
            ...messageData.sender,
            _id: messageData.sender?._id || 'unknown',
            first_name: messageData.sender?.first_name || 'Unknown',
            last_name: messageData.sender?.last_name || 'User',
            profile_picture_url: messageData.sender?.profile_picture_url
          },
          readBy: [...(messageData.readBy || []), user._id].filter(Boolean)
        };
        
        console.log('📝 Adding new socket message to state:', {
          id: processedMessage._id,
          fromCurrentUser: isFromCurrentUser,
          senderId: processedMessage.sender._id
        });
        
        // Add to messages with deduplication check
        setMessages(prev => {
          // Check if message already exists
          const alreadyExists = prev.some(msg => 
            msg._id === processedMessage._id || 
            (isFromCurrentUser && msg._id?.startsWith('temp-') && msg.content === processedMessage.content)
          );
          
          if (alreadyExists) {
            console.log('⚠️ Duplicate message detected in state update, skipping');
            return prev;
          }
          
          return [...prev, processedMessage];
        });
        
        // Mark as read in backend if not from current user
        if (!isFromCurrentUser && messageData._id) {
          chatService.markAsRead(conversationId, [messageData._id]).catch(error => {
            console.error('Failed to mark socket message as read:', error);
          });
        }
        
      } catch (error) {
        console.error('❌ Error processing socket message:', error);
      } finally {
        setTimeout(() => {
          isProcessingMessage.current = false;
        }, 50);
      }
    };

    // Handle typing indicators
    const handleTyping = (data: any) => {
      console.log('✍️ Typing indicator received:', data);
      if (data.conversationId === conversationId && data.userId !== user._id) {
        setIsTyping(true);
        setTypingUser(data.userName || 'Someone');
        
        // Clear previous timeout
        if (typingTimeoutRef.current !== null) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Auto hide typing indicator after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setTypingUser('');
          typingTimeoutRef.current = null;
        }, 3000);
      }
    };

    const handleStopTyping = (data: any) => {
      console.log('✋ Stop typing received:', data);
      if (data.conversationId === conversationId && data.userId !== user._id) {
        setIsTyping(false);
        setTypingUser('');
        
        if (typingTimeoutRef.current !== null) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    };

    // Handle message read confirmations
    const handleMessageRead = (data: any) => {
      if (data.conversationId === conversationId) {
        // Update read status for messages
        setMessages(prev => prev.map(msg => {
          if (data.messageIds.includes(msg._id) && !msg.readBy.includes(data.userId)) {
            return {
              ...msg,
              readBy: [...msg.readBy, data.userId]
            };
          }
          return msg;
        }));
      }
    };

    // Handle socket connection events
    const handleSocketConnect = () => {
      console.log('🔌 Socket connected, joining conversation');
      socketConnectedRef.current = true;
      chatService.joinConversationRoom(conversationId, user._id);
    };

    const handleSocketDisconnect = () => {
      console.log('🔌 Socket disconnected');
      socketConnectedRef.current = false;
    };

    // Handle app state changes to mark messages as read
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      appStateRef.current = nextAppState;
      
      if (nextAppState === 'active') {
        // Mark all unread messages as read when app becomes active
        const currentMessages = messagesRef.current;
        const currentUser = userRef.current;
        
        const unreadMessages = currentMessages.filter(msg => 
          !msg.isSending && 
          msg.sender._id !== currentUser?._id && 
          !msg.readBy.includes(currentUser?._id || '')
        );
        
        if (unreadMessages.length > 0 && currentUser?._id) {
          const messageIds = unreadMessages.map(msg => msg._id);
          chatService.markAsRead(conversationId, messageIds).catch(console.error);
          
          // Update local state
          setMessages(prev => prev.map(msg => ({
            ...msg,
            readBy: msg.sender._id !== currentUser._id ? [...msg.readBy, currentUser._id] : msg.readBy
          })));
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Listen to socket events
    console.log('👂 Registering socket listeners');
    socketService.on('new_message', handleIncomingMessage);
    socketService.on('message_sent', handleIncomingMessage);
    socketService.on('user_typing', handleTyping);
    socketService.on('user_stop_typing', handleStopTyping);
    socketService.on('messages_read', handleMessageRead);
    socketService.on('connect', handleSocketConnect);
    socketService.on('disconnect', handleSocketDisconnect);

    return () => {
      console.log(`🚪 Cleaning up socket listeners for ${conversationId}`);
      
      // Leave conversation room
      chatService.leaveConversationRoom(conversationId);
      
      // Clean up typing timeout
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      // Clean up listeners
      socketService.off('new_message', handleIncomingMessage);
      socketService.off('message_sent', handleIncomingMessage);
      socketService.off('user_typing', handleTyping);
      socketService.off('user_stop_typing', handleStopTyping);
      socketService.off('messages_read', handleMessageRead);
      socketService.off('connect', handleSocketConnect);
      socketService.off('disconnect', handleSocketDisconnect);
      
      // Clean up app state listener
      subscription.remove();
      
      // Reset processing flag
      isProcessingMessage.current = false;
      lastSocketMessageRef.current = null;
    };
  }, [conversationId, user?._id, updateTempMessage]);

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

  // Handle typing indicators
  const handleTypingStop = useCallback(() => {
    if (!conversationId || !user?._id) return;
    
    console.log('✋ Sending typing stop');
    chatService.sendStopTypingIndicator(conversationId, user._id);
  }, [conversationId, user?._id]);

  const handleTypingStart = useCallback(() => {
    if (!conversationId || !user?._id || !newMessage.trim()) return;
    
    console.log('✍️ Sending typing start');
    chatService.sendTypingIndicator(conversationId, user._id);
  }, [conversationId, user?._id, newMessage]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || !user || !conversationId) return;
    
    setSending(true);
    
    // Send stop typing indicator
    if (typingTimeoutRef.current !== null) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    handleTypingStop();
    
    try {
      // Generate a reliable temp ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare temp message for immediate display
      const tempMessage: Message = {
        _id: tempId,
        content: newMessage,
        sender: {
          _id: user._id,
          first_name: user.first_name || 'You',
          last_name: user.last_name || '',
          profile_picture_url: user.profile_picture_url
        },
        conversationId: conversationId,
        createdAt: new Date().toISOString(),
        readBy: [user._id],
        isSending: true,
        temp: true,
        isEncrypted: useEncryption,
      };
      
      console.log('📤 Creating temp message:', tempId);
      
      // Store in pending temp messages
      pendingTempMessages.current.set(tempId, {
        tempId,
        content: newMessage,
        createdAt: new Date().toISOString(),
        isFromCurrentUser: true,
      });
      
      // Add temp message to state
      setMessages(prev => {
        // Remove any other sending messages with same content to prevent duplicates
        const filtered = prev.filter(msg => 
          !(msg.isSending && msg.temp && msg.content === newMessage)
        );
        return [...filtered, tempMessage];
      });
      
      const messageToSend = newMessage;
      setNewMessage('');
      
      // Clear reply if exists
      if (replyMessage) {
        setReplyMessage(null);
      }
      
      // Send the actual message
      console.log('📤 Sending actual message via API...', { useEncryption });
      
      let sentMessage;
      if (useEncryption) {
        sentMessage = await chatService.sendEncryptedMessage(
          conversationId, 
          messageToSend, 
          user._id,
          {
            replyTo: replyMessage?._id,
            socketEmit: true
          }
        );
      } else {
        sentMessage = await chatService.sendMessage(
          conversationId, 
          messageToSend, 
          user._id,
          {
            replyTo: replyMessage?._id,
            socketEmit: true,
            encrypt: false
          }
        );
      }
      
      console.log('✅ Message sent via API:', sentMessage._id);
      
      // CRITICAL: Add to processed set immediately to prevent socket duplicate
      processedMessageIds.current.add(sentMessage._id);
      
      // Now wait for the socket message to replace the temp message
      // Don't immediately update the temp message - let socket do it
      
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => 
        !(msg._id?.startsWith('temp-') && msg.content === newMessage)
      ));
      
      // Clear all pending temp messages with this content
      for (const [tempId, tempData] of pendingTempMessages.current.entries()) {
        if (tempData.content === newMessage && tempData.isFromCurrentUser) {
          pendingTempMessages.current.delete(tempId);
        }
      }
      
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [newMessage, conversationId, user, sending, replyMessage, useEncryption, handleTypingStop]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      processedMessageIds.current.delete(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  }, []);

  // Update message
  const updateMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const updated = await chatService.updateMessage(messageId, content, useEncryption);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { 
          ...msg, 
          ...updated,
          content: content,
          edited: true,
          updatedAt: new Date().toISOString()
        } : msg
      ));
    } catch (error) {
      console.error('Error updating message:', error);
      Alert.alert('Error', 'Failed to update message');
    }
  }, [useEncryption]);

  // Toggle encryption preference
  const toggleEncryption = async () => {
    const newValue = !useEncryption;
    await saveEncryptionPreference(newValue);
    return newValue;
  };

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
    replyMessage,
    setReplyMessage,
    isTyping,
    typingUser,
    handleTypingStart,
    handleTypingStop,
    useEncryption,
    toggleEncryption,
    saveEncryptionPreference,
  };
};