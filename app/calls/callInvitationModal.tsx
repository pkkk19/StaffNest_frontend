// app/calls/callInvitationModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useVideo } from '@/contexts/VideoContext';
import { LinearGradient } from 'expo-linear-gradient';

export function CallInvitationModal() {
  const { incomingCall, acceptCall, rejectCall, callType } = useVideo();
  const [isVisible, setIsVisible] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [ringCount, setRingCount] = useState(0);

  useEffect(() => {
    if (incomingCall) {
      console.log('📞 Incoming call modal triggered:', incomingCall);
      
      // Start ringing
      setRinging(true);
      setIsVisible(true);
      setRingCount(0);
      
      // Vibrate for incoming call
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Vibration.vibrate([500, 1000, 500, 1000], true);
      }
      
      // Play ringing sound (in a real app, you'd use Audio API)
      // For now, we'll simulate with haptics
      
      // Auto-reject after 30 seconds
      const timeout = setTimeout(() => {
        if (isVisible) {
          handleReject();
        }
      }, 30000);
      
      return () => {
        clearTimeout(timeout);
        if (Platform.OS === 'android') {
          Vibration.cancel();
        }
      };
    } else {
      setIsVisible(false);
      setRinging(false);
      if (Platform.OS === 'android') {
        Vibration.cancel();
      }
    }
  }, [incomingCall]);

  // Simulate ringing pattern
  useEffect(() => {
    if (!ringing) return;
    
    const interval = setInterval(() => {
      setRingCount(prev => prev + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [ringing]);

  const handleAccept = async () => {
    if (incomingCall) {
      setRinging(false);
      setIsVisible(false);
      if (Platform.OS === 'android') {
        Vibration.cancel();
      }
      await acceptCall(incomingCall.callId);
    }
  };

  const handleReject = async () => {
    if (incomingCall) {
      setRinging(false);
      setIsVisible(false);
      if (Platform.OS === 'android') {
        Vibration.cancel();
      }
      await rejectCall(incomingCall.callId);
    }
  };

  if (!incomingCall) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleReject}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.container}
        >
          {/* Caller Info */}
          <View style={styles.callerInfo}>
            {incomingCall.callerAvatar ? (
              <Image 
                source={{ uri: incomingCall.callerAvatar }} 
                style={styles.callerAvatar} 
              />
            ) : (
              <View style={styles.callerAvatarPlaceholder}>
                <Text style={styles.callerInitials}>
                  {incomingCall.callerName.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
            
            <Text style={styles.callerName}>{incomingCall.callerName}</Text>
            <Text style={styles.callType}>
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </Text>
            
            <View style={styles.ringingIndicator}>
              <Ionicons 
                name="phone-portrait-outline" 
                size={20} 
                color="#10B981" 
              />
              <Text style={styles.ringingText}>
                {ringing ? 'Ringing...' : 'Incoming Call'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Reject Button */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
            >
              <View style={styles.actionButtonInner}>
                <Ionicons name="call" size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
              </View>
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
            >
              <View style={styles.actionButtonInner}>
                <Ionicons 
                  name={callType === 'video' ? "videocam" : "call"} 
                  size={32} 
                  color="white" 
                />
              </View>
              <Text style={styles.actionButtonText}>
                {callType === 'video' ? 'Video' : 'Voice'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Additional Info */}
          <View style={styles.additionalInfo}>
            <Text style={styles.infoText}>
              Swipe up to answer, down to decline
            </Text>
            <Text style={styles.callId}>
              Call ID: {incomingCall.callId.substring(0, 8)}...
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  callerInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  callerAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  callerAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#2563EB',
  },
  callerInitials: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  callerName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  callType: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 15,
  },
  ringingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ringingText: {
    color: '#10B981',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  actionButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  rejectButton: {},
  rejectButtonInner: {
    backgroundColor: '#EF4444',
  },
  acceptButton: {},
  acceptButtonInner: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  additionalInfo: {
    alignItems: 'center',
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 5,
  },
  callId: {
    color: '#6B7280',
    fontSize: 10,
  },
});