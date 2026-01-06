import { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { X, Filter, Calendar, User, MapPin, Clock, Tag, ChevronDown, ChevronUp } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { staffAPI, companiesAPI } from '@/services/api';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
  currentFilters: any;
}

export default function FilterModal({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
}: FilterModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);

  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    staff: false,
    location: false,
    status: false,
    date: false,
  });

  const [filters, setFilters] = useState({
    user_id: '',
    location: '',
    status: '',
    date_range: {
      start: '',
      end: '',
    },
    shift_type: '',
    show_open_only: false,
    show_my_shifts_only: false,
  });

  useEffect(() => {
    if (visible) {
      setFilters(currentFilters);
      fetchData();
    }
  }, [visible]);

  const fetchData = async () => {
    if (!user?.company_id) return;

    try {
      const staffResponse = await staffAPI.getStaffMembers();
      setStaffMembers(staffResponse.data || []);

      const locationsResponse = await companiesAPI.getLocations();
      setLocations(locationsResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch filter data:', error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      user_id: '',
      location: '',
      status: '',
      date_range: { start: '', end: '' },
      shift_type: '',
      show_open_only: false,
      show_my_shifts_only: false,
    });
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'scheduled', label: 'Scheduled', color: '#3B82F6' },
    { value: 'in-progress', label: 'In Progress', color: '#F59E0B' },
    { value: 'completed', label: 'Completed', color: '#10B981' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  ];

  const shiftTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'assigned', label: 'Assigned', color: '#3B82F6' },
    { value: 'open', label: 'Open', color: '#8B5CF6' },
  ];

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
            <Filter size={24} color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
            <Text style={styles.title}>Filter Shifts</Text>
          </View>
          <ForceTouchable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
          </ForceTouchable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Filters */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Filters</Text>
            </View>
            <View style={styles.quickFilters}>
              <ForceTouchable
                style={[styles.quickFilter, filters.show_my_shifts_only && styles.quickFilterActive]}
                onPress={() => setFilters(prev => ({ ...prev, show_my_shifts_only: !prev.show_my_shifts_only }))}
              >
                <User size={16} color={filters.show_my_shifts_only ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
                <Text style={[styles.quickFilterText, filters.show_my_shifts_only && styles.quickFilterTextActive]}>
                  My Shifts Only
                </Text>
              </ForceTouchable>

              <ForceTouchable
                style={[styles.quickFilter, filters.show_open_only && styles.quickFilterActive]}
                onPress={() => setFilters(prev => ({ ...prev, show_open_only: !prev.show_open_only }))}
              >
                <Tag size={16} color={filters.show_open_only ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
                <Text style={[styles.quickFilterText, filters.show_open_only && styles.quickFilterTextActive]}>
                  Open Shifts Only
                </Text>
              </ForceTouchable>
            </View>
          </View>

          {/* Staff Filter */}
          <View style={styles.section}>
            <ForceTouchable 
              style={styles.sectionHeader}
              onPress={() => toggleSection('staff')}
            >
              <View style={styles.sectionHeaderContent}>
                <User size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text style={styles.sectionTitle}>Staff</Text>
              </View>
              {expandedSections.staff ? (
                <ChevronUp size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              ) : (
                <ChevronDown size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              )}
            </ForceTouchable>

            {expandedSections.staff && (
              <View style={styles.optionsGrid}>
                <ForceTouchable
                  style={[styles.option, !filters.user_id && styles.optionActive]}
                  onPress={() => setFilters(prev => ({ ...prev, user_id: '' }))}
                >
                  <Text style={[styles.optionText, !filters.user_id && styles.optionTextActive]}>
                    All Staff
                  </Text>
                </ForceTouchable>

                {staffMembers.map(staff => (
                  <ForceTouchable
                    key={staff._id}
                    style={[styles.option, filters.user_id === staff._id && styles.optionActive]}
                    onPress={() => setFilters(prev => ({ ...prev, user_id: staff._id }))}
                  >
                    <Text style={[styles.optionText, filters.user_id === staff._id && styles.optionTextActive]}>
                      {staff.first_name} {staff.last_name}
                    </Text>
                  </ForceTouchable>
                ))}
              </View>
            )}
          </View>

          {/* Location Filter */}
          <View style={styles.section}>
            <ForceTouchable 
              style={styles.sectionHeader}
              onPress={() => toggleSection('location')}
            >
              <View style={styles.sectionHeaderContent}>
                <MapPin size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
              {expandedSections.location ? (
                <ChevronUp size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              ) : (
                <ChevronDown size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              )}
            </ForceTouchable>

            {expandedSections.location && (
              <View style={styles.optionsGrid}>
                <ForceTouchable
                  style={[styles.option, !filters.location && styles.optionActive]}
                  onPress={() => setFilters(prev => ({ ...prev, location: '' }))}
                >
                  <Text style={[styles.optionText, !filters.location && styles.optionTextActive]}>
                    All Locations
                  </Text>
                </ForceTouchable>

                {locations.map(location => (
                  <ForceTouchable
                    key={location._id || location.name}
                    style={[styles.option, filters.location === location.name && styles.optionActive]}
                    onPress={() => setFilters(prev => ({ ...prev, location: location.name }))}
                  >
                    <Text style={[styles.optionText, filters.location === location.name && styles.optionTextActive]}>
                      {location.name}
                    </Text>
                  </ForceTouchable>
                ))}
              </View>
            )}
          </View>

          {/* Status Filter */}
          <View style={styles.section}>
            <ForceTouchable 
              style={styles.sectionHeader}
              onPress={() => toggleSection('status')}
            >
              <View style={styles.sectionHeaderContent}>
                <Clock size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text style={styles.sectionTitle}>Status</Text>
              </View>
              {expandedSections.status ? (
                <ChevronUp size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              ) : (
                <ChevronDown size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              )}
            </ForceTouchable>

            {expandedSections.status && (
              <View style={styles.optionsGrid}>
                {statusOptions.map(option => (
                  <ForceTouchable
                    key={option.value}
                    style={[styles.option, filters.status === option.value && styles.optionActive]}
                    onPress={() => setFilters(prev => ({ ...prev, status: option.value }))}
                  >
                    {option.value && (
                      <View 
                        style={[styles.statusDot, { backgroundColor: option.color }]} 
                      />
                    )}
                    <Text style={[styles.optionText, filters.status === option.value && styles.optionTextActive]}>
                      {option.label}
                    </Text>
                  </ForceTouchable>
                ))}
              </View>
            )}
          </View>

          {/* Shift Type Filter */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Tag size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.sectionTitle}>Shift Type</Text>
            </View>
            
            <View style={styles.optionsGrid}>
              {shiftTypeOptions.map(option => (
                <ForceTouchable
                  key={option.value}
                  style={[styles.option, filters.shift_type === option.value && styles.optionActive]}
                  onPress={() => setFilters(prev => ({ ...prev, shift_type: option.value }))}
                >
                  {option.value && (
                    <View 
                      style={[styles.statusDot, { backgroundColor: option.color }]} 
                    />
                  )}
                  <Text style={[styles.optionText, filters.shift_type === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </ForceTouchable>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <ForceTouchable onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset All</Text>
          </ForceTouchable>
          
          <ForceTouchable onPress={handleApply} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </ForceTouchable>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 12,
  },
  quickFilter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickFilterActive: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionActive: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
  },
  optionText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  resetButton: {
    flex: 1,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  applyButton: {
    flex: 2,
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});