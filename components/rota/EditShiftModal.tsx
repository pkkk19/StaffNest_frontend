// components/rota/EditShiftModal.tsx
import { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { X, Calendar, Clock, User, MapPin, Users, ChevronDown, ChevronUp, Building, Save } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { shiftsAPI, staffAPI, companiesAPI } from '@/services/api';
import { Shift, UpdateShiftData } from '@/app/types/rota.types';

interface EditShiftModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shift: Shift | null;
}

// Helper functions (UPDATED to handle Date objects like CreateShiftModal)
const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeDisplay = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export default function EditShiftModal({
  visible,
  onClose,
  onSuccess,
  shift,
}: EditShiftModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [showStaffList, setShowStaffList] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: formatDateForInput(new Date()),
    startTime: '09:00',
    endTime: '17:00',
    user_id: '',
    location: '',
    location_coordinates: {
      latitude: 0,
      longitude: 0,
    },
    location_address: '',
    color_hex: '#3B82F6',
    shift_type: 'assigned' as 'assigned' | 'open',
    status: 'scheduled' as string,
  });

  const styles = createStyles(theme);

  // Initialize form when modal opens or shift changes
  useEffect(() => {
    if (visible && shift) {
      fetchData();
      initializeForm(shift);
    }
  }, [visible, shift]);

  const fetchData = async () => {
    if (!user?.company_id) {
      Alert.alert('Error', 'No company assigned to your account');
      onClose();
      return;
    }

    try {
      // Fetch staff members
      const staffResponse = await staffAPI.getStaffMembers();
      setStaffMembers(staffResponse.data || []);
      
      // Fetch locations
      const locationsResponse = await companiesAPI.getLocations();
      setLocations(locationsResponse.data || []);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      let errorMessage = 'Failed to load shift data';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const initializeForm = (shiftData: Shift) => {
    const shiftDate = new Date(shiftData.start_time);
    const startTime = shiftDate.getHours().toString().padStart(2, '0') + ':' + 
                     shiftDate.getMinutes().toString().padStart(2, '0');
    
    const endDate = new Date(shiftData.end_time);
    const endTime = endDate.getHours().toString().padStart(2, '0') + ':' + 
                   endDate.getMinutes().toString().padStart(2, '0');
    
    setFormData({
      title: shiftData.title || '',
      description: shiftData.description || '',
      date: formatDateForInput(shiftDate),
      startTime,
      endTime,
      user_id: shiftData.user_id || '',
      location: shiftData.location || '',
      location_coordinates: shiftData.location_coordinates || {
        latitude: 0,
        longitude: 0,
      },
      location_address: shiftData.location_address || '',
      color_hex: shiftData.color_hex || '#3B82F6',
      shift_type: shiftData.type || 'assigned',
      status: shiftData.status || 'scheduled',
    });
  };

  const parseTimeToDate = (dateStr: string, timeStr: string) => {
    return new Date(`${dateStr}T${timeStr}:00`);
  };

  const validateTimeFormat = (time: string) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const validateDate = (dateStr: string) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;
    
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const cleaned = value.replace(/[^0-9:]/g, '');
    
    if (cleaned.length === 2 && !cleaned.includes(':')) {
      setFormData(prev => ({ ...prev, [field]: `${cleaned}:` }));
    } else {
      setFormData(prev => ({ ...prev, [field]: cleaned }));
    }
  };

  const handleSubmit = async () => {
    if (!user?.company_id) {
      Alert.alert('Error', 'No company assigned to your account');
      return;
    }

    if (!user?._id) {
      Alert.alert('Error', 'User not authenticated properly');
      return;
    }

    if (!shift?._id) {
      Alert.alert('Error', 'Shift ID is missing');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a shift title');
      return;
    }

    if (!validateDate(formData.date)) {
      Alert.alert('Error', 'Please enter a valid date in YYYY-MM-DD format');
      return;
    }

    if (!validateTimeFormat(formData.startTime)) {
      Alert.alert('Error', 'Please enter start time in HH:MM format (24-hour)');
      return;
    }

    if (!validateTimeFormat(formData.endTime)) {
      Alert.alert('Error', 'Please enter end time in HH:MM format (24-hour)');
      return;
    }

    if (formData.shift_type === 'assigned' && !formData.user_id) {
      Alert.alert('Error', 'Please select a staff member for assigned shift');
      return;
    }

    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    const startDateTime = parseTimeToDate(formData.date, formData.startTime);
    const endDateTime = parseTimeToDate(formData.date, formData.endTime);
    
    if (endDateTime <= startDateTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 24) {
      Alert.alert('Error', 'Shift duration cannot exceed 24 hours');
      return;
    }

    // For completed or cancelled shifts, don't allow editing assigned staff
    if (['completed', 'cancelled'].includes(formData.status)) {
      if (shift.user_id && shift.user_id !== formData.user_id) {
        Alert.alert('Error', 'Cannot change assigned staff for completed or cancelled shifts');
        return;
      }
    }

    try {
      setLoading(true);

      const selectedLocation = locations.find(loc => loc.name === formData.location);
      
      if (!selectedLocation) {
        throw new Error('Selected location not found');
      }

      // Prepare update data
      const updateData: UpdateShiftData = {
        title: formData.title,
        description: formData.description || undefined,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        color_hex: formData.color_hex,
        location: formData.location,
        location_coordinates: {
          latitude: selectedLocation.latitude || 0,
          longitude: selectedLocation.longitude || 0,
        },
        location_address: selectedLocation.address || undefined,
        type: formData.shift_type,
        status: formData.status,
      };

      // Handle user_id - for open shifts, set to undefined
      if (formData.shift_type === 'assigned' && formData.user_id) {
        updateData.user_id = formData.user_id;
      } else {
        // For open shifts, clear the user_id
        updateData.user_id = undefined;
      }

      console.log('📤 Updating shift with data:', updateData);
      
      const response = await shiftsAPI.updateShift(shift._id, updateData);
      
      Alert.alert('Success', 'Shift updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Update shift error:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Failed to update shift';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSelect = (staffId: string) => {
    setFormData(prev => ({ ...prev, user_id: staffId }));
    setShowStaffList(false);
  };

  const handleLocationSelect = (location: any) => {
    setFormData(prev => ({ 
      ...prev, 
      location: location.name,
      location_coordinates: {
        latitude: location.latitude || 0,
        longitude: location.longitude || 0,
      },
      location_address: location.address || '',
    }));
    setShowLocationList(false);
  };

  const getSelectedStaffName = () => {
    if (formData.shift_type === 'open') {
      return 'Open Shift (No staff assigned)';
    }
    if (formData.user_id) {
      const staff = staffMembers.find(s => s._id === formData.user_id);
      return staff ? `${staff.first_name} ${staff.last_name}` : 'Select staff member';
    }
    return 'Select staff member';
  };

  const getSelectedLocationName = () => {
    if (formData.location) {
      const location = locations.find(loc => loc.name === formData.location);
      return location ? location.name : 'Select location';
    }
    return 'Select location';
  };

  const getLocationAddress = () => {
    return formData.location_address;
  };

  // Calculate duration in hours
  const getDuration = () => {
    const startDateTime = parseTimeToDate(formData.date, formData.startTime);
    const endDateTime = parseTimeToDate(formData.date, formData.endTime);
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  // Time input suggestions
  const timeSuggestions = [
    '06:00', '07:00', '08:00', '09:00', '10:00',
    '11:00', '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00',
  ];

  const renderTimeSuggestions = (field: 'startTime' | 'endTime') => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.timeSuggestionsContainer}
      >
        {timeSuggestions.map(time => (
          <ForceTouchable
            key={time}
            style={[
              styles.timeSuggestion,
              formData[field] === time && styles.timeSuggestionSelected
            ]}
            onPress={() => setFormData(prev => ({ ...prev, [field]: time }))}
          >
            <Text style={[
              styles.timeSuggestionText,
              formData[field] === time && styles.timeSuggestionTextSelected
            ]}>
              {formatTimeDisplay(time)}
            </Text>
          </ForceTouchable>
        ))}
      </ScrollView>
    );
  };

  // Status options
  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled', color: '#3B82F6' },
    { value: 'open', label: 'Open', color: '#8B5CF6' },
    { value: 'in-progress', label: 'In Progress', color: '#F59E0B' },
    { value: 'completed', label: 'Completed', color: '#10B981' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  ];

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({ ...prev, status }));
    
    // If changing to open shift, clear assigned staff
    if (status === 'open') {
      setFormData(prev => ({ 
        ...prev, 
        status,
        shift_type: 'open',
        user_id: '' 
      }));
    }
  };

  if (!shift) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Edit Shift</Text>
            <Text style={styles.subtitle}>ID: {shift._id.slice(-8)}</Text>
            {user?.company_id && (
              <View style={styles.companyInfo}>
                <Building size={16} color={theme === 'dark' ? '#60A5FA' : '#3B82F6'} />
                <Text style={styles.companyText}>
                  Company ID: {user.company_id.slice(-8)}
                </Text>
              </View>
            )}
          </View>
          <ForceTouchable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </ForceTouchable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Shift Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shift Status *</Text>
            <View style={styles.statusOptions}>
              {statusOptions.map(option => (
                <ForceTouchable
                  key={option.value}
                  style={[
                    styles.statusOption,
                    formData.status === option.value && styles.statusOptionSelected,
                    { borderColor: option.color }
                  ]}
                  onPress={() => handleStatusChange(option.value)}
                >
                  <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                  <Text style={[
                    styles.statusOptionText,
                    formData.status === option.value && styles.statusOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </ForceTouchable>
              ))}
            </View>
          </View>

          {/* Shift Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shift Type *</Text>
            <View style={styles.shiftTypeOptions}>
              <ForceTouchable
                style={[
                  styles.shiftTypeOption,
                  formData.shift_type === 'assigned' && styles.shiftTypeOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ 
                  ...prev, 
                  shift_type: 'assigned',
                  status: formData.status === 'open' ? 'scheduled' : formData.status
                }))}
              >
                <User size={20} color={formData.shift_type === 'assigned' ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
                <Text style={[
                  styles.shiftTypeText,
                  formData.shift_type === 'assigned' && styles.shiftTypeTextSelected
                ]}>
                  Assigned
                </Text>
              </ForceTouchable>
              
              <ForceTouchable
                style={[
                  styles.shiftTypeOption,
                  formData.shift_type === 'open' && styles.shiftTypeOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ 
                  ...prev, 
                  shift_type: 'open',
                  user_id: '',
                  status: 'open'
                }))}
              >
                <Users size={20} color={formData.shift_type === 'open' ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
                <Text style={[
                  styles.shiftTypeText,
                  formData.shift_type === 'open' && styles.shiftTypeTextSelected
                ]}>
                  Open Shift
                </Text>
              </ForceTouchable>
            </View>
          </View>

          {/* Open Shift Info */}
          {formData.shift_type === 'open' && (
            <View style={styles.infoBox}>
              <Users size={20} color={theme === 'dark' ? '#60A5FA' : '#3B82F6'} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Open Shift</Text>
                <Text style={styles.infoText}>
                  This shift will be available for all staff members to request. No staff member is assigned initially.
                </Text>
              </View>
            </View>
          )}

          {/* Completed/Cancelled Warning */}
          {['completed', 'cancelled'].includes(formData.status) && (
            <View style={[styles.infoBox, { backgroundColor: theme === 'dark' ? '#7F1D1D' : '#FEE2E2' }]}>
              <X size={20} color={theme === 'dark' ? '#FCA5A5' : '#DC2626'} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: theme === 'dark' ? '#FCA5A5' : '#DC2626' }]}>
                  {formData.status === 'completed' ? 'Completed Shift' : 'Cancelled Shift'}
                </Text>
                <Text style={[styles.infoText, { color: theme === 'dark' ? '#FCA5A5' : '#DC2626' }]}>
                  {formData.status === 'completed' 
                    ? 'This shift has been completed. You can only edit basic details.'
                    : 'This shift has been cancelled. You can only edit basic details.'}
                </Text>
              </View>
            </View>
          )}

          {/* Shift Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shift Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="e.g., Morning Shift, Evening Shift"
              placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
              editable={!['completed', 'cancelled'].includes(formData.status)}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter shift description, notes, or instructions"
              placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!['completed', 'cancelled'].includes(formData.status)}
            />
          </View>

          {/* Staff Member Selection - Only show for assigned shifts and not completed/cancelled */}
          {formData.shift_type === 'assigned' && !['completed', 'cancelled'].includes(formData.status) && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assign to Staff Member *</Text>
              <ForceTouchable 
                style={styles.selector}
                onPress={() => setShowStaffList(!showStaffList)}
                disabled={staffMembers.length === 0}
              >
                <View style={styles.selectorContent}>
                  <View style={styles.inputWithIcon}>
                    <User size={20} color={staffMembers.length === 0 ? (theme === 'dark' ? '#6B7280' : '#9CA3AF') : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
                    <Text style={[
                      styles.selectorText,
                      (!formData.user_id || staffMembers.length === 0) && styles.placeholderText
                    ]}>
                      {staffMembers.length === 0 ? 'No staff members available' : getSelectedStaffName()}
                    </Text>
                  </View>
                  {staffMembers.length > 0 && (
                    showStaffList ? (
                      <ChevronUp size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    ) : (
                      <ChevronDown size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                    )
                  )}
                </View>
              </ForceTouchable>

              {/* Staff List Dropdown */}
              {showStaffList && staffMembers.length > 0 && (
                <View style={styles.dropdownList}>
                  {staffMembers.map(staff => (
                    <ForceTouchable
                      key={staff._id}
                      style={[
                        styles.dropdownItem,
                        formData.user_id === staff._id && styles.dropdownItemSelected
                      ]}
                      onPress={() => handleStaffSelect(staff._id)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        formData.user_id === staff._id && styles.dropdownItemTextSelected
                      ]}>
                        {staff.first_name} {staff.last_name}
                        {staff.position && ` - ${staff.position}`}
                      </Text>
                    </ForceTouchable>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Location Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <ForceTouchable 
              style={styles.selector}
              onPress={() => {
                setShowLocationList(!showLocationList);
                setShowStaffList(false);
              }}
              disabled={locations.length === 0}
            >
              <View style={styles.selectorContent}>
                <View style={styles.inputWithIcon}>
                  <MapPin size={20} color={locations.length === 0 ? (theme === 'dark' ? '#6B7280' : '#9CA3AF') : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
                  <View style={styles.locationInfo}>
                    <Text style={[
                      styles.selectorText,
                      (!formData.location || locations.length === 0) && styles.placeholderText
                    ]}>
                      {locations.length === 0 ? 'No locations available' : getSelectedLocationName()}
                    </Text>
                    {getLocationAddress() && (
                      <Text style={styles.locationAddress} numberOfLines={1}>
                        {getLocationAddress()}
                      </Text>
                    )}
                  </View>
                </View>
                {locations.length > 0 && (
                  showLocationList ? (
                    <ChevronUp size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  ) : (
                    <ChevronDown size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  )
                )}
              </View>
            </ForceTouchable>

            {/* Location List Dropdown */}
            {showLocationList && locations.length > 0 && (
              <View style={styles.dropdownWrapper}>
                <ScrollView 
                  style={styles.dropdownList}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {locations.map(location => (
                    <ForceTouchable
                      key={location._id || location.name}
                      style={[
                        styles.dropdownItem,
                        formData.location === location.name && styles.dropdownItemSelected
                      ]}
                      onPress={() => handleLocationSelect(location)}
                    >
                      <View style={styles.locationItem}>
                        <Text style={[
                          styles.dropdownItemText,
                          formData.location === location.name && styles.dropdownItemTextSelected
                        ]}>
                          {location.name}
                        </Text>
                        {location.address && (
                          <Text style={[
                            styles.locationItemAddress,
                            formData.location === location.name && styles.locationItemAddressSelected
                          ]}>
                            {location.address}
                          </Text>
                        )}
                      </View>
                    </ForceTouchable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <View style={styles.inputWithIcon}>
              <Calendar size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <TextInput
                style={[styles.input, styles.flex1]}
                value={formData.date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                keyboardType="numbers-and-punctuation"
                editable={!['completed', 'cancelled'].includes(formData.status)}
              />
            </View>
            <Text style={styles.hintText}>
              Format: YYYY-MM-DD (e.g., {formatDateForInput(new Date())})
            </Text>
          </View>

          {/* Start Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Time *</Text>
            <View style={styles.inputWithIcon}>
              <Clock size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <TextInput
                style={[styles.input, styles.flex1]}
                value={formData.startTime}
                onChangeText={(text) => handleTimeChange('startTime', text)}
                placeholder="HH:MM (24-hour)"
                placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                editable={!['completed', 'cancelled'].includes(formData.status)}
              />
            </View>
            <Text style={styles.hintText}>
              Current: {formatTimeDisplay(formData.startTime)}
            </Text>
            
            {/* Time Suggestions */}
            {!['completed', 'cancelled'].includes(formData.status) && (
              <>
                <Text style={styles.suggestionsLabel}>Quick select:</Text>
                {renderTimeSuggestions('startTime')}
              </>
            )}
          </View>

          {/* End Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Time *</Text>
            <View style={styles.inputWithIcon}>
              <Clock size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <TextInput
                style={[styles.input, styles.flex1]}
                value={formData.endTime}
                onChangeText={(text) => handleTimeChange('endTime', text)}
                placeholder="HH:MM (24-hour)"
                placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                editable={!['completed', 'cancelled'].includes(formData.status)}
              />
            </View>
            <Text style={styles.hintText}>
              Current: {formatTimeDisplay(formData.endTime)}
            </Text>
            
            {/* Time Suggestions */}
            {!['completed', 'cancelled'].includes(formData.status) && (
              <>
                <Text style={styles.suggestionsLabel}>Quick select:</Text>
                {renderTimeSuggestions('endTime')}
              </>
            )}
          </View>

          {/* Duration Display */}
          <View style={styles.durationContainer}>
            <Text style={styles.durationText}>
              Duration: <Text style={styles.durationValue}>{getDuration()} hours</Text>
            </Text>
            <Text style={styles.shiftIdText}>
              Shift ID: {shift._id.slice(-8)}
            </Text>
            {['completed', 'cancelled'].includes(formData.status) && (
              <Text style={[styles.warningText, { marginTop: 8 }]}>
                ⚠️ Limited editing for {formData.status} shifts
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.footer}>
            <ForceTouchable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </ForceTouchable>
            
            <ForceTouchable 
              onPress={handleSubmit} 
              style={[
                styles.submitButton,
                (loading || 
                 (staffMembers.length === 0 && formData.shift_type === 'assigned' && !['completed', 'cancelled'].includes(formData.status))) && 
                 styles.submitButtonDisabled
              ]}
              disabled={
                loading || 
                (staffMembers.length === 0 && formData.shift_type === 'assigned' && !['completed', 'cancelled'].includes(formData.status))
              }
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </ForceTouchable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Keep the exact same styles as CreateShiftModal
const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: 8,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyText: {
    fontSize: 12,
    color: theme === 'dark' ? '#60A5FA' : '#3B82F6',
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    marginTop: -8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: theme === 'dark' ? '#FCA5A5' : '#DC2626',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  placeholderText: {
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
  },
  // Status Options
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 20,
    borderWidth: 2,
  },
  statusOptionSelected: {
    backgroundColor: theme === 'dark' ? '#1E3A8A' : '#DBEAFE',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionText: {
    fontSize: 14,
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
    fontWeight: '500',
  },
  statusOptionTextSelected: {
    color: theme === 'dark' ? '#E0F2FE' : '#1E40AF',
    fontWeight: '600',
  },
  // Shift Type Styles
  shiftTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  shiftTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shiftTypeOptionSelected: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
  },
  shiftTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  shiftTypeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Selector Styles
  selector: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#D1D5DB',
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
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    flex: 1,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 12,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    marginTop: 2,
  },
  // Dropdown List Styles
  dropdownWrapper: {
    position: 'relative',
    marginTop: 8,
    zIndex: 1000,
    elevation: 1000,
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#D1D5DB',
    borderRadius: 8,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  dropdownItemSelected: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  dropdownItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  locationItem: {
    flex: 1,
  },
  locationItemAddress: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginTop: 2,
  },
  locationItemAddressSelected: {
    color: '#E5E7EB',
  },
  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#1E3A8A' : '#DBEAFE',
    borderRadius: 8,
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#E0F2FE' : '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: theme === 'dark' ? '#E0F2FE' : '#1E40AF',
    lineHeight: 20,
  },
  // Time Suggestions
  timeSuggestionsContainer: {
    marginTop: 8,
  },
  timeSuggestion: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeSuggestionSelected: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
  },
  timeSuggestionText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  timeSuggestionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Duration Display
  durationContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#D1D5DB',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 16,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  durationValue: {
    fontWeight: '700',
    color: theme === 'dark' ? '#60A5FA' : '#3B82F6',
  },
  shiftIdText: {
    fontSize: 12,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    marginTop: 4,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    paddingBottom: 40,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: theme === 'dark' ? '#374151' : '#9CA3AF',
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});