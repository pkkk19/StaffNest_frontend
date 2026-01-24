import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

// Helper function to create proper notification behavior
const createNotificationBehavior = (): Notifications.NotificationBehavior => {
  // Platform-specific properties - FIXED
  if (Platform.OS === 'ios') {
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };
  } else {
    // Android should use the new properties too
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };
  }
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => createNotificationBehavior(),
});

export class NotificationService {
  private static instance: NotificationService;
  private token: string | null = null;
  private isChatOpen: boolean = false;
  private currentChatId: string | null = null;
  private activeConversations: Set<string> = new Set(); // Track all active conversations

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // MARK CONVERSATION METHODS - ADD THESE
  markConversationAsActive(conversationId: string): void {
    this.activeConversations.add(conversationId);
    console.log(`✅ Marked conversation as active: ${conversationId}`);
  }

  markConversationAsInactive(conversationId: string): void {
    this.activeConversations.delete(conversationId);
    console.log(`✅ Marked conversation as inactive: ${conversationId}`);
  }

  isConversationActive(conversationId: string): boolean {
    return this.activeConversations.has(conversationId);
  }

  // Call this when chat opens
  setChatOpen(chatId: string | null): void {
    this.isChatOpen = chatId !== null;
    this.currentChatId = chatId;
    console.log(`💬 Chat state: ${chatId ? `Open (${chatId})` : 'Closed'}`);
  }

  // Check if notification should be shown for current chat
  shouldShowChatNotification(conversationId: string): boolean {
    if (!this.isChatOpen) return true;
    
    // If chat is open but it's a different conversation, show notification
    if (this.currentChatId !== conversationId) return true;
    
    console.log(`🔕 Suppressing notification for open chat: ${conversationId}`);
    return false;
  }

  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return null;
    }

    try {
      // Create notification channel for Android
      await this.createNotificationChannel();

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      let token;
      
      // Check if we have EAS project ID
      if (Constants.expoConfig?.extra?.eas?.projectId) {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig.extra.eas.projectId,
        })).data;
      } else {
        // Fallback for development
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }

      this.token = token;
      console.log('✅ Expo push token received:', token);
      return token;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  async registerTokenWithBackend(userId: string, token: string): Promise<void> {
    try {
      await api.post('/notifications/register-device', {
        userId,
        token,
        platform: Platform.OS,
      });
      console.log('✅ Device token registered with backend');
    } catch (error) {
      console.error('❌ Failed to register device token with backend:', error);
    }
  }

  async unregisterToken(userId: string): Promise<void> {
    try {
      await api.post('/notifications/unregister-device', {
        userId,
        token: this.token,
      });
      this.token = null;
      console.log('✅ Device token unregistered');
    } catch (error) {
      console.error('❌ Failed to unregister device token:', error);
    }
  }

  async scheduleShiftNotification(
    shiftTitle: string,
    shiftTime: Date,
    minutesBefore: number,
    notificationId: string
  ): Promise<void> {
    // Calculate trigger time
    const triggerTimestamp = shiftTime.getTime() - minutesBefore * 60000;
    
    // Create a date object for the trigger
    const triggerDate = new Date(triggerTimestamp);
    
    // Use timestamp for scheduling (seconds since epoch)
    const secondsFromNow = Math.max(0, Math.floor((triggerDate.getTime() - Date.now()) / 1000));
    
    if (secondsFromNow > 0) {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: 'Shift Reminder',
          body: `${shiftTitle} starts in ${minutesBefore} minutes`,
          data: { type: 'shift_reminder', shiftId: notificationId },
          sound: 'default',
        },
        trigger: {
          type: 'timeInterval',
          seconds: secondsFromNow,
        } as Notifications.TimeIntervalTriggerInput,
      });
      
      console.log(`✅ Scheduled shift notification for ${triggerDate.toISOString()}`);
    } else {
      console.log('⚠️ Shift notification time has already passed');
    }
  }

  async scheduleRepeatingShiftNotification(
    shiftTitle: string,
    shiftTime: Date,
    minutesBefore: number,
    notificationId: string,
    repeat: 'daily' | 'weekly' = 'weekly'
  ): Promise<void> {
    const triggerDate = new Date(shiftTime.getTime() - minutesBefore * 60000);
    
    // Extract time components
    const hour = triggerDate.getHours();
    const minute = triggerDate.getMinutes();
    
    if (repeat === 'weekly') {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: 'Shift Reminder',
          body: `${shiftTitle} starts in ${minutesBefore} minutes`,
          data: { type: 'shift_reminder', shiftId: notificationId },
          sound: 'default',
        },
        trigger: {
          type: 'weekly',
          repeats: true,
          hour,
          minute,
          weekday: triggerDate.getDay() + 1, // 1-7, Sunday = 1
        } as Notifications.WeeklyTriggerInput,
      });
    } else {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: 'Shift Reminder',
          body: `${shiftTitle} starts in ${minutesBefore} minutes`,
          data: { type: 'shift_reminder', shiftId: notificationId },
          sound: 'default',
        },
        trigger: {
          type: 'daily',
          repeats: true,
          hour,
          minute,
        } as Notifications.DailyTriggerInput,
      });
    }
    
    console.log(`✅ Scheduled repeating ${repeat} shift notification`);
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`✅ Cancelled notification: ${notificationId}`);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ Cancelled all scheduled notifications');
  }

  async getNotificationPreferences(): Promise<any> {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get notification preferences:', error);
      return null;
    }
  }

  async updateNotificationPreferences(preferences: any): Promise<void> {
    try {
      await api.put('/notifications/preferences', preferences);
      console.log('✅ Updated notification preferences');
    } catch (error) {
      console.error('❌ Failed to update notification preferences:', error);
      throw error;
    }
  }

  // Helper method to create channel for Android
  async createNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
      console.log('✅ Created Android notification channel');
    }
  }

  // Get all scheduled notifications
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Listen for incoming notifications
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Listen for notification responses
  addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Listen for notification dismissals
  addNotificationsDroppedListener(callback: () => void) {
    return Notifications.addNotificationsDroppedListener(callback);
  }

  // Get current notification permissions
  async getPermissionsAsync(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.getPermissionsAsync();
  }

  getToken(): string | null {
    return this.token;
  }

  // Set badge number
  async setBadgeCountAsync(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  // Get badge number
  async getBadgeCountAsync(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  // Present local notification immediately with chat check
  async presentLocalNotification(title: string, body: string, data?: any): Promise<string> {
    // Check if it's a chat notification and conversation screen is open
    if (data?.conversationId && this.isConversationActive(data.conversationId)) {
      console.log(`🔕 Suppressing notification for open conversation screen: ${data.conversationId}`);
      // Still update badge silently
      this.getBadgeCountAsync().then(count => {
        this.setBadgeCountAsync(count + 1).catch(console.error);
      }).catch(console.error);
      return 'suppressed';
    }

    // Also check the old method for backward compatibility
    if (data?.type === 'new_message' && data?.conversationId) {
      if (this.shouldShowChatNotification(data.conversationId) === false) {
        console.log(`🔕 Suppressing chat notification for open chat: ${data.conversationId}`);
        // Still update badge silently
        this.getBadgeCountAsync().then(count => {
          this.setBadgeCountAsync(count + 1).catch(console.error);
        }).catch(console.error);
        return 'suppressed';
      }
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null as any, // Immediate
    });
    console.log('✅ Presented local notification:', notificationId);
    return notificationId;
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  // NEW: Handle incoming push notifications with conversation check
  async handleIncomingPushNotification(notificationData: any): Promise<void> {
    const { conversationId } = notificationData;
    
    // Don't show notification if conversation screen is open
    if (conversationId && this.isConversationActive(conversationId)) {
      console.log('🔕 Suppressing push notification for open conversation screen:', conversationId);
      return;
    }
    
    // Also check the old method for backward compatibility
    if (conversationId && this.shouldShowChatNotification(conversationId) === false) {
      console.log('🔕 Suppressing push notification for open chat:', conversationId);
      return;
    }
    
    // Show notification
    await this.presentLocalNotification(
      notificationData.title || 'New Message',
      notificationData.body || 'You have a new message',
      notificationData
    );
  }

  // New method to specifically handle chat notifications with conversation check
  async handleChatNotification(conversationId: string, message: string, senderName: string, data?: any): Promise<string> {
    // Check if conversation screen is open
    if (this.isConversationActive(conversationId)) {
      console.log(`🔕 Suppressing chat notification for open conversation: ${conversationId}`);
      // Update badge silently
      this.getBadgeCountAsync().then(count => {
        this.setBadgeCountAsync(count + 1).catch(console.error);
      }).catch(console.error);
      return 'suppressed';
    }

    // Check using old method for backward compatibility
    if (this.shouldShowChatNotification(conversationId) === false) {
      console.log(`🔕 Suppressing chat notification for open chat: ${conversationId}`);
      // Update badge silently
      this.getBadgeCountAsync().then(count => {
        this.setBadgeCountAsync(count + 1).catch(console.error);
      }).catch(console.error);
      return 'suppressed';
    }

    // Show the notification
    return await this.presentLocalNotification(
      senderName,
      message,
      {
        ...data,
        type: 'new_message',
        conversationId
      }
    );
  }
}

export const notificationService = NotificationService.getInstance();