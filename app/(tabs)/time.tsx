// app/(tabs)/time.tsx - Modern Minimal Design
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  Linking,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { 
  Clock, 
  MapPin, 
  Navigation, 
  ChevronDown,
  ChevronUp,
  Calendar,
  Building,
  Zap,
  AlertTriangle,
  X,
  Shield,
  Home,
  Briefcase,
  Check,
  CalendarDays
} from 'lucide-react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { companiesAPI, shiftsAPI } from '@/services/api';
import { Shift } from '@/app/types/rota.types';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface CompanyLocation {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
  address?: string;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

interface ShiftOption {
  shift: Shift;
  canClockIn: boolean;
  reason?: string;
  isFuture?: boolean;
  isPast?: boolean;
}

const getShiftUserId = (shift: Shift | null): string | undefined => {
  if (!shift) return undefined;
  
  if (typeof shift.user_id === 'string') {
    return shift.user_id;
  }
  
  if (shift.user_id && typeof shift.user_id === 'object') {
    const userObj = shift.user_id as any;
    if (userObj._id) return userObj._id;
    if (userObj.id) return userObj.id;
  }
  
  return undefined;
};

const parseShiftDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  
  try {
    if (typeof dateValue === 'object' && '$date' in dateValue) {
      const dateObj = dateValue.$date;
      if (dateObj && typeof dateObj === 'object' && '$numberLong' in dateObj) {
        return new Date(parseInt(dateObj.$numberLong));
      }
      if (typeof dateObj === 'string') {
        return new Date(dateObj);
      }
    }
    
    if (typeof dateValue === 'string') return new Date(dateValue);
    if (typeof dateValue === 'number') return new Date(dateValue);
    if (dateValue instanceof Date) return dateValue;
    
    return new Date();
  } catch (error) {
    return new Date();
  }
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString([], { 
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const CustomModal = ({ visible, onClose, children, title, icon: Icon, theme }: any) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const modalStyles = createModalStyles(theme);

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={theme === 'dark' ? 'dark' : 'light'} />
        <TouchableOpacity 
          style={modalStyles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={[
            modalStyles.customModalContent,
            {
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0]
                })
              }]
            }
          ]}
        >
          <View style={modalStyles.customModalHeader}>
            <View style={modalStyles.modalTitleContainer}>
              {Icon && <Icon size={24} color={theme === 'dark' ? '#6366F1' : '#4F46E5'} style={modalStyles.modalIcon} />}
              <Text style={modalStyles.customModalTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <X size={24} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function TimeTracking() {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [companyLocations, setCompanyLocations] = useState<CompanyLocation[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 27.7172,
    longitude: 85.3240,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [clockedInDuration, setClockedInDuration] = useState(0);
  
  const [availableShifts, setAvailableShifts] = useState<ShiftOption[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showShiftSelectionModal, setShowShiftSelectionModal] = useState(false);
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number | null>(null);
  
  const mapRef = useRef<MapView>(null);
  const styles = createStyles(theme);
  const modalStyles = createModalStyles(theme);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      if (isClockedIn && currentShift?.clock_in_time) {
        const clockInTime = parseShiftDate(currentShift.clock_in_time);
        const duration = now.getTime() - clockInTime.getTime();
        setClockedInDuration(duration);
      }
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [isClockedIn, currentShift]);

  useEffect(() => {
    checkLocationPermission();
    fetchCompanyInfo();
    if (user?._id) {
      fetchTodayShifts();
    }
  }, [user?._id]);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      setLocationPermission(hasPermission);
      
      if (hasPermission) {
        await getCurrentLocation();
      }
    } catch (error) {
      console.log('Error checking location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(newLocation);
      
      setRegion({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      
    } catch (error) {
      console.log('Error getting location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      setLocationPermission(hasPermission);
      
      if (hasPermission) {
        await getCurrentLocation();
      } else {
        Alert.alert(
          'Location Required',
          'Enable location services to clock in/out',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Linking.openSettings() 
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request location permission');
    } finally {
      setIsLoading(false);
    }
  };

const fetchCompanyInfo = async () => {
  try {
    if (!user?._id) return;
    
    // Try to get locations (now accessible to both admin and staff)
    try {
      const locationsResponse = await companiesAPI.getLocations();
      
      if (locationsResponse.data?.locations) {
        setCompanyLocations(locationsResponse.data.locations);
        return;
      }
    } catch (locationsError) {
      console.log('Failed to fetch locations:', locationsError);
    }
    
    // Fallback: Try to get company info for admin
    try {
      const companyResponse = await companiesAPI.getMyCompany();
      
      if (companyResponse.data?.locations) {
        const activeLocations = companyResponse.data.locations.filter(
          (loc: CompanyLocation) => loc.is_active !== false
        );
        setCompanyLocations(activeLocations);
        return;
      }
    } catch (adminError) {
      console.log('Admin endpoint failed:', adminError);
    }
    
    // If user has company_id, try to get company by ID
    if (user.company_id) {
      try {
        const companyResponse = await companiesAPI.getCompany(user.company_id);
        
        if (companyResponse.data?.locations) {
          const activeLocations = companyResponse.data.locations.filter(
            (loc: CompanyLocation) => loc.is_active !== false
          );
          setCompanyLocations(activeLocations);
          return;
        }
      } catch (companyError) {
        console.log('Company by ID endpoint failed:', companyError);
      }
    }
    
    // Set empty array if no locations found
    setCompanyLocations([]);
    
  } catch (error) {
    console.error('Error fetching company info:', error);
    setCompanyLocations([]);
  }
};

  const fetchTodayShifts = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      
      const formatDateForAPI = (date: Date): string => {
        return date.toISOString().split('T')[0];
      };
      
      let shiftsResponse;
      try {
        shiftsResponse = await shiftsAPI.getMyShifts();
        
        if (!shiftsResponse.data || shiftsResponse.data.length === 0) {
          shiftsResponse = await shiftsAPI.getMyShifts({
            start_date: formatDateForAPI(todayStart),
            end_date: formatDateForAPI(todayEnd)
          });
        }
      } catch (apiError) {
        try {
          shiftsResponse = await shiftsAPI.getMyShifts({});
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      
      const shiftsData = shiftsResponse.data || [];
      
      const filteredShifts = shiftsData.filter((shift: Shift) => {
        try {
          const shiftStartDate = parseShiftDate(shift.start_time);
          const isToday = isSameDay(shiftStartDate, now);
          
          const shiftUserId = getShiftUserId(shift);
          const isAssignedToMe = shiftUserId === user._id || !shift.user_id;
          
          return isToday && (isAssignedToMe || !shift.user_id);
        } catch (error) {
          return false;
        }
      });
      
      setTodayShifts(filteredShifts);
      
      const clockedInShift = filteredShifts.find((shift: Shift) => 
        shift.status === 'in-progress' || shift.status === 'late'
      );
      
      if (clockedInShift) {
        setCurrentShift(clockedInShift);
        setIsClockedIn(true);
        const clockInTime = parseShiftDate(clockedInShift.clock_in_time);
        const duration = now.getTime() - clockInTime.getTime();
        setClockedInDuration(duration);
      } else {
        setCurrentShift(null);
        setIsClockedIn(false);
        setClockedInDuration(0);
      }
      
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch shifts');
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  const onRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchTodayShifts();
  }, [fetchTodayShifts]);

  const validateLocation = (): { isValid: boolean; message: string; locationName?: string } => {
    if (!currentLocation) {
      return { isValid: false, message: 'Location not available' };
    }
    
    if (companyLocations.length === 0) {
      return { isValid: false, message: 'No work locations configured' };
    }
    
    for (const workLocation of companyLocations) {
      if (workLocation.is_active === false) continue;
      
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        workLocation.latitude,
        workLocation.longitude
      );
      
      if (distance <= workLocation.radius) {
        return {
          isValid: true,
          message: `At ${workLocation.name}`,
          locationName: workLocation.name
        };
      }
    }
    
    let closestLocation = '';
    let minDistance = Infinity;
    
    companyLocations.forEach((loc: CompanyLocation) => {
      if (loc.is_active !== false) {
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          loc.latitude,
          loc.longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestLocation = loc.name;
        }
      }
    });
    
    return { 
      isValid: false, 
      message: `${Math.round(minDistance)}m to nearest location` 
    };
  };

  const getAvailableShifts = (): ShiftOption[] => {
    const now = new Date();
    const options: ShiftOption[] = [];
    
    todayShifts.forEach((shift: Shift) => {
      try {
        const shiftStart = parseShiftDate(shift.start_time);
        const shiftEnd = parseShiftDate(shift.end_time);
        const fifteenMinutesBefore = new Date(shiftStart.getTime() - 15 * 60000);
        const fifteenMinutesAfterEnd = new Date(shiftEnd.getTime() + 15 * 60000);
        
        let canClockIn = false;
        let isFuture = false;
        let isPast = false;
        let reason = '';
        
        if (shift.status === 'in-progress' || shift.status === 'late') {
          reason = 'Already clocked in';
          isPast = true;
        } else if (shift.status === 'completed' || shift.status === 'cancelled') {
          reason = 'Shift completed';
          isPast = true;
        } else if (now < fifteenMinutesBefore) {
          reason = `Starts at ${formatTime(shiftStart)}`;
          isFuture = true;
        } else if (now > fifteenMinutesAfterEnd) {
          reason = 'Shift ended';
          isPast = true;
        } else {
          canClockIn = true;
          if (now > shiftEnd) {
            reason = 'Within grace period';
          } else if (now < shiftStart) {
            reason = 'Available early';
          } else {
            reason = 'Available now';
          }
        }
        
        options.push({
          shift,
          canClockIn,
          reason,
          isFuture,
          isPast
        });
      } catch (error) {
        console.error('Error processing shift:', error);
      }
    });
    
    return options;
  };

  const handleClockInPress = async () => {
    if (!locationPermission) {
      await requestLocationPermission();
      if (!locationPermission) return;
    }
    
    if (!currentLocation) {
      Alert.alert('Location Error', 'Please wait for location to load');
      return;
    }
    
    const validation = validateLocation();
    
    if (!validation.isValid) {
      Alert.alert(
        'Cannot Clock In',
        `You must be at a work location to clock in.\n\n${validation.message}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    const shiftOptions = getAvailableShifts();
    setAvailableShifts(shiftOptions);
    setShowShiftSelectionModal(true);
  };

  const handleClockOutPress = async () => {
    if (!currentShift) {
      Alert.alert('Error', 'No active shift found');
      return;
    }
    
    if (!locationPermission) {
      await requestLocationPermission();
      if (!locationPermission) return;
    }
    
    if (!currentLocation) {
      Alert.alert('Location Error', 'Please wait for location to load');
      return;
    }
    
    const validation = validateLocation();
    if (!validation.isValid) {
      Alert.alert(
        'Cannot Clock Out',
        `You must be at a work location to clock out.\n\n${validation.message}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setShowClockOutModal(true);
  };

  const handleShiftSelection = (shiftOption: ShiftOption | null) => {
    if (shiftOption) {
      setSelectedShift(shiftOption.shift);
    } else {
      setSelectedShift(null);
    }
    setShowShiftSelectionModal(false);
    setShowClockInModal(true);
  };

  const confirmClockIn = async () => {
    try {
      setIsLoading(true);
      
      if (!currentLocation) {
        Alert.alert('Error', 'Location not available');
        return;
      }
      
      const locationData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      };
      
      let shiftId;
      
      if (!selectedShift) {
        const now = new Date();
        const endTime = new Date(now.getTime() + 8 * 60 * 60000);
        
        try {
          const newShift = await shiftsAPI.createShift({
            title: 'Unscheduled Work',
            start_time: now.toISOString(),
            end_time: endTime.toISOString(),
            location: validateLocation().locationName || 'Work Location',
            user_id: undefined,
            type: 'open',
            status: 'scheduled'
          });
          
          shiftId = newShift.data._id;
          
          await shiftsAPI.updateShift(shiftId, {
            user_id: user?._id,
            type: 'assigned'
          });
          
        } catch (createError: any) {
          if (createError.response?.data?.message?.includes('already has a shift')) {
            await fetchTodayShifts();
            const existingShift = todayShifts.find(s => 
              s.title === 'Unscheduled Work' && 
              (s.status === 'scheduled' || s.status === 'in-progress' || s.status === 'late')
            );
            if (existingShift) {
              shiftId = existingShift._id;
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      } else {
        shiftId = selectedShift._id;
      }
      
      await shiftsAPI.clockIn(shiftId, locationData);
      await fetchTodayShifts();
      
      setShowClockInModal(false);
      setSelectedShift(null);
      
      Alert.alert(
        'Success',
        'You have successfully clocked in',
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to clock in. Please try again.';
      
      if (errorMessage.includes('already has a shift')) {
        Alert.alert(
          'Already Clocked In',
          'You already have an active shift. Please check your current status.',
          [{ text: 'OK', onPress: fetchTodayShifts }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const confirmClockOut = async () => {
    try {
      if (!currentShift) {
        Alert.alert('Error', 'No active shift found');
        return;
      }
      
      if (!currentLocation) {
        Alert.alert('Error', 'Location not available');
        return;
      }
      
      setIsLoading(true);
      
      const locationData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      };
      
      await shiftsAPI.clockOut(currentShift._id, locationData);
      await fetchTodayShifts();
      
      setShowClockOutModal(false);
      
      Alert.alert(
        'Success',
        'You have successfully clocked out',
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      Alert.alert('Error', 'Failed to clock out');
    } finally {
      setIsLoading(false);
    }
  };

  const focusOnCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  const focusOnLocation = (location: CompanyLocation) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setSelectedLocationIndex(companyLocations.findIndex(loc => 
        loc.latitude === location.latitude && loc.longitude === location.longitude
      ));
    }
  };

  const validation = validateLocation();
  const isAtWorkLocation = validation.isValid;

  const renderShiftSelectionModal = () => (
    <CustomModal
      visible={showShiftSelectionModal}
      onClose={() => setShowShiftSelectionModal(false)}
      title="Clock In"
      icon={Clock}
      theme={theme}
    >
      <ScrollView style={modalStyles.shiftsListContainer} showsVerticalScrollIndicator={false}>
        <View style={modalStyles.modalHeaderCard}>
          <View style={modalStyles.modalHeaderIcon}>
            <Clock size={28} color={theme === 'dark' ? '#6366F1' : '#4F46E5'} />
          </View>
          <Text style={modalStyles.modalHeaderTitle}>Select Shift</Text>
          <Text style={modalStyles.modalHeaderSubtitle}>
            Choose from your scheduled shifts or start unscheduled work
          </Text>
        </View>
        
        {availableShifts.length > 0 ? (
          <View style={modalStyles.shiftsSection}>
            <View style={modalStyles.sectionHeader}>
              <CalendarDays size={18} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
              <Text style={modalStyles.sectionTitle}>Scheduled Shifts</Text>
            </View>
            
            {availableShifts.map((shiftOption, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  modalStyles.shiftOptionCard,
                  shiftOption.canClockIn && modalStyles.shiftOptionAvailable,
                  shiftOption.isFuture && modalStyles.shiftOptionFuture,
                  shiftOption.isPast && modalStyles.shiftOptionPast
                ]}
                onPress={() => handleShiftSelection(shiftOption)}
                disabled={!shiftOption.canClockIn}
              >
                <View style={modalStyles.shiftOptionContent}>
                  <View style={modalStyles.shiftOptionHeader}>
                    <Text style={modalStyles.shiftOptionTitle}>
                      {shiftOption.shift.title}
                    </Text>
                    {shiftOption.canClockIn ? (
                      <View style={modalStyles.availableBadge}>
                        <Check size={14} color="#FFFFFF" />
                      </View>
                    ) : shiftOption.isFuture ? (
                      <View style={modalStyles.futureBadge}>
                        <Clock size={14} color="#F59E0B" />
                      </View>
                    ) : (
                      <View style={modalStyles.pastBadge}>
                        <X size={14} color="#EF4444" />
                      </View>
                    )}
                  </View>
                  
                  <View style={modalStyles.shiftOptionTime}>
                    <Clock size={14} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                    <Text style={modalStyles.shiftOptionTimeText}>
                      {formatTime(parseShiftDate(shiftOption.shift.start_time))} - {formatTime(parseShiftDate(shiftOption.shift.end_time))}
                    </Text>
                  </View>
                  
                  <Text style={[
                    modalStyles.shiftOptionReason,
                    shiftOption.canClockIn && modalStyles.reasonAvailable,
                    shiftOption.isFuture && modalStyles.reasonFuture,
                    shiftOption.isPast && modalStyles.reasonPast
                  ]}>
                    {shiftOption.reason}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={modalStyles.emptyShiftsSection}>
            <Calendar size={32} color={theme === 'dark' ? '#475569' : '#CBD5E1'} />
            <Text style={modalStyles.emptyShiftsText}>
              No scheduled shifts for today
            </Text>
            <Text style={modalStyles.emptyShiftsSubtext}>
              You can start unscheduled work instead
            </Text>
          </View>
        )}
        
        {availableShifts.length > 0 && (
          <View style={modalStyles.dividerContainer}>
            <View style={modalStyles.dividerLine} />
            <Text style={modalStyles.dividerText}>OR</Text>
            <View style={modalStyles.dividerLine} />
          </View>
        )}
        
        <TouchableOpacity
          style={modalStyles.unscheduledOptionCard}
          onPress={() => handleShiftSelection(null)}
        >
          <View style={modalStyles.unscheduledOptionContent}>
            <View style={modalStyles.unscheduledIcon}>
              <Zap size={20} color="#FFFFFF" />
            </View>
            <View style={modalStyles.unscheduledTextContainer}>
              <Text style={modalStyles.unscheduledTitle}>Start Unscheduled Work</Text>
              <Text style={modalStyles.unscheduledDescription}>
                Clock in outside of your scheduled hours
              </Text>
            </View>
            <View style={modalStyles.unscheduledArrow}>
              <ChevronUp size={16} color={theme === 'dark' ? '#94A3B8' : '#64748B'} style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={[
          modalStyles.locationStatusCard,
          isAtWorkLocation ? modalStyles.locationStatusValid : modalStyles.locationStatusInvalid
        ]}>
          <View style={modalStyles.locationStatusHeader}>
            <View style={[
              modalStyles.locationStatusIcon,
              isAtWorkLocation ? modalStyles.locationStatusIconValid : modalStyles.locationStatusIconInvalid
            ]}>
              {isAtWorkLocation ? (
                <Check size={16} color="#FFFFFF" />
              ) : (
                <X size={16} color="#FFFFFF" />
              )}
            </View>
            <View style={modalStyles.locationStatusTextContainer}>
              <Text style={[
                modalStyles.locationStatusText,
                { color: isAtWorkLocation ? '#059669' : '#EF4444' }
              ]}>
                {isAtWorkLocation ? 'At Work Location' : 'Not at Work Location'}
              </Text>
              <Text style={modalStyles.locationStatusDetail}>
                {validation.message}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={modalStyles.customModalActions}>
        <TouchableOpacity
          style={[modalStyles.customCancelButton, modalStyles.fullWidthButton]}
          onPress={() => setShowShiftSelectionModal(false)}
        >
          <Text style={modalStyles.customCancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </CustomModal>
  );

  const renderClockInModal = () => (
    <CustomModal
      visible={showClockInModal}
      onClose={() => {
        setShowClockInModal(false);
        setSelectedShift(null);
      }}
      title={selectedShift ? "Confirm Clock In" : "Start Unscheduled Work"}
      icon={Clock}
      theme={theme}
    >
      <ScrollView style={modalStyles.modalBody} showsVerticalScrollIndicator={false}>
        {selectedShift ? (
          <View style={modalStyles.shiftDetailsCard}>
            <View style={modalStyles.shiftDetailHeader}>
              <Text style={modalStyles.shiftDetailMainTitle}>{selectedShift.title}</Text>
              <View style={modalStyles.shiftStatusBadge}>
                <Text style={modalStyles.shiftStatusText}>Scheduled Shift</Text>
              </View>
            </View>
            
            <View style={modalStyles.detailRow}>
              <View style={modalStyles.detailIconContainer}>
                <Clock size={16} color={theme === 'dark' ? '#6366F1' : '#4F46E5'} />
              </View>
              <View style={modalStyles.detailTextContainer}>
                <Text style={modalStyles.detailLabel}>Time</Text>
                <Text style={modalStyles.detailValue}>
                  {formatTime(parseShiftDate(selectedShift.start_time))} - {formatTime(parseShiftDate(selectedShift.end_time))}
                </Text>
              </View>
            </View>
            
            {selectedShift.location && (
              <View style={modalStyles.detailRow}>
                <View style={modalStyles.detailIconContainer}>
                  <MapPin size={16} color={theme === 'dark' ? '#6366F1' : '#4F46E5'} />
                </View>
                <View style={modalStyles.detailTextContainer}>
                  <Text style={modalStyles.detailLabel}>Location</Text>
                  <Text style={modalStyles.detailValue}>
                    {selectedShift.location}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={modalStyles.unscheduledInfoCard}>
            <View style={modalStyles.unscheduledInfoIcon}>
              <Zap size={28} color={theme === 'dark' ? '#6366F1' : '#4F46E5'} />
            </View>
            <Text style={modalStyles.unscheduledInfoTitle}>Unscheduled Work</Text>
            <Text style={modalStyles.unscheduledInfoText}>
              You are clocking in without a scheduled shift. This will create a work entry for today.
            </Text>
          </View>
        )}
        
        <View style={[
          modalStyles.locationStatusCard,
          isAtWorkLocation ? modalStyles.locationStatusValid : modalStyles.locationStatusInvalid
        ]}>
          <View style={modalStyles.locationStatusHeader}>
            <View style={[
              modalStyles.locationStatusIcon,
              isAtWorkLocation ? modalStyles.locationStatusIconValid : modalStyles.locationStatusIconInvalid
            ]}>
              {isAtWorkLocation ? (
                <Check size={16} color="#FFFFFF" />
              ) : (
                <X size={16} color="#FFFFFF" />
              )}
            </View>
            <View style={modalStyles.locationStatusTextContainer}>
              <Text style={[
                modalStyles.locationStatusText,
                { color: isAtWorkLocation ? '#059669' : '#EF4444' }
              ]}>
                {isAtWorkLocation ? 'Location Verified' : 'Location Issue'}
              </Text>
              <Text style={modalStyles.locationStatusDetail}>
                {validation.message}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={modalStyles.statsContainer}>
          <View style={modalStyles.statItem}>
            <Text style={modalStyles.statLabel}>Current Time</Text>
            <Text style={modalStyles.statValue}>{formatTime(new Date())}</Text>
          </View>
          <View style={modalStyles.statDivider} />
          <View style={modalStyles.statItem}>
            <Text style={modalStyles.statLabel}>Status</Text>
            <View style={[
              modalStyles.statusIndicatorBadge,
              isAtWorkLocation ? modalStyles.statusIndicatorBadgeValid : modalStyles.statusIndicatorBadgeInvalid
            ]}>
              <Text style={[
                modalStyles.statusIndicatorBadgeText,
                !isAtWorkLocation && modalStyles.statusIndicatorBadgeTextInvalid
              ]}>
                {isAtWorkLocation ? 'Valid' : 'Invalid'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={modalStyles.customModalActions}>
        <TouchableOpacity
          style={[modalStyles.customCancelButton, modalStyles.halfWidthButton]}
          onPress={() => {
            setShowClockInModal(false);
            setSelectedShift(null);
          }}
          disabled={isLoading}
        >
          <Text style={modalStyles.customCancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            modalStyles.customConfirmButton,
            !isAtWorkLocation && modalStyles.disabledButton,
            modalStyles.halfWidthButton
          ]}
          onPress={confirmClockIn}
          disabled={!isAtWorkLocation || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Clock size={18} color="#FFFFFF" />
              <Text style={modalStyles.customConfirmButtonText}>
                {selectedShift ? 'Clock In' : 'Start Work'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </CustomModal>
  );

  const renderClockOutModal = () => (
    <CustomModal
      visible={showClockOutModal}
      onClose={() => setShowClockOutModal(false)}
      title="Confirm Clock Out"
      icon={Clock}
      theme={theme}
    >
      <ScrollView style={modalStyles.modalBody} showsVerticalScrollIndicator={false}>
        {currentShift && (
          <View style={modalStyles.shiftDetailsCard}>
            <View style={modalStyles.shiftDetailHeader}>
              <Text style={modalStyles.shiftDetailMainTitle}>{currentShift.title}</Text>
              <View style={modalStyles.shiftStatusBadge}>
                <Text style={modalStyles.shiftStatusText}>Active Shift</Text>
              </View>
            </View>
            
            <View style={modalStyles.statsGrid}>
              <View style={modalStyles.statCard}>
                <View style={[modalStyles.statIconContainer, modalStyles.statIconContainerBlue]}>
                  <Clock size={16} color={theme === 'dark' ? '#6366F1' : '#4F46E5'} />
                </View>
                <Text style={modalStyles.statCardLabel}>Started At</Text>
                <Text style={modalStyles.statCardValue}>
                  {formatTime(parseShiftDate(currentShift.clock_in_time!))}
                </Text>
              </View>
              
              <View style={modalStyles.statCard}>
                <View style={[modalStyles.statIconContainer, modalStyles.statIconContainerGray]}>
                  <Clock size={16} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                </View>
                <Text style={modalStyles.statCardLabel}>Current Time</Text>
                <Text style={modalStyles.statCardValue}>
                  {formatTime(new Date())}
                </Text>
              </View>
              
              <View style={[modalStyles.statCard, modalStyles.durationCard]}>
                <View style={[modalStyles.statIconContainer, modalStyles.statIconContainerGreen]}>
                  <Clock size={16} color="#059669" />
                </View>
                <Text style={modalStyles.statCardLabel}>Duration</Text>
                <Text style={[modalStyles.statCardValue, modalStyles.durationValue]}>
                  {formatDuration(clockedInDuration)}
                </Text>
              </View>
            </View>
          </View>
        )}
        
        <View style={[
          modalStyles.locationStatusCard,
          isAtWorkLocation ? modalStyles.locationStatusValid : modalStyles.locationStatusInvalid
        ]}>
          <View style={modalStyles.locationStatusHeader}>
            <View style={[
              modalStyles.locationStatusIcon,
              isAtWorkLocation ? modalStyles.locationStatusIconValid : modalStyles.locationStatusIconInvalid
            ]}>
              {isAtWorkLocation ? (
                <Check size={16} color="#FFFFFF" />
              ) : (
                <X size={16} color="#FFFFFF" />
              )}
            </View>
            <View style={modalStyles.locationStatusTextContainer}>
              <Text style={[
                modalStyles.locationStatusText,
                { color: isAtWorkLocation ? '#059669' : '#EF4444' }
              ]}>
                {isAtWorkLocation ? 'Location Verified' : 'Location Issue'}
              </Text>
              <Text style={modalStyles.locationStatusDetail}>
                {validation.message}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={modalStyles.warningCard}>
          <AlertTriangle size={18} color="#F59E0B" />
          <Text style={modalStyles.warningText}>
            Make sure you have completed all work tasks before clocking out.
          </Text>
        </View>
      </ScrollView>
      
      <View style={modalStyles.customModalActions}>
        <TouchableOpacity
          style={[modalStyles.customCancelButton, modalStyles.halfWidthButton]}
          onPress={() => setShowClockOutModal(false)}
          disabled={isLoading}
        >
          <Text style={modalStyles.customCancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            modalStyles.customConfirmButton,
            modalStyles.clockOutButton,
            !isAtWorkLocation && modalStyles.disabledButton,
            modalStyles.halfWidthButton
          ]}
          onPress={confirmClockOut}
          disabled={!isAtWorkLocation || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Clock size={18} color="#FFFFFF" />
              <Text style={modalStyles.customConfirmButtonText}>Clock Out</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </CustomModal>
  );

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
        translucent 
        backgroundColor="transparent" 
      />
      
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={locationPermission}
          showsMyLocationButton={false}
          loadingEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          initialRegion={{
            latitude: currentLocation?.latitude || 27.7172,
            longitude: currentLocation?.longitude || 85.3240,
            latitudeDelta: 0.001,
            longitudeDelta: 0.001,
          }}
        >
          {companyLocations.map((location, index) => (
            <React.Fragment key={index}>
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.name}
                description={`Radius: ${location.radius}m`}
                pinColor={selectedLocationIndex === index ? 
                  (theme === 'dark' ? '#818CF8' : '#4F46E5') : 
                  '#059669'}
              />
              <Circle
                center={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                radius={location.radius}
                strokeColor={selectedLocationIndex === index ? 
                  (theme === 'dark' ? '#818CF8' : '#4F46E5') : 
                  '#059669'}
                fillColor={selectedLocationIndex === index ? 
                  (theme === 'dark' ? 'rgba(129, 140, 248, 0.1)' : 'rgba(79, 70, 229, 0.1)') : 
                  'rgba(5, 150, 105, 0.1)'}
                strokeWidth={1}
              />
            </React.Fragment>
          ))}
        </MapView>
      </View>

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.timeSection}>
            <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
            <Text style={styles.currentDate}>{formatDate(currentTime)}</Text>
          </View>
          
          <View style={styles.statusSection}>
            <View style={[
              styles.statusPill,
              { backgroundColor: isClockedIn ? '#059669' : (theme === 'dark' ? '#475569' : '#CBD5E1') }
            ]}>
              <View style={[
                styles.statusDot,
                { backgroundColor: isClockedIn ? '#FFFFFF' : (theme === 'dark' ? '#94A3B8' : '#64748B') }
              ]} />
              <Text style={styles.statusText}>
                {isClockedIn ? 'Clocked In' : 'Clocked Out'}
              </Text>
            </View>
            
            {isClockedIn && (
              <View style={[
                styles.timerContainer,
                { backgroundColor: theme === 'dark' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(16, 185, 129, 0.1)' }
              ]}>
                <Clock size={12} color="#059669" />
                <Text style={styles.timerText}>
                  {formatDuration(clockedInDuration)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {isClockedIn && currentShift && (
        <View style={styles.currentShiftCard}>
          <View style={styles.currentShiftContent}>
            <View style={styles.shiftIconContainer}>
              <Briefcase size={20} color="#FFFFFF" />
            </View>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftTitle} numberOfLines={1}>
                {currentShift.title}
              </Text>
              <View style={styles.shiftMeta}>
                <View style={styles.shiftMetaItem}>
                  <Clock size={12} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                  <Text style={styles.shiftMetaText}>
                    Started {formatTime(parseShiftDate(currentShift.clock_in_time!))}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.shiftDurationContainer}>
              <Text style={styles.shiftDuration}>
                {formatDuration(clockedInDuration)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={styles.locationButton}
        onPress={focusOnCurrentLocation}
      >
        <Navigation size={20} color={theme === 'dark' ? '#FFFFFF' : '#1E293B'} />
      </TouchableOpacity>

      <View style={styles.actionContainer}>
        {!isClockedIn ? (
          <TouchableOpacity
            style={[
              styles.clockInButton,
              (!isAtWorkLocation || isLoading) && styles.disabledButton
            ]}
            onPress={handleClockInPress}
            disabled={!isAtWorkLocation || isLoading}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <Clock size={28} color="#FFFFFF" />
              <Text style={styles.clockInButtonText}>
                {isLoading ? '...' : 'Clock In'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.clockOutButton,
              (!isAtWorkLocation || isLoading) && styles.disabledButton
            ]}
            onPress={handleClockOutPress}
            disabled={!isAtWorkLocation || isLoading}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <Clock size={28} color="#FFFFFF" />
              <Text style={styles.clockOutButtonText}>
                {isLoading ? '...' : 'Clock Out'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={[
          styles.locationBar,
          isAtWorkLocation ? styles.locationBarValid : styles.locationBarInvalid
        ]}
        onPress={() => setShowLocationDetails(!showLocationDetails)}
        activeOpacity={0.8}
      >
        <View style={styles.locationBarContent}>
          <View style={[
            styles.locationBarIcon,
            isAtWorkLocation ? styles.locationBarIconValid : styles.locationBarIconInvalid
          ]}>
            {isAtWorkLocation ? (
              <Check size={16} color="#FFFFFF" />
            ) : (
              <X size={16} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.locationBarTextContainer}>
            <Text style={styles.locationBarTitle}>
              {isAtWorkLocation ? 'At Work Location' : 'Location Issue'}
            </Text>
            <Text style={styles.locationBarText}>
              {validation.message}
            </Text>
          </View>
          {showLocationDetails ? (
            <ChevronUp size={20} color="#FFFFFF" />
          ) : (
            <ChevronDown size={20} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>

      {showLocationDetails && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showLocationDetails}
          onRequestClose={() => setShowLocationDetails(false)}
        >
          <View style={styles.locationModalOverlay}>
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={theme === 'dark' ? 'dark' : 'light'} />
            <TouchableOpacity 
              style={styles.locationModalBackdrop}
              activeOpacity={1}
              onPress={() => setShowLocationDetails(false)}
            />
            <View style={styles.locationModalContent}>
              <View style={styles.locationModalHeader}>
                <View style={styles.locationModalTitleContainer}>
                  <Building size={24} color={theme === 'dark' ? '#6366F1' : '#4F46E5'} />
                  <Text style={styles.locationModalTitle}>Work Locations</Text>
                </View>
                <TouchableOpacity onPress={() => setShowLocationDetails(false)} style={styles.modalCloseButton}>
                  <X size={24} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.locationModalBody} showsVerticalScrollIndicator={false}>
                {companyLocations.length > 0 ? (
                  companyLocations.map((location, index) => {
                    const distance = currentLocation ? 
                      calculateDistance(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        location.latitude,
                        location.longitude
                      ) : 0;
                    
                    const isWithinRange = distance <= location.radius;
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.workLocationCard,
                          isWithinRange && styles.workLocationCardActive,
                          selectedLocationIndex === index && styles.workLocationCardSelected
                        ]}
                        onPress={() => focusOnLocation(location)}
                      >
                        <View style={styles.workLocationHeader}>
                          <View style={styles.workLocationIcon}>
                            {location.name.includes('Office') || location.name.includes('Main') ? (
                              <Building size={18} color={isWithinRange ? '#059669' : (theme === 'dark' ? '#94A3B8' : '#64748B')} />
                            ) : location.name.includes('Home') ? (
                              <Home size={18} color={isWithinRange ? '#059669' : (theme === 'dark' ? '#94A3B8' : '#64748B')} />
                            ) : (
                              <MapPin size={18} color={isWithinRange ? '#059669' : (theme === 'dark' ? '#94A3B8' : '#64748B')} />
                            )}
                          </View>
                          <View style={styles.workLocationInfo}>
                            <Text style={styles.workLocationName}>{location.name}</Text>
                            <Text style={styles.workLocationDistance}>
                              {Math.round(distance)}m away
                            </Text>
                          </View>
                          {isWithinRange ? (
                            <View style={styles.locationStatusIndicator}>
                              <Check size={14} color="#059669" />
                            </View>
                          ) : (
                            <View style={styles.locationStatusIndicator}>
                              <X size={14} color="#EF4444" />
                            </View>
                          )}
                        </View>
                        
                        {location.address && (
                          <Text style={styles.workLocationAddress}>
                            {location.address}
                          </Text>
                        )}
                        
                        <View style={styles.workLocationFooter}>
                          <View style={styles.radiusBadge}>
                            <Text style={styles.radiusText}>Radius: {location.radius}m</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.focusButton}
                            onPress={() => focusOnLocation(location)}
                          >
                            <Text style={styles.focusButtonText}>View on Map</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.noLocationsCard}>
                    <Building size={32} color={theme === 'dark' ? '#475569' : '#CBD5E1'} />
                    <Text style={styles.noLocationsText}>No work locations configured</Text>
                    <Text style={styles.noLocationsSubtext}>
                      Contact your administrator to set up work locations
                    </Text>
                  </View>
                )}
                
                {!locationPermission && (
                  <View style={styles.permissionCard}>
                    <Shield size={24} color="#F59E0B" />
                    <Text style={styles.permissionTitle}>
                      Location Services Required
                    </Text>
                    <Text style={styles.permissionText}>
                      Enable location services to use clock in/out features
                    </Text>
                    <TouchableOpacity
                      style={styles.enableButton}
                      onPress={requestLocationPermission}
                    >
                      <Text style={styles.enableButtonText}>Enable Location</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {renderShiftSelectionModal()}
      {renderClockInModal()}
      {renderClockOutModal()}
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
  },
  mapContainer: {
    marginTop: Constants.statusBarHeight,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: Constants.statusBarHeight + 20,
    left: 20,
    right: 20,
    zIndex: 900,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeSection: {
    flex: 1,
  },
  currentTime: {
    fontSize: 32,
    fontWeight: '700',
    color: theme === 'dark' ? '#FFFFFF' : '#1E293B',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    letterSpacing: -0.5,
  },
  currentDate: {
    fontSize: 14,
    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statusSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme === 'dark' ? '#FFFFFF' : '#1E293B',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  timerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  locationButton: {
    position: 'absolute',
    top: Constants.statusBarHeight + 120,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 900,
  },
  currentShiftCard: {
    position: 'absolute',
    top: Constants.statusBarHeight + 90,
    left: 20,
    right: 20,
    backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
    zIndex: 900,
  },
  currentShiftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme === 'dark' ? '#6366F1' : '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
    marginBottom: 4,
  },
  shiftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shiftMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftMetaText: {
    fontSize: 12,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
  },
  shiftDurationContainer: {
    marginLeft: 12,
  },
  shiftDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 800,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  clockInButton: {
    backgroundColor: theme === 'dark' ? '#6366F1' : '#4F46E5',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 36,
    shadowColor: theme === 'dark' ? '#6366F1' : '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  clockOutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 36,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  clockInButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  clockOutButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  locationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 850,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  locationBarValid: {
    backgroundColor: '#059669',
  },
  locationBarInvalid: {
    backgroundColor: '#DC2626',
  },
  locationBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  locationBarIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBarIconValid: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  locationBarIconInvalid: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  locationBarTextContainer: {
    flex: 1,
  },
  locationBarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  locationBarText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  locationModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationModalBackdrop: {
    flex: 1,
  },
  locationModalContent: {
    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
    borderBottomWidth: 0,
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#334155' : '#F1F5F9',
  },
  locationModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
  },
  modalCloseButton: {
    padding: 4,
  },
  locationModalBody: {
    padding: 20,
    paddingBottom: 20,
  },
  workLocationCard: {
    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  workLocationCardActive: {
    borderColor: '#10B981',
    backgroundColor: theme === 'dark' ? '#064E3B' : '#F0FDF4',
  },
  workLocationCardSelected: {
    borderColor: theme === 'dark' ? '#818CF8' : '#4F46E5',
    borderWidth: 2,
  },
  workLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  workLocationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme === 'dark' ? '#334155' : '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workLocationInfo: {
    flex: 1,
  },
  workLocationName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
    marginBottom: 2,
  },
  workLocationDistance: {
    fontSize: 12,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
  },
  locationStatusIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme === 'dark' ? '#334155' : '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workLocationAddress: {
    fontSize: 13,
    color: theme === 'dark' ? '#CBD5E1' : '#475569',
    marginBottom: 12,
    lineHeight: 18,
  },
  workLocationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radiusBadge: {
    backgroundColor: theme === 'dark' ? '#334155' : '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  radiusText: {
    fontSize: 11,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    fontWeight: '500',
  },
  focusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme === 'dark' ? '#6366F1' : '#4F46E5',
    borderRadius: 10,
  },
  focusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noLocationsCard: {
    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
    marginBottom: 12,
  },
  noLocationsText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  noLocationsSubtext: {
    fontSize: 13,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  permissionCard: {
    backgroundColor: theme === 'dark' ? '#7F1D1D' : '#FEF2F2',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#991B1B' : '#FEE2E2',
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#FCA5A5' : '#92400E',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  permissionText: {
    fontSize: 13,
    color: theme === 'dark' ? '#FCA5A5' : '#92400E',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  enableButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  enableButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

const createModalStyles = (theme: string) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  customModalContent: {
    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
    borderBottomWidth: 0,
  },
  customModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#334155' : '#F1F5F9',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIcon: {
    marginRight: 4,
  },
  customModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalHeaderCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme === 'dark' ? '#334155' : '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
    marginBottom: 4,
  },
  modalHeaderSubtitle: {
    fontSize: 14,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  shiftsSection: {
    marginBottom: 20,
  },
  emptyShiftsSection: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginBottom: 20,
  },
  emptyShiftsText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyShiftsSubtext: {
    fontSize: 13,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#CBD5E1' : '#475569',
  },
  shiftOptionCard: {
    backgroundColor: theme === 'dark' ? '#334155' : '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#475569' : '#E2E8F0',
  },
  shiftOptionAvailable: {
    backgroundColor: theme === 'dark' ? '#064E3B' : '#F0FDF4',
    borderColor: theme === 'dark' ? '#059669' : '#D1FAE5',
  },
  shiftOptionFuture: {
    backgroundColor: theme === 'dark' ? '#78350F' : '#FFFBEB',
    borderColor: theme === 'dark' ? '#D97706' : '#FDE68A',
  },
  shiftOptionPast: {
    backgroundColor: theme === 'dark' ? '#334155' : '#F8FAFC',
    borderColor: theme === 'dark' ? '#475569' : '#E2E8F0',
    opacity: 0.6,
  },
  shiftOptionContent: {
    flex: 1,
  },
  shiftOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shiftOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
    flex: 1,
  },
  availableBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  futureBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pastBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftOptionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  shiftOptionTimeText: {
    fontSize: 13,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    fontWeight: '500',
  },
  shiftOptionReason: {
    fontSize: 12,
    color: theme === 'dark' ? '#94A3B8' : '#94A3B8',
    fontStyle: 'italic',
  },
  reasonAvailable: {
    color: '#059669',
    fontWeight: '500',
  },
  reasonFuture: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  reasonPast: {
    color: '#EF4444',
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme === 'dark' ? '#475569' : '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme === 'dark' ? '#94A3B8' : '#94A3B8',
    marginHorizontal: 12,
  },
  unscheduledOptionCard: {
    backgroundColor: theme === 'dark' ? '#334155' : '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#475569' : '#E2E8F0',
  },
  unscheduledOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unscheduledIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme === 'dark' ? '#6366F1' : '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unscheduledTextContainer: {
    flex: 1,
  },
  unscheduledTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
    marginBottom: 2,
  },
  unscheduledDescription: {
    fontSize: 13,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    lineHeight: 18,
  },
  unscheduledArrow: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationStatusCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  locationStatusValid: {
    backgroundColor: theme === 'dark' ? '#064E3B' : '#F0FDF4',
    borderColor: theme === 'dark' ? '#059669' : '#D1FAE5',
  },
  locationStatusInvalid: {
    backgroundColor: theme === 'dark' ? '#7F1D1D' : '#FEF2F2',
    borderColor: theme === 'dark' ? '#DC2626' : '#FEE2E2',
  },
  locationStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationStatusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationStatusIconValid: {
    backgroundColor: '#10B981',
  },
  locationStatusIconInvalid: {
    backgroundColor: '#EF4444',
  },
  locationStatusTextContainer: {
    flex: 1,
  },
  locationStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationStatusDetail: {
    fontSize: 13,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
  },
  shiftsListContainer: {
    maxHeight: height * 0.6,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  customModalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme === 'dark' ? '#334155' : '#F1F5F9',
  },
  customCancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme === 'dark' ? '#334155' : '#F1F5F9',
    alignItems: 'center',
    flex: 1,
  },
  fullWidthButton: {
    width: '100%',
  },
  halfWidthButton: {
    flex: 1,
  },
  customCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme === 'dark' ? '#F1F5F9' : '#475569',
  },
  customConfirmButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme === 'dark' ? '#6366F1' : '#4F46E5',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    shadowColor: theme === 'dark' ? '#6366F1' : '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  clockOutButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  disabledButton: {
    opacity: 0.5,
  },
  customConfirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shiftDetailsCard: {
    backgroundColor: theme === 'dark' ? '#334155' : '#F8FAFC',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#475569' : '#E2E8F0',
  },
  shiftDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shiftDetailMainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
    flex: 1,
  },
  shiftStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: theme === 'dark' ? '#475569' : '#F1F5F9',
    marginLeft: 10,
  },
  shiftStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme === 'dark' ? '#CBD5E1' : '#475569',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme === 'dark' ? '#475569' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
  },
  unscheduledInfoCard: {
    backgroundColor: theme === 'dark' ? '#334155' : '#F8FAFC',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#475569' : '#E2E8F0',
  },
  unscheduledInfoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme === 'dark' ? '#475569' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  unscheduledInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
    marginBottom: 6,
  },
  unscheduledInfoText: {
    fontSize: 14,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme === 'dark' ? '#334155' : '#E2E8F0',
    marginHorizontal: 12,
  },
  statusIndicatorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 2,
  },
  statusIndicatorBadgeValid: {
    backgroundColor: '#D1FAE5',
  },
  statusIndicatorBadgeInvalid: {
    backgroundColor: '#FEE2E2',
  },
  statusIndicatorBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  statusIndicatorBadgeTextInvalid: {
    color: '#DC2626',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statIconContainerBlue: {
    backgroundColor: theme === 'dark' ? '#3730A3' : '#EEF2FF',
  },
  statIconContainerGray: {
    backgroundColor: theme === 'dark' ? '#334155' : '#F8FAFC',
  },
  statIconContainerGreen: {
    backgroundColor: theme === 'dark' ? '#065F46' : '#F0FDF4',
  },
  durationCard: {
    backgroundColor: theme === 'dark' ? '#065F46' : '#F0FDF4',
    borderColor: theme === 'dark' ? '#059669' : '#D1FAE5',
  },
  statCardLabel: {
    fontSize: 10,
    color: theme === 'dark' ? '#94A3B8' : '#64748B',
    marginBottom: 2,
    textAlign: 'center',
  },
  statCardValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme === 'dark' ? '#F1F5F9' : '#1E293B',
    textAlign: 'center',
  },
  durationValue: {
    color: '#059669',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme === 'dark' ? '#78350F' : '#FFFBEB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#D97706' : '#FDE68A',
  },
  warningText: {
    fontSize: 13,
    color: theme === 'dark' ? '#FCD34D' : '#92400E',
    flex: 1,
    lineHeight: 18,
  },
});