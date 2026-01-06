import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, List, Grid, BarChart3, UserSquare, Users } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';

export type ScheduleViewMode = 'calendar' | 'timeline' | 'gantt' | 'list' | 'matrix' | 'user-grid';

interface ScheduleViewSwitcherProps {
  currentView: ScheduleViewMode;
  onViewChange: (view: ScheduleViewMode) => void;
}

const viewOptions = [
  { id: 'calendar' as ScheduleViewMode, name: 'Calendar', icon: Calendar, description: 'Traditional calendar view' },
  { id: 'timeline' as ScheduleViewMode, name: 'Timeline', icon: BarChart3, description: 'Timeline view by hours' },
  { id: 'gantt' as ScheduleViewMode, name: 'Gantt', icon: Grid, description: 'Gantt chart visualization' },
  { id: 'list' as ScheduleViewMode, name: 'List', icon: List, description: 'Simple list view' },
  { id: 'matrix' as ScheduleViewMode, name: 'Staff Matrix', icon: UserSquare, description: 'Matrix by staff and days' },
  { id: 'user-grid' as ScheduleViewMode, name: 'User Grid', icon: Users, description: 'Grid view with users vertically' },
];

export default function ScheduleViewSwitcher({ currentView, onViewChange }: ScheduleViewSwitcherProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {viewOptions.map((option) => {
          const Icon = option.icon;
          const isActive = currentView === option.id;
          
          return (
            <ForceTouchable
              key={option.id}
              style={[styles.option, isActive && styles.optionActive]}
              onPress={() => onViewChange(option.id)}
            >
              <Icon 
                size={20} 
                color={isActive ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} 
              />
              <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                {option.name}
              </Text>
            </ForceTouchable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionActive: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});