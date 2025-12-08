import { View, Text, StyleSheet } from 'react-native';
import { Clock, Calendar, Users, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Shift } from '@/app/types/rota.types';

interface WeekSummaryProps {
  shifts: Shift[];
  isAdmin?: boolean;
}

export default function WeekSummary({ shifts }: WeekSummaryProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);
  const isAdmin = user?.role === 'admin';

  const calculateSummary = () => {
    const totalHours = shifts.reduce((total, shift) => {
      const start = new Date(shift.start_time);
      const end = new Date(shift.end_time);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    const scheduledDays = new Set(
      shifts.map(shift => new Date(shift.start_time).toDateString())
    ).size;

    const staffScheduled = new Set(shifts.map(shift => user?._id)).size;

    const openShifts = shifts.filter(shift => shift.status === 'open').length;

    return {
      totalHours: Math.round(totalHours),
      scheduledDays,
      staffScheduled,
      openShifts,
    };
  };

  const summary = calculateSummary();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Week Summary</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Clock size={20} color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
          <Text style={styles.statValue}>{summary.totalHours}h</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Calendar size={20} color={theme === 'dark' ? '#10B981' : '#059669'} />
            <Text style={styles.statLabel}>Scheduled Days</Text>
          </View>
          <Text style={styles.statValue}>{summary.scheduledDays}</Text>
        </View>

       {isAdmin && (
    <>
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Users size={20} color={theme === 'dark' ? '#F59E0B' : '#D97706'} />
          <Text style={styles.statLabel}>Staff Scheduled</Text>
        </View>
        <Text style={styles.statValue}>{summary.staffScheduled}</Text>
      </View>

      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <AlertTriangle size={20} color={theme === 'dark' ? '#EF4444' : '#DC2626'} />
          <Text style={styles.statLabel}>Open Shifts</Text>
        </View>
        <Text style={styles.statValue}>{summary.openShifts}</Text>
      </View>
    </>
  )}
      </View>
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    gap: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
});