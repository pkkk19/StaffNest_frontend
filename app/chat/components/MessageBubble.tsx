// app/chat/components/MessageBubble.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform // ADDED THIS IMPORT
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useChatTheme } from '../hooks/useChatTheme';

const { width } = Dimensions.get('window');

interface MessageBubbleProps {
  message: any;
  isCurrentUser: boolean;
  showAvatar: boolean;
  user: any;
  onLongPress?: () => void;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  showAvatar,
  user,
  onLongPress,
  onReply,
  onEdit,
  onDelete,
  showActions = false
}) => {
  const { colors, isDark } = useChatTheme();
  const [swipeableRef, setSwipeableRef] = useState<any>(null);

  const styles = createStyles(colors, isCurrentUser, isDark);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderLeftActions = () => {
    if (isCurrentUser) return null;
    
    return (
      <TouchableOpacity 
        style={styles.replyAction}
        onPress={() => {
          swipeableRef?.close();
          onReply?.();
        }}
      >
        <Ionicons name="arrow-undo" size={20} color="white" />
        <Text style={styles.actionText}>Reply</Text>
      </TouchableOpacity>
    );
  };

  const renderRightActions = () => {
    if (!isCurrentUser) return null;
    
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#4ECDC4' }]}
          onPress={() => {
            swipeableRef?.close();
            onEdit?.();
          }}
        >
          <Ionicons name="create-outline" size={18} color="white" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
          onPress={() => {
            swipeableRef?.close();
            onDelete?.();
          }}
        >
          <Ionicons name="trash-outline" size={18} color="white" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const MessageContent = () => (
    <View style={styles.messageContainer}>
      {!isCurrentUser && showAvatar && (
        <View style={styles.avatarContainer}>
          {message.sender?.profile_picture_url ? (
            <Image 
              source={{ uri: message.sender.profile_picture_url }} 
              style={styles.avatarImage} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {message.sender?.first_name?.charAt(0)}{message.sender?.last_name?.charAt(0)}
              </Text>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.bubbleContainer}>
        {!isCurrentUser && showAvatar && (
          <Text style={styles.senderName}>
            {message.sender?.first_name} {message.sender?.last_name}
          </Text>
        )}
        
        <TouchableOpacity
          style={styles.messageBubble}
          onLongPress={onLongPress}
          activeOpacity={0.9}
        >
          {message.replyTo && (
            <View style={styles.replyToContainer}>
              <View style={styles.replyToIndicator} />
              <Text style={styles.replyToText}>
                {message.replyTo.content}
              </Text>
            </View>
          )}
          
          <Text style={styles.messageText}>
            {message.content || ''}
          </Text>
          
          {message.edited && (
            <Text style={styles.editedText}>(edited)</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {message.createdAt ? formatMessageTime(message.createdAt) : ''}
          </Text>
          {isCurrentUser && (
            <Ionicons 
              name={message.readBy?.length > 1 ? 'checkmark-done' : 'checkmark'} 
              size={14} 
              color={message.readBy?.length > 1 ? colors.statusRead : colors.statusUnread} 
              style={styles.statusIcon} 
            />
          )}
        </View>
      </View>
    </View>
  );

  if (showActions) {
    return (
      <View style={styles.messageActionsOverlay}>
        <MessageContent />
        <View style={styles.messageActions}>
          <TouchableOpacity style={styles.actionButtonSmall} onPress={onReply}>
            <Ionicons name="arrow-undo" size={20} color={colors.currentUserBubble} />
            <Text style={styles.actionTextSmall}>Reply</Text>
          </TouchableOpacity>
          
          {isCurrentUser && (
            <>
              <TouchableOpacity style={styles.actionButtonSmall} onPress={onEdit}>
                <Ionicons name="create-outline" size={20} color={colors.currentUserBubble} />
                <Text style={styles.actionTextSmall}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButtonSmall} onPress={onDelete}>
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                <Text style={[styles.actionTextSmall, { color: '#FF6B6B' }]}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButtonSmall, { backgroundColor: colors.border }]} 
            onPress={() => {}}
          >
            <Ionicons name="copy-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.actionTextSmall, { color: colors.textPrimary }]}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (Platform.OS !== 'web') {
    return (
      <Swipeable
        ref={(ref) => setSwipeableRef(ref)}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        friction={2}
        overshootFriction={8}
        containerStyle={styles.swipeableContainer}
      >
        <MessageContent />
      </Swipeable>
    );
  }

  return <MessageContent />;
};

const createStyles = (colors: any, isCurrentUser: boolean, isDark: boolean) => StyleSheet.create({
  swipeableContainer: {
    marginVertical: 4,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
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
  replyToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.currentUserBubble,
  },
  replyToIndicator: {
    width: 3,
    height: '100%',
    backgroundColor: colors.currentUserBubble,
    marginRight: 8,
  },
  replyToText: {
    flex: 1,
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: isCurrentUser ? '#FFFFFF' : colors.textPrimary,
  },
  editedText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 4,
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
  replyAction: {
    width: 80,
    height: '100%',
    backgroundColor: colors.currentUserBubble,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginRight: 8,
  },
  rightActions: {
    flexDirection: 'row',
    height: '100%',
    marginLeft: 8,
  },
  actionButton: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  messageActionsOverlay: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    margin: 4,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButtonSmall: {
    alignItems: 'center',
    padding: 8,
  },
  actionTextSmall: {
    fontSize: 10,
    color: colors.currentUserBubble,
    marginTop: 4,
    fontWeight: '500',
  },
});