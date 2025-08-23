import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, User, Building, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ForceTouchable from '@/components/ForceTouchable';

export default function Signup() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles(theme);

  const handleSignup = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.companyName) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t('error'), t('passwordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert(t('error'), t('passwordTooShort'));
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        t('success'),
        t('accountCreated'),
        [{ text: t('ok'), onPress: () => router.replace('/login') }]
      );
    } catch (error) {
      Alert.alert(t('error'), t('signupFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ForceTouchable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </ForceTouchable>
          <Text style={styles.logo}>StaffNest</Text>
          <Text style={styles.subtitle}>{t('createManagerAccount')}</Text>
          <View style={styles.managerBadge}>
            <Text style={styles.managerBadgeText}>{t('managersOnly')}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('fullName')}
              placeholderTextColor="#6B7280"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('email')}
              placeholderTextColor="#6B7280"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Building size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('companyName')}
              placeholderTextColor="#6B7280"
              value={formData.companyName}
              onChangeText={(text) => setFormData({...formData, companyName: text})}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('password')}
              placeholderTextColor="#6B7280"
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry={!showPassword}
            />
            <ForceTouchable 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </ForceTouchable>
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('confirmPassword')}
              placeholderTextColor="#6B7280"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
              secureTextEntry={!showConfirmPassword}
            />
            <ForceTouchable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </ForceTouchable>
          </View>

          <ForceTouchable
            style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? t('creatingAccount') : t('createAccount')}
            </Text>
          </ForceTouchable>

          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>{t('alreadyHaveAccount')} </Text>
            <ForceTouchable onPress={() => router.replace('/login')}>
              <Text style={styles.loginLinkButton}>{t('signIn')}</Text>
            </ForceTouchable>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t('managerAccountInfo')}</Text>
            <Text style={styles.infoText}>{t('managerAccountDescription')}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      left: 0,
      top: 0,
      padding: 8,
    },
    logo: {
      fontSize: 32,
      fontWeight: '700',
      color: '#2563EB',
      marginBottom: 8,
      marginTop: 40,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 12,
    },
    managerBadge: {
      backgroundColor: '#F59E0B',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    managerBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    form: {
      gap: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    eyeIcon: {
      padding: 4,
    },
    signupButton: {
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
      // REMOVED shadow properties that were causing Android issues
      // ADD platform-specific elevation instead
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
    signupButtonDisabled: {
      opacity: 0.6,
    },
    signupButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    loginLink: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
    },
    loginLinkText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    loginLinkButton: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '600',
    },
    infoCard: {
      backgroundColor: isDark ? '#1F2937' : '#EBF4FF',
      padding: 16,
      borderRadius: 12,
      marginTop: 24,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#BFDBFE',
      // REMOVED shadow properties
      ...Platform.select({
        android: {
          elevation: 2, // Android shadow
        },
      }),
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1E40AF',
      marginBottom: 8,
    },
    infoText: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#3730A3',
      lineHeight: 18,
    },
  });
}