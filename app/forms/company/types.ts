import { Region } from 'react-native-maps';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface CompanyLocation {
  _id?: string;
  name: string;
  address: string;
  phone?: string;
  manager?: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
}

export interface CompanyData {
  _id: string;
  name: string;
  address?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  registration_number?: string;
  tax_number?: string;
  currency: string;
  country: string;
  logo_url?: string;
  logo_key?: string;
  locations: CompanyLocation[];
  subscription?: {
    plan: string;
    status: string;
    expiry_date: string;
    max_users: number;
    current_users: number;
  };
}

export interface LocationModalProps {
  modalState: LocationModalState;
  mapState: MapState;
  onClose: () => void;
  onSave: () => void;
  onUseCurrentLocation: () => void;
  onMapPress: (e: any) => void;
  onNameChange: (name: string) => void;
  onAddressChange: (address: string) => void;
  onRadiusChange: (radius: number) => void;
  onRegionChange: (region: any) => void; // Add this line
  onCoordinateChange: (coordinate: {
    latitude: number;
    longitude: number;
  }) => void;
}

export interface LocationModalState {
  visible: boolean;
  editingLocation: CompanyLocation | null;
  name: string;
  address: string;
  coordinate: { latitude: number; longitude: number } | null;
  radius: number;
}

export interface MapState {
  region: Region;
  currentLocation: any | null;
  permission: boolean;
}