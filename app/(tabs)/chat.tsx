import { View, Text, ScrollView, StyleSheet, TextInput, Modal, Platform } from 'react-native';
import { Search, MessageSquare, Video, Phone, MoveVertical as MoreVertical, Plus, UserPlus, CreditCard as Edit3 } from 'lucide-react-native';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import ForceTouchable from '@/components/ForceTouchable';

export default function Chat() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const styles = createStyles(theme);

  const conversations = [
    {
      id: 1,
      name: 'Team General',
      lastMessage: 'Don\'t forget about the meeting tomorrow',
      time: '2m ago',
      unread: 3,
      isGroup: true,
      avatar: 'TG',
      online: false
    },
    {
      id: 2,
      name: 'John Smith',
      lastMessage: 'Can you send me the report?',
      time: '15m ago',
      unread: 1,
      isGroup: false,
      avatar: 'JS',
      online: true
    },
    {
      id: 3,
      name: 'HR Department',
      lastMessage: 'Holiday requests are now open',
      time: '1h ago',
      unread: 0,
      isGroup: true,
      avatar: 'HR',
      online: false
    },
    {
      id: 4,
      name: 'Sarah Johnson',
      lastMessage: 'Thanks for your help today!',
      time: '2h ago',
      unread: 0,
      isGroup: false,
      avatar: 'SJ',
      online: false
    },
    {
      id: 5,
      name: 'Management',
      lastMessage: 'Q4 targets have been updated',
      time: '1d ago',
      unread: 0,
      isGroup: true,
      avatar: 'MG',
      online: false
    },
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('chat')}</Text>
        <View style={styles.headerActions}>
          <ForceTouchable 
            style={styles.headerButton}
            onPress={() => setShowNewChatModal(true)}
          >
            <UserPlus size={20} color="#2563EB" />
          </ForceTouchable>
          <ForceTouchable style={styles.newChatButton}>
            <Edit3 size={20} color="#FFFFFF" />
          </ForceTouchable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchConversations')}
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {filteredConversations.map(conversation => (
          <ForceTouchable key={conversation.id} style={styles.chatItem}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{conversation.avatar}</Text>
              {conversation.online && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{conversation.name}</Text>
                <Text style={styles.chatTime}>{conversation.time}</Text>
              </View>
              
              <View style={styles.messageRow}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conversation.lastMessage}
                </Text>
                {conversation.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{conversation.unread}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              <ForceTouchable style={styles.actionButton}>
                <Phone size={20} color="#6B7280" />
              </ForceTouchable>
              <ForceTouchable style={styles.actionButton}>
                <Video size={20} color="#6B7280" />
              </ForceTouchable>
              <ForceTouchable style={styles.actionButton}>
                <MoreVertical size={20} color="#6B7280" />
              </ForceTouchable>
            </View>
          </ForceTouchable>
        ))}
      </ScrollView>

      {/* New Chat Modal */}
      <Modal
        visible={showNewChatModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('newChat')}</Text>
              <ForceTouchable onPress={() => setShowNewChatModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </ForceTouchable>
            </View>
            
            <View style={styles.modalSearchBox}>
              <Search size={20} color="#6B7280" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('searchContacts')}
                placeholderTextColor="#6B7280"
              />
            </View>

            <ScrollView style={styles.contactsList}>
              {['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emily Davis'].map((contact, index) => (
                <ForceTouchable
                  key={index} 
                  style={styles.contactItem}
                  onPress={() => {
                    setShowNewChatModal(false);
                    // Navigate to chat with selected contact
                  }}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {contact.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <Text style={styles.contactName}>{contact}</Text>
                </ForceTouchable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        android: {
          elevation: 2, // Android shadow
        },
      }),
    },
    newChatButton: {
      backgroundColor: '#2563EB',
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        android: {
          elevation: 3, // Android shadow
        },
      }),
    },
    searchContainer: {
      padding: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchInput: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    content: {
      flex: 1,
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    avatarContainer: {
      position: 'relative',
      marginRight: 16,
    },
    avatarText: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 50,
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        android: {
          elevation: 2, // Android shadow
        },
      }),
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#10B981',
      borderWidth: 2,
      borderColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    chatInfo: {
      flex: 1,
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    chatName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    chatTime: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    messageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    lastMessage: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      flex: 1,
    },
    unreadBadge: {
      backgroundColor: '#2563EB',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      marginLeft: 8,
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        android: {
          elevation: 1, // Android shadow
        },
      }),
    },
    unreadText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    actions: {
      flexDirection: 'row',
      marginLeft: 12,
    },
    actionButton: {
      padding: 8,
      marginLeft: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 20,
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        android: {
          elevation: 10, // Android shadow for modal
        },
      }),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    modalClose: {
      fontSize: 18,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '600',
    },
    modalSearchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      margin: 20,
    },
    modalSearchInput: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    contactsList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#F3F4F6',
    },
    contactAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        android: {
          elevation: 2, // Android shadow
        },
      }),
    },
    contactAvatarText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    contactName: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
  });
}