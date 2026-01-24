// components/NotificationPermissionRequest.tsx
import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { notificationService } from '@/services/notificationService';

export const NotificationPermissionRequest = () => {
  useEffect(() => {
    const requestPermissions = async () => {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        
        if (existingStatus !== 'granted') {
          if (Platform.OS === 'ios') {
            Alert.alert(
              'Enable Notifications',
              'Stay updated with messages, shift reminders, and important updates. Please enable notifications.',
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Enable',
                  onPress: async () => {
                    const { status } = await Notifications.requestPermissionsAsync();
                    if (status === 'granted') {
                      console.log('✅ Notification permission granted');
                    }
                  }
                }
              ]
            );
          } else {
            // Android permissions are requested automatically
            const { status } = await Notifications.requestPermissionsAsync();
            console.log('Android notification permission:', status);
          }
        }
      }
    };

    requestPermissions();
  }, []);

  return null; // This is a utility component, doesn't render anything
};