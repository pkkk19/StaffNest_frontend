// app/components/stories/StoryItem.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';

interface StoryItemProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  isSeen: boolean;
  isCurrentUser?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  onPress: () => void;
}

const StoryItem: React.FC<StoryItemProps> = ({
  id,
  title,
  subtitle,
  imageUrl,
  isSeen,
  isCurrentUser = false,
  isUploading = false,
  uploadProgress = 0,
  onPress,
}) => {
  const borderColor = isSeen ? '#D1D5DB' : '#3B82F6';
  const borderWidth = isCurrentUser ? 2 : 3;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {isUploading ? (
          <View style={styles.uploadingContainer}>
            <View style={styles.uploadRing}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
            {/* Progress text */}
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        ) : (
          <View style={styles.imageWrapper}>
            <View style={[
              styles.gradientBorder,
              { 
                borderWidth: 3,
                borderColor: isSeen ? '#D1D5DB' : '#3B82F6'
              }
            ]}>
              <Image
                source={{ uri: imageUrl }}
                style={[
                  styles.image,
                  { 
                    borderWidth: isCurrentUser ? 2 : 0,
                    borderColor: '#FFFFFF'
                  }
                ]}
                resizeMode="cover"
              />
            </View>
            
            {/* PLUS BUTTON for current user - positioned outside the circle */}
            {isCurrentUser && !isUploading && (
              <View style={styles.plusButtonContainer}>
                <View style={styles.plusButtonBackground}>
                  <Plus size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
              </View>
            )}
          </View>
        )}
      </View>
      
      <Text style={styles.title} numberOfLines={1}>
        {isCurrentUser ? 'Your Story' : title}
      </Text>
      
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 84,
  },
  imageContainer: {
    position: 'relative',
  },
  imageWrapper: {
    position: 'relative',
    width: 76,
    height: 76,
  },
  gradientBorder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3F4F6',
  },
  uploadingContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  uploadRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  // Plus button styles - positioned outside the circle
  plusButtonContainer: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    zIndex: 10,
  },
  plusButtonBackground: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    color: '#374151',
    textAlign: 'center',
    maxWidth: '100%',
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
    maxWidth: '100%',
  },
});

export default StoryItem;