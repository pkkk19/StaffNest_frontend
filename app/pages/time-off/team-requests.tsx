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
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  MoreVertical,
  Clock,
} from 'lucide-react-native';
import { timeOffAPI } from '@/services/api';

export default function TeamRequests() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRequests();
    }
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await timeOffAPI.getAllLeaves(params);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching team requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      await timeOffAPI.approveOrRejectLeave(requestId, {
        status: 'approved',
        update_user_balance: true,
      });
      Alert.alert('Success', 'Leave request approved');
      fetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    Alert.prompt(
      'Reject Leave Request',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason?: string) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Error', 'Rejection reason is required');
              return;
            }
            try {
              setActionLoading(requestId);
              await timeOffAPI.approveOrRejectLeave(requestId, {
                status: 'rejected',
                rejection_reason: reason,
                update_user_balance: true,
              });
              Alert.alert('Success', 'Leave request rejected');
              fetchRequests();
            } catch (error: any) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject request');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
      'plain-text'
    );
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
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <View style={styles.unauthorizedContainer}>
          <Text style={styles.unauthorizedText}>
            Admin access required
          </Text>
          <Text style={styles.unauthorizedSubtext}>
            Only administrators can view team leave requests
          </Text>
        </View>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#3B82F6' : '#2563EB'} />
        <Text style={styles.loadingText}>Loading team requests...</Text>
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
            <Text style={styles.headerTitle}>Team Requests</Text>
            <Text style={styles.headerSubtitle}>
              Manage team leave requests
            </Text>
          </View>
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

        {/* Requests List */}
        <View style={styles.requestsList}>
          {requests.length > 0 ? (
            requests.map((request) => (
              <View key={request._id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {request.user_id?.first_name?.[0] || 'U'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.userName}>
                        {request.user_id?.first_name} {request.user_id?.last_name}
                      </Text>
                      {request.user_id?.position && (
                        <Text style={styles.userPosition}>
                          {request.user_id.position}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.requestStatus}>
                    {getStatusIcon(request.status)}
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(request.status) },
                      ]}
                    >
                      {request.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestDetails}>
                  <View style={styles.leaveType}>
                    <View
                      style={[
                        styles.typeIndicator,
                        { backgroundColor: getLeaveTypeColor(request.leave_type) },
                      ]}
                    />
                    <Text style={styles.leaveTypeText}>
                      {request.leave_type?.replace('_', ' ') || 'Leave'}
                    </Text>
                  </View>

                  <View style={styles.dateContainer}>
                    <Calendar size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    <Text style={styles.dateText}>
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </Text>
                    {request.days_used && (
                      <Text style={styles.daysText}>
                        • {request.days_used} days
                      </Text>
                    )}
                  </View>

                  {request.duration_type === 'partial_day' && request.start_time && request.end_time && (
                    <View style={styles.timeContainer}>
                      <Clock size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                      <Text style={styles.timeText}>
                        {new Date(request.start_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(request.end_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.reasonText} numberOfLines={3}>
                    {request.reason}
                  </Text>
                </View>

                {request.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.approveButton, actionLoading === request._id && styles.buttonDisabled]}
                      onPress={() => handleApprove(request._id)}
                      disabled={actionLoading === request._id}
                    >
                      <CheckCircle size={16} color="#FFFFFF" />
                      <Text style={styles.approveButtonText}>
                        {actionLoading === request._id ? 'Approving...' : 'Approve'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectButton, actionLoading === request._id && styles.buttonDisabled]}
                      onPress={() => handleReject(request._id)}
                      disabled={actionLoading === request._id}
                    >
                      <XCircle size={16} color="#FFFFFF" />
                      <Text style={styles.rejectButtonText}>
                        {actionLoading === request._id ? 'Rejecting...' : 'Reject'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color={isDark ? '#374151' : '#D1D5DB'} />
              <Text style={styles.emptyStateText}>
                {filter !== 'all'
                  ? `No ${filter} requests found`
                  : 'No leave requests yet'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                All pending leave requests will appear here
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
    unauthorizedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    unauthorizedText: {
      fontSize: 24,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
    },
    unauthorizedSubtext: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    header: {
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
    requestsList: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    requestCard: {
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
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#3B82F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    userPosition: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
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
      marginBottom: 16,
    },
    leaveType: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    typeIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    leaveTypeText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#D1D5DB' : '#4B5563',
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
    daysText: {
      fontSize: 14,
      fontWeight: '500',
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
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    approveButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#10B981',
      padding: 12,
      borderRadius: 12,
    },
    rejectButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#EF4444',
      padding: 12,
      borderRadius: 12,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    approveButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    rejectButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
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