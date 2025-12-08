import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Building, MapPin, Phone, Mail, Globe } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CompanyData } from './types';

interface CompanyInfoSectionProps {
  companyData: CompanyData;
  isEditing: boolean;
  onFieldChange: (field: string, value: string) => void;
}

interface InfoFieldProps {
  icon: any;
  label: string;
  value: string;
  field: string;
  editable?: boolean;
  isEditing: boolean;
  onFieldChange: (field: string, value: string) => void;
}

function InfoField({ 
  icon: Icon, 
  label, 
  value, 
  field,
  editable = true,
  isEditing,
  onFieldChange 
}: InfoFieldProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.infoField}>
      <View style={styles.fieldHeader}>
        <Icon size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing && editable ? (
        <TextInput
          style={styles.textInput}
          value={value || ''}
          onChangeText={(text) => onFieldChange(field, text)}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not set'}</Text>
      )}
    </View>
  );
}

export default function CompanyInfoSection({ 
  companyData, 
  isEditing, 
  onFieldChange 
}: CompanyInfoSectionProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <InfoField
        icon={Building}
        label="Company Name"
        value={companyData.name}
        field="name"
        isEditing={isEditing}
        onFieldChange={onFieldChange}
      />
      
      <InfoField
        icon={MapPin}
        label="Address"
        value={companyData.address || ''}
        field="address"
        isEditing={isEditing}
        onFieldChange={onFieldChange}
      />
      
      <InfoField
        icon={Phone}
        label="Phone"
        value={companyData.phone_number || ''}
        field="phone_number"
        isEditing={isEditing}
        onFieldChange={onFieldChange}
      />
      
      <InfoField
        icon={Mail}
        label="Email"
        value={companyData.email || ''}
        field="email"
        isEditing={isEditing}
        onFieldChange={onFieldChange}
      />
      
      <InfoField
        icon={Globe}
        label="Website"
        value={companyData.website || ''}
        field="website"
        isEditing={isEditing}
        onFieldChange={onFieldChange}
      />
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  section: {
    marginBottom: 32,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 16,
  },
  infoField: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    paddingLeft: 28,
  },
  textInput: {
    fontSize: 16,
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    backgroundColor: theme === 'dark' ? '#374151' : '#F9FAFB',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    marginLeft: 28,
  },
});