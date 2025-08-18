import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  RefreshControl,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { router } from 'expo-router';
import { Bell, Calendar, Clock, FileText, MessageCircle, Users, TrendingUp, CircleAlert as AlertCircle, CircleCheck as CheckCircle, MapPin, Shield, Sun, User } from 'lucide-react-native';
import { addNotification } from '@/store/slices/notificationSlice';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export default function Dashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);
  const { currentEntry } = useSelector((state: RootState) => state.timeTracking);
  const { shifts } = useSelector((state: RootState) => state.rota);
  const dispatch = useDispatch();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
      dispatch(addNotification({
        id: Date.now().toString(),
        title: 'Data Refreshed',
        message: 'Dashboard information has been updated',
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      }));
    }, 1500);
  }, [dispatch]);

  useEffect(() => {
    // Initialize with welcome notification only if it doesn't exist
    const welcomeExists = notifications.some(n => n.id === 'welcome');
    if (!welcomeExists) {
      dispatch(addNotification({
        id: 'welcome',
        title: `Welcome ${user?.name}!`,
        message: `You're logged in as ${user?.role}. All systems ready.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      }));
    }

    // Security check simulation only if it doesn't exist
    const securityCheckExists = notifications.some(n => n.id === 'security-check');
    if (Device.isDevice && !securityCheckExists) {
      dispatch(addNotification({
        id: 'security-check',
        title: 'Security Check',
        message: 'Device security validated successfully',
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
      }));
    }
  }, [user, dispatch, notifications]);

  const getCurrentShift = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    return shifts.find(shift => 
      shift.date === today && 
      shift.staffId === user?.id &&
      parseInt(shift.startTime.split(':')[0]) <= currentHour &&
      parseInt(shift.endTime.split(':')[0]) > currentHour
    );
  };

  const currentShift = getCurrentShift();
  const todayShifts = shifts.filter(shift => 
    shift.date === new Date().toISOString().split('T')[0]
  );

  const quickActions = [
    {
      id: 'rota',
      title: 'Rota',
      subtitle: 'View schedules',
      icon: Calendar,
      color: '#2563EB',
      route: '/(tabs)/rota',
      badge: currentShift ? '1' : undefined,
    },
    {
      id: 'clock',
      title: 'Clock In/Out',
      subtitle: currentEntry ? 'Currently working' : 'Start your shift',
      icon: Clock,
      color: '#059669',
      route: '/(tabs)/time',
      badge: currentEntry ? 'ACTIVE' : undefined,
    },
    {
      id: 'payslips',
      title: 'Payslips',
      subtitle: 'View pay history',
      icon: FileText,
      color: '#7C3AED',
      route: '/(tabs)/payslips',
    },
    {
      id: 'holidays',
      title: 'Time Off',
      subtitle: 'Request holidays',
      icon: Sun,
      color: '#EA580C',
      route: '/(tabs)/holidays',
    },
    {
      id: 'messages',
      title: 'Messages',
      subtitle: 'Team communication',
      icon: MessageCircle,
      color: '#DC2626',
      route: '/(tabs)/chat',
    },
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'Account settings',
      icon: User,
      color: '#059669',
      route: '/(tabs)/profile',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.statusBarSpacer} />
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>StaffNest</Text>
            <Text style={styles.userName}>Welcome back, {user?.name}</Text>
            <Text style={styles.userRole}>{user?.position}</Text>
          </View>
        </View>

        {/* Current Status */}
        {currentEntry && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusTitle}>Currently Working</Text>
            </View>
            <Text style={styles.statusTime}>
              Started at {new Date(currentEntry.clockIn).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <View style={styles.statusLocation}>
              <MapPin size={16} color="#059669" />
              <Text style={styles.statusLocationText}>{currentEntry.location.address}</Text>
            </View>
          </View>
        )}

        {/* Current Shift Info */}
        {currentShift && (
          <View style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <Calendar size={20} color="#2563EB" />
              <Text style={styles.shiftTitle}>Current Shift</Text>
            </View>
            <Text style={styles.shiftTime}>
              {currentShift.startTime} - {currentShift.endTime}
            </Text>
            <Text style={styles.shiftLocation}>
              {currentShift.branchName} • {currentShift.role}
            </Text>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#059669" />
            <Text style={styles.statValue}>8.5h</Text>
            <Text style={styles.statLabel}>Hours Today</Text>
          </View>
          
          <View style={styles.statCard}>
            <CheckCircle size={24} color="#2563EB" />
            <Text style={styles.statValue}>22</Text>
            <Text style={styles.statLabel}>Days Worked</Text>
          </View>
          
          <View style={styles.statCard}>
            <AlertCircle size={24} color="#EA580C" />
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Holiday Days</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                {action.badge && (
                  <View style={[styles.actionBadge, { backgroundColor: action.color }]}>
                    <Text style={styles.actionBadgeText}>{action.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Notifications */}
        <View style={styles.notificationsContainer}>
          <View style={styles.notificationsHeader}>
            <Text style={styles.sectionTitle}>Recent Updates</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {notifications.slice(0, 3).map((notification) => (
            <View key={`notification-${notification.id}`} style={styles.notificationItem}>
              <View style={styles.notificationIcon}>
                <Bell size={16} color={
                  notification.type === 'success' ? '#059669' :
                  notification.type === 'warning' ? '#EA580C' :
                  notification.type === 'error' ? '#DC2626' : '#2563EB'
                } />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>
                  {new Date(notification.timestamp).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
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
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  statusCard: {
    margin: 24,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
  },
  statusTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 8,
  },
  statusLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLocationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  shiftCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
    marginLeft: 8,
  },
  shiftTime: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  shiftLocation: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionCard: {
    width: '48%',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    position: 'relative',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  actionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  notificationsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
});