// app/(tabs)/chat.tsx
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
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      console.log('📱 Conversations loaded:', data);
      setConversations(data || []);
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

  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
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
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
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

      {/* New Chat Modal - We'll implement this later */}
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

const styles = StyleSheet.create({
  // Original styles from your file
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  addContactButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addContactText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    paddingTop: 12,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    color: '#000',
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
    borderBottomColor: '#f8f8f8',
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
    color: '#000',
  },
  timestamp: {
    fontSize: 13,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unreadMessage: {
    color: '#000',
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
    backgroundColor: 'white',
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
    color: '#000',
  },
  contactItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
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
    color: '#999',
    textAlign: 'center',
  },

  // New styles I added
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 16, 
    color: '#666' 
  },
  emptyStateSubtext: { 
    fontSize: 14, 
    color: '#999', 
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
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ChatApp;