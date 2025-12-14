import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '@/contexts/CallContext';

const { width, height } = Dimensions.get('window');

export const CallInvitationModal = () => {
  const { incomingCall, acceptCall, rejectCall, callType } = useCall();

  // Vibrate on incoming call
  useEffect(() => {
    if (incomingCall) {
      Vibration.vibrate([500, 500, 500], true); // Repeat vibration pattern
      
      return () => {
        Vibration.cancel();
      };
    }
  }, [incomingCall]);

  const handleAccept = () => {
    if (incomingCall?.callId) {
      Vibration.cancel();
      acceptCall(incomingCall.callId);
    }
  };

  const handleReject = () => {
    if (incomingCall?.callId) {
      Vibration.cancel();
      rejectCall(incomingCall.callId);
    }
  };

  if (!incomingCall) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={!!incomingCall}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Caller Info */}
          <View style={styles.callerInfo}>
            <View style={styles.avatar}>
              <Ionicons 
                name="person" 
                size={60} 
                color="#007AFF" 
              />
            </View>
            <Text style={styles.callerName}>
              {incomingCall.callerName}
            </Text>
            <Text style={styles.callType}>
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]} 
              onPress={handleReject}
            >
              <Ionicons name="call" size={30} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]} 
              onPress={handleAccept}
            >
              <Ionicons 
                name={callType === 'video' ? "videocam" : "call"} 
                size={30} 
                color="white" 
              />
              <Text style={styles.buttonText}>
                {callType === 'video' ? 'Video' : 'Voice'}
              </Text>
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
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  callerInfo: {
    alignItems: 'center',
    marginBottom: 50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  callerName: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  callType: {
    fontSize: 18,
    color: '#aaa',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    marginTop: 5,
    fontSize: 14,
  },
});