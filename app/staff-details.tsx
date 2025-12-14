import { View, Text, ScrollView, StyleSheet, TextInput, Alert, Platform, Image, TouchableOpacity, ActivityIndicator, Modal, TouchableWithoutFeedback } from 'react-native';
import { ArrowLeft, Save, Camera, X, Mail, Phone, MapPin, Calendar, User as UserIcon, Briefcase, Building, Heart, PhoneCall, CreditCard, DollarSign, PoundSterling, IndianRupee, Clock, FileText, Globe, IdCard } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import ForceTouchable from '@/components/ForceTouchable';
import { staffAPI } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface StaffMember {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role: string;
  position?: string;
  department?: string;
  status?: string;
  company_id?: string;
  is_active?: boolean;
  profile_picture_url?: string;
  date_of_birth?: string;
  address?: string;
  country?: string;
  
  employment?: {
    employment_type?: string;
    start_date?: string;
    working_hours_per_week?: number;
    department?: string;
  };
  
  identification?: {
    employee_ref?: string;
    ni_number?: string;
    ssn?: string;
    tfn?: string;
    pan?: string;
    uae_id?: string;
  };
  
  tax_info?: {
    tax_code?: string;
    tax_id?: string;
    filing_status?: string;
  };
  
  payment_method?: {
    method?: string;
    account_number?: string;
    sort_code?: string;
    routing_number?: string;
    bsb_code?: string;
  };
  
  pay_rates?: {
    default_hourly_rate?: number;
    default_salary?: number;
    overtime_rate?: number;
  };
  
  pension?: {
    scheme_name?: string;
    employee_contribution_rate?: number;
    employer_contribution_rate?: number;
    is_salary_sacrifice?: boolean;
  };
  
  leave_config?: {
    annual_leave_days?: number;
    annual_leave_hours?: number;
  };
  
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
    email?: string;
    address?: string;
  };
}

// Reusable Input Field Component with proper typing
const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default', 
  multiline = false, 
  theme, 
  icon: Icon,
  editable = true 
}: any) => {
  const isDark = theme === 'dark';
  
  return (
    <View style={inputFieldStyles.inputGroup}>
      <View style={inputFieldStyles.inputLabelContainer}>
        {Icon && <Icon size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />}
        <Text style={[
          inputFieldStyles.inputLabel,
          { color: isDark ? '#F9FAFB' : '#111827' }
        ]}>
          {label}
        </Text>
      </View>
      <View style={[
        inputFieldStyles.inputContainer,
        { 
          backgroundColor: isDark ? '#374151' : '#FFFFFF',
          borderColor: isDark ? '#4B5563' : '#E5E7EB'
        }
      ]}>
        <TextInput
          style={[
            inputFieldStyles.input,
            { color: isDark ? '#F9FAFB' : '#111827' },
            multiline && inputFieldStyles.multilineInput
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          editable={editable}
        />
      </View>
    </View>
  );
};

const inputFieldStyles = StyleSheet.create({
  inputGroup: {
    marginBottom: 16,
  },
  inputLabelContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
});

// Currency Icon component
const CurrencyIcon = ({ country, size = 16, color = "#6B7280" }: { country?: string; size?: number; color?: string }) => {
  const currencyIcons: Record<string, any> = {
    UK: PoundSterling,
    US: DollarSign,
    AU: DollarSign,
    NP: IndianRupee,
    AE: DollarSign,
  };
  
  const IconComponent = currencyIcons[country || 'UK'] || PoundSterling;
  return <IconComponent size={size} color={color} />;
};

// Date Input Component
const DateInputField = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  theme, 
  icon: Icon 
}: any) => {
  const isDark = theme === 'dark';
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(value ? new Date(value) : new Date());

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      onChange(selectedDate.toISOString().split('T')[0]);
    }
  };

  return (
    <View style={dateInputStyles.inputGroup}>
      <View style={dateInputStyles.inputLabelContainer}>
        {Icon && <Icon size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />}
        <Text style={[
          dateInputStyles.inputLabel,
          { color: isDark ? '#F9FAFB' : '#111827' }
        ]}>
          {label}
        </Text>
      </View>
      <TouchableOpacity 
        style={[
          dateInputStyles.dateInputContainer,
          { 
            backgroundColor: isDark ? '#374151' : '#FFFFFF',
            borderColor: isDark ? '#4B5563' : '#E5E7EB'
          }
        ]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[
          dateInputStyles.dateInput,
          { color: isDark ? '#F9FAFB' : '#111827' }
        ]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const dateInputStyles = StyleSheet.create({
  inputGroup: {
    marginBottom: 16,
  },
  inputLabelContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  dateInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
  },
});

export default function EditStaff() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const staffId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  const [formData, setFormData] = useState<StaffMember | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  // Load staff details
  useEffect(() => {
    if (staffId) {
      loadStaffDetails();
    }
  }, [staffId]);

  const loadStaffDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffAPI.getStaffMember(staffId);
      const staffData = response.data;
      setFormData(staffData);
      setProfileImage(staffData.profile_picture_url || null);
    } catch (error: any) {
      console.error('Failed to load staff details:', error);
      let errorMessage = 'Failed to load staff details. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Use useCallback for the change handlers to prevent unnecessary re-renders
  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleNestedChange = useCallback((parent: string, field: string, value: any) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [parent]: {
          ...(prev[parent as keyof StaffMember] as any || {}),
          [field]: value
        }
      };
    });
  }, []);

  const handleEmergencyContactChange = useCallback((field: string, value: string) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        emergency_contact: {
          ...(prev.emergency_contact || {}),
          [field]: value
        }
      };
    });
  }, []);

  const handleEmploymentChange = useCallback((field: string, value: any) => {
    handleNestedChange('employment', field, value);
  }, [handleNestedChange]);

  const handleIdentificationChange = useCallback((field: string, value: string) => {
    handleNestedChange('identification', field, value);
  }, [handleNestedChange]);

  const handleTaxInfoChange = useCallback((field: string, value: string) => {
    handleNestedChange('tax_info', field, value);
  }, [handleNestedChange]);

  const handlePayRatesChange = useCallback((field: string, value: number) => {
    handleNestedChange('pay_rates', field, value);
  }, [handleNestedChange]);

  const handlePaymentMethodChange = useCallback((field: string, value: string) => {
    handleNestedChange('payment_method', field, value);
  }, [handleNestedChange]);

  const handlePensionChange = useCallback((field: string, value: any) => {
    handleNestedChange('pension', field, value);
  }, [handleNestedChange]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
      setImageModalVisible(false);
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow camera access to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
      setImageModalVisible(false);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);
      
      // Note: You'll need to implement staff picture upload endpoint
      // For now, we'll use the same profile upload API if available
      Alert.alert('Info', 'Profile picture upload for staff will be implemented soon.');
      
      // Simulate upload success
      setProfileImage(imageUri);
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeProfileImage = async () => {
    try {
      setUploading(true);
      setProfileImage(null);
      Alert.alert('Success', 'Profile picture removed');
      setImageModalVisible(false);
    } catch (error) {
      console.error('Error removing image:', error);
      Alert.alert('Error', 'Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData) return;
    
    try {
      setSaving(true);
      
      // Prepare data for API - match your backend's expected format
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number || undefined,
        position: formData.position || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        address: formData.address || undefined,
        country: formData.country || undefined,
        employment: formData.employment || undefined,
        identification: formData.identification || undefined,
        tax_info: formData.tax_info || undefined,
        payment_method: formData.payment_method || undefined,
        pay_rates: formData.pay_rates || undefined,
        pension: formData.pension || undefined,
        emergency_contact: formData.emergency_contact || undefined,
      };

      console.log('Updating staff with data:', updateData);
      
      // Using your staffAPI.updateStaff method
      const response = await staffAPI.updateStaff(staffId, updateData);
      
      Alert.alert('Success', 'Staff details updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to update staff:', error);
      
      let errorMessage = 'Failed to update staff details. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (!formData) return '??';
    return `${formData.first_name?.[0] || ''}${formData.last_name?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Staff</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading staff details...</Text>
        </View>
      </View>
    );
  }

  if (error || !formData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Staff</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContent}>
          <View style={styles.errorIcon}>
            <UserIcon size={48} color="#EF4444" />
          </View>
          <Text style={styles.errorText}>{error || 'Staff member not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadStaffDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: 'transparent', marginTop: 12 }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.retryButtonText, { color: '#2563EB' }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={isDark ? '#F9FAFB' : '#374151'} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Staff</Text>
        <TouchableOpacity 
          style={[styles.saveButtonHeader, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Save size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.saveButtonHeaderText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => setImageModalVisible(true)}
          >
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }} 
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Camera size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.staffName}>
            {formData.first_name} {formData.last_name}
          </Text>
          
          <Text style={styles.staffRole}>
            {formData.position || formData.role}
            {formData.employment?.department && ` • ${formData.employment.department}`}
          </Text>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <UserIcon size={20} color="#2563EB" />
            </View>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <InputField
            label="First Name"
            value={formData.first_name}
            onChangeText={(text: string) => handleChange('first_name', text)}
            placeholder="Enter first name"
            theme={theme}
            icon={UserIcon}
          />

          <InputField
            label="Last Name"
            value={formData.last_name}
            onChangeText={(text: string) => handleChange('last_name', text)}
            placeholder="Enter last name"
            theme={theme}
            icon={UserIcon}
          />

          <InputField
            label="Email"
            value={formData.email}
            onChangeText={(text: string) => handleChange('email', text)}
            placeholder="Enter email"
            keyboardType="email-address"
            theme={theme}
            icon={Mail}
            editable={false} // Email should not be editable
          />

          <InputField
            label="Phone"
            value={formData.phone_number || ''}
            onChangeText={(text: string) => handleChange('phone_number', text)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            theme={theme}
            icon={Phone}
          />

          <DateInputField
            label="Date of Birth"
            value={formData.date_of_birth || ''}
            onChange={(text: string) => handleChange('date_of_birth', text)}
            placeholder="Select date of birth"
            theme={theme}
            icon={Calendar}
          />

          <InputField
            label="Address"
            value={formData.address || ''}
            onChangeText={(text: string) => handleChange('address', text)}
            placeholder="Enter address"
            multiline={true}
            theme={theme}
            icon={MapPin}
          />

          <InputField
            label="Country"
            value={formData.country || ''}
            onChangeText={(text: string) => handleChange('country', text)}
            placeholder="Enter country"
            theme={theme}
            icon={Globe}
          />
        </View>

        {/* Employment Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Briefcase size={20} color="#2563EB" />
            </View>
            <Text style={styles.sectionTitle}>Employment Details</Text>
          </View>

          <InputField
            label="Employee Reference"
            value={formData.identification?.employee_ref || ''}
            onChangeText={(text: string) => handleIdentificationChange('employee_ref', text)}
            placeholder="Enter employee reference"
            theme={theme}
            icon={FileText}
          />

          <InputField
            label="Position"
            value={formData.position || ''}
            onChangeText={(text: string) => handleChange('position', text)}
            placeholder="Enter position"
            theme={theme}
            icon={Briefcase}
          />

          <InputField
            label="Department"
            value={formData.employment?.department || formData.department || ''}
            onChangeText={(text: string) => handleEmploymentChange('department', text)}
            placeholder="Enter department"
            theme={theme}
            icon={Building}
          />

          <DateInputField
            label="Start Date"
            value={formData.employment?.start_date || ''}
            onChange={(text: string) => handleEmploymentChange('start_date', text)}
            placeholder="Select start date"
            theme={theme}
            icon={Calendar}
          />

          <InputField
            label="Employment Type"
            value={formData.employment?.employment_type || ''}
            onChangeText={(text: string) => handleEmploymentChange('employment_type', text)}
            placeholder="Enter employment type"
            theme={theme}
            icon={Clock}
          />

          <InputField
            label="Working Hours/Week"
            value={formData.employment?.working_hours_per_week?.toString() || ''}
            onChangeText={(text: string) => handleEmploymentChange('working_hours_per_week', Number(text))}
            placeholder="Enter working hours"
            keyboardType="numeric"
            theme={theme}
            icon={Clock}
          />
        </View>

        {/* Financial Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <CreditCard size={20} color="#2563EB" />
            </View>
            <Text style={styles.sectionTitle}>Financial Information</Text>
          </View>

          <InputField
            label="Tax Code"
            value={formData.tax_info?.tax_code || ''}
            onChangeText={(text: string) => handleTaxInfoChange('tax_code', text)}
            placeholder="Enter tax code"
            theme={theme}
            icon={CreditCard}
          />

          <InputField
            label="Hourly Rate"
            value={formData.pay_rates?.default_hourly_rate?.toString() || ''}
            onChangeText={(text: string) => handlePayRatesChange('default_hourly_rate', Number(text))}
            placeholder="Enter hourly rate"
            keyboardType="numeric"
            theme={theme}
            icon={() => <CurrencyIcon country={formData.country} />}
          />

          <InputField
            label="Annual Salary"
            value={formData.pay_rates?.default_salary?.toString() || ''}
            onChangeText={(text: string) => handlePayRatesChange('default_salary', Number(text))}
            placeholder="Enter annual salary"
            keyboardType="numeric"
            theme={theme}
            icon={() => <CurrencyIcon country={formData.country} />}
          />

          <InputField
            label="Payment Method"
            value={formData.payment_method?.method || ''}
            onChangeText={(text: string) => handlePaymentMethodChange('method', text)}
            placeholder="Enter payment method"
            theme={theme}
            icon={CreditCard}
          />

          <InputField
            label="Account Number"
            value={formData.payment_method?.account_number || ''}
            onChangeText={(text: string) => handlePaymentMethodChange('account_number', text)}
            placeholder="Enter account number"
            keyboardType="numeric"
            theme={theme}
            icon={CreditCard}
          />
        </View>

        {/* Emergency Contact Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Heart size={20} color="#2563EB" />
            </View>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
          </View>

          <InputField
            label="Contact Name"
            value={formData.emergency_contact?.name || ''}
            onChangeText={(text: string) => handleEmergencyContactChange('name', text)}
            placeholder="Enter contact name"
            theme={theme}
            icon={UserIcon}
          />

          <InputField
            label="Contact Phone"
            value={formData.emergency_contact?.phone || ''}
            onChangeText={(text: string) => handleEmergencyContactChange('phone', text)}
            placeholder="Enter contact phone"
            keyboardType="phone-pad"
            theme={theme}
            icon={PhoneCall}
          />

          <InputField
            label="Relationship"
            value={formData.emergency_contact?.relationship || ''}
            onChangeText={(text: string) => handleEmergencyContactChange('relationship', text)}
            placeholder="Enter relationship"
            theme={theme}
            icon={Heart}
          />

          <InputField
            label="Contact Email"
            value={formData.emergency_contact?.email || ''}
            onChangeText={(text: string) => handleEmergencyContactChange('email', text)}
            placeholder="Enter contact email"
            keyboardType="email-address"
            theme={theme}
            icon={Mail}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.fullWidthSaveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.fullWidthSaveButtonText}>Save All Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Image Selection Modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setImageModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.imageModalContainer}>
                <View style={styles.imageModalHeader}>
                  <Text style={styles.imageModalTitle}>Profile Picture</Text>
                  <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                    <X size={24} color={isDark ? '#F9FAFB' : '#111827'} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.imagePreviewContainer}>
                  {profileImage ? (
                    <Image 
                      source={{ uri: profileImage }} 
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.previewAvatarContainer}>
                      <Text style={styles.previewAvatarText}>{getInitials()}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.imageModalButtons}>
                  <TouchableOpacity 
                    style={[styles.imageModalButton, uploading && styles.buttonDisabled]}
                    onPress={pickImage}
                    disabled={uploading}
                  >
                    <Text style={styles.imageModalButtonText}>Choose from Library</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.imageModalButton, styles.cameraButton, uploading && styles.buttonDisabled]}
                    onPress={takePhoto}
                    disabled={uploading}
                  >
                    <Camera size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.imageModalButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  
                  {profileImage && (
                    <TouchableOpacity 
                      style={[styles.imageModalButton, styles.removeImageButton, uploading && styles.buttonDisabled]}
                      onPress={removeProfileImage}
                      disabled={uploading}
                    >
                      <Text style={styles.removeImageButtonText}>Remove Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    saveButtonHeader: {
      backgroundColor: '#2563EB',
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    saveButtonHeaderText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    errorIcon: {
      marginBottom: 20,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center' as const,
      marginBottom: 20,
      lineHeight: 24,
    },
    retryButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    profileSection: {
      alignItems: 'center' as const,
      padding: 32,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    avatarContainer: {
      position: 'relative' as const,
      marginBottom: 16,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#2563EB',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...Platform.select({
        android: { elevation: 3 },
      }),
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: isDark ? '#374151' : '#FFFFFF',
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    cameraIcon: {
      position: 'absolute' as const,
      bottom: 0,
      right: 0,
      backgroundColor: '#2563EB',
      borderRadius: 12,
      width: 28,
      height: 28,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 2,
      borderColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    staffName: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
      textAlign: 'center' as const,
    },
    staffRole: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center' as const,
    },
    section: {
      padding: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      marginTop: 8,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 24,
    },
    sectionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : '#EFF6FF',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    fullWidthSaveButton: {
      backgroundColor: '#2563EB',
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginHorizontal: 20,
      marginTop: 24,
      marginBottom: 20,
      paddingVertical: 16,
      borderRadius: 12,
      ...Platform.select({
        android: { elevation: 5 },
      }),
    },
    fullWidthSaveButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    saveButtonDisabled: {
      backgroundColor: '#9CA3AF',
      opacity: 0.7,
    },
    bottomSpacer: {
      height: 40,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 20,
    },
    imageModalContainer: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      width: '100%',
      maxWidth: 400,
      padding: 20,
    },
    imageModalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 20,
    },
    imageModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    imagePreviewContainer: {
      alignItems: 'center' as const,
      marginBottom: 24,
    },
    imagePreview: {
      width: 150,
      height: 150,
      borderRadius: 75,
      borderWidth: 3,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    previewAvatarContainer: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: '#2563EB',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    previewAvatarText: {
      fontSize: 48,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    imageModalButtons: {
      gap: 12,
    },
    imageModalButton: {
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center' as const,
    },
    cameraButton: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
    },
    imageModalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    removeImageButton: {
      backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
    },
    removeImageButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FCA5A5' : '#DC2626',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });
}