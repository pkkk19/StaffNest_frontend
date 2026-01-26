import React, { useState, useEffect, useCallback } from 'react';
import { Router } from 'expo-router';
import { View, ScrollView, Modal, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { companiesAPI } from '@/services/api';
import { useFocusEffect } from 'expo-router';

// Import components
import CompanyHeader from './company/CompanyHeader';
import CompanyLogoSection from './company/CompanyLogoSection';
import CompanyInfoSection from './company/CompanyInfoSection';
import CompanyLocationsSection from './company/CompanyLocationSection';

// Import types
import { CompanyData, LocationModalState, MapState, CompanyLocation } from './company/types';

export default function CompanyInfo() {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  // Main state
  const [companyData, setCompanyData] = useState<CompanyData>({
    _id: '',
    name: '',
    address: '',
    phone_number: '',
    email: '',
    website: '',
    currency: 'GBP', // Add default currency
    country: 'UK',   // Add default country
    locations: [],
    subscription: {   // Add subscription with defaults
      plan: 'basic',
      status: 'active',
      expiry_date: '',
      max_users: 1,
      current_users: 1
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  
  const handleRegionChange = (region: any) => {
    setMapState(prev => ({ ...prev, region }));
  };
  
  // Location modal state
  const [modalState, setModalState] = useState<LocationModalState>({
    visible: false,
    editingLocation: null,
    name: '',
    address: '',
    coordinate: null,
    radius: 100
  });

  // Map state
  const [mapState, setMapState] = useState<MapState>({
    region: {
      latitude: 51.5074,
      longitude: -0.1278,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
    currentLocation: null,
    permission: false
  });

  // Refresh data when screen comes into focus
useFocusEffect(
  useCallback(() => {
    fetchCompanyData();
    checkLocationPermission();
  }, [])
);

// Keep location permission check on mount
useEffect(() => {
  checkLocationPermission();
}, []);

  const fetchCompanyData = async () => {
    try {
      const response = await companiesAPI.getMyCompany();
      setCompanyData(response.data);
      if (response.data.logo_url) {
        setLogo(response.data.logo_url);
      }
    } catch (error: any) {
      console.error('Error fetching company data:', error);
      if (error.response?.status === 404) {
        Alert.alert('No Company', 'You need to create a company first', [
          { text: 'OK', onPress: () => router.push('/forms/company-setup') }
        ]);
      }
    }
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setMapState(prev => ({ ...prev, permission: status === 'granted' }));
      
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
        setMapState(prev => ({ ...prev, permission: true }));
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setMapState(prev => ({
          ...prev,
          currentLocation: location,
          region: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }
        }));
      } else {
        setMapState(prev => ({ ...prev, permission: false }));
      }
    } catch (error) {
      console.log('Error getting location:', error);
      setMapState(prev => ({ ...prev, permission: false }));
    }
  };

  // Logo management
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
      await uploadLogo(result.assets[0].uri);
    }
  };

  const uploadLogo = async (imageUri: string) => {
    try {
      const formData = new FormData();
      const file = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'company-logo.jpg',
      } as any;
      
      formData.append('file', file);
      await companiesAPI.uploadLogo(formData);
      await fetchCompanyData();
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      Alert.alert('Error', 'Failed to upload logo');
    }
  };

  const removeLogo = async () => {
    try {
      await companiesAPI.removeLogo();
      setLogo(null);
      await fetchCompanyData();
    } catch (error: any) {
      console.error('Error removing logo:', error);
      Alert.alert('Error', 'Failed to remove logo');
    }
  };

  // Company info management
  const handleFieldChange = (field: string, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await companiesAPI.updateCompany({
        name: companyData.name,
        address: companyData.address,
        phone_number: companyData.phone_number,
        email: companyData.email,
        website: companyData.website,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Company information updated successfully');
    } catch (error: any) {
      console.error('Error updating company:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update company');
    } finally {
      setLoading(false);
    }
  };

  // Location management
  const openAddLocationModal = () => {
    router.push({
      pathname:'/forms/company/location-setup',
      params: {companyId: companyData._id}
    });
  };

  const openEditLocationModal = (location: CompanyLocation, index: number) => {
    router.push({
      pathname:'/forms/company/location-setup',
      params: {
        editingLocation: JSON.stringify(location),
        locationIndex: index.toString(),
        companyId: companyData._id
      }
    });
  };

  const closeLocationModal = () => {
    setModalState(prev => ({ ...prev, visible: false }));
  };

  // Add this handler function
  const handleCoordinateChange = (coordinate: {latitude: number, longitude: number}) => {
    setModalState(prev => ({ ...prev, coordinate }));
  };

  const saveLocation = async () => {
    if (!modalState.name.trim() || !modalState.coordinate) {
      Alert.alert('Error', 'Please provide a name and select a location on the map');
      return;
    }

    try {
      const locationData = {
        name: modalState.name.trim(),
        address: modalState.address.trim() || 'Address not available',
        latitude: modalState.coordinate.latitude,
        longitude: modalState.coordinate.longitude,
        radius: modalState.radius,
        is_active: true,
      };

      if (modalState.editingLocation && modalState.editingLocation._id) {
        const locationIndex = companyData.locations.findIndex(
          loc => loc._id === modalState.editingLocation!._id
        );
        if (locationIndex !== -1) {
          await companiesAPI.updateLocation(locationIndex, locationData);
          Alert.alert('Success', 'Location updated successfully');
        }
      } else {
        await companiesAPI.addLocation(locationData);
        Alert.alert('Success', 'Location added successfully');
      }

      closeLocationModal();
      await fetchCompanyData();
    } catch (error: any) {
      console.error('Error saving location:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save location');
    }
  };

  const deleteLocation = async (locationIndex: number) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await companiesAPI.deleteLocation(locationIndex);
              Alert.alert('Success', 'Location deleted successfully');
              await fetchCompanyData();
            } catch (error: any) {
              console.error('Error deleting location:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete location');
            }
          }
        }
      ]
    );
  };

  const focusOnLocation = (location: CompanyLocation) => {
    setMapState(prev => ({
      ...prev,
      region: {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    }));
  };

  const useCurrentLocation = async () => {
    if (!mapState.permission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to use your current location.');
        return;
      }
      setMapState(prev => ({ ...prev, permission: true }));
    }

    if (mapState.currentLocation) {
      const newCoordinate = {
        latitude: mapState.currentLocation.coords.latitude,
        longitude: mapState.currentLocation.coords.longitude,
      };
      
      // Update modal state coordinate
      setModalState(prev => ({
        ...prev,
        coordinate: newCoordinate
      }));
      
      // Update map region to current location
      setMapState(prev => ({
        ...prev,
        region: {
          latitude: newCoordinate.latitude,
          longitude: newCoordinate.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      }));
      
      // Reverse geocode to get address
      try {
        const result = await Location.reverseGeocodeAsync({ 
          latitude: newCoordinate.latitude, 
          longitude: newCoordinate.longitude 
        });
        
        if (result[0]) {
          const addressParts = [
            result[0].street,
            result[0].city,
            result[0].region,
            result[0].country
          ].filter(Boolean);
          
          setModalState(prev => ({ ...prev, address: addressParts.join(', ') }));
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
      // Update modal state coordinate
      setModalState(prev => ({ ...prev, coordinate }));
      
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
          
          setModalState(prev => ({ ...prev, address: addressParts.join(', ') }));
        }
      } catch (error) {
        console.log('Error reverse geocoding:', error);
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#111827' : '#F9FAFB' }}>
      <CompanyHeader
        title="Company Information"
        isEditing={isEditing}
        loading={loading}
        onBack={() => router.back()}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
      />

      <ScrollView style={{ flex: 1, padding: 20 }}>
        <CompanyLogoSection
          logo={logo}
          companyName={companyData.name}
          isEditing={isEditing}
          onPickImage={pickImage}
          onRemoveLogo={removeLogo}
        />

        <CompanyInfoSection
          companyData={companyData}
          isEditing={isEditing}
          onFieldChange={handleFieldChange}
        />

        <CompanyLocationsSection
          companyData={companyData}
          mapRegion={mapState.region}
          locationPermission={mapState.permission}
          onAddLocation={openAddLocationModal}
          onEditLocation={(location, index) => openEditLocationModal(location, index)}
          onDeleteLocation={deleteLocation}
          onFocusLocation={focusOnLocation}
        />
      </ScrollView>
    </View>
  );
}