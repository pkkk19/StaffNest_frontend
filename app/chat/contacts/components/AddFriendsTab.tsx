import React from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  ActivityIndicator, 
  Text,
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchedUser } from '@/services/contactsService';
import SearchResultItem from './SearchResultItem';

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
  return (
    <View style={styles.addTabContainer}>
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search by name or email..." 
          value={searchQuery} 
          onChangeText={handleSearch} 
        />
      </View>
      
      {searchLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <SearchResultItem 
              item={item} 
              onSendRequest={onSendRequest}
              onNavigateToRequests={onNavigateToRequests}
            />
          )}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery.length >= 2 ? 'No users found' : 'Search for users by name or email'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery.length >= 2 ? 'Try different search terms' : 'Enter at least 2 characters to search'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  addTabContainer: { 
    flex: 1 
  },
  searchContainer: { 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  searchInput: { 
    backgroundColor: '#f8f8f8', 
    padding: 12, 
    borderRadius: 8, 
    fontSize: 16 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 40 
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#666' 
  },
  emptyContainer: { 
    padding: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyText: { 
    fontSize: 16, 
    color: '#666', 
    marginTop: 16, 
    marginBottom: 8, 
    textAlign: 'center' as const 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: '#999', 
    textAlign: 'center' as const, 
    marginBottom: 20 
  },
});

export default AddFriendsTab;