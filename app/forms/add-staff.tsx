import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, Briefcase, CreditCard, IdCard, Building, PoundSterling } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { staffAPI } from '@/services/api';

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
  theme
}: any) => {
  const styles = createStyles(theme);
  
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
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
const SelectField = ({ label, value, onValueChange, options, error, theme }: any) => {
  const styles = createStyles(theme);
  
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
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

export default function AddStaff() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const styles = createStyles(theme);

  type StaffFormData = {
    // Personal Information
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    dateOfBirth: string;

    // Employment Details
    role: 'staff' | 'admin';
    position: string;
    department: string;
    employmentType: 'full-time' | 'part-time' | 'contract';
    employmentStartDate: string;

    // Payroll Information
    employeeRef: string;
    niNumber: string;
    taxCode: string;
    payFrequency: 'monthly' | 'weekly' | 'bi-weekly' | 'fortnightly';
    paymentMethod: 'BACS' | 'Cheque' | 'Cash';

    // Bank Details
    bankAccountNumber: string;
    bankSortCode: string;

    // Pension Information
    pensionScheme: string;
    employeePensionRate: string;
    pensionSalarySacrifice: boolean;

    // Pay Rates
    defaultHourlyRate: string;
    defaultSalary: string;

    // Leave Entitlement
    annualLeaveEntitlementDays: string;
    annualLeaveEntitlementHours: string;
  };

  const [formData, setFormData] = useState<StaffFormData>({
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
    
    // Payroll Information
    employeeRef: '',
    niNumber: '',
    taxCode: '1257L',
    payFrequency: 'monthly',
    paymentMethod: 'BACS',
    
    // Bank Details
    bankAccountNumber: '',
    bankSortCode: '',
    
    // Pension Information
    pensionScheme: '',
    employeePensionRate: '0',
    pensionSalarySacrifice: false,
    
    // Pay Rates
    defaultHourlyRate: '',
    defaultSalary: '',
    
    // Leave Entitlement
    annualLeaveEntitlementDays: '25',
    annualLeaveEntitlementHours: '200',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = useCallback(() => {
    const newErrors: {[key: string]: string} = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = t('firstNameRequired');
    if (!formData.lastName.trim()) newErrors.lastName = t('lastNameRequired');
    if (!formData.email.trim()) newErrors.email = t('emailRequired');
    if (!formData.employeeRef.trim()) newErrors.employeeRef = t('employeeRefRequired');
    if (!formData.niNumber.trim()) newErrors.niNumber = t('niNumberRequired');
    if (!formData.department.trim()) newErrors.department = t('departmentRequired');
    if (!formData.employmentStartDate.trim()) newErrors.employmentStartDate = t('startDateRequired');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = t('invalidEmail');
    }

    // NI Number validation (basic UK format)
    const niRegex = /^[A-Z]{2}[0-9]{6}[A-Z]{1}$/;
    if (formData.niNumber && !niRegex.test(formData.niNumber.replace(/\s/g, ''))) {
      newErrors.niNumber = t('invalidNiNumber');
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
    // Prepare data for API call
    const staffData = {
      // Personal Info
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone_number: formData.phone || undefined,
      address: formData.address || undefined,
      date_of_birth: formData.dateOfBirth || undefined,
      
      // Employment
      role: formData.role,
      position: formData.position || undefined,
      department: formData.department,
      employment_type: formData.employmentType,
      employment_start_date: formData.employmentStartDate,
      
      // Payroll
      employee_ref: formData.employeeRef,
      ni_number: formData.niNumber,
      tax_code: formData.taxCode,
      pay_frequency: formData.payFrequency,
      payment_method: formData.paymentMethod,
      
      // Bank
      bank_account_number: formData.bankAccountNumber || undefined,
      bank_sort_code: formData.bankSortCode || undefined,
      
      // Pension
      pension_scheme: formData.pensionScheme || undefined,
      employee_pension_rate: parseFloat(formData.employeePensionRate) || 0,
      pension_salary_sacrifice: formData.pensionSalarySacrifice,
      
      // Pay Rates
      default_hourly_rate: formData.defaultHourlyRate ? parseFloat(formData.defaultHourlyRate) : undefined,
      default_salary: formData.defaultSalary ? parseFloat(formData.defaultSalary) : undefined,
      
      // Leave
      annual_leave_entitlement_days: parseInt(formData.annualLeaveEntitlementDays) || 25,
      annual_leave_entitlement_hours: parseInt(formData.annualLeaveEntitlementHours) || 200,
      
      // Temporary password (user should change this later)
      password: 'TempPassword123!', // You might want to generate this or make it configurable
    };

    console.log('Creating staff member:', staffData);
    
    // Make API call
    const response = await staffAPI.createStaff(staffData);
    
    console.log('Staff creation response:', response.data);
    
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
    
    // Handle different error types
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Alert.alert(t('error'), errorMessage);
  }
}, [validateForm, formData, t]);

  const updateFormField = useCallback((field: string) => (value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

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
          />

          <InputField
            label={t('lastName')}
            value={formData.lastName}
            onChangeText={updateFormField('lastName')}
            placeholder={t('enterLastName')}
            error={errors.lastName}
            icon={User}
            theme={theme}
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
          />
        </View>

        {/* Payroll Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('payrollInformation')}</Text>
          
          <InputField
            label={t('employeeRef')}
            value={formData.employeeRef}
            onChangeText={updateFormField('employeeRef')}
            placeholder={t('enterEmployeeRef')}
            error={errors.employeeRef}
            icon={IdCard}
            theme={theme}
          />

          <InputField
            label={t('niNumber')}
            value={formData.niNumber}
            onChangeText={updateFormField('niNumber')}
            placeholder="AB123456C"
            error={errors.niNumber}
            icon={IdCard}
            theme={theme}
          />

          <InputField
            label={t('taxCode')}
            value={formData.taxCode}
            onChangeText={updateFormField('taxCode')}
            placeholder="1257L"
            error={errors.taxCode}
            icon={CreditCard}
            theme={theme}
          />

          <SelectField
            label={t('payFrequency')}
            value={formData.payFrequency}
            onValueChange={updateFormField('payFrequency')}
            options={[
              { value: 'monthly', label: t('monthly') },
              { value: 'weekly', label: t('weekly') },
              { value: 'bi-weekly', label: t('biWeekly') },
              { value: 'fortnightly', label: t('fortnightly') }
            ]}
            error={errors.payFrequency}
            theme={theme}
          />

          <SelectField
            label={t('paymentMethod')}
            value={formData.paymentMethod}
            onValueChange={updateFormField('paymentMethod')}
            options={[
              { value: 'BACS', label: t('bacs') },
              { value: 'Cheque', label: t('cheque') },
              { value: 'Cash', label: t('cash') }
            ]}
            error={errors.paymentMethod}
            theme={theme}
          />
        </View>

        {/* Bank Details Section */}
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

          <InputField
            label={t('bankSortCode')}
            value={formData.bankSortCode}
            onChangeText={updateFormField('bankSortCode')}
            placeholder="12-34-56"
            error={errors.bankSortCode}
            icon={CreditCard}
            theme={theme}
          />
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
            label={t('employeePensionRate')}
            value={formData.employeePensionRate}
            onChangeText={updateFormField('employeePensionRate')}
            placeholder="5.0"
            keyboardType="numeric"
            error={errors.employeePensionRate}
            icon={PoundSterling}
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
            icon={PoundSterling}
            theme={theme}
          />

          <InputField
            label={t('defaultSalary')}
            value={formData.defaultSalary}
            onChangeText={updateFormField('defaultSalary')}
            placeholder="25000"
            keyboardType="numeric"
            error={errors.defaultSalary}
            icon={PoundSterling}
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
  });
}