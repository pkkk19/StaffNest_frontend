import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { X, Send, Clock, MapPin } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { Shift } from '@/app/types/rota.types';

interface ShiftRequestModalProps {
  visible: boolean;
  shift: Shift | null;
  onClose: () => void;
  onSubmit: (shiftId: string, notes: string) => Promise<void>;
  loading?: boolean;
}

export default function ShiftRequestModal({
  visible,
  shift,
  onClose,
  onSubmit,
  loading = false,
}: ShiftRequestModalProps) {
  const { theme } = useTheme();
  const [notes, setNotes] = useState('');
  const styles = createStyles(theme);

  if (!shift) return null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSubmit = async () => {
    if (!shift) return;

    try {
      await onSubmit(shift._id, notes);
      setNotes('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit shift request');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Request Shift</Text>
          <ForceTouchable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </ForceTouchable>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.shiftInfo}>
            <Text style={styles.shiftTitle}>{shift.title}</Text>
            
            <View style={styles.detailRow}>
              <Clock size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.detailText}>
                {formatDate(shift.start_time)} • {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MapPin size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.detailText}>Main Location</Text>
            </View>

            {shift.description && (
              <Text style={styles.description}>{shift.description}</Text>
            )}
          </View>

          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Additional Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes for the admin..."
              placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.footer}>
            <ForceTouchable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </ForceTouchable>
            
            <ForceTouchable 
              onPress={handleSubmit} 
              style={styles.submitButton}
              disabled={loading}
            >
              <Send size={18} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Text>
            </ForceTouchable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  shiftInfo: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  shiftTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  description: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: 14,
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});