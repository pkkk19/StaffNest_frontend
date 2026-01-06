// File: app/pages/ai-chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { 
  Send, 
  Paperclip, 
  Bot, 
  User, 
  ArrowLeft,
  Trash2,
  FileText,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAIChat } from '@/contexts/AIChatContext';
import { useLocalSearchParams, router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export default function AIChatPage() {
  const { theme } = useTheme();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearMessages,
    currentModel,
    error
  } = useAIChat();
  
  const params = useLocalSearchParams();
  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Track which messages have been auto-sent by their content
  const hasAutoSentRef = useRef<string | null>(null);
  
  const styles = createStyles(theme);

  // Auto-send logic - runs once per unique message
  useEffect(() => {
    const shouldAutoSend = params.shouldAutoSend === 'true';
    const initialMessage = params.initialMessage as string;
    
    if (shouldAutoSend && initialMessage && !isLoading) {
      // Check if we've already sent this exact message
      if (hasAutoSentRef.current === initialMessage) {
        return; // Already sent this message
      }
      
      // Mark this message as sent
      hasAutoSentRef.current = initialMessage;
      
      // Small delay to ensure component is ready
      const timer = setTimeout(() => {
        handleAutoSend(initialMessage);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [params.initialMessage, params.shouldAutoSend, isLoading]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('AI Error', error);
    }
  }, [error]);

  const handleAutoSend = async (message: string) => {
    // Set the message in input for visual feedback
    setInputMessage(message);
    
    try {
      await sendMessage(message, []);
      // Clear input after successful send
      setInputMessage('');
    } catch (err) {
      console.error('Auto-send failed:', err);
      // If auto-send fails, allow retry by clearing the ref
      if (hasAutoSentRef.current === message) {
        hasAutoSentRef.current = null;
      }
    }
  };

  const handleSend = async () => {
    if (inputMessage.trim() || attachments.length > 0) {
      try {
        await sendMessage(inputMessage.trim(), attachments);
        setInputMessage('');
        setAttachments([]);
      } catch (err) {
        console.error('Send failed:', err);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
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
      Alert.alert('Error', 'Failed to pick document. Please try again.');
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
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearMessages }
      ]
    );
  };

  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === 'user';
    const timestamp = message.timestamp 
      ? new Date(message.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : '';

    return (
      <View 
        key={`message-${index}-${timestamp}`} 
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer
        ]}
      >
        <View style={styles.messageHeader}>
          {isUser ? (
            <View style={styles.userAvatar}>
              <User size={20} color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.aiAvatar}>
              <Bot size={20} color="#10B981" />
            </View>
          )}
          <Text style={[
            styles.senderText,
            isUser ? styles.userSenderText : styles.aiSenderText
          ]}>
            {isUser ? 'You' : 'HourWize AI'}
          </Text>
          <Text style={styles.timestampText}>{timestamp}</Text>
        </View>

        <Text style={[
          styles.messageText,
          isUser ? styles.userMessageText : styles.aiMessageText
        ]}>
          {message.content}
        </Text>

        {message.attachments && message.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {message.attachments.map((attachment: any, idx: number) => (
              <View key={`attachment-${idx}`} style={styles.attachmentItem}>
                {attachment.type === 'image' ? (
                  <Image 
                    source={{ uri: attachment.uri }} 
                    style={styles.attachmentImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.documentAttachment}>
                    <FileText size={20} color="#6B7280" />
                    <Text style={styles.documentName} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#111827' : '#FFFFFF'}
      />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Sparkles size={20} color="#10B981" />
          </View>
          <View>
            <Text style={styles.headerTitle}>HourWize AI Assistant</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={handleClearChat}
        >
          <Trash2 size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (scrollViewRef.current && messages.length > 0) {
              scrollViewRef.current.scrollToEnd({ animated: true });
            }
          }}
        >
          {messages.length === 0 && !isLoading && (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeAvatar}>
                <Sparkles size={32} color="#10B981" />
              </View>
              <Text style={styles.welcomeTitle}>Welcome to HourWize AI</Text>
              <Text style={styles.welcomeText}>
                I can help you with:
                • Shift scheduling and rota management
                • Payroll and payslip questions
                • Company policy information
                • Staff management queries
                • And much more!
              </Text>
              <Text style={styles.welcomeHint}>
                Try asking: "How do I request time off?" or "Explain my payslip deductions"
              </Text>
            </View>
          )}
          
          {messages.map((message, index) => renderMessage(message, index))}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.aiAvatar}>
                <Bot size={20} color="#10B981" />
              </View>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.typingText}>HourWize AI is thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {attachments.length > 0 && (
          <View style={styles.selectedAttachments}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {attachments.map((attachment, index) => (
                <View key={`selected-${index}`} style={styles.selectedAttachment}>
                  {attachment.type === 'image' ? (
                    <ImageIcon size={16} color="#6B7280" />
                  ) : (
                    <FileText size={16} color="#6B7280" />
                  )}
                  <Text style={styles.selectedAttachmentText} numberOfLines={1}>
                    {attachment.name || `Attachment ${index + 1}`}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => removeAttachment(index)}
                    style={styles.removeSelectedButton}
                  >
                    <Text style={styles.removeSelectedText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
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
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Ask HourWize AI about shifts, payroll, policies..."
            placeholderTextColor={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
            editable={!isLoading}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!inputMessage.trim() && attachments.length === 0) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={(!inputMessage.trim() && attachments.length === 0) || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send 
                size={20} 
                color={
                  (!inputMessage.trim() && attachments.length === 0) 
                    ? (theme === 'dark' ? '#4B5563' : '#9CA3AF')
                    : '#FFFFFF'
                } 
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: string) => {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
      backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#10B98120',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    headerSubtitle: {
      fontSize: 11,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    clearButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    container: {
      flex: 1,
    },
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      padding: 16,
      paddingBottom: 8,
      minHeight: '100%',
    },
    welcomeContainer: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    welcomeAvatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#10B98120',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    welcomeTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
      textAlign: 'center',
    },
    welcomeText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 16,
    },
    welcomeHint: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontStyle: 'italic',
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    messageContainer: {
      marginBottom: 16,
      borderRadius: 16,
      padding: 14,
      maxWidth: '85%',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    userMessageContainer: {
      alignSelf: 'flex-end',
      backgroundColor: '#2563EB',
      borderBottomRightRadius: 4,
    },
    aiMessageContainer: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
      borderBottomLeftRadius: 4,
    },
    userAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#2563EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    aiAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#10B98120',
      justifyContent: 'center',
      alignItems: 'center',
    },
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    senderText: {
      fontSize: 13,
      fontWeight: '600',
    },
    userSenderText: {
      color: '#FFFFFF',
    },
    aiSenderText: {
      color: isDark ? '#10B981' : '#059669',
    },
    timestampText: {
      fontSize: 11,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginLeft: 'auto',
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
    },
    userMessageText: {
      color: '#FFFFFF',
    },
    aiMessageText: {
      color: isDark ? '#F9FAFB' : '#111827',
    },
    attachmentsContainer: {
      marginTop: 8,
      gap: 8,
    },
    attachmentItem: {
      borderRadius: 8,
      overflow: 'hidden',
    },
    attachmentImage: {
      width: 200,
      height: 150,
      borderRadius: 8,
    },
    documentAttachment: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      padding: 12,
      borderRadius: 8,
      gap: 12,
    },
    documentName: {
      fontSize: 13,
      color: isDark ? '#D1D5DB' : '#4B5563',
      flex: 1,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    typingText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    selectedAttachments: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
      backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
    },
    selectedAttachment: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginRight: 8,
      gap: 8,
    },
    selectedAttachmentText: {
      fontSize: 12,
      color: isDark ? '#D1D5DB' : '#4B5563',
      maxWidth: 100,
    },
    removeSelectedButton: {
      padding: 2,
    },
    removeSelectedText: {
      fontSize: 16,
      color: '#EF4444',
      fontWeight: 'bold',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
    },
    attachmentButton: {
      padding: 10,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
      color: isDark ? '#F9FAFB' : '#111827',
      fontSize: 16,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      borderRadius: 20,
      maxHeight: 100,
      marginHorizontal: 12,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#2563EB',
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#2563EB',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    sendButtonDisabled: {
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      shadowOpacity: 0,
      elevation: 0,
    },
  });
};