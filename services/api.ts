import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// At the top of your file
const USE_NGROK = true; // Set to false for local development
const LOCAL_IP = '192.168.1.67'; // Your computer's IP

const getBaseURL = () => {
  if (USE_NGROK) {
    return 'https://0d06865cf4df.ngrok-free.app/';
  } else {
    return `http://localhost:3000`;
  }
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
});

// Add auth token to requests automatically
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authaccess_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    console.log('📊 Full Response:', JSON.stringify(response, null, 2));
    console.log('📊 Response Data:', response.data);
    return response;
  },
  async (error) => {
    console.error('❌ API Response Error:', error.message);
    console.error('🔗 URL attempted:', error.config?.baseURL + error.config?.url);

    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
      console.error('📊 Response headers:', error.response.headers);

      // Handle token expiration (401 Unauthorized)
      if (error.response.status === 401) {
        console.log('🔄 Token expired, removing from storage');

        try {
          // Remove the expired token
          await AsyncStorage.removeItem('authaccess_token');

          // You can also emit an event or use a global state to notify the app
          // For now, we'll just log and let the component handle the redirect
          console.log('🔑 Token removed due to expiration');

          // You could also show an alert here if needed
          // Alert.alert('Session Expired', 'Please login again');
        } catch (storageError) {
          console.error('Error removing auth token:', storageError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    company_id?: string;
  }) => api.post('/auth/register', userData),
};

// Profile API calls
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (profileData: any) => api.put('/profile', profileData),
  uploadProfilePicture: (formData: FormData) => 
    api.post('/profile/upload-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  removeProfilePicture: () => api.post('/profile/remove-picture'),
};

// Companies API calls
export const companiesAPI = {
  getCompanies: () => api.get('/companies'),
  createCompany: (companyData: {
    name: string;
    address?: string;
    phone_number?: string;
    logo_url?: string;
  }) => api.post('/companies', companyData),
  getCompany: (id: string) => api.get(`/companies/${id}`),
  getMyCompany: () => api.get('/companies/my'),
  updateCompany: (companyData: any) => api.put('/companies', companyData),
  deleteCompany: (id: string) => api.delete(`/companies/${id}`),
  
  // Logo upload endpoints
  uploadLogo: (formData: FormData) => 
    api.post('/companies/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  removeLogo: () => api.post('/companies/remove-logo'),

  addLocation: (locationData: {
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    radius?: number;
    is_active?: boolean;
  }) => api.post('/companies/locations', locationData),

  getLocations: () => api.get('/companies/locations'),

  updateLocation: (locationIndex: number, locationData: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    is_active?: boolean;
  }) => api.put(`/companies/locations/${locationIndex}`, locationData),

  deleteLocation: (locationIndex: number) => api.delete(`/companies/locations/${locationIndex}`),
};

// Shifts API calls
export const shiftsAPI = {
  createShift: (shiftData: {
    title: string;
    description?: string;
    start_time: string;  // ISO string
    end_time: string;    // ISO string
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
  }) => api.post('/shifts', shiftData),

  getShift: (id: string) => api.get(`/shifts/${id}`),

  getShifts: (filters?: any) => 
    api.get('/shifts', { params: filters }),

  // Get user's shifts
  getMyShifts: (filters?: any) => 
    api.get('/shifts/my-shifts', { params: filters }),

  // Get open shifts
  getOpenShifts: (filters?: any) => 
    api.get('/shifts', { 
      params: { 
        type: 'open',
        ...filters 
      } 
    }),

  updateShift: (id: string, shiftData: any) =>
    api.put(`/shifts/${id}`, shiftData),
  deleteShift: (id: string) => api.delete(`/shifts/${id}`),
  clockIn: (id: string, data?: {
    latitude?: number;
    longitude?: number;
    radius_meters?: number;
  }) => api.post(`/shifts/${id}/clock-in`, data),
  clockOut: (id: string, data?: {
    latitude?: number;
    longitude?: number;
    radius_meters?: number;
  }) => api.post(`/shifts/${id}/clock-out`, data),
};

// Rota API calls
export const rotaAPI = {
  getRota: () => api.get('/rota'),
  createRota: (rotaData: {
    title: string;
    description?: string;
    start_time: Date;
    end_time: Date;
    user_id: string;
    company_id: string;
    status?: string;
    notes?: string;
  }) => api.post('/rota', rotaData),
  getRotaItem: (id: string) => api.get(`/rota/${id}`),
  updateRotaItem: (id: string, rotaData: any) =>
    api.put(`/rota/${id}`, rotaData),
  deleteRotaItem: (id: string) => api.delete(`/rota/${id}`),
};

export const shiftRequestsAPI = {
  // Create shift request
  createRequest: (requestData: { shift_id: string; staff_notes?: string }) => 
    api.post('/shifts/requests', requestData),

  // Get shift requests (admin)
  getRequests: (status?: string) => 
    api.get('/shifts/requests', { 
      params: status ? { status } : {} 
    }),

  // Get user's shift requests
  getMyRequests: () => 
    api.get('/shifts/requests/my-requests'),

  // Update shift request (approve/reject)
  updateRequest: (id: string, updateData: { status: 'approved' | 'rejected'; admin_notes?: string }) => 
    api.patch(`/shifts/requests/${id}`, updateData),
};

export const staffAPI = {
  createStaff: (staffData: {
    // Core fields
    email: string;
    password?: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'staff';
    position?: string;
    phone_number?: string;
    date_of_birth?: string;
    address?: string;

    // Country selection
    country: string;

    // Flexible payroll data
    identification?: {
      employee_ref: string;
      // Country-specific IDs will be shown based on selected country
      ni_number?: string;    // UK
      ssn?: string;          // US  
      tfn?: string;          // AU
      pan?: string;          // NP
      uae_id?: string;       // AE
    };

    tax_info?: {
      // Will be populated based on country
      tax_code?: string;     // UK
      filing_status?: string; // US
      tax_scale?: string;    // AU
      tax_slab?: string;     // NP
    };

    payment_method?: {
      method: string;
      // Country-specific banking
      sort_code?: string;      // UK
      routing_number?: string; // US
      bsb_code?: string;       // AU
      account_number?: string;
    };

    employment?: {
      department?: string;
      employment_type?: string;
      pay_frequency?: string;
      start_date?: string;
      working_hours_per_week?: number;
    };

    pay_rates?: {
      default_hourly_rate?: number;
      default_salary?: number;
      overtime_rate?: number;
    };

    pension?: {
      employee_contribution_rate?: number;
      employer_contribution_rate?: number;
      is_salary_sacrifice?: boolean;
    };

    // Custom payment/deduction types can be added later
    payment_types?: any[];
    deduction_types?: any[];

  }) => api.post('/users', staffData),

  // Get all staff members
  getStaff: () => api.get('/users'),

  // Get staff members only (non-admin)
  getStaffMembers: () => api.get('/users/staff'),

  // Get specific staff member
  getStaffMember: (id: string) => api.get(`/users/${id}`),

  // Update staff member
  updateStaff: (id: string, staffData: any) => api.patch(`/users/${id}`, staffData),

  // Delete staff member
  deleteStaff: (id: string) => api.delete(`/users/${id}`),
};

export const chatAPI = {
  // Get conversations list
  getConversations: () => api.get('/chat/conversations'),

  // Create new conversation
  createConversation: (participantIds: string[], name?: string) =>
    api.post('/chat/conversations', { participantIds, name }),

  // Get messages for a conversation
  getMessages: (conversationId: string, page: number = 1) =>
    api.get(`/chat/conversations/${conversationId}/messages?page=${page}`),

  // Send a message
  sendMessage: (conversationId: string, content: string) =>
    api.post(`/chat/conversations/${conversationId}/messages`, { content }),

  // Mark messages as read
  markAsRead: (conversationId: string, messageIds: string[]) =>
    api.put(`/chat/conversations/${conversationId}/read`, { messageIds }),
};

export const contactsAPI = {
  // Search users
  searchUsers: (query: string) => api.get(`/contacts/search?q=${encodeURIComponent(query)}`),

  // Send friend request
  sendFriendRequest: (toUserId: string, message?: string) =>
    api.post('/contacts/friend-requests', { toUserId, message }),

  // Get pending requests
  getPendingRequests: () => api.get('/contacts/friend-requests/pending'),

  // Respond to friend request
  respondToRequest: (requestId: string, action: 'accepted' | 'rejected') =>
    api.put('/contacts/friend-requests/respond', { requestId, action }),

  // Get friends list
  getFriends: () => api.get('/contacts/friends'),

  // Remove friend
  removeFriend: (friendId: string) => api.delete(`/contacts/friends/${friendId}`),

  // Generate QR code for user
  generateQRCode: () => api.get('/contacts/qr-code'),

  // Add friend by QR code
  addFriendByQR: (qrData: string) => api.post('/contacts/qr-add', { qrData }),
};

export default api;