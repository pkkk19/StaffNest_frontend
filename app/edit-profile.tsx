import { View, Text, ScrollView, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { ArrowLeft, Save, Camera } from 'lucide-react-native';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ForceTouchable from '@/components/ForceTouchable';

export default function EditProfile() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const styles = createStyles(theme);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+44 123 456 7890',
    address: '123 Main Street, London, UK',
    emergencyContactName: 'John Johnson',
    emergencyContactPhone: '+44 987 654 3210',
    emergencyContactRelationship: 'Spouse',
  });

  const handleSave = () => {
    Alert.alert(t('success'), t('profileUpdated'), [
      { text: t('ok'), onPress: () => router.back() }
    ]);
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) => (
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ForceTouchable onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </ForceTouchable>
        <Text style={styles.title}>{t('editProfile')}</Text>
        <ForceTouchable onPress={handleSave}>
          <Save size={24} color="#2563EB" />
        </ForceTouchable>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user?.avatar}</Text>
          </View>
          <ForceTouchable style={styles.changePhotoButton}>
            <Camera size={16} color="#2563EB" />
            <Text style={styles.changePhotoText}>{t('changePhoto')}</Text>
          </ForceTouchable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personalInformation')}</Text>
          
          <InputField
            label={t('fullName')}
            value={formData.name}
            onChangeText={(text: string) => setFormData({...formData, name: text})}
            placeholder={t('enterFullName')}
          />

          <InputField
            label={t('email')}
            value={formData.email}
            onChangeText={(text: string) => setFormData({...formData, email: text})}
            placeholder={t('enterEmail')}
            keyboardType="email-address"
          />

          <InputField
            label={t('phone')}
            value={formData.phone}
            onChangeText={(text: string) => setFormData({...formData, phone: text})}
            placeholder={t('enterPhone')}
            keyboardType="phone-pad"
          />

          <InputField
            label={t('address')}
            value={formData.address}
            onChangeText={(text: string) => setFormData({...formData, address: text})}
            placeholder={t('enterAddress')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('emergencyContact')}</Text>
          
          <InputField
            label={t('contactName')}
            value={formData.emergencyContactName}
            onChangeText={(text: string) => setFormData({...formData, emergencyContactName: text})}
            placeholder={t('enterContactName')}
          />

          <InputField
            label={t('contactPhone')}
            value={formData.emergencyContactPhone}
            onChangeText={(text: string) => setFormData({...formData, emergencyContactPhone: text})}
            placeholder={t('enterContactPhone')}
            keyboardType="phone-pad"
          />

          <InputField
            label={t('relationship')}
            value={formData.emergencyContactRelationship}
            onChangeText={(text: string) => setFormData({...formData, emergencyContactRelationship: text})}
            placeholder={t('enterRelationship')}
          />
        </View>

        <ForceTouchable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('saveChanges')}</Text>
        </ForceTouchable>
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
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        android: {
          elevation: 3, // Android shadow
        },
      }),
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
    },
    changePhotoText: {
      fontSize: 14,
      color: '#2563EB',
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
    saveButton: {
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      margin: 20,
      // REMOVED shadow properties - using platform-specific
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
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}