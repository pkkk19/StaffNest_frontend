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
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

interface DailyVideoCallSimpleProps {
  roomUrl: string;
  token?: string;
  onEndCall: () => void;
  isVideoCall?: boolean;
  userName?: string;
  userId?: string;
}

export default function DailyVideoCallSimple({
  roomUrl,
  token,
  onEndCall,
  isVideoCall = true,
  userName = 'User',
  userId = 'user_' + Date.now(),
}: DailyVideoCallSimpleProps) {
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [callDuration, setCallDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const webViewRef = useRef<WebView>(null);
  const callDurationRef = useRef<any>(null);

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
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.dailyCall) {
          window.dailyCall.leave();
        }
      `);
    }
    
    if (callDurationRef.current) {
      clearInterval(callDurationRef.current);
    }
    
    onEndCall();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.dailyCall) {
          window.dailyCall.setLocalAudio(${!isMuted});
        }
      `);
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.dailyCall) {
          window.dailyCall.setLocalVideo(${!isVideoEnabled});
        }
      `);
    }
  };

  const switchCamera = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.dailyCall) {
          window.dailyCall.cycleCamera();
        }
      `);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'joined':
          setJoined(true);
          setIsLoading(false);
          break;
        case 'error':
          Alert.alert('Daily.co Error', data.error);
          setIsLoading(false);
          onEndCall();
          break;
        case 'left':
          handleEndCall();
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const dailyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Daily.co Call</title>
  <script crossorigin src="https://unpkg.com/@daily-co/daily-js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background: #000;
      height: 100vh;
      overflow: hidden;
    }
    
    #container {
      width: 100%;
      height: 100%;
      position: relative;
    }
    
    #daily-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="container">
    <div class="loading" id="loading">Loading Daily.co call...</div>
  </div>
  
  <script>
    (async function() {
      try {
        // Create Daily call object
        const call = window.DailyIframe.createCallObject();
        window.dailyCall = call;
        
        // Join the call
        await call.join({
          url: '${roomUrl}',
          ${token ? `token: '${token}',` : ''}
          userName: '${userName}',
          startVideoOff: ${!isVideoCall},
          startAudioOff: false,
        });
        
        // Notify React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'joined'
        }));
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
        
        // Mount the iframe
        await call.iframe({
          iframeStyle: {
            position: 'fixed',
            width: '100%',
            height: '100%',
            border: 'none'
          },
          showLeaveButton: false,
          showFullscreenButton: true,
          theme: {
            colors: {
              accent: '#007AFF',
              accentText: '#FFFFFF',
              background: '#000000',
              backgroundAccent: '#1A1A1A',
              baseText: '#FFFFFF',
              border: '#333333'
            }
          }
        }).mount(document.getElementById('container'));
        
        // Set up event listeners
        call.on('left-meeting', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'left'
          }));
        });
        
        call.on('error', (e) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            error: e.errorMsg || 'Unknown error'
          }));
        });
        
      } catch (error) {
        console.error('Daily.co error:', error);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          error: error.message || 'Failed to join call'
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
            {' • '}{joined ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.endButton} onPress={handleEndCall}>
          <Ionicons name="call" size={24} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* WebView Container */}
      <View style={styles.videoContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Connecting to Daily.co...</Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ html: dailyHtml }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          onLoadEnd={() => setIsLoading(false)}
          onError={(error) => {
            console.error('WebView error:', error);
            Alert.alert('WebView Error', 'Failed to load Daily.co');
            onEndCall();
          }}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
          disabled={!joined}
        >
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#FFF" />
          <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {isVideoCall && (
          <TouchableOpacity
            style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
            onPress={toggleVideo}
            disabled={!joined}
          >
            <Ionicons name={isVideoEnabled ? 'videocam' : 'videocam-off'} size={24} color="#FFF" />
            <Text style={styles.controlText}>{isVideoEnabled ? 'Video Off' : 'Video On'}</Text>
          </TouchableOpacity>
        )}

        {isVideoCall && (
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={switchCamera}
            disabled={!joined}
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