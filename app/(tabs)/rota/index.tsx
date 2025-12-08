
// app/rota/index.tsx
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Clock, Users, UserCheck, Calendar, Eye, EyeOff, AlertCircle, Edit2, Trash2, MoreVertical, Plus, Filter } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import RotaHeader from '@/components/rota/RotaHeader';
import WeekView from '@/components/rota/WeekView';
import AdminTools from '@/components/rota/AdminTools';
import WeekSummary from '@/components/rota/WeekSummary';
import CreateShiftModal from '@/components/rota/CreateShiftModal';
import EditShiftModal from '@/components/rota/EditShiftModal';
import { useRotaData } from '@/hooks/useRotaData';
import { useState, useCallback, useMemo } from 'react';
import { Shift } from '@/app/types/rota.types';
import { useShiftRequests } from '@/hooks/useShiftRequests';

// Interface for enriched shift data (with user details populated)
interface EnrichedShift extends Shift {
  user_details?: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  created_by_details?: {
    _id: string;
    first_name: string;
    last_name: string;
  };
}

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
  
  
  const isAdmin = user?.role === 'admin';
  const shouldShowAllShifts = isAdmin || viewMode === 'all';
  
  // Fetch shifts data
  const { shifts, loading, error, refetch, updateShift, deleteShift, clockIn, clockOut } = useRotaData({
    start_date: selectedDate,
    ...(shouldShowAllShifts ? {} : { user_id: user?._id }),
  });

  const styles = createStyles(theme);

  // Apply filters - no transformation needed since we're using the Shift type directly
  const filteredShifts = useMemo(() => {
    let filtered = shifts;
    
    // Filter by view mode (for staff)
    if (!isAdmin && viewMode === 'my') {
      filtered = filtered.filter(shift => 
        shift.user_id === user?._id || shift.type === 'open'
      );
    }
    
    // Filter by status if selected
    if (statusFilter) {
      filtered = filtered.filter(shift => shift.status === statusFilter);
    }
    
    return filtered;
  }, [shifts, viewMode, statusFilter, isAdmin, user?._id]);

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

  // Handle shift created from RotaHeader OR WeekView
  const handleShiftCreated = () => {
    setShowCreateModal(false);
    refetch();
  };

  // Handle opening create modal from WeekView
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

  const handleClockIn = async (shift: Shift) => {
    try {
      // Get current location (simulated for now)
      const location = {
        latitude: 51.5074, // Example coordinates
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
    const statusBadge = getStatusBadge(shift.status);
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
      !isAdmin && shift.user_id === user?._id && shift.status === 'scheduled' && { 
        text: 'Clock In', 
        style: 'default',
        onPress: () => handleClockIn(shift)
      },
      !isAdmin && shift.user_id === user?._id && shift.status === 'in-progress' && { 
        text: 'Clock Out', 
        style: 'default',
        onPress: () => handleClockOut(shift)
      },
      !isAdmin && shift.type === 'open' && { 
        text: 'Request Shift', 
        style: 'default',
        onPress: () => console.log('Request shift:', shift._id)
      }
    ].filter(Boolean) as any;

    Alert.alert(
      shift.title,
      `
${typeIndicator}
  
📅 ${startDate.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}
      
🕐 ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

⏱️ ${durationHours.toFixed(1)} hours

📍 ${shift.location || 'No location specified'}

👤 ${shift.user_id ? 'Assigned' : 'Unassigned'}

${getStatusBadge(shift.status)}`,
      actions
    );
  };

  const getStatusBadge = (status: string) => {
  const statusMap: Record<string, string> = {
    'scheduled': '🔵 Scheduled',
    'in-progress': '🟡 In Progress',
    'completed': '🟢 Completed',
    'cancelled': '🔴 Cancelled'
  };
  const statusBadge = statusMap[status] || status;
  return `${statusBadge}`.trim();
};

  const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'scheduled': '#3B82F6',
    'in-progress': '#F59E0B',
    'completed': '#10B981',
    'cancelled': '#EF4444'
  };
  return colorMap[status] || '#6B7280';
};

  const openShiftsCount = shifts.filter(shift => shift.type === 'open').length;
  const myShiftsCount = shifts.filter(shift => shift.user_id === user?._id).length;
  const activeShiftsCount = shifts.filter(shift => 
    shift.status === 'scheduled' || shift.status === 'in-progress'
  ).length;

  const calculateWeeklyHours = () => {
    return filteredShifts.reduce((total, shift) => {
      const start = new Date(shift.start_time);
      const end = new Date(shift.end_time);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  const statusOptions = [
    { label: 'All', value: null },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

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
      
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredShifts.length}</Text>
          <Text style={styles.statLabel}>Shifts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getStatusColor('scheduled') }]}>
            {activeShiftsCount}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {calculateWeeklyHours().toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>
      </View>

      {/* Quick Actions Bar */}
      <View style={styles.quickActions}>
        <View style={styles.actionGroup}>
          {/* View Toggle */}
          {!isAdmin && (
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, viewMode === 'all' && styles.toggleButtonActive]}
                onPress={() => setViewMode('all')}
              >
                <Eye size={16} color={viewMode === 'all' ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
                <Text style={[styles.toggleText, viewMode === 'all' && styles.toggleTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.toggleButton, viewMode === 'my' && styles.toggleButtonActive]}
                onPress={() => setViewMode('my')}
              >
                <EyeOff size={16} color={viewMode === 'my' ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280')} />
                <Text style={[styles.toggleText, viewMode === 'my' && styles.toggleTextActive]}>
                  Mine
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Status Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.statusFilter}
          >
            {statusOptions.map(option => (
              <TouchableOpacity
                key={option.value || 'all'}
                style={[
                  styles.statusFilterItem,
                  statusFilter === option.value && styles.statusFilterItemActive
                ]}
                onPress={() => setStatusFilter(option.value)}
              >
                <View style={[
                  styles.statusDot,
                  option.value ? { backgroundColor: getStatusColor(option.value) } : { backgroundColor: 'transparent' }
                ]} />
                <Text style={[
                  styles.statusFilterText,
                  statusFilter === option.value && styles.statusFilterTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Nav */}
        <View style={styles.quickNav}>
          <Link href="/rota/my-shifts" asChild>
            <ForceTouchable style={styles.navButton}>
              <Clock size={18} color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
              <Text style={styles.navButtonText}>My Shifts</Text>
              {myShiftsCount > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{myShiftsCount}</Text>
                </View>
              )}
            </ForceTouchable>
          </Link>

          <Link href="/rota/open-shifts" asChild>
            <ForceTouchable style={styles.navButton}>
              <Users size={18} color={theme === 'dark' ? '#8B5CF6' : '#7C3AED'} />
              <Text style={styles.navButtonText}>Open</Text>
              {openShiftsCount > 0 && (
                <View style={[styles.navBadge, { backgroundColor: '#8B5CF6' }]}>
                  <Text style={styles.navBadgeText}>{openShiftsCount}</Text>
                </View>
              )}
            </ForceTouchable>
          </Link>

          {isAdmin ? (
            <Link href="/rota/shift-requests" asChild>
              <ForceTouchable style={styles.navButton}>
                <UserCheck size={18} color={theme === 'dark' ? '#F59E0B' : '#D97706'} />
                <Text style={styles.navButtonText}>Requests</Text>
              </ForceTouchable>
            </Link>
          ) : (
            <Link href="/rota/my-requests" asChild>
              <ForceTouchable style={styles.navButton}>
                <UserCheck size={18} color={theme === 'dark' ? '#8B5CF6' : '#7C3AED'} />
                <Text style={styles.navButtonText}>Requests</Text>
              </ForceTouchable>
            </Link>
          )}
        </View>
      </View>

      {/* Main Content */}
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
        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme === 'dark' ? '#3B82F6' : '#2563EB'} />
            <Text style={styles.loadingText}>Loading shifts...</Text>
          </View>
        ) : filteredShifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.emptyTitle}>
              {statusFilter 
                ? `No ${statusFilter} shifts`
                : shouldShowAllShifts 
                  ? 'No shifts scheduled' 
                  : 'No shifts assigned to you'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isAdmin ? 'Tap the + button to add your first shift' : 
               viewMode === 'all' ? 'No shifts scheduled for this period' : 
               'You have no shifts scheduled for this week'}
            </Text>
            {/* Note: Admin can add via RotaHeader + button or WeekView empty slots */}
          </View>
        ) : (
          <>
            {/* Weekly Schedule */}
            <View style={styles.scheduleSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {shouldShowAllShifts ? 'Weekly Schedule' : 'My Schedule'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredShifts.length} shift{filteredShifts.length !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <WeekView
                shifts={filteredShifts}
                selectedDate={selectedDate}
                onShiftPress={handleShiftPress}
                onAddShift={isAdmin ? handleAddShiftFromWeekView : undefined} // Pass the callback
                loading={false}
              />
            </View>

            {/* Upcoming Shifts List */}
            <View style={styles.upcomingSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
                <Text style={styles.sectionSubtitle}>Next 7 days</Text>
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
                            {shift.user_id ? 'Assigned' : 'Unassigned'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Shift Actions Menu */}
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

            {/* Admin Tools */}
            {isAdmin && filteredShifts.length > 0 && (
              <View style={styles.adminSection}>
                <AdminTools onBulkAdd={() => {}} onCopyWeek={() => {}} />
              </View>
            )}
            
            {/* Week Summary */}
            {filteredShifts.length > 0 && (
              <View style={styles.summarySection}>
                <WeekSummary shifts={filteredShifts} isAdmin={isAdmin} />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Shift Modal (for WeekView add) */}
      <CreateShiftModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleShiftCreated}
        defaultDate={createModalDate} // Use the date from WeekView
      />

      {/* Edit Shift Modal */}
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
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  quickActions: {
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  actionGroup: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusFilter: {
    marginBottom: 12,
  },
  statusFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusFilterItemActive: {
    backgroundColor: theme === 'dark' ? '#2563EB' : '#3B82F6',
    borderColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickNav: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 12,
    position: 'relative',
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
    marginTop: 4,
  },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  navBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
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
  scheduleSection: {
    padding: 16,
  },
  upcomingSection: {
    padding: 16,
    paddingTop: 0,
  },
  adminSection: {
    padding: 16,
    paddingTop: 0,
  },
  summarySection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
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
});