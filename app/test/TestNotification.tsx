// app/test/TestNotification.tsx
import React from 'react';
import { View, Button, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

const TestNotification = () => {
  // Helper function to create trigger
  const createTrigger = (seconds: number) => {
    return {
      seconds,
      channelId: 'default'
    };
  };

  const triggerTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from development',
          data: { 
            type: 'new_message', 
            conversationId: '12345',
            test: true
          },
        },
        trigger: createTrigger(2),
      });
      Alert.alert('Success', 'Test notification scheduled! It will appear in 2 seconds.');
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  const triggerMultipleTestNotifications = async () => {
    try {
      // Test new message notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Message',
          body: 'John sent you a message',
          data: { 
            type: 'new_message', 
            conversationId: '67890'
          },
        },
        trigger: createTrigger(1),
      });

      // Test payslip notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Payslip Available',
          body: 'Your March payslip is ready',
          data: { 
            type: 'new_payslip', 
            payslipId: 'ps_001'
          },
        },
        trigger: createTrigger(3),
      });

      // Test friend request notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Friend Request',
          body: 'Sarah sent you a friend request',
          data: { 
            type: 'friend_request'
          },
        },
        trigger: createTrigger(5),
      });

      Alert.alert('Success', '3 test notifications scheduled! They will appear at 1s, 3s, and 5s intervals.');
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      Alert.alert('Error', 'Failed to schedule notifications');
    }
  };

  // Immediate notification using 0 seconds
  const triggerImmediateNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Immediate Test',
          body: 'This appears immediately',
          data: { 
            type: 'new_message', 
            conversationId: '99999' 
          },
        },
        trigger: createTrigger(0.1), // Almost immediate (100ms)
      });
      Alert.alert('Success', 'Immediate notification scheduled!');
    } catch (error) {
      console.error('Error showing notification:', error);
      Alert.alert('Error', 'Failed to show notification');
    }
  };

  // Alternative: Show notification immediately without scheduling
  const showNotificationNow = async () => {
    try {
      // You can use this if you want to show notification immediately
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Right Now!',
          body: 'This notification appears right away',
          data: { 
            type: 'test', 
            immediate: true 
          },
        },
        trigger: null, // null trigger means immediate
      });
      Alert.alert('Success', 'Notification shown immediately!');
    } catch (error) {
      console.error('Error showing notification:', error);
      Alert.alert('Error', 'Failed to show notification');
    }
  };

  // Check and request permissions
  const checkAndRequestPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Permission Required', 'Notifications permission is required for testing');
      return false;
    }
    
    return true;
  };

  // Wrapper function that checks permissions first
  const triggerWithPermissionCheck = async (notificationFunc: Function) => {
    const hasPermission = await checkAndRequestPermissions();
    if (!hasPermission) return;
    await notificationFunc();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Button 
        title="Test Single Notification (2s delay)" 
        onPress={() => triggerWithPermissionCheck(triggerTestNotification)} 
      />
      
      <View style={{ height: 20 }} />
      
      <Button 
        title="Show Immediate Notification" 
        onPress={() => triggerWithPermissionCheck(showNotificationNow)} 
      />
      
      <View style={{ height: 20 }} />
      
      <Button 
        title="Test Multiple Notifications" 
        onPress={() => triggerWithPermissionCheck(triggerMultipleTestNotifications)} 
      />
      
      <View style={{ height: 40 }} />
      
      <Button 
        title="Check Notification Permissions" 
        onPress={checkAndRequestPermissions} 
        color="#666"
      />
    </View>
  );
};

export default TestNotification;