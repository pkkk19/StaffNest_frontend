// app/components/modals/DaysModal.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DaysModalProps {
  selectedDays: string[];
  onSave: (days: string[]) => void;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon', fullLabel: 'Monday' },
  { value: 'tuesday', label: 'Tue', fullLabel: 'Tuesday' },
  { value: 'wednesday', label: 'Wed', fullLabel: 'Wednesday' },
  { value: 'thursday', label: 'Thu', fullLabel: 'Thursday' },
  { value: 'friday', label: 'Fri', fullLabel: 'Friday' },
  { value: 'saturday', label: 'Sat', fullLabel: 'Saturday' },
  { value: 'sunday', label: 'Sun', fullLabel: 'Sunday' },
];

const DAY_GROUPS = [
  {
    id: 'everyday',
    label: 'Every Day',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  {
    id: 'weekdays',
    label: 'Weekdays',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  {
    id: 'weekend',
    label: 'Weekend',
    days: ['saturday', 'sunday']
  },
  {
    id: 'custom',
    label: 'Custom',
    days: []
  }
];

export const DaysModal: React.FC<DaysModalProps> = ({
  selectedDays,
  onSave,
  onClose,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [localSelectedDays, setLocalSelectedDays] = useState<string[]>(selectedDays);
  const [selectedGroup, setSelectedGroup] = useState<string>('custom');

  const handleDayToggle = (dayValue: string) => {
    setSelectedGroup('custom');
    if (localSelectedDays.includes(dayValue)) {
      setLocalSelectedDays(localSelectedDays.filter(d => d !== dayValue));
    } else {
      setLocalSelectedDays([...localSelectedDays, dayValue]);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId);
    if (groupId !== 'custom') {
      const group = DAY_GROUPS.find(g => g.id === groupId);
      if (group) {
        setLocalSelectedDays([...group.days]);
      }
    }
  };

  const handleSave = () => {
    if (localSelectedDays.length === 0) {
      // If no days selected, select Monday as default
      onSave(['monday']);
    } else {
      onSave(localSelectedDays);
    }
    onClose();
  };

  const formatSelectedDays = () => {
    if (localSelectedDays.length === 0) return 'Select days';
    
    const dayLabels = localSelectedDays.map(day => {
      const dayInfo = DAYS_OF_WEEK.find(d => d.value === day);
      return dayInfo ? dayInfo.fullLabel : day;
    });
    
    if (dayLabels.length <= 2) {
      return dayLabels.join(', ');
    }
    
    return `${dayLabels[0]}, ${dayLabels[1]} +${dayLabels.length - 2}`;
  };

  return (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Select Days</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Selected Days Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Selected Days</Text>
          <Text style={styles.previewValue}>{formatSelectedDays()}</Text>
          <Text style={styles.previewCount}>
            {localSelectedDays.length} day{localSelectedDays.length !== 1 ? 's' : ''} selected
          </Text>
        </View>

        {/* Day Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Select</Text>
          <View style={styles.dayGroupsContainer}>
            {DAY_GROUPS.filter(group => group.id !== 'custom').map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.dayGroupButton,
                  selectedGroup === group.id && styles.dayGroupButtonSelected,
                  group.days.every(day => localSelectedDays.includes(day)) && styles.dayGroupButtonActive
                ]}
                onPress={() => handleGroupSelect(group.id)}
              >
                <Text style={[
                  styles.dayGroupButtonText,
                  (selectedGroup === group.id || group.days.every(day => localSelectedDays.includes(day))) && 
                  styles.dayGroupButtonTextSelected
                ]}>
                  {group.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Individual Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Days</Text>
          <View style={styles.daysGrid}>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = localSelectedDays.includes(day.value);
              return (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayPill,
                    isSelected && styles.dayPillSelected
                  ]}
                  onPress={() => handleDayToggle(day.value)}
                >
                  <Text style={[
                    styles.dayPillText,
                    isSelected && styles.dayPillTextSelected
                  ]}>
                    {day.fullLabel}
                  </Text>
                  {isSelected && <Check size={16} color="#fff" style={styles.dayCheckmark} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: string) => {
  const isDark = theme === 'dark';
  const backgroundColor = isDark ? '#1F2937' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const cardBackground = isDark ? '#111827' : '#F9FAFB';
  const primaryColor = '#3B82F6';

  return StyleSheet.create({
    modalContainer: {
      backgroundColor: backgroundColor,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      paddingTop: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    backButton: {
      padding: 4,
    },
    backButtonText: {
      fontSize: 24,
      color: primaryColor,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: textColor,
    },
    saveButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    saveButtonText: {
      fontSize: 16,
      color: primaryColor,
      fontWeight: '600',
    },
    scrollContainer: {
      flex: 1,
      padding: 20,
    },
    previewCard: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: borderColor,
    },
    previewLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: secondaryTextColor,
      marginBottom: 4,
    },
    previewValue: {
      fontSize: 18,
      fontWeight: '700',
      color: primaryColor,
      marginBottom: 8,
      textAlign: 'center',
    },
    previewCount: {
      fontSize: 14,
      color: secondaryTextColor,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginBottom: 12,
    },
    dayGroupsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    dayGroupButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: cardBackground,
      borderWidth: 1,
      borderColor: borderColor,
      minWidth: 100,
      alignItems: 'center',
    },
    dayGroupButtonSelected: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
    },
    dayGroupButtonActive: {
      backgroundColor: isDark ? '#1E40AF' : '#DBEAFE',
      borderColor: primaryColor,
    },
    dayGroupButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: secondaryTextColor,
    },
    dayGroupButtonTextSelected: {
      color: isDark ? '#fff' : primaryColor,
      fontWeight: '600',
    },
    daysGrid: {
      gap: 8,
    },
    dayPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: cardBackground,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    dayPillSelected: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
    },
    dayPillText: {
      fontSize: 16,
      fontWeight: '500',
      color: textColor,
    },
    dayPillTextSelected: {
      color: '#fff',
      fontWeight: '600',
    },
    dayCheckmark: {
      marginLeft: 8,
    },
    bottomSpacing: {
      height: 40,
    },
  });
};