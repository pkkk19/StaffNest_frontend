import { View, Text, ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import ForceTouchable from '@/components/ForceTouchable';

export default function Rota() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedShift, setSelectedShift] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const styles = createStyles(theme);
  const isAdmin = user?.role === 'admin';

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [15, 16, 17, 18, 19, 20, 21];

  type Shift = { 
    id: string; 
    start: string; 
    end: string; 
    location: string;
    userId?: string;
    userName?: string;
  } | null;

  const shifts: Record<number, Shift> = {
    0: { 
      id: '1', 
      start: '09:00', 
      end: '17:00', 
      location: 'Main Branch',
      userId: 'user1',
      userName: 'John Doe'
    },
    1: { 
      id: '2', 
      start: '10:00', 
      end: '18:00', 
      location: 'Main Branch',
      userId: 'user2',
      userName: 'Jane Smith'
    },
    2: null,
    3: { 
      id: '3', 
      start: '09:00', 
      end: '17:00', 
      location: 'Secondary Branch',
      userId: 'user1',
      userName: 'John Doe'
    },
    4: { 
      id: '4', 
      start: '08:00', 
      end: '16:00', 
      location: 'Main Branch',
      userId: 'user3',
      userName: 'Mike Johnson'
    },
    5: null,
    6: null,
  };

  // Generate calendar data
  const generateCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const calendar = [];
    const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      calendar.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      calendar.push(i);
    }
    
    return calendar;
  };

  const calendarDays = generateCalendar(selectedDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handleAddShift = (dayIndex: number) => {
    console.log('Add shift for day:', dayIndex);
    Alert.alert('Add Shift', `Add new shift for ${days[dayIndex]} ${dates[dayIndex]}`);
  };

  const handleEditShift = (shift: Shift, dayIndex: number) => {
    if (!shift) return;
    console.log('Edit shift:', shift.id);
    setSelectedShift(dayIndex);
    Alert.alert('Edit Shift', `Edit shift for ${shift.userName} on ${days[dayIndex]}`);
  };

  const handleDeleteShift = (shift: Shift, dayIndex: number) => {
    if (!shift) return;
    
    Alert.alert(
      'Delete Shift',
      `Are you sure you want to delete ${shift.userName}'s shift on ${days[dayIndex]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            console.log('Delete shift:', shift.id);
            // Call API to delete shift
          }
        }
      ]
    );
  };

  const handleShiftPress = (shift: Shift, dayIndex: number) => {
    if (!isAdmin || !shift) return;
    
    Alert.alert(
      'Shift Options',
      `${shift.userName} - ${shift.start} to ${shift.end}`,
      [
        { text: 'Edit', onPress: () => handleEditShift(shift, dayIndex) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteShift(shift, dayIndex) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleDateSelect = (day: number) => {
    if (!day) return;
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setSelectedDate(newDate);
    setShowCalendar(false);
    console.log('Selected date:', newDate.toDateString());
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const hasShiftOnDate = (day: number) => {
    // This is a simplified check - you would integrate with your actual data
    return day % 3 === 0; // Just for demo purposes
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{t('rota')}</Text>
          {isAdmin && (
            <ForceTouchable 
              onPress={() => Alert.alert('Quick Add', 'Add new shift for any day')}
              style={styles.addButton}
            >
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
                    <>
                      <Text style={[
                        styles.calendarDayText,
                        day === selectedDate.getDate() && styles.calendarDayTextSelected
                      ]}>
                        {day}
                      </Text>
                      {hasShiftOnDate(day) && (
                        <View style={styles.calendarDot} />
                      )}
                    </>
                  )}
                </ForceTouchable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.weekNavigation}>
          <ForceTouchable onPress={() => setCurrentWeek(currentWeek - 1)}>
            <ChevronLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </ForceTouchable>
          <Text style={styles.weekText}>Jan 15 - 21, 2025</Text>
          <ForceTouchable onPress={() => setCurrentWeek(currentWeek + 1)}>
            <ChevronRight size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </ForceTouchable>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.calendar}>
          {days.map((day, index) => (
            <View key={index} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{day}</Text>
                  <Text style={styles.dayDate}>{dates[index]}</Text>
                </View>
                
                {isAdmin && (
                  <ForceTouchable 
                    onPress={() => handleAddShift(index)}
                    style={styles.addDayButton}
                  >
                    <Plus size={18} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  </ForceTouchable>
                )}
              </View>
              
              {shifts[index] ? (
                <ForceTouchable 
                  onPress={() => handleShiftPress(shifts[index], index)}
                  disabled={!isAdmin}
                >
                  <View style={[
                    styles.shiftCard,
                    isAdmin && styles.shiftCardAdmin
                  ]}>
                    <View style={styles.shiftHeader}>
                      <Text style={styles.shiftTime}>
                        {shifts[index].start} - {shifts[index].end}
                      </Text>
                      {isAdmin && (
                        <View style={styles.shiftActions}>
                          <ForceTouchable 
                            onPress={() => handleEditShift(shifts[index], index)}
                            style={styles.actionButton}
                          >
                            <Edit2 size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                          </ForceTouchable>
                          <ForceTouchable 
                            onPress={() => handleDeleteShift(shifts[index], index)}
                            style={styles.actionButton}
                          >
                            <Trash2 size={16} color={theme === 'dark' ? '#EF4444' : '#DC2626'} />
                          </ForceTouchable>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.shiftLocation}>{shifts[index].location}</Text>
                    {isAdmin && shifts[index].userName && (
                      <Text style={styles.shiftUser}>{shifts[index].userName}</Text>
                    )}
                    
                    <View style={styles.shiftBadge}>
                      <Text style={styles.shiftBadgeText}>{t('scheduled')}</Text>
                    </View>
                  </View>
                </ForceTouchable>
              ) : (
                <View style={styles.dayOff}>
                  {isAdmin ? (
                    <ForceTouchable 
                      onPress={() => handleAddShift(index)}
                      style={styles.addShiftButton}
                    >
                      <Plus size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                      <Text style={styles.addShiftText}>Add Shift</Text>
                    </ForceTouchable>
                  ) : (
                    <Text style={styles.dayOffText}>{t('dayOff')}</Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            <View style={styles.adminCard}>
              <ForceTouchable 
                style={styles.adminButton}
                onPress={() => Alert.alert('Bulk Actions', 'Add multiple shifts at once')}
              >
                <Text style={styles.adminButtonText}>Bulk Add Shifts</Text>
              </ForceTouchable>
              <ForceTouchable 
                style={styles.adminButton}
                onPress={() => Alert.alert('Copy Week', 'Copy shifts from previous week')}
              >
                <Text style={styles.adminButtonText}>Copy Previous Week</Text>
              </ForceTouchable>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('weekSummary')}</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('totalHours')}</Text>
              <Text style={styles.summaryValue}>40 hours</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('scheduledDays')}</Text>
              <Text style={styles.summaryValue}>5 days</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('overtime')}</Text>
              <Text style={styles.summaryValue}>0 hours</Text>
            </View>
            {isAdmin && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Staff Scheduled</Text>
                <Text style={styles.summaryValue}>3 people</Text>
              </View>
            )}
          </View>
        </View>
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
      padding: 20,
      paddingTop: 60,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
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
      color: isDark ? '#F9FAFB' : '#111827',
    },
    addButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
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
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
    },
    calendarToggleText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#374151',
    },
    calendarContainer: {
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
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
      color: isDark ? '#F9FAFB' : '#374151',
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
      color: isDark ? '#9CA3AF' : '#6B7280',
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
      backgroundColor: isDark ? '#2563EB' : '#3B82F6',
    },
    calendarDayText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#374151',
    },
    calendarDayTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    calendarDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#10B981' : '#059669',
      position: 'absolute',
      bottom: 4,
    },
    weekNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    weekText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#374151',
    },
    content: {
      flex: 1,
    },
    calendar: {
      padding: 20,
    },
    dayContainer: {
      marginBottom: 16,
    },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    dayInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dayName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#374151',
      width: 40,
    },
    dayDate: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginLeft: 8,
    },
    addDayButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    shiftCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#2563EB',
      ...Platform.select({
        android: { elevation: 3 },
      }),
    },
    shiftCardAdmin: {
      borderLeftColor: '#10B981',
    },
    shiftHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    shiftTime: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    shiftActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 4,
      borderRadius: 4,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    shiftLocation: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    shiftUser: {
      fontSize: 13,
      color: isDark ? '#6B7280' : '#9CA3AF',
      fontStyle: 'italic',
      marginBottom: 8,
    },
    shiftBadge: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    shiftBadgeText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    dayOff: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      minHeight: 80,
      justifyContent: 'center',
    },
    dayOffText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontStyle: 'italic',
    },
    addShiftButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
    },
    addShiftText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
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
    adminCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      gap: 12,
      ...Platform.select({
        android: { elevation: 3 },
      }),
    },
    adminButton: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    adminButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#374151',
    },
    summaryCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      ...Platform.select({
        android: { elevation: 3 },
      }),
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
  });
}