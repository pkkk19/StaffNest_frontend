// contexts/videoContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import type {
  HMSConfig,
  HMSUpdateListenerActions,
  HMSRoom,
  HMSRole,
  HMSPeer,
  HMSMessage,
  HMSException,
  HMSSDK,
  HMSVideoTrack,
  HMSAudioTrack,
} from '@100mslive/react-native-hms';
import { videoService, JoinRoomRequest, TokenResponse } from '@/services/videoService';
import { useAuth } from './AuthContext';

interface VideoContextType {
  // State
  isInCall: boolean;
  callType: 'video' | 'voice' | 'screen' | null;
  currentRoom: HMSRoom | null;
  localPeer: HMSPeer | null;
  remotePeers: HMSPeer[];
  messages: HMSMessage[];
  
  // Room Actions
  joinRoom: (roomId: string, asViewer?: boolean) => Promise<void>;
  leaveRoom: () => Promise<void>;
  createAndJoinRoom: (roomName: string) => Promise<void>;
  
  // Media Controls
  toggleMute: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleSpeaker: () => Promise<void>;
  switchCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  
  // Call Controls
  sendMessage: (message: string) => Promise<void>;
  raiseHand: () => Promise<void>;
  changeRole: (peerId: string, role: string) => Promise<void>;
  
  // UI State
  showVideoScreen: boolean;
  setShowVideoScreen: (show: boolean) => void;
  
  // Status
  isLocalAudioMuted: boolean;
  isLocalVideoMuted: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isHandRaised: boolean;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

// Check if HMS is available
const isHMSAvailable = Platform.OS !== 'web';

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<'video' | 'voice' | 'screen' | null>(null);
  const [currentRoom, setCurrentRoom] = useState<HMSRoom | null>(null);
  const [localPeer, setLocalPeer] = useState<HMSPeer | null>(null);
  const [remotePeers, setRemotePeers] = useState<HMSPeer[]>([]);
  const [messages, setMessages] = useState<HMSMessage[]>([]);
  const [showVideoScreen, setShowVideoScreen] = useState(false);
  
  // Media states
  const [isLocalAudioMuted, setIsLocalAudioMuted] = useState(false);
  const [isLocalVideoMuted, setIsLocalVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  
  const hmsInstanceRef = useRef<HMSSDK | null>(null);
  const appState = useRef(AppState.currentState);

  // Join a video room
  const joinRoom = useCallback(async (roomId: string, asViewer: boolean = false) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Joining room:', roomId);
      
      // Get token from backend
      const tokenData: TokenResponse = await videoService.joinRoom({
        room_id: roomId,
        role: asViewer ? 'viewer' : 'guest',
      });

      // Import the HMS SDK
      const HMS = await import('@100mslive/react-native-hms');
      
      // Initialize HMS SDK
      const hmsInstance = await HMS.HMSSDK.build();
      hmsInstanceRef.current = hmsInstance;
      
      // Create config
      const config: HMSConfig = {
        authToken: tokenData.token,
        username: tokenData.user_name,
        metadata: JSON.stringify({
          user_id: tokenData.user_id,
          isHandRaised: false,
        }),
        captureNetworkQualityInPreview: true,
      };
      
      // Add event listeners
      hmsInstance.addEventListener(
        HMS.HMSUpdateListenerActions.ON_JOIN,
        (data: { room: HMSRoom; localPeer: HMSPeer }) => {
          console.log('Joined room successfully:', data.room.id);
          setCurrentRoom(data.room);
          setLocalPeer(data.localPeer);
          setIsInCall(true);
          setShowVideoScreen(true);
          setCallType('video');
        }
      );
      
      hmsInstance.addEventListener(
        HMS.HMSUpdateListenerActions.ON_PEER_UPDATE,
        (data: { room: HMSRoom; peer: HMSPeer; type: string }) => {
          console.log('Peer update:', data.type, data.peer.name);
          
          if (data.peer.isLocal) {
            setLocalPeer(data.peer);
            // Update local media states based on peer tracks
            updateLocalMediaStates(data.peer);
            return;
          }
          
          switch (data.type) {
            case 'PEER_JOINED':
              setRemotePeers(prev => {
                if (!prev.find(p => p.peerID === data.peer.peerID)) {
                  return [...prev, data.peer];
                }
                return prev;
              });
              break;
              
            case 'PEER_LEFT':
              setRemotePeers(prev => prev.filter(p => p.peerID !== data.peer.peerID));
              break;
              
            case 'PEER_UPDATED':
              setRemotePeers(prev => 
                prev.map(p => p.peerID === data.peer.peerID ? data.peer : p)
              );
              break;
          }
        }
      );
      
      hmsInstance.addEventListener(
        HMS.HMSUpdateListenerActions.ON_MESSAGE,
        (message: HMSMessage) => {
          console.log('Message received:', message);
          setMessages(prev => [...prev, message]);
        }
      );
      
      hmsInstance.addEventListener(
        HMS.HMSUpdateListenerActions.ON_ROOM_UPDATE,
        (data: { room: HMSRoom; type: string }) => {
          console.log('Room update:', data.type);
          setCurrentRoom(data.room);
        }
      );
      
      hmsInstance.addEventListener(
        HMS.HMSUpdateListenerActions.ON_ERROR,
        (error: HMSException) => {
          console.error('HMS Error:', error);
          Alert.alert('Video Error', error.description || 'An error occurred');
        }
      );
      
      // Track update listener for mute/unmute
      hmsInstance.addEventListener(
        HMS.HMSUpdateListenerActions.ON_TRACK_UPDATE,
        (data: { peer: HMSPeer; track: HMSAudioTrack | HMSVideoTrack; type: string }) => {
          if (data.peer.isLocal) {
            updateLocalMediaStates(data.peer);
          }
        }
      );
      
      // Join the room
      await hmsInstance.join(config);
      console.log('Join request sent');
      
    } catch (error: any) {
      console.error('Error joining room:', error);
      Alert.alert('Join Failed', error.message || 'Failed to join video room');
    }
  }, [user]);

  // Helper function to update local media states
  const updateLocalMediaStates = useCallback((peer: HMSPeer) => {
  const audioTrack = peer.audioTrack as HMSAudioTrack | undefined;
  const videoTrack = peer.videoTrack as HMSVideoTrack | undefined;

  setIsLocalAudioMuted(audioTrack?.isMute() ?? true);
  setIsLocalVideoMuted(videoTrack?.isMute() ?? true);
}, []);


  // Create and join a new room
  const createAndJoinRoom = useCallback(async (roomName: string) => {
    try {
      const roomData = await videoService.createRoom({
        name: roomName,
        description: `StaffNest call with ${user?.first_name}`,
      });
      
      await joinRoom(roomData.id);
      
    } catch (error: any) {
      console.error('Error creating room:', error);
      Alert.alert('Create Failed', error.message || 'Failed to create video room');
    }
  }, [user, joinRoom]);

  // Leave the current room
  const leaveRoom = useCallback(async () => {
    try {
      if (hmsInstanceRef.current && currentRoom) {
        await hmsInstanceRef.current.leave();
        
        // End room on backend if user is host
        const userRole = localPeer?.role?.name;
        if (userRole === 'host' || userRole === 'broadcaster') {
          await videoService.endRoom(currentRoom.id);
        }
      }
      
      // Cleanup
      hmsInstanceRef.current = null;
      setCurrentRoom(null);
      setLocalPeer(null);
      setRemotePeers([]);
      setMessages([]);
      setIsInCall(false);
      setShowVideoScreen(false);
      setCallType(null);
      setIsLocalAudioMuted(false);
      setIsLocalVideoMuted(false);
      setIsScreenSharing(false);
      setIsRecording(false);
      setIsHandRaised(false);
      
    } catch (error: any) {
      console.error('Error leaving room:', error);
    }
  }, [currentRoom, localPeer]);

  // Media Controls - USING CORRECT METHOD NAMES
const toggleMute = useCallback(async () => {
  if (!localPeer?.audioTrack) return;

  const audioTrack = localPeer.audioTrack as HMSAudioTrack & {
    setMute: (mute: boolean) => Promise<void>;
    isMute: () => boolean;
  };

  const nextMuteState = !audioTrack.isMute();

  await audioTrack.setMute(nextMuteState);
  setIsLocalAudioMuted(nextMuteState);
}, [localPeer]);



const toggleCamera = useCallback(async () => {
  if (!localPeer?.videoTrack) return;

  const videoTrack = localPeer.videoTrack as HMSVideoTrack & {
    setMute: (mute: boolean) => Promise<void>;
    isMute: () => boolean;
  };

  const nextMuteState = !videoTrack.isMute();

  await videoTrack.setMute(nextMuteState);
  setIsLocalVideoMuted(nextMuteState);
}, [localPeer]);



  const toggleSpeaker = useCallback(async () => {
    try {
      if (hmsInstanceRef.current) {
        // HMS SDK might handle speaker differently
        // Try to use available audio methods
        console.log('Speaker toggle - check SDK documentation for exact method');
      }
    } catch (error) {
      console.error('Error toggling speaker:', error);
    }
  }, []);

  const switchCamera = useCallback(async () => {
    try {
      if (hmsInstanceRef.current) {
        // The method might be named differently
        // Try common method names
          await (hmsInstanceRef.current as any).switchCamera();
      }
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (hmsInstanceRef.current) {
        if (isScreenSharing) {
          await hmsInstanceRef.current.stopScreenshare();
          setCallType('video');
        } else {
          await hmsInstanceRef.current.startScreenshare();
          setCallType('screen');
        }
        setIsScreenSharing(!isScreenSharing);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }, [isScreenSharing]);

  const startRecording = useCallback(async () => {
    try {
      if (hmsInstanceRef.current && currentRoom) {
        // Check if user can start recording
        const userRole = localPeer?.role?.name;
        if (userRole === 'host' || userRole === 'broadcaster') {
          // Start RTMP/Recording (requires backend setup)
          console.log('Starting recording...');
          setIsRecording(true);
        }
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [currentRoom, localPeer]);

  const stopRecording = useCallback(async () => {
    try {
      if (isRecording && hmsInstanceRef.current) {
        console.log('Stopping recording...');
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }, [isRecording]);

  // Chat and Interaction
  const sendMessage = useCallback(async (message: string) => {
    try {
      if (hmsInstanceRef.current && message.trim()) {
        await hmsInstanceRef.current.sendBroadcastMessage(message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, []);

  const raiseHand = useCallback(async () => {
    try {
      if (hmsInstanceRef.current && localPeer) {
        const newHandState = !isHandRaised;
        
        // Update metadata to show hand raised
        const metadata = localPeer.metadata ? JSON.parse(localPeer.metadata) : {};
        metadata.isHandRaised = newHandState;
        
        await hmsInstanceRef.current.changeMetadata(JSON.stringify(metadata));
        setIsHandRaised(newHandState);
      }
    } catch (error) {
      console.error('Error raising hand:', error);
    }
  }, [isHandRaised, localPeer]);

  const changeRole = useCallback(async (peerId: string, role: string) => {
    try {
      if (hmsInstanceRef.current && localPeer) {
        const userRole = localPeer.role?.name;
        if (userRole === 'host' || userRole === 'broadcaster') {
          // Find the peer to change
          const peerToChange = remotePeers.find(p => p.peerID === peerId) || localPeer;
          // Create HMSRole object
          const roleObject: HMSRole = {
            name: role,
            permissions: {}, // Add appropriate permissions
            priority: 1, // Set appropriate priority
          };
          await hmsInstanceRef.current.changeRoleOfPeer(peerToChange, roleObject);
        }
      }
    } catch (error) {
      console.error('Error changing role:', error);
    }
  }, [localPeer, remotePeers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hmsInstanceRef.current && isInCall) {
        leaveRoom();
      }
    };
  }, []);

  // App state change handler
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground');
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('App is going to background');
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <VideoContext.Provider
      value={{
        // State
        isInCall,
        callType,
        currentRoom,
        localPeer,
        remotePeers,
        messages,
        
        // Room Actions
        joinRoom,
        leaveRoom,
        createAndJoinRoom,
        
        // Media Controls
        toggleMute,
        toggleCamera,
        toggleSpeaker,
        switchCamera,
        toggleScreenShare,
        startRecording,
        stopRecording,
        
        // Call Controls
        sendMessage,
        raiseHand,
        changeRole,
        
        // UI State
        showVideoScreen,
        setShowVideoScreen,
        
        // Status
        isLocalAudioMuted,
        isLocalVideoMuted,
        isScreenSharing,
        isRecording,
        isHandRaised,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
}