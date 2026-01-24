// app/dashboard.tsx
import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator, Image, StatusBar, TouchableOpacity } from 'react-native';
import { Bell, Calendar, Clock, FileText, Users, MessageSquare, Mail, User, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { DashboardCard } from '@/components/DashboardCard';
import ForceTouchable from '@/components/ForceTouchable';
import { useState, useEffect } from 'react';
import { shiftsAPI, companiesAPI } from '@/services/api';
import AISearchBar from '@/components/AI/AISearchBar';
import StoriesCarousel from '@/components/Stories/StoriesCarousel';
import api from '@/services/api';

// Define the Company type based on your API response
type Company = {
  id?: string;
  name?: string;
  logo_url?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
};

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

export default function Dashboard() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    hoursThisWeek: 0,
    holidaysLeft: 0
  });
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const styles = createStyles(theme);

  useEffect(() => {
    if (user && !authLoading) {
      fetchDashboardData();
      fetchCompanyData();
      fetchRecentNotifications();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch real data from your backend
      // Example: const shiftsResponse = await shiftsAPI.getShifts();
      // Calculate hoursThisWeek from shifts data
      
      // For now, using mock data
      setStats({
        hoursThisWeek: 37.5,
        holidaysLeft: 12
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyData = async () => {
    try {
      setCompanyLoading(true);
      setCompanyError(null);
      
      // First try to get the user's company
      const response = await companiesAPI.getCompany(user!.company_id?.toString() || '');
      
      if (response.data) {
        setCompany(response.data);
      } else {
        throw new Error('No company data received');
      }
      
    } catch (error: any) {
      // Check if it's a 404 error (company not found)
      if (error.response?.status === 404) {
        setCompanyError('No company associated with your account');
      } else {
        setCompanyError(error.message || 'Failed to load company information');
      }
      
      setCompany(null);
    } finally {
      setCompanyLoading(false);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      setNotificationsLoading(true);
      // Fetch actual notifications from API
      const response = await api.get('/notifications/history', {
        params: { limit: 6, page: 1 }
      });
      
      if (response.data?.notifications) {
        setNotifications(response.data.notifications);
      }
      
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Optional: Show error state or fallback to empty array
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await api.post(`/notifications/${notification.id}/read`);
        
        // Update local state
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
      }
      
      // Navigate based on notification data
      if (notification.data?.deepLink) {
        router.push(notification.data.deepLink);
      }
    } catch (error) {
      console.error('Failed to handle notification press:', error);
    }
  };

  // Helper function to get company name for logo placeholder
  const getCompanyInitial = () => {
    if (!company?.name) return 'C';
    
    // Get first letter of company name
    const firstChar = company.name.charAt(0).toUpperCase();
    
    // If it's a letter, use it, otherwise use 'C'
    return /[A-Z]/.test(firstChar) ? firstChar : 'C';
  };

  const quickActions = [
    { icon: Calendar, title: t('viewRota'), color: '#2563EB', route: '/rota' },
    { icon: Clock, title: t('clockIn'), color: '#10B981', route: '/time' },
    { 
      icon: FileText, 
      title: t('payslips'), 
      color: '#F59E0B', 
      route: user?.role === 'admin' ? '/pages/admin/payslips' : '/pages/payslips'
    },
    ...(user?.role === 'admin' ? [
      { icon: Users, title: t('manageStaff'), color: '#8B5CF6', route: '/staff' },
      { icon: Bell, title: t('sendNotifications'), color: '#EF4444', route: '/notifications' }
    ] : []),
  ];

  // Helper function for notification colors
  const getNotificationColor = (type: string) => {
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

  const displayedNotifications = notifications.slice(0, 5);

  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#111827' : '#F9FAFB'}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.companyContainer}>
            {company?.logo_url ? (
              <Image 
                source={{ uri: company.logo_url }} 
                style={styles.companyLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.companyLogoPlaceholder, { backgroundColor: theme === 'dark' ? '#374151' : '#E5E7EB' }]}>
                <Text style={styles.companyLogoText}>
                  {getCompanyInitial()}
                </Text>
              </View>
            )}
            <View style={styles.companyInfo}>
              {companyLoading ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : companyError ? (
                <Text style={styles.companyNameError}>
                  {companyError}
                </Text>
              ) : (
                <Text style={styles.companyName} numberOfLines={2}>
                  {company?.name || t('myCompany')}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerActions}>
            {/* Profile Icon */}
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => router.push('/pages/edit-profile')}
            >
              <User size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
            </TouchableOpacity>
            
            {/* Envelope Icon (for notifications) */}
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => router.push('/notifications')}
            >
              <Mail size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats section moved up to replace greeting section */}
        <StoriesCarousel />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <ForceTouchable
                key={index} 
                style={[styles.actionCard, { borderLeftColor: action.color }]}
                onPress={() => router.push(action.route as any)}
              >
                <action.icon size={24} color={action.color} />
                <Text style={styles.actionTitle}>{action.title}</Text>
              </ForceTouchable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AISearchBar 
            placeholder="What's on your mind today?"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recentNotifications')}</Text>
            {notifications.length > 0 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/notifications')}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <ChevronRight size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            )}
          </View>
          
          {notificationsLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <>
              {displayedNotifications.map(notification => {
                const Icon = getNotificationIcon(notification.type);
                const color = getNotificationColor(notification.type);
                
                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      { 
                        borderLeftColor: color,
                        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        opacity: notification.read ? 0.7 : 1
                      }
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationTitleContainer}>
                        <Icon size={16} color={color} style={styles.notificationIcon} />
                        <Text style={[
                          styles.notificationTitle,
                          !notification.read && styles.unreadNotification
                        ]}>
                          {notification.title}
                        </Text>
                      </View>
                      <Text style={styles.notificationTime}>
                        {formatTimeAgo(notification.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.notificationMessage}>{notification.body}</Text>
                    {!notification.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
              
              {notifications.length > 5 && (
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => router.push('/notifications')}
                >
                  <Text style={styles.viewMoreText}>
                    View {notifications.length - 5} more notifications
                  </Text>
                  <ChevronRight size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              )}
              
              {notifications.length === 0 && (
                <View style={styles.emptyState}>
                  <Bell size={48} color={theme === 'dark' ? '#4B5563' : '#9CA3AF'} />
                  <Text style={styles.emptyStateText}>
                    No notifications yet
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
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
    },
    scrollContent: {
      paddingBottom: 20,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 20,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    companyContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    headerIcon: {
      padding: 8,
    },
    companyLogo: {
      width: 48,
      height: 48,
      borderRadius: 10,
    },
    companyLogoPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    companyLogoText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    companyInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    companyName: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      letterSpacing: 0.5,
    },
    companyNameError: {
      fontSize: 14,
      fontWeight: '400',
      color: isDark ? '#EF4444' : '#DC2626',
      fontStyle: 'italic',
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 24,
      gap: 12,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewAllText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    actionCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      ...Platform.select({
        android: {
          elevation: 3,
        },
      }),
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#374151',
      flex: 1,
    },
    notificationItem: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
      position: 'relative',
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    notificationTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    notificationIcon: {
      marginRight: 4,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    unreadNotification: {
      fontWeight: '700',
    },
    notificationTime: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    notificationMessage: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
    unreadDot: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
    },
    viewMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      marginTop: 8,
      gap: 8,
    },
    viewMoreText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
    },
    emptyStateText: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 12,
    },
  });
}