import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchedUser } from '@/services/contactsService';

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

interface SearchResultItemProps {
  item: SearchedUser;
  onSendRequest: (userId: string) => void;
  onNavigateToRequests?: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ 
  item, 
  onSendRequest,
  onNavigateToRequests 
}) => {
  const handleSendRequest = () => {
    onSendRequest(item._id);
  };

  const handleRespondToIncoming = () => {
    Alert.alert(
      'Incoming Request',
      'This user has sent you a friend request. Please check your pending requests to accept it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Requests',
          onPress: onNavigateToRequests,
        },
      ]
    );
  };

  return (
    <View style={styles.searchItem}>
      <View style={styles.avatar}>
        {item.profile_picture_url ? (
          <Image source={{ uri: item.profile_picture_url }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{getInitials(item)}</Text>
        )}
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{getDisplayName(item)}</Text>
        {item.position && <Text style={styles.contactPosition}>{item.position}</Text>}
        <Text style={styles.contactEmail}>{item.email}</Text>
        <Text style={[
          styles.friendshipStatus, 
          item.friendshipStatus === 'friends' && styles.friendsStatus, 
          item.friendshipStatus === 'pending' && styles.pendingStatus
        ]}>
          {item.friendshipStatus === 'friends' && '✓ Friends'}
          {item.friendshipStatus === 'pending' && item.isIncomingRequest && '📥 Request sent to you'}
          {item.friendshipStatus === 'pending' && !item.isIncomingRequest && '📤 Request sent'}
          {item.friendshipStatus === 'none' && 'Not connected'}
        </Text>
      </View>
      <View style={styles.searchActions}>
        {item.friendshipStatus === 'none' && (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleSendRequest}
          >
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
        {item.friendshipStatus === 'pending' && item.isIncomingRequest && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]} 
            onPress={handleRespondToIncoming}
          >
            <Text style={styles.actionButtonText}>Respond</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#007AFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  avatarImage: { 
    width: 50, 
    height: 50, 
    borderRadius: 25 
  },
  avatarText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  contactInfo: { 
    flex: 1 
  },
  contactName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 2 
  },
  contactPosition: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 2 
  },
  contactEmail: { 
    fontSize: 12, 
    color: '#999', 
    marginBottom: 2 
  },
  friendshipStatus: { 
    fontSize: 12, 
    color: '#666', 
    fontStyle: 'italic' 
  },
  friendsStatus: { 
    color: '#34C759' 
  },
  pendingStatus: { 
    color: '#FF9500' 
  },
  searchActions: { 
    marginLeft: 8 
  },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#007AFF', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 6, 
    gap: 4 
  },
  addButtonText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 6, 
    gap: 4 
  },
  acceptButton: { 
    backgroundColor: '#34C759' 
  },
  actionButtonText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '600' 
  },
});

export default SearchResultItem;