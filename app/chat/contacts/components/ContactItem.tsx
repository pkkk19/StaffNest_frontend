import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Friend, FriendRequest } from '@/services/contactsService';

interface ContactItemProps {
  item: Friend | FriendRequest;
  type: 'friend' | 'request';
  onRemoveFriend?: (friendId: string) => void;
  onRespondRequest?: (requestId: string, action: 'accepted' | 'rejected') => void;
  onChatWithFriend?: () => void; // Add this prop
}

// Helper functions
const getInitials = (user: { first_name?: string; last_name?: string; email?: string }): string => {
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  if (firstName || lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  return user.email?.charAt(0).toUpperCase() || '?';
};

const getDisplayName = (user: { first_name?: string; last_name?: string; email?: string }): string => {
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  return user.email || 'Unknown User';
};

const ContactItem: React.FC<ContactItemProps> = ({ 
  item, 
  type, 
  onRemoveFriend, 
  onRespondRequest,
  onChatWithFriend 
}) => {

  const handleChatPress = () => {
    console.log('📱 ContactItem - Chat button pressed');
    console.log('📱 onChatWithFriend function:', onChatWithFriend);
    
    if (onChatWithFriend) {
      onChatWithFriend();
    } else {
      console.log('❌ onChatWithFriend is undefined');
      Alert.alert('Error', 'Chat function not available');
    }
  };

  if (type === 'friend') {
    const friend = item as Friend;
    return (
      <TouchableOpacity 
        style={styles.contactItem} 
        onPress={handleChatPress} // Use the handler function
      >
        <View style={styles.avatar}>
          {friend.profile_picture_url ? (
            <Image source={{ uri: friend.profile_picture_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(friend)}</Text>
          )}
        </View>
        
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{getDisplayName(friend)}</Text>
          {friend.position && <Text style={styles.contactPosition}>{friend.position}</Text>}
          <Text style={styles.contactEmail}>{friend.email}</Text>
          {friend.friendsSince && (
            <Text style={styles.friendsSince}>
              Friends since {new Date(friend.friendsSince).toLocaleDateString()}
            </Text>
          )}
        </View>
        
        <View style={styles.contactActions}>
          <TouchableOpacity 
            style={styles.chatButton} 
            onPress={handleChatPress} // Use the handler function
          >
            <Ionicons name="chatbubble" size={16} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.removeButton} 
            onPress={() => onRemoveFriend?.(friend._id)}
          >
            <Ionicons name="person-remove" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  if (type === 'request') {
    const request = item as FriendRequest;
    return (
      <View style={styles.requestItem}>
        <View style={styles.avatar}>
          {request.fromUser?.profile_picture_url ? (
            <Image source={{ uri: request.fromUser.profile_picture_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(request.fromUser)}</Text>
          )}
        </View>
        
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{getDisplayName(request.fromUser)}</Text>
          {request.fromUser?.position && (
            <Text style={styles.contactPosition}>{request.fromUser.position}</Text>
          )}
          <Text style={styles.contactEmail}>{request.fromUser?.email}</Text>
          {request.message && <Text style={styles.requestMessage}>"{request.message}"</Text>}
          <Text style={styles.requestDate}>
            {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]} 
            onPress={() => onRespondRequest?.(request._id, 'accepted')}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]} 
            onPress={() => onRespondRequest?.(request._id, 'rejected')}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  contactPosition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  friendsSince: {
    fontSize: 11,
    color: '#ccc',
  },
  requestMessage: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  requestDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#ff3b30',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#ff3b30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ContactItem;