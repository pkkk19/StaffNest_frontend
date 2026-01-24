import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Modal,
  Animated,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  PanResponder,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { storiesAPI } from '@/services/api';
import { 
  Camera, 
  Video as VideoIcon,
  Image as ImageIcon, 
  X, 
  Users, 
  Building, 
  Send,
  MessageCircle,
  Globe,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Visibility Dropdown Component - Improved with absolute positioning
const VisibilityDropdown = ({
  value,
  onChange,
  isDark,
  isOpen,
  setIsOpen,
  zIndex
}: {
  value: 'friends' | 'company' | 'both';
  onChange: (value: 'friends' | 'company' | 'both') => void;
  isDark: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  zIndex: number;
}) => {
  const options = [
    {
      id: 'friends' as const,
      label: 'Friends',
      icon: Users,
      description: 'Visible to your connections only'
    },
    {
      id: 'company' as const,
      label: 'Company',
      icon: Building,
      description: 'Visible to company members only'
    },
    {
      id: 'both' as const,
      label: 'Everyone',
      icon: Globe,
      description: 'Visible to everyone in network'
    },
  ];

  const selectedOption = options.find(opt => opt.id === value) || options[0];

  return (
    <View style={[styles.dropdownContainer, { zIndex }]}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          { backgroundColor: isDark ? '#374151' : '#F3F4F6' }
        ]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownButtonContent}>
          <selectedOption.icon size={20} color="#3B82F6" />
          <View style={styles.dropdownTextContainer}>
            <Text style={[styles.dropdownButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {selectedOption.label}
            </Text>
            <Text style={[styles.dropdownButtonDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {selectedOption.description}
            </Text>
          </View>
        </View>
        {isOpen ? (
          <ChevronUp size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        ) : (
          <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View style={[
          styles.dropdownMenu,
          { 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }
        ]}>
          <ScrollView 
            style={styles.dropdownMenuScroll}
            nestedScrollEnabled={true}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.dropdownItem,
                  value === option.id && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                activeOpacity={0.6}
              >
                <option.icon 
                  size={20} 
                  color={value === option.id ? '#3B82F6' : (isDark ? '#9CA3AF' : '#6B7280')} 
                />
                <View style={styles.dropdownItemText}>
                  <Text style={[
                    styles.dropdownItemLabel,
                    { color: value === option.id ? '#3B82F6' : (isDark ? '#FFFFFF' : '#111827') }
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.dropdownItemDescription,
                    { color: isDark ? '#9CA3AF' : '#6B7280' }
                  ]}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Story Type Dropdown Component - Improved with absolute positioning
const StoryTypeDropdown = ({
  value,
  onChange,
  isDark,
  isOpen,
  setIsOpen,
  zIndex
}: {
  value: 'personal' | 'announcement' | 'policy' | 'event' | 'update';
  onChange: (value: 'personal' | 'announcement' | 'policy' | 'event' | 'update') => void;
  isDark: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  zIndex: number;
}) => {
  const types = [
    { id: 'personal' as const, label: 'Personal', color: '#3B82F6' },
    { id: 'announcement' as const, label: 'Announcement', color: '#10B981' },
    { id: 'policy' as const, label: 'Policy', color: '#8B5CF6' },
    { id: 'event' as const, label: 'Event', color: '#F59E0B' },
    { id: 'update' as const, label: 'Update', color: '#EF4444' },
  ];

  const selectedType = types.find(type => type.id === value) || types[0];

  return (
    <View style={[styles.dropdownContainer, { zIndex }]}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          { backgroundColor: isDark ? '#374151' : '#F3F4F6' }
        ]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownButtonContent}>
          <View style={[styles.typeIndicator, { backgroundColor: selectedType.color }]} />
          <Text style={[styles.dropdownButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {selectedType.label}
          </Text>
        </View>
        {isOpen ? (
          <ChevronUp size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        ) : (
          <ChevronDown size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View style={[
          styles.dropdownMenu,
          { 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }
        ]}>
          <ScrollView 
            style={styles.dropdownMenuScroll}
            nestedScrollEnabled={true}
          >
            {types.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.dropdownItem,
                  value === type.id && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  onChange(type.id);
                  setIsOpen(false);
                }}
                activeOpacity={0.6}
              >
                <View style={[styles.typeIndicator, { backgroundColor: type.color }]} />
                <Text style={[
                  styles.dropdownItemLabel,
                  { 
                    color: value === type.id ? '#3B82F6' : (isDark ? '#FFFFFF' : '#111827'),
                    marginLeft: 12
                  }
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Media Selection Component
const MediaSelection = ({ 
  onPickFromGallery, 
  onTakePhoto, 
  onTakeVideo,
  isDark 
}: { 
  onPickFromGallery: () => void;
  onTakePhoto: () => void;
  onTakeVideo: () => void;
  isDark: boolean;
}) => {
  return (
    <SafeAreaView style={[styles.mediaSelectionContainer, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={isDark ? '#000000' : '#FFFFFF'}
      />
      <View style={styles.mediaSelectionHeader}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        >
          <X size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        
        <Text style={[styles.mediaSelectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Create Story
        </Text>
        
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.mediaSelectionContent}>
        <Text style={[styles.mediaSelectionSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Share a moment that disappears after 24 hours
        </Text>
        
        <View style={styles.mediaOptions}>
          <TouchableOpacity
            style={styles.mediaOption}
            onPress={onPickFromGallery}
            activeOpacity={0.7}
          >
            <View style={[styles.mediaOptionIcon, { backgroundColor: '#3B82F6' }]}>
              <ImageIcon size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.mediaOptionLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaOption}
            onPress={onTakePhoto}
            activeOpacity={0.7}
          >
            <View style={[styles.mediaOptionIcon, { backgroundColor: '#10B981' }]}>
              <Camera size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.mediaOptionLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaOption}
            onPress={onTakeVideo}
            activeOpacity={0.7}
          >
            <View style={[styles.mediaOptionIcon, { backgroundColor: '#8B5CF6' }]}>
              <VideoIcon size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.mediaOptionLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Video
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Bottom Sheet Component - No drag version
const BottomSheet = ({ 
  children, 
  isVisible, 
  onClose,
  isDark 
}: { 
  children: React.ReactNode; 
  isVisible: boolean; 
  onClose: () => void;
  isDark: boolean;
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [isVisible]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  if (!isVisible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.bottomSheetOverlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.bottomSheetOverlayTouchable} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.bottomSheetContainer,
            {
              transform: [{ translateY }],
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            }
          ]}
        >
          <View style={styles.bottomSheetHandle}>
            <View style={[styles.bottomSheetHandleBar, { backgroundColor: isDark ? '#4B5563' : '#D1D5DB' }]} />
          </View>
          <ScrollView 
            style={styles.bottomSheetScroll}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.bottomSheetScrollContent}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isCaptionFocused, setIsCaptionFocused] = useState(false);
  
  // Separate state for dropdown visibility to prevent overlap
  const [visibilityDropdownOpen, setVisibilityDropdownOpen] = useState(false);
  const [storyTypeDropdownOpen, setStoryTypeDropdownOpen] = useState(false);

  const isDark = theme === 'dark';
  const slideAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
          Alert.alert(
            'Permissions Required',
            'We need camera and media library permissions to let you create stories',
            [{ text: 'OK' }]
          );
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (media) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [media]);

  const getVideoDuration = async (uri: string): Promise<number> => {
    try {
      const video = new Video({ source: { uri } });
      await video.loadAsync({ uri }, {}, false);
      const status = await video.getStatusAsync() as AVPlaybackStatus;
      await video.unloadAsync();
      
      if (status.isLoaded) {
        return status.durationMillis! / 1000;
      }
      return 0;
    } catch (error) {
      console.error('Error getting video duration:', error);
      return 0;
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 15,
        aspect: [9, 16],
      });

      if (!result.canceled && result.assets[0]) {
        await handleSelectedMedia(result.assets[0]);
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
        quality: 0.8,
        aspect: [9, 16],
      });

      if (!result.canceled && result.assets[0]) {
        await handleSelectedMedia(result.assets[0]);
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
        quality: 0.8,
        videoMaxDuration: 15,
        aspect: [9, 16],
      });

      if (!result.canceled && result.assets[0]) {
        await handleSelectedMedia(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking video:', error);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const handleSelectedMedia = async (asset: any) => {
    try {
      let duration = 0;
      
      if (asset.type === 'video') {
        duration = await getVideoDuration(asset.uri);
        
        if (duration === 0) {
          duration = asset.duration || 0;
        }
        
        if (duration > 15) {
          Alert.alert(
            'Video Too Long',
            `Your video is ${Math.ceil(duration)} seconds. Stories are limited to 15 seconds. The video will be automatically trimmed to the first 15 seconds.`,
            [{ text: 'OK' }]
          );
        }
      }

      setVideoDuration(duration);

      setMedia({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        duration: duration,
        fileName: asset.fileName || `story_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
        mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      });

      // Generate thumbnail
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
      
    } catch (error) {
      console.error('Error handling media:', error);
      Alert.alert('Error', 'Failed to process media');
    }
  };

  const clearMedia = () => {
    setMedia(null);
    setThumbnail(null);
    setVideoDuration(0);
    setCaption('');
    setShowBottomSheet(false);
    setVisibilityDropdownOpen(false);
    setStoryTypeDropdownOpen(false);
    Keyboard.dismiss();
  };

  // Background upload function - immediate redirect
  const uploadStory = async () => {
    if (!media) {
      Alert.alert('No Media', 'Please select a photo or video first');
      return;
    }

    const currentMedia = media;

    if (currentMedia.type === 'video' && videoDuration > 15) {
      Alert.alert(
        'Video Will Be Trimmed',
        `Your video is ${Math.ceil(videoDuration)} seconds. It will be automatically trimmed to 15 seconds when shared.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => performUpload(currentMedia) }
        ]
      );
      return;
    }

    performUpload(currentMedia);
  };

  const performUpload = async (currentMedia: {
    uri: string;
    type: 'image' | 'video';
    duration?: number;
    fileName?: string;
    mimeType?: string;
  }) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Redirect to dashboard immediately
      router.replace('/(tabs)');
      
      // Start upload in background
      setTimeout(async () => {
        try {
          const formData = new FormData();
          
          formData.append('file', {
            uri: currentMedia.uri,
            type: currentMedia.mimeType || (currentMedia.type === 'video' ? 'video/mp4' : 'image/jpeg'),
            name: currentMedia.fileName || `story.${currentMedia.type === 'video' ? 'mp4' : 'jpg'}`,
          } as any);

          if (caption.trim()) {
            formData.append('caption', caption.trim());
          }
          formData.append('visibility', visibility);
          formData.append('type', storyType);

          const response = await storiesAPI.uploadStory(formData);
          
          if (!response.success) {
            throw new Error(response.message || 'Upload failed');
          }
          
          // Upload successful - progress will be shown in the StoryItem component
          
        } catch (error: any) {
          console.error('Upload failed:', error);
          
          let errorMessage = 'Failed to upload story. Please try again.';
          
          if (error.message?.includes('Network Error')) {
            errorMessage = 'Network error. Check your internet connection.';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          // Show error alert on dashboard
          setTimeout(() => {
            Alert.alert('Upload Failed', errorMessage);
          }, 1000);
        }
      }, 500); // Small delay to ensure navigation completes
      
    } catch (error: any) {
      console.error('Upload preparation failed:', error);
      Alert.alert('Error', 'Failed to start upload. Please try again.');
    } finally {
      // We don't set uploading to false here since we want the progress indicator
      // to continue showing in the StoryItem component
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsCaptionFocused(false);
    setVisibilityDropdownOpen(false);
    setStoryTypeDropdownOpen(false);
  };

  const toggleBottomSheet = () => {
    setShowBottomSheet(!showBottomSheet);
    setVisibilityDropdownOpen(false);
    setStoryTypeDropdownOpen(false);
  };

  // Media Selection Screen
  if (!media) {
    return (
      <MediaSelection
        onPickFromGallery={pickFromGallery}
        onTakePhoto={takePhoto}
        onTakeVideo={takeVideo}
        isDark={isDark}
      />
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="#000000"
          translucent={Platform.OS === 'android'}
        />
        <KeyboardAvoidingView
          style={styles.keyboardAvoidView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Full Screen Image/Video */}
          {media.type === 'image' ? (
            <Image
              source={{ uri: thumbnail || media.uri }}
              style={styles.fullScreenImage}
              resizeMode="cover"
            />
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: media.uri }}
              style={styles.fullScreenImage}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
              useNativeControls={false}
            />
          )}
          
          {/* Upload Progress Overlay */}
          {uploading && (
            <View style={styles.uploadOverlay}>
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
                <Text style={styles.uploadingText}>Uploading in background...</Text>
              </View>
            </View>
          )}
          
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity 
              style={[styles.topControlButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Video duration indicator */}
            {media.type === 'video' && (
              <View style={[styles.topControlButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <Clock size={20} color="#FFFFFF" />
                <Text style={[styles.durationText, { marginLeft: 4 }]}>
                  {Math.ceil(videoDuration)}s
                  {videoDuration > 15 && ' (will trim)'}
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.topControlButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              onPress={() => clearMedia()}
              activeOpacity={0.7}
            >
              <X size={20} color="#FFFFFF" />
              <Text style={styles.clearButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
          
          {/* Caption Input - Made transparent */}
          <View style={styles.captionOverlay}>
            <View style={[
              styles.captionInputContainer,
              { 
                backgroundColor: 'rgba(0, 0, 0, 0.3)', // Transparent background
                borderWidth: isCaptionFocused ? 1 : 0,
                borderColor: '#3B82F6'
              }
            ]}>
              <MessageCircle size={20} color="rgba(255, 255, 255, 0.7)" />
              <TextInput
                style={[styles.captionInput, { color: '#FFFFFF' }]}
                placeholder="Add a caption..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={caption}
                onChangeText={setCaption}
                onFocus={() => {
                  setIsCaptionFocused(true);
                  setVisibilityDropdownOpen(false);
                  setStoryTypeDropdownOpen(false);
                }}
                onBlur={() => setIsCaptionFocused(false)}
                multiline
                maxLength={150}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={dismissKeyboard}
              />
            </View>
          </View>
          
          {/* Share Button */}
          <TouchableOpacity 
            style={[styles.shareButtonFloating, uploading && styles.shareButtonDisabled]}
            onPress={toggleBottomSheet}
            disabled={uploading}
            activeOpacity={0.7}
          >
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share Story</Text>
          </TouchableOpacity>
          
          {/* Bottom Sheet */}
          <BottomSheet
            isVisible={showBottomSheet}
            onClose={() => {
              setShowBottomSheet(false);
              setVisibilityDropdownOpen(false);
              setStoryTypeDropdownOpen(false);
            }}
            isDark={isDark}
          >
            <View style={styles.bottomSheetContent}>
              {/* Video Duration Info */}
              {media.type === 'video' && (
                <View style={styles.videoInfo}>
                  <Clock size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text style={[styles.videoDurationText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    {Math.ceil(videoDuration)} seconds
                    {videoDuration > 15 && ' (will be trimmed to 15 seconds)'}
                  </Text>
                </View>
              )}
              
              {/* Visibility Dropdown - Higher zIndex */}
              <View style={styles.controlSection}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                  Who can see this?
                </Text>
                <VisibilityDropdown
                  value={visibility}
                  onChange={(value) => {
                    setVisibility(value);
                    setStoryTypeDropdownOpen(false); // Close other dropdown
                  }}
                  isDark={isDark}
                  isOpen={visibilityDropdownOpen}
                  setIsOpen={setVisibilityDropdownOpen}
                  zIndex={visibilityDropdownOpen ? 100 : 10}
                />
              </View>
              
              {/* Story Type Dropdown - Lower zIndex when not open */}
              <View style={styles.controlSection}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                  Story Type
                </Text>
                <StoryTypeDropdown
                  value={storyType}
                  onChange={(value) => {
                    setStoryType(value);
                    setVisibilityDropdownOpen(false); // Close other dropdown
                  }}
                  isDark={isDark}
                  isOpen={storyTypeDropdownOpen}
                  setIsOpen={setStoryTypeDropdownOpen}
                  zIndex={storyTypeDropdownOpen ? 100 : 5}
                />
              </View>
              
              {/* Final Share Button */}
              <TouchableOpacity 
                style={[styles.shareButton, uploading && styles.shareButtonDisabled]}
                onPress={uploadStory}
                disabled={uploading}
                activeOpacity={0.7}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={20} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Share Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </BottomSheet>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 15 : (StatusBar.currentHeight || 20) + 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  captionOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 20) + 70,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  captionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    backdropFilter: 'blur(10px)',
  },
  captionInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 24,
    textAlignVertical: 'center',
  },
   bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetOverlayTouchable: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.9 : SCREEN_HEIGHT * 0.9,
    minHeight: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.46 : SCREEN_HEIGHT * 0.48,
  },
  bottomSheetHandle: {
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'center',
  },
  bottomSheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  bottomSheetScroll: {
    flex: 1,
  },
  bottomSheetScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  bottomSheetContent: {
    flex: 1,
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  videoDurationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  controlSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownButtonDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 12,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownMenuScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minHeight: 56,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  dropdownItemText: {
    marginLeft: 12,
    flex: 1,
  },
  dropdownItemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownItemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shareButtonFloating: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    marginTop: 10,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadProgressText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  mediaSelectionContainer: {
    flex: 1,
  },
  mediaSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaSelectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  mediaSelectionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  mediaSelectionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 24,
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  mediaOption: {
    alignItems: 'center',
    minWidth: 80,
  },
  mediaOptionIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mediaOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});