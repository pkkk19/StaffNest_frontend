import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// At the top of your file
const USE_NGROK = true; // Set to false for local development
const LOCAL_IP = '192.168.1.67'; // Your computer's IP

const getBaseURL = () => {
  if (USE_NGROK) {
    return 'https://804c45252eb1.ngrok-free.app';
  } else {
    return `http://${LOCAL_IP}:3000`;
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
  updateCompany: (id: string, companyData: any) => 
    api.put(`/companies/${id}`, companyData),
  deleteCompany: (id: string) => api.delete(`/companies/${id}`),
};

// Shifts API calls
export const shiftsAPI = {
  getShifts: () => api.get('/shifts'),
  createShift: (shiftData: {
    title: string;
    description?: string;
    start_time: Date;
    end_time: Date;
    user_id: string;
    company_id: string;
    status?: string;
    notes?: string;
  }) => api.post('/shifts', shiftData),
  getShift: (id: string) => api.get(`/shifts/${id}`),
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

// Add this to your existing API exports in api.ts

// Staff API calls
export const staffAPI = {
  // Create a new staff member with payroll data
  createStaff: (staffData: {
    // Personal Information
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    address?: string;
    date_of_birth?: string;
    
    // Employment Details
    role: 'admin' | 'staff';
    position?: string;
    department?: string;
    employment_type?: 'full-time' | 'part-time' | 'contract';
    employment_start_date?: string;
    
    // Payroll Information
    employee_ref: string;
    ni_number: string;
    tax_code?: string;
    pay_frequency?: 'monthly' | 'weekly' | 'bi-weekly' | 'fortnightly';
    payment_method?: 'BACS' | 'Cheque' | 'Cash';
    
    // Bank Details
    bank_account_number?: string;
    bank_sort_code?: string;
    
    // Pension Information
    pension_scheme?: string;
    employee_pension_rate?: number;
    pension_salary_sacrifice?: boolean;
    
    // Pay Rates
    default_hourly_rate?: number;
    default_salary?: number;
    
    // Leave Entitlement
    annual_leave_entitlement_days?: number;
    annual_leave_entitlement_hours?: number;
    
    // Password (required for user creation)
    password: string;
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

export default api;