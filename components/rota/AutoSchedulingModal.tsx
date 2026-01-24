// src/components/rota/AutoSchedulingModal.tsx - UPDATED WITH PREVIEW FIXES
import { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { X, Cpu, Zap, Calendar, CheckCircle, Clock, Loader2, Eye } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoSchedule } from '@/hooks/useAutoSchedule';
import { AutoScheduleRequest, ScheduleAlgorithm, SchedulePeriod } from '@/app/types/auto-scheduling.types';
import SchedulePreview from './SchedulePreview';

interface AutoSchedulingModalProps {
  visible: boolean;
  onClose: () => void;
  onScheduleGenerated: (schedule: any) => void;
}

interface AlgorithmOption {
  value: ScheduleAlgorithm;
  label: string;
  description: string;
  color: string;
  icon: React.ComponentType<any>;
}

interface PeriodOption {
  value: SchedulePeriod;
  label: string;
  description: string;
}

// Algorithm options
const algorithmOptions: AlgorithmOption[] = [
  {
    value: 'simple',
    label: 'Simple Assignment',
    description: 'Quickly fill shifts with first available staff',
    color: '#3B82F6', // Blue
    icon: Zap,
  },
  {
    value: 'balanced',
    label: 'Balanced Workload',
    description: 'Distribute shifts fairly among all staff',
    color: '#10B981', // Green
    icon: Cpu,
  },
];

// Period options
const periodOptions: PeriodOption[] = [
  { value: 'today', label: 'Today', description: 'Schedule for today only' },
  { value: 'tomorrow', label: 'Tomorrow', description: 'Schedule for tomorrow only' },
  { value: 'this_week', label: 'This Week', description: 'Schedule for Monday to Sunday' },
  { value: 'this_month', label: 'This Month', description: 'Schedule for the current month' },
  { value: 'custom', label: 'Custom Range', description: 'Select specific dates' },
];

export default function AutoSchedulingModal({
  visible,
  onClose,
  onScheduleGenerated,
}: AutoSchedulingModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { generateSchedule, previewSchedule, loading, error } = useAutoSchedule();
  const styles = createStyles(theme);

  const [options, setOptions] = useState<{
    period: SchedulePeriod;
    algorithm: ScheduleAlgorithm;
    start_date?: string;
    end_date?: string;
    auto_create_shifts: boolean;
  }>({
    period: 'this_week',
    algorithm: 'balanced',
    auto_create_shifts: false,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // New states for preview modal
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (options.period === 'custom' && !showDatePicker) {
      setShowDatePicker(true);
    }
  }, [options.period]);

  const handleGeneratePreview = async () => {
    if (!user?.company_id) {
      Alert.alert('Error', 'No company assigned');
      return;
    }

    try {
      setIsPreviewLoading(true);
      
      // Prepare request data
      const requestData: AutoScheduleRequest = {
        period: options.period,
        algorithm: options.algorithm,
        auto_create_shifts: false, // Always false for preview
      };

      // Add dates for custom period
      if (options.period === 'custom') {
        if (!customStartDate || !customEndDate) {
          Alert.alert('Error', 'Please select start and end dates for custom period');
          setIsPreviewLoading(false);
          return;
        }
        requestData.start_date = customStartDate;
        requestData.end_date = customEndDate;
      }

      const result = await previewSchedule(requestData);
      setPreviewData(result);
      setShowPreviewModal(true);
      
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!user?.company_id) {
      Alert.alert('Error', 'No company assigned');
      return;
    }

    try {
      // Prepare request data
      const requestData: AutoScheduleRequest = {
        period: options.period,
        algorithm: options.algorithm,
        auto_create_shifts: true,
      };

      // Add dates for custom period
      if (options.period === 'custom') {
        if (!customStartDate || !customEndDate) {
          Alert.alert('Error', 'Please select start and end dates for custom period');
          return;
        }
        requestData.start_date = customStartDate;
        requestData.end_date = customEndDate;
      }

      const result = await generateSchedule(requestData);
      
      Alert.alert(
        'Success',
        `Schedule created successfully! ${result.stats.filled_shifts} shifts assigned.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onScheduleGenerated(result);
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate schedule');
    }
  };

  const handleFillOpenShifts = async () => {
    if (!user?.company_id) {
      Alert.alert('Error', 'No company assigned');
      return;
    }

    try {
      const requestData: AutoScheduleRequest = {
        period: options.period,
        algorithm: 'balanced',
        auto_create_shifts: true,
      };

      const result = await generateSchedule(requestData);
      
      Alert.alert(
        'Success',
        `Filled ${result.stats.filled_shifts} open shifts`,
        [
          {
            text: 'OK',
            onPress: () => {
              onScheduleGenerated(result);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fill open shifts');
    }
  };

  const handleCreateFromPreview = async () => {
    if (!previewData) return;
    
    try {
      const requestData: AutoScheduleRequest = {
        period: options.period,
        algorithm: options.algorithm,
        auto_create_shifts: true,
        start_date: options.period === 'custom' ? customStartDate : undefined,
        end_date: options.period === 'custom' ? customEndDate : undefined,
      };

      const result = await generateSchedule(requestData);
      setShowPreviewModal(false);
      setPreviewData(null);
      
      Alert.alert(
        'Success',
        `Created ${result.stats.filled_shifts} shifts successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              onScheduleGenerated(result);
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create schedule');
    }
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewData(null);
  };

  const renderAlgorithmOption = (option: AlgorithmOption) => {
    const Icon = option.icon;
    const isActive = options.algorithm === option.value;
    
    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.algorithmOption, isActive && styles.algorithmOptionActive]}
        onPress={() => setOptions(prev => ({ ...prev, algorithm: option.value }))}
        activeOpacity={0.7}
      >
        <View style={[styles.algorithmIcon, { backgroundColor: option.color + '20' }]}>
          <Icon size={20} color={option.color} />
        </View>
        <Text style={[styles.algorithmLabel, isActive && styles.algorithmLabelActive]}>
          {option.label}
        </Text>
        <Text style={styles.algorithmDescription}>{option.description}</Text>
        {isActive && (
          <View style={[styles.activeIndicator, { backgroundColor: option.color }]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderPeriodOption = (option: PeriodOption) => {
    const isActive = options.period === option.value;
    
    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.periodOption, isActive && styles.periodOptionActive]}
        onPress={() => setOptions(prev => ({ ...prev, period: option.value }))}
        activeOpacity={0.7}
      >
        <View style={styles.periodContent}>
          <Calendar size={16} color={isActive ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
          <Text style={[styles.periodLabel, isActive && styles.periodLabelActive]}>
            {option.label}
          </Text>
        </View>
        <Text style={styles.periodDescription}>{option.description}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Main Auto Scheduling Modal */}
      <Modal
        visible={visible && !showPreviewModal} // Hide when preview is open
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Cpu size={24} color={theme === 'dark' ? '#10B981' : '#059669'} />
              <View style={styles.headerText}>
                <Text style={styles.title}>Auto Schedule</Text>
                <Text style={styles.subtitle}>Generate schedules automatically</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Period Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text style={styles.sectionTitle}>Time Period</Text>
              </View>
              
              <View style={styles.periodGrid}>
                {periodOptions.map(renderPeriodOption)}
              </View>

              {options.period === 'custom' && (
                <View style={styles.customDateContainer}>
                  <View style={styles.dateInputGroup}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <TouchableOpacity style={styles.dateInput}>
                      <Text style={styles.dateInputText}>
                        {customStartDate || 'Select date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateInputGroup}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <TouchableOpacity style={styles.dateInput}>
                      <Text style={styles.dateInputText}>
                        {customEndDate || 'Select date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Algorithm Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Cpu size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text style={styles.sectionTitle}>Scheduling Method</Text>
              </View>
              
              <View style={styles.algorithmGrid}>
                {algorithmOptions.map(renderAlgorithmOption)}
              </View>
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <CheckCircle size={20} color={theme === 'dark' ? '#10B981' : '#059669'} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>What this does:</Text>
                <Text style={styles.infoText}>
                  • Generates shifts based on your role patterns{'\n'}
                  • Assigns qualified staff automatically{'\n'}
                  • Respects time-off and availability{'\n'}
                  • Ensures fair workload distribution
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={handleFillOpenShifts} 
              style={styles.secondaryButton}
              disabled={loading}
            >
              <Zap size={20} color="#3B82F6" />
              <Text style={styles.secondaryButtonText}>
                {loading ? 'Processing...' : 'Fill Open Shifts'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.primaryActions}>
              <TouchableOpacity 
                onPress={handleGeneratePreview} 
                style={styles.previewButton}
                disabled={loading || isPreviewLoading}
              >
                {isPreviewLoading ? (
                  <Loader2 size={20} color="#FFFFFF" />
                ) : (
                  <Eye size={20} color="#FFFFFF" />
                )}
                <Text style={styles.previewButtonText}>
                  {isPreviewLoading ? 'Generating...' : 'Preview Schedule'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleGenerateSchedule} 
                style={styles.generateButton}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={20} color="#FFFFFF" />
                ) : (
                  <Zap size={20} color="#FFFFFF" />
                )}
                <Text style={styles.generateButtonText}>
                  {loading ? 'Creating...' : 'Create Now'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Schedule Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClosePreview}
      >
        <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 60 : 20 }]}>
          {/* Preview Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Eye size={24} color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
              <View style={styles.headerText}>
                <Text style={styles.title}>Schedule Preview</Text>
                {previewData && (
                  <Text style={styles.subtitle}>
                    Preview • {previewData.stats.filled_shifts} of {previewData.stats.total_shifts} shifts filled ({previewData.stats.coverage_percentage}% coverage)
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity 
              onPress={handleClosePreview} 
              style={styles.closeButton}
            >
              <X size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
            </TouchableOpacity>
          </View>

          {/* Preview Content */}
          {previewData ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <SchedulePreview schedule={previewData} />
            </ScrollView>
          ) : (
            <View style={styles.loadingContainer}>
              <Loader2 size={40} color={theme === 'dark' ? '#3B82F6' : '#2563EB'} style={styles.loadingSpinner} />
              <Text style={styles.loadingText}>Generating preview...</Text>
            </View>
          )}

          {/* Preview Actions */}
          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={handleClosePreview} 
              style={styles.cancelButton}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Back to Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleCreateFromPreview} 
              style={styles.confirmButton}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={20} color="#FFFFFF" />
              ) : (
                <Zap size={20} color="#FFFFFF" />
              )}
              <Text style={styles.confirmButtonText}>
                {loading ? 'Creating...' : 'Create This Schedule'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 20,
    marginBottom: 16,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  periodGrid: {
    gap: 8,
  },
  periodOption: {
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  periodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  periodLabelActive: {
    color: '#FFFFFF',
  },
  periodDescription: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  customDateContainer: {
    marginTop: 16,
    gap: 12,
  },
  dateInputGroup: {
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  dateInput: {
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
  },
  dateInputText: {
    fontSize: 14,
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  algorithmGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  algorithmOption: {
    flex: 1,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
  },
  algorithmOptionActive: {
    backgroundColor: theme === 'dark' ? '#1E3A8A' : '#DBEAFE',
    borderColor: '#3B82F6',
  },
  algorithmIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  algorithmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  algorithmLabelActive: {
    color: '#3B82F6',
  },
  algorithmDescription: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoSection: {
    margin: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#065F46' : '#D1FAE5',
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#D1FAE5' : '#065F46',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: theme === 'dark' ? '#D1FAE5' : '#065F46',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  generateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  cancelButton: {
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});