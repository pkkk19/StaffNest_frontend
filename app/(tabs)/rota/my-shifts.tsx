// app/rota/my-shifts.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react-native';
import ShiftCard from '@/components/rota/ShiftCard';
import { Shift } from '@/app/types/rota.types';
import { shiftsAPI } from '@/services/api';

export default function MyShiftsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(theme);

  useEffect(() => {
    fetchMyShifts();
  }, []);

  const fetchMyShifts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await shiftsAPI.getMyShifts({
        start_date: new Date().toISOString(),
      });
      
      setMyShifts(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch your shifts';
      setError(errorMessage);
      console.error('Failed to fetch shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyShifts();
    setRefreshing(false);
  };

  const handleShiftPress = (shift: Shift) => {
    const startDate = new Date(shift.start_time);
    const endDate = new Date(shift.end_time);
    
    Alert.alert(
      shift.title,
      `📅 ${startDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
      
🕐 ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      
📍 ${shift.location || 'Main Location'}
      
${shift.description ? `📝 ${shift.description}` : ''}`,
      [
        { text: 'Close', style: 'cancel' },
        { 
          text: 'Clock In/Out', 
          style: 'default',
          onPress: () => console.log('Clock action for shift:', shift._id)
        }
      ]
    );
  };

  const upcomingShifts = myShifts
    .filter(shift => new Date(shift.start_time) > new Date() && shift.status === 'scheduled')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const currentShifts = myShifts
    .filter(shift => shift.status === 'in-progress');

  const pastShifts = myShifts
    .filter(shift => new Date(shift.start_time) <= new Date() || ['completed', 'cancelled'].includes(shift.status))
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} color="#10B981" />;
      case 'cancelled': return <XCircle size={16} color="#EF4444" />;
      case 'in-progress': return <Clock size={16} color="#F59E0B" />;
      default: return <Calendar size={16} color="#3B82F6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'in-progress': return '#F59E0B';
      case 'open': return '#8B5CF6';
      default: return '#3B82F6';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
        <Text style={styles.loadingText}>Loading your shifts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Calendar size={48} color={theme === 'dark' ? '#EF4444' : '#DC2626'} />
        <Text style={styles.errorTitle}>Unable to Load Shifts</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryButton} onPress={fetchMyShifts}>
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
            <Text style={styles.statNumber}>{myShifts.length}</Text>
            <Text style={styles.statLabel}>Total Shifts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{upcomingShifts.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentShifts.length}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>

        {myShifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.emptyTitle}>No shifts scheduled</Text>
            <Text style={styles.emptyText}>
              You don't have any shifts scheduled yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Check the Open Shifts tab to request available shifts
            </Text>
          </View>
        ) : (
          <>
            {/* Current Shifts (In Progress) */}
            {currentShifts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Clock size={20} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>In Progress ({currentShifts.length})</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Shifts you're currently working on</Text>
                </View>
                {currentShifts.map(shift => (
                  <View key={shift._id} style={styles.shiftCard}>
                    <View style={styles.shiftCardHeader}>
                      <View style={styles.shiftInfo}>
                        <Text style={styles.shiftTitle}>{shift.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shift.status) }]}>
                          {getStatusIcon(shift.status)}
                          <Text style={styles.statusText}>
                            {shift.status === 'in-progress' ? 'In Progress' : shift.status}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    </View>
                    
                    <Text style={styles.shiftDateTime}>
                      {new Date(shift.start_time).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })} • {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    
                    {shift.location && (
                      <Text style={styles.shiftLocation}>
                        📍 {shift.location}
                      </Text>
                    )}
                    
                    {shift.clock_in_time && (
                      <View style={styles.clockInfo}>
                        <Text style={styles.clockLabel}>Clocked in at:</Text>
                        <Text style={styles.clockTime}>
                          {new Date(shift.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.shiftActions}>
                      <Text style={styles.clockButton} onPress={() => console.log('Clock out:', shift._id)}>
                        Clock Out
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Upcoming Shifts */}
            {upcomingShifts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Calendar size={20} color="#3B82F6" />
                    <Text style={styles.sectionTitle}>Upcoming Shifts ({upcomingShifts.length})</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Your scheduled shifts</Text>
                </View>
                {upcomingShifts.map(shift => (
                  <ShiftCard
                    key={shift._id}
                    shift={shift}
                    onPress={() => handleShiftPress(shift)}
                    showActions={false}
                  />
                ))}
              </View>
            )}

            {/* Past Shifts */}
            {pastShifts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <CheckCircle size={20} color="#10B981" />
                    <Text style={styles.sectionTitle}>Past Shifts ({pastShifts.length})</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Your completed and cancelled shifts</Text>
                </View>
                {pastShifts.map(shift => (
                  <ShiftCard
                    key={shift._id}
                    shift={shift}
                    onPress={() => handleShiftPress(shift)}
                    showActions={false}
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
    color: theme === 'dark' ? '#3B82F6' : '#2563EB',
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
  shiftCard: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  shiftDateTime: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: 8,
  },
  shiftLocation: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: 12,
  },
  clockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  clockLabel: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  clockTime: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F59E0B' : '#D97706',
  },
  shiftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  clockButton: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});