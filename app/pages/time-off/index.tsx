import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Calendar as CalendarIcon,
  Users,
  ChevronRight,
  CalendarDays,
  UserCheck,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react-native';
import { timeOffAPI } from '@/services/api';

export default function TimeOffDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, leavesRes] = await Promise.all([
        timeOffAPI.getLeaveSummary(),
        timeOffAPI.getMyLeaves({ limit: 5 }),
      ]);
      setSummary(summaryRes.data);
      setRecentLeaves(leavesRes.data);
      
      if (user?.role === 'admin') {
        const statsRes = await timeOffAPI.getCompanyStats();
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error fetching time off data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color="#10B981" />;
      case 'rejected':
        return <XCircle size={16} color="#EF4444" />;
      case 'pending':
        return <AlertCircle size={16} color="#F59E0B" />;
      case 'cancelled':
        return <XCircle size={16} color="#6B7280" />;
      default:
        return <AlertCircle size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      annual_leave: '#3B82F6',
      sick_leave: '#EC4899',
      time_off: '#8B5CF6',
      paid_leave: '#10B981',
      unpaid_leave: '#F59E0B',
      personal_leave: '#06B6D4',
      maternity_leave: '#8B5CF6',
      paternity_leave: '#3B82F6',
    };
    return colors[type] || '#6B7280';
  };

  const formatLeaveType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateUtilizationRate = () => {
    if (!summary?.total_annual_leave || !summary?.total_days_taken) return 0;
    const totalDays = summary.total_annual_leave;
    const takenDays = summary.total_days_taken;
    return Math.round((takenDays / totalDays) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#3B82F6' : '#2563EB'} />
        <Text style={styles.loadingText}>Loading time off data...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#111827' : '#F9FAFB'}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={isDark ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Time Off</Text>
            <Text style={styles.headerSubtitle}>
              Manage your leave requests and balances
            </Text>
          </View>
          {user?.role === 'admin' ? (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/pages/time-off/team-requests')}
            >
              <UserCheck size={20} color={isDark ? '#3B82F6' : '#2563EB'} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerRightPlaceholder} />
          )}
        </View>

        {/* Quick Stats - Reverted to original design */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {summary?.remaining_balance?.annual_leave?.days || 0}
            </Text>
            <Text style={styles.statLabel}>Annual Leave Days</Text>
            <Text style={styles.statSubtext}>
              {summary?.remaining_balance?.annual_leave?.hours || 0} hours
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {summary?.remaining_balance?.sick_leave?.days || 0}
            </Text>
            <Text style={styles.statLabel}>Sick Leave Days</Text>
            <Text style={styles.statSubtext}>
              {summary?.remaining_balance?.sick_leave?.hours || 0} hours
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary?.total_days_taken || 0}</Text>
            <Text style={styles.statLabel}>Days Taken</Text>
            <Text style={styles.statSubtext}>
              {summary?.total_hours_taken || 0} hours
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/pages/time-off/new-request')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F620' }]}>
                <Plus size={24} color="#3B82F6" />
              </View>
              <Text style={styles.actionTitle}>Request Leave</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/pages/time-off/my-leaves')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
                <FileText size={24} color="#10B981" />
              </View>
              <Text style={styles.actionTitle}>My Leaves</Text>
            </TouchableOpacity>
            
            {/* Admin-only actions */}
            {user?.role === 'admin' && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/pages/time-off/team-requests')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#EC489920' }]}>
                  <Users size={24} color="#EC4899" />
                </View>
                <Text style={styles.actionTitle}>Team Requests</Text>
              </TouchableOpacity>
            )}
            
            {/* Common action for all users */}
            {/* <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/pages/time-off/calendar')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#8B5CF620' }]}>
                <CalendarIcon size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.actionTitle}>Calendar</Text>
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Recent Leave Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Requests</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/pages/time-off/my-leaves')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>
          <View style={styles.requestsList}>
            {recentLeaves.length > 0 ? (
              recentLeaves.map((leave) => (
                <TouchableOpacity
                  key={leave._id}
                  style={styles.requestItem}
                  onPress={() => router.push(`/pages/time-off/leave/${leave._id}`)}
                >
                  <View style={styles.requestHeader}>
                    <View style={styles.requestType}>
                      <View
                        style={[
                          styles.typeIndicator,
                          { backgroundColor: getLeaveTypeColor(leave.leave_type) },
                        ]}
                      />
                      <Text style={styles.requestTypeText}>
                        {formatLeaveType(leave.leave_type)}
                      </Text>
                    </View>
                    <View style={styles.requestStatus}>
                      {getStatusIcon(leave.status)}
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(leave.status) },
                        ]}
                      >
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.requestDetails}>
                    <CalendarDays size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    <Text style={styles.requestDate}>
                      {new Date(leave.start_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                      {leave.start_date !== leave.end_date && (
                        <>
                          {' - '}
                          {new Date(leave.end_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </>
                      )}
                    </Text>
                  </View>
                  {leave.reason && (
                    <Text style={styles.requestReason} numberOfLines={2}>
                      {leave.reason}
                    </Text>
                  )}
                  {leave.duration_type === 'partial_day' && leave.start_time && leave.end_time && (
                    <View style={styles.timeContainer}>
                      <Clock size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                      <Text style={styles.timeText}>
                        {new Date(leave.start_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(leave.end_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  )}
                  {leave.is_half_day && (
                    <View style={styles.halfDayBadge}>
                      <Text style={styles.halfDayText}>
                        Half Day ({leave.half_day_period || 'morning'})
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <FileText size={48} color={isDark ? '#374151' : '#D1D5DB'} />
                <Text style={styles.emptyStateText}>No leave requests yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap "Request Leave" to create your first time off request
                </Text>
                <TouchableOpacity
                  style={styles.createFirstButton}
                  onPress={() => router.push('/pages/time-off/new-request')}
                >
                  <Text style={styles.createFirstButtonText}>Create First Request</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Admin Stats (only for admins) */}
        {user?.role === 'admin' && stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Overview</Text>
            <View style={styles.adminStats}>
              <View style={styles.adminStat}>
                <Text style={styles.adminStatValue}>{stats.total_requests || 0}</Text>
                <Text style={styles.adminStatLabel}>Total Requests</Text>
              </View>
              <View style={styles.adminStat}>
                <Text style={styles.adminStatValue}>{stats.by_status?.pending || 0}</Text>
                <Text style={styles.adminStatLabel}>Pending</Text>
              </View>
              <View style={styles.adminStat}>
                <Text style={styles.adminStatValue}>{stats.by_status?.approved || 0}</Text>
                <Text style={styles.adminStatLabel}>Approved</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer Spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 20,
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 25,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    adminButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerRightPlaceholder: {
      width: 44,
    },
    statsGrid: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
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
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 2,
    },
    statSubtext: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
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
      marginBottom: 8,
    },
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    seeAllText: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '500',
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    actionCard: {
      width: '48%',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#374151',
      textAlign: 'center',
    },
    requestsList: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      overflow: 'hidden',
    },
    requestItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#F3F4F6',
    },
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    requestType: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    typeIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    requestTypeText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      textTransform: 'capitalize',
    },
    requestStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    requestDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    requestDate: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    requestReason: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#374151',
      lineHeight: 20,
      marginBottom: 12,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    timeText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    halfDayBadge: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    halfDayText: {
      fontSize: 12,
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#D1D5DB' : '#374151',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      marginBottom: 16,
    },
    createFirstButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    createFirstButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    adminStats: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      gap: 20,
    },
    adminStat: {
      flex: 1,
      alignItems: 'center',
    },
    adminStatValue: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    adminStatLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    footer: {
      height: 40,
    },
  });
}