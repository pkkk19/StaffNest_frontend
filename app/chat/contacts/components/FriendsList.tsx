import React from 'react';
import { 
  FlatList, 
  RefreshControl, 
  ActivityIndicator, 
  View, 
  Text, 
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [showGroupChatModal, setShowGroupChatModal] = React.useState(false);
  const [groupName, setGroupName] = React.useState('');
  const [selectedFriends, setSelectedFriends] = React.useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = React.useState(false);

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
              console.log('🔍 Creating conversation with friend ID:', friend._id);
              
              const conversation = await chatService.createConversation([friend._id]);
              
              console.log('✅ Conversation created:', conversation._id);
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

  const toggleFriendSelection = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleCreateGroupChat = async () => {
    if (selectedFriends.length < 2) {
      Alert.alert('Error', 'Please select at least 2 friends for a group chat.');
      return;
    }

    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }

    setCreatingGroup(true);
    try {
      console.log('🔍 Creating group chat with friends:', selectedFriends);
      const conversation = await chatService.createConversation(selectedFriends, groupName);
      
      console.log('✅ Group chat created:', conversation._id);
      setShowGroupChatModal(false);
      setSelectedFriends([]);
      setGroupName('');
      
      router.push(`/chat/${conversation._id}`);
    } catch (error) {
      console.error('❌ Failed to create group chat:', error);
      Alert.alert('Error', 'Could not create group chat. Please try again.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const renderGroupChatModal = () => (
    <Modal
      visible={showGroupChatModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowGroupChatModal(false);
        setSelectedFriends([]);
        setGroupName('');
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Group Chat</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowGroupChatModal(false);
                setSelectedFriends([]);
                setGroupName('');
              }}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <TextInput
              style={styles.groupNameInput}
              placeholder="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              placeholderTextColor="#999"
            />
            
            <Text style={styles.selectFriendsText}>
              Select friends ({selectedFriends.length} selected):
            </Text>
            
            <View style={styles.friendsList}>
              {friends.map(friend => (
                <TouchableOpacity
                  key={friend._id}
                  style={[
                    styles.friendItem,
                    selectedFriends.includes(friend._id) && styles.friendItemSelected
                  ]}
                  onPress={() => toggleFriendSelection(friend._id)}
                >
                  <View style={styles.friendInfo}>
                    {friend.profile_picture_url ? (
                      <Image 
                        source={{ uri: friend.profile_picture_url }} 
                        style={styles.friendAvatar} 
                      />
                    ) : (
                      <View style={styles.friendAvatarPlaceholder}>
                        <Text style={styles.friendAvatarText}>
                          {friend.first_name?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.friendName}>
                      {friend.first_name} {friend.last_name}
                    </Text>
                  </View>
                  {selectedFriends.includes(friend._id) && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowGroupChatModal(false);
                  setSelectedFriends([]);
                  setGroupName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  (selectedFriends.length < 2 || !groupName.trim() || creatingGroup) && styles.createButtonDisabled
                ]}
                onPress={handleCreateGroupChat}
                disabled={selectedFriends.length < 2 || !groupName.trim() || creatingGroup}
              >
                {creatingGroup ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="people" size={16} color="#fff" />
                    <Text style={styles.createButtonText}>
                      Create Group ({selectedFriends.length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && friends.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      {/* Group Chat Creation Button */}
      {friends.length >= 2 && (
        <TouchableOpacity
          style={styles.groupChatButton}
          onPress={() => setShowGroupChatModal(true)}
        >
          <Ionicons name="people" size={20} color="#fff" />
          <Text style={styles.groupChatButtonText}>New Group Chat</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={friends}
        renderItem={({ item }) => (
          <ContactItem 
            item={item} 
            type="friend" 
            onRemoveFriend={onRemoveFriend}
            onChatWithFriend={() => handleChatWithFriend(item)}
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

      {renderGroupChatModal()}
    </>
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
  groupChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 10,
    gap: 8,
    justifyContent: 'center',
  },
  groupChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalBody: {
    padding: 20,
  },
  groupNameInput: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectFriendsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  friendsList: {
    maxHeight: 300,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  friendAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 16,
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginLeft: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FriendsList;