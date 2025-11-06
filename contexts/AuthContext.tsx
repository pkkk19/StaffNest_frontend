import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, profileAPI } from '@/services/api';

interface User {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'staff';
  company_id?: string;
  position?: string;
  phone_number?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  tokenExpired: boolean;
  clearTokenExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const access_token = await AsyncStorage.getItem('authaccess_token');
      if (access_token) {
        await fetchProfile();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to check auth status', error);
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
  try {
    const response = await profileAPI.getProfile();
    setUser(response.data);
    setTokenExpired(false);
  } catch (error: any) {
    console.error('Failed to fetch profile', error);
    
    // Check if error is due to token expiration
    if (error.response?.status === 401) {
      setTokenExpired(true);
      await AsyncStorage.removeItem('authaccess_token');
    } else {
      // Only remove token on auth errors, not network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        await AsyncStorage.removeItem('authaccess_token');
      }
    }
  } finally {
    setLoading(false);
  }
};

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, user } = response.data;
      
      if (!access_token) {
        throw new Error('No authentication access_token received from server');
      }
      
      await AsyncStorage.setItem('authaccess_token', access_token);
      setUser(user);
      setTokenExpired(false); // Reset token expired flag on successful login
    } catch (error: any) {
      console.error('Login failed', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      Alert.alert('Login Failed', errorMessage);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authAPI.register(userData);
      const { access_token, user } = response.data;
      
      if (!access_token) {
        throw new Error('No authentication access_token received from server');
      }
      
      await AsyncStorage.setItem('authaccess_token', access_token);
      setUser(user);
      setTokenExpired(false); // Reset token expired flag on successful registration
    } catch (error: any) {
      console.error('Registration failed', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      Alert.alert('Registration Failed', errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authaccess_token');
    setUser(null);
    setTokenExpired(false);
  };

  const clearTokenExpired = () => {
    setTokenExpired(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isAuthenticated: !!user,
      loading,
      tokenExpired,
      clearTokenExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}