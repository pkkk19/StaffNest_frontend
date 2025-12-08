// components/rota/EmptyShiftSlot.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface EmptyShiftSlotProps {
  onAddShift?: () => void; // Make this optional
  date: Date;
}

export default function EmptyShiftSlot({ onAddShift, date }: EmptyShiftSlotProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);
  const isAdmin = user?.role === 'admin';

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {isAdmin && onAddShift ? (
        // Show add button for admin when onAddShift is provided
        <ForceTouchable onPress={onAddShift} style={styles.addButton}>
          <Plus size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <Text style={styles.addText}>Add Shift</Text>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </ForceTouchable>
      ) : (
        // Show day off message for staff or when no onAddShift
        <View style={styles.dayOffContainer}>
          <Text style={styles.dayOffText}>Day Off</Text>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  addText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginTop: 4,
    marginBottom: 2,
  },
  dayOffContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOffText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
  },
});