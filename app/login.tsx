import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  X,
  ArrowLeft,
  Key,
  Check,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ForceTouchable from '@/components/ForceTouchable';
import PasswordResetFlow from '@/components/auth/ForgotPasswordFlow'; // Import the flow component

export default function Login() {
  const { login, tokenExpired, clearTokenExpired } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false); // Changed from showForgotPasswordModal

  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    url: '',
    type: '', // 'signup' | 'general'
  });

  const styles = createStyles(theme);

  // Clear token expired flag when component mounts
  useEffect(() => {
    if (tokenExpired) {
      clearTokenExpired();
      Alert.alert(t('sessionExpired'), t('pleaseLoginAgain'));
    }
  }, [tokenExpired]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (
        error.message.includes('undefined') ||
        error.message.includes('null')
      ) {
        Alert.alert(t('error'), t('loginFailedTryAgain'));
      } else if (
        error.message.includes('token') ||
        error.response?.status === 401
      ) {
        Alert.alert(t('error'), t('authenticationError'));
      } else {
        Alert.alert(t('error'), error.message || t('loginFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openWebsite = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('error'), t('cannotOpenWebsite'), [
          { text: t('ok'), style: 'default' },
        ]);
      }
    } catch (error) {
      Alert.alert(t('error'), t('websiteOpenFailed'), [
        { text: t('ok'), style: 'default' },
      ]);
    }
  };

  const showWebsiteRedirectModal = (
    type: 'signup' | 'general',
    title: string,
    message: string,
    url?: string,
  ) => {
    const config = {
      title,
      message,
      url: url || 'https://www.hourwize.com/signup',
      type,
    };
    setModalConfig(config);
    setShowWebsiteModal(true);
  };

  const handleSignupRedirect = () => {
    showWebsiteRedirectModal('signup', t('signUp'), t('signupRedirectMessage'));
  };

  const handleHourwizeLink = () => {
    showWebsiteRedirectModal(
      'general',
      'HourWize Website',
      'Open www.hourwize.com in your browser?',
      'https://www.hourwize.com',
    );
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleModalAction = (action: 'open' | 'cancel') => {
    setShowWebsiteModal(false);
    if (action === 'open') {
      openWebsite(modalConfig.url);
    }
  };

  const handleForgotPasswordSuccess = () => {
    setShowForgotPassword(false);
    Alert.alert(
      'Success',
      'Password reset successfully! You can now login with your new password.',
    );
  };

  const renderModalContent = () => {
    const isSignup = modalConfig.type === 'signup';
    const isGeneral = modalConfig.type === 'general';

    return (
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <View style={styles.modalIconContainer}>
            <ExternalLink size={24} color="#2563EB" />
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => handleModalAction('cancel')}
          >
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalTitle}>{modalConfig.title}</Text>

        <Text style={styles.modalMessage}>{modalConfig.message}</Text>

        <View style={styles.modalUrlContainer}>
          <Text style={styles.modalUrlText}>Website:</Text>
          <Text style={styles.modalUrl}>www.hourwize.com</Text>
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => handleModalAction('cancel')}
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, styles.openButton]}
            onPress={() => handleModalAction('open')}
          >
            <Text style={styles.openButtonText}>
              {isSignup ? t('signUp') : t('open')}
            </Text>
          </TouchableOpacity>
        </View>

        {isSignup && (
          <Text style={styles.modalNote}>
            After signing up on our website, return here to login with your new
            account.
          </Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          {/* Logo Image */}
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {/* App Name */}
          <Text style={styles.logoText}>HourWize</Text>
          <Text style={styles.subtitle}>{t('manageYourWorkforce')}</Text>
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
              editable={!isLoading}
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
              editable={!isLoading}
            />
            <ForceTouchable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </ForceTouchable>
          </View>

          {/* <ForceTouchable
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
          </ForceTouchable> */}

          <ForceTouchable
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? t('signingIn') : t('signIn')}
            </Text>
          </ForceTouchable>

          <View style={styles.signupLink}>
            <Text style={styles.signupLinkText}>
              {t('needManagerAccount')}{' '}
            </Text>
            <ForceTouchable onPress={handleSignupRedirect} disabled={isLoading}>
              <Text style={styles.signupLinkButton}>{t('signUp')}</Text>
            </ForceTouchable>
          </View>

          {/* New Account Note */}
          <View style={styles.accountNoteContainer}>
            <Text style={styles.accountNoteText}>
              Note: New accounts must be created at{' '}
              <ForceTouchable onPress={handleHourwizeLink}>
                <Text style={styles.websiteLink}>www.hourwize.com</Text>
              </ForceTouchable>
            </Text>
          </View>
        </View>
      </View>

      {/* Website Redirect Modal */}
      <Modal
        visible={showWebsiteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => handleModalAction('cancel')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>{renderModalContent()}</View>
        </View>
      </Modal>

      {/* Password Reset Flow */}
      <PasswordResetFlow
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        theme={theme}
        onSuccess={handleForgotPasswordSuccess}
      />
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
    logoImage: {
      width: 120,
      height: 120,
      marginBottom: 16,
    },
    logoText: {
      fontSize: 36,
      fontWeight: '700',
      color: '#2563EB',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
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
      ...Platform.select({
        android: {
          elevation: 5,
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
    accountNoteContainer: {
      backgroundColor: isDark
        ? 'rgba(37, 99, 235, 0.1)'
        : 'rgba(37, 99, 235, 0.08)',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.2)',
      marginTop: 8,
      alignItems: 'center',
    },
    accountNoteText: {
      fontSize: 12,
      color: isDark ? '#93C5FD' : '#2563EB',
      textAlign: 'center',
      fontWeight: '500',
    },
    websiteLink: {
      color: isDark ? '#93C5FD' : '#2563EB',
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      overflow: 'hidden',
    },
    modalContent: {
      padding: 24,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark
        ? 'rgba(37, 99, 235, 0.1)'
        : 'rgba(37, 99, 235, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 12,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      lineHeight: 20,
      marginBottom: 20,
      textAlign: 'center',
    },
    modalUrlContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(37, 99, 235, 0.1)'
        : 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.2)',
    },
    modalUrlText: {
      fontSize: 14,
      color: isDark ? '#93C5FD' : '#2563EB',
      fontWeight: '500',
      marginRight: 8,
    },
    modalUrl: {
      fontSize: 14,
      color: isDark ? '#93C5FD' : '#2563EB',
      fontWeight: '600',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
    openButton: {
      backgroundColor: '#2563EB',
    },
    openButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    modalNote: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      fontStyle: 'italic',
      lineHeight: 16,
    },
  });
}
