// app/chat/[conversationId].tsx - FIXED VERSION
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Menu, Provider as PaperProvider } from 'react-native-paper';
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
  Keyboard,
  AppState,
  AppStateStatus
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useChat } from './hooks/useChat';
import { MessageBubble } from './components/MessageBubble';
import { MessageInput } from './components/MessageInput';
import { EmptyChat } from './components/EmptyChat';
import { TypingIndicator } from './components/TypingIndicator';
import { useChatTheme } from './hooks/useChatTheme';

import { useVideo } from '../../contexts/VideoContext';
import { CallInvitationModal } from '../../app/calls/callInvitationModal';
import { socketService } from '@/services/socketService';
import { notificationService } from '@/services/notificationService';

const { width, height } = Dimensions.get('window');

export default function ChatPage() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { colors, isDark } = useChatTheme();
  const flatListRef = useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
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
  const appStateRef = useRef(AppState.currentState);
  const [menuVisible, setMenuVisible] = useState(false);
  const { initiateCall } = useVideo();
  
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
    updateMessage,
    isTyping,
    typingUser,
    handleTypingStart,
    handleTypingStop,
    useEncryption,
    toggleEncryption,
  } = useChat(conversationId as string);

  const styles = createStyles(colors, isDark, keyboardHeight);

  // =============================================
  // NOTIFICATION HANDLING
  // =============================================
  useFocusEffect(
    useCallback(() => {
      if (conversationId) {
        notificationService.markConversationAsActive(conversationId);
      }
      
      return () => {
        if (conversationId) {
          notificationService.markConversationAsInactive(conversationId);
        }
      };
    }, [conversationId])
  );

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      appStateRef.current = nextAppState;
      
      if (nextAppState === 'active' && conversationId) {
        notificationService.markConversationAsActive(conversationId);
      } else if ((nextAppState === 'background' || nextAppState === 'inactive') && conversationId) {
        notificationService.markConversationAsInactive(conversationId);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (conversationId) {
        notificationService.markConversationAsInactive(conversationId);
      }
    };
  }, [conversationId]);

  // =============================================
  // FIXED: MEMOIZE MESSAGES WITH PROPER FILTERING
  // =============================================
// Update the memoizedMessages to include read status check:
const memoizedMessages = useMemo(() => {
  // Remove duplicate messages by ID
  const uniqueMessages = messages.filter((msg, index, self) =>
    index === self.findIndex((m) => m._id === msg._id)
  );
  
  // Add read status to each message if missing
  const messagesWithReadStatus = uniqueMessages.map(msg => {
    // Ensure readBy array exists
    if (!msg.readBy) {
      return { ...msg, readBy: [] };
    }
    return msg;
  });
  
  // Sort by createdAt (oldest to newest for FlatList)
  return messagesWithReadStatus.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeA - timeB;
  });
}, [messages]);

  // =============================================
  // FIXED: KEYBOARD HANDLING FOR ANDROID
  // =============================================
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: any) => {
        const keyboardHeight = e.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);
        setIsKeyboardVisible(true);
        
        // Auto-scroll when keyboard appears
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

  // =============================================
  // FIXED: AUTO-SCROLL LOGIC
  // =============================================
  useEffect(() => {
    if (memoizedMessages.length === 0) return;
    
    const lastMessage = memoizedMessages[memoizedMessages.length - 1];
    if (!lastMessage) return;
    
    // Check if this is a WebSocket message from other user
    const isWebSocketMessage = lastMessage.sender?._id !== user?._id && 
                               !lastMessage._id?.startsWith('temp-') &&
                               !lastMessage.isSending;
    
    if (isWebSocketMessage && lastMessage._id !== lastWebSocketMessageIdRef.current) {
      lastWebSocketMessageIdRef.current = lastMessage._id;
      
      // Auto-scroll if we're at the bottom
      if (isAtBottom && !isScrollingRef.current) {
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

  // =============================================
  // SCROLL HANDLING
  // =============================================
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

  const showScrollButtonTemporarily = useCallback(() => {
    setShowScrollToBottom(true);
    hideScrollButton();
  }, [hideScrollButton]);

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Calculate distance from bottom
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    
    // Consider "at bottom" if within 100 pixels
    const atBottom = distanceFromBottom <= 100;
    setIsAtBottom(atBottom);
    
    // Show scroll-to-bottom button if scrolled up
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
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
    
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

  const scrollToBottom = useCallback(() => {
    isScrollingRef.current = false;
    flatListRef.current?.scrollToEnd({ animated: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setShowScrollToBottom(false);
    setIsAtBottom(true);
    
    if (hideButtonTimeoutRef.current) {
      clearTimeout(hideButtonTimeoutRef.current);
    }
  }, []);

  // =============================================
  // MESSAGE HANDLERS
  // =============================================
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

// In the renderMessage function:
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
        conversation={conversation} // ADD THIS LINE - pass conversation
        onLongPress={() => handleMessageLongPress(item)}
        onReply={() => handleReplyMessage(item)}
        onEdit={() => handleEditMessage(item)}
        onDelete={() => handleDeleteMessage(item)}
        showActions={showMessageActions === item._id}
      />
    </View>
  );
}, [memoizedMessages, user, conversation, showMessageActions]); // Add conversation to dependencies

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
      setIsAtBottom(true);
      handleTypingStop();
    }
  }, [newMessage, editMessage, sendMessage, updateMessage, handleTypingStop]);

  const handleTypingStartLocal = useCallback(() => {
    if (newMessage.trim()) {
      handleTypingStart();
    }
  }, [newMessage, handleTypingStart]);

  const handleTypingStopLocal = useCallback(() => {
    handleTypingStop();
  }, [handleTypingStop]);

// In your chat screen, update the handleVideoCall function:
const handleVideoCall = async () => {
  if (!conversation?.participants || !user) return;
  
  const otherParticipant = conversation.participants.find(
    (participant: any) => participant._id !== user._id
  );
  
  if (otherParticipant) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Initiate video call
      const response = await initiateCall(otherParticipant._id, 'video', conversationId);
      
      // Check if we got a valid response
      if (!response || !response.callId) {
        console.error('Invalid response from initiateCall:', response);
        Alert.alert('Error', 'Failed to initiate call. Please try again.');
        return;
      }
      
      // Navigate to video call screen
      router.push({
        pathname: '/calls/VideoCallScreen',
        params: {
          callId: response.callId,
          callerName: `${otherParticipant.first_name} ${otherParticipant.last_name}`,
          callType: 'video',
        }
      });
    } catch (error: any) {
      console.error('Error initiating video call:', error);
      Alert.alert('Error', error.message || 'Failed to initiate call');
    }
  }
};

  // =============================================
  // RENDER METHODS
  // =============================================
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

  // Animated header background
  // const headerBgOpacity = scrollY.interpolate({
  //   inputRange: [0, 100],
  //   outputRange: [0, 1],
  //   extrapolate: 'clamp'
  // });

const renderHeader = () => {
  const chatUserImage = getChatUserImage();
  
  return (
    <Animated.View style={[styles.headerContainer]}>
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
          {/* Encryption Toggle Button */}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={() => setMenuVisible(true)}
              >
                <Ionicons 
                  name={useEncryption ? "lock-closed" : "lock-open"} 
                  size={22} 
                  color={useEncryption ? colors.currentUserBubble : colors.textTertiary} 
                />
              </TouchableOpacity>
            }
            contentStyle={styles.menuContent}
          >
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                toggleEncryption();
              }}
              title={useEncryption ? "Disable Encryption" : "Enable Encryption"}
              leadingIcon={useEncryption ? "lock-open" : "lock-closed"}
              titleStyle={{ color: isDark ? '#F9FAFB' : '#111827' }}
            />
            <Menu.Item 
              onPress={() => setMenuVisible(false)}
              title="Cancel"
              leadingIcon="close"
              titleStyle={{ color: isDark ? '#F9FAFB' : '#111827' }}
            />
          </Menu>
          
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={handleVideoCall}
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
        </View>
      </View>
    </Animated.View>
  );
};

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
    // FIXED: Use SafeAreaView and proper KeyboardAvoidingView
    <PaperProvider>
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Animated Header */}
      {renderHeader()}
      
      {/* FIXED: Main content with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={memoizedMessages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
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
          ListHeaderComponent={
            <TypingIndicator 
              isTyping={isTyping} 
              typingUser={typingUser} 
            />
          }
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
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <TouchableOpacity 
            style={[
              styles.scrollToBottomButton,
              { bottom: isKeyboardVisible ? 20 + keyboardHeight : 20 }
            ]}
            onPress={scrollToBottom}
          >
            <LinearGradient
              colors={[colors.currentUserBubble, '#1D4ED8']}
              style={styles.scrollToBottomGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="chevron-down" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
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

        {/* Message Input - FIXED: Now stays above keyboard on Android */}
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sending={sending}
          onSendMessage={handleSendMessage}
          onAttachFile={() => {
            // Handle attach file
          }}
          isReplying={!!replyMessage}
          isEditing={!!editMessage}
          onCancelEdit={() => {
            setEditMessage(null);
            setNewMessage('');
          }}
          onCancelReply={() => setReplyMessage(null)}
          onTypingStart={handleTypingStartLocal}
          onTypingStop={handleTypingStopLocal}
        />
      </KeyboardAvoidingView>

      {/* Modals */}
      <CallInvitationModal />
    </SafeAreaView>
    </PaperProvider>
  );
}

const createStyles = (colors: any, isDark: boolean, keyboardHeight: number) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
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
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 94 : 84,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
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
  menuContent: {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
  },
});