// app/calls/VideoCallScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useVideo } from '@/contexts/VideoContext';

const { width, height } = Dimensions.get('window');

export default function VideoCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { activeCall, endCall, isMuted, toggleMute, isVideoEnabled, toggleVideo, isSpeakerEnabled, toggleSpeaker } = useVideo();
  
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [isConnected, setIsConnected] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    console.log('VideoCallScreen params:', params);
    
    if (!permission?.granted) {
      requestPermission();
    }
    
    const connectTimeout = setTimeout(() => {
      setCallStatus('Connected');
      setIsConnected(true);
    }, 2000);
    
    intervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(connectTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [permission]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (activeCall?.callId) {
      endCall(activeCall.callId);
    }
    router.back();
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="videocam-outline" size={80} color="#666" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          This app needs camera access to make video calls.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#F59E0B' }]} />
          <Text style={styles.callStatus}>{callStatus}</Text>
        </View>
        <Text style={styles.callTimer}>{formatTime(callDuration)}</Text>
        <Text style={styles.callerName}>
          {activeCall?.callerName || params.callerName || 'Unknown Caller'}
        </Text>
        <Text style={styles.callType}>
          {activeCall?.callType === 'voice' ? 'Voice Call' : 'Video Call'}
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        {isVideoEnabled ? (
          <CameraView
            style={styles.camera}
            facing={facing}
            mode="video"
            mute={isMuted}
          />
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="videocam-off" size={60} color="#666" />
            <Text style={styles.cameraPlaceholderText}>Camera Off</Text>
          </View>
        )}

        <View style={styles.remoteView}>
          <View style={styles.remotePlaceholder}>
            <Ionicons name="person" size={50} color="white" />
            <Text style={styles.remoteName}>
              {activeCall?.callerName || params.callerName || 'Remote Participant'}
            </Text>
            <Text style={styles.remoteStatus}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          {isVideoEnabled && (
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
              <Text style={styles.controlText}>Flip</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Ionicons 
              name={isMuted ? "mic-off" : "mic"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.controlText}>
              {isMuted ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
            onPress={toggleVideo}
          >
            <Ionicons 
              name={isVideoEnabled ? "videocam" : "videocam-off"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.controlText}>
              {isVideoEnabled ? 'Video Off' : 'Video On'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, isSpeakerEnabled && styles.controlButtonActive]}
            onPress={toggleSpeaker}
          >
            <Ionicons 
              name={isSpeakerEnabled ? "volume-high" : "volume-mute"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.controlText}>
              {isSpeakerEnabled ? 'Speaker' : 'Earpiece'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.endCallButton}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 30,
  },
  permissionTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  callStatus: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  callTimer: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  callerName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  callType: {
    color: '#999',
    fontSize: 14,
    marginTop: 5,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  camera: {
    width: width,
    height: height * 0.6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cameraPlaceholder: {
    width: width,
    height: height * 0.6,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    color: '#999',
    fontSize: 16,
    marginTop: 10,
  },
  remoteView: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  remotePlaceholder: {
    alignItems: 'center',
    padding: 10,
  },
  remoteName: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  remoteStatus: {
    color: '#10B981',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  controlsContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 25,
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 70,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  controlText: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 5,
    fontWeight: '500',
  },
  endCallButton: {
    alignSelf: 'center',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});