import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatTheme } from '../hooks/useChatTheme';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (text: string) => void;
  sending: boolean;
  onSendMessage: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  sending,
  onSendMessage
}) => {
  const { colors, isDark } = useChatTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={colors.textTertiary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={onSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  inputContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.inputBackground,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sendButton,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.sendButtonDisabled,
  },
});