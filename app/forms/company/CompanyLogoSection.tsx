import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Building, Camera } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CompanyLogoSectionProps {
  logo: string | null;
  companyName: string;
  isEditing: boolean;
  onPickImage: () => void;
  onRemoveLogo: () => void;
}

export default function CompanyLogoSection({ 
  logo, 
  companyName, 
  isEditing, 
  onPickImage, 
  onRemoveLogo 
}: CompanyLogoSectionProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.logoSection}>
      <TouchableOpacity 
        style={styles.logoContainer} 
        onPress={isEditing ? onPickImage : undefined}
        disabled={!isEditing}
      >
        {logo ? (
          <Image source={{ uri: logo }} style={styles.logoImage} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Building size={32} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          </View>
        )}
        {isEditing && (
          <View style={styles.cameraIcon}>
            <Camera size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
      
      <Text style={styles.companyName}>{companyName}</Text>
      
      {isEditing && logo && (
        <TouchableOpacity style={styles.removeLogoButton} onPress={onRemoveLogo}>
          <Text style={styles.removeLogoText}>Remove Logo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 20,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
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
    borderColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
  },
  companyName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 8,
  },
  removeLogoButton: {
    padding: 8,
  },
  removeLogoText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
});