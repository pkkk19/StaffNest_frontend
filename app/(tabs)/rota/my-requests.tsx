// app/rota/my-requests.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react-native';
import { useShiftRequests } from '@/hooks/useShiftRequests';

export default function MyRequestsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { getMyRequests } = useShiftRequests();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(theme);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your requests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyRequests();
    setRefreshing(false);
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const approvedRequests = requests.filter(req => req.status === 'approved');
  const rejectedRequests = requests.filter(req => req.status === 'rejected');

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
        <Text style={styles.loadingText}>Loading your requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={theme === 'dark' ? '#EF4444' : '#DC2626'} />
        <Text style={styles.errorTitle}>Unable to Load Requests</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryButton} onPress={fetchMyRequests}>
          Try Again
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={64} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.emptyTitle}>No shift requests</Text>
            <Text style={styles.emptyText}>
              You haven't requested any open shifts yet
            </Text>
            <Text style={styles.emptySubtext}>
              Visit the Open Shifts tab to request available shifts
            </Text>
          </View>
        ) : (
          <>
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <AlertCircle size={20} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>Pending ({pendingRequests.length})</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Waiting for admin approval</Text>
                </View>
                {pendingRequests.map(request => (
                  <RequestCard
                    key={request._id}
                    request={request}
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
                  <Text style={styles.sectionSubtitle}>Your approved shifts</Text>
                </View>
                {approvedRequests.map(request => (
                  <RequestCard
                    key={request._id}
                    request={request}
                    theme={theme}
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
                  <Text style={styles.sectionSubtitle}>Requests that were declined</Text>
                </View>
                {rejectedRequests.map(request => (
                  <RequestCard
                    key={request._id}
                    request={request}
                    theme={theme}
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

// Request Card Component
const RequestCard = ({ request, theme }: { request: any; theme: string }) => {
  const styles = createCardStyles(theme);

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
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.shiftTitle}>{request.shift_id?.title || 'Shift'}</Text>
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

      {request.shift_id && (
        <>
          <View style={styles.detailRow}>
            <Calendar size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.detailText}>
              {formatDate(request.shift_id.start_time)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.detailText}>
              {formatTime(request.shift_id.start_time)} - {formatTime(request.shift_id.end_time)}
            </Text>
          </View>
        </>
      )}

      {request.staff_notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Your Notes:</Text>
          <Text style={styles.notesText}>{request.staff_notes}</Text>
        </View>
      )}

      {request.admin_notes && (
        <View style={[styles.notesContainer, { backgroundColor: theme === 'dark' ? '#2E1065' : '#EDE9FE' }]}>
          <Text style={styles.notesLabel}>Admin Response:</Text>
          <Text style={styles.notesText}>{request.admin_notes}</Text>
        </View>
      )}

      {request.responded_at && (
        <Text style={styles.respondedText}>
          Responded on {new Date(request.responded_at).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
};

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
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
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 4,
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
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

const createCardStyles = (theme: string) => StyleSheet.create({
  card: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
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
    flex: 1,
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  notesContainer: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
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
  },
  respondedText: {
    fontSize: 12,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 8,
  },
});