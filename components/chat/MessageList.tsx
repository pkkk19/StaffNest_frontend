import { View, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import MessageBubble from './MessageBubble';

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

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isCurrentUser = item.sender._id === user?._id;
    const showAvatar = !isCurrentUser && (
      index === 0 || 
      messages[index - 1]?.sender._id !== item.sender._id
    );

    return (
      <MessageBubble
        message={item}
        isCurrentUser={isCurrentUser}
        showAvatar={showAvatar}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        inverted={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    listContent: {
      padding: 16,
      paddingBottom: 8,
    },
  });
}