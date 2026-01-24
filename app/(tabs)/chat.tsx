// app/(tabs)/chat.tsx - UPDATED WITH FIXED MESSAGE PREVIEWS
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Image,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { socketService } from '@/services/socketService';
import { useChatPreview } from '@/contexts/ChatPreviewContext';

interface Conversation {
  _id: string;
  name?: string;
  participants: any[];
  lastMessage?: {
    _id: string;
    content: string;
    decryptedContent?: string;
    isEncrypted?: boolean;
    createdAt: string;
    sender?: {
      _id: string;
      first_name?: string;
      last_name?: string;
    };
  };
  unreadCount: number;
  updatedAt: string;
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  email?: string;
}

// Helper function to handle expired S3 URLs
const getProfileImageUrl = (profile_picture_url?: string, userId?: string): string | null => {
  if (!profile_picture_url) return null;
  
  // Check if URL is expired
  const isExpired = profile_picture_url.includes('20251224') || 
                    profile_picture_url.includes('X-Amz-Date=20251224');
  
  if (isExpired && userId) {
    // Return a fresh URL by appending timestamp
    return `${profile_picture_url.split('?')[0]}?t=${Date.now()}`;
  }
  
  return profile_picture_url;
};

const ChatApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [newChatModal, setNewChatModal] = useState(false);
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  const { getPreview } = useChatPreview();

  const isDark = theme === 'dark';
  const styles = createStyles(isDark);

  useEffect(() => {
    loadConversations();
    
    setIsSocketConnected(socketService.isConnected());
    
    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);
    const handleNewMessage = (data: any) => updateConversationWithNewMessage(data);
    
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('new_message', handleNewMessage);
    
    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('new_message', handleNewMessage);
    };
  }, [currentUser]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // Load conversations - chatService will handle user population
      const data = await chatService.getConversations(currentUser?._id);
      
      // Sort conversations by most recent first
      const sortedConversations = (data || []).sort((a: Conversation, b: Conversation) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setConversations(sortedConversations);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const updateConversationWithNewMessage = (messageData: any) => {
    setConversations(prev => {
      const updatedConversations = [...prev];
      const conversationIndex = updatedConversations.findIndex(
        conv => conv._id === messageData.conversationId
      );

      if (conversationIndex > -1) {
        const conversation = updatedConversations[conversationIndex];
        const isOwnMessage = messageData.sender?._id === currentUser?._id;
        
        let newUnreadCount = conversation.unreadCount || 0;
        if (!isOwnMessage) {
          newUnreadCount += 1;
        } else {
          newUnreadCount = 0;
        }

        const updatedConversation = {
          ...conversation,
          lastMessage: {
            _id: messageData._id,
            content: messageData.content,
            decryptedContent: messageData.decryptedContent || messageData.content,
            isEncrypted: messageData.isEncrypted || false,
            createdAt: messageData.createdAt,
            sender: messageData.sender
          },
          updatedAt: messageData.createdAt,
          unreadCount: newUnreadCount
        };
        
        // Move to top
        updatedConversations.splice(conversationIndex, 1);
        updatedConversations.unshift(updatedConversation);
      } else {
        // If conversation not in list, reload
        loadConversations();
      }

      return updatedConversations;
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleAddContact = () => {
    router.push('/chat/contacts');
  };

  const handleCreateChat = () => {
    setNewChatModal(true);
  };

  const handleOpenChat = (conversation: Conversation) => {
    if (conversation.unreadCount > 0) {
      const lastMessageId = conversation.lastMessage?._id;
      markConversationAsRead(conversation._id, lastMessageId);
    }
    router.push(`/chat/${conversation._id}`);
  };

  const markConversationAsRead = async (conversationId: string, lastMessageId?: string) => {
    try {
      const messageIds = lastMessageId ? [lastMessageId] : [];
      await chatService.markAsRead(conversationId, messageIds);
      
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  // Extract user info from conversation participants
  const getOtherParticipant = (conversation: Conversation) => {
    if (!conversation.participants || conversation.participants.length === 0) {
      return null;
    }
    
    // Find participant that's not the current user
    const otherParticipant = conversation.participants.find(
  (p: any) => p?._id && p._id !== currentUser?._id
);

    return otherParticipant || conversation.participants[0];
  };

  const getDisplayName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    const otherParticipant = getOtherParticipant(conversation);
    
    if (otherParticipant) {
      if (typeof otherParticipant === 'object') {
        const firstName = otherParticipant.first_name || '';
        const lastName = otherParticipant.last_name || '';
        const name = `${firstName} ${lastName}`.trim();
        
        if (name) return name;
        if (otherParticipant.email) return otherParticipant.email;
      }
      
      return 'User';
    }
    
    return 'Unknown';
  };

  const getAvatarUrl = (conversation: Conversation): string | null => {
    const otherParticipant = getOtherParticipant(conversation);
    
    if (otherParticipant && typeof otherParticipant === 'object') {
      if (otherParticipant.profile_picture_url) {
        return getProfileImageUrl(otherParticipant.profile_picture_url, otherParticipant._id);
      }
    }
    
    return null;
  };

  const getInitials = (conversation: Conversation) => {
    const displayName = getDisplayName(conversation);
    return displayName
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

const getLastMessage = (conversation: Conversation) => {
  if (!conversation.lastMessage) {
    return 'Start a conversation';
  }

  const isOwnMessage =
    conversation.lastMessage.sender?._id === currentUser?._id;

  const prefix = isOwnMessage ? 'You: ' : '';
  const message = conversation.lastMessage;

  let content = '';

  if (message.isEncrypted && message.content) {
    // ✅ ALWAYS use preview context
    content = getPreview(message._id, message.content);
  } else {
    content = message.decryptedContent || message.content || '';
  }

  if (!content || content.trim() === '') {
    content = '📎 Attachment';
  }

  const truncated =
    content.length > 50 ? content.substring(0, 50) + '...' : content;

  return prefix + truncated;
};


  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = diffInHours * 60;
      if (diffInMinutes < 1) return 'Just now';
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conversation => 
    getDisplayName(conversation).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getLastMessage(conversation).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ChatItem = ({ item }: { item: Conversation }) => {
    const avatarUrl = getAvatarUrl(item);
    const isGroupChat = item.participants?.length > 2;
    
    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => handleOpenChat(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image 
              source={{ uri: avatarUrl }} 
              style={styles.avatarImage}
              defaultSource={require('@/assets/images/avatar-placeholder.png')}
            />
          ) : (
            <View style={[styles.avatarFallback, isGroupChat && styles.groupAvatar]}>
              <Text style={styles.avatarText}>{getInitials(item)}</Text>
            </View>
          )}
          {isGroupChat && (
            <View style={styles.groupIndicator}>
              <Ionicons name="people" size={12} color="#fff" />
            </View>
          )}
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.name} numberOfLines={1}>
              {getDisplayName(item)}
            </Text>
            <Text style={styles.timestamp}>
              {item.updatedAt && formatTime(item.updatedAt)}
            </Text>
          </View>
          
          <View style={styles.messagePreview}>
            <Text 
              style={[
                styles.lastMessage,
                item.unreadCount > 0 && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {getLastMessage(item)}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadDot} />
            )}
          </View>
        </View>
        
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0F172A' : '#fff'} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleAddContact}
          >
            <Ionicons name="person-add-outline" size={22} color={isDark ? '#CBD5E1' : '#64748B'} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0F172A' : '#fff'} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          {!isSocketConnected && (
            <Text style={styles.headerSubtitle}>Connecting...</Text>
          )}
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleAddContact}
          >
            <Ionicons name="person-add-outline" size={22} color={isDark ? '#CBD5E1' : '#64748B'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={({ item }) => <ChatItem item={item} />}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor={isDark ? '#007AFF' : '#007AFF'}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={60} color={isDark ? '#475569' : '#CBD5E1'} />
            </View>
            <Text style={styles.emptyStateTitle}>No conversations yet</Text>
            <Text style={styles.emptyStateText}>
              Start by adding contacts and sending your first message
            </Text>
            <TouchableOpacity 
              style={styles.addContactButton}
              onPress={handleAddContact}
            >
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.addContactButtonText}>Add Contacts</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={handleCreateChat}
        activeOpacity={0.9}
      >
        <Ionicons name="create-outline" size={24} color="#fff" />
      </TouchableOpacity>

      {/* New Chat Modal */}
      <Modal
        visible={newChatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewChatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Chat</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setNewChatModal(false)}
              >
                <Ionicons name="close" size={24} color={isDark ? '#CBD5E1' : '#64748B'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => {
                  setNewChatModal(false);
                  router.push('/chat/contacts');
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="person-add" size={24} color="#007AFF" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>New Contact</Text>
                  <Text style={styles.optionDescription}>
                    Add a new contact to start chatting
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#CBD5E1' : '#94A3B8'} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => {
                  setNewChatModal(false);
                  router.push('/chat/contacts?tab=friends');
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="people" size={24} color="#007AFF" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Start Group Chat</Text>
                  <Text style={styles.optionDescription}>
                    Create a chat with multiple people
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#CBD5E1' : '#94A3B8'} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setNewChatModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0F172A' : '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 60,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? '#0F172A' : '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: isDark ? '#F1F5F9' : '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FFA500',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: isDark ? '#1E293B' : '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1E293B' : '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: isDark ? '#F1F5F9' : '#0F172A',
    paddingVertical: 2,
  },
  chatList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: isDark ? '#334155' : '#e2e8f0',
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatar: {
    backgroundColor: '#10B981',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  groupIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#007AFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: isDark ? '#0F172A' : '#f8fafc',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#F1F5F9' : '#0F172A',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: isDark ? '#64748B' : '#94A3B8',
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastMessage: {
    fontSize: 14,
    color: isDark ? '#94A3B8' : '#64748B',
    flex: 1,
  },
  unreadMessage: {
    color: isDark ? '#F1F5F9' : '#0F172A',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    minWidth: 8,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDark ? '#1E293B' : '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#F1F5F9' : '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: isDark ? '#94A3B8' : '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  addContactButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: isDark ? '#94A3B8' : '#64748B',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: isDark ? '#1E293B' : '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#F1F5F9' : '#0F172A',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#334155' : '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#f1f5f9',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDark ? '#334155' : '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#F1F5F9' : '#0F172A',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: isDark ? '#94A3B8' : '#64748B',
  },
  cancelButton: {
    marginTop: 8,
    marginHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: isDark ? '#334155' : '#f1f5f9',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#CBD5E1' : '#64748B',
  },
});

export default ChatApp;