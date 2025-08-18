import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { setActiveChat, addMessage, markMessagesAsRead } from '@/store/slices/chatSlice';
import { MessageCircle, Send, Phone, Video, Search, Plus, Users, User } from 'lucide-react-native';
import Constants from 'expo-constants';

export default function Chat() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { chats, messages, activeChat, onlineUsers } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch();
  
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);

  // Mock chat data
  const mockChats = [
    {
      id: '1',
      type: 'group' as const,
      name: 'General Discussion',
      participants: ['1', '2', '3', '4'],
      lastMessage: {
        id: 'msg1',
        chatId: '1',
        senderId: '2',
        senderName: 'Sarah Johnson',
        message: 'Team meeting at 3 PM today',
        timestamp: new Date().toISOString(),
        type: 'text' as const,
        read: false,
      },
      unreadCount: 2,
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: '2',
      type: 'direct' as const,
      name: 'Manager Chat',
      participants: ['1', '5'],
      lastMessage: {
        id: 'msg2',
        chatId: '2',
        senderId: '5',
        senderName: 'Mike Wilson',
        message: 'Your holiday request has been approved',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text' as const,
        read: true,
      },
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: '3',
      type: 'group' as const,
      name: 'Branch Updates',
      participants: ['1', '2', '3'],
      lastMessage: {
        id: 'msg3',
        chatId: '3',
        senderId: '3',
        senderName: 'Emma Davis',
        message: 'New stock arrived this morning',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: 'text' as const,
        read: true,
      },
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
    },
  ];

  const mockMessages = {
    '1': [
      {
        id: 'msg1-1',
        chatId: '1',
        senderId: '2',
        senderName: 'Sarah Johnson',
        message: 'Good morning everyone! Hope you all have a great day.',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        type: 'text' as const,
        read: true,
      },
      {
        id: 'msg1-2',
        chatId: '1',
        senderId: user?.id || '1',
        senderName: user?.name || 'You',
        message: 'Good morning Sarah! Ready for the day.',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        type: 'text' as const,
        read: true,
      },
      {
        id: 'msg1-3',
        chatId: '1',
        senderId: '2',
        senderName: 'Sarah Johnson',
        message: 'Team meeting at 3 PM today',
        timestamp: new Date().toISOString(),
        type: 'text' as const,
        read: false,
      },
    ],
  };

  const currentChat = mockChats.find(chat => chat.id === activeChat);
  const currentMessages = activeChat ? mockMessages[activeChat as keyof typeof mockMessages] || [] : [];

  const sendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;

    const message = {
      id: Date.now().toString(),
      chatId: activeChat,
      senderId: user!.id,
      senderName: user!.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text' as const,
      read: true,
    };

    dispatch(addMessage(message));
    setNewMessage('');
  };

  const openChat = (chatId: string) => {
    dispatch(setActiveChat(chatId));
    dispatch(markMessagesAsRead(chatId));
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOnline = (userId: string) => onlineUsers.includes(userId);

  if (activeChat && currentChat) {
    return (
      <View style={styles.container}>
        <View style={styles.statusBarSpacer} />
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => dispatch(setActiveChat(null))}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.chatInfo}>
            <Text style={styles.chatName}>{currentChat.name}</Text>
            <Text style={styles.chatStatus}>
              {currentChat.type === 'group' 
                ? `${currentChat.participants.length} members`
                : isOnline('5') ? 'Online' : 'Last seen recently'
              }
            </Text>
          </View>
          <View style={styles.chatActions}>
            <TouchableOpacity style={styles.callButton}>
              <Phone size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.callButton}>
              <Video size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={currentMessages}
          keyExtractor={(item) => `message-${item.id}`}
          style={styles.messagesList}
          renderItem={({ item }) => (
            <View style={[
              styles.messageContainer,
              item.senderId === user?.id ? styles.myMessage : styles.otherMessage
            ]}>
              {item.senderId !== user?.id && currentChat.type === 'group' && (
                <Text style={styles.senderName}>{item.senderName}</Text>
              )}
              <Text style={styles.messageText}>{item.message}</Text>
              <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
            </View>
          )}
        />

        {/* Message Input */}
        <View style={styles.messageInput}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusBarSpacer} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MessageCircle size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setNewChatModalVisible(true)}
          >
            <Plus size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Chat List */}
        <View style={styles.chatsSection}>
          {mockChats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatItem}
              onPress={() => openChat(chat.id)}
            >
              <View style={styles.chatAvatar}>
                {chat.type === 'group' ? (
                  <Users size={24} color="#6B7280" />
                ) : (
                  <User size={24} color="#6B7280" />
                )}
                {chat.type === 'direct' && isOnline('5') && (
                  <View style={styles.onlineIndicator} />
                )}
              </View>
              
              <View style={styles.chatContent}>
                <View style={styles.chatTop}>
                  <Text style={styles.chatName}>{chat.name}</Text>
                  <Text style={styles.chatTime}>
                    {chat.lastMessage && formatTime(chat.lastMessage.timestamp)}
                  </Text>
                </View>
                <View style={styles.chatBottom}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.lastMessage?.message || 'No messages yet'}
                  </Text>
                  {chat.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Users size={24} color="#2563EB" />
              <Text style={styles.actionText}>Create Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Phone size={24} color="#059669" />
              <Text style={styles.actionText}>Voice Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Video size={24} color="#EA580C" />
              <Text style={styles.actionText}>Video Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* New Chat Modal */}
      <Modal
        visible={newChatModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setNewChatModalVisible(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Chat</Text>
            <TouchableOpacity>
              <Text style={styles.modalSave}>Create</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Select Contacts</Text>
            {/* Contact list would go here */}
            <View style={styles.contactItem}>
              <View style={styles.contactAvatar}>
                <User size={20} color="#6B7280" />
              </View>
              <Text style={styles.contactName}>Sarah Johnson</Text>
            </View>
            <View style={styles.contactItem}>
              <View style={styles.contactAvatar}>
                <User size={20} color="#6B7280" />
              </View>
              <Text style={styles.contactName}>Mike Wilson</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statusBarSpacer: {
    height: Constants.statusBarHeight,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  chatsSection: {
    paddingTop: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
  },
  chatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  chatTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  chatBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  quickActions: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginTop: 8,
  },
  // Chat View Styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2563EB',
  },
  chatInfo: {
    flex: 1,
  },
  chatStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  chatActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  senderName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    alignSelf: 'flex-end',
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalClose: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  modalSave: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  modalContent: {
    padding: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
});