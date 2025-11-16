import { View, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Send, Paperclip, Mic } from 'lucide-react-native';
import ForceTouchable from '@/components/ForceTouchable';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
}

export default function MessageInput({ onSendMessage }: MessageInputProps) {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const styles = createStyles(theme);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleAttachment = () => {
    Alert.alert('Coming Soon', 'File attachment feature will be available soon!');
  };

  const handleVoiceMessage = () => {
    Alert.alert('Coming Soon', 'Voice message feature will be available soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <ForceTouchable style={styles.attachmentButton} onPress={handleAttachment}>
          <Paperclip size={20} color="#6B7280" />
        </ForceTouchable>
        
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#6B7280"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
        />
        
        {message.trim() ? (
          <ForceTouchable style={styles.sendButton} onPress={handleSend}>
            <Send size={20} color="#FFFFFF" />
          </ForceTouchable>
        ) : (
          <ForceTouchable style={styles.voiceButton} onPress={handleVoiceMessage}>
            <Mic size={20} color="#6B7280" />
          </ForceTouchable>
        )}
      </View>
    </View>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      padding: 16,
      paddingBottom: 24,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    attachmentButton: {
      padding: 8,
      marginRight: 4,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
      maxHeight: 100,
      paddingVertical: 8,
    },
    sendButton: {
      backgroundColor: '#2563EB',
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    voiceButton: {
      padding: 8,
      marginLeft: 4,
    },
  });
}