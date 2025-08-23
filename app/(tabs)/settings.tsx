import { View, Text, ScrollView, StyleSheet, Switch, Platform } from 'react-native';
import { User, Bell, Shield, Globe, Palette, CircleHelp as HelpCircle, LogOut, ChevronRight, Moon, Sun, Eye } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import ForceTouchable from '@/components/ForceTouchable';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { logout } = useAuth();

  const styles = createStyles(theme);

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'ne' : 'en');
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
    <ForceTouchable style={styles.settingItem} onPress={onPress}>
      <Icon size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (showChevron && (
        <ChevronRight size={20} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
      ))}
    </ForceTouchable>
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
            onPress={() => router.push('/edit-profile')}
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
          
          <SettingItem
            icon={Eye}
            title={t('colorblindMode')}
            subtitle={t('optimizedForColorblindness')}
            onPress={() => setTheme('colorblind')}
            showChevron={false}
            rightComponent={
              <View style={[styles.radioButton, theme === 'colorblind' && styles.radioButtonActive]}>
                {theme === 'colorblind' && <View style={styles.radioButtonInner} />}
              </View>
            }
          />
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <SettingItem
            icon={Globe}
            title={t('language')}
            subtitle={language === 'en' ? 'English' : 'नेपाली'}
            showChevron={false}
            rightComponent={
              <Switch
                value={language === 'ne'}
                onValueChange={handleLanguageToggle}
                trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                thumbColor={language === 'ne' ? '#FFFFFF' : '#FFFFFF'}
              />
            }
          />
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
  });
}