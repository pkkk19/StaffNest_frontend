import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import { Plus, Edit3, Target, ExternalLink, Trash2, Map } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { CompanyData, CompanyLocation } from './types';

interface CompanyLocationsSectionProps {
  companyData: CompanyData;
  mapRegion: any;
  locationPermission: boolean;
  onAddLocation: () => void;
  onEditLocation: (location: CompanyLocation) => void;
  onDeleteLocation: (index: number) => void;
  onFocusLocation: (location: CompanyLocation) => void;
}

function LocationCard({ 
  location, 
  index, 
  onEdit, 
  onDelete, 
  onFocus, 
  onOpenInMaps 
}: {
  location: CompanyLocation;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onFocus: () => void;
  onOpenInMaps: () => void;
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View key={location._id || index} style={styles.locationCard}>
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
        <View style={[styles.statusIndicator, { backgroundColor: location.is_active ? '#059669' : '#DC2626' }]}>
          <Text style={styles.statusText}>
            {location.is_active ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.locationActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Edit3 size={16} color="#2563EB" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onFocus}>
          <Target size={16} color="#059669" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onOpenInMaps}>
          <ExternalLink size={16} color="#7C3AED" />
          <Text style={styles.actionButtonText}>Open</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Trash2 size={16} color="#DC2626" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CompanyLocationsSection({
  companyData,
  mapRegion,
  locationPermission,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onFocusLocation
}: CompanyLocationsSectionProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const mapRef = useRef<MapView>(null);

  const openInGoogleMaps = (location: CompanyLocation) => {
    const url = Platform.select({
      ios: `maps://?q=${location.latitude},${location.longitude}`,
      android: `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}(${encodeURIComponent(location.name)})`,
    });
    
    if (url) {
      Linking.openURL(url).catch(err => {
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
        Linking.openURL(webUrl);
      });
    }
  };

  const renderMap = () => {
    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        showsUserLocation={locationPermission}
        showsMyLocationButton={false}
        loadingEnabled={true}
      >
        {companyData.locations.map((location, index) => (
          <React.Fragment key={location._id || index}>
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
      </MapView>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Company Locations</Text>
        <TouchableOpacity style={styles.addLocationButton} onPress={onAddLocation}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addLocationText}>Add Location</Text>
        </TouchableOpacity>
      </View>

      {companyData.locations.length > 0 && (
        <View style={styles.mapContainer}>
          {renderMap()}
        </View>
      )}

      <View style={styles.locationsList}>
        {companyData.locations.map((location, index) => (
          <LocationCard
            key={location._id || index}
            location={location}
            index={index}
            onEdit={() => onEditLocation(location)}
            onDelete={() => onDeleteLocation(index)}
            onFocus={() => onFocusLocation(location)}
            onOpenInMaps={() => openInGoogleMaps(location)}
          />
        ))}

        {companyData.locations.length === 0 && (
          <View style={styles.emptyState}>
            <Map size={48} color={theme === 'dark' ? '#4B5563' : '#D1D5DB'} />
            <Text style={styles.emptyTitle}>No locations added</Text>
            <Text style={styles.emptyText}>
              Add your first company location to enable GPS-based attendance tracking
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: string) => StyleSheet.create({
  section: {
    marginBottom: 32,
    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 20,
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
  addLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  addLocationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationsList: {
    gap: 12,
  },
  locationCard: {
    backgroundColor: theme === 'dark' ? '#374151' : '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
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
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
    marginBottom: 2,
    lineHeight: 20,
  },
  locationCoordinates: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#9CA3AF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  locationRadius: {
    fontSize: 12,
    color: theme === 'dark' ? '#9CA3AF' : '#9CA3AF',
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
    borderRadius: 6,
    backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});