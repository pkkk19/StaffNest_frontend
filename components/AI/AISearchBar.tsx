// File: components/AI/AISearchBar.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  Text
} from 'react-native';
import { Send, Paperclip, X, Bot, ActivityIcon, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

interface AISearchBarProps {
  placeholder?: string;
  onSend?: (message: string, attachments?: any[]) => void;
  showHeader?: boolean;
}

export default function AISearchBar({ 
  placeholder = "Ask anything....", 
  onSend,
  showHeader = true
}: AISearchBarProps) {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles(theme);

  const navigateToAIChat = () => {
    router.push({
      pathname: '/pages/ai-chat',
      params: {
        timestamp: Date.now()
      }
    });
  };

  const handleSend = async () => {
    if (message.trim() || attachments.length > 0) {
      if (onSend) {
        onSend(message, attachments);
      } else {
        setIsLoading(true);
        
        router.push({
          pathname: '/pages/ai-chat',
          params: { 
            initialMessage: message,
            shouldAutoSend: 'true',
            timestamp: Date.now()
          }
        });
        
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
      setMessage('');
      setAttachments([]);
      setIsExpanded(false);
      Keyboard.dismiss();
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setAttachments([...attachments, {
          type: 'document',
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          mimeType: result.assets[0].mimeType,
          size: result.assets[0].size,
        }]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setAttachments([...attachments, {
          type: 'image',
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
        }]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with AI branding - Now clickable */}
      {showHeader && (
        <TouchableOpacity 
          style={styles.header}
          onPress={navigateToAIChat}
          activeOpacity={0.7}
        >
          <View style={styles.headerContent}>
            <View style={styles.aiBranding}>
              <View style={styles.aiIconContainer}>
                <Bot size={16} color="#10B981" />
              </View>
              <Text style={styles.aiBrandingText}>HourWize AI Assistant</Text>
            </View>
            
            <View style={styles.headerRight}>
              {attachments.length > 0 && (
                <Text style={styles.attachmentCount}>{attachments.length} attachment(s)</Text>
              )}
              <ArrowRight size={16} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </View>
          </View>
        </TouchableOpacity>
      )}

      {isExpanded && attachments.length > 0 && (
        <View style={styles.attachmentContainer}>
          {attachments.map((attachment, index) => (
            <View key={index} style={styles.attachmentPreview}>
              <Text style={styles.attachmentText} numberOfLines={1}>
                {attachment.name || `Attachment ${index + 1}`}
              </Text>
              <TouchableOpacity 
                onPress={() => removeAttachment(index)}
                style={styles.removeAttachmentButton}
              >
                <X size={12} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachmentButton}
          onPress={pickDocument}
        >
          <Paperclip size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
          multiline
          maxLength={500}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => {
            if (message.trim() === '' && attachments.length === 0) {
              setIsExpanded(false);
            }
          }}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
          onKeyPress={handleKeyPress}
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!message.trim() && attachments.length === 0) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || isLoading}
        >
          {isLoading ? (
            <ActivityIcon size={20} color="#FFFFFF" />
          ) : (
            <Send 
              size={20} 
              color={
                (!message.trim() && attachments.length === 0) 
                  ? (theme === 'dark' ? '#4B5563' : '#9CA3AF')
                  : '#FFFFFF'
              } 
            />
          )}
        </TouchableOpacity>
      </View>
      
      <Text style={styles.helperText}>
        Ask about shifts, payroll, or policies • Press Enter to send
      </Text>
    </View>
  );
}

const createStyles = (theme: string) => {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      marginHorizontal: 0,
      marginVertical: 16,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: isDark ? '#374151' : '#4e5156ff',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 5, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#374151' : '#f6f8fbff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#4B5563' : '#686b71ff',
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    aiBranding: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    aiIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? '#10B98120' : '#10B98110',
      justifyContent: 'center',
      alignItems: 'center',
    },
    aiBrandingText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#10B981' : '#211d1dff',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    attachmentCount: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    attachmentContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 12,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    attachmentButton: {
      padding: 10,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    attachmentPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
    },
    attachmentText: {
      fontSize: 12,
      color: isDark ? '#D1D5DB' : '#4B5563',
      maxWidth: 120,
    },
    removeAttachmentButton: {
      padding: 2,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    input: {
      flex: 1,
      color: isDark ? '#F9FAFB' : '#111827',
      fontSize: 16,
      maxHeight: 120,
      marginHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      lineHeight: 22,
    },
    sendButton: {
      backgroundColor: '#2563EB',
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#2563EB',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        },
      }),
    },
    sendButtonDisabled: {
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      shadowOpacity: 0,
    },
    helperText: {
      fontSize: 11,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
  });
};