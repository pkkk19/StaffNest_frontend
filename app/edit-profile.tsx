import { View, Text, ScrollView, StyleSheet, TextInput, Alert, Platform, Image } from 'react-native';
import { ArrowLeft, Save, Camera, X } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ForceTouchable from '@/components/ForceTouchable';
import { profileAPI } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';

// Move the field components outside to prevent recreation
const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, theme }: any) => {
  const isDark = theme === 'dark';
  const styles = {
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      ...(multiline && {
        minHeight: 80,
        textAlignVertical: 'top' as const,
      }),
    },
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
};

const EmergencyContactField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', theme }: any) => {
  const isDark = theme === 'dark';
  const styles = {
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        keyboardType={keyboardType}
      />
    </View>
  );
};

export default function EditProfile() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, updateUser } = useAuth(); 

  const styles = createStyles(theme);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    position: user?.position || '',
    date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
    address: user?.address || '',
    emergency_contact: user?.emergency_contact || {
      name: '',
      phone: '',
      relationship: '',
      email: '',
      address: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profile_picture_url || null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const testImageUrl = async (url: string) => {
    try {
      console.log('🔗 Testing image URL:', url);
      const response = await fetch(url);
      const result = {
        url: url,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      };
      console.log('📊 Image URL test result:', result);
      
      if (response.ok) {
        setDebugInfo(`✅ Image accessible (${response.status}) - ${response.headers.get('content-type')}`);
      } else {
        setDebugInfo(`❌ Image failed (${response.status}) - Check S3 permissions`);
      }
      return result;
    } catch (error) {
      console.log('❌ Image URL test failed:', error);
      return null;
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);
      setDebugInfo('🔄 Starting upload...');

      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile-${Date.now()}.jpg`,
      } as any);

      console.log('📤 Uploading image to backend...');
      const response = await profileAPI.uploadProfilePicture(formData);
      
      console.log('📸 Profile picture response:', {
        profile_picture_url: response.data.profile_picture_url,
        fullResponse: response.data
      });

      const newProfileImage = response.data.profile_picture_url;
      setProfileImage(newProfileImage);
      
      // Test the image URL
      await testImageUrl(newProfileImage);
      
      // Update user in context
      if (updateUser) {
        updateUser(response.data.user);
      }

      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMsg = error.response?.data?.message || 'Failed to upload image';
      setDebugInfo(`❌ Upload failed: ${errorMsg}`);
      Alert.alert('Error', errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const removeProfileImage = async () => {
    try {
      setUploading(true);
      setDebugInfo('🔄 Removing profile picture...');
      
      const response = await profileAPI.removeProfilePicture();
      
      setProfileImage(null);
      setDebugInfo('✅ Profile picture removed');
      
      // Update user in context
      if (updateUser) {
        updateUser(response.data.user);
      }

      Alert.alert('Success', 'Profile picture removed successfully');
    } catch (error: any) {
      console.error('Error removing image:', error);
      const errorMsg = error.response?.data?.message || 'Failed to remove image';
      setDebugInfo(`❌ Remove failed: ${errorMsg}`);
      Alert.alert('Error', errorMsg);
    } finally {
      setUploading(false);
    }
  };

  // Use useCallback for the change handlers to prevent unnecessary re-renders
  const handleFirstNameChange = useCallback((text: string) => {
    setFormData(prev => ({...prev, first_name: text}));
  }, []);

  const handleLastNameChange = useCallback((text: string) => {
    setFormData(prev => ({...prev, last_name: text}));
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    setFormData(prev => ({...prev, email: text}));
  }, []);

  const handlePhoneChange = useCallback((text: string) => {
    setFormData(prev => ({...prev, phone_number: text}));
  }, []);

  const handlePositionChange = useCallback((text: string) => {
    setFormData(prev => ({...prev, position: text}));
  }, []);

  const handleDateOfBirthChange = useCallback((text: string) => {
    setFormData(prev => ({...prev, date_of_birth: text}));
  }, []);

  const handleAddressChange = useCallback((text: string) => {
    setFormData(prev => ({...prev, address: text}));
  }, []);

  const handleEmergencyContactChange = useCallback((field: string, text: string) => {
    setFormData(prev => ({
      ...prev, 
      emergency_contact: {...prev.emergency_contact, [field]: text}
    }));
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Prepare data for API
      const updateData = {
        ...formData,
        // Convert empty strings to undefined to avoid validation issues
        phone_number: formData.phone_number || undefined,
        position: formData.position || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        address: formData.address || undefined,
        emergency_contact: formData.emergency_contact.name ? formData.emergency_contact : undefined
      };

      const response = await profileAPI.updateProfile(updateData);
      
      // Update user in auth context
      if (updateUser) {
        updateUser(response.data);
      }

      Alert.alert(t('success'), t('profileUpdated'), [
        { text: t('ok'), onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert(t('error'), error.response?.data?.message || t('updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (event: any) => {
    console.log('✅ Image loaded successfully:', {
      width: event.nativeEvent.width,
      height: event.nativeEvent.height,
      uri: profileImage
    });
    setDebugInfo(prev => prev + '\n✅ Image rendered successfully');
  };

  const handleImageError = (event: any) => {
    console.log('❌ Image loading error:', event.nativeEvent.error);
    setDebugInfo(prev => prev + '\n❌ Image failed to load');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ForceTouchable onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
        <Text style={styles.title}>{t('editProfile')}</Text>
        <ForceTouchable onPress={handleSave} disabled={loading}>
          <Save size={24} color={loading ? '#9CA3AF' : '#2563EB'} />
        </ForceTouchable>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={[
            styles.avatarContainer,
            profileImage && styles.avatarContainerWithImage
          ]}>
            {profileImage ? (
              <>
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.avatarImage}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  onLoadStart={() => console.log('🔄 Image loading started')}
                  onLoadEnd={() => console.log('🏁 Image loading ended')}
                />
                <ForceTouchable 
                  style={styles.removeImageButton}
                  onPress={removeProfileImage}
                  disabled={uploading}
                >
                  <X size={16} color="#FFFFFF" />
                </ForceTouchable>
              </>
            ) : (
              <Text style={styles.avatarText}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Text>
            )}
          </View>
          
          {/* Debug Information */}
          {debugInfo ? (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>{debugInfo}</Text>
              {profileImage && (
                <Text style={styles.debugUrl} numberOfLines={1}>
                  URL: {profileImage}
                </Text>
              )}
            </View>
          ) : null}

          <ForceTouchable 
            style={styles.changePhotoButton} 
            onPress={pickImage}
            disabled={uploading}
          >
            <Camera size={16} color="#2563EB" />
            <Text style={styles.changePhotoText}>
              {uploading ? t('uploading') : profileImage ? t('changePhoto') : t('addPhoto')}
            </Text>
          </ForceTouchable>

          {/* Test URL Button */}
          {profileImage && (
            <ForceTouchable 
              style={styles.testButton}
              onPress={() => testImageUrl(profileImage)}
            >
              <Text style={styles.testButtonText}>Test Image URL</Text>
            </ForceTouchable>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personalInformation')}</Text>
          
          <InputField
            label={t('firstName')}
            value={formData.first_name}
            onChangeText={handleFirstNameChange}
            placeholder={t('enterFirstName')}
            theme={theme}
          />

          <InputField
            label={t('lastName')}
            value={formData.last_name}
            onChangeText={handleLastNameChange}
            placeholder={t('enterLastName')}
            theme={theme}
          />

          <InputField
            label={t('email')}
            value={formData.email}
            onChangeText={handleEmailChange}
            placeholder={t('enterEmail')}
            keyboardType="email-address"
            theme={theme}
          />

          <InputField
            label={t('phone')}
            value={formData.phone_number}
            onChangeText={handlePhoneChange}
            placeholder={t('enterPhone')}
            keyboardType="phone-pad"
            theme={theme}
          />

          <InputField
            label={t('position')}
            value={formData.position}
            onChangeText={handlePositionChange}
            placeholder={t('enterPosition')}
            theme={theme}
          />

          <InputField
            label={t('dateOfBirth')}
            value={formData.date_of_birth}
            onChangeText={handleDateOfBirthChange}
            placeholder="YYYY-MM-DD"
            theme={theme}
          />

          <InputField
            label={t('address')}
            value={formData.address}
            onChangeText={handleAddressChange}
            placeholder={t('enterAddress')}
            multiline={true}
            theme={theme}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('emergencyContact')}</Text>
          
          <EmergencyContactField
            label={t('contactName')}
            value={formData.emergency_contact.name}
            onChangeText={(text: string) => handleEmergencyContactChange('name', text)}
            placeholder={t('enterContactName')}
            theme={theme}
          />

          <EmergencyContactField
            label={t('contactPhone')}
            value={formData.emergency_contact.phone}
            onChangeText={(text: string) => handleEmergencyContactChange('phone', text)}
            placeholder={t('enterContactPhone')}
            keyboardType="phone-pad"
            theme={theme}
          />

          <EmergencyContactField
            label={t('relationship')}
            value={formData.emergency_contact.relationship}
            onChangeText={(text: string) => handleEmergencyContactChange('relationship', text)}
            placeholder={t('enterRelationship')}
            theme={theme}
          />

          <EmergencyContactField
            label={t('contactEmail')}
            value={formData.emergency_contact.email}
            onChangeText={(text: string) => handleEmergencyContactChange('email', text)}
            placeholder={t('enterContactEmail')}
            keyboardType="email-address"
            theme={theme}
          />

          <InputField
            label={t('contactAddress')}
            value={formData.emergency_contact.address}
            onChangeText={(text: string) => handleEmergencyContactChange('address', text)}
            placeholder={t('enterContactAddress')}
            multiline={true}
            theme={theme}
          />
        </View>

        <ForceTouchable 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? t('saving') : t('saveChanges')}
          </Text>
        </ForceTouchable>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      resizeMode: 'cover',
    },
    removeImageButton: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: '#EF4444',
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      overflow: 'hidden',
      ...Platform.select({
        android: {
          elevation: 3,
        },
      }),
    },
    avatarContainerWithImage: {
      backgroundColor: 'transparent', // Remove blue background when image exists
    },
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    content: {
      flex: 1,
    },
    avatarSection: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    changePhotoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    changePhotoText: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '500',
    },
    // Debug styles
    debugContainer: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      alignSelf: 'stretch',
    },
    debugTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#60A5FA' : '#2563EB',
      marginBottom: 4,
    },
    debugText: {
      fontSize: 11,
      color: isDark ? '#D1D5DB' : '#6B7280',
      lineHeight: 14,
    },
    debugUrl: {
      fontSize: 10,
      color: isDark ? '#9CA3AF' : '#9CA3AF',
      marginTop: 4,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    testButton: {
      backgroundColor: '#10B981',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    testButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    multilineInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    saveButton: {
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      margin: 20,
      ...Platform.select({
        android: {
          elevation: 5,
        },
      }),
    },
    saveButtonDisabled: {
      backgroundColor: '#9CA3AF',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}