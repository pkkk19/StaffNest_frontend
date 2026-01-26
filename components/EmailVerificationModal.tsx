import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Mail, CheckCircle, Clock, ArrowLeft } from 'lucide-react-native';

interface EmailVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  email: string;
  onResendEmail?: () => Promise<void>;
  onVerify?: (code: string) => Promise<void>;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  visible,
  onClose,
  theme,
  email,
  onResendEmail,
  onVerify,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const isDark = theme === 'dark';
  const styles = createStyles(isDark);

  // Countdown timer for resend
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    setError('');

    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      if (onVerify) {
        await onVerify(verificationCode);
      } else {
        // Simulate verification
        await new Promise(resolve => setTimeout(resolve, 1500));
        Alert.alert('Success', 'Email verified successfully!');
        onClose();
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Verification failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setResendLoading(true);

    try {
      if (onResendEmail) {
        await onResendEmail();
      } else {
        // Simulate resend
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setCountdown(60); // 60 seconds cooldown
      Alert.alert('Email Sent', 'Verification email has been resent.');
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleClose = () => {
    setVerificationCode('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={loading ? undefined : handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleClose}
              disabled={loading}
            >
              <ArrowLeft size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Verify Email</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={loading}
            >
              <X size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Mail size={48} color="#2563EB" />
            </View>

            <Text style={styles.description}>
              We've sent a verification code to:
            </Text>
            <Text style={styles.emailText}>{email}</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Enter 6-digit code"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={verificationCode}
                onChangeText={(text) => {
                  // Only allow numbers and limit to 6 digits
                  const numericText = text.replace(/[^0-9]/g, '');
                  setVerificationCode(numericText.slice(0, 6));
                  if (error) setError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <View style={styles.timerContainer}>
              {countdown > 0 ? (
                <View style={styles.timer}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.timerText}>
                    Resend available in {countdown}s
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.resendLink}
                  onPress={handleResendEmail}
                  disabled={resendLoading}
                >
                  {resendLoading ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <Text style={styles.resendText}>Resend verification code</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CheckCircle size={18} color="#fff" />
                  <Text style={styles.verifyButtonText}>Verify Email</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.noteContainer}>
              <Text style={styles.noteTitle}>Important:</Text>
              <Text style={styles.noteText}>
                • Check your inbox (and spam folder)
              </Text>
              <Text style={styles.noteText}>
                • The code will expire in 15 minutes
              </Text>
              <Text style={styles.noteText}>
                • Contact support if you don't receive the email
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#E5E7EB',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#F9FAFB' : '#111827',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#F3F4F6',
  },
  modalContent: {
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: isDark ? '#9CA3AF' : '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#D1D5DB' : '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: isDark ? '#374151' : '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
    color: isDark ? '#F9FAFB' : '#111827',
    textAlign: 'center',
    letterSpacing: 8,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 12,
    color: isDark ? '#9CA3AF' : '#6B7280',
  },
  resendLink: {
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: isDark ? '#9CA3AF' : '#6B7280',
    fontWeight: '500',
  },
  noteContainer: {
    backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.08)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.2)',
    marginTop: 16,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#93C5FD' : '#2563EB',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: isDark ? '#93C5FD' : '#2563EB',
    marginBottom: 4,
    lineHeight: 16,
  },
});

export default EmailVerificationModal;