import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { contactsService, SearchedUser, FriendRequest, Friend } from '@/services/contactsService';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';

export type TabType = 'friends' | 'requests' | 'add';

export const useContacts = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ qrCode: string; token: string; expiresAt: string } | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [userIdInput, setUserIdInput] = useState('');
  const [addingByUserId, setAddingByUserId] = useState(false);

  const viewShotRef = useRef<any>(null);

  // Load data based on active tab
  // In your useContacts hook, add this:
const loadData = async () => {
  try {
    setLoading(true);
    if (activeTab === 'friends') {
      const friendsData = await contactsService.getFriends();
      console.log('👥 Friends loaded:', friendsData);
      setFriends(friendsData || []);
    } else if (activeTab === 'requests') {
      const requestsData = await contactsService.getPendingRequests();
      console.log('📨 Pending requests loaded:', requestsData);
      console.log('📊 Requests count:', requestsData?.length);
      setPendingRequests(requestsData || []);
    }
  } catch (error: any) {
    console.error('❌ Error loading data:', error);
    Alert.alert('Error', error.response?.data?.message || 'Failed to load data');
  } finally {
    setLoading(false);
  }
};

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Search users
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        setSearchLoading(true);
        const results = await contactsService.searchUsers(query);
        setSearchResults(results || []);
      } catch (error: any) {
        console.error('Search error:', error);
        Alert.alert('Error', error.response?.data?.message || 'Search failed');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setSearchResults([]);
      setSearchLoading(false);
    }
  };

  // Send friend request
  const handleSendRequest = async (userId: string) => {
    try {
      await contactsService.sendFriendRequest(userId);
      Alert.alert('Success', 'Friend request sent');
      const updatedResults = searchResults.map(user =>
        user._id === userId 
          ? { ...user, friendshipStatus: 'pending' as const, isIncomingRequest: false }
          : user
      );
      setSearchResults(updatedResults);
    } catch (error: any) {
      console.error('Send request error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to send friend request');
    }
  };

  // Add friend by User ID
  const handleAddByUserId = async () => {
    if (!userIdInput.trim()) {
      Alert.alert('Error', 'Please enter a User ID');
      return;
    }

    try {
      setAddingByUserId(true);
      await contactsService.sendFriendRequest(userIdInput.trim());
      Alert.alert('Success', 'Friend request sent!');
      setUserIdInput('');
      await loadData();
    } catch (error: any) {
      console.error('Add by User ID error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send friend request';
      Alert.alert('Error', errorMessage);
    } finally {
      setAddingByUserId(false);
    }
  };

  // Copy User ID to clipboard
  const handleCopyMyUserId = async () => {
    try {
      const currentUserId = user?._id;
      if (!currentUserId) {
        Alert.alert('Error', 'User ID not available');
        return;
      }
      await Clipboard.setStringAsync(currentUserId);
      Alert.alert('Copied!', 'Your User ID has been copied to clipboard.');
    } catch (error) {
      console.error('Copy User ID error:', error);
      Alert.alert('Error', 'Failed to copy User ID');
    }
  };

  // Respond to friend request
  const handleRespondRequest = async (requestId: string, action: 'accepted' | 'rejected') => {
    try {
      await contactsService.respondToFriendRequest(requestId, action);
      Alert.alert('Success', `Friend request ${action}`);
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      if (action === 'accepted') {
        await loadData();
      }
    } catch (error: any) {
      console.error('Respond request error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to process request');
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await contactsService.removeFriend(friendId);
              setFriends(prev => prev.filter(friend => friend._id !== friendId));
              Alert.alert('Success', 'Friend removed');
            } catch (error: any) {
              console.error('Remove friend error:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  // QR Code functions
  const handleGenerateQRCode = async () => {
    try {
      setGeneratingQR(true);
      const qrData = await contactsService.generateQRCode();
      setQrCodeData(qrData);
      Alert.alert('Success', 'QR Code generated! Share this with friends to add them.');
    } catch (error: any) {
      console.error('Generate QR error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleDownloadQRCode = async () => {
    if (!viewShotRef.current) {
      Alert.alert('Error', 'QR Code not available');
      return;
    }
    try {
      const uri = await captureRef(viewShotRef.current, { format: 'png', quality: 1.0 });
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant photo library access to save QR code');
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Downloads', asset, false);
      Alert.alert('Success', 'QR code saved to Photos!');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to save QR code');
    }
  };

  const handleShareQRCode = async () => {
    if (!viewShotRef.current) {
      Alert.alert('Error', 'QR Code not available');
      return;
    }
    try {
      const uri = await captureRef(viewShotRef.current, { format: 'png', quality: 1.0 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share QR Code' });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  // Invite link functions
  const handleGenerateInviteLink = async () => {
    try {
      const baseUrl = 'https://yourapp.com/invite';
      const uniqueToken = Math.random().toString(36).substring(2, 15);
      const link = `${baseUrl}/${uniqueToken}`;
      setInviteLink(link);
      Alert.alert('Invite Link Created', 'Share this link with colleagues to add them as contacts.');
    } catch (error) {
      console.error('Generate invite error:', error);
      Alert.alert('Error', 'Failed to generate invite link');
    }
  };

  const handleCopyInviteLink = async () => {
    if (inviteLink) {
      await Clipboard.setStringAsync(inviteLink);
      Alert.alert('Copied!', 'Invite link copied to clipboard.');
    }
  };

  const handleShareInviteLink = async () => {
    if (!inviteLink) {
      Alert.alert('No Link', 'Please generate an invite link first');
      return;
    }
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(inviteLink, { dialogTitle: 'Share Invite Link' });
      } else {
        Alert.alert('Share Invite Link', `Share this link: ${inviteLink}\n\nLink has been copied to clipboard.`);
        await Clipboard.setStringAsync(inviteLink);
      }
    } catch (error) {
      console.error('Share link error:', error);
      Alert.alert('Error', 'Failed to share invite link');
    }
  };

  // Modal functions
  const handleAddContact = () => setIsAddModalVisible(true);
  const handleCloseModal = () => {
    setIsAddModalVisible(false);
    setQrCodeData(null);
    setInviteLink('');
    setUserIdInput('');
  };

  // Scanner functions
  const handleScanQRCode = () => setShowScanner(true);
  const handleCloseScanner = () => setShowScanner(false);
  const handleFriendAdded = () => {
    loadData();
    setShowScanner(false);
  };

  // Load data when tab changes
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Add this function to your useContacts.ts
const testPendingRequestsAPI = async () => {
  try {
    console.log('🧪 Testing pending requests API...');
    console.log('🔑 Current user ID:', user?._id);
    
    const response = await contactsService.getPendingRequests();
    console.log('📡 API Response:', response);
    console.log('📊 Response length:', response.length);
    console.log('🔍 Response type:', typeof response);
    
    if (response && response.length > 0) {
      console.log('✅ Found requests:', response);
    } else {
      console.log('❌ No requests found or empty array');
    }
  } catch (error) {
    console.error('💥 API Test Error:', error);
  }
};

// Call this in your component temporarily to test
testPendingRequestsAPI();

  return {
    // State
    activeTab,
    setActiveTab,
    friends,
    pendingRequests,
    searchResults,
    searchQuery,
    loading,
    refreshing,
    isAddModalVisible,
    searchLoading,
    qrCodeData,
    generatingQR,
    inviteLink,
    showScanner,
    userIdInput,
    addingByUserId,
    viewShotRef,
    user,

    // Setters
    setSearchQuery,
    setUserIdInput,

    // Functions
    loadData,
    onRefresh,
    handleSearch,
    handleSendRequest,
    handleAddByUserId,
    handleCopyMyUserId,
    handleRespondRequest,
    handleRemoveFriend,
    handleAddContact,
    handleCloseModal,
    handleGenerateQRCode,
    handleDownloadQRCode,
    handleShareQRCode,
    handleGenerateInviteLink,
    handleCopyInviteLink,
    handleShareInviteLink,
    handleScanQRCode,
    handleCloseScanner,
    handleFriendAdded,
  };
};