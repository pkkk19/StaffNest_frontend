// app/components/modals/LocationModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { MapPin, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Location {
  _id: string;
  name: string;
  address: string;
}

interface LocationModalProps {
  locations: Location[];
  selectedLocationId?: string;
  onSelectLocation: (locationId: string) => void;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onClose,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Select Location</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={locations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.locationItem,
              selectedLocationId === item._id && styles.locationItemSelected
            ]}
            onPress={() => onSelectLocation(item._id)}
            activeOpacity={0.7}
          >
            <MapPin size={20} color={selectedLocationId === item._id ? '#3B82F6' : '#6B7280'} />
            <View style={styles.locationInfo}>
              <Text style={[
                styles.locationName,
                selectedLocationId === item._id && styles.locationNameSelected
              ]}>
                {item.name}
              </Text>
              <Text style={styles.locationAddress}>{item.address}</Text>
            </View>
            {selectedLocationId === item._id && (
              <Check size={20} color="#10B981" />
            )}
          </TouchableOpacity>
        )}
      />
      
      {locations.length === 0 && (
        <View style={styles.emptyModalState}>
          <MapPin size={48} color="#9CA3AF" />
          <Text style={styles.emptyModalText}>No locations found</Text>
          <Text style={styles.emptyModalSubtext}>
            Please add locations from the Locations page first
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: string) => {
  const isDark = theme === 'dark';
  const backgroundColor = isDark ? '#1F2937' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const inputBackground = isDark ? '#374151' : '#F3F4F6';

  return StyleSheet.create({
    modalContainer: {
      backgroundColor: backgroundColor,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
    },
    closeButton: {
      padding: 4,
    },
    closeButtonText: {
      fontSize: 20,
      color: secondaryTextColor,
    },
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    locationItemSelected: {
      backgroundColor: inputBackground,
    },
    locationInfo: {
      flex: 1,
    },
    locationName: {
      fontSize: 16,
      color: textColor,
      marginBottom: 2,
    },
    locationNameSelected: {
      color: '#3B82F6',
      fontWeight: '600',
    },
    locationAddress: {
      fontSize: 12,
      color: secondaryTextColor,
    },
    emptyModalState: {
      alignItems: 'center',
      padding: 32,
    },
    emptyModalText: {
      fontSize: 16,
      color: secondaryTextColor,
      marginTop: 12,
      fontWeight: '600',
    },
    emptyModalSubtext: {
      fontSize: 14,
      color: '#9CA3AF',
      marginTop: 4,
      textAlign: 'center',
    },
  });
};