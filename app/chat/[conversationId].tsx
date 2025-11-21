import React, { useRef, useEffect } from 'react';
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
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useChat } from './hooks/useChat';
import { MessageBubble } from './components/MessageBubble';
import { MessageInput } from './components/MessageInput';
import { EmptyChat } from './components/EmptyChat';
import { useChatTheme } from './hooks/useChatTheme';

export default function ChatPage() {
  const { conversationId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useChatTheme();
  const flatListRef = useRef<FlatList>(null);
  
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
    handleScroll,
    user
  } = useChat(conversationId);

  const styles = createStyles(colors);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages]);

  const getChatUserName = () => {
    if (!conversation) {
      return 'Loading...';
    }
    
    // If conversation has a name, use it (for group chats)
    if (conversation.name) {
      return conversation.name;
    }
    
    // Find the other participant in a 1-on-1 chat
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(
        (participant: any) => participant._id !== user?._id
      );
      
      if (otherParticipant) {
        return `${otherParticipant.first_name} ${otherParticipant.last_name}`;
      }
      
      // If no other participant found, show the first participant
      const firstParticipant = conversation.participants[0];
      if (firstParticipant) {
        return `${firstParticipant.first_name} ${firstParticipant.last_name}`;
      }
    }
    
    // Final fallback
    return 'Unknown User';
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isCurrentUser = item.sender._id === user?._id;
    const previousMessage = messages[index - 1];
    const showAvatar = !previousMessage || previousMessage.sender._id !== item.sender._id;

    return (
      <MessageBubble
        message={item}
        isCurrentUser={isCurrentUser}
        showAvatar={showAvatar}
        user={user}
      />
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
    if (hasMore && !loadingMore) {
      loadMoreMessages();
    }
  };

  // Create platform-specific header styles
  const getHeaderStyles = () => {
    const baseStyle = {
      backgroundColor: colors.backgroundSecondary,
    };

    // For Android shadow, we'll handle it differently since headerStyle doesn't accept elevation
    if (Platform.OS === 'android') {
      return baseStyle;
    }

    return baseStyle;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Loading...',
            headerStyle: getHeaderStyles(),
            headerTitleStyle: {
              color: colors.textPrimary,
              fontWeight: '600',
              fontSize: 18,
            },
            headerTintColor: colors.textPrimary,
            headerLeft: Platform.OS === 'ios' ? () => (
              <TouchableOpacity 
                onPress={() => router.back()} 
                style={styles.backButton}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={24} 
                  color={colors.currentUserBubble}
                />
              </TouchableOpacity>
            ) : undefined,
          }}
        />
        <ActivityIndicator size="large" color={colors.currentUserBubble} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: getChatUserName(),
          headerStyle: getHeaderStyles(),
          headerTitleStyle: {
            color: colors.textPrimary,
            fontWeight: '600',
            fontSize: 18,
          },
          headerTintColor: colors.textPrimary,
          // Only show custom back button on iOS, use Android's native one
          headerLeft: Platform.OS === 'ios' ? () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={colors.currentUserBubble}
              />
            </TouchableOpacity>
          ) : undefined,
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => {/* Add info modal */}}
              style={styles.infoButton}
            >
              <Ionicons 
                name="information-circle-outline" 
                size={24} 
                color={colors.currentUserBubble}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Add Android shadow container for header */}
      {Platform.OS === 'android' && (
        <View style={styles.androidHeaderShadow} />
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.currentUserBubble]}
            tintColor={colors.currentUserBubble}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={<EmptyChat chatUserName={getChatUserName()} />}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sending={sending}
          onSendMessage={sendMessage}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Android header shadow (since we can't use elevation in headerStyle)
  androidHeaderShadow: {
    height: Platform.OS === 'android' ? 4 : 0,
    backgroundColor: colors.backgroundSecondary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 16,
  },
  loadingText: {
    color: colors.textTertiary,
    fontSize: 16,
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
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  infoButton: {
    padding: 8,
    marginRight: Platform.OS === 'ios' ? 8 : 16,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});