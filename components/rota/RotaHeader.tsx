// components/rota/RotaHeader.tsx
// Remove the duplicate weekNavigation section at the bottom

import { View, Text, StyleSheet } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import CreateShiftModal from '@/components/rota/CreateShiftModal';

interface RotaHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  viewMode?: 'week' | 'month';
  onViewModeChange?: (mode: 'week' | 'month') => void;
  onShiftCreated?: () => void;
}

export default function RotaHeader({
  selectedDate,
  onDateChange,
  viewMode = 'week',
  onViewModeChange = () => {},
  onShiftCreated = () => {},
}: RotaHeaderProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const styles = createStyles(theme);
  const isAdmin = user?.role === 'admin';

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    const days = direction === 'next' ? 7 : -7;
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate);
  };

  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    return { start, end };
  };

  const handleCreateShift = () => {
    setShowCreateModal(true);
  };

  const handleShiftCreated = () => {
    setShowCreateModal(false);
    onShiftCreated();
  };

  const { start, end } = getWeekRange(selectedDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Calendar functions
  const generateCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const calendar = [];
    const startingDay = firstDay.getDay();
    
    for (let i = 0; i < startingDay; i++) {
      calendar.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      calendar.push(i);
    }
    
    return calendar;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    onDateChange(newDate);
  };

  const handleDateSelect = (day: number) => {
    if (!day) return;
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    onDateChange(newDate);
    setShowCalendar(false);
  };

  const calendarDays = generateCalendar(selectedDate);

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Rota</Text>
          {isAdmin && (
            <ForceTouchable style={styles.addButton} onPress={handleCreateShift}>
              <Plus size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
            </ForceTouchable>
          )}
        </View>

        {/* Calendar Toggle */}
        <ForceTouchable 
          onPress={() => setShowCalendar(!showCalendar)}
          style={styles.calendarToggle}
        >
          <View style={styles.calendarToggleContent}>
            <Calendar size={20} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
            <Text style={styles.calendarToggleText}>
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </Text>
            {showCalendar ? (
              <ChevronUp size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            ) : (
              <ChevronDown size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            )}
          </View>
        </ForceTouchable>

        {/* Calendar View */}
        {showCalendar && (
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <ForceTouchable onPress={() => navigateMonth('prev')}>
                <ChevronLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
              </ForceTouchable>
              <Text style={styles.calendarTitle}>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
              <ForceTouchable onPress={() => navigateMonth('next')}>
                <ChevronRight size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
              </ForceTouchable>
            </View>
            
            <View style={styles.calendarGrid}>
              {/* Day headers */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={index} style={styles.calendarDayHeader}>
                  {day}
                </Text>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => (
                <ForceTouchable
                  key={index}
                  onPress={() => { if (day) handleDateSelect(day); }}
                  disabled={!day}
                  style={[
                    styles.calendarDay,
                    day === selectedDate.getDate() && styles.calendarDaySelected,
                    !day && styles.calendarDayEmpty
                  ]}
                >
                  {day && (
                    <Text style={[
                      styles.calendarDayText,
                      day === selectedDate.getDate() && styles.calendarDayTextSelected
                    ]}>
                      {day}
                    </Text>
                  )}
                </ForceTouchable>
              ))}
            </View>
          </View>
        )}

        {/* SINGLE Week Navigation - Remove duplicate */}
        <View style={styles.weekNavigation}>
          <ForceTouchable onPress={() => navigateWeek('prev')}>
            <ChevronLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </ForceTouchable>
          
          <View style={styles.weekInfo}>
            <Text style={styles.weekText}>
              {start.getDate()} {monthNames[start.getMonth()]} - {end.getDate()} {monthNames[end.getMonth()]} {end.getFullYear()}
            </Text>
          </View>
          
          <ForceTouchable onPress={() => navigateWeek('next')}>
            <ChevronRight size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </ForceTouchable>
        </View>
      </View>

      {/* REMOVED: Duplicate week navigation section was here */}

      {/* Create Shift Modal */}
      <CreateShiftModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleShiftCreated}
        defaultDate={selectedDate}
      />
    </>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
  },
  calendarToggle: {
    marginBottom: 16,
  },
  calendarToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
  },
  calendarToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  calendarContainer: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  calendarDayEmpty: {
    backgroundColor: 'transparent',
  },
  calendarDaySelected: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
});