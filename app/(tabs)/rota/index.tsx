import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Clock, Users, UserCheck, Calendar, Eye, EyeOff, AlertCircle, Edit2, Trash2, MoreVertical, Plus, Filter, Cpu, Copy, MapPin, ChevronDown, ChevronUp, Grid, List, Brain, Trash, BarChart3, UserSquare } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import RotaHeader from '@/components/rota/RotaHeader';
import EnhancedWeekView from '@/components/rota/EnchancedWeekView';
import WeekSummary from '@/components/rota/WeekSummary';
import CreateShiftModal from '@/components/rota/CreateShiftModal';
import EditShiftModal from '@/components/rota/EditShiftModal';
import FilterModal from '@/components/rota/FilterModal';
import AutoSchedulingModal from '@/components/rota/AutoSchedulingModal';
import BulkDeleteModal from '@/components/rota/BulkDeleteModal';
import { useRotaData } from '@/hooks/useRotaData';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Shift } from '@/app/types/rota.types';
import { useOpenShifts } from '@/hooks/useOpenShifts';
import CreateShiftFromRoleModal from '@/components/rota/CreateShiftFromRoleModal';

// Define the view modes - removed 'calendar'
export type ScheduleViewMode = 'list' | 'user-grid';

// Helper function to get week start date (Monday)
const getWeekStartDate = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function RotaScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showShiftActions, setShowShiftActions] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [createModalDate, setCreateModalDate] = useState<Date>(new Date());
  // Set default view to 'user-grid'
  const [currentView, setCurrentView] = useState<ScheduleViewMode>('user-grid');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showAdminActions, setShowAdminActions] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const {openShifts: availableOpenShifts} = useOpenShifts();
  const openShiftsCount = availableOpenShifts.length;
  
  const isAdmin = user?.role === 'admin';
  const shouldShowAllShifts = isAdmin || viewMode === 'all';
  
  // Use refs to track previous values and prevent infinite loops
  const prevSelectedDate = useRef<Date>(selectedDate);
  const prevDateFilter = useRef<string>(dateFilter);
  
  // Calculate week start and end dates based on selectedDate
  const weekStartDate = getWeekStartDate(selectedDate);
  const weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Always use the full week range for data fetching, regardless of dateFilter
  const { shifts, loading, error, refetch, updateShift, deleteShift, clockIn, clockOut, deleteShiftsBulk } = useRotaData({
    start_date: weekStartDate,
    end_date: weekEndDate,
    ...(shouldShowAllShifts ? {} : { user_id: user?._id }),
  });

  const styles = createStyles(theme);

  const filteredShifts = useMemo(() => {
    let filtered = shifts;
    
    if (!isAdmin && viewMode === 'my') {
      filtered = filtered.filter(shift => 
        shift.user_id?._id === user?._id || shift.type === 'open'
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(shift => shift.status === statusFilter);
    }
    
    if (filters.show_my_shifts_only && user?._id) {
      filtered = filtered.filter(shift => shift.user_id?._id === user._id);
    }
    
    if (filters.show_open_only) {
      filtered = filtered.filter(shift => shift.type === 'open');
    }
    
    if (filters.user_id) {
      filtered = filtered.filter(shift => shift.user_id?._id === filters.user_id);
    }
    
    if (filters.location) {
      filtered = filtered.filter(shift => shift.location === filters.location);
    }
    
    if (filters.status) {
      filtered = filtered.filter(shift => shift.status === filters.status);
    }
    
    if (filters.shift_type) {
      filtered = filtered.filter(shift => shift.type === filters.shift_type);
    }

    // Apply date filtering - ONLY for display, not for data fetching
    if (dateFilter !== 'all') {
      filtered = filtered.filter(shift => {
        try {
          const shiftDate = new Date(shift.start_time);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (dateFilter === 'today') {
            return shiftDate.toDateString() === today.toDateString();
          }
          if (dateFilter === 'week') {
            const weekStart = getWeekStartDate(today);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            return shiftDate >= weekStart && shiftDate <= weekEnd;
          }
          if (dateFilter === 'month') {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);
            return shiftDate >= monthStart && shiftDate <= monthEnd;
          }
          return true;
        } catch (error) {
          return false;
        }
      });
    }

    return filtered;
  }, [shifts, viewMode, statusFilter, filters, isAdmin, user?._id, dateFilter]);

  // Get week dates for display
  const getWeekDatesForDisplay = () => {
    const dates = [];
    const monday = getWeekStartDate(selectedDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const handleAutoScheduleGenerated = (schedule: any) => {
    Alert.alert('AI Schedule Generated', schedule.message);
    refetch();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleShiftCreated = () => {
    setShowCreateModal(false);
    refetch();
  };

  const handleAddShiftFromWeekView = (date: Date) => {
    setCreateModalDate(date);
    setShowCreateModal(true);
  };

  const handleShiftUpdated = () => {
    setShowEditModal(false);
    setSelectedShift(null);
    refetch();
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setShowEditModal(true);
    setShowShiftActions(null);
  };

  const handleDeleteShift = async (shift: Shift) => {
    Alert.alert(
      'Delete Shift',
      `Are you sure you want to delete "${shift.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteShift(shift._id);
              Alert.alert('Success', 'Shift deleted successfully');
              refetch();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleClearShifts = async (period: 'today' | 'week' | 'month') => {
    let title = '';
    let message = '';
    let deleteData: any = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (period) {
      case 'today':
        title = 'Clear Today\'s Shifts';
        message = 'Are you sure you want to delete all shifts for today?';
        deleteData.day = today.toISOString().split('T')[0];
        break;
      case 'week':
        title = 'Clear This Week\'s Shifts';
        message = 'Are you sure you want to delete all shifts for this week?';
        // Calculate current week in ISO format (YYYY-Www)
        const weekNumber = getWeekNumber(today);
        deleteData.week = `${today.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
        break;
      case 'month':
        title = 'Clear This Month\'s Shifts';
        message = 'Are you sure you want to delete all shifts for this month?';
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        deleteData.month = `${today.getFullYear()}-${month}`;
        break;
    }

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await handleBulkDelete(deleteData);
              Alert.alert('Success', `Shifts cleared successfully for ${period}`);
              refetch();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleClockIn = async (shift: Shift) => {
    try {
      const location = {
        latitude: 51.5074,
        longitude: -0.1278
      };
      
      await clockIn(shift._id, location);
      Alert.alert('Success', 'Clocked in successfully');
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleClockOut = async (shift: Shift) => {
    try {
      const location = {
        latitude: 51.5074,
        longitude: -0.1278
      };
      
      await clockOut(shift._id, location);
      Alert.alert('Success', 'Clocked out successfully');
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleShiftPress = (shift: Shift) => {
    const startDate = new Date(shift.start_time);
    const endDate = new Date(shift.end_time);
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const typeIndicator = shift.type === 'open' ? '🟣 OPEN' : '🔵 ASSIGNED';
    const userName = shift.user_id ? `${shift.user_id.first_name} ${shift.user_id.last_name}` : 'Unassigned';
    
    const actions = [
      { text: 'Close', style: 'cancel' },
      isAdmin && { 
        text: 'Edit', 
        style: 'default',
        onPress: () => handleEditShift(shift)
      },
      isAdmin && { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => handleDeleteShift(shift)
      },
      !isAdmin && shift.user_id?._id === user?._id && shift.status === 'scheduled' && { 
        text: 'Clock In', 
        style: 'default',
        onPress: () => handleClockIn(shift)
      },
      !isAdmin && shift.user_id?._id === user?._id && shift.status === 'in-progress' && { 
        text: 'Clock Out', 
        style: 'default',
        onPress: () => handleClockOut(shift)
      },
      shift.type === 'open' && !isAdmin && { 
        text: 'Request Shift', 
        style: 'default',
        onPress: () => handleRequestOpenShift(shift)
      },
    ].filter(Boolean) as any;

    Alert.alert(
      shift.title,
      `${typeIndicator}\n\n📅 ${startDate.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}\n\n🕐 ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n⏱️ ${durationHours.toFixed(1)} hours\n\n📍 ${shift.location || 'No location specified'}\n\n👤 ${userName}`,
      actions
    );
  };

  const handleRequestOpenShift = (shift: Shift) => {
    Alert.prompt(
      'Request Open Shift',
      'Add optional notes for your request:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request', 
          onPress: (notes?: string) => {
            Alert.alert('Request Submitted', `Request for "${shift.title}" submitted with notes: ${notes || 'No notes'}`);
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'scheduled': '#3B82F6',
      'in-progress': '#F59E0B',
      'late': '#F97316',
      'completed': '#10B981',
      'completed-early': '#10B981',
      'completed-overtime': '#F59E0B',
      'cancelled': '#EF4444'
    };
    return colorMap[status] || '#6B7280';
  };

  const handleBulkDelete = async (deleteData: any) => {
    try {
      // Call the deleteShiftsBulk from the hook
      await deleteShiftsBulk(deleteData);
      Alert.alert('Success', 'Shifts deleted successfully');
      refetch();
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      Alert.alert('Error', error.message || 'Failed to delete shifts');
      throw error;
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
  
  const myShiftsCount = shifts.filter(shift => shift.user_id?._id === user?._id).length;

  if (error) {
    return (
      <View style={styles.container}>
        <RotaHeader
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onShiftCreated={handleShiftCreated}
        />
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={theme === 'dark' ? '#EF4444' : '#DC2626'} />
          <Text style={styles.errorTitle}>Unable to Load Schedule</Text>
          <Text style={styles.errorText}>{error}</Text>
          <ForceTouchable onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </ForceTouchable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RotaHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onShiftCreated={handleShiftCreated}
      />
      
      {/* View Dropdown (User Grid/List View) */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.viewDropdownButton}
          onPress={() => setShowViewDropdown(!showViewDropdown)}
        >
          {currentView === 'user-grid' ? (
            <Users size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          ) : (
            <List size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          )}
          <Text style={styles.viewDropdownButtonText}>
            {currentView === 'user-grid' ? 'User View' : 'List View'}
          </Text>
          {showViewDropdown ? (
            <ChevronUp size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          ) : (
            <ChevronDown size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          )}
        </TouchableOpacity>

        {/* View Dropdown Menu - Removed Calendar View */}
        {showViewDropdown && (
          <View style={styles.viewDropdownMenu}>
            <TouchableOpacity
              style={[styles.viewDropdownMenuItem, currentView === 'user-grid' && styles.viewDropdownMenuItemActive]}
              onPress={() => {
                setCurrentView('user-grid');
                setShowViewDropdown(false);
              }}
            >
              <Users size={16} color={currentView === 'user-grid' ? '#3B82F6' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
              <Text style={[styles.viewDropdownMenuText, currentView === 'user-grid' && styles.viewDropdownMenuTextActive]}>
                User View
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.viewDropdownMenuItem, currentView === 'list' && styles.viewDropdownMenuItemActive]}
              onPress={() => {
                setCurrentView('list');
                setShowViewDropdown(false);
              }}
            >
              <List size={16} color={currentView === 'list' ? '#3B82F6' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
              <Text style={[styles.viewDropdownMenuText, currentView === 'list' && styles.viewDropdownMenuTextActive]}>
                List View
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filters Dropdown */}
        <TouchableOpacity
          style={styles.filterDropdownButton}
          onPress={() => setShowFiltersDropdown(!showFiltersDropdown)}
        >
          <Filter size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <Text style={styles.filterDropdownButtonText}>
            {viewMode === 'all' ? 'All Shifts' : 'My Shifts'}
          </Text>
          {showFiltersDropdown ? (
            <ChevronUp size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          ) : (
            <ChevronDown size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          )}
        </TouchableOpacity>
      </View>

      {/* Filters Dropdown Menu */}
      {showFiltersDropdown && (
        <View style={styles.filtersDropdownMenu}>
          {/* View Mode Filter (All/My Shifts) */}
          <View style={styles.filtersSection}>
            <Text style={styles.filtersSectionTitle}>View Mode</Text>
            <View style={styles.viewModeButtons}>
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'all' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('all')}
              >
                <Eye size={16} color={viewMode === 'all' ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
                <Text style={[styles.viewModeButtonText, viewMode === 'all' && styles.viewModeButtonTextActive]}>
                  All Shifts
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'my' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('my')}
              >
                <EyeOff size={16} color={viewMode === 'my' ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
                <Text style={[styles.viewModeButtonText, viewMode === 'my' && styles.viewModeButtonTextActive]}>
                  My Shifts
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Filters */}
          <View style={styles.filtersSection}>
            <Text style={styles.filtersSectionTitle}>Date Range</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(['all', 'today', 'week', 'month'] as const).map(filter => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.dateFilterButton,
                    dateFilter === filter && styles.dateFilterButtonActive
                  ]}
                  onPress={() => setDateFilter(filter)}
                >
                  <Text style={[
                    styles.dateFilterText,
                    dateFilter === filter && styles.dateFilterTextActive
                  ]}>
                    {filter === 'all' ? 'All Dates' : 
                     filter === 'today' ? 'Today' :
                     filter === 'week' ? 'This Week' : 'This Month'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Advanced Filters Button */}
          <TouchableOpacity
            style={styles.advancedFiltersButton}
            onPress={() => {
              setShowFiltersDropdown(false);
              setShowFilterModal(true);
            }}
          >
            <Filter size={16} color="#3B82F6" />
            <Text style={styles.advancedFiltersButtonText}>Advanced Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Link href={isAdmin ? "/rota/shift-requests" : "/rota/my-requests"} asChild>
          <ForceTouchable style={styles.requestButton}>
            <UserCheck size={18} color={theme === 'dark' ? '#8B5CF6' : '#7C3AED'} />
            <Text style={styles.requestButtonText}>
              {isAdmin ? 'Manage Requests' : 'My Requests'}
            </Text>
          </ForceTouchable>
        </Link>

        {/* Open Shifts Button */}
        <Link href="/rota/open-shifts" asChild>
          <ForceTouchable style={styles.openShiftsButton}>
            <Users size={18} color={theme === 'dark' ? '#F59E0B' : '#D97706'} />
            <Text style={styles.openShiftsButtonText}>Open Shifts</Text>
            {openShiftsCount > 0 && (
              <View style={styles.openShiftsBadge}>
                <Text style={styles.openShiftsBadgeText}>{openShiftsCount}</Text>
              </View>
            )}
          </ForceTouchable>
        </Link>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme === 'dark' ? '#3B82F6' : '#2563EB'}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
            <Text style={styles.loadingText}>Loading shifts...</Text>
          </View>
        ) : filteredShifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={64} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.emptyTitle}>
              {dateFilter !== 'all' 
                ? `No shifts for ${dateFilter}`
                : shouldShowAllShifts 
                  ? 'No shifts scheduled' 
                  : 'No shifts assigned to you'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isAdmin ? 'Tap the + button to add your first shift' : 
               viewMode === 'all' ? 'No shifts scheduled for this period' : 
               'You have no shifts scheduled for this week'}
            </Text>
            {isAdmin && (
              <>
                <ForceTouchable 
                  style={styles.autoSuggestionButton}
                  onPress={() => setShowAutoModal(true)}
                >
                  <Brain size={20} color="#10B981" />
                  <Text style={styles.autoSuggestionButtonText}>Try AI Scheduling</Text>
                </ForceTouchable>
                <ForceTouchable 
                  style={styles.bulkDeleteButton}
                  onPress={() => setShowBulkDeleteModal(true)}
                >
                  <Trash size={20} color="#FFFFFF" />
                  <Text style={styles.bulkDeleteButtonText}>Bulk Delete Shifts</Text>
                </ForceTouchable>
              </>
            )}
            {/* Quick action to view open shifts */}
            {!isAdmin && openShiftsCount > 0 && (
              <Link href="/rota/open-shifts" asChild>
                <ForceTouchable style={styles.viewOpenShiftsButton}>
                  <Users size={20} color="#FFFFFF" />
                  <Text style={styles.viewOpenShiftsButtonText}>
                    View {openShiftsCount} Open Shift{openShiftsCount !== 1 ? 's' : ''}
                  </Text>
                </ForceTouchable>
              </Link>
            )}
          </View>
        ) : (
          <>
            <View style={styles.scheduleSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {shouldShowAllShifts ? 'Weekly Schedule' : 'My Schedule'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Week of {getWeekStartDate(selectedDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              
              <EnhancedWeekView
                shifts={filteredShifts}
                selectedDate={selectedDate}
                currentView={currentView}
                onShiftPress={handleShiftPress}
                onAddShift={isAdmin ? handleAddShiftFromWeekView : undefined}
                loading={false}
              />
            </View>

            <View style={styles.upcomingSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
                <Text style={styles.sectionSubtitle}>
                  {dateFilter !== 'all' ? `${dateFilter}` : 'Next 7 days'}
                </Text>
              </View>
              
              {filteredShifts
                .filter(shift => {
                  const shiftDate = new Date(shift.start_time);
                  const today = new Date();
                  const nextWeek = new Date();
                  nextWeek.setDate(today.getDate() + 7);
                  return shiftDate >= today && shiftDate <= nextWeek;
                })
                .slice(0, 5)
                .map(shift => (
                  <ForceTouchable
                    key={shift._id}
                    style={styles.shiftCard}
                    onPress={() => handleShiftPress(shift)}
                    onLongPress={() => isAdmin && setShowShiftActions(shift._id)}
                  >
                    <View style={styles.shiftCardContent}>
                      <View style={styles.shiftHeader}>
                        <View style={[
                          styles.statusIndicator,
                          { backgroundColor: getStatusColor(shift.status) }
                        ]} />
                        <Text style={styles.shiftTitle}>{shift.title}</Text>
                        {isAdmin && (
                          <TouchableOpacity
                            style={styles.shiftMenuButton}
                            onPress={() => setShowShiftActions(shift._id)}
                          >
                            <MoreVertical size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      <View style={styles.shiftDetails}>
                        <View style={styles.shiftDetailRow}>
                          <Calendar size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                          <Text style={styles.shiftDetailText}>
                            {new Date(shift.start_time).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Text>
                        </View>
                        
                        <View style={styles.shiftDetailRow}>
                          <Clock size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                          <Text style={styles.shiftDetailText}>
                            {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        
                        <View style={styles.shiftDetailRow}>
                          <Users size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                          <Text style={styles.shiftDetailText}>
                            {shift.user_id ? `${shift.user_id.first_name} ${shift.user_id.last_name}` : 'Unassigned'}
                          </Text>
                        </View>

                        {shift.location && (
                          <View style={styles.shiftDetailRow}>
                            <MapPin size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                            <Text style={styles.shiftDetailText}>
                              {shift.location}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    {showShiftActions === shift._id && isAdmin && (
                      <View style={styles.shiftActionsMenu}>
                        <ForceTouchable
                          style={styles.shiftAction}
                          onPress={() => {
                            handleEditShift(shift);
                            setShowShiftActions(null);
                          }}
                        >
                          <Edit2 size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                          <Text style={styles.shiftActionText}>Edit</Text>
                        </ForceTouchable>
                        
                        <ForceTouchable
                          style={styles.shiftAction}
                          onPress={() => {
                            handleDeleteShift(shift);
                            setShowShiftActions(null);
                          }}
                        >
                          <Trash2 size={16} color="#EF4444" />
                          <Text style={[styles.shiftActionText, { color: '#EF4444' }]}>Delete</Text>
                        </ForceTouchable>
                      </View>
                    )}
                  </ForceTouchable>
                ))}
            </View>

            {filteredShifts.length > 0 && (
              <View style={styles.summarySection}>
                <WeekSummary shifts={filteredShifts} isAdmin={isAdmin} />
              </View>
            )}

            {isAdmin && filteredShifts.length > 0 && (
              <View style={styles.autoSection}>
                <View style={styles.sectionHeader}>
                  <Brain size={20} color="#10B981" />
                  <Text style={styles.sectionTitle}>AI Scheduling Tools</Text>
                </View>
                <Text style={styles.autoDescription}>
                  Use AI algorithms to optimize schedules, fill open shifts, or clear and regenerate schedules.
                </Text>
                
                {/* AI Scheduling Actions */}
                <View style={styles.aiActionsGrid}>
                  <ForceTouchable 
                    style={styles.aiActionButton}
                    onPress={() => setShowAutoModal(true)}
                  >
                    <Brain size={20} color="#3B82F6" />
                    <Text style={styles.aiActionButtonText}>AI Schedule Generator</Text>
                  </ForceTouchable>
                  
                  <ForceTouchable 
                    style={[styles.aiActionButton, styles.fillOpenButton]}
                    onPress={() => {
                      setShowAutoModal(true);
                      // Pre-select fill_open_only option
                      // You'll need to handle this in the modal
                    }}
                  >
                    <Users size={20} color="#F59E0B" />
                    <Text style={[styles.aiActionButtonText, styles.fillOpenButtonText]}>Fill Open Shifts</Text>
                  </ForceTouchable>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {isAdmin && (
        <TouchableOpacity 
          style={styles.adminPlusButton}
          onPress={() => setShowAdminActions(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Admin Actions Modal - UPDATED: Removed Clear Shifts, kept Bulk Delete */}
      {showAdminActions && (
        <View style={styles.adminActionsOverlay}>
          <View style={styles.adminActionsModal}>
            <Text style={styles.adminActionsTitle}>Admin Actions</Text>
            
            <ForceTouchable 
              style={styles.adminActionButton}
              onPress={() => {
                setShowAdminActions(false);
                setShowAutoModal(true);
              }}
            >
              <Brain size={20} color="#3B82F6" />
              <Text style={styles.adminActionButtonText}>AI Schedule Generator</Text>
            </ForceTouchable>
            
            <ForceTouchable 
              style={styles.adminActionButton}
              onPress={() => {
                setShowAdminActions(false);
                setShowCreateModal(true);
              }}
            >
              <Plus size={20} color="#10B981" />
              <Text style={styles.adminActionButtonText}>Add New Shift</Text>
            </ForceTouchable>
            
            <ForceTouchable 
              style={styles.adminActionButton}
              onPress={() => {
                setShowAdminActions(false);
                setShowBulkDeleteModal(true);
              }}
            >
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.adminActionButtonText, { color: '#EF4444' }]}>
                Bulk Delete Shifts
              </Text>
            </ForceTouchable>
            
            <ForceTouchable 
              style={styles.cancelAdminButton}
              onPress={() => setShowAdminActions(false)}
            >
              <Text style={styles.cancelAdminButtonText}>Cancel</Text>
            </ForceTouchable>
          </View>
        </View>
      )}

      <CreateShiftFromRoleModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleShiftCreated}
        defaultDate={createModalDate}
      />

      {selectedShift && (
        <EditShiftModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedShift(null);
          }}
          onSuccess={handleShiftUpdated}
          shift={selectedShift}
        />
      )}

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={(newFilters) => setFilters(newFilters)}
        currentFilters={filters}
      />

      <AutoSchedulingModal
        visible={showAutoModal}
        onClose={() => setShowAutoModal(false)}
        onScheduleGenerated={handleAutoScheduleGenerated}
      />

      <BulkDeleteModal
        visible={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onDelete={handleBulkDelete}
      />
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    gap: 8,
  },
  viewDropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
  },
  viewDropdownButtonText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  viewDropdownMenu: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 90,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  viewDropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  viewDropdownMenuItemActive: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
  },
  viewDropdownMenuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  viewDropdownMenuTextActive: {
    color: theme === 'dark' ? '#3B82F6' : '#2563EB',
    fontWeight: '600',
  },
  filterDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    width: 120,
  },
  filterDropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  filtersDropdownMenu: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  filtersSection: {
    marginBottom: 16,
  },
  filtersSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 8,
  },
  viewModeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  viewModeButtonActive: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  viewModeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateFilterButtonActive: {
    backgroundColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
    borderColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
  },
  dateFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  dateFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  advancedFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    marginTop: 8,
  },
  advancedFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    gap: 8,
  },
  requestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  openShiftsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    position: 'relative',
  },
  openShiftsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  openShiftsBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  openShiftsBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  autoSuggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme === 'dark' ? '#065F46' : '#D1FAE5',
    borderRadius: 8,
    marginTop: 16,
  },
  autoSuggestionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#D1FAE5' : '#065F46',
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    marginTop: 12,
  },
  bulkDeleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewOpenShiftsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    marginTop: 12,
  },
  viewOpenShiftsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleSection: {
    padding: 16,
  },
  upcomingSection: {
    padding: 16,
    paddingTop: 0,
  },
  summarySection: {
    padding: 16,
    paddingTop: 0,
  },
  autoSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  autoDescription: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  aiActionsGrid: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  aiActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
  },
  aiActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  fillOpenButton: {
    backgroundColor: theme === 'dark' ? '#7C2D12' : '#FEF3C7',
  },
  fillOpenButtonText: {
    color: theme === 'dark' ? '#F59E0B' : '#D97706',
  },
  clearSection: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  clearSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 4,
  },
  clearSectionDescription: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: 12,
  },
  clearButtonsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  clearTodayButton: {
    backgroundColor: theme === 'dark' ? '#7F1D1D' : '#FEE2E2',
    borderColor: theme === 'dark' ? '#DC2626' : '#FCA5A5',
  },
  clearWeekButton: {
    backgroundColor: theme === 'dark' ? '#78350F' : '#FEF3C7',
    borderColor: theme === 'dark' ? '#D97706' : '#F59E0B',
  },
  clearMonthButton: {
    backgroundColor: theme === 'dark' ? '#064E3B' : '#D1FAE5',
    borderColor: theme === 'dark' ? '#059669' : '#10B981',
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme === 'dark' ? '#EF4444' : '#DC2626',
  },
  shiftCard: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    overflow: 'hidden',
  },
  shiftCardContent: {
    padding: 16,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  shiftTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  },
  shiftMenuButton: {
    padding: 4,
  },
  shiftDetails: {
    gap: 8,
  },
  shiftDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftDetailText: {
    fontSize: 13,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  shiftActionsMenu: {
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? '#374151' : '#E5E7EB',
    flexDirection: 'row',
  },
  shiftAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  shiftActionText: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    fontWeight: '500',
  },
  adminPlusButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  adminActionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  adminActionsModal: {
    width: '80%',
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  adminActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  adminActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
  },
  adminActionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  cancelAdminButton: {
    padding: 16,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelAdminButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
});