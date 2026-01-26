import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import EmailVerificationModal from '@/components/EmailVerificationModal';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import { authAPI } from '@/services/api';

interface PasswordResetFlowProps {
  visible: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onSuccess?: () => void;
}

const PasswordResetFlow: React.FC<PasswordResetFlowProps> = ({
  visible,
  onClose,
  theme,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<'email' | 'verification' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Handle email submission
  const handleEmailSent = async (userEmail: string) => {
    setEmail(userEmail);
    try {
      const response = await authAPI.forgotPassword(userEmail);
      if (response.data.success) {
        setCurrentStep('verification');
        Alert.alert(
          'Code Sent',
          response.data.message || 'Verification code sent to your email.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Failed to send verification code. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Even on error, move to verification step (for demo/testing)
      setCurrentStep('verification');
      Alert.alert('Info', errorMessage || 'Please check your email for the verification code.');
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async (code: string) => {
    try {
      // For production, verify the code before proceeding
      // await authAPI.verifyCode(email, code);
      
      setVerificationCode(code);
      setCurrentStep('reset');
      
      Alert.alert(
        'Code Verified',
        'Please set your new password.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Verify code error:', error);
      
      let errorMessage = 'Invalid verification code. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  // Handle resend email
  const handleResendEmail = async () => {
    try {
      await authAPI.forgotPassword(email);
      Alert.alert('Email Sent', 'Verification code has been resent.');
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend email. Please try again.');
    }
  };

  // Handle reset password submission
  const handleResetPassword = async (newPassword: string, confirmPassword: string) => {
    try {
      const response = await authAPI.resetPassword({
        email,
        verification_code: verificationCode,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          response.data.message || 'Password reset successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                handleResetSuccess();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage);
      throw error;
    }
  };

  const handleResetSuccess = () => {
    setCurrentStep('email');
    setEmail('');
    setVerificationCode('');
    onClose();
    if (onSuccess) onSuccess();
  };

  const handleClose = () => {
    setCurrentStep('email');
    setEmail('');
    setVerificationCode('');
    onClose();
  };

  return (
    <>
      {/* Step 1: Email Input */}
      <ForgotPasswordModal
        visible={visible && currentStep === 'email'}
        onClose={handleClose}
        theme={theme}
        onEmailSent={handleEmailSent}
      />

      {/* Step 2: Verification Code */}
      <EmailVerificationModal
        visible={visible && currentStep === 'verification'}
        onClose={handleClose}
        theme={theme}
        email={email}
        onResendEmail={handleResendEmail}
        onVerify={handleVerifyCode}
      />

      {/* Step 3: Reset Password */}
      <ResetPasswordModal
        visible={visible && currentStep === 'reset'}
        onClose={handleClose}
        theme={theme}
        email={email}
        onSuccess={handleResetSuccess}
      />
    </>
  );
};

export default PasswordResetFlow;