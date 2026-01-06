import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Clock,
  FileText,
  ChevronDown,
  X,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { timeOffAPI } from '@/services/api';

export default function EditLeaveRequest() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [leaveType, setLeaveType] = useState('annual_leave');
  const [durationType, setDurationType] = useState('all_day');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().getTime() + 60 * 60 * 1000));
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

  useEffect(() => {
    fetchLeaveDetails();
  }, [id]);

  const fetchLeaveDetails = async () => {
    try {
      setLoading(true);
      const response = await timeOffAPI.getLeave(id as string);
      const leave = response.data;
      
      setLeaveType(leave.leave_type);
      setDurationType(leave.duration_type);
      setStartDate(new Date(leave.start_date));
      setEndDate(new Date(leave.end_date));
      setReason(leave.reason);
      
      if (leave.start_time) setStartTime(new Date(leave.start_time));
      if (leave.end_time) setEndTime(new Date(leave.end_time));
      if (leave.is_half_day) setIsHalfDay(leave.is_half_day);
      if (leave.half_day_period) setHalfDayPeriod(leave.half_day_period);
    } catch (error) {
      console.error('Error fetching leave details:', error);
      Alert.alert('Error', 'Failed to load leave details');
    } finally {
      setLoading(false);
    }
  };

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
      setSubmitting(true);
      
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

      await timeOffAPI.updateLeave(id as string, requestData);
      
      Alert.alert(
        'Success',
        'Leave request updated successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error updating leave request:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update leave request'
      );
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading leave request...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Edit Leave Request</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Rest of the form is the same as new-request.tsx */}
        {/* ... copy the form sections from new-request.tsx here ... */}
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Updating...' : 'Update Request'}
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    loadingText: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
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
    // ... copy the rest of the styles from new-request.tsx
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