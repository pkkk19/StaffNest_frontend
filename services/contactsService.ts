// app/services/contactsService.ts
import api from './api';

export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
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
  toUser?: string | User;
  touser?: string | User;
  status: string;
  message?: string;
  createdAt: string;
  type?: 'incoming' | 'outgoing';
}

export interface Friend {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  profile_picture_url?: string;
  position?: string;
  is_active: boolean;
  friendsSince: string;
}

export interface VerifiedContact {
  user: SearchedUser;
  matchedPhoneNumbers: string[];
}

export interface VerifyContactsResponse {
  foundUsers: Array<{
    user: User;
    friendshipStatus: 'friends' | 'pending' | 'none';
    isIncomingRequest: boolean;
    matchedPhoneNumbers: string[];
  }>;
  notFoundNumbers: string[];
}

export interface BulkRequestResult {
  userId: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
}

class ContactsService {
  // Search users (now includes phone number search)
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
  async getPendingRequests(): Promise<FriendRequest[]> {
    console.log('📞 Fetching pending requests...');
    
    try {
      const response = await api.get('/contacts/friend-requests/pending');
      console.log('📦 Raw API response:', response.data);
      console.log('📋 Response status:', response.status);
      
      return response.data as FriendRequest[];
    } catch (error: any) {
      console.error('💥 API Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
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

  // NEW: Verify phone contacts with backend
  async verifyPhoneContacts(phoneNumbers: string[]): Promise<VerifyContactsResponse> {
    const response = await api.post('/contacts/verify-phone-contacts', {
      phoneNumbers
    });
    return response.data;
  }

  // NEW: Send bulk friend requests
  async sendBulkFriendRequests(userIds: string[], message?: string): Promise<BulkRequestResult[]> {
    const response = await api.post('/contacts/bulk-friend-requests', {
      userIds,
      message
    });
    return response.data;
  }
}

export const contactsService = new ContactsService();