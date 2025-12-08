// app/rota/shift-requests.tsx (Updated with debugging)
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, User, CheckCircle, XCircle, AlertCircle, Calendar, RefreshCw } from 'lucide-react-native';
import { ShiftRequest } from '@/app/types/rota.types';
import { useShiftRequests } from '@/hooks/useShiftRequests';

export default function ShiftRequestsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { getShiftRequests, approveRequest, rejectRequest, loading } = useShiftRequests();
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const styles = createStyles(theme);

  useEffect(() => {
    console.log('🔄 ShiftRequestsScreen mounted, user:', user);
    console.log('👤 User role:', user?.role);
    console.log('🏢 Company ID:', user?.company_id);
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    console.log('🔄 Fetching shift requests...');
    try {
      setError(null);
      setDebugInfo({
        loading: true,
        timestamp: new Date().toISOString(),
        userRole: user?.role,
        companyId: user?.company_id
      });
      
      const data = await getShiftRequests();
      console.log('✅ Requests fetched:', data?.length || 0);
      
      setRequests(data || []);
    } catch (err: any) {
      console.error('❌ Error fetching requests:', err);
      const errorMsg = err.message || 'Failed to fetch shift requests';
      setError(errorMsg);
    }
  };

  const onRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleApprove = async (requestId: string) => {
    try {
      await approveRequest(requestId, 'Approved');
      Alert.alert('Success', 'Shift request approved');
      fetchRequests();
    } catch (error: any) {
      console.error('Approve error:', error);
      Alert.alert('Error', error.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this shift request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectRequest(requestId, 'Not available');
              Alert.alert('Success', 'Shift request rejected');
              fetchRequests();
            } catch (error: any) {
              console.error('Reject error:', error);
              Alert.alert('Error', error.message || 'Failed to reject request');
            }
          },
        },
      ]
    );
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const approvedRequests = requests.filter(req => req.status === 'approved');
  const rejectedRequests = requests.filter(req => req.status === 'rejected');

  const totalRequests = pendingRequests.length + approvedRequests.length + rejectedRequests.length;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
        <Text style={styles.loadingText}>Loading shift requests...</Text>
        {debugInfo && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>User: {user?.first_name} {user?.last_name}</Text>
            <Text style={styles.debugText}>Role: {user?.role}</Text>
            <Text style={styles.debugText}>Company: {user?.company_id}</Text>
          </View>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={64} color={theme === 'dark' ? '#EF4444' : '#DC2626'} />
        <Text style={styles.errorTitle}>Unable to Load Requests</Text>
        <Text style={styles.errorText}>{error}</Text>
        
        {debugInfo && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Information:</Text>
            <Text style={styles.debugText}>User Role: {user?.role}</Text>
            <Text style={styles.debugText}>Company ID: {user?.company_id}</Text>
            <Text style={styles.debugText}>User ID: {user?._id}</Text>
            <Text style={styles.debugText}>Endpoint: /shifts/requests?status=pending</Text>
            <Text style={styles.debugText}>Last Attempt: {debugInfo.timestamp}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <RefreshCw 
            size={20} 
            color={theme === 'dark' ? '#3B82F6' : '#2563EB'} 
            style={styles.retryIcon}
          />
          <Text style={styles.retryButton} onPress={fetchRequests}>
            Try Again
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Debug header for testing */}
      {__DEV__ && (
        <View style={styles.debugHeader}>
          <Text style={styles.debugHeaderText}>
            Shift Requests ({totalRequests}) • User: {user?.role} • Company: {user?.company_id?.substring(0, 8)}...
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme === 'dark' ? '#3B82F6' : '#2563EB'}
          />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{pendingRequests.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{approvedRequests.length}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{rejectedRequests.length}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        {totalRequests === 0 ? (
          <View style={styles.emptyState}>
            <User size={64} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.emptyTitle}>No shift requests</Text>
            <Text style={styles.emptyText}>
              Staff shift requests will appear here
            </Text>
            <Text style={styles.emptySubtext}>
              When staff request open shifts, you'll see them here
            </Text>
            
            {/* Debug info in empty state */}
            {__DEV__ && (
              <View style={styles.emptyDebug}>
                <Text style={styles.emptyDebugText}>
                  Debug: User is {user?.role} • Company ID: {user?.company_id}
                </Text>
                <Text style={styles.emptyDebugText}>
                  Endpoint: GET /shifts/requests?status=pending
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <AlertCircle size={20} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Awaiting your approval</Text>
                </View>
                {pendingRequests.map(request => (
                  <RequestCard
                    key={request._id}
                    request={request}
                    onApprove={() => handleApprove(request._id)}
                    onReject={() => handleReject(request._id)}
                    theme={theme}
                  />
                ))}
              </View>
            )}

            {/* Approved Requests */}
            {approvedRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <CheckCircle size={20} color="#10B981" />
                    <Text style={styles.sectionTitle}>Approved ({approvedRequests.length})</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Successfully approved requests</Text>
                </View>
                {approvedRequests.map(request => (
                  <RequestCard
                    key={request._id}
                    request={request}
                    theme={theme}
                    isCompleted={true}
                  />
                ))}
              </View>
            )}

            {/* Rejected Requests */}
            {rejectedRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <XCircle size={20} color="#EF4444" />
                    <Text style={styles.sectionTitle}>Rejected ({rejectedRequests.length})</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Declined shift requests</Text>
                </View>
                {rejectedRequests.map(request => (
                  <RequestCard
                    key={request._id}
                    request={request}
                    theme={theme}
                    isCompleted={true}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Request Card Component (keep as is)
const RequestCard = ({ 
  request, 
  onApprove, 
  onReject, 
  theme, 
  isCompleted = false 
}: { 
  request: ShiftRequest;
  onApprove?: () => void;
  onReject?: () => void;
  theme: string;
  isCompleted?: boolean;
}) => {
  const styles = createRequestStyles(theme);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const startDate = new Date(request.shift_id.start_time);
  const endDate = new Date(request.shift_id.end_time);
  const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.shiftTitle}>{request.shift_id.title}</Text>
          <View style={styles.dateTime}>
            <Calendar size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.dateTimeText}>
              {formatDate(request.shift_id.start_time)} • {formatTime(request.shift_id.start_time)} - {formatTime(request.shift_id.end_time)}
            </Text>
            <Text style={styles.durationText}>({durationHours.toFixed(1)}h)</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: 
            request.status === 'approved' ? '#10B981' :
            request.status === 'rejected' ? '#EF4444' : '#F59E0B'
          }
        ]}>
          <Text style={styles.statusText}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.staffInfo}>
        <User size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <Text style={styles.staffName}>
          {request.requested_by.first_name} {request.requested_by.last_name}
        </Text>
      </View>

      {request.staff_notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Staff Notes:</Text>
          <Text style={styles.notesText}>{request.staff_notes}</Text>
        </View>
      )}

      {!isCompleted && (
        <View style={styles.actions}>
          <Text style={styles.rejectButton} onPress={onReject}>
            Reject
          </Text>
          <Text style={styles.approveButton} onPress={onApprove}>
            Approve
          </Text>
        </View>
      )}

      {request.responded_at && (
        <View style={styles.respondedInfo}>
          <Text style={styles.respondedText}>
            {request.status} by {request.responded_by?.first_name} on {new Date(request.responded_at).toLocaleDateString()}
          </Text>
          {request.admin_notes && (
            <Text style={styles.adminNotes}>Admin notes: {request.admin_notes}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
  },
  debugHeader: {
    backgroundColor: theme === 'dark' ? '#1E3A8A' : '#DBEAFE',
    padding: 8,
    alignItems: 'center',
  },
  debugHeaderText: {
    fontSize: 12,
    color: theme === 'dark' ? '#93C5FD' : '#1E40AF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
    gap: 16,
  },
  loadingText: {
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    fontSize: 16,
  },
  debugInfo: {
    marginTop: 20,
    padding: 12,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#F3F4F6',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: theme === 'dark' ? '#EF4444' : '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  debugContainer: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  retryIcon: {
    marginRight: 4,
  },
  retryButton: {
    color: theme === 'dark' ? '#3B82F6' : '#2563EB',
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    backgroundColor: theme === 'dark' ? '#1E40AF' : '#DBEAFE',
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: theme === 'dark' ? '#000' : '#E5E7EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textAlign: 'center',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 16,
    marginTop: 32,
    marginHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyDebug: {
    marginTop: 20,
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    width: '100%',
  },
  emptyDebugText: {
    fontSize: 11,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
});

const createRequestStyles = (theme: string) => StyleSheet.create({
  card: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    shadowColor: theme === 'dark' ? '#000' : '#E5E7EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 4,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dateTimeText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  durationText: {
    fontSize: 12,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  staffName: {
    fontSize: 14,
    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  rejectButton: {
    flex: 1,
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    padding: 12,
    backgroundColor: theme === 'dark' ? '#7F1D1D' : '#FEE2E2',
    borderRadius: 8,
  },
  approveButton: {
    flex: 1,
    textAlign: 'center',
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    padding: 12,
    backgroundColor: theme === 'dark' ? '#064E3B' : '#D1FAE5',
    borderRadius: 8,
  },
  respondedInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  respondedText: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  adminNotes: {
    fontSize: 12,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    fontStyle: 'italic',
  },
});