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
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  ChevronRight,
} from 'lucide-react-native';
import { timeOffAPI } from '@/services/api';

export default function MyLeaves() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchLeaves();
  }, [filter]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await timeOffAPI.getMyLeaves(params);
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaves();
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
    };
    return colors[type] || '#6B7280';
  };

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#3B82F6' : '#2563EB'} />
        <Text style={styles.loadingText}>Loading leave requests...</Text>
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
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Leaves</Text>
            <Text style={styles.headerSubtitle}>
              View your leave requests and status
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newRequestButton}
            onPress={() => router.push('/pages/time-off/new-request')}
          >
            <Text style={styles.newRequestButtonText}>New Request</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {filters.map((filterItem) => (
              <TouchableOpacity
                key={filterItem.value}
                style={[
                  styles.filterButton,
                  filter === filterItem.value && styles.filterButtonActive,
                ]}
                onPress={() => setFilter(filterItem.value)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === filterItem.value && styles.filterButtonTextActive,
                  ]}
                >
                  {filterItem.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Leave List */}
        <View style={styles.leavesList}>
          {leaves.length > 0 ? (
            leaves.map((leave) => (
              <TouchableOpacity
                key={leave._id}
                style={styles.leaveCard}
                onPress={() => router.push(`/pages/time-off/leave/${leave._id}`)}
              >
                <View style={styles.leaveCardHeader}>
                  <View style={styles.leaveType}>
                    <View
                      style={[
                        styles.typeIndicator,
                        { backgroundColor: getLeaveTypeColor(leave.leave_type) },
                      ]}
                    />
                    <Text style={styles.leaveTypeText}>
                      {leave.leave_type?.replace('_', ' ') || 'Leave'}
                    </Text>
                  </View>
                  <View style={styles.leaveStatus}>
                    {getStatusIcon(leave.status)}
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(leave.status) },
                      ]}
                    >
                      {leave.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.dateContainer}>
                  <Calendar size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text style={styles.dateText}>
                    {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                  </Text>
                </View>

                {leave.duration_type === 'partial_day' && leave.start_time && leave.end_time && (
                  <View style={styles.timeContainer}>
                    <Clock size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
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

                <Text style={styles.reasonText} numberOfLines={2}>
                  {leave.reason}
                </Text>

                <View style={styles.leaveCardFooter}>
                  <Text style={styles.daysText}>
                    {leave.days_used || leave.total_days || 0} days
                  </Text>
                  <ChevronRight size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <FileText size={48} color={isDark ? '#374151' : '#D1D5DB'} />
              <Text style={styles.emptyStateText}>No leave requests found</Text>
              <Text style={styles.emptyStateSubtext}>
                {filter !== 'all'
                  ? `No ${filter} leave requests`
                  : 'Request your first time off by tapping the button above'}
              </Text>
            </View>
          )}
        </View>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 20,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    newRequestButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    newRequestButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    filterSection: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    filterScroll: {
      flexDirection: 'row',
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
    },
    filterButtonActive: {
      backgroundColor: '#2563EB',
    },
    filterButtonText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontWeight: '500',
    },
    filterButtonTextActive: {
      color: '#FFFFFF',
    },
    leavesList: {
      paddingHorizontal: 20,
    },
    leaveCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
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
    leaveCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    leaveType: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    typeIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    leaveTypeText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      textTransform: 'capitalize',
    },
    leaveStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    dateText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    timeText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    reasonText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#374151',
      lineHeight: 20,
      marginBottom: 16,
    },
    leaveCardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#F3F4F6',
      paddingTop: 12,
    },
    daysText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
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
    },
  });
}