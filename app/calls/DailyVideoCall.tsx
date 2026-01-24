import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DailyIframe from '@daily-co/daily-js';

const { width, height } = Dimensions.get('window');

interface DailyVideoCallProps {
  roomUrl: string;
  token?: string;
  onEndCall: () => void;
  isVideoCall?: boolean;
  userName?: string;
  userId?: string;
}

export default function DailyVideoCall({
  roomUrl,
  token,
  onEndCall,
  isVideoCall = true,
  userName = 'User',
  userId = 'user_' + Date.now(),
}: DailyVideoCallProps) {
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState<any[]>([]);
  const [localParticipant, setLocalParticipant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [callObject, setCallObject] = useState<any>(null);
  
  const callDurationRef = useRef<any>(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanupCall();
    };
  }, []);

  const initializeCall = async () => {
    try {
      setIsLoading(true);
      
      // Create Daily call object
      const newCallObject = DailyIframe.createCallObject({
        url: roomUrl,
        token: token,
        dailyConfig: {
          fastConnect: true,
          userMediaVideoConstraints: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          userMediaAudioConstraints: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
        },
        userName: userName,
      });

      setCallObject(newCallObject);

      // Set up event listeners
      newCallObject
        .on('joined-meeting', (event: any) => {
          console.log('✅ Joined meeting:', event);
          setJoined(true);
          setIsLoading(false);
          setLocalParticipant(event.participants?.local);
          
          // Start call duration timer
          callDurationRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
          }, 1000);
        })
        .on('participant-joined', (event: any) => {
          console.log('👤 Participant joined:', event.participant);
          setParticipants(prev => [...prev, event.participant]);
        })
        .on('participant-updated', (event: any) => {
          setParticipants(prev => 
            prev.map(p => 
              p.session_id === event.participant.session_id 
                ? { ...p, ...event.participant }
                : p
            )
          );
        })
        .on('participant-left', (event: any) => {
          console.log('👋 Participant left:', event.participant);
          setParticipants(prev => 
            prev.filter(p => p.session_id !== event.participant.session_id)
          );
        })
        .on('error', (error: any) => {
          console.error('❌ Daily error:', error);
          Alert.alert('Call Error', error.errorMsg || 'An error occurred');
          handleEndCall();
        })
        .on('left-meeting', () => {
          console.log('🚪 Left meeting');
          cleanupCall();
          onEndCall();
        })
        .on('camera-error', (error: any) => {
          console.error('📹 Camera error:', error);
          Alert.alert('Camera Error', 'Unable to access camera');
        });

      // Join the call
      const joinResult = await newCallObject.join({
        userName: userName,
        userData: {
          id: userId,
          name: userName,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userId,
        },
        startAudioOff: false,
        startVideoOff: !isVideoEnabled,
      });

      console.log('Join result:', joinResult);

    } catch (error: any) {
      console.error('❌ Error joining call:', error);
      Alert.alert('Connection Error', 'Failed to join the call: ' + error.message);
      setIsLoading(false);
      onEndCall();
    }
  };

  const cleanupCall = () => {
    if (callDurationRef.current) {
      clearInterval(callDurationRef.current);
      callDurationRef.current = null;
    }
    
    if (callObject) {
      callObject.leave();
      callObject.destroy();
      setCallObject(null);
    }
    
    setJoined(false);
    setIsLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = async () => {
    if (callObject) {
      try {
        await callObject.setLocalAudio(isMuted);
        setIsMuted(!isMuted);
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    }
  };

  const toggleVideo = async () => {
    if (callObject) {
      try {
        await callObject.setLocalVideo(isVideoEnabled);
        setIsVideoEnabled(!isVideoEnabled);
      } catch (error) {
        console.error('Error toggling video:', error);
      }
    }
  };

  const toggleSpeaker = () => {
    // Speaker control is handled automatically by Daily.co on mobile
    setIsSpeakerEnabled(!isSpeakerEnabled);
  };

  const switchCamera = async () => {
    if (callObject) {
      try {
        await callObject.cycleCamera();
      } catch (error) {
        console.error('Error switching camera:', error);
      }
    }
  };

  const handleEndCall = async () => {
    cleanupCall();
    onEndCall();
  };

  // Render video tracks
  const renderVideoTracks = () => {
    const remoteParticipants = participants.filter(p => !p.local);
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Joining call...</Text>
        </View>
      );
    }

    if (remoteParticipants.length === 0) {
      return (
        <View style={styles.waitingContainer}>
          <Ionicons name="people-outline" size={60} color="#666" />
          <Text style={styles.waitingText}>Waiting for others to join...</Text>
          <Text style={styles.roomInfo}>Room: {roomUrl.split('/').pop()}</Text>
        </View>
      );
    }

    return (
      <View style={styles.remoteContainer}>
        {remoteParticipants.map((participant) => (
          <View key={participant.session_id} style={styles.remoteVideoContainer}>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                {participant.user_name || 'Remote User'}
              </Text>
              {!participant.video && (
                <View style={styles.videoOffBadge}>
                  <Ionicons name="videocam-off" size={16} color="#FFF" />
                </View>
              )}
              {!participant.audio && (
                <View style={styles.audioOffBadge}>
                  <Ionicons name="mic-off" size={16} color="#FFF" />
                </View>
              )}
            </View>
            <View style={styles.videoWrapper}>
              <Text style={styles.placeholderText}>
                {participant.user_name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderLocalPreview = () => {
    if (!isVideoCall) {
      return (
        <View style={styles.localAudioContainer}>
          <View style={styles.audioAvatar}>
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
            <Text style={styles.audioName}>You</Text>
            {isMuted && (
              <View style={styles.mutedIndicator}>
                <Ionicons name="mic-off" size={16} color="#FFF" />
              </View>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.localContainer}>
        <View style={styles.localVideoWrapper}>
          <Text style={styles.localPlaceholderText}>
            {userName.charAt(0).toUpperCase()}
          </Text>
          {!isVideoEnabled && (
            <View style={styles.videoDisabled}>
              <Ionicons name="videocam-off" size={20} color="#FFF" />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.callInfo}>
            {isVideoCall ? 'Video Call' : 'Voice Call'} • {formatDuration(callDuration)}
            {' • '}{joined ? 'Connected' : 'Connecting...'}
          </Text>
          <Text style={styles.participantCount}>
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.endButton} onPress={handleEndCall}>
          <Ionicons name="call" size={24} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Video Area */}
      <View style={styles.videoContainer}>
        {renderVideoTracks()}
        
        {/* Local preview */}
        {renderLocalPreview()}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
          disabled={isLoading}
        >
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#FFF" />
          <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {isVideoCall && (
          <TouchableOpacity
            style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
            onPress={toggleVideo}
            disabled={isLoading}
          >
            <Ionicons name={isVideoEnabled ? 'videocam' : 'videocam-off'} size={24} color="#FFF" />
            <Text style={styles.controlText}>{isVideoEnabled ? 'Video Off' : 'Video On'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, !isSpeakerEnabled && styles.controlButtonActive]}
          onPress={toggleSpeaker}
          disabled={isLoading}
        >
          <Ionicons name={isSpeakerEnabled ? 'volume-high' : 'volume-mute'} size={24} color="#FFF" />
          <Text style={styles.controlText}>Speaker</Text>
        </TouchableOpacity>

        {isVideoCall && (
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={switchCamera}
            disabled={isLoading}
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
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
  participantCount: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  endButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  remoteContainer: {
    flex: 1,
  },
  remoteVideoContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#333',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  participantName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  videoOffBadge: {
    backgroundColor: '#FF5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  audioOffBadge: {
    backgroundColor: '#FF5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  localVideoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  localPlaceholderText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
  },
  localAudioContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2196F3',
    zIndex: 100,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  avatarText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
  },
  audioName: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 10,
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
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
    textAlign: 'center',
  },
  roomInfo: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
    minWidth: 80,
    borderRadius: 10,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  controlText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
});