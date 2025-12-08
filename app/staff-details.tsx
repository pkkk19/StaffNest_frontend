import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, Edit2, Phone, Mail, MapPin, Calendar, Clock, FileText, User, Briefcase, Building, CreditCard, DollarSign, PoundSterling, IndianRupee, Euro, Globe, Heart, PhoneCall, IdCard } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { staffAPI } from '@/services/api';
import ForceTouchable from '@/components/ForceTouchable';

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
  
  // Employment details
  employment?: {
    employment_type?: string;
    start_date?: string;
    working_hours_per_week?: number;
    department?: string;
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
    tax_id?: string;
    filing_status?: string;
  };
  
  // Payment method
  payment_method?: {
    method?: string;
    account_number?: string;
    sort_code?: string;
    routing_number?: string;
    bsb_code?: string;
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

const InfoCard = ({ icon: Icon, title, value, theme, onPress, isEditable = false }: any) => {
  const styles = createStyles(theme);
  
  return (
    <ForceTouchable style={styles.infoCard} onPress={onPress}>
      <Icon size={20} color="#2563EB" />
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
      </View>
      {isEditable && (
        <Edit2 size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      )}
    </ForceTouchable>
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

// Format date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Not set';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export default function StaffDetails() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const staffId = params.id as string;
  
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = createStyles(theme);

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
      setStaffMember(response.data);
    } catch (error: any) {
      console.error('Failed to load staff details:', error);
      
      let errorMessage = 'Failed to load staff details. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      Alert.alert('Error', errorMessage, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return '??';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status?: string) => {
    switch ((status || 'active').toLowerCase()) {
      case 'active': return '#10B981';
      case 'inactive': return '#EF4444';
      case 'on leave': return '#F59E0B';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (isActive?: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getCountrySpecificId = (identification?: any) => {
    if (!identification) return 'Not set';
    
    if (identification.ni_number) return `NI: ${identification.ni_number}`;
    if (identification.ssn) return `SSN: ${identification.ssn}`;
    if (identification.tfn) return `TFN: ${identification.tfn}`;
    if (identification.pan) return `PAN: ${identification.pan}`;
    if (identification.uae_id) return `UAE ID: ${identification.uae_id}`;
    
    return 'Not set';
  };

  const getBankDetails = (payment_method?: any) => {
    if (!payment_method) return 'Not set';
    
    const { method, account_number, sort_code, routing_number, bsb_code } = payment_method;
    let details = `${method || 'Bank Transfer'}`;
    
    if (account_number) details += ` • Acc: ****${account_number.slice(-4)}`;
    if (sort_code) details += ` • Sort: ${sort_code}`;
    if (routing_number) details += ` • Routing: ${routing_number}`;
    if (bsb_code) details += ` • BSB: ${bsb_code}`;
    
    return details;
  };

  const handleEditStaff = () => {
    if (staffMember && user?.role === 'admin') {
      router.push(`/forms/edit-staff?id=${staffMember._id}`);
    }
  };

  const handleEditField = (fieldType: string) => {
    Alert.alert('Edit Feature', `Edit ${fieldType} functionality will be implemented soon.`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </TouchableOpacity>
          <Text style={styles.title}>Staff Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading staff details...</Text>
        </View>
      </View>
    );
  }

  if (error || !staffMember) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </TouchableOpacity>
          <Text style={styles.title}>Staff Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContent}>
          <View style={styles.errorIcon}>
            <User size={48} color="#EF4444" />
          </View>
          <Text style={styles.errorText}>{error || 'Staff member not found'}</Text>
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

  const isAdmin = user?.role === 'admin';
  const isEditable = isAdmin;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </TouchableOpacity>
        <Text style={styles.title}>Staff Details</Text>
        {isEditable && (
          <TouchableOpacity onPress={handleEditStaff}>
            <Edit2 size={24} color="#2563EB" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {staffMember.profile_picture_url ? (
            <Image 
              source={{ uri: staffMember.profile_picture_url }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {getInitials(staffMember.first_name, staffMember.last_name)}
              </Text>
            </View>
          )}
          
          <Text style={styles.staffName}>
            {staffMember.first_name} {staffMember.last_name}
          </Text>
          
          <Text style={styles.staffRole}>
            {staffMember.position || staffMember.role}
            {staffMember.employment?.department && ` • ${staffMember.employment.department}`}
          </Text>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(staffMember.status) }]}>
            <Text style={styles.statusText}>
              {getStatusText(staffMember.is_active)}
            </Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {isEditable && (
              <TouchableOpacity 
                style={styles.editSectionButton}
                onPress={() => handleEditField('personal information')}
              >
                <Edit2 size={16} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>
          
          <InfoCard
            icon={Mail}
            title="Email"
            value={staffMember.email}
            theme={theme}
            onPress={() => handleEditField('email')}
            isEditable={isEditable}
          />
          
          <InfoCard
            icon={Phone}
            title="Phone"
            value={staffMember.phone_number}
            theme={theme}
            onPress={() => handleEditField('phone')}
            isEditable={isEditable}
          />
          
          <InfoCard
            icon={MapPin}
            title="Address"
            value={staffMember.address}
            theme={theme}
            onPress={() => handleEditField('address')}
            isEditable={isEditable}
          />
          
          <InfoCard
            icon={Calendar}
            title="Date of Birth"
            value={formatDate(staffMember.date_of_birth)}
            theme={theme}
            onPress={() => handleEditField('date of birth')}
            isEditable={isEditable}
          />
          
          <InfoCard
            icon={Globe}
            title="Country"
            value={staffMember.country || 'Not set'}
            theme={theme}
            onPress={() => handleEditField('country')}
            isEditable={isEditable}
          />
        </View>

        {/* Employment Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Employment Details</Text>
            {isEditable && (
              <TouchableOpacity 
                style={styles.editSectionButton}
                onPress={() => handleEditField('employment details')}
              >
                <Edit2 size={16} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>
          
          <InfoCard
            icon={FileText}
            title="Employee Reference"
            value={staffMember.identification?.employee_ref}
            theme={theme}
            onPress={() => handleEditField('employee reference')}
            isEditable={isEditable}
          />
          
          <InfoCard
            icon={IdCard}
            title="National ID"
            value={getCountrySpecificId(staffMember.identification)}
            theme={theme}
            onPress={() => handleEditField('national ID')}
            isEditable={isEditable}
          />
          
          <InfoCard
            icon={Briefcase}
            title="Position"
            value={staffMember.position}
            theme={theme}
            onPress={() => handleEditField('position')}
            isEditable={isEditable}
          />
          
          <InfoCard
            icon={Building}
            title="Department"
            value={staffMember.employment?.department || staffMember.department}
            theme={theme}
            onPress={() => handleEditField('department')}
            isEditable={isEditable}
          />
          
          <InfoCard
            icon={Calendar}
            title="Start Date"
            value={formatDate(staffMember.employment?.start_date)}
            theme={theme}
            onPress={() => handleEditField('start date')}
            isEditable={isEditable}
          />
          
          <InfoCard
            icon={Clock}
            title="Employment Type"
            value={staffMember.employment?.employment_type || 'Full-time'}
            theme={theme}
            onPress={() => handleEditField('employment type')}
            isEditable={isEditable}
          />
        </View>

        {/* Financial Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Financial Information</Text>
            {isEditable && (
              <TouchableOpacity 
                style={styles.editSectionButton}
                onPress={() => handleEditField('financial information')}
              >
                <Edit2 size={16} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>
          
          {staffMember.tax_info && (
            <>
              {staffMember.tax_info.tax_code && (
                <InfoCard
                  icon={CreditCard}
                  title="Tax Code"
                  value={staffMember.tax_info.tax_code}
                  theme={theme}
                  onPress={() => handleEditField('tax code')}
                  isEditable={isEditable}
                />
              )}
              
              {staffMember.tax_info.filing_status && (
                <InfoCard
                  icon={CreditCard}
                  title="Filing Status"
                  value={staffMember.tax_info.filing_status}
                  theme={theme}
                  onPress={() => handleEditField('filing status')}
                  isEditable={isEditable}
                />
              )}
            </>
          )}
          
          {staffMember.pay_rates && (
            <>
              {staffMember.pay_rates.default_hourly_rate && (
                <InfoCard
                  icon={() => <CurrencyIcon country={staffMember.country} />}
                  title="Hourly Rate"
                  value={`${staffMember.pay_rates.default_hourly_rate}/hour`}
                  theme={theme}
                  onPress={() => handleEditField('hourly rate')}
                  isEditable={isEditable}
                />
              )}
              
              {staffMember.pay_rates.default_salary && (
                <InfoCard
                  icon={() => <CurrencyIcon country={staffMember.country} />}
                  title="Annual Salary"
                  value={`${staffMember.pay_rates.default_salary}/year`}
                  theme={theme}
                  onPress={() => handleEditField('salary')}
                  isEditable={isEditable}
                />
              )}
            </>
          )}
          
          <InfoCard
            icon={CreditCard}
            title="Bank Details"
            value={getBankDetails(staffMember.payment_method)}
            theme={theme}
            onPress={() => handleEditField('bank details')}
            isEditable={isEditable}
          />
          
          {staffMember.pension && (
            <>
              {staffMember.pension.scheme_name && (
                <InfoCard
                  icon={Building}
                  title="Pension Scheme"
                  value={staffMember.pension.scheme_name}
                  theme={theme}
                  onPress={() => handleEditField('pension scheme')}
                  isEditable={isEditable}
                />
              )}
              
              {(staffMember.pension.employee_contribution_rate || staffMember.pension.employer_contribution_rate) && (
                <InfoCard
                  icon={Percent}
                  title="Pension Contributions"
                  value={`Employee: ${staffMember.pension.employee_contribution_rate || 0}% • Employer: ${staffMember.pension.employer_contribution_rate || 0}%`}
                  theme={theme}
                  onPress={() => handleEditField('pension contributions')}
                  isEditable={isEditable}
                />
              )}
            </>
          )}
        </View>

        {/* Leave Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leave Information</Text>
            {isEditable && (
              <TouchableOpacity 
                style={styles.editSectionButton}
                onPress={() => handleEditField('leave information')}
              >
                <Edit2 size={16} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>
          
          {staffMember.leave_config && (
            <>
              <InfoCard
                icon={Calendar}
                title="Annual Leave Days"
                value={`${staffMember.leave_config.annual_leave_days || 25} days`}
                theme={theme}
                onPress={() => handleEditField('annual leave')}
                isEditable={isEditable}
              />
              
              <InfoCard
                icon={Calendar}
                title="Annual Leave Hours"
                value={`${staffMember.leave_config.annual_leave_hours || 200} hours`}
                theme={theme}
                onPress={() => handleEditField('annual leave hours')}
                isEditable={isEditable}
              />
            </>
          )}
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            {isEditable && (
              <TouchableOpacity 
                style={styles.editSectionButton}
                onPress={() => handleEditField('emergency contact')}
              >
                <Edit2 size={16} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>
          
          {staffMember.emergency_contact ? (
            <>
              <InfoCard
                icon={User}
                title="Contact Name"
                value={staffMember.emergency_contact.name}
                theme={theme}
                onPress={() => handleEditField('emergency contact name')}
                isEditable={isEditable}
              />
              
              <InfoCard
                icon={PhoneCall}
                title="Contact Phone"
                value={staffMember.emergency_contact.phone}
                theme={theme}
                onPress={() => handleEditField('emergency contact phone')}
                isEditable={isEditable}
              />
              
              {staffMember.emergency_contact.relationship && (
                <InfoCard
                  icon={Heart}
                  title="Relationship"
                  value={staffMember.emergency_contact.relationship}
                  theme={theme}
                  onPress={() => handleEditField('emergency contact relationship')}
                  isEditable={isEditable}
                />
              )}
              
              {staffMember.emergency_contact.email && (
                <InfoCard
                  icon={Mail}
                  title="Contact Email"
                  value={staffMember.emergency_contact.email}
                  theme={theme}
                  onPress={() => handleEditField('emergency contact email')}
                  isEditable={isEditable}
                />
              )}
            </>
          ) : (
            <View style={styles.emptyInfoCard}>
              <Heart size={20} color="#9CA3AF" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Emergency Contact</Text>
                <Text style={[styles.infoValue, { color: '#9CA3AF' }]}>No emergency contact set</Text>
              </View>
              {isEditable && (
                <TouchableOpacity onPress={() => handleEditField('emergency contact')}>
                  <Text style={styles.addContactText}>Add Contact</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Admin Actions */}
        {isAdmin && (
          <View style={styles.actionButtons}>
            <ForceTouchable 
              style={styles.primaryButton}
              onPress={() => router.push(`/payslips?staffId=${staffMember._id}`)}
            >
              <Text style={styles.primaryButtonText}>View Payslips</Text>
            </ForceTouchable>
            
            <ForceTouchable 
              style={styles.secondaryButton}
              onPress={() => router.push({
                pathname: '/time-history',
                params: { staffId: staffMember._id, staffName: `${staffMember.first_name} ${staffMember.last_name}`}
              })}
            >
              <Text style={styles.secondaryButtonText}>View Time History</Text>
            </ForceTouchable>
            
            <ForceTouchable 
              style={styles.warningButton}
              onPress={() => {
                Alert.alert(
                  'Deactivate Staff',
                  `Are you sure you want to ${staffMember.is_active ? 'deactivate' : 'activate'} ${staffMember.first_name}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Confirm', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          // Implement activate/deactivate API call
                          Alert.alert('Success', `Staff ${staffMember.is_active ? 'deactivated' : 'activated'} successfully.`);
                        } catch (error) {
                          Alert.alert('Error', 'Failed to update staff status.');
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.warningButtonText}>
                {staffMember.is_active ? 'Deactivate Staff' : 'Activate Staff'}
              </Text>
            </ForceTouchable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Custom Percent icon since it's not in lucide-react-native
const Percent = ({ size = 20, color = "#2563EB" }: { size?: number; color?: string }) => (
  <Text style={{ fontSize: size, color, fontWeight: 'bold' }}>%</Text>
);

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
    errorIcon: {
      marginBottom: 20,
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
    profileSection: {
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
      ...Platform.select({
        android: { elevation: 3 },
      }),
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 16,
      borderWidth: 3,
      borderColor: isDark ? '#374151' : '#FFFFFF',
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    staffName: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
      textAlign: 'center',
    },
    staffRole: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 12,
      textAlign: 'center',
    },
    statusBadge: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    section: {
      padding: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      marginTop: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    editSectionButton: {
      padding: 4,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      ...Platform.select({
        android: { elevation: 2 },
      }),
    },
    emptyInfoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderStyle: 'dashed',
    },
    infoContent: {
      flex: 1,
      marginLeft: 12,
    },
    infoTitle: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    addContactText: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '600',
    },
    actionButtons: {
      padding: 20,
      gap: 12,
    },
    primaryButton: {
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      ...Platform.select({
        android: { elevation: 5 },
      }),
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryButton: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      ...Platform.select({
        android: { elevation: 3 },
      }),
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    warningButton: {
      backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
      ...Platform.select({
        android: { elevation: 3 },
      }),
    },
    warningButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FCA5A5' : '#DC2626',
    },
  });
}