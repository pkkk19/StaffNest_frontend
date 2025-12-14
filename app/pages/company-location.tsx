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
  Platform,
  Linking
} from 'react-native';
import * as Location from 'expo-location';
import { MapPin, Plus, Trash2, Edit3, Navigation, Target, Building, ExternalLink } from 'lucide-react-native';
import Constants from 'expo-constants';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Region } from 'react-native-maps';

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
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    checkLocationPermission();
    loadMockLocations();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
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
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCurrentLocation(location);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } else {
        setLocationPermission(false);
      }
    } catch (error) {
      console.log('Error getting location:', error);
      setLocationPermission(false);
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

  const useCurrentLocation = async () => {
    if (!locationPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to use your current location.');
        return;
      }
      setLocationPermission(true);
    }

    if (currentLocation) {
      setSelectedCoordinate({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
      
      // Reverse geocode to get address
      try {
        const result = await Location.reverseGeocodeAsync({ 
          latitude: currentLocation.coords.latitude, 
          longitude: currentLocation.coords.longitude 
        });
        
        if (result[0]) {
          const addressParts = [
            result[0].street,
            result[0].city,
            result[0].region,
            result[0].country
          ].filter(Boolean);
          
          setLocationAddress(addressParts.join(', '));
        }
      } catch (error) {
        console.log('Error reverse geocoding:', error);
      }
    } else {
      await getCurrentLocation();
    }
  };

  const handleMapPress = async (e: any) => {
    const coordinate = e.nativeEvent ? e.nativeEvent.coordinate : null;
    if (coordinate) {
      setSelectedCoordinate(coordinate);
      
      // Reverse geocode to get address
      try {
        const result = await Location.reverseGeocodeAsync({ 
          latitude: coordinate.latitude, 
          longitude: coordinate.longitude 
        });
        
        if (result[0]) {
          const addressParts = [
            result[0].street,
            result[0].city,
            result[0].region,
            result[0].country
          ].filter(Boolean);
          
          setLocationAddress(addressParts.join(', '));
        }
      } catch (error) {
        console.log('Error reverse geocoding:', error);
      }
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
    }
  };

  const openInGoogleMaps = (location: CompanyLocation) => {
    const url = Platform.select({
      ios: `maps://?q=${location.latitude},${location.longitude}`,
      android: `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}(${encodeURIComponent(location.name)})`,
    });
    
    if (url) {
      Linking.openURL(url).catch(err => {
        // Fallback to web Google Maps
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
        Linking.openURL(webUrl);
      });
    }
  };

  // Render map with Google Maps provider
  const renderMap = (isModal = false) => {
    return (
      <MapView
        ref={isModal ? null : mapRef}
        style={isModal ? styles.modalMap : styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={locationPermission}
        showsMyLocationButton={false}
        loadingEnabled={true}
        loadingIndicatorColor="#666666"
        loadingBackgroundColor="#eeeeee"
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
              pinColor="#059669"
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
              description="Selected location"
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
          {!locationPermission && (
            <View style={styles.permissionWarning}>
              <Text style={styles.permissionText}>
                Location permission required to show your current location
              </Text>
            </View>
          )}
        </View>

        <View style={styles.locationsSection}>
          <Text style={styles.sectionTitle}>Saved Locations</Text>
          {locations.map((location) => (
            <View key={location.id} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                  <Text style={styles.locationCoordinates}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
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
                  onPress={() => openInGoogleMaps(location)}
                >
                  <ExternalLink size={16} color="#7C3AED" />
                  <Text style={styles.actionButtonText}>Open</Text>
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
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={locationAddress}
                  onChangeText={setLocationAddress}
                  placeholder="Address will be auto-filled when you select on map"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
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
                      setRadius(Math.min(Math.max(newRadius, 10), 5000)); // Limit between 10 and 5000 meters
                    }}
                    placeholder="100"
                    placeholderTextColor="#9CA3AF"
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
  modalMap: {
    flex: 1,
    minHeight: 300,
  },
  permissionWarning: {
    backgroundColor: '#FEF3F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F04438',
  },
  permissionText: {
    fontSize: 12,
    color: '#B42318',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    marginBottom: 2,
    lineHeight: 20,
  },
  locationCoordinates: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  locationRadius: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
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
    color: '#1F2937',
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
  coordinateInfo: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  coordinateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  radiusInfo: {
    fontSize: 12,
    color: '#3730A3',
  },
});