import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, Briefcase, CreditCard, IdCard, Building, PoundSterling, DollarSign, Globe, Euro, IndianRupee } from 'lucide-react-native';
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
    AE: DollarSign, // UAE uses AED, but DollarSign is closest
  };
  
  const IconComponent = currencyIcons[country || 'UK'] || PoundSterling;
  return <IconComponent size={size} color={color} />;
};

export default function AddStaff() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const styles = createStyles(theme);

  // Use country form hook
  const { country, setCountry, countryConfig, countryFields } = useCountryForm('UK') as any;

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    
    // Employment Details
    role: 'staff',
    position: '',
    department: '',
    employmentType: 'full-time',
    employmentStartDate: '',
    
    // Country Selection
    country: 'UK',
    
    // Employee Identification (will vary by country)
    employeeRef: '',
    identificationNumber: '',
    
    // Banking
    bankAccountNumber: '',
    bankDetails: '', // sort_code, routing_number, bsb_code, etc.
    
    // Tax Information (will vary by country)
    taxInfo: '',
    
    // Pay Rates
    defaultHourlyRate: '',
    defaultSalary: '',
    
    // Pension
    employeePensionRate: '0',
    employerPensionRate: '0',
    pensionSalarySacrifice: false,
    pensionScheme: '',
    
    // Leave
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
        // Core Info
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone || undefined,
        address: formData.address || undefined,
        date_of_birth: formData.dateOfBirth || undefined,
        
        // Employment
        role: formData.role as 'staff' | 'admin',
        position: formData.position || undefined,
        department: formData.department,
        employment: {
          employment_type: formData.employmentType,
          start_date: formData.employmentStartDate,
        },
        
        // Country
        country: formData.country,
        
        // Identification (country-specific)
        identification: {
          employee_ref: formData.employeeRef,
          [countryConfig?.identification?.key || 'ni_number']: formData.identificationNumber
        },
        
        // Tax Info (country-specific)
        tax_info: countryConfig?.tax?.key ? {
          [countryConfig.tax.key]: formData.taxInfo || countryConfig.tax.value
        } : {},
        
        // Payment Method
        payment_method: {
          method: 'BACS', // Default, can be made dynamic
          account_number: formData.bankAccountNumber,
          ...(countryConfig?.banking?.key && { 
            [countryConfig.banking.key]: formData.bankDetails 
          })
        },
        
        // Pay Rates
        pay_rates: {
          ...(formData.defaultHourlyRate && { 
            default_hourly_rate: parseFloat(formData.defaultHourlyRate) 
          }),
          ...(formData.defaultSalary && { 
            default_salary: parseFloat(formData.defaultSalary) 
          }),
        },
        
        // Pension
        pension: {
          scheme_name: formData.pensionScheme || undefined,
          employee_contribution_rate: parseFloat(formData.employeePensionRate) || 0,
          employer_contribution_rate: parseFloat(formData.employerPensionRate) || 0,
          pension_salary_sacrifice: formData.pensionSalarySacrifice,
        },
        
        // Leave configuration
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
  }, [validateForm, formData, countryConfig, t]);

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
        {/* Required Fields Notice */}
        <View style={styles.requiredNotice}>
          <Text style={styles.requiredNoticeText}>
            {t('requiredFieldsNotice')}
          </Text>
        </View>

        {/* Country Selection */}
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

        {/* Personal Information Section */}
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
        </View>

        {/* Employment Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('employmentDetails')}</Text>
          
          <SelectField
            label={t('role')}
            value={formData.role}
            onValueChange={updateFormField('role')}
            options={[
              { value: 'admin', label: t('admin') },
              { value: 'staff', label: t('staff') }
            ]}
            error={errors.role}
            theme={theme}
            required={true}
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
        
        {/* Country-Specific Identification */}
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

          {countryConfig?.tax?.readonly && (
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyLabel}>{countryConfig.tax.label}</Text>
              <Text style={styles.readonlyValue}>{countryConfig.tax.value}</Text>
            </View>
          )}
        </View>

        {/* Banking Details */}
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

        {/* Pension & Pay Rates Section */}
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

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('addStaffMember')}</Text>
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
    section: {
      padding: 20,
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
      marginBottom: 4,
    },
    readonlyValue: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    requiredStar: {
      color: '#EF4444',
      fontSize: 16,
    },
    requiredNotice: {
      backgroundColor: isDark ? '#1F2937' : '#EFF6FF',
      padding: 12,
      marginHorizontal: 20,
      marginTop: 10,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#2563EB',
    },
    requiredNoticeText: {
      fontSize: 12,
      color: isDark ? '#D1D5DB' : '#374151',
      fontWeight: '500',
    },
  });
}