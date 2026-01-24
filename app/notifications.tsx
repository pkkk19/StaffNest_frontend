// app/notifications.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform
} from 'react-native';
import { Bell, CheckCircle, Calendar, Clock, FileText, MessageSquare, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import  api  from '@/services/api';

// Define Notification type
type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  data?: any;
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  const fetchNotifications = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await api.get('/notifications/history', {
        params: { limit: 20, page: pageNum }
      });

      if (response.data?.notifications) {
        if (pageNum === 1) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        
        setHasMore(response.data.pagination?.pages > pageNum);
        setPage(pageNum);
      }
      
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    fetchNotifications(1, true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);
      
      await api.post(`/notifications/${notificationId}/read`);
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      
      if (notification.data?.deepLink) {
        router.push(notification.data.deepLink);
      } else {
        switch (notification.type) {
          case 'new_message':
            if (notification.data?.conversationId) {
              router.push(`/chat/${notification.data.conversationId}`);
            }
            break;
          case 'shift_reminder':
            router.push('/rota');
            break;
          case 'new_payslip':
            router.push('/pages/payslips');
            break;
        }
      }
    } catch (error) {
      console.error('Failed to handle notification press:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'shift_reminder':
        return Clock;
      case 'new_message':
        return MessageSquare;
      case 'new_payslip':
        return FileText;
      case 'holiday_approved':
        return Calendar;
      case 'rota_updated':
        return Calendar;
      default:
        return Bell;
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'shift_reminder':
        return '#2563EB';
      case 'new_message':
        return '#8B5CF6';
      case 'new_payslip':
        return '#F59E0B';
      case 'holiday_approved':
        return '#10B981';
      case 'rota_updated':
        return '#EC4899';
      default:
        return '#6B7280';
    }
  };

  const filteredNotifications = notifications.filter(n => 
    activeTab === 'all' ? true : !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const Icon = getNotificationIcon(item.type);
    const iconColor = getNotificationIconColor(item.type);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            opacity: item.read ? 0.8 : 1
          }
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationIconContainer}>
          <Icon size={20} color={iconColor} />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[
              styles.notificationTitle,
              !item.read && styles.unreadNotificationTitle
            ]}>
              {item.title}
            </Text>
            {!item.read && (
              <View style={styles.unreadDot} />
            )}
          </View>
          
          <Text style={styles.notificationBody} numberOfLines={3}>
            {item.body}
          </Text>
          
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationTime}>
              {formatTimeAgo(item.createdAt)}
            </Text>
            
            {!item.read && markingAsRead !== item.id && (
              <TouchableOpacity
                style={styles.markReadButton}
                onPress={() => markAsRead(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <CheckCircle size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            
            {markingAsRead === item.id && (
              <ActivityIndicator size="small" color="#9CA3AF" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={64} color={isDark ? '#4B5563' : '#9CA3AF'} />
      <Text style={styles.emptyStateTitle}>
        No notifications yet
      </Text>
      <Text style={styles.emptyStateText}>
        {activeTab === 'unread' 
          ? 'You have no unread notifications'
          : 'You\'ll see notifications here when you receive them'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore || notifications.length === 0) return null;
    
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {hasMore ? 'Loading more...' : 'No more notifications'}
        </Text>
      </View>
    );
  };

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#111827' : '#F9FAFB'}
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={isDark ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
            onPress={() => setActiveTab('unread')}
          >
            <View style={styles.tabWithBadge}>
              <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
                Unread
              </Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        {loading && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotificationItem}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2563EB']}
                tintColor="#2563EB"
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
      paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    markAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    markAllText: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '500',
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: '#2563EB',
    },
    tabText: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    activeTabText: {
      color: '#2563EB',
      fontWeight: '600',
    },
    tabWithBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badge: {
      backgroundColor: '#EF4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexGrow: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationItem: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    notificationIconContainer: {
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    notificationTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    unreadNotificationTitle: {
      fontWeight: '700',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
      marginLeft: 8,
    },
    notificationBody: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
      lineHeight: 20,
      marginBottom: 8,
    },
    notificationFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    notificationTime: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    markReadButton: {
      padding: 4,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      maxWidth: 300,
    },
    footer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
  });
}