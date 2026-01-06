// Update src/components/rota/AutoSchedulingModal.tsx
import { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, Alert } from 'react-native';
import { X, Cpu, Zap, Calendar, Users, AlertCircle, Clock, CheckCircle, Settings } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoSchedule } from '@/hooks/useAutoSchedule';
import { AutoScheduleRequest } from '@/app/types/auto-scheduling.types';

interface AutoSchedulingModalProps {
  visible: boolean;
  onClose: () => void;
  onScheduleGenerated: (schedule: any) => void;
}

// Valid algorithm values
type AlgorithmValue = 'fair_share' | 'round_robin' | 'coverage_first' | 'preference_based';
type PeriodValue = 'day' | 'week' | 'month';

interface AlgorithmOption {
  value: AlgorithmValue;
  label: string;
  description: string;
  best_for: string[];
  color?: string;
}

// Default algorithms
const defaultAlgorithms: AlgorithmOption[] = [
  { 
    value: 'fair_share', 
    label: 'Fair Share', 
    description: 'Balances workload evenly among staff', 
    best_for: ['Balancing workload', 'Team morale', 'Long-term schedules'],
    color: '#10B981' 
  },
  { 
    value: 'round_robin', 
    label: 'Round Robin', 
    description: 'Simple rotation among available staff', 
    best_for: ['Simple schedules', 'Teams with similar skills', 'Basic requirements'],
    color: '#3B82F6' 
  },
  { 
    value: 'coverage_first', 
    label: 'Coverage First', 
    description: 'Ensures all shifts are filled first', 
    best_for: ['Critical shifts', 'Emergency coverage', 'Minimum staffing requirements'],
    color: '#F59E0B' 
  },
  { 
    value: 'preference_based', 
    label: 'Preference Based', 
    description: 'Prioritizes staff preferences when assigning shifts', 
    best_for: ['Staff satisfaction', 'Flexible workplaces', 'Retention-focused teams'],
    color: '#8B5CF6' 
  },
];

// Color mapping for algorithms
const algorithmColors: Record<AlgorithmValue | string, string> = {
  'fair_share': '#10B981',
  'round_robin': '#3B82F6',
  'coverage_first': '#F59E0B',
  'preference_based': '#8B5CF6',
  'default': '#6B7280',
};

const periodOptions = [
  { value: 'day' as const, label: 'Today', description: 'Generate schedule for today' },
  { value: 'week' as const, label: 'This Week', description: 'Generate schedule for this week' },
  { value: 'month' as const, label: 'This Month', description: 'Generate schedule for this month' },
];

export default function AutoSchedulingModal({
  visible,
  onClose,
  onScheduleGenerated,
}: AutoSchedulingModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { generateSchedule, previewSchedule, loading, error, fetchAlgorithms, algorithms } = useAutoSchedule();
  const styles = createStyles(theme);

  const [options, setOptions] = useState({
    period: 'week' as PeriodValue,
    algorithm: 'fair_share' as AlgorithmValue,
    start_date: undefined as string | undefined,
    end_date: undefined as string | undefined,
    fill_open_only: false,
    consider_preferences: true,
    ensure_legal_compliance: true,
    optimize_existing: false,
    auto_create_shifts: false,
    balance_workload: true,
  });

  useEffect(() => {
    if (visible) {
      fetchAlgorithms();
    }
  }, [visible, fetchAlgorithms]);

  const handleGenerateSchedule = async (autoCreate: boolean = false) => {
    if (!user?.company_id) {
      Alert.alert('Error', 'No company assigned');
      return;
    }

    try {
      // Create request with proper typing - match AutoScheduleRequest type
      const scheduleOptions: AutoScheduleRequest = {
        period: options.period,
        algorithm: options.algorithm,
        start_date: options.start_date,
        end_date: options.end_date,
        fill_open_only: options.fill_open_only,
        consider_preferences: options.consider_preferences,
        ensure_legal_compliance: options.ensure_legal_compliance,
        optimize_existing: options.optimize_existing,
        auto_create_shifts: autoCreate,
        balance_workload: options.balance_workload,
      };

      let result;
      if (autoCreate) {
        result = await generateSchedule(scheduleOptions);
      } else {
        // For preview, remove auto_create_shifts from the request
        const { auto_create_shifts, ...previewOptions } = scheduleOptions;
        result = await previewSchedule(previewOptions);
      }

      Alert.alert(
        'Success',
        autoCreate 
          ? `Schedule generated and ${result.created_shifts?.length || 0} shifts created`
          : 'Schedule generated successfully. Review before creating shifts.',
        [
          {
            text: 'OK',
            onPress: () => {
              onScheduleGenerated(result);
              if (!autoCreate) {
                onClose();
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate schedule');
    }
  };

  const optionItems = [
    {
      id: 'fill_open_only',
      icon: Users,
      label: 'Fill Open Shifts Only',
      description: 'Only fill shifts that are currently unassigned',
      color: '#8B5CF6',
    },
    {
      id: 'consider_preferences',
      icon: CheckCircle,
      label: 'Consider Preferences',
      description: 'Respect staff shift preferences when possible',
      color: '#10B981',
    },
    {
      id: 'ensure_legal_compliance',
      icon: AlertCircle,
      label: 'Legal Compliance',
      description: 'Ensure breaks and maximum hours are respected',
      color: '#F59E0B',
    },
    {
      id: 'optimize_existing',
      icon: Zap,
      label: 'Optimize Existing',
      description: 'Improve existing schedule instead of creating new',
      color: '#3B82F6',
    },
    {
      id: 'balance_workload',
      icon: Settings,
      label: 'Balance Workload',
      description: 'Distribute hours evenly among staff',
      color: '#EC4899',
    },
  ];

  // Filter and format algorithms from hook
  const displayAlgorithms = (() => {
    if (algorithms.length > 0) {
      // Filter to only include valid algorithm values
      return algorithms
        .filter(algo => 
          algo.value === 'fair_share' || 
          algo.value === 'round_robin' || 
          algo.value === 'coverage_first' || 
          algo.value === 'preference_based'
        )
        .map(algo => {
          // Map the algorithm data from backend to our interface
          const baseAlgo = defaultAlgorithms.find(a => a.value === algo.value) || defaultAlgorithms[0];
          return {
            value: algo.value as AlgorithmValue,
            label: baseAlgo.label,
            description: baseAlgo.description,
            best_for: baseAlgo.best_for,
            color: algorithmColors[algo.value] || algorithmColors.default
          };
        });
    }
    return defaultAlgorithms;
  })();

  // Get color for an algorithm
  const getAlgorithmColor = (algorithmValue: string): string => {
    return algorithmColors[algorithmValue as AlgorithmValue] || algorithmColors.default;
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
          <View style={styles.headerContent}>
            <Cpu size={24} color={theme === 'dark' ? '#10B981' : '#059669'} />
            <View style={styles.headerText}>
              <Text style={styles.title}>Auto Schedule Generator</Text>
              <Text style={styles.subtitle}>Algorithm-based scheduling</Text>
            </View>
          </View>
          <ForceTouchable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </ForceTouchable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Algorithm Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Settings size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.sectionTitle}>Scheduling Algorithm</Text>
            </View>
            
            <View style={styles.algorithmGrid}>
              {displayAlgorithms.map((algo) => {
                const isActive = options.algorithm === algo.value;
                const color = algo.color || getAlgorithmColor(algo.value);
                
                return (
                  <ForceTouchable
                    key={algo.value}
                    style={[styles.algorithmOption, isActive && styles.algorithmOptionActive]}
                    onPress={() => setOptions(prev => ({ ...prev, algorithm: algo.value }))}
                  >
                    <View style={[styles.algorithmIcon, { backgroundColor: color + '20' }]}>
                      <Cpu size={20} color={color} />
                    </View>
                    <Text style={[styles.algorithmLabel, isActive && styles.algorithmLabelActive]}>
                      {algo.label}
                    </Text>
                    <Text style={styles.algorithmDescription}>{algo.description}</Text>
                    
                    {/* Best for chips */}
                    {algo.best_for.length > 0 && (
                      <View style={styles.bestForContainer}>
                        {algo.best_for.slice(0, 2).map((item: string, index: number) => (
                          <View key={index} style={[styles.bestForChip, { backgroundColor: color + '20' }]}>
                            <Text style={[styles.bestForText, { color }]} numberOfLines={1}>
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </ForceTouchable>
                );
              })}
            </View>
          </View>

          {/* Period Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.sectionTitle}>Schedule Period</Text>
            </View>
            
            <View style={styles.periodGrid}>
              {periodOptions.map((period) => {
                const isActive = options.period === period.value;
                
                return (
                  <ForceTouchable
                    key={period.value}
                    style={[styles.periodOption, isActive && styles.periodOptionActive]}
                    onPress={() => setOptions(prev => ({ 
                      ...prev, 
                      period: period.value,
                      start_date: undefined,
                      end_date: undefined
                    }))}
                  >
                    <Text style={[styles.periodLabel, isActive && styles.periodLabelActive]}>
                      {period.label}
                    </Text>
                    <Text style={styles.periodDescription}>{period.description}</Text>
                  </ForceTouchable>
                );
              })}
            </View>
          </View>

          {/* Options */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Zap size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.sectionTitle}>Scheduling Options</Text>
            </View>
            
            {optionItems.map((item) => {
              const Icon = item.icon;
              const isActive = options[item.id as keyof typeof options] as boolean;
              
              return (
                <ForceTouchable
                  key={item.id}
                  style={[styles.optionItem, isActive && styles.optionItemActive]}
                  onPress={() => setOptions(prev => ({ 
                    ...prev, 
                    [item.id]: !prev[item.id as keyof typeof options] 
                  }))}
                >
                  <View style={[styles.optionIcon, { backgroundColor: item.color + '20' }]}>
                    <Icon size={20} color={item.color} />
                  </View>
                  
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {item.description}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.optionToggle,
                    isActive && { backgroundColor: item.color }
                  ]}>
                    <View style={[
                      styles.optionToggleKnob,
                      isActive && styles.optionToggleKnobActive
                    ]} />
                  </View>
                </ForceTouchable>
              );
            })}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Cpu size={24} color={theme === 'dark' ? '#10B981' : '#059669'} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How Auto Scheduling Works</Text>
              <Text style={styles.infoText}>
                The system uses deterministic algorithms to analyze staff availability, 
                qualifications, preferences, and legal requirements to create an optimal 
                schedule with predictable, consistent results.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <ForceTouchable 
            onPress={onClose} 
            style={styles.cancelButton}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </ForceTouchable>
          
          <View style={styles.actionButtons}>
            <ForceTouchable 
              onPress={() => handleGenerateSchedule(false)} 
              style={styles.previewButton}
              disabled={loading}
            >
              <Clock size={20} color="#3B82F6" />
              <Text style={styles.previewButtonText}>
                {loading ? 'Generating...' : 'Preview'}
              </Text>
            </ForceTouchable>
            
            <ForceTouchable 
              onPress={() => handleGenerateSchedule(true)} 
              style={styles.generateButton}
              disabled={loading}
            >
              <Zap size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>
                {loading ? 'Creating...' : 'Create Shifts'}
              </Text>
            </ForceTouchable>
          </View>
        </View>
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
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  headerContent: {
    flex: 1,
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
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    marginTop: -8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
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
  algorithmGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  algorithmOption: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  algorithmOptionActive: {
    backgroundColor: theme === 'dark' ? '#065F46' : '#D1FAE5',
    borderColor: theme === 'dark' ? '#10B981' : '#059669',
  },
  algorithmIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    color: theme === 'dark' ? '#10B981' : '#059669',
  },
  algorithmDescription: {
    fontSize: 11,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 8,
  },
  bestForContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  bestForChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestForText: {
    fontSize: 9,
    fontWeight: '500',
  },
  periodGrid: {
    gap: 12,
  },
  periodOption: {
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodOptionActive: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 4,
  },
  periodLabelActive: {
    color: '#FFFFFF',
  },
  periodDescription: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionItemActive: {
    backgroundColor: theme === 'dark' ? '#1E3A8A' : '#DBEAFE',
    borderColor: theme === 'dark' ? '#3B82F6' : '#3B82F6',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 2,
  },
  optionLabelActive: {
    color: theme === 'dark' ? '#3B82F6' : '#1E40AF',
  },
  optionDescription: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  optionToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
    padding: 2,
  },
  optionToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  optionToggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#065F46' : '#D1FAE5',
    borderRadius: 12,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#D1FAE5' : '#065F46',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: theme === 'dark' ? '#D1FAE5' : '#065F46',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? '#374151' : '#E5E7EB',
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
  actionButtons: {
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
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  generateButton: {
    flex: 2,
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
});