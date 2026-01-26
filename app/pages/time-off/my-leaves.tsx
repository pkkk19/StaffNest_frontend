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
  Animated,
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
  ChevronRight,
  Plus,
  ArrowLeft,
  Filter,
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

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'approved':
        return isDark ? '#10B98120' : '#10B98110';
      case 'rejected':
        return isDark ? '#EF444420' : '#EF444410';
      case 'pending':
        return isDark ? '#F59E0B20' : '#F59E0B10';
      case 'cancelled':
        return isDark ? '#6B728020' : '#6B728010';
      default:
        return isDark ? '#6B728020' : '#6B728010';
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

  const getLeaveTypeBackgroundColor = (type: string) => {
    const color = getLeaveTypeColor(type);
    return isDark ? `${color}20` : `${color}15`;
  };

  const formatLeaveType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filters = [
    { value: 'all', label: 'All', count: leaves.length },
    { value: 'pending', label: 'Pending', count: leaves.filter(l => l.status === 'pending').length },
    { value: 'approved', label: 'Approved', count: leaves.filter(l => l.status === 'approved').length },
    { value: 'rejected', label: 'Rejected', count: leaves.filter(l => l.status === 'rejected').length },
    { value: 'cancelled', label: 'Cancelled', count: leaves.filter(l => l.status === 'cancelled').length },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={isDark ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Leaves</Text>
            {/* <Text style={styles.headerSubtitle}>
              View your leave requests and status
            </Text> */}
          </View>
          <TouchableOpacity
            style={styles.newRequestButton}
            onPress={() => router.push('/pages/time-off/new-request')}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{leaves.length}</Text>
            <Text style={styles.summaryLabel}>Total Requests</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {leaves.filter(l => l.status === 'pending').length}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {leaves.filter(l => l.status === 'approved').length}
            </Text>
            <Text style={styles.summaryLabel}>Approved</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Filter by Status</Text>
            <Filter size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {filters.map((filterItem) => (
              <TouchableOpacity
                key={filterItem.value}
                style={[
                  styles.filterButton,
                  filter === filterItem.value && styles.filterButtonActive,
                  { backgroundColor: getStatusBackgroundColor(filterItem.value) },
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
                <View style={styles.filterBadge}>
                  <Text style={[
                    styles.filterBadgeText,
                    filter === filterItem.value && styles.filterBadgeTextActive,
                  ]}>
                    {filterItem.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Leave List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {filter === 'all' ? 'All Leaves' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Leaves`}
            </Text>
            <Text style={styles.leaveCount}>{leaves.length} requests</Text>
          </View>
          
          {leaves.length > 0 ? (
            <View style={styles.leavesList}>
              {leaves.map((leave) => (
                <TouchableOpacity
                  key={leave._id}
                  style={styles.leaveCard}
                  onPress={() => router.push(`/pages/time-off/leave/${leave._id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.leaveCardHeader}>
                    <View style={styles.leaveTypeBadge}>
                      <View
                        style={[
                          styles.typeIndicator,
                          { backgroundColor: getLeaveTypeColor(leave.leave_type) },
                        ]}
                      />
                      <Text style={styles.leaveTypeText}>
                        {formatLeaveType(leave.leave_type)}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBackgroundColor(leave.status) }
                    ]}>
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

                  <View style={styles.dateSection}>
                    <View style={styles.dateRow}>
                      <Calendar size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                      <Text style={styles.dateText}>
                        {formatDateRange(leave.start_date, leave.end_date)}
                      </Text>
                    </View>
                    
                    {leave.duration_type === 'partial_day' && leave.start_time && leave.end_time && (
                      <View style={styles.timeRow}>
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

                    {leave.is_half_day && (
                      <View style={styles.halfDayBadge}>
                        <Text style={styles.halfDayText}>
                          Half Day ({leave.half_day_period || 'morning'})
                        </Text>
                      </View>
                    )}
                  </View>

                  {leave.reason && (
                    <Text style={styles.reasonText} numberOfLines={2}>
                      {leave.reason}
                    </Text>
                  )}

                  <View style={styles.leaveCardFooter}>
                    <View style={styles.daysInfo}>
                      <Text style={styles.daysLabel}>Duration:</Text>
                      <Text style={styles.daysValue}>
                        {leave.days_used || leave.total_days || 0} day{leave.days_used !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <FileText size={48} color={isDark ? '#374151' : '#D1D5DB'} />
              <Text style={styles.emptyStateText}>
                {filter !== 'all' 
                  ? `No ${filter} leave requests` 
                  : 'No leave requests found'
                }
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {filter !== 'all'
                  ? `Try changing the filter or create a new request`
                  : 'Create your first leave request by tapping the + button above'
                }
              </Text>
              {filter !== 'all' && (
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => setFilter('all')}
                >
                  <Text style={styles.clearFilterButtonText}>Show All Leaves</Text>
                </TouchableOpacity>
              )}
              {filter === 'all' && (
                <TouchableOpacity
                  style={styles.createFirstButton}
                  onPress={() => router.push('/pages/time-off/new-request')}
                >
                  <Text style={styles.createFirstButtonText}>Create First Request</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

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
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    newRequestButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#2563EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    summarySection: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 24,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: '800',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
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
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    leaveCount: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
    },
    filtersContainer: {
      paddingBottom: 8,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      marginRight: 8,
      gap: 8,
    },
    filterButtonActive: {
      borderWidth: 2,
      borderColor: '#2563EB',
    },
    filterButtonText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontWeight: '600',
    },
    filterButtonTextActive: {
      color: isDark ? '#F9FAFB' : '#111827',
    },
    filterBadge: {
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 24,
      alignItems: 'center',
    },
    filterBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    filterBadgeTextActive: {
      color: isDark ? '#F9FAFB' : '#111827',
    },
    leavesList: {
      gap: 12,
    },
    leaveCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    leaveCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    leaveTypeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 8,
    },
    typeIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    leaveTypeText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      textTransform: 'capitalize',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    dateSection: {
      gap: 8,
      marginBottom: 12,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dateText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timeText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    halfDayBadge: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    halfDayText: {
      fontSize: 12,
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontWeight: '500',
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
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#F3F4F6',
    },
    daysInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    daysLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    daysValue: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#D1D5DB' : '#374151',
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 20,
    },
    clearFilterButton: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    clearFilterButtonText: {
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontWeight: '600',
      fontSize: 14,
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
    footer: {
      height: 40,
    },
  });
}