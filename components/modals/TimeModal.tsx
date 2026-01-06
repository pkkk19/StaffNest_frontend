// app/components/modals/TimeModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  StyleSheet, 
  Keyboard 
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface TimeModalProps {
  mode: 'start' | 'end';
  currentTime: string;
  onSave: (time: string) => void;
  onClose: () => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => ({ 
  label: (i + 1).toString().padStart(2, '0'), 
  value: i + 1 
}));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ 
  label: i.toString().padStart(2, '0'), 
  value: i 
}));
const AMPM = [{ label: 'AM', value: 'AM' }, { label: 'PM', value: 'PM' }];

export const TimeModal: React.FC<TimeModalProps> = ({
  mode,
  currentTime,
  onSave,
  onClose,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Parse current time
  const [hour24, setHour24] = useState(9);
  const [minute, setMinute] = useState(0);
  const [amPm, setAmPm] = useState('AM');
  
  const hourScrollRef = useRef<ScrollView | null>(null);
  const minuteScrollRef = useRef<ScrollView | null>(null);
  const ampmScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (currentTime) {
      const [timeHour, timeMinute] = currentTime.split(':').map(Number);
      setHour24(timeHour);
      setMinute(timeMinute);
      setAmPm(timeHour >= 12 ? 'PM' : 'AM');
      
      // Convert to 12-hour format for display
      const displayHour = timeHour % 12 || 12;
      
      // Scroll to positions
      setTimeout(() => {
        const hourIndex = displayHour - 1;
        const minuteIndex = timeMinute;
        const ampmIndex = timeHour >= 12 ? 1 : 0;
        
        hourScrollRef.current?.scrollTo({ y: hourIndex * 50, animated: false });
        minuteScrollRef.current?.scrollTo({ y: minuteIndex * 50, animated: false });
        ampmScrollRef.current?.scrollTo({ y: ampmIndex * 50, animated: false });
      }, 100);
    }
  }, [currentTime]);

  const handleSave = () => {
    // Convert 12-hour to 24-hour format
    let finalHour = hour24;
    if (amPm === 'PM' && hour24 < 12) {
      finalHour = hour24 + 12;
    } else if (amPm === 'AM' && hour24 >= 12) {
      finalHour = hour24 - 12;
    }
    
    const formattedTime = `${finalHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onSave(formattedTime);
    onClose();
  };

  const handleHourSelect = (selectedHour: number) => {
    setHour24(selectedHour);
  };

  const handleMinuteSelect = (selectedMinute: number) => {
    setMinute(selectedMinute);
  };

  const handleAmPmSelect = (selectedAmPm: string) => {
    setAmPm(selectedAmPm);
  };

  const setTimePreset = (presetHour: number, presetMinute: number = 0, presetAmPm: string = 'AM') => {
    setHour24(presetHour);
    setMinute(presetMinute);
    setAmPm(presetAmPm);
    
    setTimeout(() => {
      const hourIndex = presetHour - 1;
      const minuteIndex = presetMinute;
      const ampmIndex = presetAmPm === 'PM' ? 1 : 0;
      
      hourScrollRef.current?.scrollTo({ y: hourIndex * 50, animated: true });
      minuteScrollRef.current?.scrollTo({ y: minuteIndex * 50, animated: true });
      ampmScrollRef.current?.scrollTo({ y: ampmIndex * 50, animated: true });
    }, 100);
  };

  const renderWheelPicker = (
    items: { label: string; value: any }[], 
    selectedValue: any, 
    onSelect: (value: any) => void, 
    ref: React.RefObject<ScrollView | null>,
    width: number = 80
  ) => {
    return (
      <View style={[styles.wheelColumn, { width }]}>
        <View style={styles.wheelContainer}>
          <ScrollView
            ref={ref}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.wheelContent}
            snapToInterval={50}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) => {
              const offsetY = event.nativeEvent.contentOffset.y;
              const index = Math.round(offsetY / 50);
              const selectedItem = items[Math.max(0, Math.min(items.length - 1, index))];
              if (selectedItem) {
                onSelect(selectedItem.value);
              }
            }}
          >
            {items.map((item, index) => {
              const isSelected = item.value === selectedValue;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.wheelItem, isSelected && styles.wheelItemSelected]}
                  onPress={() => {
                    onSelect(item.value);
                    ref.current?.scrollTo({ y: index * 50, animated: true });
                  }}
                >
                  <Text style={[
                    styles.wheelItemText,
                    isSelected && styles.wheelItemTextSelected
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.wheelOverlayTop} />
          <View style={styles.wheelOverlayBottom} />
        </View>
      </View>
    );
  };

  const displayHour = hour24 % 12 || 12;

  return (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>
          {mode === 'start' ? 'Start Time' : 'End Time'}
        </Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Current Time Display */}
        <View style={styles.timeDisplayContainer}>
          <Text style={styles.timeDisplayLabel}>
            {mode === 'start' ? 'Shift Start Time' : 'Shift End Time'}
          </Text>
          <View style={styles.timeDisplay}>
            <Text style={styles.timeDisplayText}>
              {displayHour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')} {amPm}
            </Text>
          </View>
        </View>

        {/* Time Picker */}
        <View style={styles.wheelSection}>
          <View style={styles.wheelPickerContainer}>
            <View style={styles.centerIndicator} />
            
            {renderWheelPicker(HOURS, displayHour, handleHourSelect, hourScrollRef, 70)}
            
            <Text style={styles.wheelSeparator}>:</Text>
            
            {renderWheelPicker(MINUTES, minute, handleMinuteSelect, minuteScrollRef, 70)}
            
            <Text style={styles.wheelSeparator} />
            
            {renderWheelPicker(AMPM, amPm, handleAmPmSelect, ampmScrollRef, 60)}
          </View>
        </View>

        {/* Quick Presets */}
        <View style={styles.presetSection}>
          <Text style={styles.presetTitle}>Quick Presets</Text>
          <View style={styles.presetGrid}>
            {[
              { hour: 9, minute: 0, amPm: 'AM', label: '9:00 AM' },
              { hour: 12, minute: 0, amPm: 'PM', label: '12:00 PM' },
              { hour: 2, minute: 0, amPm: 'PM', label: '2:00 PM' },
              { hour: 5, minute: 0, amPm: 'PM', label: '5:00 PM' },
              { hour: 8, minute: 0, amPm: 'PM', label: '8:00 PM' },
              { hour: 11, minute: 0, amPm: 'PM', label: '11:00 PM' },
              { hour: 12, minute: 0, amPm: 'AM', label: '12:00 AM' },
              { hour: 6, minute: 0, amPm: 'AM', label: '6:00 AM' },
            ].map((preset) => (
              <TouchableOpacity 
                key={preset.label} 
                style={styles.presetButton} 
                onPress={() => setTimePreset(preset.hour, preset.minute, preset.amPm)}
              >
                <Text style={styles.presetButtonText}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
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
  const selectionColor = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';

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
    timeDisplayContainer: {
      alignItems: 'center',
      marginBottom: 30,
      paddingVertical: 10,
    },
    timeDisplayLabel: {
      fontSize: 16,
      color: secondaryTextColor,
      marginBottom: 12,
    },
    timeDisplay: {
      backgroundColor: cardBackground,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor,
    },
    timeDisplayText: {
      fontSize: 32,
      fontWeight: '700',
      color: primaryColor,
    },
    wheelSection: {
      marginBottom: 25,
    },
    wheelPickerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: 200,
      position: 'relative',
    },
    wheelColumn: {
      alignItems: 'center',
    },
    wheelContainer: {
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
    },
    wheelContent: {
      paddingVertical: 75,
    },
    wheelItem: {
      height: 50,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    wheelItemSelected: {
      backgroundColor: 'transparent',
    },
    wheelItemText: {
      fontSize: 20,
      color: secondaryTextColor,
      fontWeight: '400',
    },
    wheelItemTextSelected: {
      color: textColor,
      fontWeight: '600',
      fontSize: 24,
    },
    wheelSeparator: {
      fontSize: 24,
      color: secondaryTextColor,
      marginHorizontal: 8,
      marginTop: 10,
      width: 20,
      textAlign: 'center',
    },
    wheelOverlayTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 75,
      backgroundColor: backgroundColor,
      opacity: 0.9,
      pointerEvents: 'none',
    },
    wheelOverlayBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 75,
      backgroundColor: backgroundColor,
      opacity: 0.9,
      pointerEvents: 'none',
    },
    centerIndicator: {
      position: 'absolute',
      left: 20,
      right: 20,
      top: '50%',
      marginTop: -25,
      height: 50,
      backgroundColor: selectionColor,
      borderRadius: 8,
      zIndex: -1,
    },
    presetSection: {
      marginBottom: 20,
    },
    presetTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginBottom: 12,
      textAlign: 'center',
    },
    presetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    presetButton: {
      flexBasis: '23%',
      backgroundColor: cardBackground,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      minWidth: 80,
      borderWidth: 1,
      borderColor: borderColor,
    },
    presetButtonText: {
      fontSize: 14,
      color: textColor,
      fontWeight: '500',
    },
    bottomSpacing: {
      height: 40,
    },
  });
};