// app/more.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  StatusBar,
  Image 
} from 'react-native';
import { 
  Calendar, 
  FileText, 
  Settings, 
  UserCog, 
  CreditCard,
  HelpCircle,
  Clock,
  Users,
  MessageSquare,
  ChevronRight,
  Smartphone,
  Building,
  Key,
  Edit2,
  // Add these imports:
  MoreVertical, // For the settings icon
  Cog // Alternative settings icon
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function MoreScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const styles = createStyles(theme);
  const isDark = theme === 'dark';

  // Get user's full name
  const getUserFullName = () => {
    if (!user) return 'User';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'User';
  };

  // Get initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}` || 'U';
  };

  // Main menu categories
  const menuSections = [
    {
      title: 'Work & Schedule',
      items: [
        {
          title: 'My Rota',
          icon: <Calendar size={22} color="#2563EB" />,
          description: 'View and manage your shifts',
          onPress: () => router.push('/rota/my-shifts'),
          show: user?.role === 'staff'
        },
        {
          title: 'Open Shifts',
          icon: <Calendar size={22} color="#10B981" />,
          description: 'Pick up available shifts',
          onPress: () => router.push('/rota/open-shifts'),
          show: user?.role === 'staff'
        },
        {
          title: 'Shift Requests',
          icon: <FileText size={22} color="#F59E0B" />,
          description: 'Request shift changes',
          onPress: () => router.push(user?.role === 'admin' ? '/rota/shift-requests' : '/rota/my-requests'),
          show: user?.role === 'staff'
        },
        {
          title: 'Time & Attendance',
          icon: <Clock size={22} color="#8B5CF6" />,
          description: 'Clock in/out history',
          onPress: () => router.push('/time'),
          show: true
        },
        {
          title: 'Time Off',
          icon: <Calendar size={22} color="#EC4899" />,
          description: 'Request and manage leave',
          onPress: () => router.push('/pages/time-off'),
          show: true
        },
      ]
    },
    {
      title: 'Administration',
      items: [
        {
          title: 'Manage Staff',
          icon: <Users size={22} color="#EC4899" />,
          description: 'Team management tools',
          onPress: () => router.push('/staff'),
          show: user?.role === 'admin'
        },
        {
          title: 'Rota Management',
          icon: <Calendar size={22} color="#06B6D4" />,
          description: 'Create and edit schedules',
          onPress: () => router.push('/rota'),
          show: user?.role === 'admin'
        },
        {
          title: 'Payslips',
          icon: <CreditCard size={22} color="#84CC16" />,
          description: 'View and download payslips',
          onPress: () => router.push(user?.role === 'admin' ? '/pages/admin/payslips' : '/pages/payslips'),
          show: true
        },
      ]
    },
    {
      title: 'Company Management',
      items: [
        {
          title: 'Company Information',
          icon: <Building size={22} color="#F59E0B" />,
          description: user?.company_id ? 'Manage company details' : 'Setup company profile',
          onPress: () => router.push(user?.company_id ? '/forms/company-info' : '/forms/company-setup'),
          show: user?.role === 'admin'
        },
        {
          title: 'Manage Roles',
          icon: <Key size={22} color="#8B5CF6" />,
          description: 'Add and edit job positions',
          onPress: () => router.push('/pages/roles'),
          show: user?.role === 'admin' && !!user?.company_id
        },
      ]
    },
    {
      title: 'App & Support',
      items: [
        {
          title: 'Messages',
          icon: <MessageSquare size={22} color="#3B82F6" />,
          description: 'View and send messages',
          onPress: () => router.push('/chat'),
          show: true
        },
        {
          title: 'Settings',
          icon: <Settings size={22} color="#06B6D4" />,
          description: 'App preferences and settings',
          onPress: () => router.push('/(tabs)/settings'),
          show: true
        },
        {
          title: 'Help & Support',
          icon: <HelpCircle size={22} color="#06B6D4" />,
          description: 'Get help and FAQs',
          onPress: () => {},
          show: true
        },
        {
          title: 'App Version',
          icon: <Smartphone size={22} color="#6B7280" />,
          description: 'Version 1.0.0',
          onPress: () => {},
          show: true,
          disabled: true
        },
      ]
    }
  ];

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#111827' : '#F9FAFB'}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Page Header with Settings Icon */}
        <View style={styles.pageHeader}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.pageTitle}>More Options</Text>
              <Text style={styles.pageSubtitle}>
                Access all features and settings
              </Text>
            </View>
            {/* Settings Icon */}
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/(tabs)/settings')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Settings 
                size={24} 
                color={isDark ? '#F9FAFB' : '#111827'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Info Card - Clickable to go to My Profile */}
        <TouchableOpacity 
          style={[styles.userCard, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}
          onPress={() => router.push('/pages/edit-profile')}
          activeOpacity={0.7}
        >
          <View style={styles.userInfo}>
            {/* Profile Picture or Avatar */}
            {user?.profile_picture_url ? (
              <Image 
                source={{ uri: user.profile_picture_url }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                <Text style={styles.avatarText}>
                  {getUserInitials()}
                </Text>
              </View>
            )}
            
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{getUserFullName()}</Text>
                <Edit2 size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </View>
              <Text style={styles.userRole}>
                {user?.role === 'admin' ? 'Administrator' : 'Staff'} 
                {user?.company_id ? ' • Company' : ''}
              </Text>
              <Text style={styles.editProfileText}>Tap to edit profile</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Main Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuList}>
              {section.items
                .filter(item => item.show)
                .map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.menuItem,
                      { 
                        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                        opacity: item.disabled ? 0.6 : 1
                      }
                    ]}
                    onPress={item.onPress}
                    disabled={item.disabled}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[
                        styles.menuIconContainer,
                        { backgroundColor: isDark ? '#374151' : '#F3F4F6' }
                      ]}>
                        {item.icon}
                      </View>
                      <View style={styles.menuTextContainer}>
                        <Text style={styles.menuItemTitle}>{item.title}</Text>
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      </View>
                    </View>
                    {!item.disabled && (
                      <ChevronRight 
                        size={20} 
                        color={isDark ? '#9CA3AF' : '#6B7280'} 
                      />
                    )}
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        ))}

        {/* App Version Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            StaffNest © 2024 • Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    scrollContent: {
      paddingBottom: 40,
    },
    pageHeader: {
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 20,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    pageTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
    },
    pageSubtitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    settingsButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    userCard: {
      marginHorizontal: 20,
      marginTop: 8,
      marginBottom: 24,
      padding: 16,
      borderRadius: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    profileImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
      resizeMode: 'cover',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    userDetails: {
      flex: 1,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    userName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    userRole: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    editProfileText: {
      fontSize: 13,
      color: '#2563EB',
      fontWeight: '500',
    },
    section: {
      paddingHorizontal: 20,
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 16,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuList: {
      borderRadius: 16,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#F3F4F6',
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 16,
    },
    menuIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuTextContainer: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    menuItemDescription: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    footer: {
      padding: 20,
      alignItems: 'center',
      marginTop: 32,
    },
    footerText: {
      fontSize: 14,
      color: isDark ? '#6B7280' : '#9CA3AF',
      textAlign: 'center',
    },
  });
}