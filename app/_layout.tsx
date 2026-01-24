// app/_layout.tsx - CORRECTED VERSION
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
import { VideoProvider } from '@/contexts/VideoContext';
import { CallProvider } from '@/contexts/CallContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { notificationService } from '@/services/notificationService';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AIChatProvider } from '@/contexts/AIChatContext';
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';
import { CallInvitationModal } from './calls/callInvitationModal';
import { ChatPreviewProvider } from '@/contexts/ChatPreviewContext';

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
  
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

  // Register for notifications when user logs in
  useEffect(() => {
    if (user?._id && isAuthenticated) {
      const setupNotifications = async () => {
        try {
          console.log('🔔 Setting up notifications for user:', user._id);
          
          // Create notification channel (Android)
          await notificationService.createNotificationChannel();
          
          // Register for push notifications
          const token = await notificationService.registerForPushNotifications();
          
          if (token) {
            // Register token with backend
            await notificationService.registerTokenWithBackend(user._id, token);
            console.log('✅ Device token registered with backend');
          }
          
          // Set up notification listeners
          notificationListener.current = Notifications.addNotificationReceivedListener(
            async (notification) => {
              console.log('📱 Notification received:', notification.request.content);
              const data = notification.request.content.data as any;
              
              // Check if this is a chat notification for an active conversation
              if (data?.conversationId && notificationService.isConversationActive(data.conversationId)) {
                console.log(`🔕 Suppressing notification for active conversation: ${data.conversationId}`);
                // Still update badge silently
                try {
                  const count = await notificationService.getBadgeCountAsync();
                  await notificationService.setBadgeCountAsync(count + 1);
                } catch (error) {
                  console.error('Error updating badge:', error);
                }
                return;
              }
              
              // Update badge count for other notifications
              try {
                const count = await notificationService.getBadgeCountAsync();
                await notificationService.setBadgeCountAsync(count + 1);
              } catch (error) {
                console.error('Error updating badge:', error);
              }
            }
          );

          responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
              console.log('👆 Notification tapped:', response.notification.request.content);
              const data = response.notification.request.content.data as any;
              
              // Handle deep linking based on notification type
              if (data?.type === 'new_message' && data.conversationId) {
                router.push({ 
                  pathname: '/chat/[conversationId]', 
                  params: { conversationId: String(data.conversationId) }
                });
              } else if (data?.type === 'shift_reminder' && data.shiftId) {
                router.push('/(tabs)/rota');
              } else if (data?.type === 'new_payslip' && data.payslipId) {
                router.push({
                  pathname: '/pages/payslips/[id]',
                  params: { id: String(data.payslipId) }
                });
              } else if (data?.type === 'call_incoming' && data.callId) {
                console.log('Incoming call notification:', data.callId);
              } else if (data?.type === 'friend_request') {
                router.push('/chat/contacts');
              } else if (data?.type === 'leave_request') {
                router.push('/pages/time-off/team-requests');
              }
            }
          );

          console.log('✅ Notification setup complete');
          
        } catch (error) {
          console.error('❌ Error setting up notifications:', error);
        }
      };
      
      setupNotifications();
    }

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?._id, isAuthenticated, router]);

  // Reset conversation tracking when navigating away from chat
  useEffect(() => {
    const checkNavigation = () => {
      const currentSegment = segments[0];
      if (currentSegment !== 'chat') {
        console.log('🚫 Leaving chat area, clearing conversation tracking');
        // Clear all active conversations
        // notificationService.clearAllActiveConversations();
      }
    };
    
    checkNavigation();
  }, [segments]);

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
        
        {/* Story Upload */}
        <Stack.Screen name="stories/upload" options={{ 
          presentation: 'card',
          animation: 'slide_from_bottom'
        }} />
        
        {/* Forms */}
        <Stack.Screen name="forms/add-staff" />
        <Stack.Screen name="forms/edit-staff" />
        <Stack.Screen name="forms/company-info" />
        <Stack.Screen name="forms/company-setup" />
        <Stack.Screen name="forms/company/CompanyHeader" />
        <Stack.Screen name="forms/company/CompanyInfoSection" />
        <Stack.Screen name="forms/company/CompanyLocationSection" />
        <Stack.Screen name="forms/company/CompanyLogoSection" />
        <Stack.Screen name="forms/company/location-setup" />

        {/* Pages */}
        <Stack.Screen name="pages/ai-chat" />
        <Stack.Screen name="pages/ai-settings"/>
        <Stack.Screen name="pages/company-location" />
        <Stack.Screen name="pages/edit-profile" />
        <Stack.Screen name="pages/role-form" />
        <Stack.Screen name="pages/roles" />
        
        {/* Payslips */}
        <Stack.Screen name="pages/payslips/index" />
        <Stack.Screen name="pages/payslips/[id]" />
        
        {/* Admin Payslips */}
        <Stack.Screen name="pages/admin/payslips/index" />
        <Stack.Screen name="pages/admin/edit-payslip/[id]" />

        {/* Time Off */}
        <Stack.Screen name="pages/time-off/index" />
        <Stack.Screen name="pages/time-off/new-request" />
        <Stack.Screen name="pages/time-off/my-leaves" />
        <Stack.Screen name="pages/time-off/team-requests" />
        <Stack.Screen name="pages/time-off/calendar" />
        <Stack.Screen name="pages/time-off/leave/[id]" />
        
        {/* Test */}
        <Stack.Screen name="test/TestNotification" />
        
        {/* Error */}
        <Stack.Screen name="+not-found" />

        {/* Call Screens - ADD THIS */}
        <Stack.Screen name="calls" />
        
        {/* Remove this - it's handled in the calls/_layout.tsx */}
        {/* <Stack.Screen name="calls/TestVideoScreen" options={{ title: 'Test Video Call' }} /> */}
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
              <ChatPreviewProvider>
              <AIChatProvider>
                <ChatProvider>
                  <SocketProvider>
                    <VideoProvider>
                      <CallProvider>
                        <NotificationPermissionPrompt />
                        <RootLayoutNav />
                        <StatusBar style="auto" />
                        {/* Remove VideoCallScreen from here - it's a route */}
                        <CallInvitationModal />
                      </CallProvider>
                    </VideoProvider>
                  </SocketProvider>
                </ChatProvider>
              </AIChatProvider>
              </ChatPreviewProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}