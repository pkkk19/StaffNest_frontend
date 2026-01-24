import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, profileAPI } from '@/services/api';
import { socketService } from '@/services/socketService';
import { notificationService } from '@/services/notificationService';

interface User {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'staff';
  company_id?: string;
  position?: string;
  phone_number?: string;
  profile_picture_url?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
    email?: string;
    address?: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  isAuthenticated: boolean;
  loading: boolean;
  tokenExpired: boolean;
  clearTokenExpired: () => void;
  socketConnected: boolean;
  retrySocketConnection: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Listen to socket connection status
  useEffect(() => {
    const handleConnect = () => {
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const access_token = await AsyncStorage.getItem('authaccess_token');
      
      if (access_token) {
        await fetchProfile();
        socketService.connect(access_token);
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
      
      if (error.response?.status === 401) {
        setTokenExpired(true);
        await AsyncStorage.removeItem('authaccess_token');
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
      
      // Store token and user
      await AsyncStorage.setItem('authaccess_token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setTokenExpired(false);
      
      // Connect socket
      socketService.connect(access_token);
      
      // Register for push notifications
      try {
        const deviceToken = await notificationService.registerForPushNotifications();
        if (deviceToken && user._id) {
          await notificationService.registerTokenWithBackend(user._id, deviceToken);
        }
      } catch (notificationError) {
        console.log('Notification registration skipped or failed');
      }
      
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
      setTokenExpired(false);
      
      socketService.connect(access_token);
      
      // Register for push notifications
      try {
        const deviceToken = await notificationService.registerForPushNotifications();
        if (deviceToken && user._id) {
          await notificationService.registerTokenWithBackend(user._id, deviceToken);
        }
      } catch (notificationError) {
        console.log('Notification registration skipped or failed');
      }
      
    } catch (error: any) {
      console.error('Registration failed', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      Alert.alert('Registration Failed', errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    socketService.disconnect();
    await AsyncStorage.removeItem('authaccess_token');
    await AsyncStorage.removeItem('user');
    
    setUser(null);
    setTokenExpired(false);
    setSocketConnected(false);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const clearTokenExpired = () => {
    setTokenExpired(false);
  };

  const retrySocketConnection = async () => {
    try {
      const token = await AsyncStorage.getItem('authaccess_token');
      if (token) {
        socketService.connect(token);
      }
    } catch (error) {
      console.error('Socket retry failed:', error);
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      updateUser,
      isAuthenticated: !!user,
      loading,
      tokenExpired,
      clearTokenExpired,
      socketConnected,
      retrySocketConnection,
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