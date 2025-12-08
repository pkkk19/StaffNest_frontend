import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, Briefcase, CreditCard, IdCard, Building, PoundSterling, DollarSign, Globe, Euro, IndianRupee, AlertCircle } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { staffAPI } from '@/services/api';
import { useCountryForm } from '@/hooks/useCountryForm';

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
  isRequiredField = false
}: any) => {
  const styles = createStyles(theme);
  
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputLabel}>
          {label}
        </Text>
        {required && (
          <View style={styles.requiredIndicator}>
            <Text style={styles.requiredIndicatorText}>Required</Text>
          </View>
        )}
      </View>
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
      <View style={styles.labelContainer}>
        <Text style={styles.inputLabel}>
          {label}
        </Text>
        {required && (
          <View style={styles.requiredIndicator}>
            <Text style={styles.requiredIndicatorText}>Required</Text>
          </View>
        )}
      </View>
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
    AE: DollarSign, // UAE uses AED, but DollarSign is closest
  };
  
  const IconComponent = currencyIcons[country || 'UK'] || PoundSterling;
  return <IconComponent size={size} color={color} />;
};

// Field Indicator Component
const FieldIndicator = ({ type = 'required' }: { type?: 'required' | 'optional' }) => {
  const styles = createStyles('light'); // Use light theme for consistent colors
  
  return (
    <View style={styles.fieldIndicator}>
      <View style={[
        styles.indicatorDot, 
        type === 'required' ? styles.requiredDot : styles.optionalDot
      ]} />
      <Text style={styles.indicatorText}>
        {type === 'required' ? 'Required Field' : 'Optional Field'}
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
    
    // Employment Details (REQUIRED)
    department: '',
    employmentStartDate: '',
    
    // Country Selection (REQUIRED)
    country: 'UK',
    
    // Employee Identification (REQUIRED)
    employeeRef: '',
    identificationNumber: '',
    
    // Personal Information (OPTIONAL)
    phone: '',
    address: '',
    dateOfBirth: '',
    
    // Employment Details (OPTIONAL)
    position: '',
    employmentType: 'full-time',
    
    // Banking (OPTIONAL)
    bankAccountNumber: '',
    bankDetails: '', // sort_code, routing_number, bsb_code, etc.
    
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

  const validateForm = useCallback(() => {
    const newErrors: {[key: string]: string} = {};

    // Required fields - MUST FILL
    if (!formData.firstName.trim()) newErrors.firstName = t('firstNameRequired');
    if (!formData.lastName.trim()) newErrors.lastName = t('lastNameRequired');
    if (!formData.email.trim()) newErrors.email = t('emailRequired');
    if (!formData.employeeRef.trim()) newErrors.employeeRef = t('employeeRefRequired');
    if (!formData.identificationNumber.trim()) newErrors.identificationNumber = t('identificationRequired');
    if (!formData.department.trim()) newErrors.department = t('departmentRequired');
    if (!formData.employmentStartDate.trim()) newErrors.employmentStartDate = t('startDateRequired');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = t('invalidEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

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
        phone_number: formData.phone || undefined,
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
  }, []);

  // Update country and reset country-specific fields
  const handleCountryChange = useCallback((newCountry: string) => {
    setCountry(newCountry);
    updateFormField('country')(newCountry);
    // Reset country-specific fields
    updateFormField('identificationNumber')('');
    updateFormField('taxInfo')('');
    updateFormField('bankDetails')('');
  }, [updateFormField, setCountry]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('addStaffMember')}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Save size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Required Fields Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>Required Information</Text>
          <Text style={styles.sectionHeaderSubtitle}>
            Fill in these fields to create a staff member
          </Text>
          <FieldIndicator type="required" />
        </View>

        {/* Personal Information - REQUIRED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personalInformation')}</Text>
          
          <InputField
            label={t('firstName')}
            value={formData.firstName}
            onChangeText={updateFormField('firstName')}
            placeholder={t('enterFirstName')}
            error={errors.firstName}
            icon={User}
            theme={theme}
            required={true}
          />

          <InputField
            label={t('lastName')}
            value={formData.lastName}
            onChangeText={updateFormField('lastName')}
            placeholder={t('enterLastName')}
            error={errors.lastName}
            icon={User}
            theme={theme}
            required={true}
          />

          <InputField
            label={t('email')}
            value={formData.email}
            onChangeText={updateFormField('email')}
            placeholder={t('enterEmail')}
            keyboardType="email-address"
            error={errors.email}
            icon={Mail}
            theme={theme}
            required={true}
          />
        </View>

        {/* Employment Details - REQUIRED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('employmentDetails')}</Text>

          <InputField
            label={t('department')}
            value={formData.department}
            onChangeText={updateFormField('department')}
            placeholder={t('enterDepartment')}
            error={errors.department}
            icon={Building}
            theme={theme}
            required={true}
          />

          <InputField
            label={t('employmentStartDate')}
            value={formData.employmentStartDate}
            onChangeText={updateFormField('employmentStartDate')}
            placeholder="YYYY-MM-DD"
            error={errors.employmentStartDate}
            icon={Calendar}
            theme={theme}
            required={true}
          />
        </View>

        {/* Country Selection - REQUIRED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('countryConfiguration')}</Text>
          
          <SelectField
            label={t('country')}
            value={country}
            onValueChange={handleCountryChange}
            options={countryFields.map((countryCode: string) => ({
              value: countryCode,
              label: t(countryCode)
            }))}
            error={errors.country}
            theme={theme}
            required={true}
          />

          {countryConfig && (
            <View style={styles.countryInfo}>
              <View style={styles.currencyRow}>
                <CurrencyIcon country={country} />
                <Text style={styles.countryInfoText}>
                  {t('selectedCountry')}: {t(country)} - {t('currency')}: {countryConfig.currency}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Employee Identification - REQUIRED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('employeeIdentification')}</Text>
          
          <InputField
            label={t('employeeRef')}
            value={formData.employeeRef}
            onChangeText={updateFormField('employeeRef')}
            placeholder={t('enterEmployeeRef')}
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

          {countryConfig?.tax?.readonly && (
            <View style={styles.readonlyField}>
              <View style={styles.labelContainer}>
                <Text style={styles.readonlyLabel}>{countryConfig.tax.label}</Text>
                <View style={[styles.requiredIndicator, styles.optionalIndicator]}>
                  <Text style={styles.requiredIndicatorText}>Auto-filled</Text>
                </View>
              </View>
              <Text style={styles.readonlyValue}>{countryConfig.tax.value}</Text>
            </View>
          )}
        </View>

        {/* Divider between required and optional sections */}
        <View style={styles.sectionDivider}>
          <View style={styles.dividerLine} />
          <View style={styles.optionalSectionHeader}>
            <Text style={styles.optionalSectionTitle}>Additional Information</Text>
            <Text style={styles.optionalSectionSubtitle}>
              Optional details - Can be added later
            </Text>
            <FieldIndicator type="optional" />
          </View>
          <View style={styles.dividerLine} />
        </View>

        {/* Personal Information - OPTIONAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contactDetails')}</Text>
          
          <InputField
            label={t('phone')}
            value={formData.phone}
            onChangeText={updateFormField('phone')}
            placeholder={t('enterPhone')}
            keyboardType="phone-pad"
            error={errors.phone}
            icon={Phone}
            theme={theme}
          />

          <InputField
            label={t('address')}
            value={formData.address}
            onChangeText={updateFormField('address')}
            placeholder={t('enterAddress')}
            error={errors.address}
            icon={MapPin}
            multiline
            theme={theme}
          />

          <InputField
            label={t('dateOfBirth')}
            value={formData.dateOfBirth}
            onChangeText={updateFormField('dateOfBirth')}
            placeholder="YYYY-MM-DD"
            error={errors.dateOfBirth}
            icon={Calendar}
            theme={theme}
          />

          <InputField
            label={t('position')}
            value={formData.position}
            onChangeText={updateFormField('position')}
            placeholder={t('enterPosition')}
            error={errors.position}
            icon={Briefcase}
            theme={theme}
          />

          <SelectField
            label={t('employmentType')}
            value={formData.employmentType}
            onValueChange={updateFormField('employmentType')}
            options={[
              { value: 'full-time', label: t('fullTime') },
              { value: 'part-time', label: t('partTime') },
              { value: 'contract', label: t('contract') }
            ]}
            error={errors.employmentType}
            theme={theme}
          />
        </View>

        {/* Tax Information - OPTIONAL */}
        {countryConfig?.tax && !countryConfig.tax.readonly && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('taxInformation')}</Text>
            
            <InputField
              label={countryConfig.tax.label}
              value={formData.taxInfo}
              onChangeText={updateFormField('taxInfo')}
              placeholder={countryConfig.tax.placeholder}
              error={errors.taxInfo}
              icon={CreditCard}
              theme={theme}
            />
          </View>
        )}

        {/* Banking Details - OPTIONAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('bankDetails')}</Text>
          
          <InputField
            label={t('bankAccountNumber')}
            value={formData.bankAccountNumber}
            onChangeText={updateFormField('bankAccountNumber')}
            placeholder={t('enterBankAccountNumber')}
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

        {/* Pension & Pay Rates - OPTIONAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('pensionAndPay')}</Text>
          
          <InputField
            label={t('pensionScheme')}
            value={formData.pensionScheme}
            onChangeText={updateFormField('pensionScheme')}
            placeholder={t('enterPensionScheme')}
            error={errors.pensionScheme}
            icon={Building}
            theme={theme}
          />

          <InputField
            label={t('employeePensionRate') + ' (%)'}
            value={formData.employeePensionRate}
            onChangeText={updateFormField('employeePensionRate')}
            placeholder="5.0"
            keyboardType="numeric"
            error={errors.employeePensionRate}
            icon={() => <CurrencyIcon country={country} />}
            theme={theme}
          />

          <InputField
            label={t('employerPensionRate') + ' (%)'}
            value={formData.employerPensionRate}
            onChangeText={updateFormField('employerPensionRate')}
            placeholder="3.0"
            keyboardType="numeric"
            error={errors.employerPensionRate}
            icon={() => <CurrencyIcon country={country} />}
            theme={theme}
          />

          <SelectField
            label={t('pensionSalarySacrifice')}
            value={formData.pensionSalarySacrifice.toString()}
            onValueChange={(value: string) => updateFormField('pensionSalarySacrifice')(value === 'true')}
            options={[
              { value: 'true', label: t('yes') },
              { value: 'false', label: t('no') }
            ]}
            error={errors.pensionSalarySacrifice}
            theme={theme}
          />

          <InputField
            label={t('defaultHourlyRate')}
            value={formData.defaultHourlyRate}
            onChangeText={updateFormField('defaultHourlyRate')}
            placeholder="12.50"
            keyboardType="numeric"
            error={errors.defaultHourlyRate}
            icon={() => <CurrencyIcon country={country} />}
            theme={theme}
          />

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

          <InputField
            label={t('annualLeaveEntitlementDays')}
            value={formData.annualLeaveEntitlementDays}
            onChangeText={updateFormField('annualLeaveEntitlementDays')}
            placeholder="25"
            keyboardType="numeric"
            error={errors.annualLeaveEntitlementDays}
            theme={theme}
          />

          <InputField
            label={t('annualLeaveEntitlementHours')}
            value={formData.annualLeaveEntitlementHours}
            onChangeText={updateFormField('annualLeaveEntitlementHours')}
            placeholder="200"
            keyboardType="numeric"
            error={errors.annualLeaveEntitlementHours}
            theme={theme}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('addStaffMember')}</Text>
        </TouchableOpacity>
        
        <View style={styles.formFooter}>
          <Text style={styles.formFooterText}>
            All required fields must be filled to create a staff member.
          </Text>
          <Text style={styles.formFooterText}>
            Optional fields can be updated later in staff settings.
          </Text>
        </View>
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
    sectionHeader: {
      padding: 20,
      paddingBottom: 10,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    sectionHeaderTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    sectionHeaderSubtitle: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 12,
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
    sectionDivider: {
      marginVertical: 20,
      paddingHorizontal: 20,
    },
    dividerLine: {
      height: 1,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      marginVertical: 10,
    },
    optionalSectionHeader: {
      paddingVertical: 10,
      alignItems: 'center',
    },
    optionalSectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    optionalSectionSubtitle: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 12,
      textAlign: 'center',
    },
    inputGroup: {
      marginBottom: 20,
    },
    labelContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    requiredIndicator: {
      backgroundColor: '#EF4444',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    optionalIndicator: {
      backgroundColor: '#6B7280',
    },
    requiredIndicatorText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
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
    errorText: {
      fontSize: 12,
      color: '#EF4444',
      marginTop: 4,
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
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    countryInfo: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    currencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    countryInfoText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
      textAlign: 'center',
    },
    readonlyField: {
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      marginBottom: 16,
    },
    readonlyLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    readonlyValue: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      marginTop: 8,
    },
    fieldIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    formFooter: {
      padding: 20,
      paddingTop: 0,
      alignItems: 'center',
    },
    formFooterText: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      marginBottom: 4,
    },
  });
}