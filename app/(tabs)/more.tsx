// app/more.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  StatusBar 
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
  Smartphone
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
          onPress: () => router.push('/rota/shift-requests'),
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
        icon: <Calendar size={22} color="#EC4899" />, // Changed icon to calendar, different color
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
      title: 'Support',
      items: [
        {
          title: 'Help & Support',
          icon: <HelpCircle size={22} color="#06B6D4" />,
          description: 'Get help and FAQs',
          onPress: () => router.push('/(tabs)/settings'),
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

  // Quick actions at the top
  const quickActions = [
    {
      title: 'Clock In',
      icon: <Clock size={24} color="#10B981" />,
      route: '/time'
    },
    {
      title: 'Messages',
      icon: <MessageSquare size={24} color="#3B82F6" />,
      route: '/chat'
    },
    {
      title: 'Settings',
      icon: <Settings size={24} color="#8B5CF6" />,
      route: '/(tabs)/settings'
    }
  ];

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#111827' : '#F9FAFB'}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Page Title */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>More Options</Text>
          <Text style={styles.pageSubtitle}>
            Access all features and settings
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[
                  styles.quickActionIcon,
                  { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }
                ]}>
                  {action.icon}
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
    quickActionsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    quickActionCard: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
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
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    quickActionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#374151',
      textAlign: 'center',
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