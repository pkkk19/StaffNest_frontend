// components/rota/DayColumn.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ShiftCard from './ShiftCard';
import EmptyShiftSlot from './EmptyShiftSlot';
import { Shift } from '@/app/types/rota.types';

interface DayColumnProps {
  date: Date;
  shifts: Shift[];
  onShiftPress: (shift: Shift) => void;
  onAddShift?: () => void;
  isToday?: boolean;
}

export default function DayColumn({
  date,
  shifts,
  onShiftPress,
  onAddShift,
  isToday = false,
}: DayColumnProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);
  const isAdmin = user?.role === 'admin';

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = dayNames[date.getDay()];
  const dayDate = date.getDate();
  const month = monthNames[date.getMonth()];

  return (
    <View style={[styles.container, isToday && styles.todayContainer]}>
      <View style={styles.header}>
        <View style={styles.dateInfo}>
          <Text style={[styles.dayName, isToday && styles.todayText]}>
            {dayName}
          </Text>
          <Text style={[styles.date, isToday && styles.todayText]}>
            {dayDate} {month}
          </Text>
        </View>
        
        {isAdmin && onAddShift && (
          <ForceTouchable onPress={onAddShift} style={styles.addButton}>
            <Plus size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          </ForceTouchable>
        )}
      </View>

      <View style={styles.shiftsContainer}>
        {shifts.length === 0 ? (
          <EmptyShiftSlot 
            onAddShift={onAddShift} // This is now optional
            date={date}
          />
        ) : (
          shifts.map((shift) => (
            <ShiftCard
              key={shift._id}
              shift={shift}
              onPress={() => onShiftPress(shift)}
            />
          ))
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  todayContainer: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
    minWidth: 32,
  },
  date: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  todayText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  addButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
  },
  shiftsContainer: {
    gap: 8,
  },
});