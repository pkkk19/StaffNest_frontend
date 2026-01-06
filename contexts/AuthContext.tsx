import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, profileAPI } from '@/services/api';
import { socketService } from '@/services/socketService';

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
      console.log('✅ Socket connected - updating state');
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected - updating state');
      setSocketConnected(false);
    };

    const handleConnectError = (error: any) => {
      console.error('❌ Socket connection error in AuthContext:', error);
      setSocketConnected(false);
    };

    // Add socket event listeners
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleConnectError);

    return () => {
      // Clean up listeners
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleConnectError);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const access_token = await AsyncStorage.getItem('authaccess_token');
      console.log('🔍 Auth check - token exists:', !!access_token);
      
      if (access_token) {
        await fetchProfile();
        
        // Connect socket with the token
        console.log('🔗 Attempting socket connection...');
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
      } else if (error.response?.status === 401 || error.response?.status === 403) {
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
      
      // Store token with consistent key
      await AsyncStorage.setItem('authaccess_token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setTokenExpired(false);
      
      console.log('🔗 Connecting socket after login...');
      socketService.connect(access_token);
      
      // Push notification code removed completely
      console.log('✅ Login successful - user authenticated');
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
      
      console.log('🔗 Connecting socket after registration...');
      socketService.connect(access_token);
    } catch (error: any) {
      console.error('Registration failed', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      Alert.alert('Registration Failed', errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    console.log('🔌 Disconnecting socket on logout...');
    socketService.disconnect();
    await AsyncStorage.removeItem('authaccess_token');
    await AsyncStorage.removeItem('user'); // Also remove stored user
    
    setUser(null);
    setTokenExpired(false);
    setSocketConnected(false);
    
    console.log('✅ Logout successful');
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
        console.log('🔄 Retrying socket connection...');
        socketService.connect(token);
      } else {
        console.log('❌ No token available for socket retry');
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