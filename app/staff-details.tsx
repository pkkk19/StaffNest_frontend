import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { ArrowLeft, CreditCard as Edit, Phone, Mail, MapPin, Calendar, Clock, FileText } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ForceTouchable from '@/components/ForceTouchable';

export default function StaffDetails() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const styles = createStyles(theme);

  // Mock staff data
  const staffMember = {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@staffnest.com',
    phone: '+44 123 456 7890',
    role: 'Customer Service Representative',
    department: 'Customer Service',
    branch: 'Main Branch',
    employeeId: 'SN001',
    startDate: '2023-01-15',
    status: 'Active',
    avatar: 'SJ',
    address: '123 Main Street, London, UK',
    emergencyContact: {
      name: 'John Johnson',
      phone: '+44 987 654 3210',
      relationship: 'Spouse'
    },
    employment: {
      contractType: 'Full-time',
      salary: '£25,000',
      workingHours: '40 hours/week',
      probationEnd: '2023-04-15'
    }
  };

  const InfoCard = ({ icon: Icon, title, value, onPress }: any) => (
    <ForceTouchable style={styles.infoCard} onPress={onPress}>
      <Icon size={20} color="#2563EB" />
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {user?.role === 'manager' && (
        <Edit size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      )}
    </ForceTouchable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ForceTouchable onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
        <Text style={styles.title}>{t('staffDetails')}</Text>
        {user?.role === 'manager' && (
          <ForceTouchable onPress={() => router.push('/edit-staff' as any)}>
            <Edit size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </ForceTouchable>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{staffMember.avatar}</Text>
          </View>
          <Text style={styles.staffName}>{staffMember.name}</Text>
          <Text style={styles.staffRole}>{staffMember.role}</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
            <Text style={styles.statusText}>{staffMember.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contactInformation')}</Text>
          <InfoCard
            icon={Mail}
            title={t('email')}
            value={staffMember.email}
          />
          <InfoCard
            icon={Phone}
            title={t('phone')}
            value={staffMember.phone}
          />
          <InfoCard
            icon={MapPin}
            title={t('address')}
            value={staffMember.address}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('employmentDetails')}</Text>
          <InfoCard
            icon={FileText}
            title={t('employeeId')}
            value={staffMember.employeeId}
          />
          <InfoCard
            icon={Calendar}
            title={t('startDate')}
            value={new Date(staffMember.startDate).toLocaleDateString()}
          />
          <InfoCard
            icon={MapPin}
            title={t('branch')}
            value={staffMember.branch}
          />
          <InfoCard
            icon={Clock}
            title={t('workingHours')}
            value={staffMember.employment.workingHours}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('emergencyContact')}</Text>
          <InfoCard
            icon={Phone}
            title={staffMember.emergencyContact.name}
            value={`${staffMember.emergencyContact.phone} (${staffMember.emergencyContact.relationship})`}
          />
        </View>

        {user?.role === 'manager' && (
          <View style={styles.actionButtons}>
            <ForceTouchable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{t('viewPayslips')}</Text>
            </ForceTouchable>
            <ForceTouchable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{t('viewTimeHistory')}</Text>
            </ForceTouchable>
          </View>
        )}
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
    profileSection: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        android: {
          elevation: 3, // Android shadow
        },
      }),
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    staffName: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    staffRole: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 12,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
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
    actionButtons: {
      padding: 20,
      gap: 12,
    },
    primaryButton: {
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        ios: {
          // iOS shadow (commented out to fix Android)
          // shadowColor: '#000',
          // shadowOffset: { width: 0, height: 4 },
          // shadowOpacity: 0.2,
          // shadowRadius: 8,
        },
        android: {
          elevation: 5, // Android shadow
        },
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
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        android: {
          elevation: 3, // Android shadow
        },
      }),
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
  });
}