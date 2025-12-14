import api from './api';

export const callService = {
  // Initiate a call
  initiateCall: async (receiverId: string, callType: 'voice' | 'video', conversationId?: string) => {
    const response = await api.post('/calls/initiate', {
      receiverId,
      callType,
      conversationId,
    });
    return response.data;
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
  getCallHistory: async () => {
    const response = await api.get('/calls/history');
    return response.data;
  },

  // Get active call
  getActiveCall: async () => {
    const response = await api.get('/calls/active');
    return response.data;
  },

  // Generate Agora token
  generateToken: async (channelName: string, uid: number) => {
    const response = await api.post(`/calls/token/${channelName}`, { uid });
    return response.data;
  },
};