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
  ScrollView,
} from 'react-native';
import { X, Lock, Eye, EyeOff, Key, Check } from 'lucide-react-native';
import { profileAPI } from '@/services/api';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onSuccess?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  theme,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDark = theme === 'dark';
  const styles = createStyles(isDark);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.current_password.trim()) {
      newErrors.current_password = 'Current password is required';
    }

    if (!formData.new_password.trim()) {
      newErrors.new_password = 'New password is required';
    }

    if (!formData.confirm_new_password.trim()) {
      newErrors.confirm_new_password = 'Confirm password is required';
    }

    if (formData.new_password !== formData.confirm_new_password) {
      newErrors.confirm_new_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await profileAPI.changePassword(formData);
      
      Alert.alert(
        'Success',
        'Password changed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                current_password: '',
                new_password: '',
                confirm_new_password: '',
              });
              onClose();
              if (onSuccess) onSuccess();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Password change error:', error);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({
    label,
    value,
    onChangeText,
    showPassword,
    setShowPassword,
    placeholder,
    error,
    autoCapitalize = 'none',
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
    placeholder: string;
    error?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <Lock size={18} color={isDark ? '#9CA3AF' : '#6B7280'} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          secureTextEntry={!showPassword}
          autoCapitalize={autoCapitalize}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
          disabled={loading}
        >
          {showPassword ? (
            <EyeOff size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
          ) : (
            <Eye size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
          )}
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={loading ? undefined : onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft} />
              
              <View style={styles.headerCenter}>
                <View style={styles.iconContainer}>
                  <Key size={24} color={isDark ? '#60A5FA' : '#2563EB'} />
                </View>
                <Text style={styles.modalTitle}>Change Password</Text>
              </View>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={loading}
              >
                <X size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalDescription}>
                Update your account password for enhanced security.
              </Text>

              <PasswordInput
                label="Current Password"
                value={formData.current_password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, current_password: text }))}
                showPassword={showCurrentPassword}
                setShowPassword={setShowCurrentPassword}
                placeholder="Enter current password"
                error={errors.current_password}
              />

              <PasswordInput
                label="New Password"
                value={formData.new_password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, new_password: text }))}
                showPassword={showNewPassword}
                setShowPassword={setShowNewPassword}
                placeholder="Enter new password"
                error={errors.new_password}
              />

              <PasswordInput
                label="Confirm New Password"
                value={formData.confirm_new_password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirm_new_password: text }))}
                showPassword={showConfirmPassword}
                setShowPassword={setShowConfirmPassword}
                placeholder="Confirm new password"
                error={errors.confirm_new_password}
              />

              <View style={styles.noteContainer}>
                <Text style={styles.noteText}>
                  • Make sure your new password is easy to remember
                </Text>
                <Text style={styles.noteText}>
                  • Keep your password secure and don't share it
                </Text>
                <Text style={styles.noteText}>
                  • You'll need to sign in again after changing your password
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Check size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#E5E7EB',
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#F9FAFB' : '#111827',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#F3F4F6',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  modalDescription: {
    fontSize: 14,
    color: isDark ? '#9CA3AF' : '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#D1D5DB' : '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4B5563' : '#E5E7EB',
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: isDark ? '#F9FAFB' : '#111827',
    paddingVertical: 14,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  noteContainer: {
    backgroundColor: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.08)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.2)',
  },
  noteText: {
    fontSize: 12,
    color: isDark ? '#93C5FD' : '#2563EB',
    marginBottom: 4,
    lineHeight: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: isDark ? '#9CA3AF' : '#6B7280',
  },
});

export default ChangePasswordModal;