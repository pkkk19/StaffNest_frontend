import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
} from 'lucide-react-native';
import { timeOffAPI } from '@/services/api';

const { width } = Dimensions.get('window');

export default function TimeOffCalendar() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<any>({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, currentYear]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await timeOffAPI.getTeamCalendar(currentMonth, currentYear);
      setCalendarData(response.data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getMonthName = (month: number) => {
    const date = new Date(currentYear, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      annual_leave: '#3B82F6',
      sick_leave: '#EC4899',
      time_off: '#8B5CF6',
      paid_leave: '#10B981',
      unpaid_leave: '#F59E0B',
      personal_leave: '#06B6D4',
    };
    return colors[type] || '#6B7280';
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const leavesForDay = calendarData.calendar?.[dateString] || [];
      
      days.push(
        <View key={day} style={styles.calendarDay}>
          <View style={styles.calendarDayHeader}>
            <Text style={[
              styles.dayNumber,
              new Date().toDateString() === new Date(dateString).toDateString() && styles.today
            ]}>
              {day}
            </Text>
            <Text style={styles.dayName}>
              {getDayName(dateString)}
            </Text>
          </View>
          <View style={styles.leavesContainer}>
            {leavesForDay.slice(0, 2).map((leave: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.leaveIndicator,
                  { backgroundColor: getLeaveTypeColor(leave.leave_type) },
                ]}
                onPress={() => {
                  // Could navigate to leave details
                }}
              >
                <View style={styles.leaveIndicatorContent}>
                  <Text style={styles.leaveInitial}>
                    {leave.user?.first_name?.[0] || 'U'}
                  </Text>
                  {leave.is_half_day && (
                    <View style={styles.halfDayDot} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
            {leavesForDay.length > 2 && (
              <Text style={styles.moreIndicator}>+{leavesForDay.length - 2}</Text>
            )}
          </View>
        </View>
      );
    }

    // Add empty days at the end to make a complete grid
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const emptyStartDays = firstDay === 0 ? 6 : firstDay - 1;
    
    const emptyDaysStart = [];
    for (let i = 0; i < emptyStartDays; i++) {
      emptyDaysStart.push(<View key={`empty-start-${i}`} style={styles.emptyDay} />);
    }

    // Calculate total days needed for a 7-day grid (5 rows)
    const totalCells = 35; // 5 rows * 7 days
    const totalFilledCells = emptyStartDays + daysInMonth;
    const emptyEndDays = totalCells - totalFilledCells;
    
    const emptyDaysEnd = [];
    for (let i = 0; i < emptyEndDays; i++) {
      emptyDaysEnd.push(<View key={`empty-end-${i}`} style={styles.emptyDay} />);
    }

    return [...emptyDaysStart, ...days, ...emptyDaysEnd];
  };

  const renderLeavesList = () => {
    const allLeaves = [];
    for (const date in calendarData.calendar) {
      const leaves = calendarData.calendar[date];
      allLeaves.push(...leaves.map((leave: any) => ({ ...leave, date })));
    }

    return allLeaves.slice(0, 10).map((item, index) => (
      <TouchableOpacity key={index} style={styles.leaveItem}>
        <View style={styles.leaveItemHeader}>
          <View style={styles.leaveUser}>
            <View style={styles.leaveUserAvatar}>
              <Text style={styles.leaveUserInitial}>
                {item.user?.first_name?.[0] || 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.leaveUserName}>
                {item.user?.first_name} {item.user?.last_name}
              </Text>
              <Text style={styles.leaveDate}>
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.leaveTypeBadge,
              { backgroundColor: getLeaveTypeColor(item.leave_type) },
            ]}
          >
            <Text style={styles.leaveTypeBadgeText}>
              {item.leave_type?.replace('_', ' ')}
            </Text>
          </View>
        </View>
        {item.is_half_day && (
          <Text style={styles.halfDayText}>
            {item.half_day_period === 'morning' ? 'Morning (8-12)' : 'Afternoon (1-5)'}
          </Text>
        )}
      </TouchableOpacity>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#3B82F6' : '#2563EB'} />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#111827' : '#F9FAFB'}
      />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Team Calendar</Text>
            <Text style={styles.headerSubtitle}>
              View team leave schedule
            </Text>
          </View>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <ChevronLeft size={24} color={isDark ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {getMonthName(currentMonth)} {currentYear}
          </Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <ChevronRight size={24} color={isDark ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <Text key={day} style={styles.dayHeader}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar days */}
          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>
        </View>

        {/* Upcoming Leaves */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Upcoming Leaves</Text>
          <View style={styles.upcomingList}>
            {renderLeavesList()}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendSection}>
          <Text style={styles.sectionTitle}>Legend</Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>Annual Leave</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#EC4899' }]} />
              <Text style={styles.legendText}>Sick Leave</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.legendText}>Time Off</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    header: {
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 20,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    monthNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    navButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    calendarContainer: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      marginHorizontal: 20,
      padding: 16,
      marginBottom: 24,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    dayHeaders: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    dayHeader: {
      flex: 1,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
      textTransform: 'uppercase',
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    calendarDay: {
      width: (width - 72) / 7,
      height: 70,
      padding: 4,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#F3F4F6',
    },
    emptyDay: {
      width: (width - 72) / 7,
      height: 70,
    },
    calendarDayHeader: {
      alignItems: 'center',
      marginBottom: 4,
    },
    dayNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    today: {
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
      width: 24,
      height: 24,
      borderRadius: 12,
      textAlign: 'center',
      lineHeight: 24,
    },
    dayName: {
      fontSize: 10,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textTransform: 'uppercase',
    },
    leavesContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 2,
    },
    leaveIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    leaveIndicatorContent: {
      position: 'relative',
    },
    leaveInitial: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    halfDayDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#000000',
    },
    moreIndicator: {
      fontSize: 10,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    upcomingSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    upcomingList: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      overflow: 'hidden',
    },
    leaveItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#F3F4F6',
    },
    leaveItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    leaveUser: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    leaveUserAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#3B82F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    leaveUserInitial: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    leaveUserName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    leaveDate: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    leaveTypeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    leaveTypeBadgeText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#FFFFFF',
      textTransform: 'capitalize',
    },
    halfDayText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontStyle: 'italic',
    },
    legendSection: {
      paddingHorizontal: 20,
      marginBottom: 40,
    },
    legend: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#374151',
    },
  });
}