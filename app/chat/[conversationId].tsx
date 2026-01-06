// app/chat/[conversationId].tsx
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Easing,
  Keyboard,
  KeyboardEvent
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, Feather, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useChat } from './hooks/useChat';
import { MessageBubble } from './components/MessageBubble';
import { MessageInput } from './components/MessageInput';
import { EmptyChat } from './components/EmptyChat';
import { useChatTheme } from './hooks/useChatTheme';

import { useVideo } from '../../contexts/VideoContext';
// import { VideoCallScreen } from '@/app/calls/VideoCallScreen';
import { CallInvitationModal } from '../../app/calls/callInvitationModal';
import { chatService } from '@/services/chatService';

import { socketService } from '@/services/socketService';

const { width, height } = Dimensions.get('window');

export default function ChatPage() {
  const { conversationId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useChatTheme();
  const flatListRef = useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string>('');
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<any>(null);
  const [editMessage, setEditMessage] = useState<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideButtonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const lastWebSocketMessageIdRef = useRef<string | null>(null);

  const { 
    createAndJoinRoom, 
    showVideoScreen, 
    setShowVideoScreen,
    isInCall 
  } = useVideo();
  
  const {
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
    updateMessage
  } = useChat(conversationId as string);

  const styles = createStyles(colors, isDark, keyboardHeight);
  const [showCallScreen, setShowCallScreen] = useState(false);

  // Typing indicator animation
  const typingAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, [isTyping]);

  // Memoize messages to prevent unnecessary re-renders
  const memoizedMessages = useMemo(() => {
    // Make sure messages are sorted with newest at the end
    return [...messages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  // Track WebSocket messages for auto-scroll
  useEffect(() => {
    if (memoizedMessages.length === 0) return;
    
    const lastMessage = memoizedMessages[memoizedMessages.length - 1];
    if (!lastMessage) return;
    
    // Check if this is a WebSocket message (not from current user, not temp)
    const isWebSocketMessage = lastMessage.sender?._id !== user?._id && 
                               !lastMessage._id?.startsWith('temp-') &&
                               !lastMessage.isSending;
    
    if (isWebSocketMessage && lastMessage._id !== lastWebSocketMessageIdRef.current) {
      lastWebSocketMessageIdRef.current = lastMessage._id;
      
      // Auto-scroll if we're at the bottom
      if (isAtBottom && !isScrollingRef.current) {
        console.log('🔽 Auto-scrolling to WebSocket message:', lastMessage._id);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  }, [memoizedMessages, user, isAtBottom]);

  // Auto-scroll when sending messages
  useEffect(() => {
    if (sending && isAtBottom) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [sending, isAtBottom]);

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        
        // When keyboard shows and we're at bottom, scroll to show the input
        if (isAtBottom && memoizedMessages.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [isAtBottom, memoizedMessages.length]);

  useEffect(() => {
  if (!conversationId || !socketService.isConnected()) return;
  
  // Join the conversation room
  socketService.joinConversation(conversationId as string);
  
  // Set up socket listeners for this conversation
  const handleIncomingMessage = (message: any) => {
    if (message.conversationId === conversationId) {
      console.log('📨 Real-time message received in chat:', message);
      // Update messages in real-time
      // Note: You'll need to update your useChat hook to handle incoming messages
      // or add a state updater here
    }
  };

  const handleUserTyping = (data: any) => {
    if (data.conversationId === conversationId && data.userId !== user?._id) {
      setIsTyping(true);
      setTypingUser(data.userName || 'Someone');
      
      // Auto hide typing indicator after 3 seconds
      setTimeout(() => {
        setIsTyping(false);
        setTypingUser('');
      }, 3000);
    }
  };

  const handleUserStopTyping = (data: any) => {
    if (data.conversationId === conversationId && data.userId !== user?._id) {
      setIsTyping(false);
      setTypingUser('');
    }
  };

  const handleConversationUpdated = (data: any) => {
    if (data._id === conversationId) {
      console.log('🔄 Conversation updated in real-time:', data);
      // Update conversation details if needed
    }
  };

  // Listen to socket events
  socketService.on('new_message', handleIncomingMessage);
  socketService.on('user_typing', handleUserTyping);
  socketService.on('user_stop_typing', handleUserStopTyping);
  socketService.on('conversation_updated', handleConversationUpdated);

  return () => {
    // Leave the conversation room when component unmounts
    if (conversationId) {
      socketService.leaveConversation(conversationId as string);
    }
    
    // Clean up listeners
    socketService.off('new_message', handleIncomingMessage);
    socketService.off('user_typing', handleUserTyping);
    socketService.off('user_stop_typing', handleUserStopTyping);
    socketService.off('conversation_updated', handleConversationUpdated);
  };
}, [conversationId, user?._id]);

  // Hide scroll button after 3 seconds of inactivity
  const hideScrollButton = useCallback(() => {
    if (hideButtonTimeoutRef.current) {
      clearTimeout(hideButtonTimeoutRef.current);
    }
    
    hideButtonTimeoutRef.current = setTimeout(() => {
      if (showScrollToBottom && !isScrollingRef.current) {
        setShowScrollToBottom(false);
      }
    }, 3000);
  }, [showScrollToBottom]);

  // Show scroll button for a limited time
  const showScrollButtonTemporarily = useCallback(() => {
    setShowScrollToBottom(true);
    hideScrollButton();
  }, [hideScrollButton]);

  // Scroll event handler
  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Calculate distance from bottom
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    
    // Consider "at bottom" if within 100 pixels (more generous)
    const atBottom = distanceFromBottom <= 100;
    setIsAtBottom(atBottom);
    
    // Only show scroll-to-bottom button if:
    // 1. Not at bottom
    // 2. Have enough messages
    // 3. Scrolled up at least 150px from bottom
    const shouldShowButton = !atBottom && 
      memoizedMessages.length > 5 && 
      distanceFromBottom > 150;
    
    if (shouldShowButton && !showScrollToBottom) {
      showScrollButtonTemporarily();
    } else if (!shouldShowButton && showScrollToBottom) {
      setShowScrollToBottom(false);
      if (hideButtonTimeoutRef.current) {
        clearTimeout(hideButtonTimeoutRef.current);
      }
    }
    
    // Track scrolling state
    isScrollingRef.current = true;
    
    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set timeout to reset scrolling state
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
    
    // Animate header on scroll
    scrollY.setValue(contentOffset.y);
  }, [memoizedMessages.length, showScrollToBottom, showScrollButtonTemporarily]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (hideButtonTimeoutRef.current) {
        clearTimeout(hideButtonTimeoutRef.current);
      }
    };
  }, []);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    isScrollingRef.current = false;
    flatListRef.current?.scrollToEnd({ animated: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Hide button immediately when clicked
    setShowScrollToBottom(false);
    setIsAtBottom(true);
    
    // Clear any pending hide timeout
    if (hideButtonTimeoutRef.current) {
      clearTimeout(hideButtonTimeoutRef.current);
    }
  }, []);

  // Enhanced key extractor
  const keyExtractor = useCallback((item: any, index: number) => {
    if (item._id?.startsWith('temp-')) return item._id;
    if (item._id) return item._id;
    return `msg-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }, []);

  const getChatUserName = () => {
    if (!conversation) return 'Loading...';
    if (conversation.name) return conversation.name;
    
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(
        (participant: any) => participant._id !== user?._id
      );
      
      if (otherParticipant) {
        return `${otherParticipant.first_name} ${otherParticipant.last_name}`;
      }
      
      const firstParticipant = conversation.participants[0];
      if (firstParticipant) {
        return `${firstParticipant.first_name} ${firstParticipant.last_name}`;
      }
    }
    
    return 'Chat';
  };

  const getChatUserImage = () => {
    if (conversation?.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(
        (participant: any) => participant._id !== user?._id
      );
      
      if (otherParticipant?.profile_picture_url) {
        return otherParticipant.profile_picture_url;
      }
    }
    return null;
  };

  // Animated header background
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const renderMessage = useCallback(({ item, index }: { item: any; index: number }) => {
    const isCurrentUser = item.sender?._id === user?._id;
    const previousMessage = memoizedMessages[index - 1];
    const showAvatar = !previousMessage || previousMessage.sender?._id !== item.sender?._id;
    const showDateSeparator = checkDateSeparator(item, previousMessage);

    return (
      <View>
        {showDateSeparator && renderDateSeparator(item.createdAt)}
        <MessageBubble
          message={item}
          isCurrentUser={isCurrentUser}
          showAvatar={showAvatar}
          user={user}
          onLongPress={() => handleMessageLongPress(item)}
          onReply={() => handleReplyMessage(item)}
          onEdit={() => handleEditMessage(item)}
          onDelete={() => handleDeleteMessage(item)}
          showActions={showMessageActions === item._id}
        />
      </View>
    );
  }, [memoizedMessages, user, showMessageActions]);

  const checkDateSeparator = (current: any, previous: any) => {
    if (!previous) return false;
    const currentDate = new Date(current.createdAt).toDateString();
    const previousDate = new Date(previous.createdAt).toDateString();
    return currentDate !== previousDate;
  };

  const renderDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateText;
    if (date.toDateString() === today.toDateString()) {
      dateText = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateText = 'Yesterday';
    } else {
      dateText = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }

    return (
      <View style={styles.dateSeparatorContainer}>
        <View style={styles.dateSeparatorLine} />
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>{dateText}</Text>
        </View>
        <View style={styles.dateSeparatorLine} />
      </View>
    );
  };

  const handleMessageLongPress = (message: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMessageActions(message._id);
  };

  const handleReplyMessage = (message: any) => {
    setReplyMessage(message);
    setShowMessageActions(null);
  };

  const handleEditMessage = (message: any) => {
    setEditMessage(message);
    setNewMessage(message.content);
    setShowMessageActions(null);
  };

  const handleDeleteMessage = async (message: any) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await deleteMessage(message._id);
            setShowMessageActions(null);
          }
        },
      ]
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={colors.currentUserBubble} />
        <Text style={styles.loadingMoreText}>Loading older messages...</Text>
      </View>
    );
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !isScrollingRef.current) {
      loadMoreMessages();
    }
  };

const handleSendMessage = useCallback(() => {
  if (newMessage.trim()) {
    if (editMessage) {
      updateMessage(editMessage._id, newMessage);
      setEditMessage(null);
    } else {
      sendMessage();
    }
    setNewMessage('');
    setReplyMessage(null);
    // Ensure we're at bottom after sending
    setIsAtBottom(true);
    
    // Send stop typing indicator
    chatService.sendStopTypingIndicator(conversationId as string);
  }
}, [newMessage, editMessage, sendMessage, updateMessage, conversationId]);


const handleTypingStart = () => {
  if (newMessage.trim() && socketService.isConnected()) {
    chatService.sendTypingIndicator(conversationId as string);
  }
};

const handleTypingStop = () => {
  if (socketService.isConnected()) {
    chatService.sendStopTypingIndicator(conversationId as string);
  }
};

  const handleVideoCall = async () => {
    if (!conversation?.participants || !user) return;
    
    const otherParticipant = conversation.participants.find(
      (participant: any) => participant._id !== user._id
    );
    
    if (otherParticipant) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const roomName = `Chat with ${otherParticipant.first_name}`;
      
      try {
        const socket = socketService.getSocket();
        if (socket) {
          socket.emit('video_call_invitation', {
            conversationId: conversationId,
            callerId: user._id,
            callerName: `${user.first_name} ${user.last_name}`,
            roomName,
          });
        }
      } catch (error) {
        console.error('Error sending socket invitation:', error);
      }
      
      await createAndJoinRoom(roomName);
      setShowCallScreen(true);
    }
  };

  const handleVoiceCall = async () => {
    await handleVideoCall();
  };

  const handleAttachFile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowOptionsModal(true);
  };

  // Options Modal
  const renderOptionsModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showOptionsModal}
      onRequestClose={() => setShowOptionsModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setShowOptionsModal(false)}
      >
        <BlurView intensity={80} style={styles.modalBlur}>
          <Pressable style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowOptionsModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionsGrid}>
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={() => {/* Open camera */}}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#FF6B6B' }]}>
                    <Ionicons name="camera" size={24} color="white" />
                  </View>
                  <Text style={styles.optionText}>Camera</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={() => {/* Open gallery */}}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#4ECDC4' }]}>
                    <Ionicons name="image" size={24} color="white" />
                  </View>
                  <Text style={styles.optionText}>Photos</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={() => {/* Open documents */}}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#45B7D1' }]}>
                    <MaterialIcons name="insert-drive-file" size={24} color="white" />
                  </View>
                  <Text style={styles.optionText}>Documents</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={() => {/* Open location */}}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#96CEB4' }]}>
                    <Ionicons name="location" size= {24} color="white" />
                  </View>
                  <Text style={styles.optionText}>Location</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={() => {/* Open contact */}}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#FFD93D' }]}>
                    <Ionicons name="person" size={24} color="white" />
                  </View>
                  <Text style={styles.optionText}>Contact</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </BlurView>
      </Pressable>
    </Modal>
  );

  // Reply Preview Component
  const renderReplyPreview = () => {
    if (!replyMessage) return null;

    return (
      <View style={styles.replyPreview}>
        <View style={styles.replyPreviewContent}>
          <View style={styles.replyPreviewHeader}>
            <Ionicons 
              name="return-up-forward" 
              size={16} 
              color={colors.textTertiary} 
            />
            <Text style={styles.replyPreviewTitle}>
              Replying to {replyMessage.sender?._id === user?._id ? 'yourself' : replyMessage.sender?.first_name}
            </Text>
          </View>
          <Text 
            style={styles.replyPreviewText}
            numberOfLines={2}
          >
            {replyMessage.content}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.replyCancelButton}
          onPress={() => setReplyMessage(null)}
        >
          <Ionicons name="close" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    );
  };

  // Typing Indicator Component
  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    const typingOpacity = typingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1]
    });

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <Animated.View style={[styles.typingDot, { opacity: typingOpacity }]} />
          <Animated.View style={[styles.typingDot, { 
            opacity: typingAnim,
            animationDelay: '100ms'
          }]} />
          <Animated.View style={[styles.typingDot, { 
            opacity: typingAnim,
            animationDelay: '200ms'
          }]} />
        </View>
        <Text style={styles.typingText}>{typingUser} is typing...</Text>
      </View>
    );
  };

  // Enhanced header with gradient and animations
  const renderHeader = () => {
    const chatUserImage = getChatUserImage();
    
    return (
      <Animated.View style={[styles.headerContainer, { opacity: headerBgOpacity }]}>
        <LinearGradient
          colors={isDark ? ['rgba(31, 41, 55, 0.98)', 'rgba(31, 41, 55, 0.9)'] : ['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.9)']}
          style={StyleSheet.absoluteFill}
        />
        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={colors.textPrimary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerUserInfo}
            onPress={() => setShowUserInfo(true)}
          >
            {chatUserImage ? (
              <Image 
                source={{ uri: chatUserImage }} 
                style={styles.headerUserImage} 
              />
            ) : (
              <View style={styles.headerUserImagePlaceholder}>
                <Text style={styles.headerUserInitials}>
                  {getChatUserName().split(' ').map((n: string) => n[0]).join('')}
                </Text>
              </View>
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerUserName} numberOfLines={1}>
                {getChatUserName()}
              </Text>
              {isTyping && (
                <Text style={styles.headerUserStatus}>
                  Typing...
                </Text>
              )}
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={handleVoiceCall}
            >
              <Ionicons 
                name="call-outline" 
                size={22} 
                color={colors.currentUserBubble}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={handleVideoCall}
            >
              <Ionicons 
                name="videocam-outline" 
                size={22} 
                color={colors.currentUserBubble}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => setShowUserInfo(true)}
            >
              <Ionicons 
                name="information-circle-outline" 
                size={22} 
                color={colors.currentUserBubble}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.currentUserBubble} />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Animated Header */}
      {renderHeader()}
      
      {/* Messages List - NOT inverted, showing newest at bottom */}
      <FlatList
        ref={flatListRef}
        data={memoizedMessages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContent,
          // Add extra padding when keyboard is visible
          isKeyboardVisible && styles.messagesContentWithKeyboard
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.currentUserBubble]}
            tintColor={colors.currentUserBubble}
            progressViewOffset={Platform.OS === 'android' ? 80 : 0}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        onContentSizeChange={() => {
          // Auto-scroll to bottom when content size changes and we're at bottom
          if (isAtBottom && memoizedMessages.length > 0 && !isScrollingRef.current) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 50);
          }
        }}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={loading ? null : renderTypingIndicator}
        ListEmptyComponent={
          <EmptyChat 
            chatUserName={getChatUserName()}
            userImage={getChatUserImage()}
            onCall={handleVideoCall}
            onMessage={() => {
              setNewMessage('Hi! 👋');
            }}
          />
        }
        onMomentumScrollEnd={() => {
          isScrollingRef.current = false;
        }}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={21}
        inverted={false}
        // Add keyboard handling
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      {/* Scroll to bottom button with animation and timer */}
      {showScrollToBottom && (
        <Animated.View style={[
          styles.scrollToBottomButton,
          // Move button up when keyboard is visible
          isKeyboardVisible && { bottom: 110 + keyboardHeight }
        ]}>
          <TouchableOpacity onPress={scrollToBottom}>
            <LinearGradient
              colors={[colors.currentUserBubble, '#1D4ED8']}
              style={styles.scrollToBottomGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="chevron-down" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Cancel Edit/Reply buttons */}
      {(editMessage || replyMessage) && (
        <View style={styles.cancelActionsContainer}>
          <TouchableOpacity 
            style={styles.cancelActionButton}
            onPress={() => {
              if (editMessage) {
                setEditMessage(null);
                setNewMessage('');
              } else if (replyMessage) {
                setReplyMessage(null);
              }
            }}
          >
            <Ionicons 
              name="close" 
              size={16} 
              color={colors.textTertiary} 
            />
            <Text style={styles.cancelActionText}>
              {editMessage ? 'Cancel Edit' : 'Cancel Reply'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reply Preview */}
      {replyMessage && renderReplyPreview()}

      {/* Message Input with Enhanced Styling */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[
          styles.inputContainerWrapper,
          // Add margin bottom when keyboard is visible (for Android)
          Platform.OS === 'android' && isKeyboardVisible && { marginBottom: keyboardHeight }
        ]}
      >
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sending={sending}
          onSendMessage={handleSendMessage}
          onAttachFile={handleAttachFile}
          isReplying={!!replyMessage}
          isEditing={!!editMessage}
          onTypingStart={handleTypingStart} // Add this
          onTypingStop={handleTypingStop}   // Add this
        />
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderOptionsModal()}
      <CallInvitationModal />
      {/* {isInCall && <VideoCallScreen />} */}
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean, keyboardHeight: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 20,
  },
  loadingText: {
    color: colors.textTertiary,
    fontSize: 16,
    fontWeight: '500',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  headerBackButton: {
    padding: 8,
    marginRight: 12,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerUserImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  headerUserImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.currentUserBubble,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerUserInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerUserName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  headerUserStatus: {
    color: colors.currentUserBubble,
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  messagesList: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 94 : 84,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingBottom: 120, // Default padding
  },
  messagesContentWithKeyboard: {
    paddingBottom: 200, // Extra padding when keyboard is visible
  },
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  dateSeparator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    marginHorizontal: 12,
  },
  dateSeparatorText: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollToBottomGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: colors.otherUserBubble,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textTertiary,
    marginHorizontal: 2,
  },
  typingText: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  inputContainerWrapper: {
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.select({
      ios: 10,
      android: 0,
    }),
  },
  cancelActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  cancelActionText: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  replyPreviewContent: {
    flex: 1,
    marginRight: 12,
  },
  replyPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyPreviewTitle: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  replyPreviewText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 18,
  },
  replyCancelButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBlur: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  optionItem: {
    alignItems: 'center',
    marginHorizontal: 12,
    width: 80,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingMoreContainer: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  loadingMoreText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
});