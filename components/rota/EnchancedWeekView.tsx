import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Calendar, Clock, MapPin, User, ChevronRight, Plus } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { Shift } from '@/app/types/rota.types';

interface EnhancedWeekViewProps {
  shifts: Shift[];
  selectedDate: Date;
  currentView: 'calendar' | 'timeline' | 'gantt' | 'list' | 'matrix' | 'user-grid';
  onShiftPress: (shift: Shift) => void;
  onAddShift?: (date: Date, timeSlot?: string) => void;
  loading?: boolean;
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = Array.from({ length: 24 }, (_, i) => i);
const { width } = Dimensions.get('window');

export default function EnhancedWeekView({
  shifts,
  selectedDate,
  currentView,
  onShiftPress,
  onAddShift,
  loading = false,
}: EnhancedWeekViewProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Get the week dates
  const getWeekDates = (date: Date) => {
    const currentDate = new Date(date);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(currentDate.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates(selectedDate);

  const renderCalendarView = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.calendarContainer}>
          <View style={styles.daysHeader}>
            <View style={styles.timeColumn} />
            {weekDates.map((date, index) => (
              <View key={index} style={styles.dayHeader}>
                <Text style={styles.dayName}>{daysOfWeek[date.getDay()]}</Text>
                <Text style={styles.dayNumber}>{date.getDate()}</Text>
              </View>
            ))}
          </View>

          <ScrollView>
            {hours.map(hour => (
              <View key={hour} style={styles.hourRow}>
                <View style={styles.timeSlot}>
                  <Text style={styles.timeText}>
                    {hour.toString().padStart(2, '0')}:00
                  </Text>
                </View>
                
                {weekDates.map((date, dayIndex) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const hourShifts = shifts.filter(shift => {
                    const shiftDate = new Date(shift.start_time);
                    return (
                      shiftDate.toISOString().split('T')[0] === dateStr &&
                      shiftDate.getHours() === hour
                    );
                  });

                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      style={styles.timeCell}
                      onPress={() => onAddShift && onAddShift(date, `${hour.toString().padStart(2, '0')}:00`)}
                    >
                      {hourShifts.map((shift, idx) => (
                        <ForceTouchable
                          key={shift._id}
                          style={[
                            styles.shiftBlock,
                            { backgroundColor: shift.color_hex || '#3B82F6' },
                            idx > 0 && { marginTop: 2 }
                          ]}
                          onPress={() => onShiftPress(shift)}
                        >
                          <Text style={styles.shiftBlockTitle} numberOfLines={1}>
                            {shift.title}
                          </Text>
                          {shift.user_id && (
                            <Text style={styles.shiftBlockUser} numberOfLines={1}>
                              {shift.user_id.first_name}
                            </Text>
                          )}
                        </ForceTouchable>
                      ))}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    );
  };

  const renderUserGridView = () => {
    // Get unique users from shifts
    const usersMap = new Map();
    shifts.forEach(shift => {
      if (shift.user_id) {
        usersMap.set(shift.user_id._id, shift.user_id);
      }
    });
    const users = Array.from(usersMap.values());

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.userGridContainer}>
          {/* Header Row */}
          <View style={styles.userGridHeader}>
            <View style={styles.userColumnHeader} />
            {weekDates.map((date, index) => (
              <View key={index} style={styles.dayColumnHeader}>
                <Text style={styles.dayName}>{daysOfWeek[date.getDay()]}</Text>
                <Text style={styles.dayNumber}>{date.getDate()}</Text>
              </View>
            ))}
          </View>

          {/* User Rows */}
          {users.map((user, userIndex) => (
            <View key={user._id} style={styles.userRow}>
              <View style={styles.userCell}>
                <Text style={styles.userName} numberOfLines={2}>
                  {user.first_name} {user.last_name}
                </Text>
              </View>
              
              {weekDates.map((date, dayIndex) => {
                const dateStr = date.toISOString().split('T')[0];
                const dayShifts = shifts.filter(shift => 
                  shift.user_id?._id === user._id &&
                  new Date(shift.start_time).toISOString().split('T')[0] === dateStr
                );

                return (
                  <View key={dayIndex} style={styles.userDayCell}>
                    {dayShifts.map((shift, idx) => (
                      <ForceTouchable
                        key={shift._id}
                        style={[
                          styles.userShiftBlock,
                          { backgroundColor: shift.color_hex || '#3B82F6' }
                        ]}
                        onPress={() => onShiftPress(shift)}
                      >
                        <Text style={styles.userShiftTime} numberOfLines={1}>
                          {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={styles.userShiftTitle} numberOfLines={1}>
                          {shift.title}
                        </Text>
                      </ForceTouchable>
                    ))}
                    {dayShifts.length === 0 && onAddShift && (
                      <TouchableOpacity
                        style={styles.addShiftCell}
                        onPress={() => onAddShift(date)}
                      >
                        <Plus size={16} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Add User Row for adding shifts to unassigned */}
          <View style={styles.userRow}>
            <View style={styles.userCell}>
              <Text style={[styles.userName, { color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }]}>
                Unassigned
              </Text>
            </View>
            
            {weekDates.map((date, dayIndex) => {
              const dateStr = date.toISOString().split('T')[0];
              const unassignedShifts = shifts.filter(shift => 
                !shift.user_id &&
                new Date(shift.start_time).toISOString().split('T')[0] === dateStr
              );

              return (
                <View key={dayIndex} style={styles.userDayCell}>
                  {unassignedShifts.map((shift, idx) => (
                    <ForceTouchable
                      key={shift._id}
                      style={[
                        styles.userShiftBlock,
                        { backgroundColor: '#8B5CF6' }
                      ]}
                      onPress={() => onShiftPress(shift)}
                    >
                      <Text style={styles.userShiftTime} numberOfLines={1}>
                        {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={styles.userShiftTitle} numberOfLines={1}>
                        {shift.title} (Open)
                      </Text>
                    </ForceTouchable>
                  ))}
                  {onAddShift && (
                    <TouchableOpacity
                      style={styles.addShiftCell}
                      onPress={() => onAddShift(date)}
                    >
                      <Plus size={16} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderListView = () => {
    return (
      <View style={styles.listContainer}>
        {shifts
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
          .map(shift => (
            <ForceTouchable
              key={shift._id}
              style={styles.listShiftCard}
              onPress={() => onShiftPress(shift)}
            >
              <View style={styles.listShiftContent}>
                <View style={styles.listShiftHeader}>
                  <View style={[
                    styles.listShiftStatus,
                    { backgroundColor: shift.color_hex || '#3B82F6' }
                  ]} />
                  <Text style={styles.listShiftTitle}>{shift.title}</Text>
                  <Text style={styles.listShiftTime}>
                    {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                
                <View style={styles.listShiftDetails}>
                  {shift.user_id && (
                    <View style={styles.listShiftDetail}>
                      <User size={12} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                      <Text style={styles.listShiftDetailText}>
                        {shift.user_id.first_name} {shift.user_id.last_name}
                      </Text>
                    </View>
                  )}
                  
                  {shift.location && (
                    <View style={styles.listShiftDetail}>
                      <MapPin size={12} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                      <Text style={styles.listShiftDetailText}>
                        {shift.location}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <ChevronRight size={16} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
            </ForceTouchable>
          ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  switch (currentView) {
    case 'user-grid':
      return renderUserGridView();
    case 'matrix':
      return renderUserGridView();
    case 'list':
      return renderListView();
    case 'calendar':
    default:
      return renderCalendarView();
  }
}

const createStyles = (theme: string) => StyleSheet.create({
  calendarContainer: {
    minWidth: width,
  },
  daysHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  timeColumn: {
    width: 60,
    padding: 12,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginTop: 2,
  },
  hourRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    minHeight: 60,
  },
  timeSlot: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
    padding: 8,
  },
  timeText: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  timeCell: {
    flex: 1,
    padding: 4,
    backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
  },
  shiftBlock: {
    padding: 6,
    borderRadius: 4,
    minHeight: 40,
  },
  shiftBlockTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  shiftBlockUser: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // User Grid Styles
  userGridContainer: {
    minWidth: width,
  },
  userGridHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  userColumnHeader: {
    width: 100,
    padding: 12,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
  },
  dayColumnHeader: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
  },
  userRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    minHeight: 80,
  },
  userCell: {
    width: 100,
    justifyContent: 'center',
    padding: 12,
    backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  userDayCell: {
    flex: 1,
    padding: 4,
    backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
  },
  userShiftBlock: {
    padding: 6,
    borderRadius: 4,
    marginBottom: 2,
  },
  userShiftTime: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userShiftTitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 1,
  },
  addShiftCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  // List View Styles
  listContainer: {
    padding: 16,
  },
  listShiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  listShiftContent: {
    flex: 1,
  },
  listShiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listShiftStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  listShiftTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  listShiftTime: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  listShiftDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  listShiftDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listShiftDetailText: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
});