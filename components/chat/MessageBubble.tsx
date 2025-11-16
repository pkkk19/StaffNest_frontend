import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  conversationId: string;
  createdAt: string;
  readBy: string[];
}

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showAvatar: boolean;
}

export default function MessageBubble({ message, isCurrentUser, showAvatar }: MessageBubbleProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme, isCurrentUser);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {!isCurrentUser && showAvatar && (
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {message.sender.first_name[0]}{message.sender.last_name[0]}
          </Text>
        </View>
      )}
      
      <View style={styles.messageContainer}>
        {!isCurrentUser && showAvatar && (
          <Text style={styles.senderName}>
            {message.sender.first_name} {message.sender.last_name}
          </Text>
        )}
        
        <View style={styles.bubbleContainer}>
          <View style={styles.bubble}>
            <Text style={styles.messageText}>{message.content}</Text>
          </View>
          <Text style={styles.timeText}>{formatTime(message.createdAt)}</Text>
        </View>
      </View>

      {isCurrentUser && (
        <View style={styles.statusContainer}>
          {/* You can add read receipts here later */}
        </View>
      )}
    </View>
  );
}

function createStyles(theme: string, isCurrentUser: boolean) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 12,
      justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
    },
    avatarContainer: {
      marginRight: 8,
    },
    avatarText: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 32,
    },
    messageContainer: {
      maxWidth: '70%',
    },
    senderName: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
      marginLeft: 8,
    },
    bubbleContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    bubble: {
      backgroundColor: isCurrentUser 
        ? '#2563EB' 
        : (isDark ? '#374151' : '#FFFFFF'),
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      borderBottomLeftRadius: isCurrentUser ? 20 : 4,
      borderBottomRightRadius: isCurrentUser ? 4 : 20,
      ...(isCurrentUser ? {} : {
        borderWidth: 1,
        borderColor: isDark ? '#4B5563' : '#E5E7EB',
      }),
    },
    messageText: {
      fontSize: 16,
      color: isCurrentUser ? '#FFFFFF' : (isDark ? '#F9FAFB' : '#111827'),
      lineHeight: 20,
    },
    timeText: {
      fontSize: 11,
      color: isDark ? '#6B7280' : '#9CA3AF',
      marginBottom: 4,
    },
    statusContainer: {
      width: 16,
    },
  });
}