import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { notificationService } from '@/services/notificationService';

interface NotificationPreferences {
  shiftReminders: boolean;
  shiftReminderMinutes: number;
  shiftEndReminders: boolean;
  shiftEndReminderMinutes: number;
  newMessages: boolean;
  friendRequests: boolean;
  payslipGenerated: boolean;
  calls: boolean;
}

export const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    shiftReminders: true,
    shiftReminderMinutes: 30,
    shiftEndReminders: true,
    shiftEndReminderMinutes: 15,
    newMessages: true,
    friendRequests: true,
    payslipGenerated: true,
    calls: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const savedPrefs = await notificationService.getNotificationPreferences();
    if (savedPrefs) {
      setPreferences(savedPrefs);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    await notificationService.updateNotificationPreferences(updated);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shift Notifications</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Shift Reminders</Text>
          <Switch
            value={preferences.shiftReminders}
            onValueChange={(value) => updatePreference('shiftReminders', value)}
          />
        </View>
        
        {preferences.shiftReminders && (
          <View style={styles.row}>
            <Text style={styles.label}>Remind me (minutes before)</Text>
            <View style={styles.timeOptions}>
              {[15, 30, 60, 120].map((minutes) => (
                <Text
                  key={minutes}
                  style={[
                    styles.timeOption,
                    preferences.shiftReminderMinutes === minutes && styles.selectedTime,
                  ]}
                  onPress={() => updatePreference('shiftReminderMinutes', minutes)}
                >
                  {minutes}
                </Text>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.row}>
          <Text style={styles.label}>Shift End Reminders</Text>
          <Switch
            value={preferences.shiftEndReminders}
            onValueChange={(value) => updatePreference('shiftEndReminders', value)}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Communication</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>New Messages</Text>
          <Switch
            value={preferences.newMessages}
            onValueChange={(value) => updatePreference('newMessages', value)}
          />
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Friend Requests</Text>
          <Switch
            value={preferences.friendRequests}
            onValueChange={(value) => updatePreference('friendRequests', value)}
          />
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Calls</Text>
          <Switch
            value={preferences.calls}
            onValueChange={(value) => updatePreference('calls', value)}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payroll</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>New Payslip Generated</Text>
          <Switch
            value={preferences.payslipGenerated}
            onValueChange={(value) => updatePreference('payslipGenerated', value)}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  timeOptions: {
    flexDirection: 'row',
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedTime: {
    backgroundColor: '#007AFF',
    color: 'white',
    borderColor: '#007AFF',
  },
});