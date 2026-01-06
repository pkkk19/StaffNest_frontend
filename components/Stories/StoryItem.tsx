import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions 
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Plus, Play } from 'lucide-react-native';

interface StoryItemProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  isSeen: boolean;
  isVideo?: boolean;
  duration?: number;
  type?: 'announcement' | 'policy' | 'event' | 'update' | 'achievement';
  onPress?: () => void;
  isCurrentUser?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORY_SIZE = 70;
const BORDER_WIDTH = 2;

export default function StoryItem({
  id,
  title,
  subtitle,
  imageUrl,
  thumbnailUrl,
  isSeen,
  isVideo = false,
  duration,
  type,
  onPress,
  isCurrentUser = false
}: StoryItemProps) {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const isDark = theme === 'dark';

  const getTypeColor = () => {
    switch (type) {
      case 'announcement': return '#3B82F6';
      case 'policy': return '#10B981';
      case 'event': return '#8B5CF6';
      case 'achievement': return '#F59E0B';
      default: return '#EF4444';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[
        styles.imageContainer,
        isCurrentUser && styles.currentUserContainer
      ]}>
        {/* Outer colored border ring */}
        <View style={[
          styles.outerRing,
          isCurrentUser ? styles.currentUserOuterRing : (isSeen ? styles.seenOuterRing : styles.unseenOuterRing)
        ]} />
        
        {/* Image with inner border */}
        <View style={[
          styles.imageWrapper,
          isSeen ? styles.seenImageWrapper : styles.unseenImageWrapper,
          type && { borderColor: `${getTypeColor()}40` }
        ]}>
          {imageError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>📷</Text>
            </View>
          ) : (
            <Image 
              source={{ uri: thumbnailUrl || imageUrl }} 
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          )}
          
          {isVideo && (
            <View style={styles.videoIndicator}>
              <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          )}
          
          {duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{duration}s</Text>
            </View>
          )}
        </View>
        
        {/* Your Story indicator */}
        {isCurrentUser && (
          <View style={styles.addButton}>
            <Plus size={14} color="#FFFFFF" />
          </View>
        )}
      </View>
      
      <Text 
        style={[
          styles.title,
          isSeen ? styles.seenText : styles.unseenText,
          type && !isSeen && { color: getTypeColor() }
        ]}
        numberOfLines={1}
      >
        {isCurrentUser ? 'Your Story' : title}
      </Text>
      
      {subtitle && (
        <Text 
          style={[
            styles.subtitle,
            { color: isDark ? '#9CA3AF' : '#6B7280' }
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      )}
      
      {type && (
        <View style={[
          styles.typeIndicator,
          { backgroundColor: `${getTypeColor()}20` }
        ]}>
          <Text style={[
            styles.typeText,
            { color: getTypeColor() }
          ]}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 85,
    marginHorizontal: 4,
    marginTop: 4,
    position: 'relative',
  },
  imageContainer: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  currentUserContainer: {
    // Special styling for current user's story
  },
  outerRing: {
    position: 'absolute',
    width: STORY_SIZE + 8,
    height: STORY_SIZE + 8,
    borderRadius: (STORY_SIZE + 8) / 2,
    borderWidth: BORDER_WIDTH,
  },
  unseenOuterRing: {
    borderColor: '#EF4444',
  },
  seenOuterRing: {
    borderColor: '#10B981',
  },
  currentUserOuterRing: {
    borderColor: '#818181ff',
  },
  imageWrapper: {
    width: STORY_SIZE - 8,
    height: STORY_SIZE - 8,
    borderRadius: (STORY_SIZE - 8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  unseenImageWrapper: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  seenImageWrapper: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: (STORY_SIZE - 8) / 2,
    backgroundColor: '#E5E7EB',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: (STORY_SIZE - 8) / 2,
  },
  errorText: {
    fontSize: 24,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 80,
  },
  unseenText: {
    color: '#898f9bff',
    fontWeight: '600',
  },
  seenText: {
    color: '#6B7280',
  },
  subtitle: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 80,
  },
  typeIndicator: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});