import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { Bell, Calendar, Clock, FileText, Users, MessageSquare } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { DashboardCard } from '@/components/DashboardCard';
import ForceTouchable from '@/components/ForceTouchable';

export default function Dashboard() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const styles = createStyles(theme);

  const quickActions = [
    { icon: Calendar, title: t('viewRota'), color: '#2563EB', route: '/rota' },
    { icon: Clock, title: t('clockIn'), color: '#10B981', route: '/time' },
    { icon: FileText, title: t('payslips'), color: '#F59E0B', route: '/payslips' },
    ...(user?.role === 'manager' ? [
      { icon: Users, title: t('manageStaff'), color: '#8B5CF6', route: '/staff' },
      { icon: Bell, title: t('sendNotifications'), color: '#EF4444', route: '/notifications' }
    ] : []),
  ];

  const notifications = [
    { id: 1, title: t('shiftReminder'), message: t('shiftTomorrow'), time: '2h ago', type: 'info' },
    { id: 2, title: t('holidayApproved'), message: t('holidayApprovedMsg'), time: '1d ago', type: 'success' },
    { id: 3, title: t('rotaUpdated'), message: t('rotaUpdatedMsg'), time: '2d ago', type: 'warning' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>
            {user?.role === 'manager' ? t('goodMorningManager') : t('goodMorning')}
          </Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={[styles.roleBadge, { 
            backgroundColor: user?.role === 'manager' ? '#F59E0B' : '#2563EB' 
          }]}>
            <Text style={styles.roleBadgeText}>
              {user?.role === 'manager' ? t('manager') : t('staff')}
            </Text>
          </View>
        </View>
        <ForceTouchable
          style={styles.bellIcon}
          onPress={() => router.push('/notifications')}
        >
          <Bell size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
      </View>

      <View style={styles.statsContainer}>
        <DashboardCard title={t('hoursThisWeek')} value="37.5" subtitle={t('hours')} color="#2563EB" />
        <DashboardCard title={t('holidaysLeft')} value="12" subtitle={t('days')} color="#10B981" />
      </View>

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
        <Text style={styles.sectionTitle}>{t('recentNotifications')}</Text>
        {notifications.map(notification => (
          <View key={notification.id} style={[
            styles.notificationItem,
            { borderLeftColor: getNotificationColor(notification.type) }
          ]}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Helper function for notification colors
function getNotificationColor(type: string) {
  switch (type) {
    case 'success': return '#10B981';
    case 'warning': return '#F59E0B';
    case 'error': return '#EF4444';
    default: return '#2563EB';
  }
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  const isColorblind = theme === 'colorblind';
  
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
    },
    greetingContainer: {
      flex: 1,
    },
    greeting: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    userName: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    roleBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    bellIcon: {
      padding: 8,
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
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
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    notificationTime: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    notificationMessage: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
  });
}