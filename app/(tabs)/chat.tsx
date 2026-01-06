// app/(tabs)/chat.tsx - UPDATED VERSION
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
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { socketService } from '@/services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Conversation {
  _id: string;
  name?: string;
  participants: any[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
}

const ChatApp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatModal, setNewChatModal] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const styles = createStyles(isDark);

useEffect(() => {
  loadConversations();
  
  // ✅ CRITICAL FIX: Sync state with the actual socket on mount
  console.log('🔍 Initial socket check in chat.tsx');
  const initialConnectionStatus = socketService.isConnected();
  console.log('📡 Socket connected on mount:', initialConnectionStatus);
  setIsSocketConnected(initialConnectionStatus); // Sync the UI state

  // Set up socket listeners for real-time updates
  const handleNewMessage = (data: any) => {
    console.log('📨 Real-time: New message received', data);
    updateConversationWithNewMessage(data);
  };

  const handleConversationUpdated = (data: any) => {
    console.log('🔄 Real-time: Conversation updated', data);
    refreshConversation(data.conversation);
  };

  const handleMessageSent = (data: any) => {
    console.log('✅ Real-time: Message sent confirmation', data);
    updateConversationWithNewMessage(data);
  };

  const handleConnect = () => {
    console.log('✅ Socket connected in chat.tsx');
    setIsSocketConnected(true); // Update state on connect
  };

  const handleDisconnect = (data: any) => {
    console.log('❌ Socket disconnected in chat.tsx:', data?.reason);
    setIsSocketConnected(false); // Update state on disconnect
  };

  // Listen to socket events
  socketService.on('new_message', handleNewMessage);
  socketService.on('conversation_updated', handleConversationUpdated);
  socketService.on('message_sent', handleMessageSent);
  socketService.on('connect', handleConnect);
  socketService.on('disconnect', handleDisconnect);

  return () => {
    // Clean up listeners
    socketService.off('new_message', handleNewMessage);
    socketService.off('conversation_updated', handleConversationUpdated);
    socketService.off('message_sent', handleMessageSent);
    socketService.off('connect', handleConnect);
    socketService.off('disconnect', handleDisconnect);
  };
}, [user]);

  const updateConversationWithNewMessage = (messageData: any) => {
    setConversations(prevConversations => {
      const updatedConversations = [...prevConversations];
      const conversationIndex = updatedConversations.findIndex(
        conv => conv._id === messageData.conversationId
      );

      if (conversationIndex > -1) {
        // Update the existing conversation
        const updatedConversation = {
          ...updatedConversations[conversationIndex],
          lastMessage: {
            content: messageData.content,
            createdAt: messageData.createdAt
          },
          updatedAt: messageData.createdAt,
          unreadCount: messageData.sender?._id !== user?._id 
            ? (updatedConversations[conversationIndex].unreadCount || 0) + 1
            : 0
        };
        
        // Move conversation to top
        updatedConversations.splice(conversationIndex, 1);
        updatedConversations.unshift(updatedConversation);
      } else {
        // If conversation doesn't exist in list, reload conversations
        loadConversations();
      }

      return updatedConversations;
    });
  };

  const refreshConversation = (conversationData: any) => {
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv => 
        conv._id === conversationData._id 
          ? { ...conv, ...conversationData }
          : conv
      );
      
      // Sort by updatedAt (newest first)
      return updatedConversations.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      console.log('📱 Conversations loaded:', data);
      
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleAddContact = () => {
    router.push('/chat/contacts');
  };

  const handleOpenChat = (conversation: Conversation) => {
    router.push(`/chat/${conversation._id}`);
  };

  const getDisplayName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    // For direct messages, show the other participant's name
    const otherParticipants = conversation.participants.filter(
      participant => participant._id !== user?._id
    );
    
    if (otherParticipants.length === 1) {
      const participant = otherParticipants[0];
      return `${participant.first_name} ${participant.last_name}`.trim();
    }
    
    return 'Group Chat';
  };

  const getInitials = (conversation: Conversation) => {
    const displayName = getDisplayName(conversation);
    return displayName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLastMessage = (conversation: Conversation) => {
    if (conversation.lastMessage) {
      return conversation.lastMessage.content;
    }
    return 'No messages yet';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conversation => 
    getDisplayName(conversation).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getLastMessage(conversation).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ChatItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => handleOpenChat(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item)}</Text>
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.name}>{getDisplayName(item)}</Text>
          <Text style={styles.timestamp}>
            {item.updatedAt && formatTime(item.updatedAt)}
          </Text>
        </View>
        
        <Text 
          style={[
            styles.lastMessage,
            item.unreadCount > 0 && styles.unreadMessage
          ]}
          numberOfLines={1}
        >
          {getLastMessage(item)}
        </Text>
      </View>
      
      {item.unreadCount > 0 && (
        <View style={styles.unreadIndicator}>
          <Text style={styles.unreadCount}>
            {item.unreadCount > 99 ? '99+' : item.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Add socket connection status indicator
  if (!isSocketConnected && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#111827' : '#fff'} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.offlineContainer}>
          <Ionicons name="wifi-outline" size={64} color={isDark ? '#4B5563' : '#ccc'} />
          <Text style={styles.offlineText}>Connecting to real-time updates...</Text>
          <Text style={styles.offlineSubtext}>
            Messages may not update in real-time
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadConversations}
          >
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#111827' : '#fff'} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity 
            style={styles.addContactButton}
            onPress={handleAddContact}
          >
            <Text style={styles.addContactText}>+ Contact</Text>
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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#111827' : '#fff'} />
      
      {/* Header with Add Contact Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity 
          style={styles.addContactButton}
          onPress={handleAddContact}
        >
          <Text style={styles.addContactText}>+ Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status Indicator */}
      {!isSocketConnected && (
        <View style={styles.connectionIndicator}>
          <Ionicons name="wifi-outline" size={14} color="#FFA500" />
          <Text style={styles.connectionIndicatorText}>
            Reconnecting...
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={isDark ? '#9CA3AF' : '#999'}
        />
      </View>

      {/* Chat List */}
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
            style={styles.refreshControl}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={64} color={isDark ? '#4B5563' : '#ccc'} />
            <Text style={styles.emptyStateText}>No conversations yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start a conversation by adding contacts
            </Text>
            <TouchableOpacity 
              style={styles.addContactButtonEmpty}
              onPress={handleAddContact}
            >
              <Ionicons name="person-add" size={16} color="#fff" />
              <Text style={styles.addContactButtonText}>Add Contacts</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* New Chat Button */}
      <TouchableOpacity 
        style={styles.newChatButton}
        onPress={() => setNewChatModal(true)}
      >
        <Ionicons name="create-outline" size={24} color="#fff" />
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>

      {/* New Chat Modal */}
      <Modal
        visible={newChatModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewChatModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start New Chat</Text>
            <Text style={styles.modalSubtitle}>
              Coming soon - Select contacts to start a chat
            </Text>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setNewChatModal(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
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
    backgroundColor: isDark ? '#111827' : '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? '#111827' : '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: isDark ? '#F9FAFB' : '#000',
  },
  addContactButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: isDark ? '#1F2937' : '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addContactText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#1F2937' : '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#FFEAA7',
  },
  connectionIndicatorText: {
    color: isDark ? '#FFA500' : '#856404',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  searchContainer: {
    padding: 16,
    paddingTop: 12,
  },
  searchInput: {
    backgroundColor: isDark ? '#1F2937' : '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    color: isDark ? '#F9FAFB' : '#000',
  },
  chatList: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#f8f8f8',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#F9FAFB' : '#000',
  },
  timestamp: {
    fontSize: 13,
    color: isDark ? '#9CA3AF' : '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: isDark ? '#D1D5DB' : '#666',
    lineHeight: 20,
  },
  unreadMessage: {
    color: isDark ? '#F9FAFB' : '#000',
    fontWeight: '500',
  },
  unreadIndicator: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  newChatButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newChatText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: isDark ? '#1F2937' : 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: isDark ? '#F9FAFB' : '#000',
  },
  modalSubtitle: {
    fontSize: 16,
    color: isDark ? '#D1D5DB' : '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: isDark ? '#374151' : '#f3f4f6',
  },
  cancelButtonText: {
    color: isDark ? '#D1D5DB' : '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: isDark ? '#9CA3AF' : '#999',
    textAlign: 'center',
  },
  emptyStateSubtext: { 
    fontSize: 14, 
    color: isDark ? '#9CA3AF' : '#999', 
    marginTop: 8, 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  addContactButtonEmpty: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#007AFF', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 8, 
    gap: 8 
  },
  addContactButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 16, 
    color: isDark ? '#9CA3AF' : '#666' 
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offlineText: {
    fontSize: 18,
    color: isDark ? '#F9FAFB' : '#000',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  offlineSubtext: {
    fontSize: 14,
    color: isDark ? '#9CA3AF' : '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshControl: {
    backgroundColor: 'transparent',
  },
});

export default ChatApp;