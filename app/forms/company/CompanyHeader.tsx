import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CompanyHeaderProps {
  title: string;
  isEditing: boolean;
  loading: boolean;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
}

export default function CompanyHeader({ 
  title, 
  isEditing, 
  loading, 
  onBack, 
  onEdit, 
  onSave 
}: CompanyHeaderProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleBackPress = () => {
    console.log('Back button pressed');
    onBack?.();
  };

  const handleEditPress = () => {
    console.log('Edit button pressed');
    onEdit?.();
  };

  const handleSavePress = () => {
    console.log('Save button pressed');
    onSave?.();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleBackPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.6}
      >
        <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#111827'} />
      </TouchableOpacity>
      
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.headerActions}>
        {isEditing ? (
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSavePress}
            disabled={loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={handleEditPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 60 : 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    minHeight: 80,
  },
  backButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
    marginRight: -40,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    justifyContent: 'flex-end',
  },
  editButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    minHeight: 40,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});