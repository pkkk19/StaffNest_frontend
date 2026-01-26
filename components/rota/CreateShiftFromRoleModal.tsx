// components/rota/CreateShiftFromRoleModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  Users,
  ChevronDown,
  Briefcase,
  Check,
  AlertTriangle,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { rolesAPI, staffAPI, companiesAPI } from '@/services/api';
import { useRotaData } from '@/hooks/useRotaData';
import { Role, RoleShift } from '@/app/types/roles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CreateShiftFromRoleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: Date;
}

interface StaffMember {
  _id: string;
  first_name: string;
  last_name: string;
  position?: string;
  email?: string;
}

interface Location {
  _id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export default function CreateShiftFromRoleModal({
  visible,
  onClose,
  onSuccess,
  defaultDate = new Date(),
}: CreateShiftFromRoleModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { createShift } = useRotaData();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // State for role selection
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedShiftIndex, setSelectedShiftIndex] = useState<number>(-1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  
  // State for shift creation queue
  const [shiftsToCreate, setShiftsToCreate] = useState<any[]>([]);
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
const [iosPickerValue, setIosPickerValue] = useState(new Date());
const pickerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  // Initialize form when modal opens
  useEffect(() => {
    if (visible) {
      fetchData();
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(formatDateForInput(tomorrow));
      
      // Reset state
      setSelectedRoleId('');
      setSelectedShiftIndex(-1);
      setSelectedStaffIds([]);
      setSelectedLocationId('');
      setCustomNotes('');
      setShiftsToCreate([]);
    }
  }, [visible]);

  const fetchData = async () => {
    if (!user?.company_id) {
      Alert.alert('Error', 'No company assigned to your account');
      onClose();
      return;
    }

    try {
      setLoading(true);
      
      // Fetch roles
      const rolesResponse = await rolesAPI.getRoles();
      const rolesData = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
      setRoles(rolesData);
      
      // Fetch staff members
      const staffResponse = await staffAPI.getStaffMembers();
      let staffData: StaffMember[] = Array.isArray(staffResponse.data) ? staffResponse.data : [];
      
      // Add current user to staff list if not already present
      if (user && !staffData.some(staff => staff._id === user._id)) {
        staffData = [
          {
            _id: user._id,
            first_name: user.first_name || 'Admin',
            last_name: user.last_name || 'User',
            position: user.position || 'Administrator',
            email: user.email
          },
          ...staffData
        ];
      }
      
      setStaffMembers(staffData);
      
      // Fetch locations
      const companyResponse = await companiesAPI.getMyCompany();
      if (companyResponse.data?.locations) {
        const activeLocations = companyResponse.data.locations.filter(
          (loc: any) => loc.is_active !== false
        );
        setLocations(activeLocations);
      }
      
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTimeDisplay = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const hour = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      return time;
    }
  };

  // Get selected role
  const selectedRole = roles.find(r => r._id === selectedRoleId);
  
  // Get available shifts for selected role
  const availableShifts = selectedRole?.shifts?.filter(shift => shift.is_active) || [];
  
  // Get qualified staff for selected role
  const qualifiedStaff = staffMembers.filter(staff => 
    selectedRole?.qualified_users?.includes(staff._id)
  );

  // Get selected shift
  const selectedShift = selectedShiftIndex >= 0 ? availableShifts[selectedShiftIndex] : null;

  // Validate form
  const validateForm = (): boolean => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return false;
    }
    
    if (!selectedShift) {
      Alert.alert('Error', 'Please select a shift pattern');
      return false;
    }
    
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return false;
    }
    
    if (!selectedLocationId) {
      Alert.alert('Error', 'Please select a location');
      return false;
    }
    
    if (selectedRole && selectedShift) {
      const requiredStaff = selectedShift.required_staff || 1;
      if (selectedStaffIds.length !== requiredStaff) {
        Alert.alert('Error', `This shift requires exactly ${requiredStaff} staff member(s)`);
        return false;
      }
    }
    
    return true;
  };

  // Calculate actual shift time based on selected date
  const calculateShiftTimes = (shift: RoleShift, dateStr: string) => {
    const startTime = shift.start_time;
    const endTime = shift.end_time;
    
    const isOvernight = shift.start_day !== shift.end_day;
    const shiftDay = shift.start_day.toLowerCase();
    
    const shiftDate = new Date(dateStr);
    
    const startDateTime = new Date(shiftDate);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const endDateTime = new Date(shiftDate);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    if (isOvernight) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
    endDateTime.setHours(endHours, endMinutes, 0, 0);
    
    return {
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
    };
  };

  // Add shift to creation queue
  const addShiftToQueue = () => {
    if (!validateForm()) {
      return;
    }

    const location = locations.find(loc => loc._id === selectedLocationId);
    if (!location) {
      Alert.alert('Error', 'Selected location not found');
      return;
    }

    const selectedStaff = staffMembers.filter(staff => 
      selectedStaffIds.includes(staff._id)
    );

    const shiftToCreate = {
      role: selectedRole!,
      shift: selectedShift!,
      date: selectedDate,
      staffMembers: selectedStaff,
      location,
      notes: customNotes
    };

    setShiftsToCreate(prev => [...prev, shiftToCreate]);
  };

  // Remove shift from queue
  const removeShiftFromQueue = (index: number) => {
    setShiftsToCreate(prev => prev.filter((_, i) => i !== index));
  };

  // Create shifts
  const createShifts = async () => {
    if (shiftsToCreate.length === 0) {
      Alert.alert('Error', 'No shifts to create');
      return;
    }

    if (!user?.company_id || !user?._id) {
      Alert.alert('Error', 'User not authenticated properly');
      return;
    }

    try {
      setSubmitting(true);
      const results = [];
      const errors = [];
      
      for (const shiftData of shiftsToCreate) {
        const { startDateTime, endDateTime } = calculateShiftTimes(
          shiftData.shift, 
          shiftData.date
        );
        
        // Create shift for each staff member
        for (const staffMember of shiftData.staffMembers) {
          try {
            const shiftPayload = {
                title: `${shiftData.role.title}: ${shiftData.shift.name}`,
                description: shiftData.notes || shiftData.shift.tasks?.map((t: any) => t.task).join('\n'),
                start_time: startDateTime,
                end_time: endDateTime,
                user_id: staffMember._id,
                company_id: user!.company_id, // Add non-null assertion
                location: shiftData.location.name,
                location_coordinates: {
                    latitude: shiftData.location.latitude,
                    longitude: shiftData.location.longitude,
                },
                location_address: shiftData.location.address,
                type: 'assigned' as const, // Add 'as const' to fix type error
                status: 'scheduled',
                role_id: shiftData.role._id,
                role_shift_id: shiftData.shift._id,
                };
            
            await createShift(shiftPayload);
            results.push({
              success: true,
              staffName: `${staffMember.first_name} ${staffMember.last_name}`,
            });
          } catch (error: any) {
            errors.push(`Shift for ${staffMember.first_name}: ${error.message}`);
          }
        }
      }
      
      if (errors.length > 0) {
        Alert.alert(
          'Partial Success', 
          `Created ${results.length} shifts successfully. ${errors.length} failed:\n\n${errors.slice(0, 3).join('\n')}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Success', 
          `Created ${results.length} shifts successfully`,
          [{ text: 'OK', onPress: onSuccess }]
        );
      }
      
      onClose();
    } catch (error: any) {
      console.error('Create shifts error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to create shifts. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeIOSDatePicker = () => {
  Animated.timing(pickerSlideAnim, {
    toValue: SCREEN_HEIGHT,
    duration: 300,
    useNativeDriver: true,
  }).start(() => {
    setShowIOSDatePicker(false);
  });
};

  const confirmIOSPicker = () => {
  const newDate = formatDateForInput(iosPickerValue);
  setSelectedDate(newDate);
  closeIOSDatePicker();
};

  const renderIOSDatePickerModal = () => {
  if (!showIOSDatePicker) return null;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={showIOSDatePicker}
      onRequestClose={closeIOSDatePicker}
    >
      <View style={styles.iosPickerOverlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        <TouchableWithoutFeedback onPress={closeIOSDatePicker}>
          <View style={styles.iosPickerBackdrop}>
            <TouchableWithoutFeedback>
              <Animated.View style={[
                styles.iosPickerContainer,
                {
                  transform: [{ translateY: pickerSlideAnim }]
                }
              ]}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity onPress={closeIOSDatePicker} style={styles.iosPickerCancelButton}>
                    <Text style={styles.iosPickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosPickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={confirmIOSPicker} style={styles.iosPickerConfirmButton}>
                    <Text style={styles.iosPickerConfirmText}>Done</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.iosPickerContent}>
                  <DateTimePicker
                    value={iosPickerValue}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => date && setIosPickerValue(date)}
                    minimumDate={new Date()}
                    style={styles.iosPicker}
                    themeVariant={isDark ? 'dark' : 'light'}
                  />
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

  // Date picker handlers
  const openDatePicker = () => {
  if (Platform.OS === 'ios') {
    setIosPickerValue(new Date(selectedDate || new Date()));
    setShowIOSDatePicker(true);
    
    // Animate picker up
    Animated.timing(pickerSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  } else {
    setShowDatePicker(true);
  }
};

  const handleDateConfirm = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
        const newDate = formatDateForInput(date);
        setSelectedDate(newDate);
    }
    };

  // Handle staff selection with exact count requirement
  const handleStaffSelection = (staffId: string) => {
    if (!selectedShift) return;
    
    const requiredStaff = selectedShift.required_staff || 1;
    const currentSelected = [...selectedStaffIds];
    
    if (currentSelected.includes(staffId)) {
      // Deselect if currently selected
      setSelectedStaffIds(currentSelected.filter(id => id !== staffId));
    } else {
      // If we're at the required number, replace the first one
      if (currentSelected.length >= requiredStaff) {
        currentSelected.shift();
      }
      setSelectedStaffIds([...currentSelected, staffId]);
    }
  };

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#3B82F6' : '#2563EB'} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Shift from Role</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={isDark ? '#F9FAFB' : '#374151'} />
          </TouchableOpacity>
        </View>

        <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
          {/* Role Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleScroll}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role._id}
                  style={[
                    styles.roleButton,
                    selectedRoleId === role._id && styles.roleButtonSelected
                  ]}
                  onPress={() => {
                    setSelectedRoleId(role._id);
                    setSelectedShiftIndex(-1);
                    setSelectedStaffIds([]);
                  }}
                >
                  <Briefcase size={20} color={selectedRoleId === role._id ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')} />
                  <Text style={[
                    styles.roleButtonText,
                    selectedRoleId === role._id && styles.roleButtonTextSelected
                  ]}>
                    {role.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Shift Pattern Selection */}
          {selectedRole && availableShifts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Shift Pattern</Text>
              {availableShifts.map((shift, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.shiftButton,
                    selectedShiftIndex === index && styles.shiftButtonSelected
                  ]}
                  onPress={() => {
                    setSelectedShiftIndex(index);
                    setSelectedStaffIds([]);
                  }}
                >
                  <View style={styles.shiftHeader}>
                    <Text style={[
                      styles.shiftName,
                      selectedShiftIndex === index && styles.shiftNameSelected
                    ]}>
                      {shift.name}
                    </Text>
                    {shift.required_staff && (
                      <Text style={styles.shiftStaffCount}>
                        {shift.required_staff} staff
                      </Text>
                    )}
                  </View>
                  <Text style={styles.shiftTime}>
                    {formatTimeDisplay(shift.start_time)} - {formatTimeDisplay(shift.end_time)}
                    {shift.start_day !== shift.end_day && ' (Overnight)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Staff Selection */}
          {selectedRole && selectedShift && qualifiedStaff.length > 0 && (
            <View style={styles.section}>
              <View style={styles.staffHeader}>
                <Text style={styles.sectionTitle}>Select Staff</Text>
                <Text style={styles.staffCount}>
                  {selectedStaffIds.length}/{selectedShift.required_staff || 1}
                </Text>
              </View>
              <View style={styles.staffGrid}>
                {qualifiedStaff.map(staff => {
                  const isSelected = selectedStaffIds.includes(staff._id);
                  const isMaxSelected = selectedStaffIds.length >= (selectedShift?.required_staff || 1) && !isSelected;
                  
                  return (
                    <TouchableOpacity
                      key={staff._id}
                      style={[
                        styles.staffButton,
                        isSelected && styles.staffButtonSelected,
                        isMaxSelected && styles.staffButtonDisabled
                      ]}
                      onPress={() => !isMaxSelected && handleStaffSelection(staff._id)}
                      disabled={isMaxSelected}
                    >
                      {isSelected ? (
                        <Check size={16} color="#FFFFFF" />
                      ) : (
                        <User size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                      )}
                      <Text style={[
                        styles.staffName,
                        isSelected && styles.staffNameSelected,
                        isMaxSelected && styles.staffNameDisabled
                      ]}>
                        {staff.first_name} {staff.last_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Location Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Location</Text>
            {locations.map((location) => (
              <TouchableOpacity
                key={location._id}
                style={[
                  styles.locationButton,
                  selectedLocationId === location._id && styles.locationButtonSelected
                ]}
                onPress={() => setSelectedLocationId(location._id)}
              >
                <MapPin size={20} color={selectedLocationId === location._id ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')} />
                <View style={styles.locationInfo}>
                  <Text style={[
                    styles.locationName,
                    selectedLocationId === location._id && styles.locationNameSelected
                  ]}>
                    {location.name}
                  </Text>
                  {location.address && (
                    <Text style={styles.locationAddress}>
                      {location.address}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={openDatePicker}
            >
              <Calendar size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.dateText}>
                {selectedDate ? formatDateDisplay(selectedDate) : 'Select date'}
              </Text>
              <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          {/* Notes */}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shift Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={customNotes}
              onChangeText={setCustomNotes}
              placeholder="Add any additional notes..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              multiline
              numberOfLines={3}
              onFocus={() => {
    setTimeout(() => {
      if (Platform.OS === 'ios') {
        scrollViewRef.current?.scrollToEnd({ 
          animated: true 
        });
      } else {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    }, 100);
  }}
            />
          </View>

          {/* Add to Queue Button */}
          {selectedRole && selectedShift && selectedLocationId && selectedDate && (
            <TouchableOpacity 
              style={styles.addToQueueButton}
              onPress={addShiftToQueue}
              disabled={submitting}
            >
              <Text style={styles.addToQueueButtonText}>Preview</Text>
            </TouchableOpacity>
          )}

          {/* Shifts Queue */}
          {shiftsToCreate.length > 0 && (
            <View style={styles.queueSection}>
              <View style={styles.queueHeader}>
                <Text style={styles.queueTitle}>
                  Shifts to Create ({shiftsToCreate.reduce((total, shift) => total + shift.staffMembers.length, 0)})
                </Text>
                <TouchableOpacity onPress={() => setShiftsToCreate([])}>
                  <Text style={styles.clearQueueText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              
              {shiftsToCreate.map((item, index) => (
                <View key={index} style={styles.queueItem}>
                  <View style={styles.queueItemHeader}>
                    <View style={styles.queueItemInfo}>
                      <Text style={styles.queueItemRole}>{item.role.title}</Text>
                      <Text style={styles.queueItemShift}>{item.shift.name}</Text>
                      <Text style={styles.queueItemStaff}>
                        {item.staffMembers.length} staff member(s)
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeShiftFromQueue(index)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.queueItemDetail}>
                    📅 {formatDateDisplay(item.date)}
                  </Text>
                  <Text style={styles.queueItemDetail}>
                    📍 {item.location.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.createButton,
              (submitting || shiftsToCreate.length === 0) && styles.createButtonDisabled
            ]}
            onPress={createShifts}
            disabled={submitting || shiftsToCreate.length === 0}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>
                Create {shiftsToCreate.reduce((total, shift) => total + shift.staffMembers.length, 0)} Shift(s)
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date(selectedDate || new Date())}
            mode="date"
            display="default"
            onChange={handleDateConfirm}
            minimumDate={new Date()}
          />
        )}

        {renderIOSDatePickerModal()}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: string) => {
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
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    closeButton: {
      padding: 4,
    },
    scrollView: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 12,
    },
    roleScroll: {
      flexDirection: 'row',
    },
    roleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#D1D5DB',
      marginRight: 8,
    },
    roleButtonSelected: {
      backgroundColor: isDark ? '#3B82F6' : '#2563EB',
      borderColor: isDark ? '#3B82F6' : '#2563EB',
    },
    roleButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    roleButtonTextSelected: {
      color: '#FFFFFF',
    },
    shiftButton: {
      padding: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      marginBottom: 8,
    },
    shiftButtonSelected: {
      backgroundColor: isDark ? '#065F46' : '#D1FAE5',
      borderColor: '#10B981',
    },
    shiftHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    shiftName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    shiftNameSelected: {
      color: '#065F46',
    },
    shiftStaffCount: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    shiftTime: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    staffHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    staffCount: {
      fontSize: 14,
      color: isDark ? '#60A5FA' : '#3B82F6',
      fontWeight: '500',
    },
    staffGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    staffButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      width: '48%',
    },
    staffButtonSelected: {
      backgroundColor: isDark ? '#065F46' : '#D1FAE5',
      borderColor: '#10B981',
    },
    staffButtonDisabled: {
      opacity: 0.5,
    },
    staffName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    staffNameSelected: {
      color: isDark ? '#10B981' : '#065F46',
    },
    staffNameDisabled: {
      color: isDark ? '#6B7280' : '#9CA3AF',
    },
    locationButton: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      marginBottom: 8,
    },
    locationButtonSelected: {
      backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE',
      borderColor: '#3B82F6',
    },
    locationInfo: {
      flex: 1,
    },
    locationName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    locationNameSelected: {
      color: '#1E3A8A',
    },
    locationAddress: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    dateText: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    notesInput: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#D1D5DB',
      borderRadius: 8,
      padding: 12,
      color: isDark ? '#F9FAFB' : '#111827',
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    addToQueueButton: {
      padding: 16,
      backgroundColor: isDark ? '#374151' : '#10B981',
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 20,
    },
    addToQueueButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#ffffff',
    },
    queueSection: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      marginBottom: 20,
    },
    queueHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    queueTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    clearQueueText: {
      fontSize: 14,
      color: '#EF4444',
      fontWeight: '600',
    },
    queueItem: {
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      marginBottom: 8,
    },
    queueItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    queueItemInfo: {
      flex: 1,
    },
    queueItemRole: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    queueItemShift: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    queueItemStaff: {
      fontSize: 12,
      color: isDark ? '#60A5FA' : '#3B82F6',
      fontWeight: '500',
      marginTop: 2,
    },
    removeButton: {
      padding: 4,
    },
    queueItemDetail: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
      marginTop: 4,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    cancelButton: {
      flex: 1,
      padding: 16,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#374151',
    },
    createButton: {
      flex: 2,
      padding: 16,
      backgroundColor: '#3B82F6',
      borderRadius: 8,
      alignItems: 'center',
    },
    createButtonDisabled: {
      backgroundColor: isDark ? '#374151' : '#9CA3AF',
      opacity: 0.7,
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
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
      width: '100%',
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
      alignItems: 'center',
      justifyContent: 'center',
    },
    iosPicker: {
      width: '100%',
      height: 200,
      alignSelf: 'center',
    },
  });
};