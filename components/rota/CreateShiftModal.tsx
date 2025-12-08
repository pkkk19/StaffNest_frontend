// components/rota/CreateShiftModal.tsx
import { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { X, Calendar, Clock, User, MapPin, Users, ChevronDown, ChevronUp, Building } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { shiftsAPI, staffAPI, companiesAPI } from '@/services/api';
import { useRotaData } from '@/hooks/useRotaData';

interface CreateShiftModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: Date;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

// Helper functions moved outside component
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

export default function CreateShiftModal({
  visible,
  onClose,
  onSuccess,
  defaultDate = new Date(),
  defaultStartTime = '09:00',
  defaultEndTime = '17:00',
}: CreateShiftModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [showStaffList, setShowStaffList] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);
  
  // Initialize with tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: formatDateForInput(tomorrow), // Changed from startDate to date
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
  });

  const styles = createStyles(theme);

  // Initialize form when modal opens
  useEffect(() => {
    if (visible) {
      fetchData();
      // Reset form with default values (tomorrow)
      const resetDate = new Date();
      resetDate.setDate(resetDate.getDate() + 1);
      
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        date: formatDateForInput(resetDate),
        startTime: '09:00',
        endTime: '17:00',
        user_id: '',
        location: '',
        color_hex: '#3B82F6',
        shift_type: 'assigned',
      }));
      setShowStaffList(false);
      setShowLocationList(false);
    }
  }, [visible]);

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
      
      // Set default location if available
      if (locationsResponse.data && locationsResponse.data.length > 0) {
        const firstLocation = locationsResponse.data[0];
        setFormData(prev => ({ 
          ...prev, 
          location: firstLocation.name,
          location_coordinates: {
            latitude: firstLocation.latitude || 0,
            longitude: firstLocation.longitude || 0,
          },
          location_address: firstLocation.address || '',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load shift data');
    }
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

  const isFutureDateTime = (dateStr: string, timeStr: string) => {
    const shiftDateTime = parseTimeToDate(dateStr, timeStr);
    const now = new Date();
    return shiftDateTime > now;
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    // Allow only numbers and colon
    const cleaned = value.replace(/[^0-9:]/g, '');
    
    // Auto-insert colon after 2 digits
    if (cleaned.length === 2 && !cleaned.includes(':')) {
      setFormData(prev => ({ ...prev, [field]: `${cleaned}:` }));
    } else {
      setFormData(prev => ({ ...prev, [field]: cleaned }));
    }
  };

  const { createShift } = useRotaData();

  const handleSubmit = async () => {
    if (!user?.company_id) {
      Alert.alert('Error', 'No company assigned to your account');
      return;
    }

    if (!user?._id) {
      Alert.alert('Error', 'User not authenticated properly');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a shift title');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    if (!validateDate(formData.date)) {
      Alert.alert('Error', 'Please enter a valid date in YYYY-MM-DD format');
      return;
    }

    // Validate time formats
    if (!validateTimeFormat(formData.startTime)) {
      Alert.alert('Error', 'Please enter start time in HH:MM format (24-hour)');
      return;
    }

    if (!validateTimeFormat(formData.endTime)) {
      Alert.alert('Error', 'Please enter end time in HH:MM format (24-hour)');
      return;
    }

    // Validate that shift is in the future
    if (!isFutureDateTime(formData.date, formData.startTime)) {
      Alert.alert('Error', 'Shift start time must be in the future');
      return;
    }

    // For assigned shifts, require staff member selection
    if (formData.shift_type === 'assigned' && !formData.user_id) {
      Alert.alert('Error', 'Please select a staff member for assigned shift');
      return;
    }

    // Require location selection
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    // Validate time
    const startDateTime = parseTimeToDate(formData.date, formData.startTime);
    const endDateTime = parseTimeToDate(formData.date, formData.endTime);
    
    if (endDateTime <= startDateTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    // Ensure shift duration is reasonable (not too long)
    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 24) {
      Alert.alert('Error', 'Shift duration cannot exceed 24 hours');
      return;
    }

    try {
      setLoading(true);

      const selectedLocation = locations.find(loc => loc.name === formData.location);
      
      if (!selectedLocation) {
        throw new Error('Selected location not found');
      }

      
      // Prepare shift data according to your Shift schema
      const shiftData: any = {
        title: formData.title,
        description: formData.description || undefined,
        start_time: startDateTime.toISOString(),  // ISO string
        end_time: endDateTime.toISOString(),      // ISO string
        company_id: user.company_id, // Required
        color_hex: formData.color_hex,
        location: formData.location,
        location_coordinates: {
          latitude: selectedLocation.latitude || 0,
          longitude: selectedLocation.longitude || 0,
        },
        location_address: selectedLocation.address || undefined,
        type: formData.shift_type, // 'assigned' or 'open'
        status: 'scheduled', // Default status
      };

      // Only include user_id for assigned shifts
      if (formData.shift_type === 'assigned' && formData.user_id) {
        shiftData.user_id = formData.user_id;
      }
      // For open shifts, user_id will be null (default in schema)

      console.log('Sending shift data to backend:', shiftData);
      
      await createShift(shiftData);
      
      Alert.alert('Success', `Shift ${formData.shift_type === 'open' ? 'created as open shift' : 'created and assigned successfully'}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Create shift error:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Failed to create shift';
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

  // Check if date is in the future
  const isDateInFuture = () => {
    return isFutureDateTime(formData.date, formData.startTime);
  };

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
            <Text style={styles.title}>Create New Shift</Text>
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
          {/* Shift Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shift Type *</Text>
            <View style={styles.shiftTypeOptions}>
              <ForceTouchable
                style={[
                  styles.shiftTypeOption,
                  formData.shift_type === 'assigned' && styles.shiftTypeOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, shift_type: 'assigned' }))}
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
                  user_id: '' 
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

          {/* Shift Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shift Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="e.g., Morning Shift, Evening Shift"
              placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
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
            />
          </View>

          {/* Staff Member Selection - Only show for assigned shifts */}
          {formData.shift_type === 'assigned' && (
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
      // Close staff list if open
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
        maximumZoomScale={1}
        minimumZoomScale={1}
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
              />
            </View>
            <Text style={styles.hintText}>
              Format: YYYY-MM-DD (e.g., {formatDateForInput(new Date())})
              {!isDateInFuture() && (
                <Text style={styles.errorText}> • Shift must be in the future</Text>
              )}
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
              />
            </View>
            <Text style={styles.hintText}>
              Current: {formatTimeDisplay(formData.startTime)}
            </Text>
            
            {/* Time Suggestions */}
            <Text style={styles.suggestionsLabel}>Quick select:</Text>
            {renderTimeSuggestions('startTime')}
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
              />
            </View>
            <Text style={styles.hintText}>
              Current: {formatTimeDisplay(formData.endTime)}
            </Text>
            
            {/* Time Suggestions */}
            <Text style={styles.suggestionsLabel}>Quick select:</Text>
            {renderTimeSuggestions('endTime')}
          </View>

          {/* Duration Display */}
          <View style={[
            styles.durationContainer,
            !isDateInFuture() && styles.durationContainerWarning
          ]}>
            <Text style={styles.durationText}>
              Duration: <Text style={styles.durationValue}>{getDuration()} hours</Text>
            </Text>
            {!isDateInFuture() && (
              <Text style={styles.warningText}>
                ⚠️ Shift must be scheduled for a future date/time
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
                 (staffMembers.length === 0 && formData.shift_type === 'assigned') ||
                 !isDateInFuture()) && styles.submitButtonDisabled
              ]}
              disabled={
                loading || 
                (staffMembers.length === 0 && formData.shift_type === 'assigned') ||
                !isDateInFuture()
              }
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating...' : `Create ${formData.shift_type === 'open' ? 'Open Shift' : 'Shift'}`}
              </Text>
            </ForceTouchable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Styles remain the same as before...
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
  errorText: {
    color: theme === 'dark' ? '#FCA5A5' : '#DC2626',
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginTop: 12,
    marginBottom: 8,
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
  elevation: 1000, // For Android
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
  durationContainerWarning: {
    backgroundColor: theme === 'dark' ? '#7F1D1D' : '#FEE2E2',
    borderColor: theme === 'dark' ? '#FCA5A5' : '#FCA5A5',
  },
  durationText: {
    fontSize: 16,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  durationValue: {
    fontWeight: '700',
    color: theme === 'dark' ? '#60A5FA' : '#3B82F6',
  },
  warningText: {
    fontSize: 12,
    color: theme === 'dark' ? '#FCA5A5' : '#DC2626',
    marginTop: 8,
    textAlign: 'center',
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
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
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