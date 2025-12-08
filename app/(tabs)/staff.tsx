import { View, Text, ScrollView, StyleSheet, TextInput, Platform, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Search, Plus, User, Phone, Mail, Users, Building, AlertCircle } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import ForceTouchable from '@/components/ForceTouchable';
import { staffAPI } from '@/services/api';

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
}

export default function Staff() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = createStyles(theme);

  // Check if user is admin and has company
  const isAdmin = user?.role === 'admin';
  const hasCompany = !!user?.company_id;

  useEffect(() => {
    if (isAuthenticated) {
      checkAccessAndLoadStaff();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStaff(staffMembers);
    } else {
      const filtered = staffMembers.filter(staff => {
        const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase();
        const searchLower = searchQuery.toLowerCase();
        
        return fullName.includes(searchLower) ||
               (staff.email?.toLowerCase() || '').includes(searchLower) ||
               (staff.position?.toLowerCase() || '').includes(searchLower) ||
               (staff.department?.toLowerCase() || '').includes(searchLower) ||
               staff.role.toLowerCase().includes(searchLower);
      });
      setFilteredStaff(filtered);
    }
  }, [searchQuery, staffMembers]);

  const checkAccessAndLoadStaff = async () => {
    // Check 1: User must be authenticated
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Check 2: User must be admin
    if (!isAdmin) {
      setError('You do not have permission to access this page.');
      setLoading(false);
      return;
    }

    // Check 3: Admin must have company ID
    if (!hasCompany) {
      Alert.alert(
        'Company Setup Required',
        'You need to set up your company before you can manage staff.',
        [
          {
            text: 'Set Up Company',
            onPress: () => router.push('/forms/company-setup')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      setError('Please set up your company first.');
      setLoading(false);
      return;
    }

    // All checks passed, load staff
    await loadStaff();
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch staff from your backend - this automatically filters by company
      const response = await staffAPI.getStaff();
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response from server');
      }
      
      // Transform API data to match our component structure
      const formattedStaff = response.data.map((staff: any) => ({
        _id: staff._id,
        first_name: staff.first_name,
        last_name: staff.last_name,
        email: staff.email,
        phone_number: staff.phone_number || 'Not provided',
        role: staff.role,
        position: staff.position || 'Staff',
        department: staff.employment?.department || staff.department || 'General',
        status: staff.is_active ? 'Active' : 'Inactive',
        company_id: staff.company_id,
        is_active: staff.is_active,
        profile_picture_url: staff.profile_picture_url
      }));
      
      setStaffMembers(formattedStaff);
      setFilteredStaff(formattedStaff);
    } catch (error: any) {
      console.error('Failed to load staff:', error);
      
      let errorMessage = 'Failed to load staff. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setStaffMembers([]);
      setFilteredStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStaff();
    setRefreshing(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#10B981';
      case 'inactive': return '#EF4444';
      case 'on leave': return '#F59E0B';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleAddStaff = () => {
    if (!hasCompany) {
      Alert.alert(
        'Company Setup Required',
        'You need to set up your company before adding staff.',
        [
          {
            text: 'Set Up Company',
            onPress: () => router.push('/forms/company-setup')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }
    router.push('/forms/add-staff');
  };

  // Handle no company case
  if (!hasCompany && isAdmin && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('staff') || 'Staff Management'}</Text>
        </View>
        <View style={styles.emptyState}>
          <Building size={64} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <Text style={styles.emptyStateTitle}>Company Setup Required</Text>
          <Text style={styles.emptyStateText}>
            You need to set up your company before you can manage staff.
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => router.push('/forms/company-setup')}
          >
            <Text style={styles.setupButtonText}>Set Up Company</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Handle non-admin access
  if (!isAdmin && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('staff') || 'Staff Management'}</Text>
        </View>
        <View style={styles.centerContent}>
          <AlertCircle size={64} color="#EF4444" />
          <Text style={styles.errorText}>
            You do not have permission to access this page.
          </Text>
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

  // Handle loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('staff') || 'Staff Management'}</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading staff...</Text>
        </View>
      </View>
    );
  }

  // Handle error state
  if (error && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('staff') || 'Staff Management'}</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddStaff}
            disabled={!hasCompany}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <AlertCircle size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadStaff}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('staff') || 'Staff Management'}</Text>
        {hasCompany && (
          <ForceTouchable 
            style={styles.addButton}
            onPress={handleAddStaff}
          >
            <Plus size={24} color="#FFFFFF" />
          </ForceTouchable>
        )}
      </View>

      {staffMembers.length > 0 ? (
        <>
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Search size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder={t('searchStaff') || "Search staff by name, email, or position..."}
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <ScrollView 
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2563EB']}
                tintColor={theme === 'dark' ? '#FFFFFF' : '#2563EB'}
              />
            }
          >
            {filteredStaff.length > 0 ? (
              filteredStaff.map(staff => (
                <ForceTouchable
                  key={staff._id} 
                  style={styles.staffCard}
                  onPress={() => router.push(`/staff-details?id=${staff._id}`)}
                >
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{getInitials(staff.first_name, staff.last_name)}</Text>
                  </View>
                  
                  <View style={styles.staffInfo}>
                    <View style={styles.staffHeader}>
                      <Text style={styles.staffName}>
                        {staff.first_name} {staff.last_name}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(staff.status || 'Active') }]}>
                        <Text style={styles.statusText}>{staff.status || 'Active'}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.staffRole}>
                      {staff.position || staff.role} • {staff.department}
                    </Text>
                    
                    <View style={styles.contactInfo}>
                      <View style={styles.contactRow}>
                        <Mail size={16} color="#6B7280" />
                        <Text style={styles.contactText}>{staff.email}</Text>
                      </View>
                      <View style={styles.contactRow}>
                        <Phone size={16} color="#6B7280" />
                        <Text style={styles.contactText}>{staff.phone_number}</Text>
                      </View>
                    </View>
                  </View>
                </ForceTouchable>
              ))
            ) : (
              <View style={styles.noResults}>
                <Search size={48} color="#9CA3AF" />
                <Text style={styles.noResultsText}>No staff members found</Text>
                <Text style={styles.noResultsSubText}>
                  {searchQuery ? 'Try adjusting your search criteria' : 'No staff members in your company'}
                </Text>
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Users size={64} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <Text style={styles.emptyStateTitle}>No Staff Members Yet</Text>
          <Text style={styles.emptyStateText}>
            Get started by adding your first staff member to your company.
          </Text>
          <TouchableOpacity
            style={styles.addStaffButton}
            onPress={handleAddStaff}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addStaffButtonText}>Add First Staff Member</Text>
          </TouchableOpacity>
        </View>
      )}
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
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    addButton: {
      backgroundColor: '#2563EB',
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {},
        android: {
          elevation: 3,
        },
      }),
    },
    searchContainer: {
      padding: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchInput: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    content: {
      flex: 1,
      padding: 20,
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
      marginTop: 16,
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
    staffCard: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      ...Platform.select({
        ios: {},
        android: {
          elevation: 3,
        },
      }),
    },
    avatarContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      ...Platform.select({
        ios: {},
        android: {
          elevation: 2,
        },
      }),
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    staffInfo: {
      flex: 1,
    },
    staffHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    staffName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    staffRole: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 8,
    },
    contactInfo: {
      gap: 4,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    contactText: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginTop: 24,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 20,
    },
    setupButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    setupButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    addStaffButton: {
      backgroundColor: '#2563EB',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    addStaffButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    noResults: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    noResultsText: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginTop: 16,
    },
    noResultsSubText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
    },
  });
}