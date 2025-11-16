// app/chat/contacts/components/RequestItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FriendRequest } from '@/services/contactsService';

interface RequestItemProps {
  item: FriendRequest;
  onRespondRequest?: (requestId: string, action: 'accepted' | 'rejected') => void;
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

const RequestItem: React.FC<RequestItemProps> = ({ item, onRespondRequest }) => {
  // Handle null fromUser safely
  const fromUser = item.fromUser;
  
  console.log('🎨 Rendering request item:', {
    requestId: item._id,
    hasFromUser: !!fromUser,
    fromUser: fromUser
  });

  // Safe handling for null fromUser
  const displayName = fromUser ? getDisplayName(fromUser) : 'Unknown User';
  const initials = fromUser ? getInitials(fromUser) : '?';
  const position = fromUser?.position;
  const email = fromUser?.email;

  return (
    <View style={styles.requestItem}>
      <View style={styles.avatar}>
        {fromUser?.profile_picture_url ? (
          <Image source={{ uri: fromUser.profile_picture_url }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>
      
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{displayName}</Text>
        {position && <Text style={styles.contactPosition}>{position}</Text>}
        {email && <Text style={styles.contactEmail}>{email}</Text>}
        {!fromUser && <Text style={styles.contactEmail}>User information loading...</Text>}
        {item.message && <Text style={styles.requestMessage}>"{item.message}"</Text>}
        <Text style={styles.requestDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        {/* Debug info - remove in production */}
        <Text style={styles.debugText}>Request ID: {item._id}</Text>
      </View>
      
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]} 
          onPress={() => onRespondRequest?.(item._id, 'accepted')}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Accept</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]} 
          onPress={() => onRespondRequest?.(item._id, 'rejected')}
        >
          <Ionicons name="close" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  debugText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});

export default RequestItem;