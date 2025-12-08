import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Building, Save, ArrowLeft, MapPin, Phone, Camera } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { companiesAPI } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';

export default function CompanySetup() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    phone_number: '',
  });

  const styles = createStyles(theme);

  useEffect(() => {
    // Check if user already has a company
    if (user?.company_id) {
      router.replace('/forms/company-info');
    }
  }, [user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  const uploadLogo = async (companyId: string) => {
    if (!logo) return;

    try {
      const formData = new FormData();
      const file = {
        uri: logo,
        type: 'image/jpeg',
        name: 'company-logo.jpg',
      } as any;
      
      formData.append('file', file);
      await companiesAPI.uploadLogo(formData);
    } catch (error) {
      console.error('Error uploading logo:', error);
      // Continue even if logo upload fails
    }
  };

  const handleCreateCompany = async () => {
    if (!companyData.name.trim()) {
      Alert.alert('Error', 'Company name is required');
      return;
    }

    setLoading(true);
    try {
      // Create company
      const response = await companiesAPI.createCompany(companyData);
      const company = response.data;

      // Upload logo if selected
      if (logo) {
        await uploadLogo(company._id);
      }

      // Update user context with new company_id
      if (user) {
        updateUser({
          ...user,
          company_id: company._id
        });
      }

      Alert.alert('Success', 'Company created successfully!', [
        { text: 'OK', onPress: () => router.replace('/forms/company-info') }
      ]);
    } catch (error: any) {
      console.error('Error creating company:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#111827'} />
        </TouchableOpacity>
        <Text style={styles.title}>Setup Your Company</Text>
        <View style={styles.headerActions} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <Text style={styles.description}>
            Let's set up your company profile. You can add more details later.
          </Text>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <TouchableOpacity style={styles.logoContainer} onPress={pickImage}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Building size={32} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Camera size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.logoText}>Add Company Logo</Text>
          </View>

          {/* Company Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name *</Text>
              <TextInput
                style={styles.textInput}
                value={companyData.name}
                onChangeText={(text) => setCompanyData(prev => ({ ...prev, name: text }))}
                placeholder="Enter company name"
                placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.textInput}
                value={companyData.address}
                onChangeText={(text) => setCompanyData(prev => ({ ...prev, address: text }))}
                placeholder="Enter company address"
                placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={companyData.phone_number}
                onChangeText={(text) => setCompanyData(prev => ({ ...prev, phone_number: text }))}
                placeholder="Enter phone number"
                placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity 
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateCompany}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating Company...' : 'Create Company'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            * Required field. You can add more company details like locations and settings after creation.
          </Text>
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      paddingTop: 60,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    backButton: {
      padding: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
      textAlign: 'center',
      marginLeft: -40,
    },
    headerActions: {
      width: 40, // Balance the back button
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 24,
      lineHeight: 22,
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoContainer: {
      position: 'relative',
      marginBottom: 12,
    },
    logoPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#4B5563' : '#D1D5DB',
      borderStyle: 'dashed',
    },
    logoImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    cameraIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#2563EB',
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    logoText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    form: {
      gap: 20,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    textInput: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#D1D5DB',
      borderRadius: 8,
      padding: 12,
    },
    createButton: {
      backgroundColor: '#2563EB',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 16,
    },
    createButtonDisabled: {
      backgroundColor: '#9CA3AF',
    },
    createButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    note: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
      textAlign: 'center',
      lineHeight: 16,
    },
  });
}