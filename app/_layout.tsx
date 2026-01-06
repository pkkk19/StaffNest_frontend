import 'react-native-get-random-values';
import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { Platform } from 'react-native';
import { VideoProvider } from '../contexts/VideoContext';
import { CallProvider } from '@/contexts/CallContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { notificationService } from '@/services/notificationService';
import { NotificationProvider } from '@/contexts/NotificationContext';
import AIChatPage from './pages/ai-chat';
import { AIChatProvider } from '@/contexts/AIChatContext';


// Initialize notification handler
const createNotificationBehavior = (): Notifications.NotificationBehavior => {
  const baseBehavior: any = {
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  };

  // iOS-specific properties
  if (Platform.OS === 'ios') {
    baseBehavior.shouldShowBanner = true;
    baseBehavior.shouldShowList = true;
  }

  return baseBehavior as Notifications.NotificationBehavior;
};

Notifications.setNotificationHandler({
  handleNotification: async () => createNotificationBehavior(),
});

function RootLayoutNav() {
  const { isAuthenticated, tokenExpired, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // Use specific types for subscription refs
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

  // Register for notifications when user logs in
  useEffect(() => {
    if (user?._id && isAuthenticated) {
      const registerNotifications = async () => {
        const token = await notificationService.registerForPushNotifications();
        if (token) {
          await notificationService.registerTokenWithBackend(user._id, token);
        }
      };
      registerNotifications();
    }
  }, [user?._id, isAuthenticated]);

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
        
        {/* Story Upload */}
        <Stack.Screen name="stories/upload" options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }} />
        
        {/* Admin Routes */}
        <Stack.Screen name="admin/roles" />
        <Stack.Screen name="admin/role-form" />
        <Stack.Screen name="admin/edit-payslip/[id]" />
        <Stack.Screen name="admin/company-location" />
        
        {/* Forms */}
        <Stack.Screen name="forms/add-staff" />
        <Stack.Screen name="forms/edit-staff" />
        <Stack.Screen name="forms/company-info" />
        <Stack.Screen name="forms/company-setup" />

        {/* Pages */}
        <Stack.Screen name="pages/company-location" />
        <Stack.Screen name="pages/edit-profile" />
        <Stack.Screen name="pages/role-form" />
        <Stack.Screen name="pages/roles" />
        
        {/* Payslips */}
        <Stack.Screen name="pages/payslips/index" />
        <Stack.Screen name="pages/payslips/[id]" />
        
        {/* Admin Payslips */}
        <Stack.Screen name="pages/admin/payslips/index" />
        <Stack.Screen name="pages/admin/payslips/[id]" />
        
        {/* Edit Payslip */}
        <Stack.Screen name="pages/admin/edit-payslip/[id]" />

        {/* AI Chat Page */}
        <Stack.Screen name="pages/ai-chat" />
        
        {/* ADD TIME-OFF ROUTES HERE */}
        <Stack.Screen name="pages/time-off/index" />
        <Stack.Screen name="pages/time-off/new-request" />
        <Stack.Screen name="pages/time-off/my-leaves" />
        <Stack.Screen name="pages/time-off/team-requests" />
        <Stack.Screen name="pages/time-off/calendar" />
        <Stack.Screen name="pages/time-off/leave/[id]" />
        <Stack.Screen name="pages/time-off/edit/[id]" />
        
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
            <NotificationProvider>
              <AIChatProvider>
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
              </AIChatProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}