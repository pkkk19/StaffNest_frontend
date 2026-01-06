// app/components/modals/StaffModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  TextInput,
  Keyboard,
  ActivityIndicator 
} from 'react-native';
import { Search, Check, Users, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface StaffMember {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  department?: string;
}

interface StaffModalProps {
  staffList: StaffMember[];
  selectedStaffIds: string[];
  onToggleStaff: (staffId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  staffList,
  selectedStaffIds,
  onToggleStaff,
  onSelectAll,
  onClearAll,
  onClose,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>(staffList);
  const [initialDisplayCount, setInitialDisplayCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStaff(staffList);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = staffList.filter(staff => 
        staff.first_name.toLowerCase().includes(query) ||
        staff.last_name.toLowerCase().includes(query) ||
        staff.email.toLowerCase().includes(query) ||
        (staff.position && staff.position.toLowerCase().includes(query)) ||
        (staff.department && staff.department.toLowerCase().includes(query))
      );
      setFilteredStaff(filtered);
    }
  }, [searchQuery, staffList]);

  const clearSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const loadMoreStaff = () => {
    if (initialDisplayCount < filteredStaff.length) {
      setIsLoading(true);
      setTimeout(() => {
        setInitialDisplayCount(prev => Math.min(prev + 10, filteredStaff.length));
        setIsLoading(false);
      }, 300);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getDisplayStaff = () => {
    if (searchQuery.trim() === '') {
      return filteredStaff.slice(0, initialDisplayCount);
    }
    return filteredStaff;
  };

  const renderFooter = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    
    if (searchQuery.trim() === '' && initialDisplayCount < filteredStaff.length) {
      return (
        <TouchableOpacity 
          style={styles.loadMoreButton}
          onPress={loadMoreStaff}
        >
          <Text style={styles.loadMoreText}>
            Load more ({filteredStaff.length - initialDisplayCount} remaining)
          </Text>
        </TouchableOpacity>
      );
    }
    
    return null;
  };

  return (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <View style={styles.headerContent}>
          <Users size={24} color="#3B82F6" />
          <Text style={styles.modalTitle}>Select Staff</Text>
        </View>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <X size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search staff by name, email, or position..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Selected Count & Actions */}
      <View style={styles.infoBar}>
        <View style={styles.selectedInfo}>
          <View style={styles.selectedCountBadge}>
            <Text style={styles.selectedCountText}>{selectedStaffIds.length}</Text>
          </View>
          <Text style={styles.selectedLabel}>selected</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onSelectAll}
            disabled={selectedStaffIds.length === staffList.length}
          >
            <Text style={[
              styles.actionButtonText,
              selectedStaffIds.length === staffList.length && styles.actionButtonTextDisabled
            ]}>
              Select All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.clearAllButton]}
            onPress={onClearAll}
            disabled={selectedStaffIds.length === 0}
          >
            <Text style={[
              styles.actionButtonText,
              selectedStaffIds.length === 0 && styles.actionButtonTextDisabled
            ]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Info */}
      {searchQuery.trim() !== '' && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filteredStaff.length} result{filteredStaff.length !== 1 ? 's' : ''} found
          </Text>
          <TouchableOpacity onPress={clearSearch}>
            <Text style={styles.clearResultsText}>Clear search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Staff List */}
      <FlatList
        data={getDisplayStaff()}
        keyExtractor={(item) => item._id}
        style={styles.staffList}
        contentContainerStyle={styles.staffListContent}
        showsVerticalScrollIndicator={false}
        onEndReached={searchQuery.trim() === '' ? loadMoreStaff : undefined}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No staff found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim() === '' 
                ? 'No staff members available'
                : `No results for "${searchQuery}"`}
            </Text>
          </View>
        }
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => {
          const isSelected = selectedStaffIds.includes(item._id);
          return (
            <TouchableOpacity
              style={[
                styles.staffItem,
                isSelected && styles.staffItemSelected
              ]}
              onPress={() => onToggleStaff(item._id)}
              activeOpacity={0.7}
            >
              <View style={styles.staffItemContent}>
                <View style={[
                  styles.avatarContainer,
                  isSelected && styles.avatarContainerSelected
                ]}>
                  <Text style={[
                    styles.avatarText,
                    isSelected && styles.avatarTextSelected
                  ]}>
                    {getInitials(item.first_name, item.last_name)}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Check size={12} color="#fff" />
                    </View>
                  )}
                </View>
                
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>
                    {item.first_name} {item.last_name}
                  </Text>
                  <Text style={styles.staffEmail} numberOfLines={1}>
                    {item.email}
                  </Text>
                  {(item.position || item.department) && (
                    <View style={styles.staffMeta}>
                      {item.position && (
                        <View style={styles.metaPill}>
                          <Text style={styles.metaPillText}>{item.position}</Text>
                        </View>
                      )}
                      {item.department && (
                        <View style={styles.metaPill}>
                          <Text style={styles.metaPillText}>{item.department}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
              
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Check size={20} color="#10B981" />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Footer */}
      <View style={styles.modalFooter}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            {selectedStaffIds.length === 0 
              ? 'Select staff for this role'
              : `${selectedStaffIds.length} staff member${selectedStaffIds.length !== 1 ? 's' : ''} selected`}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.modalDoneButton,
            selectedStaffIds.length === 0 && styles.modalDoneButtonDisabled
          ]}
          onPress={onClose}
          disabled={selectedStaffIds.length === 0}
        >
          <Text style={styles.modalDoneText}>
            Confirm ({selectedStaffIds.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: string) => {
  const isDark = theme === 'dark';
  const backgroundColor = isDark ? '#1F2937' : '#fff';
  const cardBackground = isDark ? '#111827' : '#F9FAFB';
  const textColor = isDark ? '#fff' : '#000';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const inputBackground = isDark ? '#374151' : '#F3F4F6';
  const primaryColor = '#3B82F6';
  const successColor = '#10B981';

  return StyleSheet.create({
    modalContainer: {
      backgroundColor: backgroundColor,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: textColor,
    },
    closeButton: {
      padding: 4,
    },
    
    // Search Bar
    searchContainer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#D1D5DB',
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: textColor,
      padding: 0,
    },
    clearSearchButton: {
      padding: 4,
      marginLeft: 8,
    },
    
    // Info Bar
    infoBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    selectedInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    selectedCountBadge: {
      backgroundColor: primaryColor,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedCountText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    selectedLabel: {
      fontSize: 14,
      color: secondaryTextColor,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: inputBackground,
      borderRadius: 8,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: primaryColor,
    },
    actionButtonTextDisabled: {
      color: secondaryTextColor,
      opacity: 0.5,
    },
    clearAllButton: {
      backgroundColor: isDark ? '#450A0A' : '#FEF2F2',
    },
    
    // Results Info
    resultsInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    resultsText: {
      fontSize: 14,
      color: textColor,
      fontWeight: '500',
    },
    clearResultsText: {
      fontSize: 14,
      color: primaryColor,
      fontWeight: '500',
    },
    
    // Staff List
    staffList: {
      flex: 1,
    },
    staffListContent: {
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: secondaryTextColor,
      textAlign: 'center',
    },
    
    // Staff Item
    staffItem: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    staffItemSelected: {
      backgroundColor: isDark ? '#0F172A' : '#F0F9FF',
      borderColor: primaryColor,
    },
    staffItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: inputBackground,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    avatarContainerSelected: {
      backgroundColor: primaryColor,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: textColor,
    },
    avatarTextSelected: {
      color: '#fff',
    },
    checkBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: successColor,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: cardBackground,
    },
    staffInfo: {
      flex: 1,
    },
    staffName: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginBottom: 2,
    },
    staffEmail: {
      fontSize: 14,
      color: secondaryTextColor,
      marginBottom: 8,
    },
    staffMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    metaPill: {
      backgroundColor: inputBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    metaPillText: {
      fontSize: 12,
      color: secondaryTextColor,
    },
    selectedIndicator: {
      position: 'absolute',
      top: 16,
      right: 16,
    },
    
    // Loading & Load More
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
    },
    loadingText: {
      fontSize: 14,
      color: secondaryTextColor,
    },
    loadMoreButton: {
      backgroundColor: inputBackground,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    loadMoreText: {
      fontSize: 14,
      fontWeight: '600',
      color: primaryColor,
    },
    
    // Footer
    modalFooter: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: borderColor,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: backgroundColor,
    },
    footerInfo: {
      flex: 1,
    },
    footerText: {
      fontSize: 14,
      color: secondaryTextColor,
    },
    modalDoneButton: {
      backgroundColor: primaryColor,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      minWidth: 120,
      alignItems: 'center',
    },
    modalDoneButtonDisabled: {
      backgroundColor: inputBackground,
      opacity: 0.5,
    },
    modalDoneText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
};