// components/rota/WeekView.tsx
import { View, Text, StyleSheet } from 'react-native';
import DayColumn from './DayColumn';
import { Shift } from '@/app/types/rota.types';
import { useTheme } from '@/contexts/ThemeContext';

interface WeekViewProps {
  shifts: Shift[];
  selectedDate: Date;
  onShiftPress: (shift: Shift) => void;
  onAddShift?: (date: Date) => void;
  loading?: boolean;
}

export default function WeekView({
  shifts,
  selectedDate,
  onShiftPress,
  onAddShift,
  loading = false,
}: WeekViewProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getWeekDays = (date: Date) => {
    const days = [];
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getShiftsForDay = (day: Date) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return shiftDate.toDateString() === day.toDateString();
    });
  };

  const weekDays = getWeekDays(selectedDate);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading shifts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {weekDays.map((day, index) => (
        <DayColumn
          key={day.toISOString()}
          date={day}
          shifts={getShiftsForDay(day)}
          onShiftPress={onShiftPress}
          onAddShift={onAddShift ? () => onAddShift(day) : undefined}
          isToday={day.toDateString() === new Date().toDateString()}
        />
      ))}
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    gap: 12,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    fontSize: 16,
  },
});