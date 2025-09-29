import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import * as Location from 'expo-location';
import { MapPin, Plus, Trash2, Edit3, Navigation, Target, Building } from 'lucide-react-native';
import Constants from 'expo-constants';

// Platform-specific imports with proper error handling
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;

// Only try to import react-native-maps for native platforms
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.MapView;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
  } catch (error) {
    console.log('react-native-maps not available:', error);
  }
}

interface CompanyLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  createdAt: string;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export default function CompanyLocations() {
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CompanyLocation | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [selectedCoordinate, setSelectedCoordinate] = useState<LatLng | null>(null);
  const [radius, setRadius] = useState(100);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const mapRef = useRef<any>(null);

  useEffect(() => {
    getCurrentLocation();
    loadMockLocations();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const loadMockLocations = () => {
    const mockLocations: CompanyLocation[] = [
      {
        id: '1',
        name: 'Main Office',
        address: '123 Business Street, London, UK',
        latitude: 51.5074,
        longitude: -0.1278,
        radius: 150,
        isActive: true,
        createdAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'Warehouse',
        address: '456 Industrial Road, London, UK',
        latitude: 51.5155,
        longitude: -0.0922,
        radius: 200,
        isActive: true,
        createdAt: '2024-01-15',
      },
    ];
    setLocations(mockLocations);
  };

  const openAddLocationModal = () => {
    setEditingLocation(null);
    setLocationName('');
    setLocationAddress('');
    setSelectedCoordinate(null);
    setRadius(100);
    setModalVisible(true);
  };

  const openEditLocationModal = (location: CompanyLocation) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setLocationAddress(location.address);
    setSelectedCoordinate({ latitude: location.latitude, longitude: location.longitude });
    setRadius(location.radius);
    setModalVisible(true);
  };

  const saveLocation = () => {
    if (!locationName.trim() || !selectedCoordinate) {
      Alert.alert('Error', 'Please provide a name and select a location on the map');
      return;
    }

    const locationData: CompanyLocation = {
      id: editingLocation?.id || Date.now().toString(),
      name: locationName.trim(),
      address: locationAddress.trim() || 'Address not available',
      latitude: selectedCoordinate.latitude,
      longitude: selectedCoordinate.longitude,
      radius,
      isActive: true,
      createdAt: editingLocation?.createdAt || new Date().toISOString(),
    };

    if (editingLocation) {
      setLocations(prev => prev.map(loc => loc.id === editingLocation.id ? locationData : loc));
      Alert.alert('Success', 'Location updated successfully');
    } else {
      setLocations(prev => [...prev, locationData]);
      Alert.alert('Success', 'Location added successfully');
    }

    setModalVisible(false);
  };

  const deleteLocation = (locationId: string) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setLocations(prev => prev.filter(loc => loc.id !== locationId));
            Alert.alert('Success', 'Location deleted successfully');
          }
        }
      ]
    );
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      setSelectedCoordinate({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      
      // Animate to current location (native only)
      if (mapRef.current && mapRef.current.animateToRegion) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
      
      // Reverse geocode to get address
      Location.reverseGeocodeAsync({ 
        latitude: currentLocation.coords.latitude, 
        longitude: currentLocation.coords.longitude 
      })
      .then(result => {
        if (result[0]) {
          const address = `${result[0].street || ''}, ${result[0].city || ''}, ${result[0].country || ''}`.replace(/^,\s*/, '');
          setLocationAddress(address);
        }
      })
      .catch(console.error);
    }
  };

  const handleMapPress = (e: any) => {
    const coordinate = e.nativeEvent ? e.nativeEvent.coordinate : null;
    if (coordinate) {
      setSelectedCoordinate(coordinate);
      
      // Reverse geocode to get address
      Location.reverseGeocodeAsync({ 
        latitude: coordinate.latitude, 
        longitude: coordinate.longitude 
      })
      .then(result => {
        if (result[0]) {
          const address = `${result[0].street || ''}, ${result[0].city || ''}, ${result[0].country || ''}`.replace(/^,\s*/, '');
          setLocationAddress(address);
        }
      })
      .catch(console.error);
    }
  };

  const focusOnLocation = (location: CompanyLocation) => {
    if (mapRef.current && mapRef.current.animateToRegion) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } else {
      // For web, just update the region
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  // Web fallback component
  const WebMapFallback = () => (
    <View style={styles.webMapFallback}>
      <MapPin size={48} color="#9CA3AF" />
      <Text style={styles.webMapText}>Map view not available on web</Text>
      <Text style={styles.webMapSubtext}>
        Use the native app to view and interact with maps
      </Text>
      {selectedCoordinate && (
        <View style={styles.coordinateInfo}>
          <Text style={styles.coordinateText}>
            📍 Selected: {selectedCoordinate.latitude.toFixed(6)}, {selectedCoordinate.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );

  // Render map based on platform
  const renderMap = (isModal = false) => {
    if (Platform.OS === 'web') {
      return <WebMapFallback />;
    }

    // Check if MapView is available (might not be if import failed)
    if (!MapView) {
      return (
        <View style={styles.webMapFallback}>
          <MapPin size={48} color="#9CA3AF" />
          <Text style={styles.webMapText}>Maps not available</Text>
          <Text style={styles.webMapSubtext}>
            react-native-maps could not be loaded
          </Text>
        </View>
      );
    }

    return (
      <MapView
        ref={isModal ? null : mapRef}
        style={isModal ? styles.modalMap : styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {locations.map(location => (
          <React.Fragment key={location.id}>
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={location.name}
              description={location.address}
            />
            <Circle
              center={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              radius={location.radius}
              strokeColor="#059669"
              fillColor="rgba(5, 150, 105, 0.2)"
              strokeWidth={2}
            />
          </React.Fragment>
        ))}
        
        {selectedCoordinate && (
          <React.Fragment>
            <Marker
              coordinate={selectedCoordinate}
              title={locationName || 'New Location'}
              pinColor="#2563EB"
            />
            <Circle
              center={selectedCoordinate}
              radius={radius}
              strokeColor="#2563EB"
              fillColor="rgba(37, 99, 235, 0.2)"
              strokeWidth={2}
            />
          </React.Fragment>
        )}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBarSpacer} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Building size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>Company Locations</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={openAddLocationModal}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Locations Overview</Text>
          <View style={styles.mapContainer}>
            {renderMap()}
          </View>
        </View>

        <View style={styles.locationsSection}>
          <Text style={styles.sectionTitle}>Saved Locations</Text>
          {locations.map((location) => (
            <View key={location.id} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                  <Text style={styles.locationRadius}>
                    Radius: {location.radius}m coverage area
                  </Text>
                </View>
                <View style={[styles.statusIndicator, { backgroundColor: location.isActive ? '#059669' : '#DC2626' }]}>
                  <Text style={styles.statusText}>
                    {location.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
              </View>

              <View style={styles.locationActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditLocationModal(location)}
                >
                  <Edit3 size={16} color="#2563EB" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => focusOnLocation(location)}
                >
                  <Target size={16} color="#059669" />
                  <Text style={styles.actionButtonText}>View</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => deleteLocation(location.id)}
                >
                  <Trash2 size={16} color="#DC2626" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {locations.length === 0 && (
            <View style={styles.emptyState}>
              <MapPin size={48} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>No locations added</Text>
              <Text style={styles.emptyText}>
                Add your first company location to enable GPS-based attendance tracking
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </Text>
            <TouchableOpacity onPress={saveLocation}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location Name</Text>
                <TextInput
                  style={styles.input}
                  value={locationName}
                  onChangeText={setLocationName}
                  placeholder="e.g., Main Office, Warehouse"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={locationAddress}
                  onChangeText={setLocationAddress}
                  placeholder="Address will be auto-filled when you select on map"
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Geofence Radius (meters)</Text>
                <View style={styles.radiusContainer}>
                  <TextInput
                    style={styles.radiusInput}
                    value={radius.toString()}
                    onChangeText={(text) => {
                      const newRadius = parseInt(text) || 100;
                      setRadius(newRadius);
                    }}
                    placeholder="100"
                    keyboardType="numeric"
                  />
                  <Text style={styles.radiusUnit}>meters</Text>
                </View>
                <Text style={styles.radiusHelp}>
                  Staff can only clock in/out within this radius from the location
                </Text>
              </View>

              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={useCurrentLocation}
              >
                <Navigation size={20} color="#FFFFFF" />
                <Text style={styles.currentLocationText}>Use Current Location</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mapSectionModal}>
              <Text style={styles.mapTitle}>Select Location on Map</Text>
              <Text style={styles.mapSubtitle}>Tap on the map to set the exact location</Text>
              
              <View style={styles.mapContainer}>
                {renderMap(true)}
              </View>

              {selectedCoordinate && (
                <View style={styles.coordinateInfo}>
                  <Text style={styles.coordinateText}>
                    📍 {selectedCoordinate.latitude.toFixed(6)}, {selectedCoordinate.longitude.toFixed(6)}
                  </Text>
                  <Text style={styles.radiusInfo}>
                    🎯 Coverage area: {radius}m radius ({(Math.PI * radius * radius / 10000).toFixed(2)} hectares)
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
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
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  mapSection: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webMapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  webMapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 4,
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  locationsSection: {
    margin: 16,
    marginTop: 8,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  locationRadius: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  modalContent: {
    flex: 1,
  },
  formSection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radiusInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radiusUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  radiusHelp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mapSectionModal: {
    flex: 1,
    padding: 24,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  modalMap: {
    flex: 1,
    minHeight: 300,
  },
  coordinateInfo: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  coordinateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  radiusInfo: {
    fontSize: 12,
    color: '#3730A3',
  },
});