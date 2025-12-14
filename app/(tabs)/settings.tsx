import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { User, Users, Bell, Shield, Globe, Palette, CircleHelp as HelpCircle, LogOut, ChevronRight, Moon, Sun, ChevronDown, Building } from 'lucide-react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { logout, user } = useAuth();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

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
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile')}</Text>
          <SettingItem
            icon={User}
            title={t('personalInfo')}
            subtitle={t('manageProfileDetails')}
            onPress={() => router.push('/pages/edit-profile')}
          />
        </View>

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
              >
                <Text style={[
                  styles.dropdownText,
                  language === 'en' && styles.dropdownTextActive
                ]}>
                  English
                </Text>
                {language === 'en' && <View style={styles.checkmark} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.dropdownItem, language === 'ne' && styles.dropdownItemActive]}
                onPress={() => handleLanguageSelect('ne')}
              >
                <Text style={[
                  styles.dropdownText,
                  language === 'ne' && styles.dropdownTextActive
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
          <Text style={styles.sectionTitle}>{t('notifications')}</Text>
          <SettingItem
            icon={Bell}
            title={t('notificationSettings')}
            subtitle={t('manageNotifications')}
            onPress={() => {}}
          />
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('security')}</Text>
          <SettingItem
            icon={Shield}
            title={t('security')}
            subtitle={t('passwordAndTwoFactor')}
            onPress={() => {}}
          />
        </View>

        {/* Company Information Section - Only visible for admin */}
        {user?.role === 'admin' && (
          <View style={styles.section}>
    <Text style={styles.sectionTitle}>{t('company')}</Text>
    {user?.company_id ? (
        <SettingItem
          icon={Building}
          title={t('companyInfo')}
          subtitle={t('manageCompanyDetails')}
          onPress={() => router.push('/forms/company-info')}
        />
      ) : (
        <SettingItem
          icon={Building}
          title="Setup Company"
          subtitle="Create your company profile"
          onPress={() => router.push('/forms/company-setup')}
        />
      )}
  </View>
        )}

        {user?.company_id && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Company Roles</Text>
    <SettingItem
      icon={Users}
      title="Manage Roles"
      subtitle="Add and edit job positions"
      onPress={() => router.push('/pages/roles')}
    />
  </View>
)}

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
        <View style={styles.section}>
          <SettingItem
            icon={LogOut}
            title={t('signOut')}
            onPress={() => {
              logout();
              router.replace('/login');
            }}
            showChevron={false}
            rightComponent={null}
          />
        </View>
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
    content: {
      flex: 1,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 12,
      marginHorizontal: 20,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      paddingHorizontal: 20,
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
      borderRadius: 8,
      marginHorizontal: 20,
      marginTop: 4,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
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
  });
}