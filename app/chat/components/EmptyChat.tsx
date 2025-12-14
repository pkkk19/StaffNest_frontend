// app/chat/components/EmptyChat.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatTheme } from '../hooks/useChatTheme';

const { width } = Dimensions.get('window');

interface EmptyChatProps {
  chatUserName: string;
  userImage?: string | null;
  onCall?: () => void;
  onMessage?: () => void;
}

export const EmptyChat: React.FC<EmptyChatProps> = ({ 
  chatUserName, 
  userImage, 
  onCall,
  onMessage 
}) => {
  const { colors, isDark } = useChatTheme();
  const styles = createStyles(colors, isDark);

  // Safely get initials from username
  const getInitials = (name: string): string => {
    if (!name || name.trim().length === 0) return '??';
    
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '??';
    
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(chatUserName);

  return (
    <View style={styles.emptyChat}>
      {/* Profile Image */}
      <View style={styles.profileContainer}>
        {userImage ? (
          <Image 
            source={{ uri: userImage }} 
            style={styles.profileImage} 
          />
        ) : (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.profileGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileInitials}>
              {initials}
            </Text>
          </LinearGradient>
        )}
        
        <View style={styles.onlineIndicator} />
      </View>
      
      {/* Welcome Text */}
      <Text style={styles.welcomeText}>
        Say hello to {chatUserName || 'your contact'} 👋
      </Text>
      
      <Text style={styles.subtitleText}>
        Start a conversation by sending a message or making a call
      </Text>
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={onMessage}
          disabled={!onMessage}
        >
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="chatbubble" size={24} color="white" />
          </LinearGradient>
          <Text style={styles.quickActionText}>Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={onCall}
          disabled={!onCall}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="videocam" size={24} color="white" />
          </LinearGradient>
          <Text style={styles.quickActionText}>Video Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={onCall}
          disabled={!onCall}
        >
          <LinearGradient
            colors={['#45B7D1', '#3498DB']}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="call" size={24} color="white" />
          </LinearGradient>
          <Text style={styles.quickActionText}>Voice Call</Text>
        </TouchableOpacity>
      </View>
      
      {/* Quick Messages */}
      <View style={styles.quickMessages}>
        <Text style={styles.quickMessagesTitle}>Quick Messages</Text>
        <View style={styles.quickMessagesGrid}>
          {[
            "Hi! 👋",
            "How are you?",
            "Let's catch up!",
            "Call me when you're free"
          ].map((msg, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.quickMessageButton}
              onPress={() => onMessage?.()}
              disabled={!onMessage}
            >
              <Text style={styles.quickMessageText}>{msg}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Connection Info */}
      <View style={styles.connectionInfo}>
        <MaterialIcons 
          name="security" 
          size={16} 
          color={colors.currentUserBubble} 
        />
        <Text style={styles.connectionText}>
          Messages are end-to-end encrypted
        </Text>
      </View>
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  profileContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: colors.background,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  quickActionButton: {
    alignItems: 'center',
    width: 80,
    opacity: 1,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  quickMessages: {
    width: '100%',
    marginBottom: 32,
  },
  quickMessagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  quickMessagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickMessageButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickMessageText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  connectionText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});