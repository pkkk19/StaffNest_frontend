import React from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  Image
} from 'react-native';
import { SearchedUser } from '@/services/contactsService';
import { Ionicons } from '@expo/vector-icons';

interface AddFriendsTabProps {
  searchResults: SearchedUser[];
  searchQuery: string;
  searchLoading: boolean;
  handleSearch: (query: string) => void;
  onSendRequest: (userId: string) => void;
  onNavigateToRequests?: () => void;
}

const AddFriendsTab: React.FC<AddFriendsTabProps> = ({
  searchResults,
  searchQuery,
  searchLoading,
  handleSearch,
  onSendRequest,
  onNavigateToRequests,
}) => {
  const getInitials = (user: SearchedUser) => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || '?';
  };

  const renderSearchResult = ({ item }: { item: SearchedUser }) => (
    <View style={styles.resultItem}>
      <View style={styles.resultInfo}>
        {item.profile_picture_url ? (
          <Image 
            source={{ uri: item.profile_picture_url }} 
            style={styles.resultAvatar} 
          />
        ) : (
          <View style={styles.resultAvatarPlaceholder}>
            <Text style={styles.resultAvatarText}>
              {getInitials(item)}
            </Text>
          </View>
        )}
        <View style={styles.resultDetails}>
          <Text style={styles.resultName}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={styles.resultDetailsText}>
            {item.position} • {item.email}
          </Text>
          {item.phone_number && (
            <Text style={styles.phoneNumber}>
              📱 {item.phone_number}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.resultActions}>
        {item.friendshipStatus === 'friends' ? (
          <Text style={styles.statusText}>✓ Friends</Text>
        ) : item.friendshipStatus === 'pending' ? (
          <Text style={styles.statusText}>
            {item.isIncomingRequest ? 'Request Received' : 'Request Sent'}
          </Text>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onSendRequest(item._id)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or phone number..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchLoading && (
          <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
        )}
      </View>

      {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No users found</Text>
          <Text style={styles.emptyStateSubtext}>
            Try searching by name, email, or phone number
          </Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searchQuery.length < 2 ? (
            <View style={styles.initialState}>
              <Ionicons name="person-add-outline" size={64} color="#ccc" />
              <Text style={styles.initialStateText}>Find Colleagues</Text>
              <Text style={styles.initialStateSubtext}>
                Search by name, email, or phone number to find colleagues in your company
              </Text>
              {onNavigateToRequests && (
                <TouchableOpacity 
                  style={styles.viewRequestsButton}
                  onPress={onNavigateToRequests}
                >
                  <Text style={styles.viewRequestsText}>View Friend Requests</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  resultAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultDetails: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  resultDetailsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 12,
    color: '#007AFF',
  },
  resultActions: {
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  initialState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  initialStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  initialStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  viewRequestsButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewRequestsText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AddFriendsTab;