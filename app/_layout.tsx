import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { View } from 'react-native';
import { VideoProvider } from '../contexts/VideoContext';
import { CallProvider } from '@/contexts/CallContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function RootLayoutNav() {
  const { isAuthenticated, tokenExpired } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (tokenExpired) {
        router.replace('/login');
        return;
      }

      if (!isAuthenticated && segments[0] !== 'login' && segments[0] !== 'signup') {
        router.replace('/login');
      } else if (isAuthenticated && (segments[0] === 'login' || segments[0] === 'signup')) {
        router.replace('/(tabs)');
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, segments, tokenExpired]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth Screens */}
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        
        {/* Main Tabs */}
        <Stack.Screen name="(tabs)" />
        
        {/* Chat & Notifications */}
        <Stack.Screen name="chat" />
        <Stack.Screen name="notifications" />
        
        {/* Staff Management */}
        <Stack.Screen name="staff-details" />
        <Stack.Screen name="time-history" />
        
        {/* Profile & Payslips */}
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="payslips" />
        <Stack.Screen name="payslip-detail/[id]" />
        
        {/* Admin Routes - Note the folder structure */}
        <Stack.Screen name="admin/roles" />
        <Stack.Screen name="admin/role-form" />
        <Stack.Screen name="admin/edit-payslip/[id]" />
        <Stack.Screen name="admin/company-location" />
        
        {/* Forms */}
        <Stack.Screen name="forms/add-staff" />
        <Stack.Screen name="forms/edit-staff" />
        <Stack.Screen name="forms/company-info" />
        <Stack.Screen name="forms/company-setup" />

        {/* Pages - Update these to match your file structure */}
        <Stack.Screen name="pages/company-location" />
        <Stack.Screen name="pages/edit-profile" />
        <Stack.Screen name="pages/role-form" />
        <Stack.Screen name="pages/roles" />
        
        {/* Payslips - CORRECTED */}
        <Stack.Screen name="pages/payslips/index" />
        <Stack.Screen name="pages/payslips/[id]" />
        
        {/* Admin Payslips - CORRECTED */}
        <Stack.Screen name="pages/admin/payslips/index" />
        <Stack.Screen name="pages/admin/payslips/[id]" />
        
        {/* Edit Payslip - CORRECTED */}
        <Stack.Screen name="pages/admin/edit-payslip/[id]" />
        
        {/* Error */}
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            
              <ChatProvider>
                <SocketProvider>
                <VideoProvider>
                  <CallProvider>
                    <RootLayoutNav />
                    <StatusBar style="auto" />
                  </CallProvider>
                </VideoProvider>
                </SocketProvider>
              </ChatProvider>
            
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}