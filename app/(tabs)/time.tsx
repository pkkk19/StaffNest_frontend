import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { clockIn, clockOut, setLocationPermission } from '@/store/slices/timeTrackingSlice';
import { Clock, MapPin, Play, Square, CreditCard as Edit3, Calendar, TrendingUp } from 'lucide-react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

export default function TimeTracking() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { entries, currentEntry, locationPermission } = useSelector((state: RootState) => state.timeTracking);
  const dispatch = useDispatch();
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      dispatch(setLocationPermission(status === 'granted'));
      
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location permission');
    }
  };

  const handleClockIn = async () => {
    if (!locationPermission) {
      Alert.alert('Location Required', 'Please enable location services to clock in');
      return;
    }

    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const newEntry = {
        id: Date.now().toString(),
        staffId: user!.id,
        staffName: user!.name,
        date: new Date().toISOString().split('T')[0],
        clockIn: new Date().toISOString(),
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: address[0] ? `${address[0].street}, ${address[0].city}` : 'Unknown location',
        },
        status: 'active' as const,
      };

      dispatch(clockIn(newEntry));
      Alert.alert('Success', 'Clocked in successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to clock in. Please try again.');
    }
  };

  const handleClockOut = () => {
    if (!currentEntry) return;

    const clockOutTime = new Date().toISOString();
    const totalHours = (new Date(clockOutTime).getTime() - new Date(currentEntry.clockIn).getTime()) / (1000 * 60 * 60);

    dispatch(clockOut({
      id: currentEntry.id,
      clockOut: clockOutTime,
      totalHours: Math.round(totalHours * 100) / 100,
    }));

    Alert.alert('Success', 'Clocked out successfully!');
  };

  const openEditModal = (entry: any) => {
    setSelectedEntry(entry);
    setEditClockIn(new Date(entry.clockIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    setEditClockOut(entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
    setEditNotes(entry.notes || '');
    setEditModalVisible(true);
  };

  const saveEdit = () => {
    if (!selectedEntry) return;

    // Here you would normally validate and save the edited times
    Alert.alert('Success', 'Time entry updated successfully!');
    setEditModalVisible(false);
  };

  const todayEntries = entries.filter(entry => 
    entry.date === new Date().toISOString().split('T')[0] &&
    (user?.role === 'admin' || entry.staffId === user?.id)
  );

  const weekEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return entryDate >= weekStart && entryDate <= weekEnd &&
           (user?.role === 'admin' || entry.staffId === user?.id);
  });

  const totalWeekHours = weekEntries.reduce((total, entry) => total + (entry.totalHours || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.statusBarSpacer} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Clock size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>Time Tracking</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Current Status */}
        <View style={styles.statusSection}>
          {currentEntry ? (
            <View style={styles.activeCard}>
              <View style={styles.activeHeader}>
                <View style={styles.activeIndicator} />
                <Text style={styles.activeTitle}>Currently Working</Text>
              </View>
              <Text style={styles.activeTime}>
                Started at {new Date(currentEntry.clockIn).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              <View style={styles.activeLocation}>
                <MapPin size={16} color="#059669" />
                <Text style={styles.activeLocationText}>{currentEntry.location.address}</Text>
              </View>
              <TouchableOpacity
                style={styles.clockOutButton}
                onPress={handleClockOut}
              >
                <Square size={20} color="#FFFFFF" />
                <Text style={styles.clockOutButtonText}>Clock Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inactiveCard}>
              <Text style={styles.inactiveTitle}>Ready to Start</Text>
              <Text style={styles.inactiveSubtitle}>
                Clock in when you arrive at your workplace
              </Text>
              <TouchableOpacity
                style={styles.clockInButton}
                onPress={handleClockIn}
              >
                <Play size={20} color="#FFFFFF" />
                <Text style={styles.clockInButtonText}>Clock In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Week Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <TrendingUp size={24} color="#2563EB" />
              <Text style={styles.summaryValue}>{totalWeekHours.toFixed(1)}h</Text>
              <Text style={styles.summaryLabel}>Total Hours</Text>
            </View>
            <View style={styles.summaryCard}>
              <Calendar size={24} color="#059669" />
              <Text style={styles.summaryValue}>{weekEntries.length}</Text>
              <Text style={styles.summaryLabel}>Days Worked</Text>
            </View>
            <View style={styles.summaryCard}>
              <Clock size={24} color="#EA580C" />
              <Text style={styles.summaryValue}>
                {weekEntries.length > 0 ? (totalWeekHours / weekEntries.length).toFixed(1) : '0'}h
              </Text>
              <Text style={styles.summaryLabel}>Avg/Day</Text>
            </View>
          </View>
        </View>

        {/* Today's Entries */}
        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          {todayEntries.map((entry) => (
            <View key={`entry-${entry.id}`} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryTime}>
                    {new Date(entry.clockIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {entry.clockOut && ` - ${new Date(entry.clockOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                  </Text>
                  <View style={styles.entryLocation}>
                    <MapPin size={12} color="#6B7280" />
                    <Text style={styles.entryLocationText}>{entry.location.address}</Text>
                  </View>
                </View>
                <View style={styles.entryActions}>
                  {entry.totalHours && (
                    <Text style={styles.entryHours}>{entry.totalHours.toFixed(1)}h</Text>
                  )}
                </View>
              </View>
              {entry.notes && (
                <Text style={styles.entryNotes}>{entry.notes}</Text>
              )}
              <View style={[styles.entryStatus, { backgroundColor: 
                entry.status === 'active' ? '#059669' : 
                entry.status === 'edited' ? '#EA580C' : '#6B7280' 
              }]}>
                <Text style={styles.entryStatusText}>
                  {entry.status === 'active' ? 'ACTIVE' : 
                   entry.status === 'edited' ? 'EDITED' : 'COMPLETED'}
                </Text>
              </View>
            </View>
          ))}

          {todayEntries.length === 0 && (
            <View style={styles.noEntries}>
              <Clock size={48} color="#E5E7EB" />
              <Text style={styles.noEntriesTitle}>No time entries today</Text>
              <Text style={styles.noEntriesText}>
                Clock in when you start your shift
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Time Entry</Text>
            <TouchableOpacity onPress={saveEdit}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Clock In Time</Text>
              <TextInput
                style={styles.timeInput}
                value={editClockIn}
                onChangeText={setEditClockIn}
                placeholder="09:00"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Clock Out Time</Text>
              <TextInput
                style={styles.timeInput}
                value={editClockOut}
                onChangeText={setEditClockOut}
                placeholder="17:00"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Add any notes about this time entry..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statusBarSpacer: {
    height: Constants.statusBarHeight,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  statusSection: {
    margin: 24,
    marginBottom: 16,
  },
  activeCard: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    marginRight: 8,
  },
  activeTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
  },
  activeTime: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 8,
  },
  activeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeLocationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  clockOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  clockOutButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  inactiveCard: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
  },
  inactiveTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  inactiveSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  clockInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  clockInButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  summarySection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  entriesSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryInfo: {
    flex: 1,
  },
  entryStaff: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  entryTime: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  entryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryLocationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  entryActions: {
    alignItems: 'flex-end',
  },
  entryHours: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#2563EB',
    marginBottom: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  entryNotes: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  entryStatus: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  entryStatusText: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  noEntries: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  noEntriesTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noEntriesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  modalSave: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  modalContent: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  timeInput: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    textAlignVertical: 'top',
  },
});