import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { TouchFixProvider, useTouchFix } from '@/contexts/TouchFIxContext';
import { useAppFocusFix } from '@/hooks/useAppFocusFix';
import { AppState, View, Platform } from 'react-native';
import AndroidTouchFix from '@/components/AndroidTouchFix';
import UniversalTouchFix from '@/components/UniversalTouchFix';

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const {version} = useTouchFix();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAuthenticated && segments[0] !== 'login' && segments[0] !== 'signup') {
        router.replace('/login');
      } else if (isAuthenticated && (segments[0] === 'login' || segments[0] === 'signup')) {
        router.replace('/(tabs)');
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, segments]);

  return (
    <>
    <Stack screenOptions={{ headerShown: false }} key={version}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="staff-details" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="payslips" />
      <Stack.Screen name="+not-found" />
    </Stack>
    </>
  );
}

export default function RootLayout() {
  const [key, setKey] = useState(0);
  useAppFocusFix();
  useFrameworkReady();
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        setKey(prev => prev + 1); // Force re-render on app focus
      }
    });

    return () => subscription.remove();
  }, []);


  useEffect(() => {
    if (Platform.OS === 'android') {
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          setKey(prev => prev + 1);
          // Additional fix for when app comes back from background
          console.log('App became active - ensuring touch works');
        }
      });
      const timer = setTimeout(() => {
        setKey(1); // Force first re-render
      }, 300);
      return () => {
        subscription.remove();
        clearTimeout(timer);
      };
    }
  }, []);

  useEffect(() => {
  if (Platform.OS === 'android') {
    // Force a layout recalculation
    setTimeout(() => {
      console.log('Forcing Android layout refresh');
    }, 1000);
  }
}, []);


  return (
    <View key={key} style={{ flex: 1 }}>
      <AndroidTouchFix />
      <UniversalTouchFix />
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