import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView 
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Calendar, ChevronLeft, ChevronRight, Plus, MapPin, Clock } from 'lucide-react-native';
import Constants from 'expo-constants';

export default function Rota() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { shifts } = useSelector((state: RootState) => state.rota);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const getShiftsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return shifts.filter(shift => shift.date === dateString);
  };

  const getUserShiftsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return shifts.filter(shift => 
      shift.date === dateString && 
      (user?.role === 'admin' || shift.staffId === user?.id)
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const getShiftColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'Manager': '#2563EB',
      'Supervisor': '#059669',
      'Sales Assistant': '#EA580C',
      'Cashier': '#7C3AED',
      'Stock Handler': '#0891B2',
    };
    return colors[role] || '#6B7280';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBarSpacer} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Calendar size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>Rota Schedule</Text>
        </View>
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek('prev')}
        >
          <ChevronLeft size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <Text style={styles.weekText}>
          {weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {' '}
          {weekDays[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek('next')}
        >
          <ChevronRight size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Week Calendar */}
        <View style={styles.weekContainer}>
          {weekDays.map((day, index) => {
            const dayShifts = getUserShiftsForDate(day);
            const allDayShifts = getShiftsForDate(day);
            
            return (
              <View key={index} style={styles.dayContainer}>
                <View style={[styles.dayHeader, isToday(day) && styles.todayHeader]}>
                  <Text style={[styles.dayName, isToday(day) && styles.todayText]}>
                    {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dayNumber, isToday(day) && styles.todayText]}>
                    {day.getDate()}
                  </Text>
                </View>
                
                <View style={styles.shiftsContainer}>
                  {dayShifts.map((shift) => (
                    <View 
                      key={shift.id} 
                      style={[
                        styles.shiftCard, 
                        { borderLeftColor: getShiftColor(shift.role) }
                      ]}
                    >
                      <Text style={styles.shiftTime}>
                        {shift.startTime} - {shift.endTime}
                      </Text>
                      <Text style={styles.shiftRole}>{shift.role}</Text>
                      <View style={styles.shiftLocation}>
                        <MapPin size={10} color="#6B7280" />
                        <Text style={styles.shiftLocationText}>
                          {shift.branchName}
                        </Text>
                      </View>
                    </View>
                  ))}
                  
                  {dayShifts.length === 0 && (
                    <View style={styles.noShifts}>
                      <Text style={styles.noShiftsText}>No shifts</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Today's Details */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>
            {isToday(selectedDate) ? "Today's Schedule" : "Selected Day Details"}
          </Text>
          
          {getUserShiftsForDate(selectedDate).map((shift) => (
            <View key={`detail-${shift.id}`} style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={[styles.roleIndicator, { backgroundColor: getShiftColor(shift.role) }]} />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailRole}>{shift.role}</Text>
                </View>
                <View style={styles.detailTime}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.detailTimeText}>
                    {shift.startTime} - {shift.endTime}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailLocation}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.detailLocationText}>
                  {shift.branchName}
                </Text>
              </View>
              
              {shift.notes && (
                <Text style={styles.detailNotes}>{shift.notes}</Text>
              )}
            </View>
          ))}

          {getUserShiftsForDate(selectedDate).length === 0 && (
            <View style={styles.noSchedule}>
              <Calendar size={48} color="#E5E7EB" />
              <Text style={styles.noScheduleTitle}>No shifts scheduled</Text>
              <Text style={styles.noScheduleText}>
                {isToday(selectedDate) 
                  ? "You have no shifts scheduled for today. Enjoy your day off!"
                  : "No shifts scheduled for this date."
                }
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statusBarSpacer: {
    height: Constants.statusBarHeight,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  weekContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dayContainer: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  dayHeader: {
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  todayHeader: {
    backgroundColor: '#2563EB',
  },
  dayName: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 2,
  },
  todayText: {
    color: '#FFFFFF',
  },
  shiftCount: {
    fontSize: 8,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  shiftsContainer: {
    padding: 4,
    minHeight: 100,
  },
  shiftCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    padding: 6,
    marginBottom: 4,
    borderLeftWidth: 2,
  },
  shiftTime: {
    fontSize: 8,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  shiftStaff: {
    fontSize: 7,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 1,
  },
  shiftRole: {
    fontSize: 7,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 2,
  },
  shiftLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftLocationText: {
    fontSize: 6,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginLeft: 2,
  },
  noShifts: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noShiftsText: {
    fontSize: 8,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  todaySection: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailRole: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  detailStaff: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  detailTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginLeft: 4,
  },
  detailLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLocationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  detailNotes: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  noSchedule: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  noScheduleTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noScheduleText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsSection: {
    margin: 16,
    marginTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});