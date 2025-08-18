import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'voice';
  fileUrl?: string;
  fileName?: string;
  read: boolean;
  edited?: boolean;
  editedAt?: string;
}

interface Chat {
  id: string;
  type: 'direct' | 'group';
  name: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  isActive: boolean;
}

interface ChatState {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  activeChat: string | null;
  onlineUsers: string[];
  loading: boolean;
}

const initialState: ChatState = {
  chats: [],
  messages: {},
  activeChat: null,
  onlineUsers: [],
  loading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      state.chats.push(action.payload);
    },
    setMessages: (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
      state.messages[action.payload.chatId] = action.payload.messages;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const chatId = action.payload.chatId;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(action.payload);
      
      // Update last message in chat
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        chat.lastMessage = action.payload;
        if (action.payload.senderId !== 'current-user-id') { // Replace with actual current user ID
          chat.unreadCount += 1;
        }
      }
    },
    markMessagesAsRead: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (state.messages[chatId]) {
        state.messages[chatId].forEach(message => {
          message.read = true;
        });
      }
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        chat.unreadCount = 0;
      }
    },
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChat = action.payload;
    },
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setChats, addChat, setMessages, addMessage, markMessagesAsRead, setActiveChat, setOnlineUsers, setLoading } = chatSlice.actions;
export default chatSlice.reducer;