// contexts/CallContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

interface CallContextType {
  activeCall: any | null;
  incomingCall: any | null;
  isInCall: boolean;
  initiateCall: (receiverId: string, callType: 'voice' | 'video', conversationId?: string) => Promise<void>;
  acceptCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: (callId: string) => Promise<void>;
  callType: 'voice' | 'video' | null;
  remoteUser: any | null;
  showCallScreen: boolean;
  setShowCallScreen: (show: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [remoteUser, setRemoteUser] = useState<any | null>(null);
  const [showCallScreen, setShowCallScreen] = useState(false);

  const initiateCall = async (receiverId: string, callType: 'voice' | 'video', conversationId?: string) => {
    console.log('Initiating call to:', receiverId, 'Type:', callType);
    // Simulate a call for now
    setActiveCall({
      _id: 'temp-call-' + Date.now(),
      receiver: { _id: receiverId, first_name: 'Test', last_name: 'User' },
    });
    setCallType(callType);
    setIsInCall(true);
    setShowCallScreen(true);
  };

  const acceptCall = async (callId: string) => {
    console.log('Accepting call:', callId);
    setActiveCall({ _id: callId });
    setIsInCall(true);
    setShowCallScreen(true);
    setIncomingCall(null);
  };

  const rejectCall = async (callId: string) => {
    console.log('Rejecting call:', callId);
    setIncomingCall(null);
    Alert.alert('Call Rejected', 'You rejected the call');
  };

  const endCall = async (callId: string) => {
    console.log('Ending call:', callId);
    setActiveCall(null);
    setIsInCall(false);
    setShowCallScreen(false);
    Alert.alert('Call Ended', 'The call has ended');
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        isInCall,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        callType,
        remoteUser,
        showCallScreen,
        setShowCallScreen,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}