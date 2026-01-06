// app/chat/components/MessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Text
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useChatTheme } from '../hooks/useChatTheme';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  sending: boolean;
  onSendMessage: () => void;
  onAttachFile: () => void;
  isReplying?: boolean;
  isEditing?: boolean;
  onCancelEdit?: () => void;
  onCancelReply?: () => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  sending,
  onSendMessage,
  onAttachFile,
  isReplying = false,
  isEditing = false,
  onCancelEdit,
  onCancelReply,
  onTypingStart,
  onTypingStop,
}) => {
  const { colors, isDark } = useChatTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const styles = createStyles(colors, isDark);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = () => {
    if (newMessage.trim() && !sending) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSendMessage();
      inputRef.current?.blur();
      
      // Clear typing timeout on send
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      // Send typing stop
      if (onTypingStop) {
        onTypingStop();
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Send typing stop when input loses focus
    if (onTypingStop) {
      onTypingStop();
    }
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleTextChange = (text: string) => {
    setNewMessage(text);
    
    // Handle typing indicators
    if (text.trim() && onTypingStart) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Send typing start
      onTypingStart();
      
      // Set timeout to send typing stop after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (onTypingStop) {
          onTypingStop();
        }
        typingTimeoutRef.current = null;
      }, 3000);
    } else if (!text.trim() && onTypingStop) {
      // If text is empty, send typing stop
      onTypingStop();
      
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Cancel edit/reply buttons */}
      {(isEditing || isReplying) && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={isEditing ? onCancelEdit : onCancelReply}
            disabled={sending}
          >
            <Ionicons name="close" size={20} color={colors.textTertiary} />
            <Text style={styles.cancelButtonText}>
              {isEditing ? 'Cancel Edit' : 'Cancel Reply'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        {/* Attach File Button */}
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={onAttachFile}
          disabled={sending}
        >
          <Ionicons 
            name="add" 
            size={24} 
            color={newMessage.trim() ? colors.currentUserBubble : colors.textTertiary} 
          />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={newMessage}
          onChangeText={handleTextChange}
          placeholder={isEditing ? "Edit message..." : "Type a message..."}
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={1000}
          editable={!sending}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          returnKeyType={newMessage.trim() ? "send" : "default"}
        />

        {/* Send Button or Mic Button */}
        {newMessage.trim() ? (
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSend}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <Animated.View style={styles.sendingIndicator}>
                <Ionicons 
                  name="time-outline" 
                  size={20} 
                  color="white" 
                />
              </Animated.View>
            ) : (
              <View style={styles.sendButtonIcon}>
                <Ionicons 
                  name="send" 
                  size={18} 
                  color="white" 
                />
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.micButton}
            onPress={() => {
              // Handle voice message
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            disabled={sending}
          >
            <MaterialIcons 
              name="keyboard-voice" 
              size={24} 
              color={colors.textTertiary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 56,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    padding: 8,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  sendButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.currentUserBubble,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendingIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    padding: 8,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
});