export interface Shift {
  _id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  company_id: {
    _id: string;
    name?: string;
  };
  user_id?: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  location?: string;
  location_coordinates?: {
    latitude: number;
    longitude: number;
  };
  location_address?: string;
  color_hex?: string;
  created_by: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  status: 'scheduled' | 'in-progress' | 'late' | 'completed' | 'completed-early' | 'completed-overtime' | 'cancelled';
  type: 'assigned' | 'open';
  clock_in_time?: string;
  clock_out_time?: string;
  clock_in_latitude?: number;
  clock_in_longitude?: number;
  clock_out_latitude?: number;
  clock_out_longitude?: number;
  clock_in_radius_meters?: number;
  clock_out_radius_meters?: number;
  overtime_minutes?: number;
  late_minutes?: number;
  early_minutes?: number;
  overtime_approved?: boolean;
  overtime_approved_at?: string;
  overtime_approved_by?: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  user_id?: string;
  location?: string;
  location_coordinates?: {
    latitude: number;
    longitude: number;
  };
  location_address?: string;
  color_hex?: string;
  type?: 'assigned' | 'open';
  status?: string;
}

export interface UpdateShiftData {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  user_id?: string;
  location?: string;
  location_coordinates?: {
    latitude: number;
    longitude: number;
  };
  location_address?: string;
  color_hex?: string;
  status?: string;
  type?: 'assigned' | 'open';
}

export interface ShiftRequest {
  _id: string;
  shift_id: Shift;
  user_id: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  requested_by: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  staff_notes?: string;
  admin_notes?: string;
  created_at: string;
  responded_at?: string;
  responded_by?: {
    _id: string;
    first_name: string;
    last_name: string;
  };
}

export interface ShiftFilters {
  start_date?: Date | string;
  end_date?: Date | string;
  user_id?: string;
  status?: string;
  type?: 'assigned' | 'open';
}