import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  SafeAreaView,
  Dimensions,
  Keyboard,
  Animated,
  FlatList,
  ActivityIndicator,
  PanResponder,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import debounce from 'lodash/debounce';
import { Search, Navigation, MapPin, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { companiesAPI } from '@/services/api';
import { CompanyLocation } from '../company/types';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0;

interface LocationSetupData {
  name: string;
  address: string;
  radius: number;
  coordinate: { latitude: number; longitude: number } | null;
  is_active: boolean;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function LocationSetupPage() {
  const { theme } = useTheme();
  const keyboardSource = useRef<'search' | 'form' | null>(null);
  const params = useLocalSearchParams<{ 
    editingLocation?: string;
    companyId?: string;
    locationIndex?: string;
  }>();
  
  const editingLocation = params.editingLocation 
    ? JSON.parse(params.editingLocation) as CompanyLocation 
    : null;
  
  const locationIndex = params.locationIndex ? parseInt(params.locationIndex) : -1;

  // State for location data
  const [locationData, setLocationData] = useState<LocationSetupData>({
    name: editingLocation?.name || '',
    address: editingLocation?.address || '',
    radius: editingLocation?.radius || 100,
    coordinate: editingLocation 
      ? { latitude: editingLocation.latitude, longitude: editingLocation.longitude }
      : null,
    is_active: editingLocation?.is_active || true,
  });

  // Map state
  const [mapState, setMapState] = useState({
    region: {
      latitude: editingLocation?.latitude || 51.5074,
      longitude: editingLocation?.longitude || -0.1278,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
    currentLocation: null as Location.LocationObject | null,
    permission: false,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  // Animation values
  const bottomSheetTranslateY = useRef(new Animated.Value(height * 0.4)).current; // Start partially visible
  const bottomSheetOpacity = useRef(new Animated.Value(1)).current; // Always visible
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const searchBarScale = useRef(new Animated.Value(1)).current;
  const searchBarMarginTop = useRef(new Animated.Value(0)).current;
  
  // State
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Snap points - bottom sheet never goes below bottom of screen
  const SNAP_POINTS = {
    EXPANDED: 0, // Fully expanded at bottom
    FORM_FOCUS: Platform.OS === 'android' ? height * 0.40 : 0, // When form input is focused
    COLLAPSED: height * 0.4, // 40% visible (collapsed state)
  };
  
  // Current snap position
  const currentSnap = useRef(SNAP_POINTS.COLLAPSED);

  const mapRef = useRef<MapView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const bottomSheetScrollRef = useRef<ScrollView>(null);
  const GOOGLE_API_KEY = 'AIzaSyAAklfZoBe3kXwI4Vc4PRcrmAIYAi7wp3M';

  // Track if we're dragging
  const isDragging = useRef(false);

  // PanResponder for bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture vertical movements
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        bottomSheetTranslateY.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const newTranslateY = Math.max(
          SNAP_POINTS.EXPANDED,
          Math.min(SNAP_POINTS.COLLAPSED, currentSnap.current + gestureState.dy)
        );
        bottomSheetTranslateY.setValue(newTranslateY);
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        const velocity = gestureState.vy;
        const currentY = (bottomSheetTranslateY as any)._value || SNAP_POINTS.COLLAPSED;
        
        // Determine target snap point based on velocity and position
        let targetSnap: number;
        
        if (velocity > 0.8) {
          // Fast swipe down - collapse
          targetSnap = SNAP_POINTS.COLLAPSED;
        } else if (velocity < -0.8) {
          // Fast swipe up - expand
          targetSnap = SNAP_POINTS.EXPANDED;
        } else {
          // Determine based on current position
          const threshold = height * 0.2; // 20% from top
          if (currentY > threshold) {
            // More than 20% down, collapse
            targetSnap = SNAP_POINTS.COLLAPSED;
          } else {
            // Less than 20% down, expand
            targetSnap = SNAP_POINTS.EXPANDED;
          }
        }
        
        currentSnap.current = targetSnap;
        Animated.spring(bottomSheetTranslateY, {
          toValue: targetSnap,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
          velocity: velocity,
        }).start();
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        // Snap to current position
        const currentY = (bottomSheetTranslateY as any)._value || SNAP_POINTS.COLLAPSED;
        currentSnap.current = currentY;
      },
    })
  ).current;

  // Keyboard handling
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, (e) => {
        const kbHeight = e.endCoordinates?.height || 300;
        setKeyboardHeight(kbHeight);
        setIsKeyboardVisible(true);

        if (keyboardSource.current === 'search') {
            // 🔽 Search → hide bottom sheet
            Animated.parallel([
            Animated.timing(bottomSheetTranslateY, {
                toValue: height,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(bottomSheetOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            ]).start();
        }
        });


const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
  setIsKeyboardVisible(false);
  setKeyboardHeight(0);

  Animated.parallel([
    Animated.spring(bottomSheetTranslateY, {
      toValue: currentSnap.current,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }),
    Animated.timing(bottomSheetOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }),
  ]).start();
});


    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [isSearchFocused]);

  // Initialize component
  useEffect(() => {
    checkLocationPermission();
    if (editingLocation?.address) {
      setSearchQuery(editingLocation.address);
    }
    
    // Start with bottom sheet partially visible
    bottomSheetTranslateY.setValue(SNAP_POINTS.COLLAPSED);
    currentSnap.current = SNAP_POINTS.COLLAPSED;
  }, []);

  const expandBottomSheet = () => {
    currentSnap.current = SNAP_POINTS.EXPANDED;
    Animated.spring(bottomSheetTranslateY, {
      toValue: SNAP_POINTS.EXPANDED,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  };

  const collapseBottomSheet = () => {
    currentSnap.current = SNAP_POINTS.COLLAPSED;
    Animated.spring(bottomSheetTranslateY, {
      toValue: SNAP_POINTS.COLLAPSED,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  };

  const toggleBottomSheet = () => {
    if (currentSnap.current === SNAP_POINTS.EXPANDED) {
      collapseBottomSheet();
    } else {
      expandBottomSheet();
    }
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setMapState(prev => ({ ...prev, permission: status === 'granted' }));
      
      if (status === 'granted' && !editingLocation) {
        getCurrentLocation();
      }
    } catch (error) {
      console.log('Error checking location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setIsSearching(true);
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const newCoordinate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setMapState(prev => ({
          ...prev,
          currentLocation: location,
          region: {
            latitude: newCoordinate.latitude,
            longitude: newCoordinate.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
        }));

        setLocationData(prev => ({
          ...prev,
          coordinate: newCoordinate,
        }));

        await reverseGeocode(newCoordinate.latitude, newCoordinate.longitude);
        mapRef.current?.animateToRegion({
          ...newCoordinate,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error) {
      console.log('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location');
    } finally {
      setIsSearching(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ 
        latitude, 
        longitude 
      });
      
      if (result[0]) {
        const addressParts = [
          result[0].street,
          result[0].city,
          result[0].region,
          result[0].country
        ].filter(Boolean);
        
        const newAddress = addressParts.join(', ');
        setLocationData(prev => ({ 
          ...prev, 
          address: newAddress 
        }));
        setSearchQuery(newAddress);
      }
    } catch (error) {
      console.log('Error reverse geocoding:', error);
    }
  };

  // Google Places search with debounce
  const searchPlaces = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || !GOOGLE_API_KEY) {
        setPredictions([]);
        return;
      }

      setIsSearching(true);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_API_KEY}&language=en&components=country:uk`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && Array.isArray(data.predictions)) {
          setPredictions(data.predictions);
          setShowPredictions(true);
        } else {
          setPredictions([]);
        }
      } catch (error) {
        console.log('Search error:', error);
        setPredictions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [GOOGLE_API_KEY]
  );

  const getPlaceDetails = async (placeId: string) => {
    try {
      setIsSearching(true);
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(detailsUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result?.geometry?.location) {
        const location = data.result.geometry.location;
        const newCoordinate = {
          latitude: location.lat,
          longitude: location.lng,
        };
        
        const newAddress = data.result.formatted_address || '';
        
        setLocationData(prev => ({
          ...prev,
          coordinate: newCoordinate,
          address: newAddress,
        }));
        
        setSearchQuery(newAddress);
        setShowPredictions(false);
        Keyboard.dismiss();

        const newRegion = {
          ...newCoordinate,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setMapState(prev => ({ ...prev, region: newRegion }));
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.log('Error getting place details:', error);
      Alert.alert('Error', 'Could not fetch location details');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapPress = async (e: any) => {
    if (isKeyboardVisible) {
      Keyboard.dismiss();
      setShowPredictions(false);
      return;
    }
    
    const coordinate = e.nativeEvent.coordinate;
    if (coordinate) {
      setLocationData(prev => ({ ...prev, coordinate }));
      await reverseGeocode(coordinate.latitude, coordinate.longitude);
    }
  };

  const handleSave = async () => {
    if (!locationData.name.trim() || !locationData.coordinate) {
      Alert.alert('Error', 'Please provide a location name and select a location on the map');
      return;
    }

    try {
      const locationDataToSave = {
        name: locationData.name.trim(),
        address: locationData.address.trim() || 'Address not available',
        latitude: locationData.coordinate.latitude,
        longitude: locationData.coordinate.longitude,
        radius: locationData.radius,
        is_active: locationData.is_active,
      };

      if (editingLocation?._id && locationIndex !== -1) {
        await companiesAPI.updateLocation(locationIndex, locationDataToSave);
        Alert.alert('Success', 'Location updated successfully');
      } else {
        await companiesAPI.addLocation(locationDataToSave);
        Alert.alert('Success', 'Location added successfully');
      }

      router.back();
    } catch (error: any) {
      console.error('Error saving location:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save location');
    }
  };

  const renderPredictionItem = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => getPlaceDetails(item.place_id)}
    >
      <MapPin size={16} color="#6B7280" />
      <View style={styles.predictionTextContainer}>
        <Text style={styles.predictionMainText} numberOfLines={1}>
          {item.structured_formatting.main_text}
        </Text>
        <Text style={styles.predictionSecondaryText} numberOfLines={1}>
          {item.structured_formatting.secondary_text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="rgba(255, 255, 255, 0.95)" />
      
      {/* Full Screen Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        region={mapState.region}
        onPress={handleMapPress}
        showsUserLocation={mapState.permission}
        showsMyLocationButton={false}
        zoomEnabled={!isKeyboardVisible}
        scrollEnabled={!isKeyboardVisible}
        rotateEnabled={!isKeyboardVisible}
        pitchEnabled={!isKeyboardVisible}
      >
        {locationData.coordinate && (
          <>
            <Marker 
              coordinate={locationData.coordinate} 
              title={locationData.name || "Selected Location"}
            />
            <Circle
              center={locationData.coordinate}
              radius={locationData.radius}
              strokeWidth={2}
              strokeColor="#2563EB"
              fillColor="rgba(37, 99, 235, 0.2)"
            />
          </>
        )}
      </MapView>

      {/* Header Container - Fixed at top with Android margin */}
      <Animated.View 
        style={[
          styles.headerContainer,
          {
            transform: [
              { scale: searchBarScale },
              { translateY: searchBarMarginTop },
            ],
            opacity: headerOpacity,
          }
        ]}
      >
        <SafeAreaView style={styles.safeAreaHeader}>
          {/* Main Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={styles.title}>
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </Text>
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar with Predictions */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Search size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search for location..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.length > 2) {
                    searchPlaces(text);
                  } else {
                    setPredictions([]);
                    setShowPredictions(false);
                  }
                }}
                onFocus={() => {
                    keyboardSource.current = 'search';
                    setIsSearchFocused(true);
                    setShowPredictions(true);
                }}
                onBlur={() => {
                    setIsSearchFocused(false);
                    keyboardSource.current = null;
                }}
                returnKeyType="search"
              />
              {isSearching ? (
                <ActivityIndicator size="small" color="#2563EB" style={styles.searchLoader} />
              ) : searchQuery ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setPredictions([]);
                    setShowPredictions(false);
                  }}
                  style={styles.clearButton}
                >
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Location Predictions Dropdown */}
            {showPredictions && predictions.length > 0 && (
              <View style={styles.predictionsContainer}>
                <FlatList
                  data={predictions}
                  renderItem={renderPredictionItem}
                  keyExtractor={(item) => item.place_id}
                  keyboardShouldPersistTaps="handled"
                  style={styles.predictionsList}
                  ItemSeparatorComponent={() => <View style={styles.predictionSeparator} />}
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Bottom Sheet - Always visible, follows finger */}
      <Animated.View 
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: bottomSheetTranslateY }],
            opacity: bottomSheetOpacity,
          }
        ]}
      >
        {/* Invisible drag area that covers the entire top portion */}
        <View 
          style={styles.dragArea}
          {...panResponder.panHandlers}
        >
          {/* Simple handle bar */}
          <View style={styles.handleBar} />
        </View>

        {/* Form Content */}
        <ScrollView 
          ref={bottomSheetScrollRef}
          style={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Location Details</Text>
            
            {/* Location Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location Name *</Text>
              <TextInput
                style={styles.input}
                value={locationData.name}
                placeholder="e.g., Main Office, Warehouse"
                placeholderTextColor="#9CA3AF"
                onChangeText={(text) => 
                    setLocationData(prev => ({ ...prev, name: text }))
                }
                onFocus={() => {
                    keyboardSource.current = 'form';
                    currentSnap.current = SNAP_POINTS.FORM_FOCUS;

                    Animated.spring(bottomSheetTranslateY, {
                        toValue: SNAP_POINTS.FORM_FOCUS,
                        useNativeDriver: true,
                        tension: 60,
                        friction: 12,
                    }).start();
                }}
                onBlur={() => {
                    keyboardSource.current = null;
                }}
              />
            </View>

            {/* Address Display */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {locationData.address || 'Select a location on the map'}
              </Text>
            </View>

            {/* Coordinates */}
            <View style={styles.coordinatesRow}>
              <View style={styles.coordinateItem}>
                <Text style={styles.label}>Latitude</Text>
                <Text style={styles.coordinateValue}>
                  {locationData.coordinate ? locationData.coordinate.latitude.toFixed(6) : '--'}
                </Text>
              </View>
              <View style={styles.coordinateItem}>
                <Text style={styles.label}>Longitude</Text>
                <Text style={styles.coordinateValue}>
                  {locationData.coordinate ? locationData.coordinate.longitude.toFixed(6) : '--'}
                </Text>
              </View>
            </View>

            {/* Radius Control */}
            <View style={styles.inputGroup}>
              <View style={styles.radiusHeader}>
                <Text style={styles.label}>Geofence Radius</Text>
                <Text style={styles.radiusValue}>{locationData.radius}m</Text>
              </View>
              
              {/* Quick Radius Buttons */}
              <View style={styles.radiusButtons}>
                {[50, 100, 200, 500, 1000].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    style={[
                      styles.radiusButton,
                      locationData.radius === radius && styles.radiusButtonActive
                    ]}
                    onPress={() => setLocationData(prev => ({ ...prev, radius }))}
                  >
                    <Text style={[
                      styles.radiusButtonText,
                      locationData.radius === radius && styles.radiusButtonTextActive
                    ]}>
                      {radius}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Current Location Button */}
            <TouchableOpacity 
              style={styles.currentLocationButton}
              onPress={getCurrentLocation}
              disabled={isSearching}
            >
              <Navigation size={20} color="#FFFFFF" />
              <Text style={styles.currentLocationText}>
                {isSearching ? 'Getting location...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  safeAreaHeader: {
    width: '100%',
    marginTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    flex: 1,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  searchLoader: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  predictionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  predictionsList: {
    maxHeight: 200,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  predictionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  predictionMainText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  predictionSecondaryText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  predictionSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 44,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.7, // 70% of screen height
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  dragArea: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  formContent: {
    flex: 1,
  },
  detailsCard: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressText: {
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 52,
  },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  coordinateItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  coordinateValue: {
    fontSize: 16,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  radiusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  radiusButton: {
    flex: 1,
    minWidth: 60,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: '#2563EB',
  },
  radiusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  radiusButtonTextActive: {
    color: '#FFFFFF',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});