import React from 'react';
import { 
  FlatList, 
  RefreshControl, 
  ActivityIndicator, 
  View, 
  Text, 
  StyleSheet,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { Friend } from '@/services/contactsService';
import ContactItem from './ContactItem';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

interface FriendsListProps {
  friends: Friend[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onAddContact?: () => void;
  onRemoveFriend?: (friendId: string) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  loading,
  refreshing,
  onRefresh,
  onAddContact,
  onRemoveFriend,
}) => {
  const { user } = useAuth();

  // TEMPORARY: Test if button works with simple navigation
const handleChatWithFriend = async (friend: Friend) => {
  console.log('💬 Button clicked for friend:', friend.first_name);
  
  Alert.alert(
    'Start Chat', 
    `Would you like to start a chat with ${friend.first_name}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Start Chat', 
        onPress: async () => {
          try {
            console.log('🔍 [1] Creating conversation with friend ID:', friend._id);
            console.log('🔍 [2] Current user ID:', user?._id);
            
            const conversation = await chatService.createConversation([friend._id]);
            
            console.log('✅ [3] Conversation response:', conversation);
            console.log('✅ [4] Conversation ID:', conversation._id);
            console.log('✅ [5] Conversation type:', typeof conversation._id);
            console.log('✅ [6] Full conversation object:', JSON.stringify(conversation, null, 2));
            
            console.log('🚀 [7] Navigating to:', `/chat/${conversation._id}`);
            router.push(`/chat/${conversation._id}`);
            
          } catch (error) {
            console.error('❌ Failed to create conversation:', error);
            Alert.alert('Error', 'Could not start chat. Please try again.');
          }
        }
      }
    ]
  );
};

  if (loading && friends.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <FlatList
      data={friends}
      renderItem={({ item }) => (
        <ContactItem 
          item={item} 
          type="friend" 
          onRemoveFriend={onRemoveFriend}
          onChatWithFriend={() => handleChatWithFriend(item)} // FIXED: Pass the function correctly
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
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No friends yet</Text>
          <Text style={styles.emptySubtext}>
            Start adding colleagues to build your network
          </Text>
          {onAddContact && (
            <TouchableOpacity 
              style={styles.addContactButton} 
              onPress={onAddContact}
            >
              <Ionicons name="person-add" size={16} color="#fff" />
              <Text style={styles.addContactButtonText}>Add Contacts</Text>
            </TouchableOpacity>
          )}
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
  addContactButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#007AFF', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 8, 
    gap: 8 
  },
  addContactButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});

export default FriendsList;