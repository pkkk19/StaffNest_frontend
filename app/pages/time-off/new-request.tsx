import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Clock,
  FileText,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  Sun,
  Moon,
  Thermometer,
  Heart,
  Coffee,
  Home,
  Briefcase,
  Users,
  Award,
  ChevronRight,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { timeOffAPI } from '@/services/api';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

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
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0, 0))); // 9:00 AM
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(17, 0, 0, 0))); // 5:00 PM
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState('morning');
  
  // Picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  
  // For iOS custom pickers
  const [iosDatePickerMode, setIosDatePickerMode] = useState<'startDate' | 'endDate' | 'startTime' | 'endTime' | null>(null);
  const [iosPickerValue, setIosPickerValue] = useState(new Date());
  const [iosPickerType, setIosPickerType] = useState<'date' | 'time'>('date');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pickerSlideAnim = useRef(new Animated.Value(height)).current;

  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  const leaveTypes = [
    { 
      value: 'annual_leave', 
      label: 'Annual Leave', 
      icon: Sun, 
      color: '#3B82F6',
      description: 'Paid vacation time'
    },
    { 
      value: 'sick_leave', 
      label: 'Sick Leave', 
      icon: Thermometer, 
      color: '#EC4899',
      description: 'Medical or health-related'
    },
    { 
      value: 'time_off', 
      label: 'Time Off', 
      icon: Coffee, 
      color: '#8B5CF6',
      description: 'Personal time off'
    },
    { 
      value: 'paid_leave', 
      label: 'Paid Leave', 
      icon: Award, 
      color: '#10B981',
      description: 'Other paid leave'
    },
    { 
      value: 'unpaid_leave', 
      label: 'Unpaid Leave', 
      icon: X, 
      color: '#F59E0B',
      description: 'Leave without pay'
    },
    { 
      value: 'personal_leave', 
      label: 'Personal Leave', 
      icon: Heart, 
      color: '#06B6D4',
      description: 'Personal or family matters'
    },
    { 
      value: 'work_from_home', 
      label: 'Work From Home', 
      icon: Home, 
      color: '#6366F1',
      description: 'Remote work arrangement'
    },
    { 
      value: 'business_trip', 
      label: 'Business Trip', 
      icon: Briefcase, 
      color: '#8B5CF6',
      description: 'Company business travel'
    },
    { 
      value: 'maternity_paternity', 
      label: 'Parental Leave', 
      icon: Users, 
      color: '#EC4899',
      description: 'Maternity/Paternity leave'
    },
  ];

  const selectedLeaveType = leaveTypes.find(type => type.value === leaveType);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // When duration type changes, adjust dates if needed
  useEffect(() => {
    if (durationType === 'partial_day') {
      // For partial day, set end date same as start date
      setEndDate(new Date(startDate));
    }
  }, [durationType]);

  const calculateDays = () => {
    if (durationType === 'partial_day') {
      return '1 day (Partial)';
    }
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (isHalfDay && durationType === 'all_day') {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} (Half Day)`;
    }
    
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  const calculateTotalHours = () => {
    if (durationType === 'partial_day') {
      const diffMs = endTime.getTime() - startTime.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      return `${hours.toFixed(1)} hours`;
    }
    return null;
  };

const handleSubmit = async () => {
  Keyboard.dismiss();
  
  if (!reason.trim()) {
    Alert.alert('Missing Information', 'Please provide a reason for your leave request');
    return;
  }

  if (durationType === 'all_day' && endDate < startDate) {
    Alert.alert('Invalid Dates', 'End date cannot be before start date');
    return;
  }

  if (durationType === 'partial_day' && endTime <= startTime) {
    Alert.alert('Invalid Time', 'End time must be after start time');
    return;
  }

  try {
    setLoading(true);
    
    // Format dates consistently
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = durationType === 'all_day' 
      ? endDate.toISOString().split('T')[0] 
      : formattedStartDate; // Same date for partial day
    
    const requestData: any = {
      leave_type: leaveType,
      duration_type: durationType,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      reason: reason.trim(),
      status: 'pending',
    };

    if (durationType === 'partial_day') {
      // Format times properly
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      
      const endDateTime = new Date(startDate); // Use same date as start
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      
      requestData.start_time = startDateTime.toISOString();
      requestData.end_time = endDateTime.toISOString();
      
      console.log('Partial day request:', {
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        start_time: requestData.start_time,
        end_time: requestData.end_time,
        dates_equal: formattedStartDate === formattedEndDate
      });
    }

    if (isHalfDay && durationType === 'all_day') {
      requestData.is_half_day = true;
      requestData.half_day_period = halfDayPeriod;
    }

    console.log('Submitting leave request:', requestData);
    
    await timeOffAPI.createLeaveRequest(requestData);
    
    Alert.alert(
      '✓ Request Submitted',
      'Your leave request has been submitted for approval.',
      [
        {
          text: 'View Requests',
          onPress: () => router.push('/pages/time-off/my-leaves'),
        },
        {
          text: 'OK',
          onPress: () => router.back(),
        }
      ]
    );
  } catch (error: any) {
    console.error('Error creating leave request:', error);
    const errorMessage = error.response?.data?.message || 'Failed to submit leave request. Please try again.';
    
    // Log more details for debugging
    console.log('Error details:', {
      message: errorMessage,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (errorMessage.includes('must be on the same day')) {
      Alert.alert(
        'Validation Error',
        'For partial day leave, start and end times must be on the same day. Please ensure you have selected the same date for both start and end.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Submission Failed', errorMessage);
    }
  } finally {
    setLoading(false);
  }
};

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Android picker handlers
  const handleStartDateConfirm = (event: any, date?: Date) => {
    setShowStartDatePicker(false);
    if (date) {
      setStartDate(date);
      if (durationType === 'all_day' && date > endDate) {
        setEndDate(date);
      }
    }
  };

  const handleEndDateConfirm = (event: any, date?: Date) => {
    setShowEndDatePicker(false);
    if (date) {
      setEndDate(date);
    }
  };

  const handleStartTimeConfirm = (event: any, time?: Date) => {
    setShowStartTimePicker(false);
    if (time) {
      setStartTime(time);
    }
  };

  const handleEndTimeConfirm = (event: any, time?: Date) => {
    setShowEndTimePicker(false);
    if (time) {
      setEndTime(time);
    }
  };

  // iOS custom picker handlers
  const openIosDatePicker = (mode: 'startDate' | 'endDate' | 'startTime' | 'endTime') => {
    let initialDate = new Date();
    switch (mode) {
      case 'startDate':
        initialDate = startDate;
        setIosPickerType('date');
        break;
      case 'endDate':
        initialDate = endDate;
        setIosPickerType('date');
        break;
      case 'startTime':
        initialDate = startTime;
        setIosPickerType('time');
        break;
      case 'endTime':
        initialDate = endTime;
        setIosPickerType('time');
        break;
    }
    setIosPickerValue(initialDate);
    setIosDatePickerMode(mode);
    
    // Animate picker up
    Animated.timing(pickerSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeIosDatePicker = () => {
    Animated.timing(pickerSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIosDatePickerMode(null);
    });
  };

  const confirmIosPicker = () => {
    switch (iosDatePickerMode) {
      case 'startDate':
        setStartDate(iosPickerValue);
        if (durationType === 'all_day' && iosPickerValue > endDate) {
          setEndDate(iosPickerValue);
        }
        break;
      case 'endDate':
        setEndDate(iosPickerValue);
        break;
      case 'startTime':
        setStartTime(iosPickerValue);
        break;
      case 'endTime':
        setEndTime(iosPickerValue);
        break;
    }
    closeIosDatePicker();
  };

  const getPickerTitle = () => {
    switch (iosDatePickerMode) {
      case 'startDate': return 'Select Date';
      case 'endDate': return 'Select End Date';
      case 'startTime': return 'Select Start Time';
      case 'endTime': return 'Select End Time';
      default: return 'Select';
    }
  };

  // Universal picker open functions
  const openStartDatePicker = () => {
    if (Platform.OS === 'ios') {
      openIosDatePicker('startDate');
    } else {
      setShowStartDatePicker(true);
    }
  };

  const openEndDatePicker = () => {
    if (Platform.OS === 'ios') {
      openIosDatePicker('endDate');
    } else {
      setShowEndDatePicker(true);
    }
  };

  const openStartTimePicker = () => {
    if (Platform.OS === 'ios') {
      openIosDatePicker('startTime');
    } else {
      setShowStartTimePicker(true);
    }
  };

  const openEndTimePicker = () => {
    if (Platform.OS === 'ios') {
      openIosDatePicker('endTime');
    } else {
      setShowEndTimePicker(true);
    }
  };

  const renderLeaveTypeModal = () => {
    return (
      <Modal
        transparent={true}
        animationType="slide"
        visible={showLeaveTypeModal}
        onRequestClose={() => setShowLeaveTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
          <TouchableWithoutFeedback onPress={() => setShowLeaveTypeModal(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback>
                <Animated.View style={[styles.modalContent, {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Leave Type</Text>
                    <TouchableOpacity 
                      onPress={() => setShowLeaveTypeModal(false)}
                      style={styles.modalCloseButton}
                    >
                      <X size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView 
                    style={styles.modalBody} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.modalBodyContent}
                  >
                    {leaveTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <TouchableOpacity
                          key={type.value}
                          style={[
                            styles.leaveTypeOption,
                            leaveType === type.value && styles.leaveTypeOptionSelected,
                          ]}
                          onPress={() => {
                            setLeaveType(type.value);
                            setShowLeaveTypeModal(false);
                          }}
                        >
                          <View style={[
                            styles.leaveTypeOptionIcon,
                            { backgroundColor: `${type.color}15` }
                          ]}>
                            <Icon size={20} color={type.color} />
                          </View>
                          <View style={styles.leaveTypeOptionText}>
                            <Text style={[
                              styles.leaveTypeOptionLabel,
                              leaveType === type.value && styles.leaveTypeOptionLabelSelected
                            ]}>
                              {type.label}
                            </Text>
                            <Text style={styles.leaveTypeOptionDescription}>
                              {type.description}
                            </Text>
                          </View>
                          {leaveType === type.value && (
                            <View style={[styles.checkmark, { backgroundColor: type.color }]}>
                              <Check size={16} color="#FFFFFF" />
                            </View>
                          )}
                          {leaveType !== type.value && (
                            <ChevronRight size={20} color={isDark ? '#475569' : '#CBD5E1'} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  };

  const renderIOSPickerModal = () => {
    if (!iosDatePickerMode) return null;

    return (
      <Modal
        transparent={true}
        animationType="fade"
        visible={!!iosDatePickerMode}
        onRequestClose={closeIosDatePicker}
      >
        <View style={styles.iosPickerOverlay}>
          <BlurView intensity={30} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
          <TouchableWithoutFeedback onPress={closeIosDatePicker}>
            <View style={styles.iosPickerBackdrop}>
              <TouchableWithoutFeedback>
                <Animated.View style={[
                  styles.iosPickerContainer,
                  {
                    transform: [{ translateY: pickerSlideAnim }]
                  }
                ]}>
                  <View style={styles.iosPickerHeader}>
                    <TouchableOpacity onPress={closeIosDatePicker} style={styles.iosPickerCancelButton}>
                      <Text style={styles.iosPickerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.iosPickerTitle}>{getPickerTitle()}</Text>
                    <TouchableOpacity onPress={confirmIosPicker} style={styles.iosPickerConfirmButton}>
                      <Text style={styles.iosPickerConfirmText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.iosPickerContent}>
                    {iosPickerType === 'date' ? (
                      <DateTimePicker
                        value={iosPickerValue}
                        mode="date"
                        display="spinner"
                        onChange={(event, date) => date && setIosPickerValue(date)}
                        minimumDate={iosDatePickerMode === 'endDate' ? startDate : new Date()}
                        style={styles.iosPicker}
                        themeVariant={isDark ? 'dark' : 'light'}
                      />
                    ) : (
                      <DateTimePicker
                        value={iosPickerValue}
                        mode="time"
                        display="spinner"
                        onChange={(event, time) => time && setIosPickerValue(time)}
                        style={styles.iosPicker}
                        themeVariant={isDark ? 'dark' : 'light'}
                      />
                    )}
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  };

  const renderSummary = () => {
    const totalHours = calculateTotalHours();
    
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={[styles.summaryIcon, { backgroundColor: `${selectedLeaveType?.color}15` }]}>
            {selectedLeaveType && <selectedLeaveType.icon size={20} color={selectedLeaveType.color} />}
          </View>
          <Text style={styles.summaryTitle}>Request Summary</Text>
        </View>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Leave Type</Text>
            <Text style={[styles.summaryValue, { color: selectedLeaveType?.color }]}>
              {selectedLeaveType?.label}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{calculateDays()}</Text>
          </View>
          
          {durationType === 'all_day' ? (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Dates</Text>
              <Text style={styles.summaryValue}>
                {formatFullDate(startDate)}
                {startDate.getTime() !== endDate.getTime() && (
                  <>
                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B' }}>{' → '}</Text>
                    {formatFullDate(endDate)}
                  </>
                )}
              </Text>
            </View>
          ) : (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>
                {formatFullDate(startDate)}
              </Text>
            </View>
          )}
          
          {durationType === 'partial_day' && totalHours && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>
                {formatTime(startTime)} - {formatTime(endTime)}
                <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12, marginLeft: 4 }}>
                  ({totalHours})
                </Text>
              </Text>
            </View>
          )}
          
          {isHalfDay && durationType === 'all_day' && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Period</Text>
              <Text style={styles.summaryValue}>
                {halfDayPeriod === 'morning' ? 'Morning (8 AM - 12 PM)' : 'Afternoon (1 PM - 5 PM)'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDatePicker = () => {
    // Only render Android pickers
    if (Platform.OS === 'ios') return null;
    
    return (
      <>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={handleStartDateConfirm}
            minimumDate={new Date()}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={handleEndDateConfirm}
            minimumDate={startDate}
          />
        )}
        {showStartTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display="default"
            onChange={handleStartTimeConfirm}
          />
        )}
        {showEndTimePicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            display="default"
            onChange={handleEndTimeConfirm}
          />
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.container}>
          <StatusBar
            barStyle={isDark ? 'light-content' : 'dark-content'}
            backgroundColor={isDark ? '#0F172A' : '#F8FAFC'}
            translucent={false}
          />
          
          {/* Fixed Header */}
          <View style={styles.headerContainer}>
            <Animated.View style={[styles.header, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}>
              <TouchableOpacity 
                onPress={() => router.back()} 
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color={isDark ? '#F1F5F9' : '#1E293B'} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>New Leave Request</Text>
              <View style={{ width: 40 }} />
            </Animated.View>
          </View>
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={true}
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
          >
            {/* Leave Type Selection */}
            <Animated.View style={[styles.card, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}>
              <Text style={styles.cardTitle}>Leave Type</Text>
              <TouchableOpacity
                style={styles.leaveTypeSelector}
                onPress={() => setShowLeaveTypeModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.leaveTypeSelectorContent}>
                  <View style={[styles.leaveTypeIcon, { backgroundColor: `${selectedLeaveType?.color}15` }]}>
                    {selectedLeaveType && <selectedLeaveType.icon size={20} color={selectedLeaveType.color} />}
                  </View>
                  <View style={styles.leaveTypeSelectorText}>
                    <Text style={styles.leaveTypeSelectorLabel}>{selectedLeaveType?.label}</Text>
                    <Text style={styles.leaveTypeSelectorDescription}>{selectedLeaveType?.description}</Text>
                  </View>
                  <ChevronDown size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Duration Type */}
            <Animated.View style={[styles.card, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}>
              <Text style={styles.cardTitle}>Duration Type</Text>
              <View style={styles.durationContainer}>
                <TouchableOpacity
                  style={[
                    styles.durationOption,
                    durationType === 'all_day' && styles.durationOptionActive,
                  ]}
                  onPress={() => {
                    setDurationType('all_day');
                    setIsHalfDay(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.durationIcon,
                    durationType === 'all_day' && styles.durationIconActive,
                  ]}>
                    <Calendar size={18} color={durationType === 'all_day' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B')} />
                  </View>
                  <Text style={[
                    styles.durationText,
                    durationType === 'all_day' && styles.durationTextActive,
                  ]}>
                    Full Day
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.durationOption,
                    durationType === 'partial_day' && styles.durationOptionActive,
                  ]}
                  onPress={() => setDurationType('partial_day')}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.durationIcon,
                    durationType === 'partial_day' && styles.durationIconActive,
                  ]}>
                    <Clock size={18} color={durationType === 'partial_day' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B')} />
                  </View>
                  <Text style={[
                    styles.durationText,
                    durationType === 'partial_day' && styles.durationTextActive,
                  ]}>
                    Partial Day
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Dates Selection */}
            <Animated.View style={[styles.card, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}>
              <Text style={styles.cardTitle}>
                {durationType === 'partial_day' ? 'Select Date' : 'Select Dates'}
              </Text>
              
              {durationType === 'partial_day' ? (
                // Single date selection for partial day
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Date</Text>
                  <TouchableOpacity
                    style={styles.dateSelector}
                    onPress={openStartDatePicker}
                    activeOpacity={0.7}
                  >
                    <Calendar size={18} color={isDark ? '#6366F1' : '#4F46E5'} />
                    <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Date range for full day
                <View style={styles.dateGrid}>
                  <View style={styles.dateInput}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <TouchableOpacity
                      style={styles.dateSelector}
                      onPress={openStartDatePicker}
                      activeOpacity={0.7}
                    >
                      <Calendar size={18} color={isDark ? '#6366F1' : '#4F46E5'} />
                      <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateInput}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <TouchableOpacity
                      style={styles.dateSelector}
                      onPress={openEndDatePicker}
                      activeOpacity={0.7}
                    >
                      <Calendar size={18} color={isDark ? '#6366F1' : '#4F46E5'} />
                      <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              // In your JSX code, find the timeGrid section and modify it like this:

{durationType === 'partial_day' && (
  <View style={[styles.timeGrid, { marginTop: 16 }]}>
    <View style={styles.dateInput}>
      <Text style={styles.dateLabel}>Start Time</Text>
      <TouchableOpacity
        style={styles.dateSelector}
        onPress={openStartTimePicker}
        activeOpacity={0.7}
      >
        <Clock size={18} color={isDark ? '#6366F1' : '#4F46E5'} />
        <Text style={styles.dateText}>{formatTime(startTime)}</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.dateInput}>
      <Text style={styles.dateLabel}>End Time</Text>
      <TouchableOpacity
        style={styles.dateSelector}
        onPress={openEndTimePicker}
        activeOpacity={0.7}
      >
        <Clock size={18} color={isDark ? '#6366F1' : '#4F46E5'} />
        <Text style={styles.dateText}>{formatTime(endTime)}</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
            </Animated.View>

            {/* Half Day Option */}
            {durationType === 'all_day' && (
              <Animated.View style={[styles.card, {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }]}>
                <TouchableOpacity
                  style={styles.halfDayContainer}
                  onPress={() => setIsHalfDay(!isHalfDay)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.halfDayCheckbox,
                    isHalfDay && styles.halfDayCheckboxChecked
                  ]}>
                    {isHalfDay && (
                      <View style={styles.halfDayCheckboxInner}>
                        <Check size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.halfDayTextContainer}>
                    <Text style={styles.halfDayLabel}>Half Day</Text>
                    <Text style={styles.halfDayDescription}>Request only half a day off</Text>
                  </View>
                </TouchableOpacity>
                {isHalfDay && (
                  <View style={styles.halfDayOptions}>
                    <TouchableOpacity
                      style={[
                        styles.halfDayOption,
                        halfDayPeriod === 'morning' && styles.halfDayOptionActive,
                      ]}
                      onPress={() => setHalfDayPeriod('morning')}
                      activeOpacity={0.7}
                    >
                      <Sun size={16} color={halfDayPeriod === 'morning' ? '#4F46E5' : (isDark ? '#94A3B8' : '#64748B')} />
                      <Text style={[
                        styles.halfDayOptionText,
                        halfDayPeriod === 'morning' && styles.halfDayOptionTextActive,
                      ]}>
                        Morning
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.halfDayOption,
                        halfDayPeriod === 'afternoon' && styles.halfDayOptionActive,
                      ]}
                      onPress={() => setHalfDayPeriod('afternoon')}
                      activeOpacity={0.7}
                    >
                      <Moon size={16} color={halfDayPeriod === 'afternoon' ? '#4F46E5' : (isDark ? '#94A3B8' : '#64748B')} />
                      <Text style={[
                        styles.halfDayOptionText,
                        halfDayPeriod === 'afternoon' && styles.halfDayOptionTextActive,
                      ]}>
                        Afternoon
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            )}

            {/* Reason */}
            <Animated.View style={[styles.card, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}>
              <View style={styles.reasonHeader}>
                <Text style={styles.cardTitle}>Reason for Leave</Text>
                <Text style={[
                  styles.charCount,
                  reason.length > 450 && { color: '#EF4444' }
                ]}>
                  {reason.length}/500
                </Text>
              </View>
              <TextInput
                style={styles.reasonInput}
                placeholder="Please provide a detailed reason for your leave request..."
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                multiline
                numberOfLines={4}
                maxLength={500}
                value={reason}
                onChangeText={setReason}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
              />
              {reason.length > 0 && (
                <View style={styles.reasonTips}>
                  <AlertCircle size={14} color={isDark ? '#6366F1' : '#4F46E5'} />
                  <Text style={styles.reasonTipsText}>
                    Provide specific details to help with approval
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Summary */}
            {renderSummary()}

            {/* Submit Button */}
            <Animated.View style={[styles.submitContainer, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <FileText size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Submit Leave Request</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </View>

        {/* Android Date/Time Pickers */}
        {renderDatePicker()}

        {/* iOS Custom Picker Modal */}
        {renderIOSPickerModal()}

        {/* Leave Type Modal */}
        {renderLeaveTypeModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
    },
    headerContainer: {
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
      paddingTop: Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight || 0),
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingTop: 20,
      paddingBottom: 100,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#1E293B',
      letterSpacing: -0.5,
    },
    card: {
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#FFFFFF',
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E2E8F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.1 : 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1E293B',
      marginBottom: 16,
    },
    leaveTypeSelector: {
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E2E8F0',
      padding: 16,
    },
    leaveTypeSelectorContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    leaveTypeIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    leaveTypeSelectorText: {
      flex: 1,
    },
    leaveTypeSelectorLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1E293B',
      marginBottom: 2,
    },
    leaveTypeSelectorDescription: {
      fontSize: 13,
      color: isDark ? '#94A3B8' : '#64748B',
    },
    durationContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    durationOption: {
      flex: 1,
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E2E8F0',
    },
    durationOptionActive: {
      backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
      borderColor: isDark ? '#6366F1' : '#4F46E5',
    },
    durationIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#334155' : '#E2E8F0',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    durationIconActive: {
      backgroundColor: isDark ? '#6366F1' : '#4F46E5',
    },
    durationText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    durationTextActive: {
      color: isDark ? '#6366F1' : '#4F46E5',
    },
    dateGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    timeGrid: {
      flexDirection: 'row',
      gap: 12,
      
    },
    dateInput: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#94A3B8' : '#64748B',
      marginBottom: 8,
    },
    dateSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E2E8F0',
    },
    dateText: {
      fontSize: 15,
      fontWeight: '500',
      color: isDark ? '#F1F5F9' : '#1E293B',
      marginLeft: 12,
      flex: 1,
    },
    halfDayContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    halfDayCheckbox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: isDark ? '#6366F1' : '#4F46E5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    halfDayCheckboxChecked: {
      backgroundColor: isDark ? '#6366F1' : '#4F46E5',
    },
    halfDayCheckboxInner: {
      width: 16,
      height: 16,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    halfDayTextContainer: {
      flex: 1,
    },
    halfDayLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1E293B',
      marginBottom: 2,
    },
    halfDayDescription: {
      fontSize: 13,
      color: isDark ? '#94A3B8' : '#64748B',
    },
    halfDayOptions: {
      flexDirection: 'row',
      gap: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#334155' : '#E2E8F0',
    },
    halfDayOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      borderRadius: 10,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E2E8F0',
    },
    halfDayOptionActive: {
      backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
      borderColor: isDark ? '#6366F1' : '#4F46E5',
    },
    halfDayOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    halfDayOptionTextActive: {
      color: isDark ? '#6366F1' : '#4F46E5',
    },
    reasonHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    charCount: {
      fontSize: 13,
      color: isDark ? '#94A3B8' : '#64748B',
    },
    reasonInput: {
      minHeight: 120,
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      color: isDark ? '#F1F5F9' : '#1E293B',
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E2E8F0',
    },
    reasonTips: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      padding: 12,
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.1)',
      borderRadius: 8,
    },
    reasonTipsText: {
      fontSize: 13,
      color: isDark ? '#A5B4FC' : '#4F46E5',
      flex: 1,
    },
    summaryCard: {
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#FFFFFF',
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E2E8F0',
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    summaryIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1E293B',
    },
    summaryGrid: {
      gap: 16,
    },
    summaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    summaryLabel: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#64748B',
      flex: 1,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1E293B',
      flex: 1,
      textAlign: 'right',
    },
    submitContainer: {
      paddingHorizontal: 20,
      marginTop: 8,
      marginBottom: 100,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: isDark ? '#6366F1' : '#4F46E5',
      borderRadius: 14,
      padding: 18,
      marginBottom: 12,
      shadowColor: isDark ? '#6366F1' : '#4F46E5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    cancelButton: {
      padding: 16,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(248, 250, 252, 0.7)',
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: height * 0.85,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E2E8F0',
      borderBottomWidth: 0,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#F1F5F9',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#1E293B',
    },
    modalCloseButton: {
      padding: 4,
    },
    modalBody: {
      maxHeight: height * 0.7,
    },
    modalBodyContent: {
      paddingBottom: 20,
    },
    leaveTypeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#F1F5F9',
    },
    leaveTypeOptionSelected: {
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.1)',
    },
    leaveTypeOptionIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    leaveTypeOptionText: {
      flex: 1,
    },
    leaveTypeOptionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1E293B',
      marginBottom: 2,
    },
    leaveTypeOptionLabelSelected: {
      color: isDark ? '#6366F1' : '#4F46E5',
    },
    leaveTypeOptionDescription: {
      fontSize: 13,
      color: isDark ? '#94A3B8' : '#64748B',
    },
    checkmark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    // iOS Picker Styles
    iosPickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    iosPickerBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    iosPickerContainer: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      width: '100%', // Ensure full width
    },
    iosPickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E2E8F0',
    },
    iosPickerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1E293B',
      flex: 1,
      textAlign: 'center',
    },
    iosPickerCancelButton: {
      padding: 8,
    },
    iosPickerCancelText: {
      fontSize: 16,
      color: isDark ? '#94A3B8' : '#64748B',
    },
    iosPickerConfirmButton: {
      padding: 8,
    },
    iosPickerConfirmText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#6366F1' : '#4F46E5',
    },
    iosPickerContent: {
      padding: 20,
      alignItems: 'center', // Center the picker
      justifyContent: 'center',
    },
    iosPicker: {
      width: '100%',
      height: 200,
      alignSelf: 'center', // Center align the picker
    },
  });
}