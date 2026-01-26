import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, Modal, Dimensions } from 'react-native';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, Briefcase, CreditCard, IdCard, Building, PoundSterling, DollarSign, Globe, Euro, IndianRupee, AlertCircle, Check, ChevronRight, Info, X } from 'lucide-react-native';
import { useState, useCallback, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { staffAPI } from '@/services/api';
import { useCountryForm } from '@/hooks/useCountryForm';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

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
  required = false,
  showDatePicker,
  onPress, // Changed from onFocus for date picker
  onBlur
}: any) => {
  const styles = createStyles(theme);
  const [isFocused, setIsFocused] = useState(false);
  
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };
  
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputLabel}>
          {label}
        </Text>
        <View style={styles.labelRight}>
          {required && (
            <View style={styles.requiredIndicator}>
              <Text style={styles.requiredIndicatorText}>Required</Text>
            </View>
          )}
          {error && (
            <Text style={styles.errorIndicator}>
              <AlertCircle size={14} color="#EF4444" />
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity 
        style={[
          styles.inputContainer, 
          error && styles.inputContainerError,
          isFocused && styles.inputContainerFocused,
          showDatePicker && styles.datePickerContainer
        ]}
        onPress={onPress} // Use onPress for date picker
        activeOpacity={showDatePicker ? 0.7 : 1}
      >
        {Icon && <Icon size={20} color={isFocused ? "#2563EB" : "#6B7280"} style={styles.inputIcon} />}
        {showDatePicker ? (
          <>
            <Text style={[
              styles.input, 
              Icon && styles.inputWithIcon, 
              !value && styles.placeholderText
            ]}>
              {value || placeholder}
            </Text>
            <Calendar size={20} color="#6B7280" />
          </>
        ) : (
          <TextInput
            style={[styles.input, Icon && styles.inputWithIcon, multiline && styles.textArea]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!showDatePicker}
          />
        )}
      </TouchableOpacity>
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

// Move SelectField component outside
const SelectField = ({ label, value, onValueChange, options, error, theme, required = false }: any) => {
  const styles = createStyles(theme);
  
  const handlePress = (optionValue: string) => {
    if (onValueChange) {
      onValueChange(optionValue);
    }
  };
  
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputLabel}>
          {label}
        </Text>
        <View style={styles.labelRight}>
          {required && (
            <View style={styles.requiredIndicator}>
              <Text style={styles.requiredIndicatorText}>Required</Text>
            </View>
          )}
          {error && (
            <Text style={styles.errorIndicator}>
              <AlertCircle size={14} color="#EF4444" />
            </Text>
          )}
        </View>
      </View>
      <View style={styles.selectContainer}>
        {options.map((option: any) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              value === option.value && styles.selectOptionActive
            ]}
            onPress={() => handlePress(option.value)}
          >
            <Text style={[
              styles.selectOptionText,
              value === option.value && styles.selectOptionTextActive
            ]}>
              {option.label}
            </Text>
            {value === option.value && (
              <Check size={16} color="#FFFFFF" style={styles.selectOptionIcon} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

// Country Select Component
const CountrySelectField = ({ label, value, onValueChange, options, error, theme, countryConfig }: any) => {
  const styles = createStyles(theme);
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedCountry = options.find((opt: any) => opt.value === value);
  
  const handlePress = (countryValue: string) => {
    if (onValueChange) {
      onValueChange(countryValue);
    }
    setIsOpen(false);
  };
  
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputLabel}>
          {label}
        </Text>
        <View style={styles.labelRight}>
          <View style={styles.requiredIndicator}>
            <Text style={styles.requiredIndicatorText}>Required</Text>
          </View>
          {error && (
            <Text style={styles.errorIndicator}>
              <AlertCircle size={14} color="#EF4444" />
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.countrySelect,
          error && styles.inputContainerError,
          isOpen && styles.countrySelectOpen
        ]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.countrySelectHeader}>
          <View style={styles.countrySelectLeft}>
            {selectedCountry && countryConfig?.currency && (
              <CurrencyIcon country={value} size={22} />
            )}
            <Text style={styles.countrySelectText}>
              {selectedCountry?.label || 'Select country'}
            </Text>
          </View>
          <ChevronRight 
            size={20} 
            color="#6B7280" 
            style={[styles.countrySelectIcon, isOpen && styles.countrySelectIconOpen]} 
          />
        </View>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.countryDropdown}>
          {options.map((option: any) => (
            <TouchableOpacity
              key={option.value}
              style={styles.countryOption}
              onPress={() => handlePress(option.value)}
            >
              <View style={styles.countryOptionLeft}>
                <CurrencyIcon country={option.value} />
                <Text style={styles.countryOptionText}>{option.label}</Text>
              </View>
              {value === option.value && (
                <Check size={18} color="#2563EB" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {countryConfig && (
        <View style={styles.countryInfoCard}>
          <Info size={16} color="#6B7280" />
          <Text style={styles.countryInfoText}>
            {countryConfig.currency} • {countryConfig.identification?.label}
          </Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
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
    EU: Euro,
    IN: IndianRupee,
  };
  
  const IconComponent = currencyIcons[country || 'UK'] || Globe;
  return <IconComponent size={size} color={color} />;
};

// Field Indicator Component
const FieldIndicator = ({ type = 'required' }: { type?: 'required' | 'optional' }) => {
  const styles = createStyles('light');
  
  return (
    <View style={styles.fieldIndicator}>
      <View style={[
        styles.indicatorDot, 
        type === 'required' ? styles.requiredDot : styles.optionalDot
      ]} />
      <Text style={styles.indicatorText}>
        {type === 'required' ? 'Required • Must be filled' : 'Optional • Can add later'}
      </Text>
    </View>
  );
};

// Progress Indicator
const ProgressIndicator = ({ currentStep, totalSteps = 5 }: { currentStep: number; totalSteps?: number }) => {
  const styles = createStyles('light');
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View 
            key={index}
            style={[
              styles.progressStep,
              index < currentStep && styles.progressStepActive,
              index === currentStep - 1 && styles.progressStepCurrent
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );
};

export default function AddStaff() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const styles = createStyles(theme);

  // Use country form hook
  const { country, setCountry, countryConfig, countryFields } = useCountryForm('UK') as any;

  const [formData, setFormData] = useState({
    // Personal Information (REQUIRED)
    firstName: '',
    lastName: '',
    email: '',
    phone: '', // NOW REQUIRED
    
    // Employment Details (REQUIRED)
    department: '',
    employmentStartDate: '',
    
    // Country Selection (REQUIRED)
    country: 'UK',
    
    // Employee Identification (REQUIRED)
    employeeRef: '',
    identificationNumber: '',
    
    // Personal Information (OPTIONAL)
    address: '',
    dateOfBirth: '',
    
    // Employment Details (OPTIONAL)
    position: '',
    employmentType: 'full-time',
    
    // Banking (OPTIONAL)
    bankAccountNumber: '',
    bankDetails: '',
    
    // Tax Information (OPTIONAL)
    taxInfo: '',
    
    // Pay Rates (OPTIONAL)
    defaultHourlyRate: '',
    defaultSalary: '',
    
    // Pension (OPTIONAL)
    employeePensionRate: '0',
    employerPensionRate: '0',
    pensionSalarySacrifice: false,
    pensionScheme: '',
    
    // Leave (OPTIONAL)
    annualLeaveEntitlementDays: '25',
    annualLeaveEntitlementHours: '200',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const [activeSection, setActiveSection] = useState('required');
  const [currentStep, setCurrentStep] = useState(1);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Calculate current step based on required fields
  useEffect(() => {
    const requiredFields = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone,
      formData.department,
      formData.employmentStartDate,
      formData.employeeRef,
      formData.identificationNumber
    ];
    
    const filledCount = requiredFields.filter(field => field.trim() !== '').length;
    setCurrentStep(Math.ceil((filledCount + 1) / 2));
  }, [formData]);

  // Handle back button press - reset scroll content
  const handleBackPress = useCallback(() => {
    setShowDatePicker(null);
    router.back();
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: {[key: string]: string} = {};

    // Required fields - MUST FILL
    if (!formData.firstName.trim()) newErrors.firstName = t('firstNameRequired');
    if (!formData.lastName.trim()) newErrors.lastName = t('lastNameRequired');
    if (!formData.email.trim()) newErrors.email = t('emailRequired');
    if (!formData.phone.trim()) newErrors.phone = t('phoneRequired');
    if (!formData.employeeRef.trim()) newErrors.employeeRef = t('employeeRefRequired');
    if (!formData.identificationNumber.trim()) newErrors.identificationNumber = t('identificationRequired');
    if (!formData.department.trim()) newErrors.department = t('departmentRequired');
    if (!formData.employmentStartDate.trim()) newErrors.employmentStartDate = t('startDateRequired');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = t('invalidEmail');
    }

    // Phone validation (basic international format)
    const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('invalidPhone');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // FIXED: Date picker handler
  const handleDateChange = (field: string, event: any, selectedDate?: Date) => {
    // Hide picker on both platforms
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      updateFormField(field)(formattedDate);
    }
  };

  // FIXED: Open date picker function
  const openDatePicker = (field: 'employmentStartDate' | 'dateOfBirth') => {
    // Set the current value for the picker
    const currentValue = formData[field];
    if (currentValue) {
      try {
        setDatePickerValue(new Date(currentValue));
      } catch (error) {
        setDatePickerValue(new Date());
      }
    } else {
      setDatePickerValue(new Date());
    }
    
    setShowDatePicker(field);
  };

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert(t('error'), t('pleaseFixErrors'));
      return;
    }

    try {
      // Prepare data in the new flexible format
      const staffData = {
        // Core Info (REQUIRED)
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone, // NOW INCLUDED
        address: formData.address || undefined,
        date_of_birth: formData.dateOfBirth || undefined,
        
        // Employment (REQUIRED)
        role: 'staff' as 'staff',
        company_id: user?.company_id,
        position: formData.position || undefined,
        department: formData.department,
        employment: {
          employment_type: formData.employmentType,
          start_date: formData.employmentStartDate,
        },
        
        // Country (REQUIRED)
        country: formData.country,
        
        // Identification (country-specific) (REQUIRED)
        identification: {
          employee_ref: formData.employeeRef,
          [countryConfig?.identification?.key || 'ni_number']: formData.identificationNumber
        },
        
        // Tax Info (country-specific) (OPTIONAL)
        tax_info: countryConfig?.tax?.key ? {
          [countryConfig.tax.key]: formData.taxInfo || countryConfig.tax.value
        } : {},
        
        // Payment Method (OPTIONAL)
        payment_method: {
          method: 'BACS', // Default, can be made dynamic
          account_number: formData.bankAccountNumber,
          ...(countryConfig?.banking?.key && { 
            [countryConfig.banking.key]: formData.bankDetails 
          })
        },
        
        // Pay Rates (OPTIONAL)
        pay_rates: {
          ...(formData.defaultHourlyRate && { 
            default_hourly_rate: parseFloat(formData.defaultHourlyRate) 
          }),
          ...(formData.defaultSalary && { 
            default_salary: parseFloat(formData.defaultSalary) 
          }),
        },
        
        // Pension (OPTIONAL)
        pension: {
          scheme_name: formData.pensionScheme || undefined,
          employee_contribution_rate: parseFloat(formData.employeePensionRate) || 0,
          employer_contribution_rate: parseFloat(formData.employerPensionRate) || 0,
          pension_salary_sacrifice: formData.pensionSalarySacrifice,
        },
        
        // Leave configuration (OPTIONAL)
        leave_config: {
          annual_leave_days: parseInt(formData.annualLeaveEntitlementDays) || 25,
          annual_leave_hours: parseInt(formData.annualLeaveEntitlementHours) || 200,
        },
        
        // Temporary password
        password: 'TempPassword123!',
      };

      console.log('Creating staff with data:', staffData);
      
      // Make API call
      const response = await staffAPI.createStaff(staffData);
      
      Alert.alert(
        t('success'), 
        t('staffMemberAdded'),
        [
          { 
            text: t('ok'), 
            onPress: () => router.back() 
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error creating staff member:', error);
      
      let errorMessage = t('failedToAddStaff');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('error'), errorMessage);
    }
  }, [validateForm, formData, countryConfig, t, user?.company_id]);

  const updateFormField = useCallback((field: string) => (value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleCountryChange = useCallback((newCountry: string) => {
    setCountry(newCountry);
    updateFormField('country')(newCountry);
    updateFormField('identificationNumber')('');
    updateFormField('taxInfo')('');
    updateFormField('bankDetails')('');
  }, [updateFormField, setCountry]);

  const handleEmploymentTypeChange = useCallback((value: string) => {
    updateFormField('employmentType')(value);
  }, [updateFormField]);

  const handlePensionSacrificeChange = useCallback((value: string) => {
    updateFormField('pensionSalarySacrifice')(value === 'true');
  }, [updateFormField]);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBackPress}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{t('addStaffMember')}</Text>
          <ProgressIndicator currentStep={currentStep} totalSteps={4} />
        </View>
        <TouchableOpacity 
          onPress={handleSave}
          style={styles.saveHeaderButton}
        >
          <Save size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.progressSectionTitle}>Complete all required fields to add staff</Text>
          <FieldIndicator type="required" />
        </View>

        {/* Required Fields Section */}
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('required')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, styles.sectionIconRequired]}>
              <Check size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.sectionHeaderTitle}>Required Information</Text>
              <Text style={styles.sectionHeaderSubtitle}>
                Fill these fields to create staff profile
              </Text>
            </View>
          </View>
          <ChevronRight 
            size={20} 
            color="#6B7280" 
            style={[styles.sectionChevron, activeSection === 'required' && styles.sectionChevronOpen]} 
          />
        </TouchableOpacity>

        {activeSection === 'required' && (
          <View style={styles.sectionContent}>
            {/* Personal Information */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>
                <User size={18} color="#2563EB" /> Personal Information
              </Text>
              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <InputField
                    label={t('firstName')}
                    value={formData.firstName}
                    onChangeText={updateFormField('firstName')}
                    placeholder="John"
                    error={errors.firstName}
                    theme={theme}
                    required={true}
                  />
                </View>
                <View style={styles.halfInput}>
                  <InputField
                    label={t('lastName')}
                    value={formData.lastName}
                    onChangeText={updateFormField('lastName')}
                    placeholder="Doe"
                    error={errors.lastName}
                    theme={theme}
                    required={true}
                  />
                </View>
              </View>

              <InputField
                label={t('email')}
                value={formData.email}
                onChangeText={updateFormField('email')}
                placeholder="john.doe@company.com"
                keyboardType="email-address"
                error={errors.email}
                icon={Mail}
                theme={theme}
                required={true}
              />

              <InputField
                label={t('phone')}
                value={formData.phone}
                onChangeText={updateFormField('phone')}
                placeholder="+44 1234 567890"
                keyboardType="phone-pad"
                error={errors.phone}
                icon={Phone}
                theme={theme}
                required={true}
              />
            </View>

            {/* Employment Details */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>
                <Briefcase size={18} color="#2563EB" /> Employment Details
              </Text>
              
              <InputField
                label={t('department')}
                value={formData.department}
                onChangeText={updateFormField('department')}
                placeholder="Engineering, Marketing, etc."
                error={errors.department}
                icon={Building}
                theme={theme}
                required={true}
              />

              <InputField
                label={t('employmentStartDate')}
                value={formData.employmentStartDate}
                onChangeText={updateFormField('employmentStartDate')}
                placeholder="Select start date"
                error={errors.employmentStartDate}
                showDatePicker={true}
                onPress={() => openDatePicker('employmentStartDate')} // FIXED
                theme={theme}
                required={true}
              />
            </View>

            {/* Country & Identification */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>
                <Globe size={18} color="#2563EB" /> Country & Identification
              </Text>
              
              <CountrySelectField
                label={t('country')}
                value={country}
                onValueChange={handleCountryChange}
                options={countryFields.map((countryCode: string) => ({
                  value: countryCode,
                  label: t(countryCode)
                }))}
                error={errors.country}
                theme={theme}
                countryConfig={countryConfig}
              />

              <InputField
                label={t('employeeRef')}
                value={formData.employeeRef}
                onChangeText={updateFormField('employeeRef')}
                placeholder="EMP-001"
                error={errors.employeeRef}
                icon={IdCard}
                theme={theme}
                required={true}
              />

              {countryConfig?.identification && (
                <InputField
                  label={countryConfig.identification.label}
                  value={formData.identificationNumber}
                  onChangeText={updateFormField('identificationNumber')}
                  placeholder={countryConfig.identification.placeholder}
                  error={errors.identificationNumber}
                  icon={IdCard}
                  theme={theme}
                  required={true}
                />
              )}
            </View>
          </View>
        )}

        {/* Optional Fields Section */}
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('optional')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, styles.sectionIconOptional]}>
              <Info size={16} color="#6B7280" />
            </View>
            <View>
              <Text style={styles.sectionHeaderTitle}>Additional Information</Text>
              <Text style={styles.sectionHeaderSubtitle}>
                Optional details - Can add later
              </Text>
            </View>
          </View>
          <ChevronRight 
            size={20} 
            color="#6B7280" 
            style={[styles.sectionChevron, activeSection === 'optional' && styles.sectionChevronOpen]} 
          />
        </TouchableOpacity>

        {activeSection === 'optional' && (
          <View style={styles.sectionContent}>
            {/* Contact & Address */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>
                <MapPin size={18} color="#2563EB" /> Contact Details
              </Text>
              
              <InputField
                label={t('address')}
                value={formData.address}
                onChangeText={updateFormField('address')}
                placeholder="Full address"
                error={errors.address}
                icon={MapPin}
                multiline
                theme={theme}
              />

              <InputField
                label={t('dateOfBirth')}
                value={formData.dateOfBirth}
                onChangeText={updateFormField('dateOfBirth')}
                placeholder="Select date of birth"
                showDatePicker={true}
                onPress={() => openDatePicker('dateOfBirth')} // FIXED
                error={errors.dateOfBirth}
                theme={theme}
              />

              <InputField
                label={t('position')}
                value={formData.position}
                onChangeText={updateFormField('position')}
                placeholder="e.g., Senior Developer"
                error={errors.position}
                icon={Briefcase}
                theme={theme}
              />

              <SelectField
                label={t('employmentType')}
                value={formData.employmentType}
                onValueChange={handleEmploymentTypeChange}
                options={[
                  { value: 'full-time', label: t('fullTime') },
                  { value: 'part-time', label: t('partTime') },
                  { value: 'contract', label: t('contract') },
                  { value: 'temporary', label: t('temporary') }
                ]}
                error={errors.employmentType}
                theme={theme}
              />
            </View>

            {/* Financial Details */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>
                <CreditCard size={18} color="#2563EB" /> Financial Details
              </Text>
              
              {countryConfig?.tax && !countryConfig.tax.readonly && (
                <InputField
                  label={countryConfig.tax.label}
                  value={formData.taxInfo}
                  onChangeText={updateFormField('taxInfo')}
                  placeholder={countryConfig.tax.placeholder}
                  error={errors.taxInfo}
                  icon={CreditCard}
                  theme={theme}
                />
              )}

              <InputField
                label={t('bankAccountNumber')}
                value={formData.bankAccountNumber}
                onChangeText={updateFormField('bankAccountNumber')}
                placeholder="12345678"
                keyboardType="numeric"
                error={errors.bankAccountNumber}
                icon={CreditCard}
                theme={theme}
              />

              {countryConfig?.banking && (
                <InputField
                  label={countryConfig.banking.label}
                  value={formData.bankDetails}
                  onChangeText={updateFormField('bankDetails')}
                  placeholder={countryConfig.banking.placeholder}
                  error={errors.bankDetails}
                  icon={CreditCard}
                  theme={theme}
                />
              )}
            </View>

            {/* Pay & Benefits */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>
                <CurrencyIcon country={country} size={18} color="#2563EB" /> Pay & Benefits
              </Text>
              
              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <InputField
                    label={t('defaultHourlyRate')}
                    value={formData.defaultHourlyRate}
                    onChangeText={updateFormField('defaultHourlyRate')}
                    placeholder="12.50"
                    keyboardType="decimal-pad"
                    error={errors.defaultHourlyRate}
                    icon={() => <CurrencyIcon country={country} />}
                    theme={theme}
                  />
                </View>
                <View style={styles.halfInput}>
                  <InputField
                    label={t('defaultSalary')}
                    value={formData.defaultSalary}
                    onChangeText={updateFormField('defaultSalary')}
                    placeholder="25000"
                    keyboardType="numeric"
                    error={errors.defaultSalary}
                    icon={() => <CurrencyIcon country={country} />}
                    theme={theme}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <InputField
                    label={t('employeePensionRate')}
                    value={formData.employeePensionRate}
                    onChangeText={updateFormField('employeePensionRate')}
                    placeholder="5.0%"
                    keyboardType="decimal-pad"
                    error={errors.employeePensionRate}
                    theme={theme}
                  />
                </View>
                <View style={styles.halfInput}>
                  <InputField
                    label={t('employerPensionRate')}
                    value={formData.employerPensionRate}
                    onChangeText={updateFormField('employerPensionRate')}
                    placeholder="3.0%"
                    keyboardType="decimal-pad"
                    error={errors.employerPensionRate}
                    theme={theme}
                  />
                </View>
              </View>

              <InputField
                label={t('pensionScheme')}
                value={formData.pensionScheme}
                onChangeText={updateFormField('pensionScheme')}
                placeholder="Company Pension Scheme"
                error={errors.pensionScheme}
                icon={Building}
                theme={theme}
              />

              <SelectField
                label={t('pensionSalarySacrifice')}
                value={formData.pensionSalarySacrifice.toString()}
                onValueChange={handlePensionSacrificeChange}
                options={[
                  { value: 'true', label: t('yes') },
                  { value: 'false', label: t('no') }
                ]}
                error={errors.pensionSalarySacrifice}
                theme={theme}
              />
            </View>

            {/* Leave Entitlement */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>
                <Calendar size={18} color="#2563EB" /> Leave Entitlement
              </Text>
              
              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <InputField
                    label={t('annualLeaveDays')}
                    value={formData.annualLeaveEntitlementDays}
                    onChangeText={updateFormField('annualLeaveEntitlementDays')}
                    placeholder="25"
                    keyboardType="numeric"
                    error={errors.annualLeaveEntitlementDays}
                    theme={theme}
                  />
                </View>
                <View style={styles.halfInput}>
                  <InputField
                    label={t('annualLeaveHours')}
                    value={formData.annualLeaveEntitlementHours}
                    onChangeText={updateFormField('annualLeaveEntitlementHours')}
                    placeholder="200"
                    keyboardType="numeric"
                    error={errors.annualLeaveEntitlementHours}
                    theme={theme}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton]} 
          onPress={handleSave}
        >
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>{t('addStaffMember')}</Text>
        </TouchableOpacity>
        
        {/* Form Footer */}
        <View style={styles.formFooter}>
          <Info size={16} color="#6B7280" />
          <Text style={styles.formFooterText}>
            Required fields must be filled to create staff profile
          </Text>
        </View>
      </ScrollView>

      {/* iOS Date Picker Modal - Centered */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(null)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(null)}
          >
            <View style={styles.datePickerModal} onStartShouldSetResponder={() => true}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>
                  Select {showDatePicker === 'employmentStartDate' ? 'Start Date' : 'Date of Birth'}
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(null)}
                  style={styles.closeButton}
                >
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={datePickerValue}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => handleDateChange(showDatePicker!, event, date)}
                  minimumDate={showDatePicker === 'dateOfBirth' ? undefined : new Date()}
                  style={styles.iosPicker}
                  themeVariant={theme === 'dark' ? 'dark' : 'light'}
                />
              </View>
              
              <View style={styles.datePickerActions}>
                <TouchableOpacity 
                  style={styles.datePickerCancelButton}
                  onPress={() => setShowDatePicker(null)}
                >
                  <Text style={styles.datePickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.datePickerDoneButton}
                  onPress={() => {
                    const formattedDate = datePickerValue.toISOString().split('T')[0];
                    updateFormField(showDatePicker!)(formattedDate);
                    setShowDatePicker(null);
                  }}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Android Date Picker */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={datePickerValue}
          mode="date"
          display="default"
          onChange={(event, date) => handleDateChange(showDatePicker!, event, date)}
          minimumDate={showDatePicker === 'dateOfBirth' ? undefined : new Date()}
        />
      )}
    </KeyboardAvoidingView>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    headerCenter: {
      flex: 1,
      marginHorizontal: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      textAlign: 'center',
      marginBottom: 8,
    },
    saveHeaderButton: {
      padding: 8,
      marginRight: -8,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    progressSection: {
      padding: 20,
      paddingBottom: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    progressSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 12,
    },
    progressContainer: {
      alignItems: 'center',
    },
    progressBar: {
      flexDirection: 'row',
      width: '100%',
      height: 4,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      borderRadius: 2,
      marginBottom: 8,
      overflow: 'hidden',
    },
    progressStep: {
      flex: 1,
      height: '100%',
      backgroundColor: 'transparent',
      marginHorizontal: 1,
    },
    progressStepActive: {
      backgroundColor: '#10B981',
    },
    progressStepCurrent: {
      backgroundColor: '#2563EB',
    },
    progressText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    sectionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    sectionIconRequired: {
      backgroundColor: '#10B981',
    },
    sectionIconOptional: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    sectionHeaderTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 2,
    },
    sectionHeaderSubtitle: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    sectionChevron: {
      transform: [{ rotate: '90deg' }],
    },
    sectionChevronOpen: {
      transform: [{ rotate: '-90deg' }],
    },
    sectionContent: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    subsection: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    subsectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    inputGroup: {
      marginBottom: 16,
    },
    labelContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    labelRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#374151',
    },
    requiredIndicator: {
      backgroundColor: '#EF4444',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    requiredIndicatorText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    errorIndicator: {
      marginLeft: 4,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#D1D5DB',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    inputContainerFocused: {
      borderColor: '#2563EB',
      borderWidth: 2,
    },
    inputContainerError: {
      borderColor: '#EF4444',
    },
    datePickerContainer: {
      justifyContent: 'space-between',
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      padding: 0,
    },
    inputWithIcon: {
      marginLeft: 0,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    placeholderText: {
      color: '#9CA3AF',
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    errorText: {
      fontSize: 12,
      color: '#EF4444',
    },
    inputRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    halfInput: {
      flex: 1,
    },
    selectContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    selectOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      minWidth: 100,
    },
    selectOptionActive: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    selectOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
      flex: 1,
    },
    selectOptionTextActive: {
      color: '#FFFFFF',
    },
    selectOptionIcon: {
      marginLeft: 8,
    },
    countrySelect: {
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#D1D5DB',
      padding: 16,
      marginBottom: 8,
    },
    countrySelectOpen: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderColor: '#2563EB',
    },
    countrySelectHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    countrySelectLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    countrySelectText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    countrySelectIcon: {
      transform: [{ rotate: '90deg' }],
    },
    countrySelectIconOpen: {
      transform: [{ rotate: '-90deg' }],
    },
    countryDropdown: {
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderTopWidth: 0,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      overflow: 'hidden',
      marginTop: -1,
      marginBottom: 12,
    },
    countryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#4B5563' : '#F3F4F6',
    },
    countryOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    countryOptionText: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    countryInfoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : '#EFF6FF',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    countryInfoText: {
      fontSize: 13,
      color: isDark ? '#93C5FD' : '#2563EB',
      fontWeight: '500',
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: '#2563EB',
      borderRadius: 14,
      paddingVertical: 18,
      margin: 20,
      marginTop: 30,
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    saveButtonDisabled: {
      backgroundColor: '#9CA3AF',
      shadowColor: 'transparent',
    },
    saveButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    formFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 20,
      paddingTop: 0,
    },
    formFooterText: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    fieldIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    indicatorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    requiredDot: {
      backgroundColor: '#EF4444',
    },
    optionalDot: {
      backgroundColor: '#6B7280',
    },
    indicatorText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    // Modal styles for iOS Date Picker
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    datePickerModal: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      width: width * 0.9,
      maxWidth: 400,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    datePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    datePickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    closeButton: {
      padding: 4,
      marginLeft: 8,
    },
    pickerContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    iosPicker: {
      width: '100%',
      height: 200,
    },
    datePickerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    datePickerCancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      flex: 1,
      marginRight: 8,
      alignItems: 'center',
    },
    datePickerCancelText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    datePickerDoneButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      backgroundColor: '#2563EB',
      flex: 1,
      marginLeft: 8,
      alignItems: 'center',
    },
    datePickerDoneText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}