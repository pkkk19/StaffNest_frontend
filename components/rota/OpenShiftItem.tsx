// components/rota/OpenShiftItem.tsx
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Clock, MapPin, Calendar, User, AlertCircle, X, MessageSquare } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Shift } from '@/app/types/rota.types';
import { useState, useRef } from 'react';

interface OpenShiftItemProps {
  shift: Shift;
  onRequest: (shiftId: string, notes?: string) => Promise<void>;
  requestLoading?: boolean;
  isRequesting?: boolean;
}

export default function OpenShiftItem({ shift, onRequest, requestLoading, isRequesting: externalIsRequesting }: OpenShiftItemProps) {
  const { theme } = useTheme();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const [internalIsRequesting, setInternalIsRequesting] = useState(false);
  const requestInProgress = useRef(false);
  const styles = createStyles(theme);

  // Use external or internal state
  const isRequesting = externalIsRequesting !== undefined ? externalIsRequesting : internalIsRequesting;

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
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDuration = () => {
    const start = new Date(shift.start_time);
    const end = new Date(shift.end_time);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  const handleRequestPress = () => {
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    // Prevent multiple clicks
    if (requestInProgress.current || isRequesting) return;
    
    requestInProgress.current = true;
    if (externalIsRequesting === undefined) {
      setInternalIsRequesting(true);
    }

    try {
      await onRequest(shift._id, requestNotes.trim() || 'Interested in this shift');
      setShowRequestModal(false);
      setRequestNotes('');
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      requestInProgress.current = false;
      if (externalIsRequesting === undefined) {
        setInternalIsRequesting(false);
      }
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Calendar size={16} color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
            <Text style={styles.dateText}>{formatDateTime(shift.start_time)}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>OPEN</Text>
          </View>
        </View>

        <Text style={styles.title}>{shift.title}</Text>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Clock size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.detailText}>
              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
            </Text>
            <Text style={styles.durationText}>({calculateDuration()}h)</Text>
          </View>

          {shift.location && (
            <View style={styles.detailRow}>
              <MapPin size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.detailText}>{shift.location}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <User size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.detailText}>
              Posted by {shift.created_by.first_name} {shift.created_by.last_name}
            </Text>
          </View>
        </View>

        {shift.description && (
          <Text style={styles.description} numberOfLines={2}>
            {shift.description}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.requestButton, isRequesting && styles.requestButtonDisabled]}
          onPress={handleRequestPress}
          disabled={isRequesting}
          activeOpacity={0.8}
        >
          <Text style={styles.requestButtonText}>
            {isRequesting ? 'Requesting...' : 'Request Shift'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Shift</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowRequestModal(false)}
              >
                <X size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            {/* Shift Details */}
            <View style={styles.shiftDetails}>
              <View style={styles.shiftDetailCard}>
                <Text style={styles.shiftDetailTitle}>{shift.title}</Text>
                
                <View style={styles.shiftDetailRow}>
                  <Calendar size={18} color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
                  <Text style={styles.shiftDetailText}>
                    {formatDate(shift.start_time)}
                  </Text>
                </View>

                <View style={styles.shiftDetailRow}>
                  <Clock size={18} color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
                  <Text style={styles.shiftDetailText}>
                    {formatTime(shift.start_time)} - {formatTime(shift.end_time)} ({calculateDuration()} hours)
                  </Text>
                </View>

                {shift.location && (
                  <View style={styles.shiftDetailRow}>
                    <MapPin size={18} color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
                    <Text style={styles.shiftDetailText}>{shift.location}</Text>
                  </View>
                )}

                {shift.description && (
                  <View style={styles.shiftDescriptionContainer}>
                    <Text style={styles.shiftDescriptionLabel}>Description:</Text>
                    <Text style={styles.shiftDescriptionText}>{shift.description}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Notes Input */}
            <View style={styles.notesContainer}>
              <View style={styles.notesHeader}>
                <MessageSquare size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text style={styles.notesTitle}>Add Notes (Optional)</Text>
              </View>
              
              <TextInput
                style={styles.notesInput}
                placeholder="Add any notes for the manager... (e.g., 'Available for overtime', 'Can start earlier', etc.)"
                placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                value={requestNotes}
                onChangeText={setRequestNotes}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              
              <Text style={styles.charCount}>
                {requestNotes.length}/500 characters
              </Text>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRequestModal(false)}
                disabled={isRequesting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, isRequesting && styles.submitButtonDisabled]}
                onPress={handleSubmitRequest}
                disabled={isRequesting}
              >
                <Text style={styles.submitButtonText}>
                  {isRequesting ? 'Submitting...' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info Note */}
            <View style={styles.infoNote}>
              <AlertCircle size={16} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
              <Text style={styles.infoNoteText}>
                Your request will be reviewed by a manager. You'll be notified once it's approved or rejected.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  // Existing styles...
  container: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    shadowColor: theme === 'dark' ? '#000' : '#E5E7EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#3B82F6' : '#2563EB',
  },
  typeBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 12,
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    flex: 1,
  },
  durationText: {
    fontSize: 12,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  requestButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  requestButtonDisabled: {
    backgroundColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftDetails: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  shiftDetailCard: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
  },
  shiftDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 16,
  },
  shiftDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  shiftDetailText: {
    fontSize: 15,
    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  shiftDescriptionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
  },
  shiftDescriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: 8,
  },
  shiftDescriptionText: {
    fontSize: 14,
    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
    lineHeight: 20,
  },
  notesContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  notesInput: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonDisabled: {
    backgroundColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    marginHorizontal: 24,
    borderRadius: 12,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    lineHeight: 18,
  },
});