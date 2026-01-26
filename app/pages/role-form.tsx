// role-form.tsx
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Switch, 
  Modal, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; // Add this import
import { rolesAPI, staffAPI, companiesAPI } from '@/services/api';
import { ArrowLeft, Plus, Trash2, Users, Clock, MapPin, Calendar, Clock4, Briefcase } from 'lucide-react-native';
import { Role, RoleShift } from '../types/roles';
import { StaffModal } from '@/components/modals/StaffModal';
import { LocationModal } from '@/components/modals/LocationModal';
import { ShiftModal } from '@/components/modals/ShiftModal';
import { DaysModal } from '@/components/modals/DaysModal';
import { TimeModal } from '@/components/modals/TimeModal';

// Define staff member interface
interface StaffMember {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  id?: string;
  firstName?: string;
  lastName?: string;
}

// Define location interface
interface Location {
  _id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  is_active?: boolean;
}

// Days of week for selection
const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function RoleForm() {
  const { theme } = useTheme();
  const { user } = useAuth(); // Get user from auth context
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const styles = createStyles(theme);

  // Main form state
  const [form, setForm] = useState<{
    title: string;
    description: string;
    is_active: boolean;
    default_break_minutes: string;
    position: string;
    shifts: RoleShift[];
    qualified_users: string[];
  }>({
    title: '',
    description: '',
    is_active: true,
    default_break_minutes: '0',
    position: '0',
    shifts: [],
    qualified_users: [],
  });

  // Modal state
  const [activeModal, setActiveModal] = useState<
    'none' | 'staff' | 'location' | 'shift' | 'days' | 'startTime' | 'endTime'
  >('none');

  // Data states
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingCompany, setCheckingCompany] = useState(true);

  // Shift form state
  const [currentShift, setCurrentShift] = useState<Partial<RoleShift> & { index?: number }>({
    name: '',
    start_day: 'monday',
    end_day: 'monday',
    start_time: '09:00',
    end_time: '17:00',
    location_id: '',
    required_staff: 1,
    tasks: [],
    is_active: true,
  });

  // Track selected days for the current shift
  const [selectedDaysForShift, setSelectedDaysForShift] = useState<string[]>(['monday']);

  // Refs for tracking modal state
  const isModalOpen = useRef(false);

  // Check company on component mount
  useEffect(() => {
    const checkCompanyExists = async () => {
      if (!user?.company_id) {
        console.log('No company_id found in user data, redirecting to company setup');
        Alert.alert(
          'Company Setup Required',
          'You need to set up a company before creating roles.',
          [
            {
              text: 'Set Up Company',
              onPress: () => {
                router.replace('/forms/company-setup');
              }
            }
          ],
          { cancelable: false }
        );
        setCheckingCompany(false);
        return false;
      }

      try {
        // Verify company actually exists
        const companyResponse = await companiesAPI.getMyCompany();
        
        if (!companyResponse.data) {
          Alert.alert(
            'Company Not Found',
            'Your company setup seems incomplete. Please set up your company first.',
            [
              {
                text: 'Set Up Company',
                onPress: () => {
                  router.replace('/forms/company-setup');
                }
              }
            ],
            { cancelable: false }
          );
          return false;
        }
        
        console.log('Company verified:', companyResponse.data.name);
        return true;
      } catch (error: any) {
        console.error('Error verifying company:', error);
        
        if (error.response?.status === 404 || error.message?.includes('company')) {
          Alert.alert(
            'Company Setup Required',
            'Please set up your company to create roles.',
            [
              {
                text: 'Set Up Company',
                onPress: () => {
                  router.replace('/forms/company-setup');
                }
              }
            ],
            { cancelable: false }
          );
        }
        return false;
      }
    };

    const init = async () => {
      const hasCompany = await checkCompanyExists();
      setCheckingCompany(false);
      
      if (hasCompany) {
        // Only load data if company exists
        if (isEdit && id) {
          loadRole();
        }
        loadStaffAndLocations();
      }
    };

    init();
  }, [id, user]);

  // Close all modals
  const closeAllModals = () => {
    setActiveModal('none');
    isModalOpen.current = false;
  };

  // Open modal with safety check
  const openModal = (modalType: 'staff' | 'location' | 'shift' | 'days' | 'startTime' | 'endTime') => {
    if (isModalOpen.current) {
      closeAllModals();
    }
    setTimeout(() => {
      setActiveModal(modalType);
      isModalOpen.current = true;
    }, 100);
  };

  // Close modal
  const closeModal = () => {
    closeAllModals();
  };

  const loadRole = async () => {
    try {
      const response = await rolesAPI.getRoleWithDetails(id!);
      const role: Role = response.data;
      
      console.log('Role data loaded:', {
        roleId: role._id,
        qualifiedUsersCount: role.qualified_users?.length || 0,
        qualifiedUsers: role.qualified_users
      });
      
      // Handle qualified_users which might be IDs or populated objects
      let qualifiedUserIds: string[] = [];
      
      if (role.qualified_users && Array.isArray(role.qualified_users)) {
        qualifiedUserIds = role.qualified_users.map((user: any) => {
          // If it's a string (user ID), return it directly
          if (typeof user === 'string') {
            return user;
          }
          // If it's an object with _id, return the _id
          else if (user && typeof user === 'object' && user._id) {
            return user._id;
          }
          // If it's an object with id, return the id
          else if (user && typeof user === 'object' && user.id) {
            return user.id;
          }
          return '';
        }).filter((id: string) => id && typeof id === 'string');
      }
      
      console.log('Extracted user IDs:', qualifiedUserIds);
      
      setForm({
        title: role.title,
        description: role.description || '',
        is_active: role.is_active,
        default_break_minutes: role.default_break_minutes?.toString() || '0',
        position: role.position?.toString() || '0',
        shifts: role.shifts || [],
        qualified_users: qualifiedUserIds,
      });
      
    } catch (error) {
      console.error('Error loading role:', error);
      Alert.alert('Error', 'Failed to load role data');
      router.back();
    }
  };

const loadStaffAndLocations = async () => {
  try {
    setLoading(true);
    
    // Load staff
    try {
      const staffResponse = await staffAPI.getStaff();
      
      // Handle different response structures
      let staffData = [];
      
      if (staffResponse.data && Array.isArray(staffResponse.data)) {
        staffData = staffResponse.data;
      } else if (staffResponse.data && staffResponse.data.users && Array.isArray(staffResponse.data.users)) {
        staffData = staffResponse.data.users;
      } else if (staffResponse.data && staffResponse.data.data && Array.isArray(staffResponse.data.data)) {
        staffData = staffResponse.data.data;
      }
      
      console.log('Staff data loaded:', staffData.length, 'staff members');
      setStaffList(staffData);
      
      // Debug: Log the staff data structure
      if (staffData.length > 0) {
        console.log('First staff member:', JSON.stringify(staffData[0], null, 2));
      }
    } catch (staffError) {
      console.error('Error loading staff:', staffError);
      Alert.alert('Error', 'Failed to load staff members');
      setStaffList([]);
    }
    
    // Load locations - try different approaches for admin vs staff
    try {
      let locationsData: Location[] = [];
      
      // First try the regular locations endpoint (might work for admin)
      try {
        const locationsResponse = await companiesAPI.getLocations();
        console.log('Locations response:', locationsResponse);
        
        // Handle different response structures
        if (locationsResponse.data) {
          // Case 1: Direct array
          if (Array.isArray(locationsResponse.data)) {
            locationsData = locationsResponse.data;
          }
          // Case 2: Has locations property
          else if (locationsResponse.data.locations && Array.isArray(locationsResponse.data.locations)) {
            locationsData = locationsResponse.data.locations;
          }
          // Case 3: Has data property with array
          else if (locationsResponse.data.data && Array.isArray(locationsResponse.data.data)) {
            locationsData = locationsResponse.data.data;
          }
        }
        
        console.log('Locations loaded from API:', locationsData.length);
      } catch (apiError: any) {
        console.log('Direct locations API failed, trying alternatives:', apiError.message);
        
        // If 403 or no permission, try to get company info first
        if (apiError.response?.status === 403 || apiError.message.includes('Forbidden')) {
          try {
            const companyResponse = await companiesAPI.getMyCompany();
            
            if (companyResponse.data?.locations && Array.isArray(companyResponse.data.locations)) {
              locationsData = companyResponse.data.locations.filter((loc: any) => 
                loc && loc._id && loc.name && loc.is_active !== false
              );
              console.log('Locations loaded from company info:', locationsData.length);
            }
          } catch (companyError) {
            console.error('Failed to get company info:', companyError);
          }
        }
      }
      
      // Validate and set locations
      const validLocations = locationsData.filter(loc => 
        loc && 
        typeof loc === 'object' && 
        loc._id && 
        loc.name
      );
      
      console.log('Valid locations found:', validLocations.length);
      setLocations(validLocations);
      
    } catch (locationsError) {
      console.error('Error loading locations:', locationsError);
      setLocations([]);
    }
    
  } catch (error) {
    console.error('Error loading data:', error);
    Alert.alert('Error', 'Failed to load data');
  } finally {
    setLoading(false);
  }
};

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Please enter role title');
      return;
    }

    const breakMinutes = Number(form.default_break_minutes);
    if (isNaN(breakMinutes) || breakMinutes < 0) {
      Alert.alert('Error', 'Please enter valid break minutes');
      return;
    }

    const position = Number(form.position);
    if (isNaN(position) || position < 0) {
      Alert.alert('Error', 'Please enter valid position number');
      return;
    }

    // Validate shifts
    for (const shift of form.shifts) {
      if (!shift.name.trim()) {
        Alert.alert('Error', 'All shifts must have a name');
        return;
      }
      if (!shift.location_id) {
        Alert.alert('Error', 'All shifts must have a location');
        return;
      }
      if (shift.required_staff < 1) {
        Alert.alert('Error', 'Required staff must be at least 1');
        return;
      }
    }

    try {
      const roleData: any = {
        title: form.title,
        description: form.description || undefined,
        is_active: form.is_active,
        default_break_minutes: breakMinutes,
        position: position,
        shifts: form.shifts,
        qualified_users: form.qualified_users,
      };

      if (isEdit && id) {
        await rolesAPI.updateRole(id, roleData);
        Alert.alert('Success', 'Role updated successfully');
      } else {
        await rolesAPI.createRole(roleData);
        Alert.alert('Success', 'Role created successfully');
      }
      
      router.back();
    } catch (error) {
      console.error('Error saving role:', error);
      Alert.alert('Error', 'Failed to save role');
    }
  };

  // Staff selection functions
  const toggleStaffSelection = (staffId: string) => {
    setForm(prev => ({
      ...prev,
      qualified_users: prev.qualified_users.includes(staffId)
        ? prev.qualified_users.filter(id => id !== staffId)
        : [...prev.qualified_users, staffId]
    }));
  };

  const selectAllStaff = () => {
    setForm(prev => ({
      ...prev,
      qualified_users: staffList.map(staff => staff._id)
    }));
  };

  const clearAllStaff = () => {
    setForm(prev => ({
      ...prev,
      qualified_users: []
    }));
  };

  // Shift management functions
  const openAddShiftModal = () => {
    setCurrentShift({
      name: '',
      start_day: 'monday',
      end_day: 'monday',
      start_time: '09:00',
      end_time: '17:00',
      location_id: '',
      required_staff: 1,
      tasks: [],
      is_active: true,
    });
    setSelectedDaysForShift(['monday']);
    openModal('shift');
  };

  const openEditShiftModal = (shift: RoleShift, index: number) => {
    setCurrentShift({ ...shift, index });
    setSelectedDaysForShift([shift.start_day]);
    openModal('shift');
  };

  const saveShift = (selectedDays?: string[]) => {
    if (!currentShift.name?.trim()) {
      Alert.alert('Error', 'Please enter shift name');
      return;
    }
    if (!currentShift.location_id) {
      Alert.alert('Error', 'Please select a location');
      return;
    }
    if (!currentShift.required_staff || currentShift.required_staff < 1) {
      Alert.alert('Error', 'Required staff must be at least 1');
      return;
    }

    // If multiple days selected AND creating new shift (not editing), create multiple shifts
    if (selectedDays && selectedDays.length > 1 && currentShift.index === undefined) {
      // Create multiple shifts for each selected day
      const shiftsToSave: RoleShift[] = selectedDays.map((day, index) => {
        // Determine end day based on times
        let endDay = day;
        const startTime = currentShift.start_time!;
        const endTime = currentShift.end_time!;
        
        // Check if it's overnight
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        
        if (endHour < startHour || (endHour === startHour && currentShift.end_time! <= currentShift.start_time!)) {
          // It's overnight, end day is next day
          const dayIndex = DAYS_OF_WEEK.findIndex(d => d.value === day);
          const nextDayIndex = (dayIndex + 1) % 7;
          endDay = DAYS_OF_WEEK[nextDayIndex].value;
        }
        
        // Get day label for shift name
        const dayLabel = DAYS_OF_WEEK.find(d => d.value === day)?.label || day;
        
        return {
          _id: `shift_${Date.now()}_${day}_${index}`,
          name: `${currentShift.name} (${dayLabel})`,
          start_day: day,
          end_day: endDay,
          start_time: currentShift.start_time!,
          end_time: currentShift.end_time!,
          location_id: currentShift.location_id!,
          required_staff: currentShift.required_staff!,
          tasks: currentShift.tasks || [],
          is_active: currentShift.is_active !== false,
        };
      });

      // Add all new shifts to the form
      setForm(prev => ({
        ...prev,
        shifts: [...prev.shifts, ...shiftsToSave]
      }));

      // Show success message
      Alert.alert(
        'Success', 
        `Created ${selectedDays.length} shifts for selected days`,
        [{ text: 'OK', onPress: () => closeModal() }]
      );
    } else {
      // Single shift (either editing or single day creation)
      const dayToUse = selectedDays && selectedDays.length === 1 ? selectedDays[0] : currentShift.start_day!;
      
      // Determine if it's overnight
      let endDay = currentShift.end_day!;
      const startTime = currentShift.start_time!;
      const endTime = currentShift.end_time!;
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      
      if (endHour < startHour || (endHour === startHour && endTime <= startTime)) {
        // It's overnight, calculate end day
        const dayIndex = DAYS_OF_WEEK.findIndex(d => d.value === dayToUse);
        const nextDayIndex = (dayIndex + 1) % 7;
        endDay = DAYS_OF_WEEK[nextDayIndex].value;
      } else {
        // Not overnight, end day is same as start day
        endDay = dayToUse;
      }

      const shiftToSave: RoleShift = {
        _id: currentShift._id || `shift_${Date.now()}`,
        name: currentShift.name!,
        start_day: dayToUse,
        end_day: endDay,
        start_time: currentShift.start_time!,
        end_time: currentShift.end_time!,
        location_id: currentShift.location_id!,
        required_staff: currentShift.required_staff!,
        tasks: currentShift.tasks || [],
        is_active: currentShift.is_active !== false,
      };

      setForm(prev => {
        if (currentShift.index !== undefined) {
          // Update existing shift
          const newShifts = [...prev.shifts];
          newShifts[currentShift.index] = shiftToSave;
          return { ...prev, shifts: newShifts };
        } else {
          // Add new single shift
          return { ...prev, shifts: [...prev.shifts, shiftToSave] };
        }
      });

      closeModal();
    }
  };

  const removeShift = (index: number) => {
    Alert.alert(
      'Delete Shift',
      'Are you sure you want to delete this shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setForm(prev => ({
              ...prev,
              shifts: prev.shifts.filter((_, i) => i !== index)
            }));
          }
        }
      ]
    );
  };

  // Task management
  const addTask = () => {
    setCurrentShift(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), { task: '', completed: false }]
    }));
  };

  const updateTask = (index: number, value: string) => {
    setCurrentShift(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map((task, i) => 
        i === index ? { ...task, task: value } : task
      )
    }));
  };

  const removeTask = (index: number) => {
    setCurrentShift(prev => ({
      ...prev,
      tasks: (prev.tasks || []).filter((_, i) => i !== index)
    }));
  };

  // Days selection
  const handleDaysSave = (days: string[]) => {
    setSelectedDaysForShift(days);
    
    // If single day selected, update the shift's start day
    if (days.length === 1) {
      setCurrentShift(prev => ({
        ...prev,
        start_day: days[0]
      }));
    }
    
    openModal('shift');
  };

  // Time selection
  const handleStartTimeSave = (time: string) => {
    setCurrentShift(prev => ({
      ...prev,
      start_time: time
    }));
    openModal('shift');
  };

  const handleEndTimeSave = (time: string) => {
    setCurrentShift(prev => ({
      ...prev,
      end_time: time
    }));
    openModal('shift');
  };

  // Select location and return to shift modal
  const selectLocation = (locationId: string) => {
    setCurrentShift(prev => ({ ...prev, location_id: locationId }));
    openModal('shift');
  };

  // Helper functions
  const getStaffName = (staffId: string) => {
    console.log('Getting name for staff ID:', staffId);
    
    if (!staffId || typeof staffId !== 'string') {
      console.log('Invalid staff ID:', staffId);
      return 'Unknown';
    }
    
    // Find the staff member in the list
    const staff = staffList.find((s: StaffMember) => s._id === staffId);
    
    if (staff) {
      const name = `${staff.first_name || ''} ${staff.last_name || ''}`.trim();
      console.log('Found staff:', name);
      return name || 'Unknown';
    }
    
    console.log('Staff not found for ID:', staffId);
    return 'Unknown';
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find((l: Location) => l._id === locationId);
    return location ? location.name : 'Select location';
  };

  const isOvernightShift = (shift: RoleShift) => {
    return shift.start_day !== shift.end_day;
  };

  const calculateShiftDuration = (shift: RoleShift) => {
    const startHour = parseInt(shift.start_time.split(':')[0]);
    const startMinute = parseInt(shift.start_time.split(':')[1]);
    const endHour = parseInt(shift.end_time.split(':')[0]);
    const endMinute = parseInt(shift.end_time.split(':')[1]);
    
    let hours = endHour - startHour;
    let minutes = endMinute - startMinute;
    
    if (isOvernightShift(shift)) {
      hours += 24;
    }
    
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
    return `${hours}h ${minutes}m`;
  };

  // Debug function to check staff matching
  const checkStaffMatching = () => {
    console.log('=== STAFF MATCHING DEBUG ===');
    console.log('Form qualified users:', form.qualified_users);
    console.log('Staff list length:', staffList.length);
    
    form.qualified_users.forEach((staffId: string, index: number) => {
      const found = staffList.find((s: StaffMember) => s._id === staffId);
      console.log(`User ${index} (ID: ${staffId}):`, {
        found: !!found,
        name: found ? `${found.first_name} ${found.last_name}` : 'NOT FOUND',
        staffData: found
      });
    });
    
    console.log('=== END DEBUG ===');
  };

  // Call this when staff list loads
  useEffect(() => {
    if (staffList.length > 0 && form.qualified_users.length > 0) {
      checkStaffMatching();
    }
  }, [staffList, form.qualified_users]);

  // Show loading while checking company
  if (checkingCompany) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#3B82F6' : '#1E40AF'} />
        <Text style={styles.loadingText}>Checking company...</Text>
      </View>
    );
  }

  // Show company setup prompt if no company
  if (!user?.company_id) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEdit ? 'Edit Role' : 'Add New Role'}
          </Text>
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Briefcase size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>Company Setup Required</Text>
          <Text style={styles.emptySubtitle}>
            You need to set up your company before you can create or edit roles.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.replace('/forms/company-setup')}
          >
            <Plus size={18} color="#fff" />
            <Text style={styles.emptyButtonText}>Set Up Company</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show regular loading while loading form data
  if (loading && !checkingCompany) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#3B82F6' : '#1E40AF'} />
        <Text style={styles.loadingText}>Loading form data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEdit ? 'Edit Role' : 'Add New Role'}
        </Text>
      </View>

      <ScrollView style={styles.form}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role Title *</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(text) => setForm({...form, title: text})}
              placeholder="e.g., Manager, Cashier, Security Guard"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={form.description}
              onChangeText={(text) => setForm({...form, description: text})}
              placeholder="Role description and responsibilities"
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>Active Status</Text>
              <Switch
                value={form.is_active}
                onValueChange={(value) => setForm({...form, is_active: value})}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor={form.is_active ? '#fff' : '#fff'}
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Break Minutes</Text>
              <TextInput
                style={styles.input}
                value={form.default_break_minutes}
                onChangeText={(text) => setForm({...form, default_break_minutes: text})}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Position Order</Text>
              <TextInput
                style={styles.input}
                value={form.position}
                onChangeText={(text) => setForm({...form, position: text})}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {/* Qualified Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Qualified Users</Text>
            <TouchableOpacity 
              style={styles.manageStaffButton}
              onPress={() => openModal('staff')}
              activeOpacity={0.7}
            >
              <Users size={20} color="#3B82F6" />
              <Text style={styles.manageStaffText}>Select Staff</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.selectedStaff}>
            {form.qualified_users.length === 0 ? (
              <Text style={styles.noStaffText}>No staff selected</Text>
            ) : (
              <View style={styles.staffChips}>
                {form.qualified_users.slice(0, 3).map((staffId: string, index: number) => {
                  console.log(`Rendering staff chip ${index}:`, staffId);
                  return (
                    <View key={staffId} style={styles.staffChip}>
                      <Text style={styles.staffChipText}>{getStaffName(staffId)}</Text>
                    </View>
                  );
                })}
                {form.qualified_users.length > 3 && (
                  <View style={styles.moreStaffChip}>
                    <Text style={styles.moreStaffText}>
                      +{form.qualified_users.length - 3} more
                    </Text>
                  </View>
                )}
              </View>
            )}
            <Text style={styles.staffCount}>
              {form.qualified_users.length} staff selected
            </Text>
          </View>
        </View>

        {/* Defined Shifts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shifts</Text>
            <TouchableOpacity 
              style={styles.addShiftButton} 
              onPress={openAddShiftModal}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addShiftButtonText}>Add Shift</Text>
            </TouchableOpacity>
          </View>
          
          {form.shifts.length === 0 ? (
            <View style={styles.noShifts}>
              <Clock size={48} color="#9CA3AF" />
              <Text style={styles.noShiftsText}>No shifts defined</Text>
              <Text style={styles.noShiftsSubtext}>
                Add shifts to create specific schedules for this role
              </Text>
            </View>
          ) : (
            <View style={styles.shiftsList}>
              {form.shifts.map((shift: RoleShift, index: number) => (
                <View key={shift._id} style={styles.shiftItem}>
                  <View style={styles.shiftHeader}>
                    <View style={styles.shiftNameContainer}>
                      <Text style={styles.shiftName}>{shift.name}</Text>
                      <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>
                          {DAYS_OF_WEEK.find(d => d.value === shift.start_day)?.label.substring(0, 3)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.shiftActions}>
                      <Switch
                        value={shift.is_active}
                        onValueChange={(value) => {
                          const newShifts = [...form.shifts];
                          newShifts[index].is_active = value;
                          setForm(prev => ({ ...prev, shifts: newShifts }));
                        }}
                        trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                        thumbColor={shift.is_active ? '#fff' : '#fff'}
                      />
                      <TouchableOpacity 
                        style={styles.editShiftButton}
                        onPress={() => openEditShiftModal(shift, index)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.editShiftText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteShiftButton}
                        onPress={() => removeShift(index)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.shiftDetails}>
                    <View style={styles.shiftDetailRow}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.shiftDetailText}>
                        {DAYS_OF_WEEK.find(d => d.value === shift.start_day)?.label} {shift.start_time} - {DAYS_OF_WEEK.find(d => d.value === shift.end_day)?.label} {shift.end_time}
                      </Text>
                    </View>
                    
                    <View style={styles.shiftDetailRow}>
                      <MapPin size={14} color="#6B7280" />
                      <Text style={styles.shiftDetailText}>
                        {getLocationName(shift.location_id)}
                      </Text>
                    </View>
                    
                    <View style={styles.shiftDetailRow}>
                      <Users size={14} color="#6B7280" />
                      <Text style={styles.shiftDetailText}>
                        {shift.required_staff} staff required
                      </Text>
                    </View>
                    
                    {shift.tasks.length > 0 && (
                      <View style={styles.shiftDetailRow}>
                        <Text style={styles.shiftDetailText}>
                          📝 {shift.tasks.length} tasks
                        </Text>
                      </View>
                    )}
                    
                    {isOvernightShift(shift) && (
                      <View style={styles.overnightBadge}>
                        <Clock4 size={12} color="#8B5CF6" />
                        <Text style={styles.overnightText}>Overnight</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.shiftDuration}>
                    Duration: {calculateShiftDuration(shift)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
          <Text style={styles.saveButtonText}>
            {isEdit ? 'Update Role' : 'Create Role'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Container */}
      <Modal
        visible={activeModal !== 'none'}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          {activeModal === 'staff' && (
            <StaffModal
              staffList={staffList}
              selectedStaffIds={form.qualified_users}
              onToggleStaff={toggleStaffSelection}
              onSelectAll={selectAllStaff}
              onClearAll={clearAllStaff}
              onClose={closeModal}
            />
          )}

          {activeModal === 'location' && (
            <LocationModal
              locations={locations}
              selectedLocationId={currentShift.location_id}
              onSelectLocation={selectLocation}
              onClose={() => openModal('shift')}
            />
          )}

          {activeModal === 'shift' && (
            <ShiftModal
              currentShift={currentShift}
              locations={locations}
              selectedDays={selectedDaysForShift}
              onUpdateShift={(updates) => setCurrentShift(prev => ({ ...prev, ...updates }))}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onRemoveTask={removeTask}
              onOpenLocationModal={() => openModal('location')}
              onOpenDaysModal={() => openModal('days')}
              onOpenStartTimeModal={() => openModal('startTime')}
              onOpenEndTimeModal={() => openModal('endTime')}
              onSave={saveShift}
              onClose={closeModal}
            />
          )}

          {activeModal === 'days' && (
            <DaysModal
              selectedDays={selectedDaysForShift}
              onSave={handleDaysSave}
              onClose={() => openModal('shift')}
            />
          )}

          {activeModal === 'startTime' && (
            <TimeModal
              mode="start"
              currentTime={currentShift.start_time || '09:00'}
              onSave={handleStartTimeSave}
              onClose={() => openModal('shift')}
            />
          )}

          {activeModal === 'endTime' && (
            <TimeModal
              mode="end"
              currentTime={currentShift.end_time || '17:00'}
              onSave={handleEndTimeSave}
              onClose={() => openModal('shift')}
            />
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (theme: string) => {
  const isDark = theme === 'dark';
  const backgroundColor = isDark ? '#1F2937' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const inputBackground = isDark ? '#374151' : '#F3F4F6';
  const cardBackground = isDark ? '#111827' : '#F9FAFB';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
      backgroundColor: backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    backButton: {
      marginRight: 16,
      padding: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: textColor,
    },
    form: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
      backgroundColor: backgroundColor,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: borderColor,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
    },
    inputGroup: {
      marginBottom: 16,
    },
    rowInputs: {
      flexDirection: 'row',
      gap: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: secondaryTextColor,
      marginBottom: 8,
    },
    input: {
      backgroundColor: inputBackground,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#D1D5DB',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: textColor,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    
    // Loading styles
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: secondaryTextColor,
      fontWeight: '500',
    },
    
    // Empty state for company setup
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 40,
      marginHorizontal: 20,
      marginTop: 20,
      backgroundColor: isDark ? '#1F2937' : '#fff',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      borderStyle: 'dashed',
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: textColor,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: secondaryTextColor,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#3B82F6',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    emptyButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    
    // Staff Management
    manageStaffButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: inputBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    manageStaffText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#3B82F6',
    },
    selectedStaff: {
      alignItems: 'center',
    },
    noStaffText: {
      fontSize: 14,
      color: '#9CA3AF',
      fontStyle: 'italic',
      marginVertical: 12,
    },
    staffChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    staffChip: {
      backgroundColor: inputBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    staffChipText: {
      fontSize: 12,
      color: secondaryTextColor,
    },
    moreStaffChip: {
      backgroundColor: '#3B82F6',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    moreStaffText: {
      fontSize: 12,
      color: '#fff',
      fontWeight: '600',
    },
    staffCount: {
      fontSize: 12,
      color: secondaryTextColor,
      marginTop: 4,
    },
    
    // Shift Management
    addShiftButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#3B82F6',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addShiftButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    noShifts: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
    },
    noShiftsText: {
      fontSize: 16,
      color: secondaryTextColor,
      marginTop: 12,
      fontWeight: '600',
    },
    noShiftsSubtext: {
      fontSize: 14,
      color: '#9CA3AF',
      marginTop: 4,
      textAlign: 'center',
    },
    shiftsList: {
      gap: 12,
    },
    shiftItem: {
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: borderColor,
    },
    shiftHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    shiftNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    shiftName: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      flex: 1,
    },
    dayBadge: {
      backgroundColor: inputBackground,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    dayBadgeText: {
      fontSize: 11,
      color: secondaryTextColor,
      fontWeight: '600',
    },
    shiftActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    editShiftButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: inputBackground,
      borderRadius: 6,
    },
    editShiftText: {
      fontSize: 12,
      color: '#3B82F6',
      fontWeight: '600',
    },
    deleteShiftButton: {
      padding: 4,
    },
    shiftDetails: {
      gap: 4,
      marginBottom: 8,
    },
    shiftDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    shiftDetailText: {
      fontSize: 12,
      color: secondaryTextColor,
    },
    shiftDuration: {
      fontSize: 11,
      color: '#9CA3AF',
      fontStyle: 'italic',
    },
    overnightBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      backgroundColor: inputBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 4,
    },
    overnightText: {
      fontSize: 12,
      color: '#8B5CF6',
      fontWeight: '500',
    },
    
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    
    // Save Button
    saveButton: {
      backgroundColor: '#3B82F6',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 40,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
  });
};