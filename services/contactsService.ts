// app/services/contacts.service.ts
import api from './api';

export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture_url?: string;
  position?: string;
  is_active: boolean;
}

export interface SearchedUser extends User {
  friendshipStatus: 'friends' | 'pending' | 'none';
  isIncomingRequest: boolean;
}

export interface FriendRequest {
  _id: string;
  fromUser: User;
  toUser?: string | User; // Make optional and allow both types
  touser?: string | User; // Add lowercase version
  status: string;
  message?: string;
  createdAt: string;
  type?: 'incoming' | 'outgoing';
}

export type UserOrString = User | string;

export interface Friend {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture_url?: string;
  position?: string;
  is_active: boolean;
  friendsSince: string;
}

export interface FriendRequestResponse {
  _id: string;
  fromUser: User;
  toUser?: string;
  touser?: string;
  status: string;
  message?: string;
  createdAt: string;
}

class ContactsService {
  // Search users within company
  async searchUsers(query: string): Promise<SearchedUser[]> {
    if (!query || query.length < 2) {
      return [];
    }
    const response = await api.get(`/contacts/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Send friend request
  async sendFriendRequest(toUserId: string, message?: string): Promise<any> {
    const response = await api.post('/contacts/friend-requests', {
      toUserId,
      message
    });
    return response.data;
  }

  // Get pending friend requests
 // In your contactsService.ts
async getPendingRequests(): Promise<FriendRequest[]> {
  console.log('📞 Fetching pending requests...');
  console.log('🔑 Auth headers check...');
  
  try {
    const response = await api.get('/contacts/friend-requests/pending');
    console.log('📦 Raw API response:', response.data);
    console.log('📋 Response status:', response.status);
    console.log('🔗 Response headers:', response.headers);
    
    return response.data as FriendRequest[];
  } catch (error: any) {
    console.error('💥 API Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw error;
  }
}

  // Respond to friend request
  async respondToFriendRequest(requestId: string, action: 'accepted' | 'rejected'): Promise<any> {
    const response = await api.put('/contacts/friend-requests/respond', {
      requestId,
      action
    });
    return response.data;
  }

  // Cancel friend request
  async cancelFriendRequest(requestId: string): Promise<any> {
    const response = await api.delete(`/contacts/friend-requests/${requestId}`);
    return response.data;
  }

  // Get friends list
  async getFriends(): Promise<Friend[]> {
    const response = await api.get('/contacts/friends');
    return response.data;
  }

  // Remove friend
  async removeFriend(friendId: string): Promise<any> {
    const response = await api.delete(`/contacts/friends/${friendId}`);
    return response.data;
  }

  // Generate QR code for adding friends
  async generateQRCode(): Promise<{ qrCode: string; token: string; expiresAt: string }> {
    const response = await api.get('/contacts/qr-code');
    return response.data;
  }

  // Add friend by QR code
  async addFriendByQR(qrData: string): Promise<any> {
    const response = await api.post('/contacts/qr-add', { qrData });
    return response.data;
  }
}

export const contactsService = new ContactsService();