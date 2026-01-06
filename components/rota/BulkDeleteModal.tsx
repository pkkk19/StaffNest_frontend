import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { X, Calendar, Users, Tag, Trash2, AlertTriangle, Clock, User } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface BulkDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onDelete: (data: any) => Promise<void>;
}

const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  visible,
  onClose,
  onDelete,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [deleteData, setDeleteData] = useState({
    period: 'custom', // 'today', 'week', 'month', 'custom'
    start_date: '',
    end_date: '',
    day: '',
    month: '',
    week: '',
    user_id: '',
    status: '',
    type: '',
    force: false,
  });

  const styles = createStyles(theme);

  const handleDelete = async () => {
    if (!deleteData.force) {
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to delete these shifts? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await performDelete();
            },
          },
        ]
      );
    } else {
      await performDelete();
    }
  };

  const performDelete = async () => {
    setLoading(true);
    try {
      // Prepare data based on selected period
      const dataToSend: any = {};

      if (deleteData.period === 'today') {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
        dataToSend.day = formattedDate;
      } else if (deleteData.period === 'week') {
        // Calculate current week in ISO format (YYYY-Www)
        const today = new Date();
        const year = today.getFullYear();
        const weekNumber = getWeekNumber(today);
        dataToSend.week = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
      } else if (deleteData.period === 'month') {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        dataToSend.month = `${year}-${month}`;
      } else if (deleteData.period === 'custom') {
        if (deleteData.start_date && deleteData.end_date) {
          dataToSend.start_date = deleteData.start_date;
          dataToSend.end_date = deleteData.end_date;
        } else if (deleteData.day) {
          dataToSend.day = deleteData.day;
        } else if (deleteData.month) {
          dataToSend.month = deleteData.month;
        } else if (deleteData.week) {
          dataToSend.week = deleteData.week;
        }
      }

      // Add filters
      if (deleteData.user_id) {
        dataToSend.user_id = deleteData.user_id;
      }
      if (deleteData.status) {
        dataToSend.status = deleteData.status;
      }
      if (deleteData.type) {
        dataToSend.type = deleteData.type;
      }
      if (deleteData.force) {
        dataToSend.force = deleteData.force;
      }

      await onDelete(dataToSend);
      onClose();
      Alert.alert('Success', 'Shifts deleted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete shifts');
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date: Date): number => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };

  const renderPeriodSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Delete Period</Text>
      <View style={styles.periodButtons}>
        {['today', 'week', 'month', 'custom'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              deleteData.period === period && styles.periodButtonActive,
            ]}
            onPress={() => setDeleteData({ ...deleteData, period })}
          >
            <Text
              style={[
                styles.periodButtonText,
                deleteData.period === period && styles.periodButtonTextActive,
              ]}
            >
              {period === 'today' ? 'Today' :
               period === 'week' ? 'This Week' :
               period === 'month' ? 'This Month' : 'Custom'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCustomDateInputs = () => {
    if (deleteData.period !== 'custom') return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Date Range</Text>
        <View style={styles.dateInputContainer}>
          <View style={styles.dateInputWrapper}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={deleteData.day || deleteData.start_date}
              onChangeText={(text) => {
                if (deleteData.day) {
                  setDeleteData({ ...deleteData, day: text, start_date: '', end_date: '' });
                } else {
                  setDeleteData({ ...deleteData, start_date: text, day: '' });
                }
              }}
            />
          </View>
          
          <View style={styles.dateInputWrapper}>
            <Text style={styles.dateLabel}>End Date</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={deleteData.end_date}
              onChangeText={(text) => setDeleteData({ ...deleteData, end_date: text })}
              editable={!deleteData.day}
            />
          </View>
        </View>
        
        <View style={styles.quickDateButtons}>
          <Text style={styles.quickDateLabel}>Or select:</Text>
          <View style={styles.quickDateRow}>
            <TouchableOpacity
              style={styles.quickDateButton}
              onPress={() => {
                const today = new Date().toISOString().split('T')[0];
                setDeleteData({
                  ...deleteData,
                  day: today,
                  start_date: '',
                  end_date: '',
                });
              }}
            >
              <Text style={styles.quickDateButtonText}>Today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickDateButton}
              onPress={() => {
                const today = new Date();
                const month = (today.getMonth() + 1).toString().padStart(2, '0');
                setDeleteData({
                  ...deleteData,
                  month: `${today.getFullYear()}-${month}`,
                  day: '',
                  start_date: '',
                  end_date: '',
                });
              }}
            >
              <Text style={styles.quickDateButtonText}>This Month</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickDateButton}
              onPress={() => {
                const today = new Date();
                const weekNumber = getWeekNumber(today);
                setDeleteData({
                  ...deleteData,
                  week: `${today.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`,
                  day: '',
                  start_date: '',
                  end_date: '',
                });
              }}
            >
              <Text style={styles.quickDateButtonText}>This Week</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Filters (Optional)</Text>
      
      <View style={styles.filterInputWrapper}>
        <Users size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        <TextInput
          style={styles.filterInput}
          placeholder="User ID (leave empty for all users)"
          value={deleteData.user_id}
          onChangeText={(text) => setDeleteData({ ...deleteData, user_id: text })}
        />
      </View>
      
      <View style={styles.filterRow}>
        <View style={styles.filterInputWrapper}>
          <Tag size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <TextInput
            style={styles.filterInput}
            placeholder="Status (e.g., scheduled)"
            value={deleteData.status}
            onChangeText={(text) => setDeleteData({ ...deleteData, status: text })}
          />
        </View>
        
        <View style={styles.filterInputWrapper}>
          <User size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <TextInput
            style={styles.filterInput}
            placeholder="Type (assigned or open)"
            value={deleteData.type}
            onChangeText={(text) => setDeleteData({ ...deleteData, type: text })}
          />
        </View>
      </View>
    </View>
  );

  const renderForceOption = () => (
    <View style={styles.section}>
      <View style={styles.forceRow}>
        <View style={styles.forceLabelContainer}>
          <AlertTriangle size={20} color="#F59E0B" />
          <View style={styles.forceTextContainer}>
            <Text style={styles.forceTitle}>Force Delete</Text>
            <Text style={styles.forceDescription}>
              Delete shifts even if they have started or are in-progress
            </Text>
          </View>
        </View>
        <Switch
          value={deleteData.force}
          onValueChange={(value) => setDeleteData({ ...deleteData, force: value })}
          trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <Trash2 size={24} color="#EF4444" />
              <Text style={styles.modalTitle}>Bulk Delete Shifts</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {renderPeriodSelector()}
            {renderCustomDateInputs()}
            {renderFilters()}
            {renderForceOption()}
            
            <View style={styles.warningBox}>
              <AlertTriangle size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                This action cannot be undone. All selected shifts and their associated requests will be permanently deleted.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Trash2 size={20} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Delete Shifts</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: string) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: 400,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodButtonActive: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: 6,
  },
  dateInput: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
  },
  quickDateButtons: {
    marginTop: 8,
  },
  quickDateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: 8,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 6,
    alignItems: 'center',
  },
  quickDateButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  filterInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    marginBottom: 12,
  },
  filterInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    fontSize: 14,
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  forceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forceLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  forceTextContainer: {
    flex: 1,
  },
  forceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 2,
  },
  forceDescription: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    lineHeight: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#78350F' : '#FEF3C7',
    borderRadius: 8,
    margin: 20,
    marginTop: 0,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: theme === 'dark' ? '#FCD34D' : '#92400E',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  deleteButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BulkDeleteModal;