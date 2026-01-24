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
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useVideo } from '@/contexts/VideoContext';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface JitsiVideoCallProps {
  roomUrl: string;
  token?: string;
  onEndCall: () => void;
  isVideoCall?: boolean;
  userName?: string;
  userId?: string;
  roomName: string;
  configOverwrite?: Record<string, any>;
  interfaceConfigOverwrite?: Record<string, any>;
}

export default function JitsiVideoCall({
  roomUrl,
  token,
  onEndCall,
  isVideoCall = true,
  userName = 'User',
  userId = 'user_' + Date.now(),
  roomName,
  configOverwrite = {},
  interfaceConfigOverwrite = {},
}: JitsiVideoCallProps) {
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState(0);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState(true);
  
  const webViewRef = useRef<WebView>(null);
  const callDurationRef = useRef<number | null>(null);
  const { toggleMute, toggleVideo, toggleSpeaker } = useVideo();

  // Handle Android back button
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

  // Timer for call duration
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

  const toggleVideoLocal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVideoEnabled(!isVideoEnabled);
    toggleVideo();
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        try {
          const api = window.JitsiMeetExternalAPI;
          if (api) {
            api.executeCommand('toggleVideo');
          }
        } catch (error) {
          console.log('Error toggling video:', error);
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

  const switchCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        try {
          const api = window.JitsiMeetExternalAPI;
          if (api) {
            api.executeCommand('switchCamera');
          }
        } catch (error) {
          console.log('Error switching camera:', error);
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
          console.log('✅ Joined Jitsi conference');
          break;
          
        case 'participantJoined':
          setParticipants(prev => prev + 1);
          console.log('👤 Participant joined. Total:', participants + 1);
          break;
          
        case 'participantLeft':
          setParticipants(prev => Math.max(0, prev - 1));
          console.log('👋 Participant left. Total:', participants - 1);
          
          // If last participant left, show alert
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
          
        case 'cameraError':
          console.error('📹 Camera error:', data.error);
          setHasCameraPermission(false);
          Alert.alert('Camera Access', 'Unable to access camera. Please check permissions.');
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

  // Generate Jitsi HTML with proper configuration
  const jitsiHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>StaffNest Video Call</title>
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
    
    .error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      max-width: 300px;
      z-index: 1000;
    }
    
    .error h3 {
      color: #FF5252;
      margin-bottom: 10px;
    }
    
    .error p {
      color: #FFF;
      margin-bottom: 15px;
      font-size: 14px;
    }
    
    .retry-button {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      font-size: 14px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="jitsi-container"></div>
  
  <div class="loading" id="loading">
    <div class="loading-spinner"></div>
    <p>Joining video call...</p>
  </div>
  
  <script src="https://${process.env.EXPO_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'}/external_api.js"></script>
  <script>
    (function() {
      try {
        console.log('Initializing Jitsi Meet...');
        
        // Default configuration
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
            // Mobile optimization
            disableDeepLinking: true,
            disableInviteFunctions: true,
            disablePrejoinPage: true,
            prejoinPageEnabled: false,
            requireDisplayName: true,
            enableClosePage: false,
            
            // Audio/Video defaults
            startWithAudioMuted: ${isMuted},
            startWithVideoMuted: ${!isVideoEnabled},
            enableNoAudioDetection: true,
            enableNoisyMicDetection: true,
            
            // Performance
            disableAudioLevels: false,
            enableLayerSuspension: true,
            
            // UI/UX
            disableProfile: true,
            enableEmailInStats: false,
            enableWelcomePage: false,
            
            // Features
            enableRecording: false,
            liveStreamingEnabled: false,
            transcribingEnabled: false,
            hideConferenceTimer: false,
            
            // Custom settings
            ...${JSON.stringify(configOverwrite || {})}
          },
          interfaceConfigOverwrite: {
            // Toolbar customization
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'info', 'chat', 'settings',
              'raisehand', 'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
            ],
            
            // UI elements
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            DISABLE_VIDEO_BACKGROUND: false,
            DISABLE_PRESENCE_STATUS: false,
            DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
            
            // Branding
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
            
            // Mobile specific
            MOBILE_DOWNLOAD_LINK_ENABLED: false,
            NATIVE_APP_NAME: 'StaffNest',
            APP_NAME: 'StaffNest',
            PROVIDER_NAME: 'StaffNest',
            
            // Privacy
            GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
            RANDOM_MEETING_ID_LENGTH: 10,
            
            // Custom interface config
            ...${JSON.stringify(interfaceConfigOverwrite || {})}
          },
          onload: function() {
            console.log('Jitsi Meet API loaded');
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
          console.log('Conference joined');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'conferenceJoined'
          }));
        });

        api.on('videoConferenceLeft', () => {
          console.log('Conference left');
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

        api.on('cameraError', (error) => {
          console.error('Camera error:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'cameraError',
            error: error.message || 'Camera error'
          }));
        });

        api.on('micError', (error) => {
          console.error('Microphone error:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'microphoneError',
            error: error.message || 'Microphone error'
          }));
        });

        // Handle errors in loading
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
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.callInfo}>
            {isVideoCall ? 'Video Call' : 'Voice Call'} • {formatDuration(callDuration)}
            {' • '}{joined ? `${participants} participant${participants !== 1 ? 's' : ''}` : 'Connecting...'}
          </Text>
          {!hasCameraPermission && (
            <Text style={styles.warningText}>⚠️ Camera access needed</Text>
          )}
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

      {/* WebView Container */}
      <View style={styles.videoContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Connecting to Jitsi Meet...</Text>
            <Text style={styles.roomInfo}>Room: {roomName}</Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ html: jitsiHtml }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          onMessage={handleWebViewMessage}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => {
            console.log('WebView loaded');
            setTimeout(() => setIsLoading(false), 2000);
          }}
          onError={(error) => {
            console.error('WebView error:', error);
            Alert.alert('WebView Error', 'Failed to load Jitsi Meet');
            setIsLoading(false);
          }}
          onHttpError={(error) => {
            console.error('WebView HTTP error:', error);
            Alert.alert('Network Error', 'Failed to connect to Jitsi');
            setIsLoading(false);
          }}
          injectedJavaScript={`
            // Prevent zoom on mobile
            const meta = document.createElement('meta');
            meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
            meta.setAttribute('name', 'viewport');
            document.getElementsByTagName('head')[0].appendChild(meta);
            
            // Prevent context menu
            document.addEventListener('contextmenu', function(e) {
              e.preventDefault();
            });
            
            true;
          `}
          scrollEnabled={false}
          bounces={false}
        />
      </View>

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

        {isVideoCall && (
          <TouchableOpacity
            style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
            onPress={toggleVideoLocal}
            disabled={isLoading || !hasCameraPermission}
          >
            <Ionicons 
              name={isVideoEnabled ? 'videocam' : 'videocam-off'} 
              size={24} 
              color="#FFF" 
            />
            <Text style={styles.controlText}>{isVideoEnabled ? 'Video Off' : 'Video On'}</Text>
          </TouchableOpacity>
        )}

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

        {isVideoCall && (
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={switchCamera}
            disabled={isLoading || !hasCameraPermission}
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
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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