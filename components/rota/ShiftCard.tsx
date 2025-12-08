import { View, Text, StyleSheet, Alert } from 'react-native';
import { Edit2, Trash2, Clock, MapPin } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Shift } from '@/app/types/rota.types';

interface ShiftCardProps {
  shift: Shift;
  onPress: () => void;
  showActions?: boolean;
}

export default function ShiftCard({ shift, onPress, showActions = true }: ShiftCardProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);
  const isAdmin = user?.role === 'admin';

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3B82F6';
      case 'in-progress': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'open': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const handleEdit = () => {
    Alert.alert('Edit Shift', `Edit ${shift.title}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Shift',
      `Are you sure you want to delete this shift?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => console.log('Delete shift:', shift._id)
        }
      ]
    );
  };

  return (
    <ForceTouchable onPress={onPress} disabled={!isAdmin}>
      <View style={[styles.container, { borderLeftColor: getStatusColor(shift.status) }]}>
        <View style={styles.header}>
          <View style={styles.timeInfo}>
            <Clock size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.timeText}>
              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
            </Text>
          </View>
          
          {showActions && isAdmin && (
            <View style={styles.actions}>
              <ForceTouchable onPress={handleEdit} style={styles.actionButton}>
                <Edit2 size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </ForceTouchable>
              <ForceTouchable onPress={handleDelete} style={styles.actionButton}>
                <Trash2 size={14} color={theme === 'dark' ? '#EF4444' : '#DC2626'} />
              </ForceTouchable>
            </View>
          )}
        </View>

        <Text style={styles.title}>{shift.title}</Text>
        
        {shift.description && (
          <Text style={styles.description}>{shift.description}</Text>
        )}

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <MapPin size={12} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.detailText}>Main Location</Text>
          </View>
          
          {shift.user_id && (
            <Text style={styles.staffName}>
              {shift.user_id.first_name} {shift.user_id.last_name}
            </Text>
          )}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shift.status) }]}>
          <Text style={styles.statusText}>
            {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
          </Text>
        </View>
      </View>
    </ForceTouchable>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  staffName: {
    fontSize: 11,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    fontStyle: 'italic',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});