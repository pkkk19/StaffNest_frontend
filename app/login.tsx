import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ForceTouchable from '@/components/ForceTouchable';

export default function Login() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles(theme);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo credentials
      const userRole = email.includes('admin') || email.includes('manager') ? 'manager' : 'staff';
      
      login({
        id: '1',
        email,
        name: userRole === 'manager' ? 'John Manager' : 'Jane Staff',
        role: userRole,
        avatar: userRole === 'manager' ? 'JM' : 'JS'
      });
      
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(t('error'), t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>StaffNest</Text>
          <Text style={styles.subtitle}>{t('welcomeBack')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('email')}
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('password')}
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
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

          <ForceTouchable style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
          </ForceTouchable>

          <ForceTouchable
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? t('signingIn') : t('signIn')}
            </Text>
          </ForceTouchable>

          <View style={styles.demoCredentials}>
            <Text style={styles.demoTitle}>{t('demoCredentials')}</Text>
            <Text style={styles.demoText}>Manager: manager@staffnest.com / password</Text>
            <Text style={styles.demoText}>Staff: staff@staffnest.com / password</Text>
          </View>

          <View style={styles.signupLink}>
            <Text style={styles.signupLinkText}>{t('needManagerAccount')} </Text>
            <ForceTouchable onPress={() => router.push('/signup')}>
              <Text style={styles.signupLinkButton}>{t('signUp')}</Text>
            </ForceTouchable>
          </View>
        </View>
      </View>
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
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    logo: {
      fontSize: 32,
      fontWeight: '700',
      color: '#2563EB',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
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
    forgotPassword: {
      alignSelf: 'flex-end',
    },
    forgotPasswordText: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '500',
    },
    loginButton: {
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
      // REMOVED shadow properties that were causing Android issues
      // ADD platform-specific elevation instead
      ...Platform.select({
        ios: {
          // iOS shadow (commented out since it was causing issues)
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
    loginButtonDisabled: {
      opacity: 0.6,
    },
    loginButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    demoCredentials: {
      marginTop: 32,
      padding: 16,
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
      borderRadius: 12,
      // REMOVED shadow properties
      ...Platform.select({
        android: {
          elevation: 2, // Android shadow
        },
      }),
    },
    demoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
    },
    demoText: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    signupLink: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    signupLinkText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    signupLinkButton: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '600',
    },
  });
}