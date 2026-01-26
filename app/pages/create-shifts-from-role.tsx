// app/pages/create-shifts-from-role.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  Alert, 
  Platform,
  TouchableOpacity,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator, 
  Modal,
  Animated,
} from 'react-native';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Briefcase,
  Layers,
  Check,
  AlertTriangle,
  Trash2,
  Calendar as CalendarIcon,
  Sun,
  Moon,
  Activity,
  Plus
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { rolesAPI, staffAPI, companiesAPI } from '@/services/api';
import { useRotaData } from '@/hooks/useRotaData';
import { Role, RoleShift } from '@/app/types/roles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, Stack } from 'expo-router';
import { BlurView } from 'expo-blur';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  radius?: number;
  is_active?: boolean;
}

interface ShiftToCreate {
  role: Role;
  shift: RoleShift;
  date: string;
  staffMembers: StaffMember[];
  location: Location;
  notes?: string;
}

interface CompanyLocation {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
  address?: string;
}

export default function CreateShiftsFromRolePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { createShift } = useRotaData();
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
  const [shiftsToCreate, setShiftsToCreate] = useState<ShiftToCreate[]>([]);
  
  // UI state
  const [showRoleList, setShowRoleList] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);
  const [showShiftPatternList, setShowShiftPatternList] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const [iosPickerValue, setIosPickerValue] = useState(new Date());
  const pickerSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  
  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  // Initialize form when page loads
  useEffect(() => {
    fetchData();
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(formatDateForInput(tomorrow));
  }, []);

  const fetchData = async () => {
    if (!user?.company_id) {
      Alert.alert('Error', 'No company assigned to your account');
      router.back();
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
      try {
        const locationsResponse = await companiesAPI.getLocations();
        let locationsData: Location[] = [];
        
        if (locationsResponse.data?.locations) {
          locationsData = locationsResponse.data.locations.filter(
            (loc: CompanyLocation) => loc.is_active !== false
          );
        } else if (Array.isArray(locationsResponse.data)) {
          locationsData = locationsResponse.data.filter(
            (loc: CompanyLocation) => loc.is_active !== false
          );
        } else if (locationsResponse.data?.data) {
          locationsData = Array.isArray(locationsResponse.data.data) 
            ? locationsResponse.data.data.filter((loc: CompanyLocation) => loc.is_active !== false)
            : [];
        }
        
        setLocations(locationsData);
        
        // Set default location if available
        if (locationsData.length > 0) {
          setSelectedLocationId(locationsData[0]._id);
        }
      } catch (locationError) {
        console.error('Error fetching locations:', locationError);
        try {
          const companyResponse = await companiesAPI.getMyCompany();
          if (companyResponse.data?.locations) {
            const activeLocations = companyResponse.data.locations.filter(
              (loc: CompanyLocation) => loc.is_active !== false
            );
            setLocations(activeLocations);
          }
        } catch (companyError) {
          console.error('Company endpoint failed:', companyError);
        }
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
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getDayOfWeek = (dateStr: string): string => {
    try {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const date = new Date(dateStr);
      return days[date.getDay()];
    } catch (error) {
      return 'monday';
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

  const getShiftType = (startTime: string, endTime: string) => {
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    
    if (startHour >= 6 && startHour < 12) return 'morning';
    if (startHour >= 12 && startHour < 17) return 'afternoon';
    if (startHour >= 17 || startHour < 6) return 'evening';
    return 'day';
  };

  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case 'morning': return '#F59E0B';
      case 'afternoon': return '#3B82F6';
      case 'evening': return '#8B5CF6';
      default: return '#10B981';
    }
  };

  const getShiftIcon = (shiftType: string) => {
    switch (shiftType) {
      case 'morning': return Sun;
      case 'afternoon': return Activity;
      case 'evening': return Moon;
      default: return Clock;
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
    const errors: string[] = [];
    
    if (!selectedRole) {
      errors.push('Please select a role');
    }
    
    if (!selectedShift) {
      errors.push('Please select a shift pattern');
    }
    
    if (!selectedDate) {
      errors.push('Please select a date');
    }
    
    if (!selectedLocationId) {
      errors.push('Please select a location');
    }
    
    if (selectedRole && selectedShift) {
      const requiredStaff = selectedShift.required_staff || 1;
      if (selectedStaffIds.length !== requiredStaff) {
        errors.push(`This shift requires exactly ${requiredStaff} staff member(s)`);
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Calculate actual shift time based on selected date
  const calculateShiftTimes = (shift: RoleShift, dateStr: string) => {
    const startTime = shift.start_time;
    const endTime = shift.end_time;
    
    const isOvernight = shift.start_day !== shift.end_day;
    const shiftDay = shift.start_day.toLowerCase();
    
    const shiftDate = new Date(dateStr);
    const selectedDay = getDayOfWeek(dateStr);
    const dayMapping: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6
    };
    
    const selectedDayIndex = dayMapping[selectedDay];
    const shiftDayIndex = dayMapping[shiftDay];
    const dayOffset = (shiftDayIndex - selectedDayIndex + 7) % 7;
    
    shiftDate.setDate(shiftDate.getDate() + dayOffset);
    
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
      isOvernight,
      displayStart: startDateTime,
      displayEnd: endDateTime
    };
  };

  // Add shift to creation queue
  const addShiftToQueue = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please complete all required fields correctly');
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

    const shiftToCreate: ShiftToCreate = {
      role: selectedRole!,
      shift: selectedShift!,
      date: selectedDate,
      staffMembers: selectedStaff,
      location,
      notes: customNotes
    };

    // Check if this exact shift already exists in queue
    const existingIndex = shiftsToCreate.findIndex(s => 
      s.role._id === shiftToCreate.role._id &&
      s.shift._id === shiftToCreate.shift._id &&
      s.date === shiftToCreate.date &&
      JSON.stringify(s.staffMembers.map(m => m._id).sort()) === 
      JSON.stringify(shiftToCreate.staffMembers.map(m => m._id).sort())
    );

    if (existingIndex === -1) {
      setShiftsToCreate(prev => [...prev, shiftToCreate]);
      // Clear form for next shift
      setSelectedShiftIndex(-1);
      setSelectedStaffIds([]);
      setCustomNotes('');
      
      Alert.alert('Success', 'Shift added to queue! Add more shifts or create them all.');
    }
    
    setValidationErrors([]);
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
      
      for (const [index, shiftData] of shiftsToCreate.entries()) {
        const { startDateTime, endDateTime } = calculateShiftTimes(
          shiftData.shift, 
          shiftData.date
        );
        
        // Check if shift is in the future
        if (new Date(startDateTime) < new Date()) {
          errors.push(`Shift ${index + 1}: Cannot create shift in the past`);
          continue;
        }
        
        // Create shift for each staff member
        for (const staffMember of shiftData.staffMembers) {
          try {
            const shiftPayload: any = {
              title: `${shiftData.role.title}: ${shiftData.shift.name}`,
              description: shiftData.notes || shiftData.shift.tasks?.map(t => t.task).join('\n'),
              start_time: startDateTime,
              end_time: endDateTime,
              user_id: staffMember._id,
              company_id: user.company_id,
              location: shiftData.location.name,
              location_coordinates: {
                latitude: shiftData.location.latitude,
                longitude: shiftData.location.longitude,
              },
              location_address: shiftData.location.address,
              type: 'assigned',
              status: 'scheduled',
              role_id: shiftData.role._id,
              role_shift_id: shiftData.shift._id,
            };
            
            await createShift(shiftPayload);
            results.push({
              success: true,
              staffName: `${staffMember.first_name} ${staffMember.last_name}`,
              date: formatDateDisplay(shiftData.date),
              time: `${formatTimeDisplay(shiftData.shift.start_time)} - ${formatTimeDisplay(shiftData.shift.end_time)}`
            });
          } catch (error: any) {
            errors.push(`Shift ${index + 1} for ${staffMember.first_name}: ${error.message}`);
          }
        }
      }
      
      if (errors.length > 0) {
        Alert.alert(
          'Partial Success', 
          `Created ${results.length} shifts successfully. ${errors.length} failed:\n\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n... and ${errors.length - 3} more` : ''}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Success', 
          `Created ${results.length} shifts successfully`,
          [{ text: 'OK', onPress: () => {
            router.back();
            // You might want to refresh the rota data here
          }}]
        );
      }
      
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

  const handleIOSDateConfirm = () => {
    const newDate = formatDateForInput(datePickerValue);
    setSelectedDate(newDate);
    closeIOSDatePicker();
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

  // Redirect to role creation if no roles
  const handleNoRoles = () => {
    Alert.alert(
      'No Roles Found',
      'You need to create roles first before creating shifts. Would you like to create a role now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Role', 
          onPress: () => {
            router.push('/pages/role-form');
          }
        }
      ]
    );
  };

  // Render role item
  const renderRoleItem = ({ item }: { item: Role }) => (
    <TouchableOpacity
      style={[
        styles.roleItem,
        selectedRoleId === item._id && styles.roleItemSelected
      ]}
      onPress={() => {
        setSelectedRoleId(item._id);
        setSelectedShiftIndex(-1);
        setSelectedStaffIds([]);
        setShowRoleList(false);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.roleItemContent}>
        <View style={styles.roleHeader}>
          <View style={styles.roleTitleContainer}>
            <Briefcase size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={[
              styles.roleTitle,
              selectedRoleId === item._id && styles.roleTitleSelected
            ]}>
              {item.title}
            </Text>
          </View>
          <View style={styles.roleBadges}>
            <View style={styles.roleBadge}>
              <Users size={12} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.roleBadgeText}>
                {item.qualified_users?.length || 0}
              </Text>
            </View>
            <View style={styles.roleBadge}>
              <Clock size={12} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.roleBadgeText}>
                {item.shifts?.filter(s => s.is_active).length || 0}
              </Text>
            </View>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.roleDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render shift pattern as a grid item
  const renderShiftPatternItem = ({ item, index }: { item: RoleShift; index: number }) => {
    const isSelected = selectedShiftIndex === index;
    const shiftType = getShiftType(item.start_time, item.end_time);
    const ShiftIcon = getShiftIcon(shiftType);
    const shiftColor = getShiftColor(shiftType);
    const isOvernight = item.start_day !== item.end_day;
    
    return (
      <TouchableOpacity
        style={[
          styles.shiftPatternItem,
          isSelected && styles.shiftPatternItemSelected
        ]}
        onPress={() => {
          setSelectedShiftIndex(index);
          setSelectedStaffIds([]);
          setShowShiftPatternList(false);
        }}
        activeOpacity={0.7}
      >
        <View style={[
          styles.shiftPatternIconContainer,
          { backgroundColor: isSelected ? shiftColor : 'transparent' }
        ]}>
          <ShiftIcon 
            size={20} 
            color={isSelected ? '#FFFFFF' : shiftColor} 
          />
        </View>
        
        <View style={styles.shiftPatternContent}>
          <View style={styles.shiftPatternHeader}>
            <Text style={[
              styles.shiftPatternName,
              isSelected && styles.shiftPatternNameSelected
            ]}>
              {item.name}
            </Text>
            {isOvernight && (
              <View style={styles.overnightBadge}>
                <Clock size={10} color="#8B5CF6" />
                <Text style={styles.overnightText}>Overnight</Text>
              </View>
            )}
          </View>
          
          <View style={styles.shiftPatternDetails}>
            <View style={styles.shiftPatternTime}>
              <Clock size={12} color={isSelected ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
              <Text style={[
                styles.shiftPatternTimeText,
                isSelected && styles.shiftPatternTimeTextSelected
              ]}>
                {formatTimeDisplay(item.start_time)} - {formatTimeDisplay(item.end_time)}
              </Text>
            </View>
            
            <View style={styles.shiftPatternInfo}>
              <Users size={12} color={isSelected ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
              <Text style={[
                styles.shiftPatternInfoText,
                isSelected && styles.shiftPatternInfoTextSelected
              ]}>
                {item.required_staff} staff
              </Text>
            </View>
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.shiftPatternSelectedCheck}>
            <Check size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render staff selection chips
  const renderStaffChips = () => {
    if (qualifiedStaff.length === 0) {
      return (
        <View style={styles.noStaffContainer}>
          <Users size={24} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
          <Text style={styles.noStaffText}>
            No qualified staff for this role
          </Text>
          <Text style={styles.noStaffSubtext}>
            Add staff to this role in the role settings
          </Text>
        </View>
      );
    }

    const requiredStaff = selectedShift?.required_staff || 1;

    return (
      <View style={styles.staffChipsContainer}>
        <View style={styles.staffHeader}>
          <Text style={styles.staffHeaderText}>
            Select {requiredStaff} staff member{requiredStaff !== 1 ? 's' : ''}:
          </Text>
          <Text style={styles.staffCountText}>
            {selectedStaffIds.length}/{requiredStaff}
          </Text>
        </View>
        
        <View style={styles.staffChipsGrid}>
          {qualifiedStaff.map(staff => {
            const isSelected = selectedStaffIds.includes(staff._id);
            const isMaxSelected = selectedStaffIds.length >= requiredStaff && !isSelected;
            
            return (
              <TouchableOpacity
                key={staff._id}
                style={[
                  styles.staffChip,
                  isSelected && styles.staffChipSelected,
                  isMaxSelected && styles.staffChipDisabled
                ]}
                onPress={() => !isMaxSelected && handleStaffSelection(staff._id)}
                disabled={isMaxSelected}
                activeOpacity={0.7}
              >
                <View style={styles.staffChipContent}>
                  <View style={[
                    styles.staffChipIcon,
                    isSelected && styles.staffChipIconSelected
                  ]}>
                    {isSelected ? (
                      <Check size={16} color="#FFFFFF" />
                    ) : (
                      <User size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    )}
                  </View>
                  <View style={styles.staffChipInfo}>
                    <Text style={[
                      styles.staffChipName,
                      isSelected && styles.staffChipNameSelected,
                      isMaxSelected && styles.staffChipNameDisabled
                    ]} numberOfLines={1}>
                      {staff.first_name} {staff.last_name}
                      {staff._id === user?._id && ' (You)'}
                    </Text>
                    {staff.position && (
                      <Text style={[
                        styles.staffChipPosition,
                        isSelected && styles.staffChipPositionSelected,
                        isMaxSelected && styles.staffChipPositionDisabled
                      ]}>
                        {staff.position}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Create Shifts from Role',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <ArrowLeft size={24} color={isDark ? '#F9FAFB' : '#111827'} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          },
          headerTitleStyle: {
            color: isDark ? '#F9FAFB' : '#111827',
          },
        }}
      />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Instruction Header */}
              <View style={styles.instructionCard}>
                <Layers size={24} color="#3B82F6" />
                <View style={styles.instructionContent}>
                  <Text style={styles.instructionTitle}>Create Shifts from Role</Text>
                  <Text style={styles.instructionText}>
                    Select a role, choose shift patterns, assign staff, and create multiple shifts at once.
                  </Text>
                </View>
              </View>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <View style={styles.validationErrorContainer}>
                  <AlertTriangle size={18} color="#EF4444" />
                  <View style={styles.validationErrorContent}>
                    <Text style={styles.validationErrorTitle}>Please fix the following:</Text>
                    {validationErrors.map((error, index) => (
                      <Text key={index} style={styles.validationErrorText}>• {error}</Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Form Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Create New Shift</Text>

                {/* Role Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Role *</Text>
                  <TouchableOpacity 
                    style={styles.selector}
                    onPress={() => {
                      if (roles.length === 0) {
                        handleNoRoles();
                      } else {
                        setShowRoleList(!showRoleList);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.selectorContent}>
                      <View style={styles.inputWithIcon}>
                        <Briefcase size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        <Text style={[
                          styles.selectorText,
                          !selectedRoleId && styles.placeholderText
                        ]}>
                          {selectedRole ? selectedRole.title : 
                          roles.length === 0 ? 'Create roles first' : 'Select a role'}
                        </Text>
                      </View>
                      {roles.length > 0 && (
                        showRoleList ? (
                          <ChevronUp size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        ) : (
                          <ChevronDown size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        )
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Role List */}
                  {showRoleList && roles.length > 0 && (
                    <View style={styles.dropdownWrapper}>
                      <FlatList
                        data={roles}
                        renderItem={renderRoleItem}
                        keyExtractor={(item) => item._id}
                        style={styles.dropdownList}
                        nestedScrollEnabled={true}
                        scrollEnabled={true}
                        initialNumToRender={5}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                      />
                    </View>
                  )}
                </View>

                {/* Selected Role Details */}
                {selectedRole && (
                  <View style={styles.roleDetailsCard}>
                    <View style={styles.roleDetailsHeader}>
                      <Briefcase size={20} color="#3B82F6" />
                      <Text style={styles.roleDetailsTitle}>{selectedRole.title}</Text>
                    </View>
                    
                    {selectedRole.description && (
                      <Text style={styles.roleDetailsDescription}>
                        {selectedRole.description}
                      </Text>
                    )}
                    
                    <View style={styles.roleDetailsStats}>
                      <View style={styles.statItem}>
                        <Users size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        <Text style={styles.statText}>
                          {selectedRole.qualified_users?.length || 0} qualified staff
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Clock size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        <Text style={styles.statText}>
                          {availableShifts.length} shift patterns
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Shift Pattern Selection */}
                {selectedRole && availableShifts.length > 0 && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Select Shift Pattern *</Text>
                    <TouchableOpacity 
                      style={styles.shiftPatternSelector}
                      onPress={() => setShowShiftPatternList(!showShiftPatternList)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.selectorContent}>
                        <View style={styles.inputWithIcon}>
                          <Clock size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                          <Text style={[
                            styles.selectorText,
                            !selectedShift && styles.placeholderText
                          ]}>
                            {selectedShift ? selectedShift.name : 'Select shift pattern'}
                          </Text>
                        </View>
                        {showShiftPatternList ? (
                          <ChevronUp size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        ) : (
                          <ChevronDown size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Shift Pattern List - Shows as grid when expanded */}
                    {showShiftPatternList && (
                      <View style={styles.shiftPatternsGrid}>
                        <FlatList
                          data={availableShifts}
                          renderItem={renderShiftPatternItem}
                          keyExtractor={(item: RoleShift) => item._id || `shift-${Math.random()}`}
                          numColumns={2}
                          scrollEnabled={false}
                          contentContainerStyle={styles.shiftPatternsGridContent}
                          columnWrapperStyle={styles.shiftPatternsColumn}
                        />
                      </View>
                    )}

                    {/* Selected Shift Details */}
                    {selectedShift && !showShiftPatternList && (
                      <View style={styles.selectedShiftCard}>
                        <View style={styles.selectedShiftHeader}>
                          <View style={styles.selectedShiftTitleContainer}>
                            <Clock size={16} color="#3B82F6" />
                            <Text style={styles.selectedShiftName}>{selectedShift.name}</Text>
                          </View>
                          <TouchableOpacity 
                            onPress={() => setShowShiftPatternList(true)}
                            style={styles.changeShiftButton}
                          >
                            <Text style={styles.changeShiftButtonText}>Change</Text>
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.selectedShiftDetails}>
                          <View style={styles.selectedShiftDetail}>
                            <Clock size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                            <Text style={styles.selectedShiftDetailText}>
                              {selectedShift.start_day.charAt(0).toUpperCase() + selectedShift.start_day.slice(1)} {formatTimeDisplay(selectedShift.start_time)} - {formatTimeDisplay(selectedShift.end_time)}
                              {selectedShift.start_day !== selectedShift.end_day && ' (Overnight)'}
                            </Text>
                          </View>
                          
                          <View style={styles.selectedShiftDetail}>
                            <Users size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                            <Text style={styles.selectedShiftDetailText}>
                              Required: {selectedShift.required_staff} staff
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Qualified Staff Selection */}
                {selectedRole && selectedShift && qualifiedStaff.length > 0 && (
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Assign Qualified Staff *</Text>
                    </View>
                    {renderStaffChips()}
                  </View>
                )}

                {/* Location Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Location *</Text>
                  <TouchableOpacity 
                    style={styles.selector}
                    onPress={() => setShowLocationList(!showLocationList)}
                    disabled={locations.length === 0}
                    activeOpacity={0.7}
                  >
                    <View style={styles.selectorContent}>
                      <View style={styles.inputWithIcon}>
                        <MapPin size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        <Text style={[
                          styles.selectorText,
                          !selectedLocationId && styles.placeholderText
                        ]}>
                          {selectedLocationId 
                            ? locations.find(l => l._id === selectedLocationId)?.name 
                            : locations.length === 0 ? 'No locations available' : 'Select location'
                          }
                        </Text>
                      </View>
                      {locations.length > 0 && (
                        showLocationList ? (
                          <ChevronUp size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        ) : (
                          <ChevronDown size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        )
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Location List */}
                  {showLocationList && locations.length > 0 && (
                    <View style={styles.dropdownWrapper}>
                      <FlatList
                        data={locations}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.dropdownItem,
                              selectedLocationId === item._id && styles.dropdownItemSelected
                            ]}
                            onPress={() => {
                              setSelectedLocationId(item._id);
                              setShowLocationList(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.locationItem}>
                              <Text style={[
                                styles.dropdownItemText,
                                selectedLocationId === item._id && styles.dropdownItemTextSelected
                              ]}>
                                {item.name}
                              </Text>
                              {item.address && (
                                <Text style={[
                                  styles.locationAddress,
                                  selectedLocationId === item._id && styles.locationAddressSelected
                                ]}>
                                  {item.address}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item._id}
                        style={styles.dropdownList}
                        nestedScrollEnabled={true}
                        scrollEnabled={true}
                      />
                    </View>
                  )}
                </View>

                {/* Date Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date *</Text>
                  <TouchableOpacity 
                    style={styles.dateSelector}
                    onPress={openDatePicker}
                    activeOpacity={0.7}
                  >
                    <View style={styles.selectorContent}>
                      <View style={styles.inputWithIcon}>
                        <CalendarIcon size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                        <Text style={[
                          styles.selectorText,
                          !selectedDate && styles.placeholderText
                        ]}>
                          {selectedDate ? formatDateDisplay(selectedDate) : 'Select date'}
                        </Text>
                      </View>
                      <ChevronDown size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Custom Notes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Shift Notes (Optional)</Text>
                  <TextInput
                    ref={textInputRef}
                    style={[styles.input, styles.textArea]}
                    value={customNotes}
                    onChangeText={setCustomNotes}
                    placeholder="Add any additional notes for this shift..."
                    placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>

                {/* Add to Queue Button */}
                {selectedRole && selectedShift && selectedDate && selectedLocationId && (
                  <TouchableOpacity 
                    style={styles.addToQueueButton}
                    onPress={addShiftToQueue}
                    activeOpacity={0.8}
                  >
                    <Plus size={20} color="#FFFFFF" />
                    <Text style={styles.addToQueueButtonText}>Add Shift to Queue</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Shifts Queue Section */}
              {shiftsToCreate.length > 0 && (
                <View style={styles.queueSection}>
                  <View style={styles.queueHeader}>
                    <Text style={styles.queueTitle}>
                      Shifts Queue ({shiftsToCreate.reduce((total, shift) => total + shift.staffMembers.length, 0)})
                    </Text>
                    <TouchableOpacity onPress={() => setShiftsToCreate([])}>
                      <Text style={styles.clearQueueText}>Clear All</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.queueList}>
                    {shiftsToCreate.map((item, shiftIndex) => {
                      const { displayStart, displayEnd } = calculateShiftTimes(item.shift, item.date);
                      
                      return item.staffMembers.map((staff, staffIndex) => (
                        <View key={`${item.date}-${shiftIndex}-${staff._id}`} style={styles.queueItem}>
                          <View style={styles.queueItemHeader}>
                            <View style={styles.queueItemInfo}>
                              <Text style={styles.queueItemRole}>{item.role.title}</Text>
                              <Text style={styles.queueItemShift}>{item.shift.name}</Text>
                              <Text style={styles.queueItemStaff}>
                                👤 {staff.first_name} {staff.last_name}
                                {staff._id === user?._id && ' (You)'}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => {
                                const updatedShifts = [...shiftsToCreate];
                                updatedShifts[shiftIndex].staffMembers = 
                                  updatedShifts[shiftIndex].staffMembers.filter(s => s._id !== staff._id);
                                
                                if (updatedShifts[shiftIndex].staffMembers.length === 0) {
                                  updatedShifts.splice(shiftIndex, 1);
                                }
                                
                                setShiftsToCreate(updatedShifts);
                              }}
                            >
                              <Trash2 size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                          
                          <View style={styles.queueItemDetails}>
                            <Text style={styles.queueItemDetail}>
                              📅 {formatDateDisplay(item.date)}
                            </Text>
                            <Text style={styles.queueItemDetail}>
                              🕐 {displayStart ? formatTimeDisplay(displayStart.toTimeString().slice(0, 5)) : 'N/A'} - {displayEnd ? formatTimeDisplay(displayEnd.toTimeString().slice(0, 5)) : 'N/A'}
                            </Text>
                            <Text style={styles.queueItemDetail}>
                              📍 {item.location.name}
                            </Text>
                          </View>
                        </View>
                      ));
                    })}
                  </View>
                </View>
              )}
              
              {/* Extra padding for keyboard */}
              <View style={styles.keyboardSpacer} />
            </ScrollView>

            {/* Fixed Footer with Create Button */}
            {shiftsToCreate.length > 0 && (
              <View style={styles.footer}>
                <TouchableOpacity 
                  onPress={createShifts} 
                  style={[
                    styles.createButton,
                    submitting && styles.createButtonDisabled
                  ]}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createButtonText}>
                      Create {shiftsToCreate.reduce((total, shift) => total + shift.staffMembers.length, 0)} Shift{shiftsToCreate.reduce((total, shift) => total + shift.staffMembers.length, 0) !== 1 ? 's' : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={new Date(selectedDate || new Date())}
          mode="date"
          display="default"
          onChange={handleDateConfirm}
          minimumDate={new Date()}
        />
      )}
      
      {renderIOSDatePickerModal()}
    </SafeAreaView>
  );
}

const createStyles = (theme: string) => {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingBottom: 120, // Space for footer
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
    headerBackButton: {
      padding: 8,
      marginLeft: -8,
    },
    instructionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    instructionContent: {
      flex: 1,
      marginLeft: 12,
    },
    instructionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    instructionText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      lineHeight: 20,
    },
    formSection: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 20,
    },
    validationErrorContainer: {
      backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2',
      borderRadius: 8,
      padding: 12,
      marginHorizontal: 20,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      borderWidth: 1,
      borderColor: isDark ? '#FCA5A5' : '#FEE2E2',
    },
    validationErrorContent: {
      flex: 1,
    },
    validationErrorTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#FCA5A5' : '#DC2626',
      marginBottom: 4,
    },
    validationErrorText: {
      fontSize: 12,
      color: isDark ? '#FCA5A5' : '#DC2626',
      lineHeight: 16,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    staffCountText: {
      fontSize: 14,
      color: isDark ? '#60A5FA' : '#3B82F6',
      fontWeight: '500',
    },
    input: {
      backgroundColor: isDark ? '#2D3748' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderRadius: 8,
      padding: 12,
      color: isDark ? '#F9FAFB' : '#111827',
      fontSize: 16,
    },
    textArea: {
      minHeight: 100,
      maxHeight: 150,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    placeholderText: {
      color: isDark ? '#6B7280' : '#9CA3AF',
    },
    selector: {
      backgroundColor: isDark ? '#2D3748' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderRadius: 8,
      padding: 12,
    },
    shiftPatternSelector: {
      backgroundColor: isDark ? '#2D3748' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderRadius: 8,
      padding: 12,
    },
    dateSelector: {
      backgroundColor: isDark ? '#2D3748' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderRadius: 8,
      padding: 12,
    },
    selectorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectorText: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    // Shift Pattern Grid
    shiftPatternsGrid: {
      marginTop: 8,
    },
    shiftPatternsGridContent: {
      padding: 4,
    },
    shiftPatternsColumn: {
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    shiftPatternItem: {
      flex: 1,
      backgroundColor: isDark ? '#2D3748' : '#FFFFFF',
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 4,
      borderWidth: 2,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      minHeight: 100,
      position: 'relative',
    },
    shiftPatternItemSelected: {
      backgroundColor: isDark ? '#1E3A8A' : '#1D4ED8',
      borderColor: isDark ? '#3B82F6' : '#2563EB',
    },
    shiftPatternIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    shiftPatternContent: {
      flex: 1,
    },
    shiftPatternHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    shiftPatternName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    shiftPatternNameSelected: {
      color: '#FFFFFF',
    },
    overnightBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? '#3730A3' : '#EEF2FF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 12,
      marginLeft: 4,
    },
    overnightText: {
      fontSize: 10,
      color: '#8B5CF6',
      fontWeight: '500',
    },
    shiftPatternDetails: {
      gap: 4,
    },
    shiftPatternTime: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    shiftPatternTimeText: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    shiftPatternTimeTextSelected: {
      color: '#E5E7EB',
    },
    shiftPatternInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    shiftPatternInfoText: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    shiftPatternInfoTextSelected: {
      color: '#E5E7EB',
    },
    shiftPatternSelectedCheck: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#10B981',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    // Selected Shift Card
    selectedShiftCard: {
      marginTop: 12,
      backgroundColor: isDark ? '#2D3748' : '#F9FAFB',
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    selectedShiftHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    selectedShiftTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    selectedShiftName: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    changeShiftButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 6,
    },
    changeShiftButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#60A5FA' : '#3B82F6',
    },
    selectedShiftDetails: {
      gap: 8,
    },
    selectedShiftDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    selectedShiftDetailText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    // Add to Queue Button
    addToQueueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#10B981',
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
    },
    addToQueueButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // Dropdown Styles
    dropdownWrapper: {
      marginTop: 8,
      backgroundColor: isDark ? '#2D3748' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderRadius: 8,
      maxHeight: 300,
    },
    dropdownList: {
      maxHeight: 300,
    },
    dropdownItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    dropdownItemSelected: {
      backgroundColor: isDark ? '#2563EB' : '#3B82F6',
    },
    dropdownItemText: {
      fontSize: 14,
      color: isDark ? '#F9FAFB' : '#374151',
    },
    dropdownItemTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    locationItem: {
      flex: 1,
    },
    locationAddress: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 2,
    },
    locationAddressSelected: {
      color: '#E5E7EB',
    },
    // Role Item Styles
    roleItem: {
      padding: 8,
    },
    roleItemSelected: {
      backgroundColor: isDark ? '#2563EB' : '#3B82F6',
      borderRadius: 6,
    },
    roleItemContent: {
      flex: 1,
    },
    roleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    roleTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    roleTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    roleTitleSelected: {
      color: '#FFFFFF',
    },
    roleBadges: {
      flexDirection: 'row',
      gap: 8,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    roleBadgeText: {
      fontSize: 11,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '600',
    },
    roleDescription: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      lineHeight: 16,
    },
    // Role Details Card
    roleDetailsCard: {
      backgroundColor: isDark ? '#2D3748' : '#F9FAFB',
      borderRadius: 8,
      padding: 16,
      marginTop: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    roleDetailsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    roleDetailsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    roleDetailsDescription: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 12,
      lineHeight: 20,
    },
    roleDetailsStats: {
      flexDirection: 'row',
      gap: 16,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statText: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    // Staff Selection Styles
    noStaffContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: isDark ? '#2D3748' : '#F9FAFB',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    noStaffText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginTop: 12,
      marginBottom: 4,
    },
    noStaffSubtext: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
      textAlign: 'center',
    },
    staffChipsContainer: {
      marginTop: 8,
    },
    staffHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    staffHeaderText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    staffChipsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    staffChip: {
      width: '48%',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    staffChipSelected: {
      backgroundColor: isDark ? '#065F46' : '#D1FAE5',
      borderColor: '#10B981',
    },
    staffChipDisabled: {
      opacity: 0.5,
    },
    staffChipContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    staffChipIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#4B5563' : '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    staffChipIconSelected: {
      backgroundColor: '#10B981',
    },
    staffChipInfo: {
      flex: 1,
    },
    staffChipName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 2,
    },
    staffChipNameSelected: {
      color: isDark ? '#10B981' : '#065F46',
    },
    staffChipNameDisabled: {
      color: isDark ? '#6B7280' : '#9CA3AF',
    },
    staffChipPosition: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    staffChipPositionSelected: {
      color: isDark ? '#10B981' : '#065F46',
    },
    staffChipPositionDisabled: {
      color: isDark ? '#6B7280' : '#9CA3AF',
    },
    // Queue Section
    queueSection: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    queueHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    queueTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    clearQueueText: {
      fontSize: 14,
      color: '#EF4444',
      fontWeight: '600',
    },
    queueList: {
      gap: 12,
    },
    queueItem: {
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    queueItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
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
      marginTop: 4,
    },
    removeButton: {
      padding: 4,
    },
    queueItemDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    queueItemDetail: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
    },
    // Footer
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    createButton: {
      padding: 18,
      backgroundColor: '#3B82F6',
      borderRadius: 12,
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
    keyboardSpacer: {
      height: 100,
    },
    // iOS Date Picker Styles
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