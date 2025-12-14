import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '@/contexts/CallContext';

const { width, height } = Dimensions.get('window');

export const CallScreen = () => {
  const { activeCall, endCall, callType, isInCall } = useCall();
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<number | null>(null); // Changed from NodeJS.Timeout to number

  useEffect(() => {
    if (isInCall && activeCall) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000) as unknown as number; // Type assertion for React Native
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [isInCall, activeCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (activeCall?._id) endCall(activeCall._id);
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!isInCall || !activeCall) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.callerName}>
          {activeCall.receiver?.first_name} {activeCall.receiver?.last_name}
        </Text>
        <Text style={styles.callStatus}>
          {callType === 'video' ? 'Video Call' : 'Voice Call'}
        </Text>
        <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={120} color="#007AFF" />
        </View>
        <Text style={styles.statusText}>Call in progress...</Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, isMuted && styles.controlButtonActive]} 
          onPress={() => setIsMuted(!isMuted)}
        >
          <Ionicons 
            name={isMuted ? "mic-off" : "mic"} 
            size={24} 
            color="white" 
          />
          <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="volume-high" size={24} color="white" />
          <Text style={styles.controlText}>Speaker</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.endCallButton]} 
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={24} color="white" />
          <Text style={styles.controlText}>End</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingBottom: 15,
  },
  callerName: {
    fontSize: 24,
    color: 'white',
    fontWeight: '600',
  },
  callStatus: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 5,
  },
  callDuration: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  avatar: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 4,
    borderColor: '#007AFF',
  },
  statusText: {
    fontSize: 22,
    color: 'white',
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 25,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#444',
  },
  endCallButton: {
    backgroundColor: '#F44336',
  },
  controlText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
});