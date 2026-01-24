import api from './api';

export const callService = {
  // Initiate a call
   initiateCall: async (receiverId: string, callType: 'voice' | 'video', conversationId?: string) => {
    try {
      console.log('CallService: Initiating call to:', receiverId);
      const response = await api.post('/calls/initiate', {
        receiverId,
        callType,
        conversationId,
      });
      
      console.log('CallService: Response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('CallService: Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Accept a call
  acceptCall: async (callId: string) => {
    const response = await api.post(`/calls/${callId}/accept`);
    return response.data;
  },

  // Reject a call
  rejectCall: async (callId: string) => {
    const response = await api.post(`/calls/${callId}/reject`);
    return response.data;
  },

  // End a call
  endCall: async (callId: string) => {
    const response = await api.post(`/calls/${callId}/end`);
    return response.data;
  },

  // Get call history
  getCallHistory: async (limit?: number, skip?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    
    const response = await api.get(`/calls/history?${params.toString()}`);
    return response.data;
  },

  // Get active call
  getActiveCall: async () => {
    const response = await api.get('/calls/active');
    return response.data;
  },

  // Get call by ID
  getCallById: async (callId: string) => {
    const response = await api.get(`/calls/${callId}`);
    return response.data;
  },

  // Jitsi specific endpoints
  getJitsiToken: async (roomName: string, userName: string, isOwner = false) => {
    const response = await api.post('/calls/jitsi/token', {
      roomName,
      userName,
      isOwner,
    });
    return response.data;
  },

  validateJitsiRoom: async (roomName: string) => {
    const response = await api.get(`/calls/jitsi/room/${roomName}/validate`);
    return response.data;
  },

  getJitsiRoomConfig: async (roomName: string) => {
    const response = await api.get(`/calls/jitsi/room/${roomName}/config`);
    return response.data;
  },

  // Mark user as joined
  markUserJoined: async (callId: string) => {
    const response = await api.post(`/calls/${callId}/join`);
    return response.data;
  },
};