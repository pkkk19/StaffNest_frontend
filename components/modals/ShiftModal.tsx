// app/components/modals/ShiftModal.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Switch, 
  ScrollView, 
  StyleSheet,
  Alert 
} from 'react-native';
import { Calendar, MapPin, Users, Plus, Trash2, ChevronDown, Clock4, Building, Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

// Define the RoleShift interface locally to avoid import issues
interface Task {
  task: string;
  completed: boolean;
}

interface RoleShift {
  _id: string;
  name: string;
  start_day: string;
  end_day: string;
  start_time: string;
  end_time: string;
  location_id: string;
  required_staff: number;
  tasks: Task[];
  is_active: boolean;
}

interface Location {
  _id: string;
  name: string;
  address: string;
}

interface ShiftModalProps {
  currentShift: Partial<RoleShift> & { index?: number };
  locations: Location[];
  selectedDays: string[]; // Track selected days from DaysModal
  onUpdateShift: (updates: Partial<RoleShift>) => void;
  onAddTask: () => void;
  onUpdateTask: (index: number, value: string) => void;
  onRemoveTask: (index: number) => void;
  onOpenLocationModal: () => void;
  onOpenDaysModal: () => void;
  onOpenStartTimeModal: () => void;
  onOpenEndTimeModal: () => void;
  onSave: (selectedDays?: string[]) => void; // Accept selected days parameter
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

export const ShiftModal: React.FC<ShiftModalProps> = ({
  currentShift,
  locations,
  selectedDays,
  onUpdateShift,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onOpenLocationModal,
  onOpenDaysModal,
  onOpenStartTimeModal,
  onOpenEndTimeModal,
  onSave,
  onClose,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getLocationName = (locationId?: string) => {
    if (!locationId) return 'Select location';
    const location = locations.find(l => l._id === locationId);
    return location ? location.name : 'Select location';
  };

  const getLocationAddress = (locationId?: string) => {
    if (!locationId) return '';
    const location = locations.find(l => l._id === locationId);
    return location ? location.address : '';
  };

  const isOvernightShift = currentShift.start_day !== currentShift.end_day;

  const formatDayForDisplay = (day: string = '') => {
    const dayMap: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue', 
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };
    return dayMap[day.toLowerCase()] || day;
  };

  const formatTimeForDisplay = (time: string = '') => {
    if (!time) return '--:--';
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minute} ${period}`;
  };

  const formatDaysForDisplay = () => {
    if (!selectedDays || selectedDays.length === 0) {
      return currentShift.start_day ? formatDayForDisplay(currentShift.start_day) : 'Select days';
    }
    
    if (selectedDays.length === 1) {
      return formatDayForDisplay(selectedDays[0]);
    }
    
    if (selectedDays.length === 7) {
      return 'Every day';
    }
    
    if (selectedDays.length === 5 && 
        selectedDays.includes('monday') && 
        selectedDays.includes('tuesday') && 
        selectedDays.includes('wednesday') && 
        selectedDays.includes('thursday') && 
        selectedDays.includes('friday')) {
      return 'Weekdays';
    }
    
    if (selectedDays.length === 2 && 
        selectedDays.includes('saturday') && 
        selectedDays.includes('sunday')) {
      return 'Weekend';
    }
    
    // Show first few days
    const dayLabels = selectedDays.map(day => {
      return formatDayForDisplay(day);
    });
    
    if (dayLabels.length <= 2) {
      return dayLabels.join(', ');
    }
    
    return `${dayLabels[0]}, ${dayLabels[1]} +${dayLabels.length - 2}`;
  };

  const handleSave = () => {
    if (!currentShift.name?.trim()) {
      Alert.alert('Error', 'Please enter a shift name');
      return;
    }
    if (!currentShift.location_id) {
      Alert.alert('Error', 'Please select a location');
      return;
    }
    if (!currentShift.start_time || !currentShift.end_time) {
      Alert.alert('Error', 'Please set start and end times');
      return;
    }
    
    // Pass selected days to parent, but only if we're creating new (not editing)
    if (currentShift.index !== undefined) {
      // Editing existing shift - don't pass selected days
      onSave();
    } else {
      // Creating new shift - pass selected days if multiple
      onSave(selectedDays.length > 0 ? selectedDays : undefined);
    }
  };

  return (
    <View style={styles.modalContainer}>
      {/* Fixed Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>
          {currentShift.index !== undefined ? 'Edit Shift' : 'Add New Shift'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Shift Name */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>
            Shift Name <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            value={currentShift.name}
            onChangeText={(text) => onUpdateShift({ name: text })}
            placeholder="e.g., Morning Shift, Night Patrol"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Days Selection Card */}
        <TouchableOpacity 
          style={styles.selectionCard}
          onPress={onOpenDaysModal}
          activeOpacity={0.7}
        >
          <View style={styles.selectionCardHeader}>
            <Calendar size={20} color="#3B82F6" />
            <View style={styles.selectionCardTitleContainer}>
              <Text style={styles.selectionCardTitle}>Days</Text>
              <Text style={styles.selectionCardValue}>
                {formatDaysForDisplay()}
              </Text>
            </View>
            <ChevronDown size={20} color="#6B7280" />
          </View>
          
          {/* Show selected days badge */}
          {selectedDays.length > 1 && (
            <View style={styles.selectedDaysBadge}>
              <Text style={styles.selectedDaysBadgeText}>
                {selectedDays.length} days selected
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Time Selection Cards */}
        <View style={styles.timeSelectionRow}>
          <TouchableOpacity 
            style={styles.timeCard}
            onPress={onOpenStartTimeModal}
            activeOpacity={0.7}
          >
            <View style={styles.timeCardHeader}>
              <Clock size={18} color="#3B82F6" />
              <Text style={styles.timeCardTitle}>Start Time</Text>
            </View>
            <Text style={styles.timeValue}>
              {formatTimeForDisplay(currentShift.start_time)}
            </Text>
            <Text style={styles.timeHint}>Tap to change</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.timeCard}
            onPress={onOpenEndTimeModal}
            activeOpacity={0.7}
          >
            <View style={styles.timeCardHeader}>
              <Clock size={18} color="#3B82F6" />
              <Text style={styles.timeCardTitle}>End Time</Text>
            </View>
            <Text style={styles.timeValue}>
              {formatTimeForDisplay(currentShift.end_time)}
            </Text>
            <Text style={styles.timeHint}>Tap to change</Text>
          </TouchableOpacity>
        </View>

        {/* Overnight Indicator */}
        {isOvernightShift && (
          <View style={styles.overnightCard}>
            <Clock4 size={20} color="#8B5CF6" />
            <View style={styles.overnightInfo}>
              <Text style={styles.overnightTitle}>Overnight Shift</Text>
              <Text style={styles.overnightSubtitle}>
                {formatDayForDisplay(currentShift.start_day)} → {formatDayForDisplay(currentShift.end_day)}
              </Text>
            </View>
          </View>
        )}

        {/* Location Selection */}
        <TouchableOpacity 
          style={styles.locationCard}
          onPress={onOpenLocationModal}
          activeOpacity={0.7}
        >
          <View style={styles.locationCardHeader}>
            <MapPin size={20} color={currentShift.location_id ? '#3B82F6' : '#6B7280'} />
            <Text style={styles.locationCardTitle}>
              Location <Text style={styles.requiredStar}>*</Text>
            </Text>
          </View>
          
          {currentShift.location_id ? (
            <View style={styles.locationSelected}>
              <Building size={16} color="#10B981" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{getLocationName(currentShift.location_id)}</Text>
                <Text style={styles.locationAddress}>{getLocationAddress(currentShift.location_id)}</Text>
              </View>
              <ChevronDown size={18} color="#6B7280" />
            </View>
          ) : (
            <View style={styles.locationNotSelected}>
              <Text style={styles.locationPlaceholder}>Select a location</Text>
              <ChevronDown size={18} color="#6B7280" />
            </View>
          )}
        </TouchableOpacity>

        {/* Required Staff */}
        <View style={styles.staffCard}>
          <View style={styles.staffHeader}>
            <Users size={20} color="#3B82F6" />
            <Text style={styles.staffTitle}>
              Required Staff <Text style={styles.requiredStar}>*</Text>
            </Text>
          </View>
          
          <View style={styles.staffInputContainer}>
            <TouchableOpacity
              style={styles.staffButton}
              onPress={() => onUpdateShift({ required_staff: Math.max(1, (currentShift.required_staff || 1) - 1) })}
              activeOpacity={0.7}
            >
              <Text style={styles.staffButtonText}>-</Text>
            </TouchableOpacity>
            
            <View style={styles.staffValueContainer}>
              <Text style={styles.staffValue}>{currentShift.required_staff || 1}</Text>
              <Text style={styles.staffLabel}>staff</Text>
            </View>
            
            <TouchableOpacity
              style={styles.staffButton}
              onPress={() => onUpdateShift({ required_staff: (currentShift.required_staff || 1) + 1 })}
              activeOpacity={0.7}
            >
              <Text style={styles.staffButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.staffHint}>Adjust number of staff required for this shift</Text>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksCard}>
          <View style={styles.tasksHeader}>
            <View>
              <Text style={styles.tasksTitle}>Tasks (Optional)</Text>
              <Text style={styles.tasksSubtitle}>Assign specific duties for this shift</Text>
            </View>
            <TouchableOpacity 
              style={styles.addTaskButton}
              onPress={onAddTask}
              activeOpacity={0.7}
            >
              <Plus size={18} color="#3B82F6" />
              <Text style={styles.addTaskText}>Add Task</Text>
            </TouchableOpacity>
          </View>

          {(currentShift.tasks || []).length > 0 ? (
            <View style={styles.tasksList}>
              {(currentShift.tasks || []).map((task: Task, index: number) => (
                <View key={index} style={styles.taskItem}>
                  <View style={styles.taskBullet} />
                  <TextInput
                    style={styles.taskInput}
                    value={task.task}
                    onChangeText={(text: string) => onUpdateTask(index, text)}
                    placeholder="Describe the task..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.removeTaskButton}
                    onPress={() => onRemoveTask(index)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noTasks}>
              <Text style={styles.noTasksText}>No tasks added yet</Text>
              <Text style={styles.noTasksHint}>Add specific duties for this shift</Text>
            </View>
          )}
        </View>

        {/* Active Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[
              styles.statusIndicator, 
              { backgroundColor: currentShift.is_active !== false ? '#10B981' : '#6B7280' }
            ]} />
            <Text style={styles.statusTitle}>Shift Status</Text>
          </View>
          
          <View style={styles.statusToggle}>
            <Text style={styles.statusLabel}>
              {currentShift.is_active !== false ? 'Active' : 'Inactive'}
            </Text>
            <Switch
              value={currentShift.is_active !== false}
              onValueChange={(value) => onUpdateShift({ is_active: value })}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor="#fff"
            />
          </View>
          
          <Text style={styles.statusHint}>
            {currentShift.is_active !== false 
              ? 'This shift is active and will appear in schedules'
              : 'This shift is inactive and will not appear in schedules'}
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!currentShift.name?.trim() || !currentShift.location_id) && styles.saveButtonDisabled
          ]} 
          onPress={handleSave}
          disabled={!currentShift.name?.trim() || !currentShift.location_id}
        >
          <Text style={styles.saveButtonText}>
            {currentShift.index !== undefined 
              ? 'Update Shift'
              : selectedDays.length > 1 
                ? `Create ${selectedDays.length} Shifts`
                : 'Create Shift'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: string) => {
  const isDark = theme === 'dark';
  const backgroundColor = isDark ? '#1F2937' : '#fff';
  const cardBackground = isDark ? '#111827' : '#F9FAFB';
  const textColor = isDark ? '#fff' : '#000';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const inputBackground = isDark ? '#374151' : '#F3F4F6';
  const primaryColor = '#3B82F6';
  const successColor = '#10B981';
  const errorColor = '#EF4444';

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
    headerSpacer: {
      width: 32,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 100,
    },
    inputCard: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: borderColor,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: secondaryTextColor,
      marginBottom: 8,
    },
    requiredStar: {
      color: errorColor,
    },
    textInput: {
      backgroundColor: inputBackground,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: textColor,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#D1D5DB',
    },
    // Selection Cards
    selectionCard: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: borderColor,
    },
    selectionCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    selectionCardTitleContainer: {
      flex: 1,
    },
    selectionCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: secondaryTextColor,
      marginBottom: 2,
    },
    selectionCardValue: {
      fontSize: 16,
      fontWeight: '700',
      color: primaryColor,
    },
    selectedDaysBadge: {
      backgroundColor: isDark ? '#1E40AF' : '#DBEAFE',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    selectedDaysBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#93C5FD' : '#1E40AF',
    },
    // Time Selection
    timeSelectionRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    timeCard: {
      flex: 1,
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: borderColor,
      alignItems: 'center',
    },
    timeCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    timeCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: textColor,
    },
    timeValue: {
      fontSize: 16,
      fontWeight: '700',
      color: primaryColor,
      marginBottom: 4,
      textAlign: 'center',
    },
    timeHint: {
      fontSize: 12,
      color: secondaryTextColor,
      textAlign: 'center',
    },
    overnightCard: {
      backgroundColor: isDark ? '#1E1B4B' : '#F5F3FF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4C1D95' : '#DDD6FE',
    },
    overnightInfo: {
      flex: 1,
    },
    overnightTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#C4B5FD' : '#8B5CF6',
    },
    overnightSubtitle: {
      fontSize: 12,
      color: isDark ? '#A78BFA' : '#A78BFA',
      marginTop: 2,
    },
    locationCard: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: borderColor,
    },
    locationCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    locationCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: secondaryTextColor,
    },
    locationSelected: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      padding: 12,
      borderRadius: 8,
    },
    locationInfo: {
      flex: 1,
    },
    locationName: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginBottom: 2,
    },
    locationAddress: {
      fontSize: 12,
      color: secondaryTextColor,
    },
    locationNotSelected: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      padding: 12,
      borderRadius: 8,
    },
    locationPlaceholder: {
      fontSize: 16,
      color: secondaryTextColor,
      fontStyle: 'italic',
    },
    staffCard: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: borderColor,
    },
    staffHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    staffTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: secondaryTextColor,
    },
    staffInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    staffButton: {
      width: 48,
      height: 48,
      backgroundColor: primaryColor,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    staffButtonText: {
      fontSize: 24,
      color: '#fff',
      fontWeight: 'bold',
    },
    staffValueContainer: {
      alignItems: 'center',
      marginHorizontal: 24,
    },
    staffValue: {
      fontSize: 32,
      fontWeight: '700',
      color: textColor,
    },
    staffLabel: {
      fontSize: 14,
      color: secondaryTextColor,
      marginTop: 2,
    },
    staffHint: {
      fontSize: 12,
      color: secondaryTextColor,
      textAlign: 'center',
      marginTop: 8,
    },
    tasksCard: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: borderColor,
    },
    tasksHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    tasksTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: secondaryTextColor,
    },
    tasksSubtitle: {
      fontSize: 12,
      color: secondaryTextColor,
      marginTop: 2,
    },
    addTaskButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addTaskText: {
      fontSize: 14,
      fontWeight: '600',
      color: primaryColor,
    },
    tasksList: {
      gap: 12,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    taskBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: primaryColor,
      marginTop: 8,
    },
    taskInput: {
      flex: 1,
      backgroundColor: inputBackground,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: textColor,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#D1D5DB',
      minHeight: 44,
    },
    removeTaskButton: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: inputBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    noTasks: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    noTasksText: {
      fontSize: 14,
      color: secondaryTextColor,
      marginBottom: 4,
    },
    noTasksHint: {
      fontSize: 12,
      color: secondaryTextColor,
    },
    statusCard: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: borderColor,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: secondaryTextColor,
    },
    statusToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statusLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
    },
    statusHint: {
      fontSize: 12,
      color: secondaryTextColor,
    },
    bottomSpacing: {
      height: 80,
    },
    saveButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      backgroundColor: backgroundColor,
      borderTopWidth: 1,
      borderTopColor: borderColor,
    },
    saveButton: {
      backgroundColor: primaryColor,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: isDark ? '#374151' : '#D1D5DB',
      opacity: 0.7,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
    },
  });
};