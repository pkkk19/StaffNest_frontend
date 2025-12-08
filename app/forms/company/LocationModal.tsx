import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Navigation, Search, MapPin } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { CompanyLocation, LocationModalState, MapState } from './types';

interface LocationModalProps {
  modalState: LocationModalState;
  mapState: MapState;
  onClose: () => void;
  onSave: () => void;
  onUseCurrentLocation: () => void;
  onMapPress: (e: any) => void;
  onNameChange: (name: string) => void;
  onAddressChange: (address: string) => void;
  onRadiusChange: (radius: number) => void;
  onRegionChange: (region: any) => void;
}

interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
}

export default function LocationModal({
  modalState,
  mapState,
  onClose,
  onSave,
  onUseCurrentLocation,
  onMapPress,
  onNameChange,
  onAddressChange,
  onRadiusChange,
  onRegionChange
}: LocationModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      await searchLocation(searchQuery);
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const searchLocation = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      
      if (response.ok) {
        const results: SearchResult[] = await response.json();
        setSearchResults(results);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    
    // Update the selected coordinate
    onAddressChange(result.display_name);
    
    // Zoom to the selected location
    onRegionChange({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    
    // Set the coordinate
    if (modalState.coordinate) {
      modalState.coordinate.latitude = latitude;
      modalState.coordinate.longitude = longitude;
    }
    
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const renderSearchResultItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSearchResultSelect(item)}
    >
      <MapPin size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      <Text style={styles.searchResultText} numberOfLines={2}>
        {item.display_name}
      </Text>
    </TouchableOpacity>
  );

  const renderMap = () => {
    return (
      <MapView
        style={styles.modalMap}
        provider={PROVIDER_GOOGLE}
        region={mapState.region}
        onPress={onMapPress}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation={mapState.permission}
        showsMyLocationButton={false}
        loadingEnabled={true}
      >
        {modalState.coordinate && (
          <>
            <Marker
              coordinate={modalState.coordinate}
              title={modalState.name || 'New Location'}
              description="Selected location"
              pinColor="#2563EB"
            />
            <Circle
              center={modalState.coordinate}
              radius={modalState.radius}
              strokeColor="#2563EB"
              fillColor="rgba(37, 99, 235, 0.2)"
              strokeWidth={2}
            />
          </>
        )}
      </MapView>
    );
  };

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.modalCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>
          {modalState.editingLocation ? 'Edit Location' : 'Add Location'}
        </Text>
        <TouchableOpacity onPress={onSave}>
          <Text style={styles.modalSave}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location Name</Text>
            <TextInput
              style={styles.input}
              value={modalState.name}
              onChangeText={onNameChange}
              placeholder="e.g., Main Office, Warehouse"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Search Location Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Search Location</Text>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search for an address or place..."
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="search"
                />
                {isSearching && (
                  <ActivityIndicator size="small" color="#2563EB" />
                )}
              </View>
              
              {showSearchResults && searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  <FlatList
                    data={searchResults}
                    renderItem={renderSearchResultItem}
                    keyExtractor={(item) => item.place_id}
                    style={styles.searchResultsList}
                    nestedScrollEnabled={true}
                  />
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={modalState.address}
              onChangeText={onAddressChange}
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
                value={modalState.radius.toString()}
                onChangeText={(text) => {
                  const newRadius = parseInt(text) || 100;
                  onRadiusChange(Math.min(Math.max(newRadius, 10), 5000));
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
            onPress={onUseCurrentLocation}
          >
            <Navigation size={20} color="#FFFFFF" />
            <Text style={styles.currentLocationText}>Use Current Location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapSectionModal}>
          <Text style={styles.mapTitle}>Selected Location</Text>
          <Text style={styles.mapSubtitle}>
            {modalState.coordinate 
              ? 'Location selected on map. You can also drag to adjust.'
              : 'Search for a location or tap on the map to select'
            }
          </Text>
          
          <View style={styles.modalMapContainer}>
            {renderMap()}
          </View>

          {modalState.coordinate && (
            <View style={styles.coordinateInfo}>
              <Text style={styles.coordinateText}>
                📍 {modalState.coordinate.latitude.toFixed(6)}, {modalState.coordinate.longitude.toFixed(6)}
              </Text>
              <Text style={styles.radiusInfo}>
                🎯 Coverage area: {modalState.radius}m radius ({(Math.PI * modalState.radius * modalState.radius / 10000).toFixed(2)} hectares)
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#1F2937',
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
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: theme === 'dark' ? '#374151' : '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    color: theme === 'dark' ? '#F9FAFB' : '#1F2937',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  // Search Styles
  searchContainer: {
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme === 'dark' ? '#374151' : '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: theme === 'dark' ? '#F9FAFB' : '#1F2937',
    paddingHorizontal: 12,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
    maxHeight: 200,
  },
  searchResultsList: {
    borderRadius: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme === 'dark' ? '#4B5563' : '#F3F4F6',
    gap: 12,
  },
  searchResultText: {
    flex: 1,
    fontSize: 14,
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
    lineHeight: 18,
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radiusInput: {
    flex: 1,
    height: 50,
    backgroundColor: theme === 'dark' ? '#374151' : '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    color: theme === 'dark' ? '#F9FAFB' : '#1F2937',
  },
  radiusUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  radiusHelp: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#9CA3AF',
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
    color: theme === 'dark' ? '#F9FAFB' : '#1F2937',
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
    marginBottom: 16,
  },
  modalMapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
  },
  modalMap: {
    flex: 1,
  },
  coordinateInfo: {
    backgroundColor: theme === 'dark' ? '#1E3A8A' : '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  coordinateText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme === 'dark' ? '#E0F2FE' : '#1E40AF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  radiusInfo: {
    fontSize: 12,
    color: theme === 'dark' ? '#BAE6FD' : '#3730A3',
  },
});