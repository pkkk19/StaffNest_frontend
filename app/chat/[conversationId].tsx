// app/chat/[conversationId].tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { socketService } from '@/services/socketService';

interface Message {
  _id: string;
  sender: {
    _id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
  content: string;
  createdAt: string;
  readBy: string[];
}

interface Conversation {
  _id: string;
  name?: string;
  participants: any[];
  lastMessage?: Message;
}

export default function ChatPage() {
  const { conversationId } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

   // app/chat/[conversationId].tsx - WebSocket useEffect only
useEffect(() => {
  let isSubscribed = true;
  let cleanup: (() => void) | undefined;

  const setupWebSocket = async () => {
    if (!conversationId || !isSubscribed) return;
    
    try {
      console.log('🔌 [WEBSOCKET] Setting up WebSocket connection...');
      
      const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;
      
      // Connect to WebSocket - it will get token from AsyncStorage internally
      await socketService.connect();
      
      // Join conversation
      await socketService.joinConversation(conversationIdStr);
      console.log('🔌 [WEBSOCKET] Successfully joined conversation:', conversationIdStr);
      
      // Listen for new messages
      const handleNewMessage = (newMessage: Message) => {
        if (!isSubscribed) return;
        
        console.log('📨 [WEBSOCKET] New message received:', newMessage);
        
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg._id === newMessage._id)) {
            console.log('📨 [WEBSOCKET] Duplicate message, skipping');
            return prev;
          }
          
          console.log('📨 [WEBSOCKET] Adding new message to list');
          return [...prev, newMessage];
        });
      };
      
      socketService.on('new_message', handleNewMessage);
      
      // Cleanup function
      cleanup = () => {
        socketService.off('new_message', handleNewMessage);
        socketService.leaveConversation(conversationIdStr);
      };
      
    } catch (error) {
      console.error('🔌 [WEBSOCKET] Setup failed:', error);
      Alert.alert('Connection Error', 'Failed to connect to chat service');
    }
  };

  setupWebSocket();
  
  return () => {
    isSubscribed = false;
    if (cleanup) {
      cleanup();
    }
    console.log('🧹 [WEBSOCKET] Cleaning up WebSocket');
  };
}, [conversationId]);

  // app/chat/[conversationId].tsx - Update the loadChatData function
const loadChatData = async () => {
  try {
    setLoading(true);
    console.log('🔄 [LOAD CHAT DATA] Starting to load messages...');
    console.log('🔄 Conversation ID:', conversationId);
    
    // Load messages for this conversation
    const messagesData = await chatService.getMessages(conversationId as string);
    console.log('📱 Messages loaded:', messagesData);
    console.log('📱 Messages count:', messagesData?.length);
    
    if (messagesData && messagesData.length > 0) {
      setMessages(messagesData);
      console.log('✅ Messages set to state');
      
      // Extract conversation info from messages
      const firstMessage = messagesData[0];
      setConversation({
        _id: conversationId as string,
        participants: [firstMessage.sender], // This is simplified
      });
      console.log('✅ Conversation set to state');
    } else {
      console.log('ℹ️ No messages found, setting empty array');
      setMessages([]);
    }
    
  } catch (error: any) {
    console.error('❌ Error loading chat:', error);
    console.error('❌ Error details:', error.response?.data || error.message);
    Alert.alert('Error', 'Failed to load chat messages');
  } finally {
    console.log('🏁 Setting loading to false');
    setLoading(false);
  }
};

useEffect(() => {
  loadChatData();
}, [conversationId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatData();
    setRefreshing(false);
  };

//added for debugging
  console.log('🔍 [CHAT PAGE DEBUG]');
  console.log('🔍 conversationId:', conversationId);
  console.log('🔍 typeof conversationId:', typeof conversationId);
  console.log('🔍 Full params:', useLocalSearchParams());
  
  useEffect(() => {
    console.log('🔍 [CHAT PAGE MOUNTED] conversationId:', conversationId);
  }, [conversationId]);

  const sendMessage = async () => {
    console.log('🔍 [SEND MESSAGE] conversationId:', conversationId);
    if (!conversationId) {
      console.error('❌ [SEND MESSAGE] No conversation ID available');
      Alert.alert('Error', 'No conversation selected');
      return;
    }
  if (!newMessage.trim()) return;

  const messageToSend = newMessage.trim();
  setNewMessage('');
  setSending(true);

  try {
    console.log('📱 Frontend - Conversation ID:', conversationId);
    console.log('📱 Frontend - Message content:', messageToSend);
    
    // Make sure conversationId is defined and is a string
    if (!conversationId || typeof conversationId !== 'string') {
      throw new Error(`Invalid conversation ID: ${conversationId}`);
    }

    const sentMessage = await chatService.sendMessage(
      conversationId, 
      messageToSend
    );
    
    // ... rest of your code
  } catch (error: any) {
    console.error('❌ Frontend - Send message error:', error);
    Alert.alert('Error', error.message || 'Failed to send message');
    setNewMessage(messageToSend);
  } finally {
    setSending(false);
  }
};

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChatUserName = () => {
    if (!conversation || conversation.participants.length === 0) {
      return 'Unknown User';
    }
    
    const otherParticipant = conversation.participants.find(
      participant => participant._id !== user?._id
    );
    
    if (otherParticipant) {
      return `${otherParticipant.first_name} ${otherParticipant.last_name}`;
    }
    
    return 'Unknown User';
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isCurrentUser = item.sender._id === user?._id;
    const previousMessage = messages[index - 1];
    const showAvatar = !previousMessage || previousMessage.sender._id !== item.sender._id;

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && showAvatar && (
          <View style={styles.messageAvatar}>
            {item.sender.profile_picture_url ? (
              <Image 
                source={{ uri: item.sender.profile_picture_url }} 
                style={styles.avatarImage} 
              />
            ) : (
              <Text style={styles.avatarText}>
                {item.sender.first_name?.charAt(0)}{item.sender.last_name?.charAt(0)}
              </Text>
            )}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          !showAvatar && (isCurrentUser ? styles.continuationCurrent : styles.continuationOther)
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isCurrentUser && styles.currentUserTime
            ]}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {isCurrentUser && (
              <Ionicons 
                name={item.readBy.length > 1 ? 'checkmark-done' : 'checkmark'} 
                size={14} 
                color={item.readBy.length > 1 ? '#007AFF' : '#999'} 
                style={styles.statusIcon} 
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: true, title: 'Loading...' }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
  >
    <Stack.Screen
      options={{
        headerShown: true,
        title: getChatUserName(),
        // Android header styling
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
        // Back button
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.infoButton}>
              <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        ),
      }}
    />

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
          />
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyChatText}>No messages yet</Text>
            <Text style={styles.emptyChatSubtext}>
              Start a conversation with {getChatUserName()}
            </Text>
          </View>
        }
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
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
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoButton: {
    padding: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 2,
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  continuationCurrent: {
    borderBottomRightRadius: 18,
  },
  continuationOther: {
    borderBottomLeftRadius: 18,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
    marginRight: 4,
  },
  currentUserTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  statusIcon: {
    marginLeft: 2,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});