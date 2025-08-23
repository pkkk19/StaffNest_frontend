import { View, Text, StyleSheet, Platform } from 'react-native';
import { Bell, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Info } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import ForceTouchable from './ForceTouchable';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={20} color="#10B981" />;
      case 'warning':
        return <AlertTriangle size={20} color="#F59E0B" />;
      case 'error':
        return <AlertTriangle size={20} color="#EF4444" />;
      default:
        return <Info size={20} color="#2563EB" />;
    }
  };

  return (
    <ForceTouchable style={styles.container}>
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>{notification.time}</Text>
      </View>
    </ForceTouchable>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      // REMOVED shadow properties - using platform-specific
      ...Platform.select({
        ios: {
          // iOS shadow (commented out to fix Android)
          // shadowColor: '#000',
          // shadowOffset: { width: 0, height: 2 },
          // shadowOpacity: isDark ? 0.3 : 0.1,
          // shadowRadius: 4,
        },
        android: {
          elevation: 3, // Android shadow
        },
      }),
    },
    iconContainer: {
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    message: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
      lineHeight: 20,
    },
    time: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
    },
  });
}