import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, Clock, Calendar, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';

interface TimeEntry {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string;
  hours: number;
  location: string;
  status: 'completed' | 'missed' | 'pending';
  shiftType: string;
}

export default function TimeHistory() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const staffId = params.staffId as string;
  const staffName = params.staffName as string;
  
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'thisWeek' | 'thisMonth'>('thisWeek');
  
  const styles = createStyles(theme);

  useEffect(() => {
    loadTimeHistory();
  }, [filter]);

  const loadTimeHistory = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockData: TimeEntry[] = [
        {
          id: '1',
          date: '2024-01-15',
          clockIn: '09:00 AM',
          clockOut: '05:00 PM',
          hours: 8,
          location: 'Main Office',
          status: 'completed',
          shiftType: 'Regular'
        },
        {
          id: '2',
          date: '2024-01-14',
          clockIn: '09:15 AM',
          clockOut: '05:30 PM',
          hours: 8.25,
          location: 'Main Office',
          status: 'completed',
          shiftType: 'Regular'
        },
        {
          id: '3',
          date: '2024-01-13',
          clockIn: '10:00 AM',
          clockOut: '03:00 PM',
          hours: 5,
          location: 'Remote',
          status: 'completed',
          shiftType: 'Part-time'
        },
        {
          id: '4',
          date: '2024-01-12',
          clockIn: '09:00 AM',
          clockOut: '--:--',
          hours: 0,
          location: 'Main Office',
          status: 'missed',
          shiftType: 'Regular'
        },
        {
          id: '5',
          date: '2024-01-11',
          clockIn: '08:45 AM',
          clockOut: '05:15 PM',
          hours: 8.5,
          location: 'Branch A',
          status: 'completed',
          shiftType: 'Overtime'
        },
      ];

      // Filter data based on selected filter
      const filteredData = mockData.filter(entry => {
        const entryDate = new Date(entry.date);
        const today = new Date();
        
        if (filter === 'thisWeek') {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return entryDate >= startOfWeek;
        } else if (filter === 'thisMonth') {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          return entryDate >= startOfMonth;
        }
        return true;
      });

      setTimeEntries(filteredData);
    } catch (error) {
      console.error('Failed to load time history:', error);
      Alert.alert('Error', 'Failed to load time history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'missed': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'missed': return XCircle;
      case 'pending': return AlertCircle;
      default: return Clock;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getTotalHours = () => {
    return timeEntries.reduce((total, entry) => total + entry.hours, 0);
  };

  const getCompletedShifts = () => {
    return timeEntries.filter(entry => entry.status === 'completed').length;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </TouchableOpacity>
        <Text style={styles.title}>Time History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Staff Info Header */}
        <View style={styles.staffInfoSection}>
          <Text style={styles.staffName}>{staffName || 'Staff Member'}</Text>
          <Text style={styles.staffSubtitle}>Time & Attendance Records</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{timeEntries.length}</Text>
              <Text style={styles.statLabel}>Total Shifts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getCompletedShifts()}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getTotalHours().toFixed(1)}</Text>
              <Text style={styles.statLabel}>Total Hours</Text>
            </View>
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterSection}>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'thisWeek' && styles.filterButtonActive]}
            onPress={() => setFilter('thisWeek')}
          >
            <Text style={[styles.filterButtonText, filter === 'thisWeek' && styles.filterButtonTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'thisMonth' && styles.filterButtonActive]}
            onPress={() => setFilter('thisMonth')}
          >
            <Text style={[styles.filterButtonText, filter === 'thisMonth' && styles.filterButtonTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Entries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Records</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Loading time records...</Text>
            </View>
          ) : timeEntries.length > 0 ? (
            <>
              {timeEntries.map(entry => {
                const StatusIcon = getStatusIcon(entry.status);
                
                return (
                  <View key={entry.id} style={styles.timeCard}>
                    <View style={styles.timeCardHeader}>
                      <View style={styles.dateContainer}>
                        <Calendar size={16} color="#6B7280" />
                        <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(entry.status) }]}>
                        <StatusIcon size={12} color="#FFFFFF" />
                        <Text style={styles.statusText}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.timeDetails}>
                      <View style={styles.timeRow}>
                        <View style={styles.timeSlot}>
                          <Text style={styles.timeLabel}>Clock In</Text>
                          <Text style={styles.timeValue}>{entry.clockIn}</Text>
                        </View>
                        <View style={styles.timeSlot}>
                          <Text style={styles.timeLabel}>Clock Out</Text>
                          <Text style={styles.timeValue}>{entry.clockOut}</Text>
                        </View>
                        <View style={styles.timeSlot}>
                          <Text style={styles.timeLabel}>Hours</Text>
                          <Text style={styles.timeValue}>{entry.hours}h</Text>
                        </View>
                      </View>
                      
                      <View style={styles.locationRow}>
                        <MapPin size={14} color="#6B7280" />
                        <Text style={styles.locationText}>{entry.location}</Text>
                        <View style={styles.shiftTypeBadge}>
                          <Text style={styles.shiftTypeText}>{entry.shiftType}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Clock size={48} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.emptyStateTitle}>No Time Records</Text>
              <Text style={styles.emptyStateText}>
                No time records found for the selected period
              </Text>
            </View>
          )}
        </View>

        {/* Summary Section */}
        {timeEntries.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Hours Worked:</Text>
              <Text style={styles.summaryValue}>{getTotalHours().toFixed(1)} hours</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Average Hours/Day:</Text>
              <Text style={styles.summaryValue}>
                {(getTotalHours() / timeEntries.length).toFixed(1)} hours
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Completion Rate:</Text>
              <Text style={styles.summaryValue}>
                {((getCompletedShifts() / timeEntries.length) * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
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
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    content: {
      flex: 1,
    },
    staffInfoSection: {
      padding: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    staffName: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    staffSubtitle: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    filterSection: {
      flexDirection: 'row',
      padding: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
      gap: 8,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      alignItems: 'center',
    },
    filterButtonActive: {
      backgroundColor: '#2563EB',
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    filterButtonTextActive: {
      color: '#FFFFFF',
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    timeCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    timeCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dateText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    timeDetails: {
      gap: 12,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    timeSlot: {
      alignItems: 'center',
    },
    timeLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    timeValue: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    locationText: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      flex: 1,
    },
    shiftTypeBadge: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    shiftTypeText: {
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginTop: 16,
    },
    emptyStateText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
      textAlign: 'center',
    },
    summarySection: {
      padding: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      marginTop: 1,
      marginBottom: 20,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    summaryLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
  });
}