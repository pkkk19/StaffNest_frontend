import { useTheme } from '@/contexts/ThemeContext';

export const useChatTheme = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#111827' : '#F9FAFB',
    backgroundSecondary: isDark ? '#1F2937' : '#FFFFFF',
    textPrimary: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    textTertiary: isDark ? '#D1D5DB' : '#4B5563',
    border: isDark ? '#374151' : '#E5E7EB',
    currentUserBubble: '#2563EB', // Blue for current user
    otherUserBubble: isDark ? '#374151' : '#FFFFFF',
    inputBackground: isDark ? '#1F2937' : '#F3F4F6',
    sendButton: '#2563EB',
    sendButtonDisabled: isDark ? '#4B5563' : '#9CA3AF',
    statusRead: '#10B981', // Green for read status
    statusUnread: isDark ? '#9CA3AF' : '#6B7280',
  };

  return { colors, isDark, theme };
};