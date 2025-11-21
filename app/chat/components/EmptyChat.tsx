import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatTheme } from '../hooks/useChatTheme';

interface EmptyChatProps {
  chatUserName: string;
}

export const EmptyChat: React.FC<EmptyChatProps> = ({ chatUserName }) => {
  const { colors } = useChatTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.emptyChat}>
      <Ionicons name="chatbubble-outline" size={72} color={colors.textTertiary} />
      <Text style={styles.emptyChatText}>No messages yet</Text>
      <Text style={styles.emptyChatSubtext}>
        Start a conversation with {chatUserName}
      </Text>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
});