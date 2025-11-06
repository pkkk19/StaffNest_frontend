import { View, Text, ScrollView, StyleSheet, TextInput, Platform } from 'react-native';
import { Search, Bell, Plus, Filter, Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ForceTouchable from '@/components/ForceTouchable';

export default function Notifications() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const styles = createStyles(theme);

  const notifications = [
    {
      id: 1,
      title: t('shiftReminder'),
      message: t('shiftTomorrow'),
      time: '2h ago',
      type: 'info',
      read: false,
      sender: 'System'
    },
    {
      id: 2,
      title: t('holidayApproved'),
      message: t('holidayApprovedMsg'),
      time: '1d ago',
      type: 'success',
      read: true,
      sender: 'HR Department'
    },
    {
      id: 3,
      title: 'New Message',
      message: 'You have a new message from John Smith',
      time: '2d ago',
      type: 'info',
      read: false,
      sender: 'John Smith'
    },
    {
      id: 4,
      title: 'Payslip Available',
      message: 'Your payslip for December 2024 is now available',
      time: '3d ago',
      type: 'info',
      read: true,
      sender: 'Payroll System'
    },
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.read) ||
                         (filter === 'read' && notification.read);
    return matchesSearch && matchesFilter;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#2563EB';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ForceTouchable onPress={() => router.back()}>
          <X size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
        <Text style={styles.title}>{t('notifications')}</Text>
        {user?.role === 
        'manager' && (
          <ForceTouchable style={styles.addButton}>
            <Plus size={24} color="#FFFFFF" />
          </ForceTouchable>
        )}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchNotifications')}
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'unread', 'read'].map((filterType) => (
            <ForceTouchable
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text style={[
                styles.filterButtonText,
                filter === filterType && styles.filterButtonTextActive
              ]}>
                {t(filterType)}
              </Text>
            </ForceTouchable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {filteredNotifications.map(notification => (
          <ForceTouchable key={notification.id} style={styles.notificationItem}>
            <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(notification.type) }]} />
            
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notification.message}
              </Text>
              
              <Text style={styles.notificationSender}>From: {notification.sender}</Text>
            </View>

            {!notification.read && <View style={styles.unreadDot} />}
          </ForceTouchable>
        ))}
      </ScrollView>
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
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    addButton: {
      backgroundColor: '#2563EB',
      width: 36,
      height: 36,
      borderRadius: 18,
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
    filterContainer: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      marginRight: 8,
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        android: {
          elevation: 2, // Android shadow
        },
      }),
    },
    filterButtonActive: {
      backgroundColor: '#2563EB',
    },
    filterButtonText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
    },
    filterButtonTextActive: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    notificationItem: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      marginBottom: 12,
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        ios: {
          // iOS shadow (commented out to fix Android)
          // shadowColor: '#000',
          // shadowOffset: { width: 0, height: 2 },
          // shadowOpacity: isDark ? 0.3 : 0.1,
          // shadowRadius: 4,
        },
        android: {
          elevation: 3, // Android shadow
        },
      }),
    },
    typeIndicator: {
      width: 4,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    },
    notificationContent: {
      flex: 1,
      padding: 16,
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    unreadTitle: {
      fontWeight: '600',
    },
    notificationTime: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    notificationMessage: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      lineHeight: 20,
      marginBottom: 8,
    },
    notificationSender: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
      fontStyle: 'italic',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#2563EB',
      alignSelf: 'center',
      marginRight: 12,
    },
  });
}