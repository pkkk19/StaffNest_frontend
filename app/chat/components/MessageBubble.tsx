// app/chat/components/MessageBubble.tsx - WITH READ/UNREAD INDICATORS
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatTheme } from '../hooks/useChatTheme';
import { useAuth } from '@/contexts/AuthContext';

interface MessageBubbleProps {
  message: any;
  isCurrentUser: boolean;
  showAvatar: boolean;
  user?: any;
  conversation?: any; // Add conversation prop
  onLongPress?: () => void;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function MessageBubble({
  message,
  isCurrentUser,
  showAvatar,
  user,
  conversation,
  onLongPress,
  onReply,
  onEdit,
  onDelete,
  showActions = false,
}: MessageBubbleProps) {
  const { colors, isDark } = useChatTheme();
  const [imageError, setImageError] = useState(false);
  const { user: currentUser } = useAuth();

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }).toLowerCase();
    } catch (error) {
      return '';
    }
  };

  const getSenderName = () => {
    if (isCurrentUser) return 'You';
    if (message.sender?.first_name) {
      return `${message.sender.first_name} ${message.sender.last_name || ''}`;
    }
    return 'User';
  };

  const getProfileImage = () => {
    if (isCurrentUser && currentUser?.profile_picture_url) {
      return currentUser.profile_picture_url;
    }
    if (!isCurrentUser && message.sender?.profile_picture_url) {
      return message.sender.profile_picture_url;
    }
    return null;
  };

  // Calculate read/unread status
  const getReadStatus = () => {
    if (!isCurrentUser || !conversation || !message.readBy) {
      return null;
    }

    const participants = conversation.participants || [];
    const otherParticipants = participants.filter(
      (p: any) => p._id !== currentUser?._id
    );

    if (otherParticipants.length === 0) return null;

    // Check if all other participants have read the message
    const allParticipantsRead = otherParticipants.every((participant: any) =>
      message.readBy?.includes(participant._id)
    );

    // Check if some but not all have read
    const someParticipantsRead = otherParticipants.some((participant: any) =>
      message.readBy?.includes(participant._id)
    );

    return {
      isRead: allParticipantsRead,
      isDelivered: someParticipantsRead,
      readByCount: message.readBy?.filter((id: string) => 
        otherParticipants.some((p: any) => p._id === id)
      ).length || 0,
      totalParticipants: otherParticipants.length
    };
  };

  const readStatus = getReadStatus();

  const renderReadStatus = () => {
    if (!readStatus) return null;

    if (readStatus.isRead) {
      return (
        <View style={styles.readStatusContainer}>
          <Ionicons name="checkmark-done" size={14} color="#10B981" />
          <Text style={styles.readStatusText}>Read</Text>
        </View>
      );
    } else if (readStatus.isDelivered) {
      return (
        <View style={styles.readStatusContainer}>
          <Ionicons name="checkmark-done" size={14} color="#3B82F6" />
          {readStatus.readByCount > 0 && readStatus.totalParticipants > 1 && (
            <Text style={styles.readStatusText}>
              Seen by {readStatus.readByCount} of {readStatus.totalParticipants}
            </Text>
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.readStatusContainer}>
          <Ionicons name="checkmark" size={14} color={colors.textTertiary} />
          <Text style={styles.readStatusText}>Sent</Text>
        </View>
      );
    }
  };

  const renderAvatar = () => {
    const profileImage = getProfileImage();
    
    if (!showAvatar) {
      return <View style={{ width: 36 }} />;
    }

    if (profileImage && !imageError) {
      return (
        <Image
          source={{ uri: profileImage }}
          style={styles.avatarImage}
          onError={() => setImageError(true)}
        />
      );
    }

    return (
      <LinearGradient
        colors={isCurrentUser ? ['#4F46E5', '#7C3AED'] : ['#3B82F6', '#1D4ED8']}
        style={styles.avatarGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.avatarText}>
          {getSenderName()
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()}
        </Text>
      </LinearGradient>
    );
  };

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.containerCurrentUser : styles.containerOtherUser
    ]}>
      {!isCurrentUser && renderAvatar()}
      
      <View style={styles.messageWrapper}>
        {!isCurrentUser && showAvatar && (
          <Text style={styles.senderName}>{getSenderName()}</Text>
        )}
        
        <TouchableOpacity
          onLongPress={onLongPress}
          activeOpacity={0.9}
          delayLongPress={300}
        >
          <LinearGradient
            colors={
              isCurrentUser 
                ? ['#4F46E5', '#7C3AED']
                : isDark 
                  ? ['#374151', '#4B5563']
                  : ['#FFFFFF', '#F9FAFB']
            }
            style={[
              styles.messageBubble,
              isCurrentUser 
                ? styles.messageBubbleCurrentUser
                : styles.messageBubbleOtherUser,
              showActions && styles.messageBubbleHighlighted
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {message.replyTo && (
              <View style={styles.replyPreview}>
                <View style={styles.replyBar} />
                <View style={styles.replyContent}>
                  <Text style={styles.replySender}>
                    {message.replyTo.sender?._id === currentUser?._id 
                      ? 'You' 
                      : message.replyTo.sender?.first_name || 'User'}
                  </Text>
                  <Text 
                    style={styles.replyText}
                    numberOfLines={2}
                  >
                    {message.replyTo.content}
                  </Text>
                </View>
              </View>
            )}
            
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.messageTextCurrentUser : styles.messageTextOtherUser
            ]}>
              {message.content}
            </Text>
            
            {message.edited && (
              <Text style={styles.editedText}>(edited)</Text>
            )}
            
            <View style={styles.messageFooter}>
              <Text style={[
                styles.messageTime,
                isCurrentUser ? styles.messageTimeCurrentUser : styles.messageTimeOtherUser
              ]}>
                {formatTime(message.createdAt)}
              </Text>
              {renderReadStatus()}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {showActions && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onReply}
            >
              <Ionicons name="arrow-undo" size={18} color={colors.textTertiary} />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>
            
            {isCurrentUser && (
              <>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={onEdit}
                >
                  <Ionicons name="create-outline" size={18} color={colors.textTertiary} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]} 
                  onPress={onDelete}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
      
      {isCurrentUser && showAvatar && renderAvatar()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  containerCurrentUser: {
    justifyContent: 'flex-end',
  },
  containerOtherUser: {
    justifyContent: 'flex-start',
  },
  avatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageWrapper: {
    maxWidth: '75%',
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 8,
    fontWeight: '500',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  messageBubbleCurrentUser: {
    borderBottomRightRadius: 4,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  messageBubbleOtherUser: {
    borderBottomLeftRadius: 4,
    borderColor: 'rgba(209, 213, 219, 0.5)',
  },
  messageBubbleHighlighted: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextCurrentUser: {
    color: '#FFFFFF',
  },
  messageTextOtherUser: {
    color: '#111827',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  messageTime: {
    fontSize: 11,
  },
  messageTimeCurrentUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeOtherUser: {
    color: '#6B7280',
  },
  readStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readStatusText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 2,
  },
  editedText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteText: {
    color: '#EF4444',
  },
  replyPreview: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  replyBar: {
    width: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replySender: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 16,
  },
});