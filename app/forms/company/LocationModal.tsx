import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Platform,
  Dimensions,
  Keyboard,
  Animated,
} from 'react-native';
import { Navigation } from 'lucide-react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  GooglePlacesAutocomplete,
  GooglePlaceData,
  GooglePlaceDetail,
} from 'react-native-google-places-autocomplete';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { LocationModalProps } from '../company/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  onRegionChange,
  onCoordinateChange,
}: LocationModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const searchRef = useRef<any>(null);

  const searchTranslateY = useRef(new Animated.Value(0)).current;
  const mapHeightAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.42)).current;

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  /* ================= KEYBOARD HANDLING ================= */
  useEffect(() => {
  if (modalState.editingLocation && modalState.address) {
    searchRef.current?.setAddressText(modalState.address);
  }
}, [modalState.editingLocation]);


  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardOpen(true);
      Animated.parallel([
        Animated.timing(searchTranslateY, {
          toValue: Platform.OS === 'ios' ? -90 : -70,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(mapHeightAnim, {
          toValue: SCREEN_HEIGHT * 0.28,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOpen(false);
      Animated.parallel([
        Animated.timing(searchTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(mapHeightAnim, {
          toValue: SCREEN_HEIGHT * 0.42,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /* ================= GOOGLE PLACE SELECT ================= */

  const handlePlaceSelect = (
    data: GooglePlaceData,
    details: GooglePlaceDetail | null
  ) => {
    if (!details?.geometry?.location) return;

    const coordinate = {
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
    };

    onCoordinateChange(coordinate);
    onAddressChange(data.description);
    onRegionChange({
      ...coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    searchRef.current?.setAddressText('');
    Keyboard.dismiss();
  };

  /* ================= MAP ================= */

  const renderMap = () => (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      region={mapState.region}
      onPress={keyboardOpen ? undefined : onMapPress}
      onRegionChangeComplete={onRegionChange}
      showsUserLocation={mapState.permission}
      scrollEnabled={!keyboardOpen}
      zoomEnabled={!keyboardOpen}
      rotateEnabled={!keyboardOpen}
      pitchEnabled={!keyboardOpen}
    >
      {modalState.coordinate && (
        <>
          <Marker coordinate={modalState.coordinate} />
          <Circle
            center={modalState.coordinate}
            radius={modalState.radius}
            strokeWidth={2}
            strokeColor="#2563EB"
            fillColor="rgba(37,99,235,0.2)"
          />
        </>
      )}
    </MapView>
  );

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {modalState.editingLocation ? 'Edit Location' : 'Add Location'}
        </Text>
        <TouchableOpacity onPress={onSave}>
          <Text style={styles.save}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* FORM */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={modalState.name}
          placeholder="Location name"
          onChangeText={onNameChange}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          value={modalState.address}
          placeholder="Address"
          onChangeText={onAddressChange}
          multiline
        />

        <View style={styles.radiusRow}>
          <TextInput
            style={styles.radiusInput}
            keyboardType="numeric"
            value={modalState.radius.toString()}
            onChangeText={(t) =>
              onRadiusChange(Math.max(10, Math.min(5000, +t || 100)))
            }
          />
          <Text style={styles.radiusUnit}>meters</Text>
        </View>

        <TouchableOpacity style={styles.currentBtn} onPress={onUseCurrentLocation}>
          <Navigation size={18} color="#fff" />
          <Text style={styles.currentText}>Use current location</Text>
        </TouchableOpacity>
      </View>

      {/* STICKY SEARCH */}
      <Animated.View
        style={[
          styles.searchWrapper,
          { transform: [{ translateY: searchTranslateY }] },
        ]}
      >
        <View style={styles.searchSpacer} />
        <GooglePlacesAutocomplete
          ref={searchRef}
          placeholder="Search for a place"
          fetchDetails
          onPress={handlePlaceSelect}
          query={{
            key: 'AIzaSyAAklfZoBe3kXwI4Vc4PRcrmAIYAi7wp3M',
            language: 'en',
          }}
          listViewDisplayed="auto"
          keyboardShouldPersistTaps="handled"
          suppressDefaultStyles
          debounce={300}
          enablePoweredByContainer={false}
          styles={{
            container: styles.searchContainer,
            textInput: styles.searchInput,
            listView: styles.searchList,
            row: styles.searchRow,
          }}
        />
      </Animated.View>

      {/* MAP */}
      <Animated.View style={[styles.mapContainer, { height: mapHeightAnim }]}>
        {renderMap()}
      </Animated.View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderColor: '#E5E7EB',
    },
    cancel: { color: '#6B7280' },
    save: { color: '#2563EB', fontWeight: '600' },
    title: { fontWeight: '600', fontSize: 16 },

    form: {
      padding: 16,
      gap: 12,
    },

    input: {
      backgroundColor: '#F1F5F9',
      borderRadius: 12,
      padding: 14,
    },
    textArea: { height: 70 },

    radiusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    radiusInput: {
      flex: 1,
      backgroundColor: '#F1F5F9',
      borderRadius: 12,
      padding: 14,
    },
    radiusUnit: { color: '#475569' },

    currentBtn: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: '#2563EB',
      padding: 14,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    currentText: { color: '#fff', fontWeight: '600' },

    searchWrapper: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 300 : 280,
      width: '100%',
      paddingHorizontal: 16,
      zIndex: 50,
    },
    searchContainer: {},
    searchInput: {
      height: 52,
      backgroundColor: '#fff',
      borderRadius: 14,
      paddingHorizontal: 16,
      fontSize: 15,
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    searchList: {
      backgroundColor: '#fff',
      borderRadius: 14,
      marginTop: 6,
      elevation: 8,
    },
    searchRow: {
      padding: 14,
    },
    searchSpacer: {
  height: 52, // equals search bar height + margin
},

    mapContainer: {
      marginTop: 80,
      marginHorizontal: 16,
      borderRadius: 16,
      overflow: 'hidden',
      flexGrow: 1,
    },
    map: { flex: 1 },
  });
