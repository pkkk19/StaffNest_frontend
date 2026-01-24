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
  RefreshControl,
  Dimensions,
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
  Sparkles,
  ChevronDown,
  Settings,
  BookOpen,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Loader2,
  PlusCircle,
  Zap,
  Target,
  LucideIcon
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAIChat } from '@/contexts/AIChatContext';
import { useLocalSearchParams, router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  color?: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  icon: Icon, 
  label, 
  onPress, 
  color = "#10B981" 
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  return (
    <TouchableOpacity 
      style={styles.quickActionButton}
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function AIChatPage() {
  const { theme } = useTheme();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearMessages,
    currentModel,
    error,
    appCommands,
    isTyping,
    hasMoreHistory,
    loadMoreHistory,
    fetchAppCommands
  } = useAIChat();
  
  const params = useLocalSearchParams();
  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showCommands, setShowCommands] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  
  const hasAutoSentRef = useRef<string | null>(null);
  
  const styles = createStyles(theme);

  // Auto-send logic
  useEffect(() => {
    const shouldAutoSend = params.shouldAutoSend === 'true';
    const initialMessage = params.initialMessage as string;
    
    if (shouldAutoSend && initialMessage && !isLoading) {
      if (hasAutoSentRef.current === initialMessage) {
        return;
      }
      
      hasAutoSentRef.current = initialMessage;
      
      const timer = setTimeout(() => {
        handleAutoSend(initialMessage);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [params.initialMessage, params.shouldAutoSend, isLoading]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert('AI Error', error);
    }
  }, [error]);

  const handleAutoSend = async (message: string) => {
    setInputMessage(message);
    try {
      await sendMessage(message, []);
      setInputMessage('');
    } catch (err) {
      console.error('Auto-send failed:', err);
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
        setShowQuickActions(false);
        inputRef.current?.focus();
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
      'Are you sure you want to clear all messages? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive', 
          onPress: () => {
            clearMessages();
            setShowCommands(false);
            setShowQuickActions(true);
          }
        }
      ]
    );
  };

  const handleQuickCommand = (command: string) => {
    setInputMessage(command);
    inputRef.current?.focus();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppCommands();
    setRefreshing(false);
  };

  const renderCommandIcon = (iconName: string) => {
    switch (iconName) {
      case 'calendar':
        return <Calendar size={16} color="#10B981" />;
      case 'dollar-sign':
        return <DollarSign size={16} color="#10B981" />;
      case 'clock':
        return <Clock size={16} color="#10B981" />;
      case 'book-open':
        return <BookOpen size={16} color="#10B981" />;
      case 'users':
        return <Users size={16} color="#10B981" />;
      default:
        return <Sparkles size={16} color="#10B981" />;
    }
  };

  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === 'user';
    const hasFetchedData = message.metadata?.dataFetched;
    const isAppCommand = message.metadata?.type === 'app_command';
    const isError = message.metadata?.type === 'error';
    
    const timestamp = message.timestamp 
      ? new Date(message.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : '';

    return (
      <Animated.View 
        key={`message-${index}-${timestamp}`}
        entering={FadeIn.duration(300)}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
          isAppCommand && styles.appCommandContainer,
          isError && styles.errorMessageContainer
        ]}
      >
        <View style={styles.messageHeader}>
          {isUser ? (
            <View style={styles.userAvatar}>
              <User size={20} color="#FFFFFF" />
            </View>
          ) : (
            <View style={[
              styles.aiAvatar,
              isError && styles.errorAvatar
            ]}>
              {isError ? (
                <Bot size={20} color="#EF4444" />
              ) : (
                <Bot size={20} color="#10B981" />
              )}
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={[
              styles.senderText,
              isUser ? styles.userSenderText : styles.aiSenderText,
              isError && styles.errorSenderText
            ]}>
              {isUser ? 'You' : isError ? 'System Error' : 'AI Assistant'}
            </Text>
            {isAppCommand && (
              <View style={styles.dataIndicator}>
                <Zap size={12} color="#10B981" />
                <Text style={styles.dataIndicatorText}>
                  Live Data
                </Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.timestampText,
            isError && styles.errorTimestampText
          ]}>
            {timestamp}
          </Text>
        </View>

        <Text style={[
          styles.messageText,
          isUser ? styles.userMessageText : styles.aiMessageText,
          isError && styles.errorMessageText
        ]}>
          {message.content}
        </Text>

        {hasFetchedData && (
          <View style={styles.dataPreview}>
            <Text style={styles.dataPreviewTitle}>
              ✅ Data Retrieved Successfully
            </Text>
            <Text style={styles.dataPreviewText} numberOfLines={1}>
              Real-time information from your HourWize account
            </Text>
          </View>
        )}

        {message.metadata?.attachments && message.metadata.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {message.metadata.attachments.map((attachment: any, idx: number) => (
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
      </Animated.View>
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={theme === 'dark' ? '#F9FAFB' : '#374151'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerCenter}
          onPress={() => setShowCommands(!showCommands)}
          activeOpacity={0.7}
        >
          <View style={styles.headerAvatar}>
            <Sparkles size={20} color="#10B981" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>AI Chat Assistant</Text>
          </View>
          <ChevronDown 
            size={16} 
            color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
            style={{ transform: [{ rotate: showCommands ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleClearChat}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </View>

      {showCommands && (
        <Animated.View 
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.commandsDropdown}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.commandsScrollContent}
          >
            {appCommands.map((command, index) => (
              <TouchableOpacity
                key={command.name}
                style={styles.commandChip}
                onPress={() => handleQuickCommand(command.description)}
              >
                {renderCommandIcon(command.icon)}
                <Text style={styles.commandChipText}>
                  {command.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#10B981']}
              tintColor="#10B981"
            />
          }
          onScroll={({ nativeEvent }) => {
            if (nativeEvent.contentOffset.y <= 100 && hasMoreHistory && !isLoading) {
              loadMoreHistory();
            }
          }}
          scrollEventThrottle={400}
        >
          {hasMoreHistory && (
            <TouchableOpacity 
              style={styles.loadMoreButton}
              onPress={loadMoreHistory}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={16} color="#10B981" style={{ marginRight: 8 }} />
              ) : (
                <ChevronDown size={16} color="#10B981" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.loadMoreText}>
                {isLoading ? 'Loading...' : 'Load older messages'}
              </Text>
            </TouchableOpacity>
          )}

          {messages.length === 0 && !isLoading && showQuickActions && (
            <Animated.View 
              entering={FadeIn.duration(500)}
              style={styles.welcomeContainer}
            >
              <View style={styles.welcomeAvatar}>
                <Sparkles size={48} color="#10B981" />
              </View>
              <Text style={styles.welcomeTitle}>Welcome to HourWize AI</Text>
              <Text style={styles.welcomeText}>
                I'm your intelligent assistant for all things HourWize. I can access real data from your account and help with tasks.
              </Text>
              
              <View style={styles.quickActionsContainer}>
                <Text style={styles.quickActionsTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                  <QuickActionButton 
                    icon={Calendar}
                    label="My Shifts"
                    onPress={() => handleQuickCommand("What are my shifts next week?")}
                  />
                  <QuickActionButton 
                    icon={DollarSign}
                    label="Payslips"
                    onPress={() => handleQuickCommand("Show me my recent payslips")}
                    color="#3B82F6"
                  />
                  <QuickActionButton 
                    icon={Clock}
                    label="Time Off"
                    onPress={() => handleQuickCommand("How do I request time off?")}
                    color="#F59E0B"
                  />
                  <QuickActionButton 
                    icon={BookOpen}
                    label="Policies"
                    onPress={() => handleQuickCommand("What are the company policies?")}
                    color="#8B5CF6"
                  />
                  <QuickActionButton 
                    icon={Users}
                    label="Staff"
                    onPress={() => handleQuickCommand("Who's on my team?")}
                    color="#EC4899"
                  />
                  <QuickActionButton 
                    icon={Target}
                    label="Schedule"
                    onPress={() => handleQuickCommand("What's my schedule this month?")}
                    color="#06B6D4"
                  />
                </View>
              </View>
              
              <View style={styles.suggestedQueries}>
                <Text style={styles.suggestedQueriesTitle}>Try asking:</Text>
                <TouchableOpacity 
                  style={styles.suggestedQuery}
                  onPress={() => handleQuickCommand("When is my next payday?")}
                >
                  <Text style={styles.suggestedQueryText}>When is my next payday?</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestedQuery}
                  onPress={() => handleQuickCommand("How many hours did I work last week?")}
                >
                  <Text style={styles.suggestedQueryText}>How many hours did I work last week?</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestedQuery}
                  onPress={() => handleQuickCommand("Who's working tomorrow?")}
                >
                  <Text style={styles.suggestedQueryText}>Who's working tomorrow?</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
          
          {messages.map((message, index) => renderMessage(message, index))}
          
          {isTyping && (
            <Animated.View 
              entering={FadeIn.duration(300)}
              style={styles.loadingContainer}
            >
              <View style={styles.aiAvatar}>
                <Bot size={20} color="#10B981" />
              </View>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.typingText}>AI Assistant is thinking...</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {attachments.length > 0 && (
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={styles.selectedAttachments}
          >
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
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  >
                    <Text style={styles.removeSelectedText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachmentButton}
            onPress={pickDocument}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Paperclip size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
          
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Ask me anything about shifts, payroll, or staff..."
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
      flex: 1,
      paddingHorizontal: 12,
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#10B98120',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    headerSubtitle: {
      fontSize: 11,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    commandsDropdown: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
      paddingVertical: 12,
    },
    commandsScrollContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    commandChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    commandChipText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#D1D5DB' : '#4B5563',
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
    loadMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    loadMoreText: {
      fontSize: 13,
      color: '#10B981',
      fontWeight: '500',
    },
    welcomeContainer: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    welcomeAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#10B98120',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 12,
      textAlign: 'center',
    },
    welcomeText: {
      fontSize: 15,
      color: isDark ? '#D1D5DB' : '#4B5563',
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 24,
    },
    quickActionsContainer: {
      width: '100%',
      marginBottom: 24,
    },
    quickActionsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 12,
      textAlign: 'center',
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
    },
    quickActionButton: {
      alignItems: 'center',
      width: (width - 64) / 3,
      padding: 12,
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    quickActionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    quickActionLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#D1D5DB' : '#4B5563',
      textAlign: 'center',
    },
    suggestedQueries: {
      width: '100%',
      backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    suggestedQueriesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#D1D5DB' : '#4B5563',
      marginBottom: 12,
    },
    suggestedQuery: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    suggestedQueryText: {
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
    messageContainer: {
      marginBottom: 16,
      borderRadius: 18,
      padding: 16,
      maxWidth: '85%',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
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
    appCommandContainer: {
      borderLeftWidth: 4,
      borderLeftColor: '#10B981',
    },
    errorMessageContainer: {
      backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2',
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
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
    errorAvatar: {
      backgroundColor: '#EF444420',
    },
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    headerTextContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
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
    errorSenderText: {
      color: '#EF4444',
    },
    timestampText: {
      fontSize: 11,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    errorTimestampText: {
      color: '#FCA5A5',
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
    errorMessageText: {
      color: isDark ? '#FECACA' : '#7F1D1D',
    },
    dataIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#10B98120',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 4,
    },
    dataIndicatorText: {
      fontSize: 10,
      color: '#10B981',
      fontWeight: '600',
    },
    dataPreview: {
      marginTop: 8,
      padding: 8,
      backgroundColor: isDark ? '#37415140' : '#F3F4F6',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    dataPreviewTitle: {
      fontSize: 11,
      color: '#10B981',
      fontWeight: '600',
      marginBottom: 2,
    },
    dataPreviewText: {
      fontSize: 10,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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