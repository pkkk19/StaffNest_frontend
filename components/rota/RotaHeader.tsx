// components/rota/RotaHeader.tsx

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import CreateShiftModal from '@/components/rota/CreateShiftModal';
import { router } from 'expo-router';
import { useRotaData } from '@/hooks/useRotaData';
import { Shift } from '@/app/types/rota.types';

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
  const [shiftsByDay, setShiftsByDay] = useState<{[key: string]: number}>({});
  const styles = createStyles(theme);
  const isAdmin = user?.role === 'admin';

  // Calculate start and end of month for filtering
  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const monthRange = getMonthRange(selectedDate);

  // Fetch shifts for the current month
  const { shifts } = useRotaData({
    start_date: monthRange.start,
    end_date: monthRange.end,
    // If you want to show all shifts including other users
    ...(isAdmin ? {} : { user_id: user?._id })
  });

  // Process shifts to count by day
  useEffect(() => {
    const shiftsCount: {[key: string]: number} = {};
    
    shifts.forEach((shift: Shift) => {
      try {
        const shiftDate = new Date(shift.start_time);
        const dayKey = `${shiftDate.getFullYear()}-${shiftDate.getMonth() + 1}-${shiftDate.getDate()}`;
        
        if (!shiftsCount[dayKey]) {
          shiftsCount[dayKey] = 0;
        }
        shiftsCount[dayKey]++;
      } catch (error) {
        console.error('Error processing shift date:', error);
      }
    });
    
    setShiftsByDay(shiftsCount);
  }, [shifts]);

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

  // Get shift count for a specific day
  const getShiftCountForDay = (day: number | null) => {
    if (!day) return 0;
    
    const dayKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${day}`;
    return shiftsByDay[dayKey] || 0;
  };

  // Get indicator color based on shift count
  const getIndicatorColor = (count: number) => {
    if (count === 0) return 'transparent';
    if (count <= 3) return theme === 'dark' ? '#10B981' : '#059669'; // Green for few shifts
    if (count <= 6) return theme === 'dark' ? '#F59E0B' : '#D97706'; // Orange for moderate shifts
    return theme === 'dark' ? '#EF4444' : '#DC2626'; // Red for many shifts
  };

  return (
    <>
      <View style={styles.header}>
        {/* Header with Back Button - Similar to roles management */}
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={theme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rota Schedule</Text>
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
              {calendarDays.map((day, index) => {
                const shiftCount = getShiftCountForDay(day);
                const isSelected = day === selectedDate.getDate();
                
                return (
                  <View key={index} style={styles.calendarDayContainer}>
                    <ForceTouchable
                      onPress={() => { if (day) handleDateSelect(day); }}
                      disabled={!day}
                      style={[
                        styles.calendarDay,
                        isSelected && styles.calendarDaySelected,
                        !day && styles.calendarDayEmpty
                      ]}
                    >
                      {day && (
                        <>
                          <Text style={[
                            styles.calendarDayText,
                            isSelected && styles.calendarDayTextSelected
                          ]}>
                            {day}
                          </Text>
                          
                          {/* Shift indicator */}
                          {shiftCount > 0 && (
                            <View style={[
                              styles.shiftIndicator,
                              { backgroundColor: getIndicatorColor(shiftCount) }
                            ]}>
                              <Text style={styles.shiftIndicatorText}>
                                {shiftCount}
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </ForceTouchable>
                  </View>
                );
              })}
            </View>
            
            {/* Legend */}
            {Object.keys(shiftsByDay).some(key => shiftsByDay[key] > 0) && (
              <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Shift Indicators:</Text>
                <View style={styles.legendItems}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme === 'dark' ? '#10B981' : '#059669' }]} />
                    <Text style={styles.legendText}>1-3 shifts</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme === 'dark' ? '#F59E0B' : '#D97706' }]} />
                    <Text style={styles.legendText}>4-6 shifts</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme === 'dark' ? '#EF4444' : '#DC2626' }]} />
                    <Text style={styles.legendText}>7+ shifts</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Week Navigation */}
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
    paddingTop: 20,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 8,
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
  calendarDayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
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
  shiftIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  shiftIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  legendContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
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