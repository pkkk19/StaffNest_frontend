import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Clock,
  FileText,
  ChevronDown,
  Upload,
  X,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { timeOffAPI } from '@/services/api';

export default function NewLeaveRequest() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [leaveType, setLeaveType] = useState('annual_leave');
  const [durationType, setDurationType] = useState('all_day');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().getTime() + 60 * 60 * 1000)); // +1 hour
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState('morning');
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  const leaveTypes = [
    { value: 'annual_leave', label: 'Annual Leave', color: '#3B82F6' },
    { value: 'sick_leave', label: 'Sick Leave', color: '#EC4899' },
    { value: 'time_off', label: 'Time Off', color: '#8B5CF6' },
    { value: 'paid_leave', label: 'Paid Leave', color: '#10B981' },
    { value: 'unpaid_leave', label: 'Unpaid Leave', color: '#F59E0B' },
    { value: 'personal_leave', label: 'Personal Leave', color: '#06B6D4' },
  ];

  const halfDayPeriods = [
    { value: 'morning', label: 'Morning (8 AM - 12 PM)' },
    { value: 'afternoon', label: 'Afternoon (1 PM - 5 PM)' },
  ];

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for your leave request');
      return;
    }

    if (endDate < startDate) {
      Alert.alert('Error', 'End date cannot be before start date');
      return;
    }

    if (durationType === 'partial_day' && endTime <= startTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    try {
      setLoading(true);
      
      const requestData: any = {
        leave_type: leaveType,
        duration_type: durationType,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reason,
      };

      if (durationType === 'partial_day') {
        requestData.start_time = startTime.toISOString();
        requestData.end_time = endTime.toISOString();
      }

      if (isHalfDay) {
        requestData.is_half_day = true;
        requestData.half_day_period = halfDayPeriod;
      }

      await timeOffAPI.createLeaveRequest(requestData);
      
      Alert.alert(
        'Success',
        'Leave request submitted successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit leave request'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#111827' : '#F9FAFB'}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <X size={24} color={isDark ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Leave Request</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Leave Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.leaveTypeScroll}
          >
            {leaveTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.leaveTypeButton,
                  leaveType === type.value && styles.leaveTypeButtonActive,
                  { borderColor: type.color },
                ]}
                onPress={() => setLeaveType(type.value)}
              >
                <View
                  style={[
                    styles.leaveTypeIndicator,
                    { backgroundColor: type.color },
                  ]}
                />
                <Text
                  style={[
                    styles.leaveTypeText,
                    leaveType === type.value && styles.leaveTypeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Duration Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationButtons}>
            <TouchableOpacity
              style={[
                styles.durationButton,
                durationType === 'all_day' && styles.durationButtonActive,
              ]}
              onPress={() => setDurationType('all_day')}
            >
              <Text
                style={[
                  styles.durationButtonText,
                  durationType === 'all_day' && styles.durationButtonTextActive,
                ]}
              >
                Full Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.durationButton,
                durationType === 'partial_day' && styles.durationButtonActive,
              ]}
              onPress={() => setDurationType('partial_day')}
            >
              <Text
                style={[
                  styles.durationButtonText,
                  durationType === 'partial_day' && styles.durationButtonTextActive,
                ]}
              >
                Partial Day
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dates Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Calendar size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Calendar size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
          </View>

          {durationType === 'partial_day' && (
            <View style={styles.dateRow}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Clock size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text style={styles.dateText}>{formatTime(startTime)}</Text>
                  <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Clock size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text style={styles.dateText}>{formatTime(endTime)}</Text>
                  <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Half Day Option */}
        {durationType === 'all_day' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsHalfDay(!isHalfDay)}
            >
              <View style={styles.checkbox}>
                {isHalfDay && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.checkboxLabel}>Half Day</Text>
            </TouchableOpacity>
            {isHalfDay && (
              <View style={styles.halfDayOptions}>
                {halfDayPeriods.map((period) => (
                  <TouchableOpacity
                    key={period.value}
                    style={[
                      styles.halfDayButton,
                      halfDayPeriod === period.value && styles.halfDayButtonActive,
                    ]}
                    onPress={() => setHalfDayPeriod(period.value)}
                  >
                    <Text
                      style={[
                        styles.halfDayButtonText,
                        halfDayPeriod === period.value && styles.halfDayButtonTextActive,
                      ]}
                    >
                      {period.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="Please provide a reason for your leave request..."
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date/Time Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}
      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display="default"
          onChange={(event, time) => {
            setShowStartTimePicker(false);
            if (time) setStartTime(time);
          }}
        />
      )}
      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display="default"
          onChange={(event, time) => {
            setShowEndTimePicker(false);
            if (time) setEndTime(time);
          }}
        />
      )}
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
    content: {
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 20,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    section: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    leaveTypeScroll: {
      flexDirection: 'row',
    },
    leaveTypeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      marginRight: 12,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    leaveTypeButtonActive: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    leaveTypeIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    leaveTypeText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontWeight: '500',
    },
    leaveTypeTextActive: {
      color: isDark ? '#F9FAFB' : '#111827',
    },
    durationButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    durationButton: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    durationButtonActive: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderColor: '#2563EB',
    },
    durationButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
    durationButtonTextActive: {
      color: '#2563EB',
    },
    dateRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    dateInputContainer: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 8,
    },
    dateInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    dateText: {
      fontSize: 14,
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
      marginLeft: 12,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#2563EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxInner: {
      width: 12,
      height: 12,
      borderRadius: 3,
      backgroundColor: '#2563EB',
    },
    checkboxLabel: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      fontWeight: '500',
    },
    halfDayOptions: {
      marginTop: 16,
      flexDirection: 'row',
      gap: 12,
    },
    halfDayButton: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    halfDayButtonActive: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderColor: '#2563EB',
    },
    halfDayButtonText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
    halfDayButtonTextActive: {
      color: '#2563EB',
    },
    reasonInput: {
      minHeight: 120,
      padding: 16,
      borderRadius: 12,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      color: isDark ? '#F9FAFB' : '#111827',
      fontSize: 14,
      textAlignVertical: 'top',
    },
    submitButton: {
      margin: 20,
      padding: 16,
      borderRadius: 12,
      backgroundColor: '#2563EB',
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}