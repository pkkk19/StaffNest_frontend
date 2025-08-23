import { View, Text, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { Clock, MapPin, Navigation } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ForceTouchable from '@/components/ForceTouchable';

export default function TimeTracking() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles(theme);

  // Use useCallback to prevent unnecessary re-renders
  const checkLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      setLocationPermission(hasPermission);
      
      if (hasPermission) {
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  }, []);

  useEffect(() => {
    checkLocationPermission();
    
    // Simple timer without heavy operations
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute instead of every second

    return () => clearInterval(interval);
  }, [checkLocationPermission]);

  const getCurrentLocation = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        // timeout is not a valid option in Expo Location - removed
      });
      
      const { latitude, longitude } = currentLocation.coords;
      
      // Get address (optional)
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
        console.log('Address lookup failed, using coordinates');
        address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
      
      setLocation({
        latitude,
        longitude,
        address,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      // Set a basic location object if GPS fails but we have permission
      if (locationPermission) {
        setLocation({
          latitude: 0,
          longitude: 0,
          address: 'Location unavailable - try again'
        });
      }
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
        // Use a simple console log instead of Alert to prevent potential reloads
        console.log('Location permission denied');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockToggle = async () => {
    if (isClockedIn) {
      // Simple state change without heavy operations
      setIsClockedIn(false);
      console.log('Clocked out at:', new Date().toISOString());
    } else {
      if (!locationPermission) {
        await requestLocationPermission();
        if (!locationPermission) return;
      }
      
      await getCurrentLocation();
      setIsClockedIn(true);
      console.log('Clocked in at:', new Date().toISOString());
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('timeTracking') || 'Time Tracking'}</Text>
        <Text style={styles.date}>{formatDate(currentTime)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.timeDisplay}>
          <Clock size={48} color={isClockedIn ? '#10B981' : '#6B7280'} />
          <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
          <Text style={styles.status}>
            {isClockedIn ? (t('clockedIn') || 'Clocked In') : (t('clockedOut') || 'Clocked Out')}
          </Text>
        </View>

        <ForceTouchable
          style={[styles.clockButton, isClockedIn ? styles.clockOutButton : styles.clockInButton]}
          onPress={handleClockToggle}
          disabled={isLoading}
        >
          <Text style={styles.clockButtonText}>
            {isLoading ? '...' : 
             isClockedIn ? (t('clockOut') || 'Clock Out') : (t('clockIn') || 'Clock In')}
          </Text>
        </ForceTouchable>

        <View style={styles.locationCard}>
          <MapPin size={20} color="#6B7280" />
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>{t('currentLocation') || 'Current Location'}</Text>
            <Text style={styles.locationText}>
              {isLoading ? 'Getting location...' : location?.address || 'Location not available'}
            </Text>
            {location && location.latitude !== 0 && (
              <Text style={styles.locationCoords}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            )}
          </View>
          <View style={[styles.statusDot, { 
            backgroundColor: locationPermission ? '#10B981' : '#EF4444' 
          }]} />
        </View>

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

        {isClockedIn && (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionText}>
              {t('clockedInAt') || 'Clocked in at'} {formatTime(new Date())}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    header: {
      padding: 20,
      paddingTop: 60,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
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
    content: {
      flex: 1,
      padding: 20,
    },
    timeDisplay: {
      alignItems: 'center',
      marginBottom: 32,
      padding: 32,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      ...Platform.select({
        android: {
          elevation: 2,
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
    clockButton: {
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 24,
      ...Platform.select({
        android: {
          elevation: 2,
        },
      }),
    },
    clockInButton: {
      backgroundColor: '#10B981',
    },
    clockOutButton: {
      backgroundColor: '#EF4444',
    },
    clockButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    locationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      ...Platform.select({
        android: {
          elevation: 1,
        },
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
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      marginBottom: 24,
      gap: 8,
    },
    disabledButton: {
      opacity: 0.6,
    },
    locationButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    sessionInfo: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      ...Platform.select({
        android: {
          elevation: 1,
        },
      }),
    },
    sessionText: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      fontWeight: '500',
    },
  });
}