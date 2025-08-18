import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { markAsRead, markAllAsRead, clearNotifications, addNotification } from '@/store/slices/notificationSlice';
import { Bell, Filter, Plus, Send, Users, Building, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Info, Circle as XCircle, Shield, User } from 'lucide-react-native';
import Constants from 'expo-constants';

export default function Notifications() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);
  const dispatch = useDispatch();
  
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'shift' | 'holiday'>('all');
  const [newNotificationModalVisible, setNewNotificationModalVisible] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [targetGroup, setTargetGroup] = useState<'all' | 'admins' | 'staff' | 'branch'>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !notification.read;
    return notification.type === filterType;
  });

  const markNotificationAsRead = (notificationId: string) => {
    dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
    Alert.alert('Success', 'All notifications marked as read');
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => dispatch(clearNotifications())
        }
      ]
    );
  };

  const sendNotification = () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newNotification = {
      id: Date.now().toString(),
      title: notificationTitle.trim(),
      message: notificationMessage.trim(),
      type: 'info' as const,
      timestamp: new Date().toISOString(),
      read: false,
      senderId: user!.id,
      senderName: user!.name,
      targetGroup,
    };

    dispatch(addNotification(newNotification));
    setNewNotificationModalVisible(false);
    setNotificationTitle('');
    setNotificationMessage('');
    setTargetGroup('all');
    Alert.alert('Success', 'Notification sent successfully');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#059669" />;
      case 'warning':
        return <AlertCircle size={20} color="#EA580C" />;
      case 'error':
        return <XCircle size={20} color="#DC2626" />;
      case 'shift':
        return <Bell size={20} color="#2563EB" />;
      case 'holiday':
        return <Bell size={20} color="#7C3AED" />;
      default:
        return <Info size={20} color="#6B7280" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#F0FDF4';
      case 'warning':
        return '#FFFBEB';
      case 'error':
        return '#FEF2F2';
      case 'shift':
        return '#EFF6FF';
      case 'holiday':
        return '#F3E8FF';
      default:
        return '#F8FAFC';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-GB');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBarSpacer} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'shift', label: 'Shifts' },
            { key: 'holiday', label: 'Holidays' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                filterType === filter.key && styles.activeFilterTab
              ]}
              onPress={() => setFilterType(filter.key as any)}
            >
              <Text style={[
                styles.filterTabText,
                filterType === filter.key && styles.activeFilterTabText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.actionButtonText}>Mark All Read</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearAll}
          >
            <Text style={styles.actionButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content}>
        {filteredNotifications.map((notification) => (
          <TouchableOpacity
            key={`notification-${notification.id}`}
            style={[
              styles.notificationCard,
              { backgroundColor: getNotificationColor(notification.type) },
              !notification.read && styles.unreadNotification
            ]}
            onPress={() => markNotificationAsRead(notification.id)}
          >
            <View style={styles.notificationHeader}>
              <View style={styles.notificationIcon}>
                {getNotificationIcon(notification.type)}
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <View style={styles.notificationFooter}>
                  <Text style={styles.notificationTime}>
                    {formatTime(notification.timestamp)}
                  </Text>
                  {notification.senderName && (
                    <Text style={styles.notificationSender}>
                      from {notification.senderName}
                    </Text>
                  )}
                </View>
              </View>
              {!notification.read && (
                <View style={styles.unreadDot} />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {filteredNotifications.length === 0 && (
          <View style={styles.emptyState}>
            <Bell size={48} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              {filterType === 'all' 
                ? 'You\'re all caught up! No notifications to show.'
                : `No ${filterType} notifications found.`
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* New Notification Modal */}
      <Modal
        visible={newNotificationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setNewNotificationModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Send Notification</Text>
            <TouchableOpacity onPress={sendNotification}>
              <Text style={styles.modalSave}>Send</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={notificationTitle}
                onChangeText={setNotificationTitle}
                placeholder="Enter notification title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={styles.messageInput}
                value={notificationMessage}
                onChangeText={setNotificationMessage}
                placeholder="Enter your message..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Send To</Text>
              <View style={styles.targetOptions}>
                {[
                  { key: 'all', label: 'All Staff', icon: Users },
                  { key: 'admins', label: 'Admins Only', icon: Shield },
                  { key: 'staff', label: 'Staff Only', icon: User },
                  { key: 'branch', label: 'My Branch', icon: Building },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.targetOption,
                      targetGroup === option.key && styles.activeTargetOption
                    ]}
                    onPress={() => setTargetGroup(option.key as any)}
                  >
                    <option.icon size={16} color={
                      targetGroup === option.key ? '#FFFFFF' : '#6B7280'
                    } />
                    <Text style={[
                      styles.targetOptionText,
                      targetGroup === option.key && styles.activeTargetOptionText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  headerBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
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
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
  activeFilterTabText: {
    color: '#2563EB',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  notificationCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  notificationSender: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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
  modalCancel: {
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  targetOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  activeTargetOption: {
    backgroundColor: '#2563EB',
  },
  targetOptionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  activeTargetOptionText: {
    color: '#FFFFFF',
  },
});