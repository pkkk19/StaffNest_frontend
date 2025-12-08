import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, Briefcase, CreditCard, IdCard, Building, PoundSterling, DollarSign, IndianRupee, Euro, Upload } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { staffAPI } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import ForceTouchable from '@/components/ForceTouchable';

// Move InputField component outside to prevent re-renders
const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default',
  error,
  icon: Icon,
  multiline = false,
  theme,
  required = false
}: any) => {
  const styles = createStyles(theme);
  
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredStar}>*</Text>}
      </Text>
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        {Icon && <Icon size={20} color="#6B7280" style={styles.inputIcon} />}
        <TextInput
          style={[styles.input, Icon && styles.inputWithIcon, multiline && styles.textArea]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Move SelectField component outside
const SelectField = ({ label, value, onValueChange, options, error, theme, required = false }: any) => {
  const styles = createStyles(theme);
  
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredStar}>*</Text>}
      </Text>
      <View style={styles.selectContainer}>
        {options.map((option: any) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              value === option.value && styles.selectOptionActive
            ]}
            onPress={() => onValueChange(option.value)}
          >
            <Text style={[
              styles.selectOptionText,
              value === option.value && styles.selectOptionTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Currency icon component
const CurrencyIcon = ({ country, size = 20, color = "#6B7280" }: { country?: string; size?: number; color?: string }) => {
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

interface StaffMember {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  position?: string;
  date_of_birth?: string;
  address?: string;
  country: string;
  profile_picture_url?: string;
  is_active?: boolean;
  
  // Employment
  employment?: {
    department?: string;
    employment_type?: string;
    start_date?: string;
    working_hours_per_week?: number;
  };
  
  // Identification
  identification?: {
    employee_ref?: string;
    ni_number?: string;
    ssn?: string;
    tfn?: string;
    pan?: string;
    uae_id?: string;
  };
  
  // Tax info
  tax_info?: {
    tax_code?: string;
    filing_status?: string;
    tax_scale?: string;
    tax_slab?: string;
  };
  
  // Payment method
  payment_method?: {
    method?: string;
    account_number?: string;
    sort_code?: string;
    routing_number?: string;
    bsb_code?: string;
    iban?: string;
    swift_code?: string;
  };
  
  // Pay rates
  pay_rates?: {
    default_hourly_rate?: number;
    default_salary?: number;
    overtime_rate?: number;
  };
  
  // Pension
  pension?: {
    scheme_name?: string;
    employee_contribution_rate?: number;
    employer_contribution_rate?: number;
    is_salary_sacrifice?: boolean;
  };
  
  // Leave
  leave_config?: {
    annual_leave_days?: number;
    annual_leave_hours?: number;
  };
  
  // Emergency contact
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
    email?: string;
    address?: string;
  };
}

export default function EditStaff() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const staffId = params.id as string;
  
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [staffData, setStaffData] = useState<StaffMember | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Get country-specific field labels
  const getCountrySpecificFields = (country: string) => {
    const countryFields = {
      UK: {
        idLabel: 'National Insurance (NI) Number',
        idPlaceholder: 'Enter NI number (e.g., AB123456C)',
        taxLabel: 'Tax Code',
        taxPlaceholder: 'Enter tax code (e.g., 1257L)',
        bankLabel: 'Sort Code',
        bankPlaceholder: 'Enter sort code (e.g., 12-34-56)',
      },
      US: {
        idLabel: 'Social Security Number (SSN)',
        idPlaceholder: 'Enter SSN (e.g., 123-45-6789)',
        taxLabel: 'Filing Status',
        taxPlaceholder: 'Enter filing status',
        bankLabel: 'Routing Number',
        bankPlaceholder: 'Enter routing number',
      },
      AU: {
        idLabel: 'Tax File Number (TFN)',
        idPlaceholder: 'Enter TFN',
        taxLabel: 'Tax Scale',
        taxPlaceholder: 'Enter tax scale',
        bankLabel: 'BSB Code',
        bankPlaceholder: 'Enter BSB code',
      },
      NP: {
        idLabel: 'PAN Number',
        idPlaceholder: 'Enter PAN number',
        taxLabel: 'Tax Slab',
        taxPlaceholder: 'Enter tax slab',
        bankLabel: 'Bank Details',
        bankPlaceholder: 'Enter bank details',
      },
      AE: {
        idLabel: 'UAE ID Number',
        idPlaceholder: 'Enter UAE ID number',
        taxLabel: 'Tax Information',
        taxPlaceholder: 'Enter tax information',
        bankLabel: 'Bank Details',
        bankPlaceholder: 'Enter bank details',
      }
    };
    
    return countryFields[country as keyof typeof countryFields] || countryFields.UK;
  };

  useEffect(() => {
    if (staffId) {
      loadStaffData();
    }
  }, [staffId]);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getStaffMember(staffId);
      setStaffData(response.data);
      setProfileImage(response.data.profile_picture_url || null);
    } catch (error: any) {
      console.error('Failed to load staff data:', error);
      Alert.alert('Error', 'Failed to load staff data', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera roll permissions are required to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);
      
      // In a real app, you would upload to your backend
      // For now, we'll just set the local state
      setProfileImage(imageUri);
      
      Alert.alert('Success', 'Profile picture updated (demo)');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!staffData?.first_name?.trim()) newErrors.first_name = 'First name is required';
    if (!staffData?.last_name?.trim()) newErrors.last_name = 'Last name is required';
    if (!staffData?.email?.trim()) newErrors.email = 'Email is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (staffData?.email && !emailRegex.test(staffData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare update data
      const updateData: any = {
        first_name: staffData?.first_name,
        last_name: staffData?.last_name,
        email: staffData?.email,
        phone_number: staffData?.phone_number || undefined,
        address: staffData?.address || undefined,
        date_of_birth: staffData?.date_of_birth || undefined,
        position: staffData?.position || undefined,
        country: staffData?.country,
        
        // Employment
        employment: {
          department: staffData?.employment?.department || undefined,
          employment_type: staffData?.employment?.employment_type || undefined,
          start_date: staffData?.employment?.start_date || undefined,
          working_hours_per_week: staffData?.employment?.working_hours_per_week || undefined,
        },
        
        // Identification
        identification: {
          employee_ref: staffData?.identification?.employee_ref || undefined,
          ...getCountrySpecificIdFields(staffData?.country || 'UK')
        },
        
        // Tax info
        tax_info: {
          ...getCountrySpecificTaxFields(staffData?.country || 'UK')
        },
        
        // Payment method
        payment_method: {
          method: staffData?.payment_method?.method || 'BACS',
          account_number: staffData?.payment_method?.account_number || undefined,
          ...getCountrySpecificBankFields(staffData?.country || 'UK')
        },
        
        // Pay rates
        pay_rates: {
          default_hourly_rate: staffData?.pay_rates?.default_hourly_rate || undefined,
          default_salary: staffData?.pay_rates?.default_salary || undefined,
          overtime_rate: staffData?.pay_rates?.overtime_rate || undefined,
        },
        
        // Pension
        pension: {
          scheme_name: staffData?.pension?.scheme_name || undefined,
          employee_contribution_rate: staffData?.pension?.employee_contribution_rate || undefined,
          employer_contribution_rate: staffData?.pension?.employer_contribution_rate || undefined,
          is_salary_sacrifice: staffData?.pension?.is_salary_sacrifice || false,
        },
        
        // Leave config
        leave_config: {
          annual_leave_days: staffData?.leave_config?.annual_leave_days || 25,
          annual_leave_hours: staffData?.leave_config?.annual_leave_hours || 200,
        },
        
        // Emergency contact
        emergency_contact: staffData?.emergency_contact || undefined,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      console.log('Updating staff with data:', updateData);
      
      // Call API to update staff
      const response = await staffAPI.updateStaff(staffId, updateData);
      
      Alert.alert('Success', 'Staff member updated successfully', [
        { 
          text: 'OK', 
          onPress: () => router.back() 
        }
      ]);
    } catch (error: any) {
      console.error('Error updating staff:', error);
      let errorMessage = 'Failed to update staff member';
      if (error.response?.data?.message) errorMessage = error.response.data.message;
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Helper functions for country-specific fields
  const getCountrySpecificIdFields = (country: string) => {
    if (!staffData?.identification) return {};
    
    switch (country) {
      case 'UK': return { ni_number: staffData.identification.ni_number };
      case 'US': return { ssn: staffData.identification.ssn };
      case 'AU': return { tfn: staffData.identification.tfn };
      case 'NP': return { pan: staffData.identification.pan };
      case 'AE': return { uae_id: staffData.identification.uae_id };
      default: return {};
    }
  };

  const getCountrySpecificTaxFields = (country: string) => {
    if (!staffData?.tax_info) return {};
    
    switch (country) {
      case 'UK': return { tax_code: staffData.tax_info.tax_code };
      case 'US': return { filing_status: staffData.tax_info.filing_status };
      case 'AU': return { tax_scale: staffData.tax_info.tax_scale };
      case 'NP': return { tax_slab: staffData.tax_info.tax_slab };
      default: return {};
    }
  };

  const getCountrySpecificBankFields = (country: string) => {
    if (!staffData?.payment_method) return {};
    
    switch (country) {
      case 'UK': return { sort_code: staffData.payment_method.sort_code };
      case 'US': return { routing_number: staffData.payment_method.routing_number };
      case 'AU': return { bsb_code: staffData.payment_method.bsb_code };
      case 'AE': return { iban: staffData.payment_method.iban, swift_code: staffData.payment_method.swift_code };
      default: return {};
    }
  };

  const updateField = (field: string, value: any) => {
    setStaffData(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setStaffData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [field]: value
        }
      };
    });
  };

  const getInitials = () => {
    if (!staffData) return '??';
    return `${staffData.first_name?.charAt(0) || ''}${staffData.last_name?.charAt(0) || ''}`.toUpperCase();
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
          <Text style={styles.loadingText}>Loading staff data...</Text>
        </View>
      </View>
    );
  }

  if (!staffData) {
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
          <Text style={styles.errorText}>Staff member not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const countryFields = getCountrySpecificFields(staffData.country);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Staff Member</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Save size={24} color={saving ? '#9CA3AF' : '#2563EB'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Picture Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials()}</Text>
            )}
          </View>
          
          <ForceTouchable 
            style={styles.changePhotoButton} 
            onPress={pickImage}
            disabled={uploading}
          >
            <Upload size={16} color="#2563EB" />
            <Text style={styles.changePhotoText}>
              {uploading ? 'Uploading...' : 'Change Photo'}
            </Text>
          </ForceTouchable>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <InputField
            label="First Name *"
            value={staffData.first_name}
            onChangeText={(text: string) => updateField('first_name', text)}
            placeholder="Enter first name"
            error={errors.first_name}
            icon={User}
            theme={theme}
            required={true}
          />

          <InputField
            label="Last Name *"
            value={staffData.last_name}
            onChangeText={(text: string) => updateField('last_name', text)}
            placeholder="Enter last name"
            error={errors.last_name}
            icon={User}
            theme={theme}
            required={true}
          />

          <InputField
            label="Email *"
            value={staffData.email}
            onChangeText={(text: string) => updateField('email', text)}
            placeholder="Enter email"
            keyboardType="email-address"
            error={errors.email}
            icon={Mail}
            theme={theme}
            required={true}
          />

          <InputField
            label="Phone Number"
            value={staffData.phone_number || ''}
            onChangeText={(text: string) => updateField('phone_number', text)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            icon={Phone}
            theme={theme}
          />

          <InputField
            label="Address"
            value={staffData.address || ''}
            onChangeText={(text: string) => updateField('address', text)}
            placeholder="Enter address"
            multiline
            icon={MapPin}
            theme={theme}
          />

          <InputField
            label="Date of Birth"
            value={staffData.date_of_birth || ''}
            onChangeText={(text: string) => updateField('date_of_birth', text)}
            placeholder="YYYY-MM-DD"
            icon={Calendar}
            theme={theme}
          />

          <SelectField
            label="Country"
            value={staffData.country}
            onValueChange={(value: string) => updateField('country', value)}
            options={[
              { value: 'UK', label: 'United Kingdom' },
              { value: 'US', label: 'United States' },
              { value: 'AU', label: 'Australia' },
              { value: 'NP', label: 'Nepal' },
              { value: 'AE', label: 'UAE' }
            ]}
            theme={theme}
            required={true}
          />
        </View>

        {/* Employment Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employment Details</Text>
          
          <InputField
            label="Position"
            value={staffData.position || ''}
            onChangeText={(text: string) => updateField('position', text)}
            placeholder="Enter position"
            icon={Briefcase}
            theme={theme}
          />

          <InputField
            label="Department"
            value={staffData.employment?.department || ''}
            onChangeText={(text: string) => updateNestedField('employment', 'department', text)}
            placeholder="Enter department"
            icon={Building}
            theme={theme}
          />

          <SelectField
            label="Employment Type"
            value={staffData.employment?.employment_type || 'full-time'}
            onValueChange={(value: string) => updateNestedField('employment', 'employment_type', value)}
            options={[
              { value: 'full-time', label: 'Full-time' },
              { value: 'part-time', label: 'Part-time' },
              { value: 'contract', label: 'Contract' }
            ]}
            theme={theme}
          />

          <InputField
            label="Start Date"
            value={staffData.employment?.start_date || ''}
            onChangeText={(text: string) => updateNestedField('employment', 'start_date', text)}
            placeholder="YYYY-MM-DD"
            icon={Calendar}
            theme={theme}
          />

          <InputField
            label="Working Hours/Week"
            value={staffData.employment?.working_hours_per_week?.toString() || ''}
            onChangeText={(text: string) => updateNestedField('employment', 'working_hours_per_week', parseInt(text) || undefined)}
            placeholder="e.g., 40"
            keyboardType="numeric"
            icon={Calendar}
            theme={theme}
          />
        </View>

        {/* Employee Identification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Identification</Text>
          
          <InputField
            label="Employee Reference *"
            value={staffData.identification?.employee_ref || ''}
            onChangeText={(text: string) => updateNestedField('identification', 'employee_ref', text)}
            placeholder="Enter employee reference"
            error={errors.employee_ref}
            icon={IdCard}
            theme={theme}
            required={true}
          />

          <InputField
            label={countryFields.idLabel}
            value={
              staffData.identification?.ni_number ||
              staffData.identification?.ssn ||
              staffData.identification?.tfn ||
              staffData.identification?.pan ||
              staffData.identification?.uae_id ||
              ''
            }
            onChangeText={(text: string) => {
              switch (staffData.country) {
                case 'UK': updateNestedField('identification', 'ni_number', text); break;
                case 'US': updateNestedField('identification', 'ssn', text); break;
                case 'AU': updateNestedField('identification', 'tfn', text); break;
                case 'NP': updateNestedField('identification', 'pan', text); break;
                case 'AE': updateNestedField('identification', 'uae_id', text); break;
              }
            }}
            placeholder={countryFields.idPlaceholder}
            icon={IdCard}
            theme={theme}
          />

          <InputField
            label={countryFields.taxLabel}
            value={
              staffData.tax_info?.tax_code ||
              staffData.tax_info?.filing_status ||
              staffData.tax_info?.tax_scale ||
              staffData.tax_info?.tax_slab ||
              ''
            }
            onChangeText={(text: string) => {
              switch (staffData.country) {
                case 'UK': updateNestedField('tax_info', 'tax_code', text); break;
                case 'US': updateNestedField('tax_info', 'filing_status', text); break;
                case 'AU': updateNestedField('tax_info', 'tax_scale', text); break;
                case 'NP': updateNestedField('tax_info', 'tax_slab', text); break;
              }
            }}
            placeholder={countryFields.taxPlaceholder}
            icon={CreditCard}
            theme={theme}
          />
        </View>

        {/* Banking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banking Details</Text>
          
          <SelectField
            label="Payment Method"
            value={staffData.payment_method?.method || 'BACS'}
            onValueChange={(value: string) => updateNestedField('payment_method', 'method', value)}
            options={[
              { value: 'BACS', label: 'BACS' },
              { value: 'Cheque', label: 'Cheque' },
              { value: 'Cash', label: 'Cash' },
              { value: 'Wire', label: 'Wire Transfer' }
            ]}
            theme={theme}
          />

          <InputField
            label="Account Number"
            value={staffData.payment_method?.account_number || ''}
            onChangeText={(text: string) => updateNestedField('payment_method', 'account_number', text)}
            placeholder="Enter account number"
            keyboardType="numeric"
            icon={CreditCard}
            theme={theme}
          />

          <InputField
            label={countryFields.bankLabel}
            value={
              staffData.payment_method?.sort_code ||
              staffData.payment_method?.routing_number ||
              staffData.payment_method?.bsb_code ||
              staffData.payment_method?.iban ||
              ''
            }
            onChangeText={(text: string) => {
              switch (staffData.country) {
                case 'UK': updateNestedField('payment_method', 'sort_code', text); break;
                case 'US': updateNestedField('payment_method', 'routing_number', text); break;
                case 'AU': updateNestedField('payment_method', 'bsb_code', text); break;
                case 'AE': updateNestedField('payment_method', 'iban', text); break;
              }
            }}
            placeholder={countryFields.bankPlaceholder}
            icon={CreditCard}
            theme={theme}
          />
        </View>

        {/* Pay Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pay Rates</Text>
          
          <InputField
            label="Default Hourly Rate"
            value={staffData.pay_rates?.default_hourly_rate?.toString() || ''}
            onChangeText={(text: string) => updateNestedField('pay_rates', 'default_hourly_rate', parseFloat(text) || undefined)}
            placeholder="e.g., 12.50"
            keyboardType="numeric"
            icon={() => <CurrencyIcon country={staffData.country} />}
            theme={theme}
          />

          <InputField
            label="Annual Salary"
            value={staffData.pay_rates?.default_salary?.toString() || ''}
            onChangeText={(text: string) => updateNestedField('pay_rates', 'default_salary', parseFloat(text) || undefined)}
            placeholder="e.g., 25000"
            keyboardType="numeric"
            icon={() => <CurrencyIcon country={staffData.country} />}
            theme={theme}
          />

          <InputField
            label="Overtime Rate Multiplier"
            value={staffData.pay_rates?.overtime_rate?.toString() || ''}
            onChangeText={(text: string) => updateNestedField('pay_rates', 'overtime_rate', parseFloat(text) || undefined)}
            placeholder="e.g., 1.5"
            keyboardType="numeric"
            icon={() => <CurrencyIcon country={staffData.country} />}
            theme={theme}
          />
        </View>

        {/* Pension */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pension</Text>
          
          <InputField
            label="Pension Scheme"
            value={staffData.pension?.scheme_name || ''}
            onChangeText={(text: string) => updateNestedField('pension', 'scheme_name', text)}
            placeholder="Enter pension scheme name"
            icon={Building}
            theme={theme}
          />

          <InputField
            label="Employee Contribution Rate (%)"
            value={staffData.pension?.employee_contribution_rate?.toString() || ''}
            onChangeText={(text: string) => updateNestedField('pension', 'employee_contribution_rate', parseFloat(text) || undefined)}
            placeholder="e.g., 5.0"
            keyboardType="numeric"
            icon={() => <CurrencyIcon country={staffData.country} />}
            theme={theme}
          />

          <InputField
            label="Employer Contribution Rate (%)"
            value={staffData.pension?.employer_contribution_rate?.toString() || ''}
            onChangeText={(text: string) => updateNestedField('pension', 'employer_contribution_rate', parseFloat(text) || undefined)}
            placeholder="e.g., 3.0"
            keyboardType="numeric"
            icon={() => <CurrencyIcon country={staffData.country} />}
            theme={theme}
          />

          <SelectField
            label="Salary Sacrifice"
            value={staffData.pension?.is_salary_sacrifice?.toString() || 'false'}
            onValueChange={(value: string) => updateNestedField('pension', 'is_salary_sacrifice', value === 'true')}
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' }
            ]}
            theme={theme}
          />
        </View>

        {/* Leave Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Configuration</Text>
          
          <InputField
            label="Annual Leave Days"
            value={staffData.leave_config?.annual_leave_days?.toString() || '25'}
            onChangeText={(text: string) => updateNestedField('leave_config', 'annual_leave_days', parseInt(text) || 25)}
            placeholder="e.g., 25"
            keyboardType="numeric"
            theme={theme}
          />

          <InputField
            label="Annual Leave Hours"
            value={staffData.leave_config?.annual_leave_hours?.toString() || '200'}
            onChangeText={(text: string) => updateNestedField('leave_config', 'annual_leave_hours', parseInt(text) || 200)}
            placeholder="e.g., 200"
            keyboardType="numeric"
            theme={theme}
          />
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <InputField
            label="Contact Name"
            value={staffData.emergency_contact?.name || ''}
            onChangeText={(text: string) => updateNestedField('emergency_contact', 'name', text)}
            placeholder="Enter contact name"
            icon={User}
            theme={theme}
          />

          <InputField
            label="Contact Phone"
            value={staffData.emergency_contact?.phone || ''}
            onChangeText={(text: string) => updateNestedField('emergency_contact', 'phone', text)}
            placeholder="Enter contact phone"
            keyboardType="phone-pad"
            icon={Phone}
            theme={theme}
          />

          <InputField
            label="Relationship"
            value={staffData.emergency_contact?.relationship || ''}
            onChangeText={(text: string) => updateNestedField('emergency_contact', 'relationship', text)}
            placeholder="Enter relationship"
            theme={theme}
          />

          <InputField
            label="Contact Email"
            value={staffData.emergency_contact?.email || ''}
            onChangeText={(text: string) => updateNestedField('emergency_contact', 'email', text)}
            placeholder="Enter contact email"
            keyboardType="email-address"
            icon={Mail}
            theme={theme}
          />

          <InputField
            label="Contact Address"
            value={staffData.emergency_contact?.address || ''}
            onChangeText={(text: string) => updateNestedField('emergency_contact', 'address', text)}
            placeholder="Enter contact address"
            multiline
            icon={MapPin}
            theme={theme}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    content: {
      flex: 1,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
      marginBottom: 20,
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
    avatarSection: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      overflow: 'hidden',
      ...Platform.select({
        android: { elevation: 3 },
      }),
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 50,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    changePhotoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 20,
    },
    changePhotoText: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '500',
    },
    section: {
      padding: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      marginTop: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    inputContainerError: {
      borderColor: '#EF4444',
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    inputWithIcon: {
      marginLeft: 0,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    selectContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    selectOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    selectOptionActive: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    selectOptionText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
    },
    selectOptionTextActive: {
      color: '#FFFFFF',
    },
    saveButton: {
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      margin: 20,
      marginTop: 30,
      ...Platform.select({
        android: { elevation: 5 },
      }),
    },
    saveButtonDisabled: {
      backgroundColor: '#9CA3AF',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    requiredStar: {
      color: '#EF4444',
      fontSize: 16,
    },
  });
}