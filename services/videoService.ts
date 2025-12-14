import api from './api';

export interface RoomConfig {
  name: string;
  description?: string;
  template_id?: string;
  region?: string;
}

export interface JoinRoomRequest {
  room_id?: string;
  room_name?: string;
  description?: string;
  role?: 'host' | 'guest' | 'viewer';
}

export interface TokenResponse {
  token: string;
  room_id: string;
  user_id: string;
  user_name: string;
  role: string;
  room_code?: string;
}

export const videoService = {
  // Create a new video room
  createRoom: async (config: RoomConfig) => {
    const response = await api.post('/video/create-room', config);
    return response.data;
  },

  // Join an existing room or create new
  joinRoom: async (request: JoinRoomRequest) => {
    const response = await api.post('/video/join-room', request);
    return response.data;
  },

  // Get room details
  getRoom: async (roomId: string) => {
    const response = await api.get(`/video/room/${roomId}`);
    return response.data;
  },

  // End a room
  endRoom: async (roomId: string) => {
    const response = await api.post(`/video/room/${roomId}/end`);
    return response.data;
  },

  // Get active participants
  getParticipants: async (roomId: string) => {
    const response = await api.get(`/video/room/${roomId}/participants`);
    return response.data;
  },

  // Generate token directly (alternative)
  getToken: async (roomId: string, role: string = 'host') => {
    const response = await api.post('/video/token', { room_id: roomId, role });
    return response.data;
  },
};