import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ForceTouchable from '@/components/ForceTouchable';

export default function Rota() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [currentWeek, setCurrentWeek] = useState(0);

  const styles = createStyles(theme);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [15, 16, 17, 18, 19, 20, 21];

  type Shift = { start: string; end: string; location: string } | null;
  const shifts: Record<number, Shift> = {
    0: { start: '09:00', end: '17:00', location: 'Main Branch' },
    1: { start: '10:00', end: '18:00', location: 'Main Branch' },
    2: null,
    3: { start: '09:00', end: '17:00', location: 'Secondary Branch' },
    4: { start: '08:00', end: '16:00', location: 'Main Branch' },
    5: null,
    6: null,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('rota')}</Text>
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
                <Text style={styles.dayName}>{day}</Text>
                <Text style={styles.dayDate}>{dates[index]}</Text>
              </View>
              
              {shifts[index] ? (
                <View style={styles.shiftCard}>
                  <Text style={styles.shiftTime}>
                    {shifts[index].start} - {shifts[index].end}
                  </Text>
                  <Text style={styles.shiftLocation}>{shifts[index].location}</Text>
                  <View style={styles.shiftBadge}>
                    <Text style={styles.shiftBadgeText}>{t('scheduled')}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.dayOff}>
                  <Text style={styles.dayOffText}>{t('dayOff')}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

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
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
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
      marginBottom: 8,
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
    shiftCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#2563EB',
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        ios: {
          // iOS shadow (commented out to fix Android)
          // shadowColor: '#000',
          // shadowOffset: { width: 0, height: 2 },
          // shadowOpacity: isDark ? 0.3 : 0.1,
          // shadowRadius: 4,
        },
        android: {
          elevation: 3, // Android shadow
        },
      }),
    },
    shiftTime: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    shiftLocation: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
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
    },
    dayOffText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontStyle: 'italic',
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
    summaryCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        ios: {
          // iOS shadow (commented out to fix Android)
          // shadowColor: '#000',
          // shadowOffset: { width: 0, height: 2 },
          // shadowOpacity: isDark ? 0.3 : 0.1,
          // shadowRadius: 4,
        },
        android: {
          elevation: 3, // Android shadow
        },
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