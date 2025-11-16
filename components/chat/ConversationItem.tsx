import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ForceTouchable from '@/components/ForceTouchable';

interface Conversation {
  _id: string;
  name?: string;
  participants: Array<{
    _id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
    position?: string;
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

export default function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    
    const otherParticipants = conversation.participants.filter(
      (p: any) => p._id !== user?._id
    );
    
    if (otherParticipants.length === 1) {
      return `${otherParticipants[0].first_name} ${otherParticipants[0].last_name}`;
    }
    
    return otherParticipants.map((p: any) => p.first_name).join(', ');
  };

  const getConversationAvatar = () => {
    const otherParticipants = conversation.participants.filter(
      (p: any) => p._id !== user?._id
    );
    
    if (otherParticipants.length === 1) {
      return `${otherParticipants[0].first_name[0]}${otherParticipants[0].last_name[0]}`;
    }
    
    return 'GC';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <ForceTouchable style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{getConversationAvatar()}</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {getConversationName()}
          </Text>
          <Text style={styles.time}>
            {conversation.lastMessage ? formatTime(conversation.lastMessage.createdAt) : ''}
          </Text>
        </View>
        
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {conversation.lastMessage?.content || 'No messages yet'}
          </Text>
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </ForceTouchable>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    avatarContainer: {
      marginRight: 12,
    },
    avatarText: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 48,
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      flex: 1,
    },
    time: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginLeft: 8,
    },
    messageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    lastMessage: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      flex: 1,
    },
    unreadBadge: {
      backgroundColor: '#2563EB',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      marginLeft: 8,
    },
    unreadText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}