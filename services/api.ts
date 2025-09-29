import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// At the top of your file
const USE_NGROK = true; // Set to false for local development
const LOCAL_IP = '192.168.1.67'; // Your computer's IP

const getBaseURL = () => {
  if (USE_NGROK) {
    return 'https://92031906b1fd.ngrok-free.app/';
  } else {
    return `http://${LOCAL_IP}:3000`;
  }
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
});

// Add request logging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    console.log('📊 Full Response:', JSON.stringify(response, null, 2));
    console.log('📊 Response Data:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.message);
    console.error('🔗 URL attempted:', error.config?.baseURL + error.config?.url);

    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
      console.error('📊 Response headers:', error.response.headers);
    }

    return Promise.reject(error);
  }
);

// Add auth token to requests automatically
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
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

export default api;