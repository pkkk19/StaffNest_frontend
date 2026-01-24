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
  Image,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useVideo } from '@/contexts/VideoContext';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface JitsiAudioCallProps {
  roomUrl: string;
  token?: string;
  onEndCall: () => void;
  userName?: string;
  userId?: string;
  roomName: string;
  otherParticipantName?: string;
  otherParticipantAvatar?: string;
}

export default function JitsiAudioCall({
  roomUrl,
  token,
  onEndCall,
  userName = 'User',
  userId = 'user_' + Date.now(),
  roomName,
  otherParticipantName = 'Participant',
  otherParticipantAvatar,
}: JitsiAudioCallProps) {
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState(0);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState(true);
  
  const webViewRef = useRef<WebView>(null);
  const callDurationRef = useRef<number | null>(null);
  const { toggleMute, toggleSpeaker } = useVideo();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        Alert.alert(
          'End Call',
          'Are you sure you want to end the call?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'End Call', style: 'destructive', onPress: handleEndCall }
          ]
        );
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (joined) {
      callDurationRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
      }
    };
  }, [joined]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        try {
          const api = window.JitsiMeetExternalAPI;
          if (api) {
            api.executeCommand('hangup');
            api.dispose();
          }
        } catch (error) {
          console.log('Error ending call:', error);
        }
      `);
    }
    
    if (callDurationRef.current) {
      clearInterval(callDurationRef.current);
    }
    
    onEndCall();
  };

  const toggleMuteLocal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(!isMuted);
    toggleMute();
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        try {
          const api = window.JitsiMeetExternalAPI;
          if (api) {
            api.executeCommand('toggleAudio');
          }
        } catch (error) {
          console.log('Error toggling audio:', error);
        }
      `);
    }
  };

  const toggleSpeakerLocal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSpeakerEnabled(!isSpeakerEnabled);
    toggleSpeaker();
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        try {
          const api = window.JitsiMeetExternalAPI;
          if (api) {
            api.executeCommand('toggleAudioOutput');
          }
        } catch (error) {
          console.log('Error toggling speaker:', error);
        }
      `);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'conferenceJoined':
          setJoined(true);
          setIsLoading(false);
          console.log('✅ Joined Jitsi audio conference');
          break;
          
        case 'participantJoined':
          setParticipants(prev => prev + 1);
          console.log('👤 Participant joined. Total:', participants + 1);
          break;
          
        case 'participantLeft':
          setParticipants(prev => Math.max(0, prev - 1));
          console.log('👋 Participant left. Total:', participants - 1);
          
          if (participants - 1 === 0 && joined) {
            Alert.alert(
              'Call Ended',
              'All participants have left the call.',
              [{ text: 'OK', onPress: handleEndCall }]
            );
          }
          break;
          
        case 'conferenceLeft':
          console.log('🚪 Left conference');
          handleEndCall();
          break;
          
        case 'error':
          console.error('❌ Jitsi error:', data.error);
          Alert.alert('Jitsi Error', data.error);
          setIsLoading(false);
          break;
          
        case 'microphoneError':
          console.error('🎤 Microphone error:', data.error);
          setHasMicrophonePermission(false);
          Alert.alert('Microphone Access', 'Unable to access microphone. Please check permissions.');
          break;
          
        case 'ready':
          console.log('✅ Jitsi API ready');
          setIsLoading(false);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Generate Jitsi HTML for audio-only call
  const jitsiHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>StaffNest Voice Call</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    
    body {
      background: #000;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }
    
    #jitsi-container {
      width: 100%;
      height: 100%;
      position: relative;
    }
    
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      text-align: center;
      z-index: 1000;
    }
    
    .loading-spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 4px solid #4CAF50;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="jitsi-container"></div>
  
  <div class="loading" id="loading">
    <div class="loading-spinner"></div>
    <p>Joining voice call...</p>
  </div>
  
  <script src="https://${process.env.EXPO_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'}/external_api.js"></script>
  <script>
    (function() {
      try {
        console.log('Initializing Jitsi Meet for audio call...');
        
        const defaultConfig = {
          roomName: '${roomName}',
          width: '100%',
          height: '100%',
          parentNode: document.querySelector('#jitsi-container'),
          userInfo: {
            displayName: '${userName}',
            email: '${userId}'
          },
          configOverwrite: {
            // Audio-only mode
            startWithAudioMuted: ${isMuted},
            startWithVideoMuted: true, // Always start with video off for audio call
            startAudioOnly: true,
            disableVideo: true,
            
            // Mobile optimization
            disableDeepLinking: true,
            disableInviteFunctions: true,
            disablePrejoinPage: true,
            prejoinPageEnabled: false,
            requireDisplayName: true,
            enableClosePage: false,
            
            // Performance
            enableNoAudioDetection: true,
            enableNoisyMicDetection: true,
            
            // UI/UX
            disableProfile: true,
            enableEmailInStats: false,
            enableWelcomePage: false,
            
            // Features
            enableRecording: false,
            liveStreamingEnabled: false,
            transcribingEnabled: false,
            hideConferenceTimer: false,
          },
          interfaceConfigOverwrite: {
            // Toolbar customization for audio
            TOOLBAR_BUTTONS: [
              'microphone', 'hangup', 'settings', 'raisehand', 
              'feedback', 'stats', 'help', 'mute-everyone'
            ],
            
            // UI elements
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            DISABLE_VIDEO_BACKGROUND: true,
            
            // Branding
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            
            // Mobile specific
            MOBILE_DOWNLOAD_LINK_ENABLED: false,
            NATIVE_APP_NAME: 'StaffNest',
            APP_NAME: 'StaffNest',
            PROVIDER_NAME: 'StaffNest',
          },
          onload: function() {
            console.log('Jitsi Meet API loaded for audio');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ready'
            }));
            document.getElementById('loading').style.display = 'none';
          }
        };

        // Add JWT token if provided
        const options = ${token ? `{
          ...defaultConfig,
          jwt: '${token}'
        }` : 'defaultConfig'};

        // Initialize Jitsi Meet
        const api = new JitsiMeetExternalAPI('${process.env.EXPO_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'}', options);
        window.JitsiMeetExternalAPI = api;

        // Event listeners
        api.on('readyToClose', () => {
          console.log('Ready to close');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'conferenceLeft'
          }));
        });

        api.on('videoConferenceJoined', () => {
          console.log('Audio conference joined');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'conferenceJoined'
          }));
        });

        api.on('videoConferenceLeft', () => {
          console.log('Audio conference left');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'conferenceLeft'
          }));
        });

        api.on('participantJoined', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'participantJoined'
          }));
        });

        api.on('participantLeft', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'participantLeft'
          }));
        });

        api.on('error', (error) => {
          console.error('Jitsi error:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            error: error.message || 'Unknown error'
          }));
        });

        api.on('micError', (error) => {
          console.error('Microphone error:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'microphoneError',
            error: error.message || 'Microphone error'
          }));
        });

        window.addEventListener('error', (error) => {
          console.error('Window error:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            error: error.message || 'Script error'
          }));
        });

      } catch (error) {
        console.error('Jitsi initialization error:', error);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          error: error.message || 'Failed to initialize Jitsi'
        }));
      }
    })();
  </script>
</body>
</html>
`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>Voice Call</Text>
          <Text style={styles.callInfo}>
            {formatDuration(callDuration)}
            {' • '}{joined ? `${participants} participant${participants !== 1 ? 's' : ''}` : 'Connecting...'}
          </Text>
          {!hasMicrophonePermission && (
            <Text style={styles.warningText}>⚠️ Microphone access needed</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.endButton} 
          onPress={handleEndCall}
        >
          <Ionicons 
            name="call" 
            size={24} 
            color="#FFF" 
            style={{ transform: [{ rotate: '135deg' }] }} 
          />
        </TouchableOpacity>
      </View>

      {/* Audio Call UI */}
      <View style={styles.audioContainer}>
        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Connecting to voice call...</Text>
            <Text style={styles.roomInfo}>Room: {roomName}</Text>
          </View>
        ) : (
          <View style={styles.audioContent}>
            {/* Other Participant Avatar */}
            <View style={styles.otherParticipant}>
              {otherParticipantAvatar ? (
                <Image 
                  source={{ uri: otherParticipantAvatar }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {otherParticipantName?.charAt(0).toUpperCase() || 'P'}
                  </Text>
                </View>
              )}
              <Text style={styles.participantName}>{otherParticipantName}</Text>
              <Text style={styles.participantStatus}>
                {participants > 1 ? 'Connected' : 'Waiting...'}
              </Text>
            </View>

            {/* Local User */}
            <View style={styles.localParticipant}>
              <View style={styles.localAvatar}>
                <Text style={styles.localAvatarText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
                {isMuted && (
                  <View style={styles.mutedBadge}>
                    <Ionicons name="mic-off" size={16} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={styles.localName}>You</Text>
            </View>

            {/* Connection Status */}
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: joined ? '#4CAF50' : '#FFA726' }
              ]} />
              <Text style={styles.statusText}>
                {joined ? 'Connected' : 'Connecting...'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* WebView (hidden, only for audio) */}
      <WebView
        ref={webViewRef}
        source={{ html: jitsiHtml }}
        style={{ width: 0, height: 0 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleWebViewMessage}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => {
          setTimeout(() => setIsLoading(false), 1000);
        }}
        onError={(error) => {
          console.error('WebView error:', error);
          Alert.alert('Connection Error', 'Failed to connect to voice call');
          setIsLoading(false);
        }}
      />

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMuteLocal}
          disabled={isLoading || !hasMicrophonePermission}
        >
          <Ionicons 
            name={isMuted ? 'mic-off' : 'mic'} 
            size={24} 
            color="#FFF" 
          />
          <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !isSpeakerEnabled && styles.controlButtonActive]}
          onPress={toggleSpeakerLocal}
          disabled={isLoading}
        >
          <Ionicons 
            name={isSpeakerEnabled ? 'volume-high' : 'volume-mute'} 
            size={24} 
            color="#FFF" 
          />
          <Text style={styles.controlText}>Speaker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => {
            Alert.alert(
              'Call Info',
              `Room: ${roomName}\nParticipants: ${participants}\nDuration: ${formatDuration(callDuration)}`
            );
          }}
        >
          <Ionicons name="information-circle" size={24} color="#FFF" />
          <Text style={styles.controlText}>Info</Text>
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
  warningText: {
    fontSize: 12,
    color: '#FFA726',
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
  audioContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 20,
  },
  roomInfo: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  audioContent: {
    width: '100%',
    alignItems: 'center',
  },
  otherParticipant: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#2E7D32',
  },
  avatarText: {
    fontSize: 48,
    color: '#FFF',
    fontWeight: 'bold',
  },
  participantName: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 5,
  },
  participantStatus: {
    fontSize: 14,
    color: '#4CAF50',
  },
  localParticipant: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
  },
  localAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1976D2',
    position: 'relative',
  },
  localAvatarText: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
  },
  mutedBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FF5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  localName: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
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
  infoButton: {
    alignItems: 'center',
    padding: 12,
    minWidth: 80,
    borderRadius: 10,
  },
  controlText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
});