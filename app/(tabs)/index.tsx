import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator, Image, StatusBar } from 'react-native';
import { Bell, Calendar, Clock, FileText, Users, MessageSquare } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { DashboardCard } from '@/components/DashboardCard';
import ForceTouchable from '@/components/ForceTouchable';
import { useState, useEffect } from 'react';
import { shiftsAPI, companiesAPI } from '@/services/api';

// Define the Company type based on your API response
type Company = {
  id?: string;
  name?: string;
  logo_url?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
};

export default function Dashboard() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    hoursThisWeek: 0,
    holidaysLeft: 0
  });
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const styles = createStyles(theme);

  useEffect(() => {
    if (user && !authLoading) {
      fetchDashboardData();
      fetchCompanyData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch real data from your backend
      // Example: const shiftsResponse = await shiftsAPI.getShifts();
      // Calculate hoursThisWeek from shifts data
      
      // For now, using mock data
      setStats({
        hoursThisWeek: 37.5,
        holidaysLeft: 12
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyData = async () => {
    try {
      setCompanyLoading(true);
      setCompanyError(null);
      
      console.log('Fetching company data for user:', user?._id);
      
      // First try to get the user's company
      const response = await companiesAPI.getCompany(user!.company_id?.toString() || '');
      console.log('Company API response:', response);
      console.log('Company data:', response.data);
      
      if (response.data) {
        setCompany(response.data);
      } else {
        throw new Error('No company data received');
      }
      
    } catch (error: any) {
      console.error('Failed to fetch company data:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Check if it's a 404 error (company not found)
      if (error.response?.status === 404) {
        setCompanyError('No company associated with your account');
      } else {
        setCompanyError(error.message || 'Failed to load company information');
      }
      
      setCompany(null);
    } finally {
      setCompanyLoading(false);
    }
  };

  // Helper function to get company name for logo placeholder
  const getCompanyInitial = () => {
    if (!company?.name) return 'C';
    
    // Get first letter of company name
    const firstChar = company.name.charAt(0).toUpperCase();
    
    // If it's a letter, use it, otherwise use 'C'
    return /[A-Z]/.test(firstChar) ? firstChar : 'C';
  };

  const quickActions = [
    { icon: Calendar, title: t('viewRota'), color: '#2563EB', route: '/rota' },
    { icon: Clock, title: t('clockIn'), color: '#10B981', route: '/time' },
    { 
    icon: FileText, 
    title: t('payslips'), 
    color: '#F59E0B', 
    route: user?.role === 'admin' ? 'pages/admin/payslips' : 'pages/payslips'
  },
    ...(user?.role === 'admin' ? [
      { icon: Users, title: t('manageStaff'), color: '#8B5CF6', route: '/staff' },
      { icon: Bell, title: t('sendNotifications'), color: '#EF4444', route: '/notifications' }
    ] : []),
  ];

  const notifications = [
    { id: 1, title: t('shiftReminder'), message: t('shiftTomorrow'), time: '2h ago', type: 'info' },
    { id: 2, title: t('holidayApproved'), message: t('holidayApprovedMsg'), time: '1d ago', type: 'success' },
    { id: 3, title: t('rotaUpdated'), message: t('rotaUpdatedMsg'), time: '2d ago', type: 'warning' },
  ];

  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#111827' : '#F9FAFB'}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.companyContainer}>
            {company?.logo_url ? (
              <Image 
                source={{ uri: company.logo_url }} 
                style={styles.companyLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.companyLogoPlaceholder, { backgroundColor: theme === 'dark' ? '#374151' : '#E5E7EB' }]}>
                <Text style={styles.companyLogoText}>
                  {getCompanyInitial()}
                </Text>
              </View>
            )}
            <View style={styles.companyInfo}>
              {companyLoading ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : companyError ? (
                <Text style={styles.companyNameError}>
                  {companyError}
                </Text>
              ) : (
                <Text style={styles.companyName} numberOfLines={2}>
                  {company?.name || t('myCompany')}
                </Text>
              )}
            </View>
          </View>
          <ForceTouchable
            style={styles.bellIcon}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </ForceTouchable>
        </View>

        {/* Stats section moved up to replace greeting section */}
        <View style={styles.statsContainer}>
          <DashboardCard 
            title={t('hoursThisWeek')} 
            value={stats.hoursThisWeek.toString()} 
            subtitle={t('hours')} 
            color="#2563EB" 
          />
          <DashboardCard 
            title={t('holidaysLeft')} 
            value={stats.holidaysLeft.toString()} 
            subtitle={t('days')} 
            color="#10B981" 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <ForceTouchable
                key={index} 
                style={[styles.actionCard, { borderLeftColor: action.color }]}
                onPress={() => router.push(action.route as any)}
              >
                <action.icon size={24} color={action.color} />
                <Text style={styles.actionTitle}>{action.title}</Text>
              </ForceTouchable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('recentNotifications')}</Text>
          {notifications.map(notification => (
            <View key={notification.id} style={[
              styles.notificationItem,
              { borderLeftColor: getNotificationColor(notification.type) }
            ]}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

// Helper function for notification colors
function getNotificationColor(type: string) {
  switch (type) {
    case 'success': return '#10B981';
    case 'warning': return '#F59E0B';
    case 'error': return '#EF4444';
    default: return '#2563EB';
  }
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    scrollContent: {
      paddingBottom: 20,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 20,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    companyContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16, // Increased gap for better spacing
    },
    companyLogo: {
      width: 48, // Increased size
      height: 48, // Increased size
      borderRadius: 10, // Slightly larger border radius
    },
    companyLogoPlaceholder: {
      width: 48, // Increased size
      height: 48, // Increased size
      borderRadius: 10, // Slightly larger border radius
      justifyContent: 'center',
      alignItems: 'center',
    },
    companyLogoText: {
      fontSize: 20, // Larger font for logo placeholder
      fontWeight: 'bold',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    companyInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    companyName: {
      fontSize: 22, // Much larger font size
      fontWeight: '700', // Bolder font weight
      color: isDark ? '#F9FAFB' : '#111827',
      letterSpacing: 0.5, // Slight letter spacing for better readability
    },
    companyNameError: {
      fontSize: 14,
      fontWeight: '400',
      color: isDark ? '#EF4444' : '#DC2626',
      fontStyle: 'italic',
    },
    // Removed userGreeting, greeting, userName styles
    // Removed roleBadge and roleBadgeText styles
    bellIcon: {
      padding: 8,
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 24,
      gap: 12,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    actionCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      ...Platform.select({
        android: {
          elevation: 3,
        },
      }),
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#374151',
      flex: 1,
    },
    notificationItem: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    notificationTime: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    notificationMessage: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
  });
}