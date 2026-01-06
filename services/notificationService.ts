import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

// Helper function to create proper notification behavior
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

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => createNotificationBehavior(),
});

export class NotificationService {
  private static instance: NotificationService;
  private token: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return null;
    }

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

    try {
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
      console.log('Expo push token:', token);
      return token;
    } catch (error) {
      console.log('Error getting push token:', error);
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
      console.log('Device token registered with backend');
    } catch (error) {
      console.error('Failed to register device token:', error);
    }
  }

  async unregisterToken(userId: string): Promise<void> {
    try {
      await api.post('/notifications/unregister-device', {
        userId,
        token: this.token,
      });
      this.token = null;
    } catch (error) {
      console.error('Failed to unregister device token:', error);
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
      
      console.log(`Scheduled shift notification for ${triggerDate.toISOString()}`);
    } else {
      console.log('Shift notification time has already passed');
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
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getNotificationPreferences(): Promise<any> {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return null;
    }
  }

  async updateNotificationPreferences(preferences: any): Promise<void> {
    try {
      await api.put('/notifications/preferences', preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
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

  // Present local notification immediately
  async presentLocalNotification(title: string, body: string, data?: any): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null as any, // Immediate
    });
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }
}

export const notificationService = NotificationService.getInstance();