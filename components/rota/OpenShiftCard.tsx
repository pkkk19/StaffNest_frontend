import { View, Text, StyleSheet } from 'react-native';
import { Clock, MapPin, UserPlus, Calendar } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { Shift } from '@/app/types/rota.types';

interface OpenShiftCardProps {
  shift: Shift;
  onRequest: () => void;
}

export default function OpenShiftCard({ shift, onRequest }: OpenShiftCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDuration = () => {
    const start = new Date(shift.start_time);
    const end = new Date(shift.end_time);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateSection}>
          <View style={styles.dateBadge}>
            <Calendar size={14} color="#FFFFFF" />
            <Text style={styles.date}>{formatDate(shift.start_time)}</Text>
          </View>
          <View style={styles.timeInfo}>
            <Clock size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.time}>
              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
              <Text style={styles.duration}> ({calculateDuration()}h)</Text>
            </Text>
          </View>
        </View>
        
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>OPEN</Text>
        </View>
      </View>

      <Text style={styles.title}>{shift.title}</Text>
      
      {shift.description && (
        <Text style={styles.description}>{shift.description}</Text>
      )}

      <View style={styles.details}>
        {shift.location && (
          <View style={styles.detailRow}>
            <MapPin size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.detailText}>{shift.location}</Text>
          </View>
        )}
        
        <Text style={styles.createdBy}>
          Posted by: {shift.created_by.first_name} {shift.created_by.last_name}
        </Text>
      </View>

      <ForceTouchable onPress={onRequest} style={styles.requestButton}>
        <UserPlus size={16} color="#FFFFFF" />
        <Text style={styles.requestButtonText}>Request Shift</Text>
      </ForceTouchable>
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    shadowColor: theme === 'dark' ? '#000' : '#E5E7EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateSection: {
    flex: 1,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  duration: {
    fontSize: 13,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    fontStyle: 'italic',
  },
  typeBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  details: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  createdBy: {
    fontSize: 12,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    fontStyle: 'italic',
  },
  requestButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});