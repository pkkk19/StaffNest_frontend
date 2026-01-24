import { useTheme } from '@/contexts/ThemeContext';

export const useChatTheme = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    // Backgrounds
    background: isDark ? '#0F172A' : '#F8FAFC',
    backgroundSecondary: isDark ? '#1E293B' : '#FFFFFF',
    
    // Text
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textTertiary: isDark ? '#CBD5E1' : '#94A3B8',
    
    // Borders
    border: isDark ? '#334155' : '#E2E8F0',
    
    // Message Bubbles
    currentUserBubble: isDark ? '#3B82F6' : '#2563EB', // Bright blue
    otherUserBubble: isDark ? '#374151' : '#F3F4F6', // Soft gray
    
    // Input
    inputBackground: isDark ? '#1F2937' : '#FFFFFF',
    sendButton: isDark ? '#3B82F6' : '#2563EB',
    sendButtonDisabled: isDark ? '#4B5563' : '#9CA3AF',
    
    // Status
    statusRead: isDark ? '#10B981' : '#059669', // Green
    statusUnread: isDark ? '#6B7280' : '#9CA3B8',
    
    // Accents
    accent: isDark ? '#8B5CF6' : '#7C3AED', // Purple
    warning: isDark ? '#F59E0B' : '#D97706', // Amber
    error: isDark ? '#EF4444' : '#DC2626', // Red
  };

  return { colors, isDark, theme };
};