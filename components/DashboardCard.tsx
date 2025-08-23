import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

export function DashboardCard({ title, value, subtitle, color }: DashboardCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function createStyles(theme: string) {
  const isDark = theme === 'dark';
  
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
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
    title: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 8,
    },
    value: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
  });
}