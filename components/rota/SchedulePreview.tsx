// src/components/rota/SchedulePreview.tsx
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AutoScheduleResponse } from '@/app/types/auto-scheduling.types';

interface SchedulePreviewProps {
  schedule: AutoScheduleResponse;
}

export default function SchedulePreview({ schedule }: SchedulePreviewProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getShiftColor = (isFilled: boolean) => {
    return isFilled 
      ? (theme === 'dark' ? '#10B981' : '#059669')
      : (theme === 'dark' ? '#EF4444' : '#DC2626');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Calendar size={24} color={theme === 'dark' ? '#10B981' : '#059669'} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Schedule Preview</Text>
          <Text style={styles.subtitle}>
            {formatDate(schedule.date_range.start)} - {formatDate(schedule.date_range.end)}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
            <Calendar size={20} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.statValue}>{schedule.stats.total_shifts}</Text>
            <Text style={styles.statLabel}>Total Shifts</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
            <CheckCircle size={20} color="#10B981" />
          </View>
          <View>
            <Text style={styles.statValue}>{schedule.stats.filled_shifts}</Text>
            <Text style={styles.statLabel}>Filled</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#EF444420' }]}>
            <XCircle size={20} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.statValue}>{schedule.stats.unfilled_shifts}</Text>
            <Text style={styles.statLabel}>Unfilled</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#8B5CF620' }]}>
            <Users size={20} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.statValue}>{schedule.stats.coverage_percentage}%</Text>
            <Text style={styles.statLabel}>Coverage</Text>
          </View>
        </View>
      </View>

      {/* Shifts List */}
      <View style={styles.shiftsSection}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <Text style={styles.sectionTitle}>Generated Shifts</Text>
          <Text style={styles.shiftCount}>{schedule.shifts.length} shifts</Text>
        </View>

        {schedule.shifts.map((shift, index) => (
          <View key={shift.shift_id} style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <View style={styles.shiftInfo}>
                <Text style={styles.shiftTitle} numberOfLines={1}>
                  {shift.title}
                </Text>
                <Text style={styles.shiftRole}>{shift.role_name}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getShiftColor(shift.is_filled) + '20' }]}>
                <Text style={[styles.statusText, { color: getShiftColor(shift.is_filled) }]}>
                  {shift.is_filled ? 'Assigned' : 'Open'}
                </Text>
              </View>
            </View>

            <View style={styles.shiftDetails}>
              <View style={styles.detailRow}>
                <Clock size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text style={styles.detailText}>
                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                </Text>
                <Text style={styles.durationText}>{shift.duration_hours}h</Text>
              </View>

              <View style={styles.detailRow}>
                <Users size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text style={styles.detailText}>
                  {shift.is_filled ? `Assigned to: ${shift.user_name}` : 'Unassigned'}
                </Text>
              </View>

              {shift.assignment_reason && (
                <View style={styles.detailRow}>
                  <CheckCircle size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <Text style={styles.detailText}>{shift.assignment_reason}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Warnings & Suggestions */}
      {(schedule.warnings.length > 0 || schedule.suggestions.length > 0) && (
        <View style={styles.noticesSection}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={20} color={theme === 'dark' ? '#F59E0B' : '#D97706'} />
            <Text style={styles.sectionTitle}>Notices</Text>
          </View>

          {schedule.warnings.map((warning, index) => (
            <View key={index} style={[styles.noticeCard, styles.warningCard]}>
              <Text style={styles.noticeText}>{warning}</Text>
            </View>
          ))}

          {schedule.suggestions.map((suggestion, index) => (
            <View key={index} style={[styles.noticeCard, styles.suggestionCard]}>
              <Text style={styles.noticeText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  headerContent: {
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginTop: 2,
  },
  shiftsSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    flex: 1,
  },
  shiftCount: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  shiftCard: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 4,
  },
  shiftRole: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  shiftDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
    flex: 1,
  },
  durationText: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    fontWeight: '500',
  },
  noticesSection: {
    padding: 20,
    paddingTop: 0,
  },
  noticeCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  warningCard: {
    backgroundColor: theme === 'dark' ? '#78350F' : '#FEF3C7',
  },
  suggestionCard: {
    backgroundColor: theme === 'dark' ? '#065F46' : '#D1FAE5',
  },
  noticeText: {
    fontSize: 14,
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
});