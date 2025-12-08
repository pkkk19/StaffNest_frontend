// app/rota/open-shifts.tsx
import { useState, useCallback } from 'react';
import { 
  Modal,
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity 
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, Filter, AlertCircle, ChevronDown } from 'lucide-react-native';
import { Shift } from '@/app/types/rota.types';
import { useShiftRequests } from '@/hooks/useShiftRequests';
import { useOpenShifts } from '@/hooks/useOpenShifts'; // Use the new hook
import OpenShiftItem from '@/components/rota/OpenShiftItem';

export default function OpenShiftsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { requestShift, requestLoading } = useShiftRequests();
  const { openShifts, loading, error, refetch } = useOpenShifts();
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'duration'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const styles = createStyles(theme);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleRequestShift = useCallback(async (shiftId: string, notes?: string) => {
    try {
      const result = await requestShift(shiftId, notes);
      console.log('Shift request result:', result);
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Remove the requested shift from the list
      refetch();
      
      return result;
    } catch (error: any) {
      console.error('Shift request error details:', error);
      
      // Set error message and show error modal
      let errorMessage = 'Failed to request shift';
      if (error.message?.includes('not available')) {
        errorMessage = 'This shift is no longer available for requests.';
      } else if (error.message?.includes('already requested')) {
        errorMessage = 'You have already requested this shift.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setErrorMessage(errorMessage);
      setShowErrorModal(true);
      
      throw new Error(errorMessage);
    }
  }, [requestShift, refetch]);

  // Filter shifts by date
  const filteredShifts = openShifts.filter(shift => {
    try {
      const shiftDate = new Date(shift.start_time);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'today') {
        return shiftDate.toDateString() === today.toDateString();
      }
      if (dateFilter === 'week') {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        return shiftDate >= today && shiftDate <= weekEnd;
      }
      if (dateFilter === 'month') {
        const monthEnd = new Date(today);
        monthEnd.setMonth(today.getMonth() + 1);
        return shiftDate >= today && shiftDate <= monthEnd;
      }
      return true;
    } catch (error) {
      return false;
    }
  });

  // Sort shifts
  const sortedShifts = [...filteredShifts].sort((a, b) => {
    try {
      if (sortBy === 'date') {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      } else {
        const durationA = (new Date(a.end_time).getTime() - new Date(a.start_time).getTime()) / (1000 * 60 * 60);
        const durationB = (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / (1000 * 60 * 60);
        return durationB - durationA;
      }
    } catch (error) {
      return 0;
    }
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
        <Text style={styles.loadingText}>Loading open shifts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={64} color={theme === 'dark' ? '#EF4444' : '#DC2626'} />
        <Text style={styles.errorTitle}>Unable to Load Shifts</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={refetch} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Users size={32} color={theme === 'dark' ? '#8B5CF6' : '#7C3AED'} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Open Shifts</Text>
            <Text style={styles.headerSubtitle}>
              Available shifts you can request
            </Text>
          </View>
        </View>
        
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{sortedShifts.length}</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <Text style={styles.filterButtonText}>Filters</Text>
          <ChevronDown size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>

        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
            onPress={() => setSortBy('date')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>
              Date
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'duration' && styles.sortButtonActive]}
            onPress={() => setSortBy('duration')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'duration' && styles.sortButtonTextActive]}>
              Duration
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Filters */}
      {showFilters && (
        <View style={styles.dateFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'today', 'week', 'month'] as const).map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.dateFilterButton,
                  dateFilter === filter && styles.dateFilterButtonActive
                ]}
                onPress={() => setDateFilter(filter)}
              >
                <Text style={[
                  styles.dateFilterText,
                  dateFilter === filter && styles.dateFilterTextActive
                ]}>
                  {filter === 'all' ? 'All Dates' : 
                   filter === 'today' ? 'Today' :
                   filter === 'week' ? 'This Week' : 'This Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
        {sortedShifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={80} color={theme === 'dark' ? '#4B5563' : '#9CA3AF'} />
            <Text style={styles.emptyTitle}>
              No open shifts available
            </Text>
            <Text style={styles.emptyText}>
              All open shifts have been requested or filled.
            </Text>
            <Text style={styles.emptySubtext}>
              New shifts are added regularly. Check back soon!
            </Text>
          </View>
        ) : (
          <View style={styles.shiftsList}>
            {sortedShifts.map(shift => (
              <OpenShiftItem
                key={shift._id}
                shift={shift}
                onRequest={handleRequestShift}
                requestLoading={requestLoading}
              />
            ))}
          </View>
        )}

        {/* Info Footer */}
        <View style={styles.infoFooter}>
          <AlertCircle size={16} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
          <Text style={styles.infoText}>
            Open shifts are available to all staff members. Requests are reviewed by admins.
          </Text>
        </View>
      </ScrollView>
      {/* Success Modal */}
<Modal
  visible={showSuccessModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowSuccessModal(false)}
>
  <View style={styles.successModalOverlay}>
    <View style={styles.successModalContainer}>
      <View style={styles.successIconContainer}>
        {/* Add a success icon, e.g., CheckCircle */}
      </View>
      <Text style={styles.successModalTitle}>Success!</Text>
      <Text style={styles.successModalText}>
        Your shift request has been submitted and is pending approval.
      </Text>
      <TouchableOpacity
        style={styles.successModalButton}
        onPress={() => setShowSuccessModal(false)}
      >
        <Text style={styles.successModalButtonText}>Got it</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Error Modal */}
<Modal
  visible={showErrorModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowErrorModal(false)}
>
  <View style={styles.errorModalOverlay}>
    <View style={styles.errorModalContainer}>
      <View style={styles.errorIconContainer}>
        <AlertCircle size={48} color="#EF4444" />
      </View>
      <Text style={styles.errorModalTitle}>Request Failed</Text>
      <Text style={styles.errorModalText}>{errorMessage}</Text>
      <TouchableOpacity
        style={styles.errorModalButton}
        onPress={() => setShowErrorModal(false)}
      >
        <Text style={styles.errorModalButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </View>
  );
}

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
    fontSize: 16,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme === 'dark' ? '#2E1065' : '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  countBadge: {
    backgroundColor: theme === 'dark' ? '#8B5CF6' : '#7C3AED',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  sortButtons: {
    flexDirection: 'row',
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 20,
    padding: 4,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  sortButtonActive: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateFilters: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  dateFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateFilterButtonActive: {
    backgroundColor: theme === 'dark' ? '#8B5CF6' : '#7C3AED',
    borderColor: theme === 'dark' ? '#7C3AED' : '#8B5CF6',
  },
  dateFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  dateFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 40,
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
    fontSize: 15,
    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  shiftsList: {
    padding: 20,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 20,
    marginTop: 20,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#F3F4F6',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    lineHeight: 18,
  },
  // Add these to your StyleSheet in OpenShiftsScreen.tsx
successModalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},
successModalContainer: {
  backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
  borderRadius: 24,
  padding: 32,
  alignItems: 'center',
  maxWidth: 400,
  width: '100%',
},
successIconContainer: {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#10B98120',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 20,
},
successModalTitle: {
  fontSize: 24,
  fontWeight: '700',
  color: theme === 'dark' ? '#F9FAFB' : '#111827',
  marginBottom: 12,
  textAlign: 'center',
},
successModalText: {
  fontSize: 16,
  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  textAlign: 'center',
  marginBottom: 24,
  lineHeight: 24,
},
successModalButton: {
  backgroundColor: '#10B981',
  paddingHorizontal: 32,
  paddingVertical: 14,
  borderRadius: 12,
  width: '100%',
  alignItems: 'center',
},
successModalButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
},

errorModalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},
errorModalContainer: {
  backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
  borderRadius: 24,
  padding: 32,
  alignItems: 'center',
  maxWidth: 400,
  width: '100%',
},
errorIconContainer: {
  marginBottom: 20,
},
errorModalTitle: {
  fontSize: 24,
  fontWeight: '700',
  color: theme === 'dark' ? '#F9FAFB' : '#111827',
  marginBottom: 12,
  textAlign: 'center',
},
errorModalText: {
  fontSize: 16,
  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  textAlign: 'center',
  marginBottom: 24,
  lineHeight: 24,
},
errorModalButton: {
  backgroundColor: '#3B82F6',
  paddingHorizontal: 32,
  paddingVertical: 14,
  borderRadius: 12,
  width: '100%',
  alignItems: 'center',
},
errorModalButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
},
});