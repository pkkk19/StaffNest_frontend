// app/settings.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Modal,
  TextInput,
  Alert,
  StatusBar,
  Platform 
} from 'react-native';
import { 
  Bell, 
  Shield, 
  Globe, 
  CircleHelp as HelpCircle, 
  LogOut, 
  ChevronRight, 
  Moon, 
  Sun, 
  ChevronDown,
  Settings as SettingsIcon,
  Lock,
  X,
  Key,
  Check
} from 'lucide-react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import ChangePasswordModal from '@/components/ChangePasswordModal'; // Import the modal

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { logout, user } = useAuth();
  
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false); // Keep this state

  const styles = createStyles(theme);

  const handleLanguageSelect = (selectedLanguage: 'en' | 'ne') => {
    setLanguage(selectedLanguage);
    setShowLanguageDropdown(false);
  };

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    showChevron = true,
    rightComponent 
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <Icon size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (showChevron && (
        <ChevronRight size={20} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
      ))}
    </TouchableOpacity>
  );

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    router.replace('/login');
  };

  const renderLogoutModal = () => (
    <Modal
      visible={showLogoutModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLogoutModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <LogOut size={24} color="#EF4444" />
            <Text style={[styles.modalTitle, { color: theme === 'dark' ? '#F9FAFB' : '#111827' }]}>
              Sign Out
            </Text>
          </View>
          
          <Text style={[styles.modalText, { color: theme === 'dark' ? '#D1D5DB' : '#6B7280' }]}>
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleLogout}
            >
              <LogOut size={18} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#111827' : '#F9FAFB'}
      />
      
      {/* Header without Settings Icon */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings')}</Text>
      </View>

      {/* Spacing between header and content */}
      <View style={styles.headerSpacing} />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('appearance')}</Text>
          
          <SettingItem
            icon={Sun}
            title={t('lightMode')}
            onPress={() => setTheme('light')}
            showChevron={false}
            rightComponent={
              <View style={[styles.radioButton, theme === 'light' && styles.radioButtonActive]}>
                {theme === 'light' && <View style={styles.radioButtonInner} />}
              </View>
            }
          />
          
          <SettingItem
            icon={Moon}
            title={t('darkMode')}
            onPress={() => setTheme('dark')}
            showChevron={false}
            rightComponent={
              <View style={[styles.radioButton, theme === 'dark' && styles.radioButtonActive]}>
                {theme === 'dark' && <View style={styles.radioButtonInner} />}
              </View>
            }
          />
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
            activeOpacity={0.7}
          >
            <Globe size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t('language')}</Text>
              <Text style={styles.settingSubtitle}>
                {language === 'en' ? 'English' : 'नेपाली'}
              </Text>
            </View>
            <ChevronDown 
              size={20} 
              color={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
              style={[
                styles.chevronIcon,
                showLanguageDropdown && styles.chevronIconRotated
              ]}
            />
          </TouchableOpacity>
          
          {showLanguageDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity 
                style={[styles.dropdownItem, language === 'en' && styles.dropdownItemActive]}
                onPress={() => handleLanguageSelect('en')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dropdownText,
                  language === 'en' && styles.dropdownTextActive,
                ]}>
                  English
                </Text>
                {language === 'en' && <View style={styles.checkmark} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.dropdownItem, language === 'ne' && styles.dropdownItemActive]}
                onPress={() => handleLanguageSelect('ne')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dropdownText,
                  language === 'ne' && styles.dropdownTextActive,
                ]}>
                  नेपाली
                </Text>
                {language === 'ne' && <View style={styles.checkmark} />}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingItem
            icon={Bell}
            title="Notification Settings"
            subtitle="Customize push notifications and reminders"
            onPress={() => router.push('/pages/notifications/settings')}
          />
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('security')}</Text>
          <SettingItem
            icon={Lock}
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => setShowChangePassword(true)} // Open the modal
          />
          {/* <SettingItem
            icon={Shield}
            title={t('security')}
            subtitle={t('passwordAndTwoFactor')}
            onPress={() => {}}
          /> */}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('support')}</Text>
          <SettingItem
            icon={HelpCircle}
            title={t('helpSupport')}
            subtitle={t('faqsAndContact')}
            onPress={() => {}}
          />
        </View>

        {/* Account Section */}
        <View style={[styles.section, styles.logoutSection]}>
          <SettingItem
            icon={LogOut}
            title={t('signOut')}
            onPress={() => setShowLogoutModal(true)}
            showChevron={false}
            rightComponent={null}
          />
        </View>

        {/* App Version Footer */}
        <View style={styles.appFooter}>
          <Text style={styles.appVersion}>StaffNest • Version 1.0.0</Text>
          <Text style={styles.copyright}>© 2024 All rights reserved</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderLogoutModal()}
      
      {/* Use the new ChangePasswordModal component */}
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        theme={theme}
        onSuccess={() => {
          // Optional: Do something after successful password change
          console.log('Password changed successfully');
        }}
      />
    </View>
  );
}

// Keep the createStyles function exactly as you have it
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
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 20,
      paddingBottom: 16,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    headerSpacing: {
      height: 8,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 40,
    },
    section: {
      marginBottom: 24,
      marginHorizontal: 20,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
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
          elevation: 3,
        },
      }),
    },
    logoutSection: {
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 8,
      marginHorizontal: 16,
      marginTop: 20,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#F3F4F6',
    },
    settingContent: {
      flex: 1,
      marginLeft: 16,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: isDark ? '#6B7280' : '#D1D5DB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioButtonActive: {
      borderColor: '#2563EB',
    },
    radioButtonInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#2563EB',
    },
    chevronIcon: {
      transform: [{ rotate: '0deg' }],
    },
    chevronIconRotated: {
      transform: [{ rotate: '180deg' }],
    },
    dropdown: {
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      overflow: 'hidden',
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    dropdownItemActive: {
      backgroundColor: isDark ? '#4B5563' : '#EBF4FF',
    },
    dropdownText: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    dropdownTextActive: {
      color: '#2563EB',
      fontWeight: '600',
    },
    checkmark: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#2563EB',
    },
    appFooter: {
      alignItems: 'center',
      marginTop: 32,
      paddingHorizontal: 20,
    },
    appVersion: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    copyright: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 20,
      padding: 24,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
    },
    modalText: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 28,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
    },
    cancelButton: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    confirmButton: {
      backgroundColor: '#EF4444',
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}