// app/(tabs)/time.tsx - Updated with automatic refresh after location validation
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  Platform, 
  Linking, 
  ScrollView, 
  RefreshControl,
  AppState,
  AppStateStatus 
} from 'react-native';
import { 
  Clock, 
  MapPin, 
  Navigation, 
  Building, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  AlertCircle,
  User
} from 'lucide-react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import ForceTouchable from '@/components/ForceTouchable';
import { companiesAPI, shiftsAPI } from '@/services/api';
import { Shift } from '@/app/types/rota.types';

interface CompanyLocation {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  distance?: number;
  locationName?: string;
}

// Define types for interval
type IntervalID = ReturnType<typeof setInterval>;

// Helper function to extract user ID from shift (handles both string and object)
const getShiftUserId = (shift: Shift | null): string | undefined => {
  if (!shift || !shift.user_id) return undefined;
  
  // If user_id is a string, return it
  if (typeof shift.user_id === 'string') {
    return shift.user_id;
  }
  
  // If user_id is an object with _id, return the _id
  if (shift.user_id && typeof shift.user_id === 'object' && '_id' in shift.user_id) {
    return (shift.user_id as any)._id;
  }
  
  return undefined;
};

// Helper function to get user name from shift
const getShiftUserName = (shift: Shift | null): string => {
  if (!shift || !shift.user_id) return 'Unassigned';
  
  // If user_id is an object with first_name and last_name
  if (shift.user_id && typeof shift.user_id === 'object') {
    const userObj = shift.user_id as any;
    if (userObj.first_name && userObj.last_name) {
      return `${userObj.first_name} ${userObj.last_name}`;
    }
    if (userObj.email) {
      return userObj.email;
    }
  }
  
  return 'Assigned';
};

export default function TimeTracking() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [companyLocations, setCompanyLocations] = useState<CompanyLocation[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationValidation, setLocationValidation] = useState<{
    isValid: boolean;
    message: string;
    locationName?: string;
    distance?: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  
  const refreshIntervalRef = useRef<IntervalID | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const lastFetchRef = useRef<number>(0);
  const locationSubscriptionRef = useRef<any>(null);
  const lastLocationValidationRef = useRef<string>(''); // Store last validation state

  const styles = createStyles(theme);

  // Auto-refresh configuration
  const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
  const MIN_FETCH_INTERVAL = 10000; // 10 seconds minimum between fetches

  // Update current time every minute
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  // Format date for API calls (YYYY-MM-DD)
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get today's date range
  const getTodayDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { today, tomorrow };
  };

  // Parse date from MongoDB format or ISO string
  const parseShiftDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    
    // If it's an object with $date (MongoDB format)
    if (typeof dateValue === 'object' && '$date' in dateValue) {
      const timestamp = dateValue.$date.$numberLong || dateValue.$date;
      return new Date(parseInt(timestamp));
    }
    
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // If it's an ISO string
    return new Date(dateValue);
  };

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
      return; // Skip if too soon since last fetch
    }
    
    lastFetchRef.current = now;
    
    try {
      await Promise.all([
        fetchCurrentShift(),
        fetchCompanyInfo()
      ]);
    } catch (error) {
      console.error('Error fetching all data:', error);
    }
  }, []);

  // Fetch current shift
  const fetchCurrentShift = async () => {
    if (!user?._id || !user?.company_id) {
      console.log('❌ No user or company ID');
      return;
    }
    
    try {
      const { today, tomorrow } = getTodayDateRange();
      const todayStr = formatDateForAPI(today);
      const tomorrowStr = formatDateForAPI(tomorrow);
      
      console.log('🔄 Fetching shifts for:', today.toDateString());
      console.log('📅 Date range:', { todayStr, tomorrowStr });
      
      let shiftsResponse;
      
      if (user?.role === 'admin') {
        // Admin: Get all company shifts
        shiftsResponse = await shiftsAPI.getShifts({
          start_date: todayStr,
          end_date: tomorrowStr
        });
        console.log(`👑 Admin fetched ${shiftsResponse.data.length} company shifts`);
      } else {
        // Staff: Get only their shifts
        shiftsResponse = await shiftsAPI.getMyShifts({
          start_date: todayStr,
          end_date: tomorrowStr
        });
        console.log(`👤 Staff fetched ${shiftsResponse.data.length} shifts`);
      }
      
      // Store all shifts for debug
      setAllShifts(shiftsResponse.data);
      
      // Filter for TODAY'S shifts
      const todayShifts = shiftsResponse.data.filter((shift: Shift) => {
        const shiftDate = parseShiftDate(shift.start_time);
        const isToday = shiftDate.toDateString() === today.toDateString();
        return isToday;
      });
      
      console.log('📅 Today\'s shifts:', todayShifts.length);
      
      if (todayShifts.length > 0) {
        // Sort by start time
        todayShifts.sort((a: Shift, b: Shift) => 
          parseShiftDate(a.start_time).getTime() - parseShiftDate(b.start_time).getTime()
        );
        
        // Find appropriate shift based on user role
        let selectedShift = todayShifts[0];
        const now = new Date();
        
        if (user?.role === 'admin') {
          // Admin: Show the next upcoming shift (any employee)
          for (const shift of todayShifts) {
            const shiftEnd = parseShiftDate(shift.end_time);
            if (shiftEnd > now) {
              selectedShift = shift;
              break;
            }
          }
        } else {
          // Staff: Find THEIR next shift
          const myShifts = todayShifts.filter((shift: Shift) => {
            const shiftUserId = getShiftUserId(shift);
            return shiftUserId === user?._id;
          });
          
          if (myShifts.length > 0) {
            selectedShift = myShifts[0];
            for (const shift of myShifts) {
              const shiftEnd = parseShiftDate(shift.end_time);
              if (shiftEnd > now) {
                selectedShift = shift;
                break;
              }
            }
          } else {
            // Staff has no shifts assigned today
            console.log('👤 Staff has no assigned shifts today');
            setCurrentShift(null);
            setIsClockedIn(false);
            return;
          }
        }
        
        const selectedShiftUserId = getShiftUserId(selectedShift);
        const isAssignedToMe = selectedShiftUserId === user?._id;
        
        console.log('🎯 Selected shift:', {
          title: selectedShift.title,
          status: selectedShift.status,
          start: parseShiftDate(selectedShift.start_time).toLocaleTimeString(),
          end: parseShiftDate(selectedShift.end_time).toLocaleTimeString(),
          isAssignedToMe: isAssignedToMe
        });
        
        setCurrentShift(selectedShift);
        setIsClockedIn(selectedShift.status === 'in-progress' || selectedShift.status === 'late');
      } else {
        console.log('📭 No shifts for today');
        setCurrentShift(null);
        setIsClockedIn(false);
      }
    } catch (error: any) {
      console.error('❌ Error fetching shifts:', error.message);
      if (error.response) {
        console.error('📊 Response status:', error.response.status);
        console.error('📊 Response data:', error.response.data);
      }
    }
  };

  // Fetch company info and locations
  const fetchCompanyInfo = async () => {
    console.log('🏢 ========== START fetchCompanyInfo ==========');
    console.log('👤 User company_id:', user?.company_id);
    
    try {
      if (!user?.company_id) {
        console.log('❌ No company_id found for user');
        setCompanyLocations([]);
        setLocationsLoaded(true);
        return;
      }
      
      let companyResponse;
      let methodUsed = '';
      
      // Try multiple approaches to get company data
      try {
        console.log('🔄 Attempt 1: Calling getMyCompany()...');
        companyResponse = await companiesAPI.getMyCompany();
        methodUsed = 'getMyCompany';
        console.log('✅ getMyCompany() succeeded');
      } catch (error1: any) {
        console.log('❌ getMyCompany() failed:', error1.message);
        
        try {
          console.log('🔄 Attempt 2: Calling getCompany() with user.company_id...');
          companyResponse = await companiesAPI.getCompany(user.company_id);
          methodUsed = 'getCompany';
          console.log('✅ getCompany() succeeded');
        } catch (error2: any) {
          console.log('❌ getCompany() failed:', error2.message);
          
          try {
            console.log('🔄 Attempt 3: Calling getCompanies() and filtering...');
            const allCompanies = await companiesAPI.getCompanies();
            console.log('📋 Total companies found:', allCompanies.data?.length || 0);
            
            if (allCompanies.data && Array.isArray(allCompanies.data)) {
              const userCompany = allCompanies.data.find(
                (company: any) => company._id === user.company_id
              );
              
              if (userCompany) {
                companyResponse = { data: userCompany };
                methodUsed = 'getCompanies-filter';
                console.log('✅ Found company in companies list');
              } else {
                console.log('❌ Company not found in companies list');
              }
            }
          } catch (error3: any) {
            console.log('❌ All methods failed:', error3.message);
          }
        }
      }
      
      if (companyResponse && companyResponse.data) {
        console.log(`🎉 Company data received via ${methodUsed}:`, companyResponse.data.name);
        
        setCompanyDetails(companyResponse.data);
        
        // Extract locations from company response
        if (companyResponse.data.locations && Array.isArray(companyResponse.data.locations)) {
          console.log(`📍 Found ${companyResponse.data.locations.length} locations in company data`);
          
          // Log each location for debugging
          companyResponse.data.locations.forEach((loc: any, index: number) => {
            console.log(`📍 Location ${index + 1}:`, {
              name: loc.name,
              latitude: loc.latitude,
              longitude: loc.longitude,
              radius: loc.radius,
              is_active: loc.is_active,
              hasCoords: !!(loc.latitude && loc.longitude)
            });
          });
          
          // Filter active locations
          const activeLocations = companyResponse.data.locations.filter(
            (loc: CompanyLocation) => loc.is_active !== false
          );
          
          console.log(`📍 Active locations: ${activeLocations.length}`);
          setCompanyLocations(activeLocations);
        } else {
          console.log('⚠️ No locations array found in company data');
          console.log('🔍 Available fields:', Object.keys(companyResponse.data));
          setCompanyLocations([]);
        }
      } else {
        console.log('❌ No company data received at all');
        setCompanyLocations([]);
      }
      
      setLocationsLoaded(true);
      console.log('🏢 ========== END fetchCompanyInfo ==========');
    } catch (error: any) {
      console.error('❌ Unexpected error in fetchCompanyInfo:', error.message);
      setCompanyLocations([]);
      setLocationsLoaded(true);
    }
  };

  // Initialize location
  const initLocation = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      setLocationPermission(hasPermission);
      
      if (hasPermission) {
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Error initializing location:', error);
    }
  }, []);

  // Calculate distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Validate work location with detailed debugging
  const validateWorkLocation = (latitude: number, longitude: number) => {
    console.log('📍 ========== START validateWorkLocation ==========');
    console.log('📍 User location:', { latitude, longitude });
    console.log('📍 Company locations count:', companyLocations.length);
    console.log('📍 Company locations:', companyLocations);
    
    if (companyLocations.length === 0) {
      console.log('❌ No company locations to validate against');
      console.log('📍 ========== END validateWorkLocation ==========');
      return {
        isValid: false,
        message: 'No work locations configured'
      };
    }

    // Debug: Test distance calculation with your specific coordinates
    const testDistance = calculateDistance(
      27.408190, 85.023646, // Your current location from screenshot
      27.4082, 85.0237      // Main office location from screenshot
    );
    console.log('🧪 Test distance calculation:', {
      yourLocation: '27.408190, 85.023646',
      officeLocation: '27.4082, 85.0237',
      distance: `${testDistance.toFixed(2)}m`,
      shouldBeWithin: '100m radius'
    });

    for (const workLocation of companyLocations) {
      console.log(`📍 Checking location: ${workLocation.name}`, {
        is_active: workLocation.is_active,
        radius: workLocation.radius
      });
      
      if (workLocation.is_active === false) {
        console.log(`📍 Skipping ${workLocation.name} - not active`);
        continue;
      }
      
      const distance = calculateDistance(
        latitude,
        longitude,
        workLocation.latitude,
        workLocation.longitude
      );
      
      console.log(`📍 Distance to ${workLocation.name}: ${distance.toFixed(2)}m`);
      console.log(`📍 Allowed radius: ${workLocation.radius}m`);
      console.log(`📍 Within range? ${distance <= workLocation.radius}`);
      
      if (distance <= workLocation.radius) {
        console.log(`✅ VALID: Within range of ${workLocation.name}`);
        console.log('📍 ========== END validateWorkLocation ==========');
        return {
          isValid: true,
          message: `At ${workLocation.name} (${Math.round(distance)}m)`,
          locationName: workLocation.name,
          distance: Math.round(distance)
        };
      }
      
      console.log(`❌ NOT within range of ${workLocation.name}`);
    }
    
    // Find the closest location for debugging
    let closestLocation = '';
    let minDistance = Infinity;
    
    companyLocations.forEach(loc => {
      if (loc.is_active !== false) {
        const distance = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          closestLocation = loc.name;
        }
      }
    });
    
    console.log(`📍 Closest location: ${closestLocation} (${Math.round(minDistance)}m away)`);
    console.log('📍 ========== END validateWorkLocation ==========');
    
    return {
      isValid: false,
      message: `Not at any work location. Closest: ${closestLocation} (${Math.round(minDistance)}m)`
    };
  };

  const getCurrentLocation = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      console.log('📍 Getting current location...');
      
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      
      const { latitude, longitude } = currentLocation.coords;
      console.log('📍 Got current location:', { latitude, longitude });
      
      // Get address
      let address = 'Location acquired';
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        if (addressResponse[0]) {
          address = `${addressResponse[0].street || ''} ${addressResponse[0].city || ''}`.trim();
          if (addressResponse[0].name) {
            address = addressResponse[0].name;
          }
        }
      } catch (addressError) {
        console.log('Address lookup failed');
        address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
      
      // Validate work location
      let validation;
      
      if (!locationsLoaded) {
        console.log('⚠️ Locations not loaded yet, skipping validation');
        validation = {
          isValid: false,
          message: 'Locations loading...'
        };
      } else if (companyLocations.length === 0) {
        console.log('⚠️ No company locations configured');
        validation = {
          isValid: false,
          message: 'No work locations configured'
        };
      } else {
        console.log('📍 Validating location against company locations...');
        validation = validateWorkLocation(latitude, longitude);
      }
      
      console.log('📍 Validation result:', validation);
      setLocationValidation(validation);
      
      setLocation({
        latitude,
        longitude,
        address,
        distance: validation.distance,
        locationName: validation.locationName
      });
      
      return { latitude, longitude };
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationValidation({
        isValid: false,
        message: 'Failed to get location'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAllData();
      await getCurrentLocation();
      console.log('🔄 Manual refresh complete');
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAllData]);

  // Effect to refresh data when location validation changes
  useEffect(() => {
    if (locationValidation) {
      const currentValidationState = `${locationValidation.isValid}-${locationValidation.message}`;
      
      // Check if validation state has changed
      if (currentValidationState !== lastLocationValidationRef.current) {
        console.log('🔄 Location validation changed, refreshing data...');
        console.log('📋 Previous:', lastLocationValidationRef.current);
        console.log('📋 Current:', currentValidationState);
        
        // Update the ref
        lastLocationValidationRef.current = currentValidationState;
        
        // Refresh data if validation changed (but not if it's just loading message)
        if (!locationValidation.message.includes('loading') && 
            !locationValidation.message.includes('Locations loading')) {
          
          // Small delay to ensure UI updates first
          setTimeout(() => {
            fetchCurrentShift();
          }, 1000);
        }
      }
    }
  }, [locationValidation]);

  // Effect to refresh when company locations are loaded
  useEffect(() => {
    if (locationsLoaded && companyLocations.length > 0) {
      console.log('📍 Company locations loaded, refreshing location validation...');
      
      // If we already have a location, re-validate it
      if (location) {
        console.log('📍 Re-validating existing location...');
        const validation = validateWorkLocation(location.latitude, location.longitude);
        setLocationValidation(validation);
      }
    }
  }, [locationsLoaded, companyLocations.length]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App came to foreground, refreshing...');
        fetchAllData();
        setAutoRefreshCount(prev => prev + 1);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [fetchAllData]);

  // Setup auto-refresh interval
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      console.log('⏰ Auto-refresh triggered');
      fetchAllData();
      setAutoRefreshCount(prev => prev + 1);
    }, AUTO_REFRESH_INTERVAL);

    // Initial fetch
    fetchAllData();
    initLocation();

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchAllData, initLocation]);

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
          'Location Permission Required',
          'Please enable location services to clock in/out',
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
      console.error('Error requesting location permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockToggle = async () => {
    if (!currentShift) {
      Alert.alert('No Shift', 'You do not have a scheduled shift today');
      return;
    }

    // Check if shift is assigned to current user
    const shiftUserId = getShiftUserId(currentShift);
    if (shiftUserId !== user?._id) {
      Alert.alert('Not Your Shift', 'This shift is not assigned to you');
      return;
    }

    if (isClockedIn) {
      // Clock out
      if (!locationPermission) {
        await requestLocationPermission();
        if (!locationPermission) return;
      }

      const locationData = await getCurrentLocation();
      if (!locationData) return;

      if (!locationValidation?.isValid) {
        Alert.alert(
          'Cannot Clock Out',
          'You must be at a work location to clock out',
          [
            { text: 'Try Again', onPress: () => handleClockToggle() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      try {
        await shiftsAPI.clockOut(currentShift._id, {
          latitude: locationData.latitude,
          longitude: locationData.longitude
        });
        
        setIsClockedIn(false);
        // Refresh immediately after clocking out
        await Promise.all([
          fetchCurrentShift(),
          getCurrentLocation() // Re-validate location
        ]);
        
        Alert.alert(
          'Clocked Out Successfully',
          `You have clocked out at ${formatTime(new Date())}`,
          [{ text: 'OK' }]
        );
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to clock out');
      }
    } else {
      // Clock in
      if (!locationPermission) {
        await requestLocationPermission();
        if (!locationPermission) return;
      }

      const locationData = await getCurrentLocation();
      if (!locationData) return;

      if (!locationValidation?.isValid) {
        Alert.alert(
          'Cannot Clock In',
          'You must be at a work location to clock in',
          [
            { text: 'Try Again', onPress: () => handleClockToggle() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Check if shift hasn't started yet
      const shiftStartTime = parseShiftDate(currentShift.start_time);
      const now = new Date();
      const minutesBeforeStart = 15; // Allow clock in 15 minutes before shift

      if (now < new Date(shiftStartTime.getTime() - minutesBeforeStart * 60000)) {
        Alert.alert(
          'Shift Not Started',
          `You can clock in starting ${minutesBeforeStart} minutes before your shift`,
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        await shiftsAPI.clockIn(currentShift._id, {
          latitude: locationData.latitude,
          longitude: locationData.longitude
        });
        
        setIsClockedIn(true);
        // Refresh immediately after clocking in
        await Promise.all([
          fetchCurrentShift(),
          getCurrentLocation() // Re-validate location
        ]);
        
        Alert.alert(
          'Clocked In Successfully',
          `You have clocked in at ${formatTime(new Date())}`,
          [{ text: 'OK' }]
        );
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to clock in');
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'scheduled': '#3B82F6',
      'in-progress': '#10B981',
      'late': '#F59E0B',
      'completed': '#6B7280',
      'completed-early': '#8B5CF6',
      'completed-overtime': '#EC4899',
      'cancelled': '#EF4444'
    };
    return colorMap[status] || '#6B7280';
  };

  const getShiftDuration = () => {
    if (!currentShift) return 0;
    const start = parseShiftDate(currentShift.start_time);
    const end = parseShiftDate(currentShift.end_time);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const isShiftAssignedToMe = () => {
    if (!currentShift || !user) return false;
    const shiftUserId = getShiftUserId(currentShift);
    return shiftUserId === user._id;
  };

  // Add function to manually trigger refresh with location check
  const refreshWithLocationCheck = async () => {
    console.log('🔄 Refresh with location check...');
    setRefreshing(true);
    try {
      // First get fresh data
      await fetchAllData();
      
      // Then update location
      await getCurrentLocation();
      
      console.log('✅ Refresh with location check complete');
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Add debug function to test location
  const testLocationManually = async () => {
    console.log('🧪 ========== MANUAL LOCATION TEST ==========');
    console.log('📍 Current companyLocations:', companyLocations);
    console.log('📍 Locations loaded?', locationsLoaded);
    
    await getCurrentLocation();
    
    console.log('🧪 ========== END MANUAL TEST ==========');
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshWithLocationCheck}
          tintColor={theme === 'dark' ? '#3B82F6' : '#2563EB'}
          colors={['#3B82F6']}
          progressBackgroundColor={theme === 'dark' ? '#1F2937' : '#FFFFFF'}
        />
      }
    >
      {/* Auto-refresh indicator */}
      {autoRefreshCount > 0 && (
        <View style={styles.autoRefreshIndicator}>
          <RotateCcw size={12} color="#6B7280" />
          <Text style={styles.autoRefreshText}>
            Auto-refreshed {autoRefreshCount} time{autoRefreshCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{t('timeTracking') || 'Time Tracking'}</Text>
          <Text style={styles.date}>{formatDate(currentTime)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Current Time Display */}
        <View style={styles.timeDisplay}>
          <Clock size={48} color={isClockedIn ? '#10B981' : '#6B7280'} />
          <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
          <Text style={styles.status}>
            {isClockedIn ? (t('clockedIn') || 'Clocked In') : (t('clockedOut') || 'Clocked Out')}
          </Text>
        </View>

        {/* Today's Shift Info */}
        {currentShift ? (
          <View style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <Text style={styles.shiftTitle}>{currentShift.title}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(currentShift.status) }
              ]}>
                <Text style={styles.statusBadgeText}>
                  {currentShift.status.replace('-', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.shiftDetails}>
              <View style={styles.shiftDetailRow}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.shiftDetailText}>
                  {formatTime(parseShiftDate(currentShift.start_time))} - {formatTime(parseShiftDate(currentShift.end_time))}
                </Text>
              </View>
              
              <View style={styles.shiftDetailRow}>
                <Building size={16} color="#6B7280" />
                <Text style={styles.shiftDetailText}>
                  {currentShift.location || 'No location specified'}
                </Text>
              </View>
              
              <View style={styles.shiftDetailRow}>
                <Text style={styles.shiftDetailText}>
                  Duration: {getShiftDuration().toFixed(1)} hours
                </Text>
              </View>
              
              {user?.role === 'admin' && (
                <View style={styles.shiftDetailRow}>
                  <User size={16} color="#6B7280" />
                  <Text style={styles.shiftDetailText}>
                    Assigned to: {getShiftUserName(currentShift)}
                  </Text>
                </View>
              )}
            </View>
            
            {currentShift.clock_in_time && (
              <View style={styles.clockInfo}>
                <Text style={styles.clockInfoText}>
                  Clocked in: {formatTime(parseShiftDate(currentShift.clock_in_time))}
                </Text>
                {currentShift.late_minutes && currentShift.late_minutes > 0 && (
                  <Text style={styles.lateText}>
                    Late by {currentShift.late_minutes} minutes
                  </Text>
                )}
              </View>
            )}
            
            {/* Clock In/Out button */}
            {isShiftAssignedToMe() && (
              <ForceTouchable
                style={[
                  styles.shiftActionButton,
                  isClockedIn ? styles.clockOutAction : styles.clockInAction
                ]}
                onPress={handleClockToggle}
                disabled={isLoading}
              >
                <Clock size={16} color="#FFFFFF" />
                <Text style={styles.shiftActionText}>
                  {isLoading ? '...' : 
                   isClockedIn ? (t('clockOut') || 'Clock Out') : (t('clockIn') || 'Clock In')}
                </Text>
              </ForceTouchable>
            )}
            
            {/* Not assigned to you warning */}
            {!isShiftAssignedToMe() && user?.role === 'staff' && (
              <View style={styles.notYourShiftWarning}>
                <AlertCircle size={16} color="#F59E0B" />
                <Text style={styles.notYourShiftText}>
                  This shift is not assigned to you
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noShiftCard}>
            <Calendar size={32} color="#6B7280" />
            <Text style={styles.noShiftText}>No shift scheduled for today</Text>
            <Text style={styles.noShiftSubtext}>
              {user?.role === 'admin' 
                ? 'No shifts scheduled for today' 
                : 'You have no shifts assigned today'}
            </Text>
          </View>
        )}

        {/* Location Information */}
        <View style={styles.locationCard}>
          <MapPin size={20} color="#6B7280" />
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>
              {t('currentLocation') || 'Current Location'}
            </Text>
            <Text style={styles.locationText}>
              {isLoading ? 'Getting location...' : location?.address || 'Location not available'}
            </Text>
            {location && (
              <Text style={styles.locationCoords}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            )}
          </View>
          <View style={[styles.statusDot, { 
            backgroundColor: locationValidation?.isValid ? '#10B981' : '#EF4444' 
          }]} />
        </View>

        {/* Location Validation Status */}
        {locationValidation && (
          <View style={[
            styles.validationCard,
            { 
              backgroundColor: locationValidation.isValid ? 
                (theme === 'dark' ? '#064E3B' : '#D1FAE5') : 
                (theme === 'dark' ? '#7F1D1D' : '#FEE2E2')
            }
          ]}>
            {locationValidation.isValid ? (
              <CheckCircle size={20} color="#10B981" />
            ) : (
              <XCircle size={20} color="#EF4444" />
            )}
            <Text style={[
              styles.validationText,
              { color: locationValidation.isValid ? '#10B981' : '#EF4444' }
            ]}>
              {companyLocations.length === 0 
                ? 'No work locations configured' 
                : locationValidation.message}
            </Text>
            
          </View>
        )}

        {/* Work Locations Info */}
        {companyLocations.length > 0 && (
          <View style={styles.locationsCard}>
            <View style={styles.locationsHeader}>
              <Building size={20} color="#6B7280" />
              <Text style={styles.locationsTitle}>
                {companyDetails?.name ? `${companyDetails.name} Work Locations` : 'Work Locations'}
              </Text>
            </View>
            {companyLocations.filter(loc => loc.is_active).map((loc, index) => (
              <View key={index} style={styles.locationItem}>
                <View style={styles.locationItemHeader}>
                  <Text style={styles.locationName}>{loc.name}</Text>
                  <View style={[
                    styles.locationStatusDot,
                    { backgroundColor: loc.is_active ? '#10B981' : '#EF4444' }
                  ]} />
                </View>
                <Text style={styles.locationCoords}>
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </Text>
                <Text style={styles.locationRadius}>
                  Radius: {loc.radius}m
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Location Permission Button */}
        {!locationPermission && (
          <ForceTouchable
            style={[styles.locationButton, isLoading && styles.disabledButton]}
            onPress={requestLocationPermission}
            disabled={isLoading}
          >
            <Navigation size={20} color="#FFFFFF" />
            <Text style={styles.locationButtonText}>
              {isLoading ? 'Requesting...' : (t('enableLocation') || 'Enable Location')}
            </Text>
          </ForceTouchable>
        )}
      </View>
    </ScrollView>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    autoRefreshIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
      gap: 6,
    },
    autoRefreshText: {
      fontSize: 11,
      color: '#6B7280',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 20,
      paddingTop: 60,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    date: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    refreshButton: {
      padding: 8,
      marginLeft: 8,
    },
    content: {
      padding: 20,
    },
    timeDisplay: {
      alignItems: 'center',
      marginBottom: 20,
      padding: 32,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      ...Platform.select({
        android: { elevation: 2 },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }),
    },
    currentTime: {
      fontSize: 36,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginTop: 16,
    },
    status: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 8,
    },
    shiftCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      ...Platform.select({
        android: { elevation: 1 },
      }),
    },
    shiftHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    shiftTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    shiftDetails: {
      gap: 8,
      marginBottom: 12,
    },
    shiftDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    shiftDetailText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    clockInfo: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
      marginBottom: 12,
    },
    clockInfoText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    lateText: {
      fontSize: 14,
      color: '#F59E0B',
      fontWeight: '500',
      marginTop: 4,
    },
    shiftActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    clockInAction: {
      backgroundColor: '#10B981',
    },
    clockOutAction: {
      backgroundColor: '#EF4444',
    },
    shiftActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    noShiftCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
    },
    noShiftText: {
      marginTop: 12,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      fontWeight: '500',
    },
    noShiftSubtext: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
      textAlign: 'center',
    },
    locationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      ...Platform.select({
        android: { elevation: 1 },
      }),
    },
    locationInfo: {
      flex: 1,
      marginLeft: 12,
    },
    locationTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    locationText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    locationCoords: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    validationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      gap: 8,
    },
    validationText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
    },
    refreshIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 8,
    },
    refreshIndicatorText: {
      fontSize: 10,
      color: '#6B7280',
      fontStyle: 'italic',
    },
    locationsCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    locationsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    locationsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    locationItem: {
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    locationItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    locationName: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    locationStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    locationRadius: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 2,
    },
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      marginBottom: 16,
      gap: 8,
    },
    disabledButton: {
      opacity: 0.5,
    },
    locationButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    notYourShiftWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? '#7C2D12' : '#FEF3C7',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
    },
    notYourShiftText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F59E0B' : '#92400E',
    },
  });
}