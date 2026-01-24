// app/calls/SimpleVideoCall.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface SimpleVideoCallProps {
  appId?: string;
  channelName: string;
  onEndCall: () => void;
  isVideoCall?: boolean;
  userName?: string;
}

export default function SimpleVideoCall({
  channelName,
  onEndCall,
  isVideoCall = true,
  userName = 'User',
}: SimpleVideoCallProps) {
  const [joined, setJoined] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [peerIds] = useState([12345, 67890]); // Simulated users

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Setup audio session
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Start timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = async () => {
    try {
      if (isMuted) {
        // Unmute - simulate by playing a silent audio
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/notification.wav'), // Create a silent audio file
          { shouldPlay: true, isLooping: true, volume: 0 }
        );
        soundRef.current = sound;
      } else {
        // Mute - stop audio
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Audio error:', error);
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: !isSpeakerEnabled,
      });
      setIsSpeakerEnabled(!isSpeakerEnabled);
    } catch (error) {
      console.error('Speaker error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.callInfo}>
            {isVideoCall ? 'Video Call' : 'Voice Call'} • {formatDuration(callDuration)}
            {' • Demo Mode'}
          </Text>
        </View>
        <TouchableOpacity style={styles.endButton} onPress={onEndCall}>
          <Ionicons name="call" size={24} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Video/Audio Area */}
      <View style={styles.videoContainer}>
        {/* Simulated remote users */}
        {peerIds.length > 0 ? (
          <View style={styles.remoteContainer}>
            {peerIds.map(peerId => (
              <View key={peerId} style={styles.remoteUser}>
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="person" size={40} color="#666" />
                  <Text style={styles.placeholderText}>User {peerId}</Text>
                  <Text style={styles.demoText}>Demo Participant</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Ionicons name="people-outline" size={60} color="#666" />
            <Text style={styles.waitingText}>Waiting for others to join...</Text>
          </View>
        )}

        {/* Local view */}
        <View style={styles.localContainer}>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="person" size={30} color="#666" />
            <Text style={styles.placeholderText}>You</Text>
            {!isVideoEnabled && isVideoCall && (
              <View style={styles.videoDisabled}>
                <Ionicons name="videocam-off" size={20} color="#FFF" />
              </View>
            )}
            {isMuted && (
              <View style={styles.mutedIndicator}>
                <Ionicons name="mic-off" size={16} color="#FFF" />
              </View>
            )}
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>
            Demo mode using expo-av. For real-time video, create a development build.
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#FFF" />
          <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {isVideoCall && (
          <TouchableOpacity
            style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
            onPress={() => setIsVideoEnabled(!isVideoEnabled)}
          >
            <Ionicons name={isVideoEnabled ? 'videocam' : 'videocam-off'} size={24} color="#FFF" />
            <Text style={styles.controlText}>{isVideoEnabled ? 'Video Off' : 'Video On'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, !isSpeakerEnabled && styles.controlButtonActive]}
          onPress={toggleSpeaker}
        >
          <Ionicons name={isSpeakerEnabled ? 'volume-high' : 'volume-mute'} size={24} color="#FFF" />
          <Text style={styles.controlText}>Speaker</Text>
        </TouchableOpacity>

        {isVideoCall && (
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => Alert.alert('Info', 'Camera flip simulated')}
          >
            <Ionicons name="camera-reverse" size={24} color="#FFF" />
            <Text style={styles.controlText}>Flip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 100,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  callInfo: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  endButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  remoteContainer: {
    flex: 1,
    padding: 10,
  },
  remoteUser: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2196F3',
    zIndex: 100,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  placeholderText: {
    color: '#999',
    marginTop: 10,
    fontSize: 14,
  },
  demoText: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 5,
  },
  videoDisabled: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#FF5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  waitingText: {
    color: '#999',
    fontSize: 18,
    marginTop: 20,
  },
  infoBanner: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlButton: {
    alignItems: 'center',
    padding: 10,
    minWidth: 80,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  controlText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 5,
  },
});