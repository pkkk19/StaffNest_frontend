import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { TabType } from '../hooks/useContacts';
import { Friend, FriendRequest, SearchedUser } from '@/services/contactsService';
import FriendsList from './FriendsList';
import RequestsList from './RequestsList';
import AddFriendsTab from './AddFriendsTab';

interface ContactsTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  friends: Friend[];
  pendingRequests: FriendRequest[];
  searchResults: SearchedUser[];
  searchQuery: string;
  loading: boolean;
  refreshing: boolean;
  searchLoading: boolean;
  onRefresh: () => void;
  handleSearch: (query: string) => void;
  onAddContact?: () => void;
  onRemoveFriend?: (friendId: string) => void;
  onRespondRequest?: (requestId: string, action: 'accepted' | 'rejected') => void;
  onSendRequest: (userId: string) => void; // Changed to required
  onNavigateToRequests?: () => void;
}

const ContactsTabs: React.FC<ContactsTabsProps> = ({
  activeTab,
  setActiveTab,
  friends,
  pendingRequests,
  searchResults,
  searchQuery,
  loading,
  refreshing,
  searchLoading,
  onRefresh,
  handleSearch,
  onAddContact,
  onRemoveFriend,
  onRespondRequest,
  onSendRequest,
  onNavigateToRequests,
}) => {
  const renderTabButton = (tab: TabType, label: string, count?: number) => (
    <TouchableOpacity 
      style={[styles.tab, activeTab === tab && styles.activeTab]} 
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {label} {count !== undefined ? `(${count})` : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.tabContainer}>
        {renderTabButton('friends', 'Friends', friends.length)}
        {renderTabButton('requests', 'Requests', pendingRequests.length)}
        {renderTabButton('add', 'Add Friends')}
      </View>

      {activeTab === 'friends' && (
        <FriendsList
          friends={friends}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onAddContact={onAddContact}
          onRemoveFriend={onRemoveFriend}
        />
      )}

      {activeTab === 'requests' && (
        <RequestsList
          pendingRequests={pendingRequests}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onRespondRequest={onRespondRequest}
        />
      )}

      {activeTab === 'add' && (
        <AddFriendsTab
          searchResults={searchResults}
          searchQuery={searchQuery}
          searchLoading={searchLoading}
          handleSearch={handleSearch}
          onSendRequest={onSendRequest}
          onNavigateToRequests={onNavigateToRequests}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  tabContainer: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0' 
  },
  tab: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center' 
  },
  activeTab: { 
    borderBottomWidth: 2, 
    borderBottomColor: '#007AFF' 
  },
  tabText: { 
    fontSize: 14, 
    color: '#666', 
    fontWeight: '500' 
  },
  activeTabText: { 
    color: '#007AFF' 
  },
});

export default ContactsTabs;