// @types/react-native-jitsi-meet/index.d.ts
declare module 'react-native-jitsi-meet' {
  interface JitsiMeetUserInfo {
    displayName?: string;
    email?: string;
    avatar?: string;
  }

  interface JitsiMeetOptions {
    room?: string;
    token?: string;
    userInfo?: JitsiMeetUserInfo;
    subject?: string;
    audioOnly?: boolean;
    audioMuted?: boolean;
    videoMuted?: boolean;
    configOverwrite?: Record<string, any>;
    interfaceConfigOverwrite?: Record<string, any>;
    featureFlags?: Record<string, boolean>;
  }

  interface JitsiMeetEventData {
    url?: string;
    error?: string;
    room?: string;
  }

  export function call(room: string, options?: JitsiMeetOptions): void;
  export function endCall(): void;
  export function setAudioMuted(muted: boolean): void;
  export function setVideoMuted(muted: boolean): void;
  export function addEventListener(event: string, listener: (data: any) => void): void;
  export function removeEventListener(event: string, listener: (data: any) => void): void;
  
  export const JitsiMeetView: React.ComponentType<any>;
  
  // Common event names
  export const events: {
    CONFERENCE_JOINED: string;
    CONFERENCE_TERMINATED: string;
    CONFERENCE_WILL_JOIN: string;
    PARTICIPANT_JOINED: string;
    PARTICIPANT_LEFT: string;
    AUDIO_MUTED_CHANGED: string;
    VIDEO_MUTED_CHANGED: string;
    SCREEN_SHARE_TOGGLED: string;
    READY_TO_CLOSE: string;
  };
}
