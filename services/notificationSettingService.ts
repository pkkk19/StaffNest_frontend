import api from './api';
import { notificationSettingsAPI } from './api'; // Assuming you added the exports above

export interface NotificationPreferences {
  shiftReminders: boolean;
  shiftReminderMinutes: number[];
  shiftAssigned: boolean;
  shiftUpdated: boolean;
  shiftCancelled: boolean;
  newMessages: boolean;
  messageSound: boolean;
  messageVibration: boolean;
  newPayslip: boolean;
  holidayApproved: boolean;
  holidayRejected: boolean;
  incomingCalls: boolean;
  callSound: boolean;
  callVibration: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    days: number[];
  };
  notificationSound: boolean;
  vibration: boolean;
  badgeCount: boolean;
  ledLight: boolean;
}

export interface NotificationSettings {
  _id: string;
  userId: string;
  preferences: NotificationPreferences;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class NotificationSettingsService {
  async getSettings(): Promise<NotificationSettings> {
    try {
      const response = await notificationSettingsAPI.getSettings();
      
      if (response.data?.success) {
        return response.data.settings;
      }
      
      throw new Error('Failed to get notification settings');
    } catch (error: any) {
      console.error('Failed to get notification settings:', error);
      throw error;
    }
  }

  async updateSettings(preferences: Partial<NotificationPreferences>): Promise<NotificationSettings> {
    try {
      const response = await notificationSettingsAPI.updateSettings(preferences);
      
      if (response.data?.success) {
        return response.data.settings;
      }
      
      throw new Error('Failed to update notification settings');
    } catch (error: any) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  async resetToDefaults(): Promise<NotificationSettings> {
    try {
      const response = await notificationSettingsAPI.resetToDefaults();
      
      if (response.data?.success) {
        return response.data.settings;
      }
      
      throw new Error('Failed to reset notification settings');
    } catch (error: any) {
      console.error('Failed to reset notification settings:', error);
      throw error;
    }
  }

  async updateShiftReminderMinutes(minutes: number[]): Promise<NotificationSettings> {
    try {
      const response = await notificationSettingsAPI.updateShiftReminderMinutes(minutes);
      
      if (response.data?.success) {
        return response.data.settings;
      }
      
      throw new Error('Failed to update shift reminder minutes');
    } catch (error: any) {
      console.error('Failed to update shift reminder minutes:', error);
      throw error;
    }
  }

  async toggleSetting(setting: string, value: boolean): Promise<NotificationSettings> {
    try {
      const response = await notificationSettingsAPI.toggleSetting(setting, value);
      
      if (response.data?.success) {
        return response.data.settings;
      }
      
      throw new Error('Failed to toggle setting');
    } catch (error: any) {
      console.error('Failed to toggle setting:', error);
      throw error;
    }
  }

  async checkNotificationEnabled(type: string): Promise<boolean> {
    try {
      const response = await notificationSettingsAPI.checkNotificationEnabled(type);
      
      if (response.data?.success) {
        return response.data.isEnabled;
      }
      
      return false;
    } catch (error: any) {
      console.error('Failed to check notification status:', error);
      return false;
    }
  }
}

export const notificationSettingsService = new NotificationSettingsService();