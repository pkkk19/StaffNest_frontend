import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatTheme } from '../hooks/useChatTheme';

interface MessageBubbleProps {
  message: any;
  isCurrentUser: boolean;
  showAvatar: boolean;
  user: any;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  showAvatar,
  user
}) => {
  const { colors, isDark } = useChatTheme();

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const styles = createStyles(colors, isCurrentUser, isDark);

  return (
    <View style={styles.messageContainer}>
      {!isCurrentUser && showAvatar && (
        <View style={styles.avatarContainer}>
          {message.sender.profile_picture_url ? (
            <Image 
              source={{ uri: message.sender.profile_picture_url }} 
              style={styles.avatarImage} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {message.sender.first_name?.charAt(0)}{message.sender.last_name?.charAt(0)}
              </Text>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.bubbleContainer}>
        {!isCurrentUser && showAvatar && (
          <Text style={styles.senderName}>
            {message.sender.first_name} {message.sender.last_name}
          </Text>
        )}
        
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>
            {message.content}
          </Text>
        </View>
        
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {formatMessageTime(message.createdAt)}
          </Text>
          {isCurrentUser && (
            <Ionicons 
              name={message.readBy.length > 1 ? 'checkmark-done' : 'checkmark'} 
              size={14} 
              color={message.readBy.length > 1 ? colors.statusRead : colors.statusUnread} 
              style={styles.statusIcon} 
            />
          )}
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: any, isCurrentUser: boolean, isDark: boolean) => StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
    paddingHorizontal: 8,
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.currentUserBubble,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bubbleContainer: {
    maxWidth: '75%',
    alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 4,
    marginLeft: 12,
    fontWeight: '500',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: isCurrentUser ? colors.currentUserBubble : colors.otherUserBubble,
    ...(isCurrentUser ? {
      borderBottomRightRadius: 6,
    } : {
      borderBottomLeftRadius: 6,
    }),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDark ? 0.1 : 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: isCurrentUser ? '#FFFFFF' : colors.textPrimary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textTertiary,
    marginRight: 4,
  },
  statusIcon: {
    marginLeft: 2,
  },
});