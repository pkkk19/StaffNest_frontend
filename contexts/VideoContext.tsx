// contexts/VideoContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { socketService } from '@/services/socketService';
import { callService } from '@/services/callService';

interface CallInfo {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callType: 'voice' | 'video';
  roomName: string;
  token?: string;
  uid?: number;
  conversationId?: string;
  jitsiRoomUrl: string;
  jitsiConfig?: {
    configOverwrite?: Record<string, any>;
    interfaceConfigOverwrite?: Record<string, any>;
  };
}

interface VideoContextType {
  incomingCall: CallInfo | null;
  activeCall: CallInfo | null;
  callType: 'voice' | 'video';
  isInCall: boolean;
  isCallActive: boolean;
  isMuted: boolean;
  isSpeakerEnabled: boolean;
  isVideoEnabled: boolean;
  callError: string | null;
  showVideoScreen: boolean;
  initiateCall: (receiverId: string, callType: 'voice' | 'video', conversationId?: string) => Promise<any>;
  acceptCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: (callId?: string) => Promise<void>;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  setShowVideoScreen: (show: boolean) => void;
  setCallError: (error: string | null) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [incomingCall, setIncomingCall] = useState<CallInfo | null>(null);
  const [activeCall, setActiveCall] = useState<CallInfo | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [showVideoScreen, setShowVideoScreen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('video');
  const [callError, setCallError] = useState<string | null>(null);

  const callIdRef = useRef<string>('');

  // Cleanup function
  const cleanupCall = () => {
    setIsInCall(false);
    setIsCallActive(false);
    setShowVideoScreen(false);
    setActiveCall(null);
    setIncomingCall(null);
    setCallError(null);
    setIsMuted(false);
    setIsVideoEnabled(true);
    setIsSpeakerEnabled(true);
    callIdRef.current = '';
  };

  // Socket event listeners
  useEffect(() => {
    // Listen for incoming calls
    const handleIncomingCall = (data: any) => {
      console.log('📞 Incoming call via socket:', data);
      
      const callInfo: CallInfo = {
        callId: data.callId,
        callerId: data.callerId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        callType: data.callType || 'video',
        roomName: data.roomName,
        token: data.token,
        conversationId: data.conversationId,
        jitsiRoomUrl: data.jitsiRoomUrl,
        jitsiConfig: data.jitsiConfig,
      };
      
      setIncomingCall(callInfo);
      setCallType(data.callType || 'video');
      
      // Show notification
      Alert.alert(
        'Incoming Call',
        `${data.callerName} is ${data.callType === 'video' ? 'video' : 'voice'} calling...`,
        [
          { 
            text: 'Decline', 
            onPress: () => rejectCall(data.callId), 
            style: 'destructive' 
          },
          { 
            text: 'Accept', 
            onPress: () => acceptCall(data.callId) 
          }
        ],
        { cancelable: false }
      );
    };

    const handleCallAccepted = (data: any) => {
      console.log('✅ Call accepted via socket:', data);
      if (activeCall?.callId === data.callId) {
        setShowVideoScreen(true);
        setIsInCall(true);
        setIsCallActive(true);
      }
    };

    const handleCallRejected = (data: { callId: string }) => {
      console.log('❌ Call rejected via socket:', data);
      Alert.alert('Call Rejected', 'The call was rejected.');
      cleanupCall();
    };

    const handleCallEnded = (data: { callId: string }) => {
      console.log('📞 Call ended via socket:', data);
      Alert.alert('Call Ended', 'The call has ended.');
      cleanupCall();
    };

    const handleCallError = (data: { message: string }) => {
      console.error('❌ Call error via socket:', data.message);
      setCallError(data.message);
    };

    // Setup socket listeners
    socketService.on('incoming_call', handleIncomingCall);
    socketService.on('call_accepted', handleCallAccepted);
    socketService.on('call_rejected', handleCallRejected);
    socketService.on('call_ended', handleCallEnded);
    socketService.on('call_error', handleCallError);

    return () => {
      socketService.off('incoming_call', handleIncomingCall);
      socketService.off('call_accepted', handleCallAccepted);
      socketService.off('call_rejected', handleCallRejected);
      socketService.off('call_ended', handleCallEnded);
      socketService.off('call_error', handleCallError);
    };
  }, [activeCall]);

  // Initiate a call
  const initiateCall = async (receiverId: string, type: 'voice' | 'video', conversationId?: string) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to make calls');
      }

      setCallType(type);
      setCallError(null);
      
      // Call backend to initiate call
      const response = await callService.initiateCall(
        receiverId,
        type,
        conversationId
      );

      const callInfo: CallInfo = {
        callId: response.callId,
        callerId: user._id,
        callerName: `${user.first_name} ${user.last_name}`,
        callerAvatar: user.profile_picture_url,
        callType: type,
        roomName: response.roomName,
        token: response.token,
        uid: response.uid,
        conversationId,
        jitsiRoomUrl: response.jitsiRoomUrl,
        jitsiConfig: response.jitsiConfig,
      };

      setActiveCall(callInfo);
      callIdRef.current = response.callId;

      // Send socket notification
      const socket = socketService.getSocket();
      socket?.emit('initiate_call', {
        receiverId,
        callType: type,
        conversationId,
        callerName: `${user.first_name} ${user.last_name}`,
        callerAvatar: user.profile_picture_url,
        jitsiRoomUrl: response.jitsiRoomUrl,
        token: response.token,
        jitsiConfig: response.jitsiConfig,
      });

      setShowVideoScreen(true);
      setIsInCall(true);
      setIsCallActive(true);

      return response;

    } catch (error: any) {
      console.error('Error initiating call:', error);
      setCallError(error.message || 'Failed to initiate call');
      Alert.alert('Error', error.message || 'Failed to initiate call');
      throw error;
    }
  };

  // Accept a call
  const acceptCall = async (callId: string) => {
    try {
      if (!incomingCall || incomingCall.callId !== callId) {
        Alert.alert('Error', 'Call not found');
        return;
      }

      setCallError(null);

      const response = await callService.acceptCall(callId);

      const updatedCallInfo: CallInfo = {
        ...incomingCall,
        token: response.token,
        jitsiRoomUrl: response.jitsiRoomUrl,
        jitsiConfig: response.jitsiConfig,
        roomName: response.roomName,
      };

      setActiveCall(updatedCallInfo);
      setIncomingCall(null);
      callIdRef.current = callId;

      // Notify caller via socket
      socketService.acceptCall(callId);

      setShowVideoScreen(true);
      setIsInCall(true);
      setIsCallActive(true);

    } catch (error: any) {
      console.error('Error accepting call:', error);
      setCallError(error.message || 'Failed to accept call');
      Alert.alert('Error', error.message || 'Failed to accept call');
      cleanupCall();
    }
  };

  // Reject a call
  const rejectCall = async (callId: string) => {
    try {
      await callService.rejectCall(callId);
      socketService.rejectCall(callId);
      setIncomingCall(null);
    } catch (error: any) {
      console.error('Error rejecting call:', error);
      setCallError(error.message || 'Failed to reject call');
      Alert.alert('Error', error.message || 'Failed to reject call');
    }
  };

  // End a call
  const endCall = async (callId?: string) => {
    try {
      const idToEnd = callId || callIdRef.current;
      if (!idToEnd) {
        throw new Error('No active call to end');
      }

      await callService.endCall(idToEnd);
      socketService.endCall(idToEnd);
      cleanupCall();
      
    } catch (error: any) {
      console.error('Error ending call:', error);
      setCallError(error.message || 'Failed to end call');
      Alert.alert('Error', error.message || 'Failed to end call');
    }
  };

  // In-call controls
  const toggleMute = () => setIsMuted(!isMuted);
  const toggleSpeaker = () => setIsSpeakerEnabled(!isSpeakerEnabled);
  const toggleVideo = () => setIsVideoEnabled(!isVideoEnabled);
  const switchCamera = () => {};

  const value: VideoContextType = {
    incomingCall,
    activeCall,
    callType,
    isInCall,
    isCallActive,
    isMuted,
    isSpeakerEnabled,
    isVideoEnabled,
    callError,
    showVideoScreen,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleVideo,
    switchCamera,
    setShowVideoScreen,
    setCallError,
  };

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};