import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { View} from 'react-native';

function RootLayoutNav() {
  const { isAuthenticated, tokenExpired } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Redirect to login if token is expired
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
      <Stack.Screen name="notifications" />
      <Stack.Screen name="staff-details" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="forms/add-staff" />
      <Stack.Screen name="payslips" />
      <Stack.Screen name="+not-found" />
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
            <RootLayoutNav />
            <StatusBar style="auto" />
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </View>
  );
}