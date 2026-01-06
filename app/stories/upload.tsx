import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { LinearGradient } from 'expo-linear-gradient';
import { storiesAPI } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { 
  Camera, 
  Video, 
  Image as ImageIcon, 
  X, 
  Users, 
  Building, 
  Eye,
  Send,
  Clock,
  MessageCircle,
  User,
  MoreVertical,
  Heart,
  MessageSquare,
  Share2,
  Plus
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StoryUploadScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [media, setMedia] = useState<{
    uri: string;
    type: 'image' | 'video';
    duration?: number;
    fileName?: string;
    mimeType?: string;
  } | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'friends' | 'company' | 'both'>('friends');
  const [storyType, setStoryType] = useState<'personal' | 'announcement' | 'policy' | 'event' | 'update'>('personal');
  const [uploading, setUploading] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const isDark = theme === 'dark';
  const styles = createStyles(isDark);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
          Alert.alert(
            'Permissions Required',
            'Sorry, we need camera and media library permissions to make this work!',
            [{ text: 'OK' }]
          );
        }
      }
    })();
  }, []);

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 15,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        handleSelectedMedia(asset);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media from gallery');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        handleSelectedMedia(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const takeVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 15,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        handleSelectedMedia(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking video:', error);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const handleSelectedMedia = async (asset: any) => {
    setMedia({
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
      duration: asset.duration,
      fileName: asset.fileName || `story_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
      mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    });

    setVideoDuration(asset.duration || 0);

    if (asset.type === 'video') {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
          time: 1000,
        });
        setThumbnail(uri);
      } catch (e) {
        console.error('Error generating thumbnail:', e);
        setThumbnail(asset.uri);
      }
    } else {
      setThumbnail(asset.uri);
    }
  };

  const clearMedia = () => {
    setMedia(null);
    setThumbnail(null);
    setVideoDuration(0);
  };

  const uploadStory = async () => {
    if (!media) {
      Alert.alert('No Media', 'Please select a photo or video first');
      return;
    }

    if (media.type === 'video' && videoDuration > 15) {
      Alert.alert(
        'Video Too Long',
        `Your video is ${Math.ceil(videoDuration)} seconds long. Maximum allowed is 15 seconds.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      
      formData.append('file', {
        uri: media.uri,
        type: media.mimeType || (media.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        name: media.fileName || `story.${media.type === 'video' ? 'mp4' : 'jpg'}`,
      } as any);

      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }
      formData.append('visibility', visibility);
      formData.append('type', storyType);

      const response = await storiesAPI.uploadStory(formData);

      Alert.alert(
        'Posted! 🎉',
        'Your story has been uploaded and will be visible to others.',
        [
          {
            text: 'View Story',
            onPress: () => {
              router.back();
            }
          }
        ]
      );

      clearMedia();
      setCaption('');
      setVisibility('friends');
      setStoryType('personal');
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      
      let errorMessage = 'Failed to upload story. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const renderStoryPreview = () => {
    if (!media) {
      // No placeholder - just show the "Create Story" UI
      return null;
    }

    return (
      <View style={styles.storyPreviewContainer}>
        {/* Story Preview with Instagram-like overlay */}
        <View style={styles.storyScreen}>
          <Image
            source={{ uri: thumbnail || media.uri }}
            style={styles.storyMedia}
            resizeMode="cover"
          />
          
          {/* Top gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.topGradient}
          />
          
          {/* Bottom gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.bottomGradient}
          />
          
          {/* Top bar with user info */}
          <View style={styles.storyTopBar}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <User size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.username}>Your Story</Text>
                <Text style={styles.timeText}>Just now</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <MoreVertical size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Caption preview */}
          {caption ? (
            <View style={styles.captionPreview}>
              <Text style={styles.captionText}>{caption}</Text>
            </View>
          ) : null}
          
          {/* Video badge */}
          {media.type === 'video' && (
            <View style={styles.videoBadge}>
              <Video size={16} color="#FFFFFF" />
              <Text style={styles.videoDuration}>
                {Math.ceil(videoDuration)}s
              </Text>
            </View>
          )}
          
          {/* Bottom controls */}
          <View style={styles.storyControls}>
            <TouchableOpacity style={styles.storyControlButton}>
              <Heart size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.storyControlButton}>
              <MessageSquare size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.storyControlButton}>
              <Share2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Clear media button */}
        <TouchableOpacity style={styles.clearStoryButton} onPress={clearMedia}>
          <View style={styles.clearStoryButtonInner}>
            <X size={18} color="#FFFFFF" />
            <Text style={styles.clearStoryText}>Change</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMediaSelection = () => {
    if (media) return null; // Hide selection buttons when media is selected

    return (
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : ['#F3F4F6', '#E5E7EB']}
        style={styles.mediaSelectionContainer}
      >
        <View style={styles.mediaSelectionContent}>
          <Text style={[styles.mediaSelectionTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
            Create a New Story
          </Text>
          <Text style={[styles.mediaSelectionSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Share a photo or video that disappears after 24 hours
          </Text>
          
          <View style={styles.mediaSelectionButtons}>
            <TouchableOpacity style={styles.mediaSelectionButton} onPress={pickFromGallery}>
              <LinearGradient
                colors={['#8B5CF6', '#3B82F6']}
                style={styles.mediaButtonGradient}
              >
                <ImageIcon size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.mediaSelectionButtonText, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                Gallery
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mediaSelectionButton} onPress={takePhoto}>
              <LinearGradient
                colors={['#10B981', '#3B82F6']}
                style={styles.mediaButtonGradient}
              >
                <Camera size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.mediaSelectionButtonText, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                Camera
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mediaSelectionButton} onPress={takeVideo}>
              <LinearGradient
                colors={['#EF4444', '#8B5CF6']}
                style={styles.mediaButtonGradient}
              >
                <Video size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.mediaSelectionButtonText, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                Video
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mediaSelectionHint}>
            <Clock size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text style={[styles.mediaSelectionHintText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Maximum 15 seconds for videos
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderVisibilityOptions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
        Who can see this?
      </Text>
      <View style={styles.visibilityOptions}>
        {[
          { value: 'friends', icon: Users, label: 'Friends' },
          { value: 'company', icon: Building, label: 'Company' },
          { value: 'both', icon: Eye, label: 'Everyone' }
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.visibilityOption,
              visibility === option.value && styles.visibilityOptionSelected
            ]}
            onPress={() => setVisibility(option.value as any)}
          >
            <LinearGradient
              colors={visibility === option.value ? ['#8B5CF6', '#3B82F6'] : ['transparent', 'transparent']}
              style={styles.visibilityOptionGradient}
            >
              <option.icon 
                size={20} 
                color={visibility === option.value ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')} 
              />
            </LinearGradient>
            <Text style={[
              styles.visibilityOptionText,
              { color: visibility === option.value ? '#3B82F6' : (isDark ? '#F9FAFB' : '#111827') }
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStoryTypeOptions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
        Story Type
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
        {(['personal', 'announcement', 'policy', 'event', 'update'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeOption,
              storyType === type && styles.typeOptionSelected,
            ]}
            onPress={() => setStoryType(type)}
          >
            <Text style={[
              styles.typeOptionText,
              { color: storyType === type ? '#FFFFFF' : (isDark ? '#F9FAFB' : '#111827') }
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F9FAFB' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#1F2937', '#111827'] : ['#FFFFFF', '#F9FAFB']}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <X size={24} color={isDark ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
            Create Story
          </Text>
          <TouchableOpacity 
            onPress={uploadStory} 
            style={[styles.shareButton, uploading && styles.shareButtonDisabled]}
            disabled={uploading || !media}
          >
            <LinearGradient
              colors={media ? ['#8B5CF6', '#3B82F6'] : ['#6B7280', '#4B5563']}
              style={styles.shareButtonGradient}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={20} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Story Preview or Media Selection */}
        <View style={styles.mediaContainer}>
          {media ? renderStoryPreview() : renderMediaSelection()}
        </View>

        {/* Caption Input (only shown when media is selected) */}
        {media && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
              Add a caption
            </Text>
            <View style={[
              styles.captionContainer,
              { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderColor: isDark ? '#374151' : '#E5E7EB' }
            ]}>
              <MessageCircle size={20} color={isDark ? '#9CA3AF' : '#6B7280'} style={styles.captionIcon} />
              <TextInput
                style={[styles.captionInput, { color: isDark ? '#F9FAFB' : '#111827' }]}
                placeholder="What's happening?"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={150}
              />
              <Text style={[styles.charCount, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                {caption.length}/150
              </Text>
            </View>
          </View>
        )}

        {/* Visibility Options (only shown when media is selected) */}
        {media && renderVisibilityOptions()}

        {/* Story Type Options (only shown when media is selected) */}
        {media && renderStoryTypeOptions()}

        {/* Upload Progress */}
        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={[styles.uploadingText, { color: isDark ? '#F9FAFB' : '#111827' }]}>
              Uploading your story...
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#E5E7EB',
  },
  backButton: {
    padding: 8,
    backgroundColor: isDark ? '#374151' : '#F3F4F6',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  mediaContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    minHeight: SCREEN_WIDTH * (16/9), // Maintain story aspect ratio
  },
  mediaSelectionContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
  },
  mediaSelectionContent: {
    alignItems: 'center',
  },
  mediaSelectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  mediaSelectionSubtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  mediaSelectionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  mediaSelectionButton: {
    alignItems: 'center',
    minWidth: 80,
  },
  mediaButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mediaSelectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mediaSelectionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaSelectionHintText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  storyPreviewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  storyScreen: {
    width: '100%',
    aspectRatio: 9/16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  storyMedia: {
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  storyTopBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  moreButton: {
    padding: 8,
  },
  captionPreview: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 12,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  videoBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  videoDuration: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  storyControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  storyControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearStoryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: isDark ? '#374151' : '#E5E7EB',
    borderRadius: 20,
  },
  clearStoryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearStoryText: {
    color: isDark ? '#F9FAFB' : '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  captionIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  captionInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCount: {
    fontSize: 12,
    marginTop: 4,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
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
  visibilityOptionGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  visibilityOptionSelected: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  visibilityOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeScroll: {
    flexDirection: 'row',
  },
  typeOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: isDark ? '#374151' : '#E5E7EB',
  },
  typeOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    letterSpacing: -0.3,
  },
});