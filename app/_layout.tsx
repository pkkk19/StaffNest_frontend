import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { View } from 'react-native';

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
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="staff-details" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="forms/add-staff" />
        <Stack.Screen name="payslips" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="forms/company-info" />
        <Stack.Screen name="forms/company-setup" />
        <Stack.Screen name="forms/edit-staff" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            {/* ChatProvider must be inside AuthProvider since it uses useAuth */}
            <ChatProvider>
              {/* SocketProvider must be inside ChatProvider if it uses useChat */}
              <SocketProvider>
                <RootLayoutNav />
                <StatusBar style="auto" />
              </SocketProvider>
            </ChatProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </View>
  );
}