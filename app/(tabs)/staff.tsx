import { View, Text, ScrollView, StyleSheet, TextInput, Platform } from 'react-native';
import { Search, Plus, User, Phone, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import ForceTouchable from '@/components/ForceTouchable';

export default function Staff() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const styles = createStyles(theme);

  const staffMembers = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+44 123 456 7890',
      role: 'Manager',
      department: 'Sales',
      status: 'Active',
      avatar: 'JS'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      phone: '+44 123 456 7891',
      role: 'Staff',
      department: 'Customer Service',
      status: 'Active',
      avatar: 'SJ'
    },
    {
      id: 3,
      name: 'Mike Wilson',
      email: 'mike.wilson@company.com',
      phone: '+44 123 456 7892',
      role: 'Staff',
      department: 'Operations',
      status: 'On Leave',
      avatar: 'MW'
    },
    {
      id: 4,
      name: 'Emily Davis',
      email: 'emily.davis@company.com',
      phone: '+44 123 456 7893',
      role: 'Supervisor',
      department: 'HR',
      status: 'Active',
      avatar: 'ED'
    },
  ];

  const filteredStaff = staffMembers.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'On Leave': return '#F59E0B';
      case 'Inactive': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('staff')}</Text>
        <ForceTouchable style={styles.addButton}>
          <Plus size={24} color="#FFFFFF" />
        </ForceTouchable>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchStaff')}
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {filteredStaff.map(staff => (
          <ForceTouchable
            key={staff.id} 
            style={styles.staffCard}
            onPress={() => router.push('/staff-details')}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{staff.avatar}</Text>
            </View>
            
            <View style={styles.staffInfo}>
              <View style={styles.staffHeader}>
                <Text style={styles.staffName}>{staff.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(staff.status) }]}>
                  <Text style={styles.statusText}>{staff.status}</Text>
                </View>
              </View>
              
              <Text style={styles.staffRole}>{staff.role} • {staff.department}</Text>
              
              <View style={styles.contactInfo}>
                <View style={styles.contactRow}>
                  <Mail size={16} color="#6B7280" />
                  <Text style={styles.contactText}>{staff.email}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Phone size={16} color="#6B7280" />
                  <Text style={styles.contactText}>{staff.phone}</Text>
                </View>
              </View>
            </View>
          </ForceTouchable>
        ))}
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
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        ios: {
          // iOS shadow (commented out to fix Android)
          // shadowColor: '#000',
          // shadowOffset: { width: 0, height: 2 },
          // shadowOpacity: 0.2,
          // shadowRadius: 4,
        },
        android: {
          elevation: 3, // Android shadow
        },
      }),
    },
    searchContainer: {
      padding: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
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
    staffCard: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        ios: {
          // iOS shadow (commented out to fix Android)
          // shadowColor: '#000',
          // shadowOffset: { width: 0, height: 2 },
          // shadowOpacity: isDark ? 0.3 : 0.1,
          // shadowRadius: 4,
        },
        android: {
          elevation: 3, // Android shadow
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
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        ios: {
          // iOS shadow (commented out to fix Android)
          // shadowColor: '#000',
          // shadowOffset: { width: 0, height: 2 },
          // shadowOpacity: 0.2,
          // shadowRadius: 4,
        },
        android: {
          elevation: 2, // Android shadow
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
  });
}