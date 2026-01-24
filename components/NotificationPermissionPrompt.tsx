import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { notificationService } from '@/services/notificationService';

export const NotificationPermissionPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const enabled = await notificationService.areNotificationsEnabled();
        if (!enabled) {
          // Wait a bit before showing prompt
          setTimeout(() => setShowPrompt(true), 2000);
        }
      } catch (error) {
        console.error('Error checking notification permission:', error);
      }
    };
    
    checkPermission();
  }, []);

  const handleAllow = async () => {
    try {
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        console.log('✅ Notifications enabled');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
    setShowPrompt(false);
  };

  const handleLater = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <Modal transparent visible={showPrompt} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Enable Notifications</Text>
          <Text style={styles.message}>
            Stay updated with messages, shift reminders, and important updates.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.laterButton} onPress={handleLater}>
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.allowButton} onPress={handleAllow}>
              <Text style={styles.allowButtonText}>Allow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  laterButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  laterButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  allowButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  allowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});