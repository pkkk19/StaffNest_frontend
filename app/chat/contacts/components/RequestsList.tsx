import React from 'react';
import { 
  FlatList, 
  RefreshControl, 
  ActivityIndicator, 
  View, 
  Text, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FriendRequest } from '@/services/contactsService';
import ContactItem from './ContactItem';

interface RequestsListProps {
  pendingRequests: FriendRequest[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onRespondRequest?: (requestId: string, action: 'accepted' | 'rejected') => void;
}

const RequestsList: React.FC<RequestsListProps> = ({
  pendingRequests,
  loading,
  refreshing,
  onRefresh,
  onRespondRequest,
}) => {
  if (loading && pendingRequests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <FlatList
      data={pendingRequests}
      renderItem={({ item }) => (
        <ContactItem 
          item={item} 
          type="request" 
          onRespondRequest={onRespondRequest}
        />
      )}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No pending requests</Text>
          <Text style={styles.emptySubtext}>Friend requests will appear here</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
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
    textAlign: 'center' 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: '#999', 
    textAlign: 'center', 
    marginBottom: 20 
  },
});

export default RequestsList;