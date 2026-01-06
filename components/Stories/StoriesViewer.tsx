import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  StatusBar,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { 
  X, Clock, User, Building, Calendar, 
  ChevronRight, ChevronLeft,
  MessageCircle, Send,
  Volume2, VolumeX, Pause, Play,
  AlertCircle,
  Eye
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';

interface Story {
  id: string;
  title: string;
  description: string;
  mediaUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  postedBy: {
    id: string;
    name: string;
    avatar?: string;
    department?: string;
  };
  postedAt: string;
  duration: number;
  isSeen: boolean;
  type: 'announcement' | 'policy' | 'event' | 'update' | 'achievement' | 'personal';
  viewsCount?: number;
  commentsCount?: number;
  mediaType?: 'image' | 'video';
}

interface StoriesViewerProps {
  stories: Story[] | null | undefined;
  onClose: () => void;
  initialIndex: number;
  onNextUser?: () => void;
  onPreviousUser?: () => void;
  onMarkAsSeen?: (storyId: string) => Promise<void>;
  currentUserIndex?: number;
  totalUsers?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
type TimerRef = ReturnType<typeof setTimeout> | null;

// Function to decode URL-encoded characters
const decodeUrl = (url: string): string => {
  try {
    return decodeURIComponent(url);
  } catch (error) {
    return url;
  }
};

// Function to clean AWS S3 URLs - FIXED VERSION
const cleanImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  console.log(`Original URL: ${url.substring(0, 80)}...`);
  
  try {
    // Decode URL first
    const decodedUrl = decodeUrl(url);
    
    // Check if it's an AWS S3 URL
    if (decodedUrl.includes('amazonaws.com')) {
      // Try multiple approaches:
      
      // 1. Try without any query parameters
      if (decodedUrl.includes('?')) {
        const baseUrl = decodedUrl.split('?')[0];
        console.log(`Attempt 1: Cleaned URL (no query params): ${baseUrl.substring(0, 80)}...`);
        
        // Check if it's a valid webp image
        if (baseUrl.includes('.webp') || baseUrl.includes('.jpg') || baseUrl.includes('.png')) {
          return baseUrl;
        }
      }
      
      // 2. Try with only the path before any & characters
      const pathBeforeAmpersand = decodedUrl.split('&')[0];
      console.log(`Attempt 2: Before ampersand: ${pathBeforeAmpersand.substring(0, 80)}...`);
      if (pathBeforeAmpersand.includes('.webp')) {
        return pathBeforeAmpersand;
      }
      
      // 3. Try to extract just the S3 object URL
      const s3Pattern = /https:\/\/[^\/]+\/stories\/[^?]+/;
      const match = decodedUrl.match(s3Pattern);
      if (match) {
        console.log(`Attempt 3: S3 pattern match: ${match[0].substring(0, 80)}...`);
        return match[0];
      }
      
      // 4. Last resort: Try to manually construct the URL
      if (decodedUrl.includes('/stories/')) {
        const parts = decodedUrl.split('/stories/');
        if (parts.length > 1) {
          const s3Base = 'https://hourwize-files.s3.eu-north-1.amazonaws.com/stories/';
          const objectPath = parts[1].split('?')[0].split('&')[0];
          const constructedUrl = s3Base + objectPath;
          console.log(`Attempt 4: Constructed URL: ${constructedUrl.substring(0, 80)}...`);
          return constructedUrl;
        }
      }
    }
    
    // If nothing worked, return the original decoded URL
    console.log(`Using original decoded URL: ${decodedUrl.substring(0, 80)}...`);
    return decodedUrl;
    
  } catch (error) {
    console.error('Error cleaning URL:', error);
    return url || '';
  }
};

// Alternative: Try loading with fetch and creating blob URL
const loadImageAsBlob = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to load as blob:', error);
    return null;
  }
};

export default function StoriesViewer({ 
  stories, 
  onClose, 
  initialIndex,
  onNextUser,
  onPreviousUser,
  onMarkAsSeen,
  currentUserIndex,
  totalUsers
}: StoriesViewerProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [progressValue, setProgressValue] = useState(0);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Image loading states
  const [imageLoadErrors, setImageLoadErrors] = useState<{[key: string]: boolean}>({});
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
  const [loadedImages, setLoadedImages] = useState<{[key: string]: boolean}>({});
  const [blobUrls, setBlobUrls] = useState<{[key: string]: string}>({});
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(0)).current;
  const commentAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<TimerRef>(null);
  const commentInputRef = useRef<TextInput>(null);
  
  const isDark = theme === 'dark';
  
  // Safely handle stories array
  const safeStories = Array.isArray(stories) ? stories : [];
  const currentStory = safeStories[currentIndex];
  const styles = createStyles(isDark, keyboardHeight);

  // Format time helper
  const formatPostedTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}h ago`;
      } else {
        return `${Math.floor(diffHours / 24)}d ago`;
      }
    } catch (error) {
      return 'Recently';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return '#3B82F6';
      case 'policy': return '#10B981';
      case 'event': return '#8B5CF6';
      case 'achievement': return '#F59E0B';
      case 'personal': return '#EC4899';
      default: return '#EF4444';
    }
  };

  const getTypeGradient = (type: string): readonly [string, string] => {
    switch (type) {
      case 'announcement': return ['#3B82F6', '#1D4ED8'] as const;
      case 'policy': return ['#10B981', '#059669'] as const;
      case 'event': return ['#8B5CF6', '#7C3AED'] as const;
      case 'achievement': return ['#F59E0B', '#D97706'] as const;
      case 'personal': return ['#EC4899', '#DB2777'] as const;
      default: return ['#EF4444', '#DC2626'] as const;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Clock size={16} color="#FFFFFF" />;
      case 'policy': return <Building size={16} color="#FFFFFF" />;
      case 'event': return <Calendar size={16} color="#FFFFFF" />;
      case 'achievement': return <Clock size={16} color="#FFFFFF" />;
      default: return <User size={16} color="#FFFFFF" />;
    }
  };

  // Handle image load events
  const handleImageLoad = useCallback((storyKey: string) => {
    console.log(`✅ Image loaded successfully for ${storyKey}`);
    setLoadedImages(prev => ({ ...prev, [storyKey]: true }));
    setImageLoadingStates(prev => ({ ...prev, [storyKey]: false }));
  }, []);

  const handleImageError = useCallback((storyKey: string, error: any) => {
    console.log(`❌ Image load error for ${storyKey}:`, error?.message || 'Unknown error');
    setImageLoadErrors(prev => ({ ...prev, [storyKey]: true }));
    setImageLoadingStates(prev => ({ ...prev, [storyKey]: false }));
    
    // Try to load as blob as fallback
    const story = safeStories.find(s => s.id === storyKey || `story-${safeStories.indexOf(s)}` === storyKey);
    if (story) {
      const rawUrl = story.mediaUrl || story.imageUrl || story.thumbnailUrl;
      if (rawUrl) {
        console.log(`Trying blob fallback for ${storyKey}...`);
        loadImageAsBlob(rawUrl).then(blobUrl => {
          if (blobUrl) {
            setBlobUrls(prev => ({ ...prev, [storyKey]: blobUrl }));
            setImageLoadErrors(prev => ({ ...prev, [storyKey]: false }));
          }
        });
      }
    }
  }, [safeStories]);

  const handleImageLoadStart = useCallback((storyKey: string) => {
    console.log(`🔄 Starting image load for ${storyKey}`);
    setImageLoadingStates(prev => ({ ...prev, [storyKey]: true }));
  }, []);

  const toggleControls = () => {
    if (showControls) {
      Animated.timing(controlsAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
    } else {
      setShowControls(true);
      Animated.timing(controlsAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          if (showControls && !isPaused) {
            Animated.timing(controlsAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start(() => setShowControls(false));
          }
        }, 3000);
      });
    }
  };

  const handleSendComment = async () => {
    if (!comment.trim() || sendingComment || !currentStory || !user) return;

    setSendingComment(true);
    
    try {
      const messageContent = `Commented on "${currentStory.title || 'story'}": ${comment}`;
      
      const storyOwnerId = currentStory.postedBy.id;
      let conversationId = '';
      
      try {
        const conversations = await chatService.getConversations();
        
        const existingConversation = conversations.find((conv: any) => 
          conv.participants.some((participant: any) => participant._id === storyOwnerId)
        );
        
        if (existingConversation) {
          conversationId = existingConversation._id;
        } else {
          const newConversation = await chatService.createConversation([storyOwnerId]);
          conversationId = newConversation._id;
        }
        
        await chatService.sendMessage(
          conversationId,
          messageContent,
          user._id,
          {
            encrypt: false,
          }
        );
        
        Alert.alert('Comment Sent', 'Your comment has been sent to the chat');
        setComment('');
        setShowCommentInput(false);
        
      } catch (conversationError) {
        console.error('Failed to send comment:', conversationError);
        
        try {
          const conversations = await chatService.getConversations();
          if (conversations.length > 0) {
            await chatService.sendMessage(
              conversations[0]._id,
              `Re: ${currentStory.title || 'Story'}\n${comment}`,
              user._id
            );
            Alert.alert('Comment Sent', 'Your comment has been sent');
            setComment('');
            setShowCommentInput(false);
          }
        } catch (fallbackError) {
          Alert.alert('Error', 'Could not send comment at this time');
        }
      }
      
    } catch (error) {
      console.error('Error sending comment:', error);
      Alert.alert('Error', 'Failed to send comment');
    } finally {
      setSendingComment(false);
      Keyboard.dismiss();
    }
  };

  const toggleCommentInput = () => {
    if (showCommentInput) {
      Animated.timing(commentAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setShowCommentInput(false);
        setComment('');
        Keyboard.dismiss();
      });
    } else {
      setShowCommentInput(true);
      Animated.timing(commentAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        commentInputRef.current?.focus();
      });
    }
  };

  const togglePause = () => {
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!currentStory) return;
    
    const duration = (currentStory.duration || 5) * 1000;
    
    progressAnim.setValue(0);
    setProgressValue(0);
    
    const progressListenerId = progressAnim.addListener(({ value }) => {
      setProgressValue(value);
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      progressAnim.removeListener(progressListenerId);
      handleNext();
    }, duration);
  };

  const pauseTimer = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    progressAnim.stopAnimation();
  };

  const resumeTimer = () => {
    if (!isPaused || !currentStory) return;
    
    setIsPaused(false);
    
    const remainingProgress = 1 - progressValue;
    const storyDuration = (currentStory.duration || 5) * 1000;
    const remainingTime = remainingProgress * storyDuration;

    if (remainingTime > 0) {
      progressAnim.setValue(progressValue);
      
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: remainingTime,
        useNativeDriver: false,
      }).start();

      timerRef.current = setTimeout(() => {
        handleNext();
      }, remainingTime);
    } else {
      handleNext();
    }
  };

  const handleNext = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentStory && onMarkAsSeen && !currentStory.isSeen) {
      try {
        await onMarkAsSeen(currentStory.id);
      } catch (error) {
        console.error('Failed to mark story as seen:', error);
      }
    }

    if (currentIndex < safeStories.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollRef.current?.scrollTo({
        x: newIndex * SCREEN_WIDTH,
        animated: true,
      });
    } else if (onNextUser) {
      onNextUser();
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollRef.current?.scrollTo({
        x: newIndex * SCREEN_WIDTH,
        animated: true,
      });
    } else if (onPreviousUser) {
      onPreviousUser();
    }
  };

  const handleClose = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentStory && onMarkAsSeen && !currentStory.isSeen) {
      try {
        await onMarkAsSeen(currentStory.id);
      } catch (error) {
        console.error('Failed to mark story as seen:', error);
      }
    }
    
    // Clean up blob URLs
    Object.values(blobUrls).forEach(blobUrl => {
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    });
    
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!isPaused && currentStory && !showCommentInput) {
      startTimer();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, isPaused, currentStory, showCommentInput]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      progressAnim.removeAllListeners();
      
      // Clean up blob URLs on unmount
      Object.values(blobUrls).forEach(blobUrl => {
        if (blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl);
        }
      });
    };
  }, []);

  // If no stories or current story, don't render
  if (safeStories.length === 0 || !currentStory) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          {/* Debug overlay - shows current URL being loaded */}
          {__DEV__ && currentStory && (
            <View style={styles.debugOverlay}>
              <Text style={styles.debugText}>
                Loading: {currentStory.mediaUrl?.substring(0, 60) || 'No URL'}...
              </Text>
            </View>
          )}

          {/* Animated Controls Overlay */}
          <Animated.View 
            style={[
              styles.controlsOverlay,
              {
                opacity: controlsAnim,
                transform: [{
                  translateY: controlsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0]
                  })
                }]
              }
            ]}
            pointerEvents={showControls ? 'auto' : 'none'}
          >
            {/* Top Gradient */}
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={styles.topGradient}
            />
            
            {/* Bottom Gradient */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.bottomGradient}
            />
            
            {/* Controls */}
            {showControls && (
              <>
                {/* Top Controls */}
                <View style={styles.topControls}>
                  <View style={styles.header}>
                    <View style={styles.userInfo}>
                      <Image 
                        source={{ 
                          uri: currentStory.postedBy?.avatar || 'https://via.placeholder.com/40' 
                        }} 
                        style={styles.storyAvatar}
                      />
                      <View>
                        <Text style={styles.userName}>
                          {currentStory.postedBy?.name || 'User'}
                        </Text>
                        <Text style={styles.postedTime}>
                          {formatPostedTime(currentStory.postedAt)}
                          {currentStory.postedBy?.department && ` • ${currentStory.postedBy.department}`}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.topRightControls}>
                      <TouchableOpacity 
                        onPress={toggleMute} 
                        style={styles.controlButton}
                      >
                        {isMuted ? (
                          <VolumeX size={24} color="#FFFFFF" />
                        ) : (
                          <Volume2 size={24} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={handleClose} 
                        style={styles.controlButton}
                      >
                        <X size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Center Controls */}
                <View style={styles.centerControls}>
                  <TouchableOpacity 
                    style={styles.navButton}
                    onPress={handlePrevious}
                  >
                    <ChevronLeft size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.playPauseButton}
                    onPress={togglePause}
                  >
                    {isPaused ? (
                      <Play size={32} color="#FFFFFF" />
                    ) : (
                      <Pause size={32} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.navButton}
                    onPress={handleNext}
                  >
                    <ChevronRight size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                  <TouchableOpacity 
                    style={styles.commentButton}
                    onPress={toggleCommentInput}
                  >
                    <View style={styles.commentButtonContent}>
                      <MessageCircle size={24} color="#FFFFFF" />
                      <Text style={styles.commentCount}>
                        {currentStory.commentsCount || 0}
                      </Text>
                    </View>
                    <Text style={styles.commentLabel}>
                      Comment
                    </Text>
                  </TouchableOpacity>
                  
                  {/* View count */}
                  <View style={styles.viewCountContainer}>
                    <Eye size={16} color="#FFFFFF" />
                    <Text style={styles.viewCountText}>
                      {currentStory.viewsCount || 0} views
                    </Text>
                  </View>
                </View>
              </>
            )}
          </Animated.View>

          {/* Progress bars */}
          {safeStories.length > 0 && (
            <View style={styles.progressContainer}>
              {safeStories.map((story, index) => {
                const storyKey = story.id || `story-${index}`;
                
                return (
                  <View key={storyKey} style={styles.progressBarBackground}>
                    {index === currentIndex ? (
                      <Animated.View 
                        style={[
                          styles.progressBarFill,
                          { 
                            backgroundColor: getTypeColor(story.type),
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%']
                            })
                          }
                        ]} 
                      />
                    ) : index < currentIndex ? (
                      <View 
                        style={[
                          styles.progressBarFill,
                          { 
                            backgroundColor: getTypeColor(story.type),
                            width: '100%'
                          }
                        ]} 
                      />
                    ) : (
                      <View style={styles.progressBarEmpty} />
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Type indicator */}
          <View style={styles.typeIndicator}>
            <LinearGradient
              colors={getTypeGradient(currentStory.type)}
              style={styles.typeBadge}
            >
              {getTypeIcon(currentStory.type)}
              <Text style={styles.typeText}>
                {currentStory.type?.charAt(0).toUpperCase() + currentStory.type?.slice(1)}
              </Text>
            </LinearGradient>
          </View>

          {/* Story content */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={{ width: SCREEN_WIDTH * safeStories.length }}
            onTouchStart={() => {
              if (!showControls && !showCommentInput) {
                toggleControls();
              }
            }}
          >
            {safeStories.map((story, index) => {
              const storyKey = story.id || `story-${index}`;
              const rawMediaUrl = story.mediaUrl || story.imageUrl || story.thumbnailUrl;
              const mediaUrl = cleanImageUrl(rawMediaUrl);
              const blobUrl = blobUrls[storyKey];
              const imageError = imageLoadErrors[storyKey];
              const isLoading = imageLoadingStates[storyKey];
              const isLoaded = loadedImages[storyKey];
              
              // Determine which URL to use
              const finalUrl = blobUrl || mediaUrl;
              
              return (
                <View key={storyKey} style={styles.storyContent}>
                  {finalUrl ? (
                    <View style={styles.imageContainer}>
                      {/* Loading indicator */}
                      {isLoading && !isLoaded && !imageError && (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color="#FFFFFF" />
                          <Text style={styles.loadingText}>Loading story...</Text>
                          {__DEV__ && (
                            <Text style={styles.debugUrlText}>
                              URL: {finalUrl.substring(0, 60)}...
                            </Text>
                          )}
                        </View>
                      )}
                      
                      {/* Error indicator */}
                      {imageError && !blobUrl && (
                        <View style={styles.errorContainer}>
                          <AlertCircle size={48} color="#EF4444" />
                          <Text style={styles.errorText}>Failed to load image</Text>
                          {__DEV__ && (
                            <Text style={styles.errorUrlText}>
                              Original URL: {rawMediaUrl?.substring(0, 60) || 'No URL'}...
                            </Text>
                          )}
                          <TouchableOpacity 
                            style={styles.retryButton}
                            onPress={() => {
                              setImageLoadErrors(prev => ({ ...prev, [storyKey]: false }));
                              setImageLoadingStates(prev => ({ ...prev, [storyKey]: true }));
                              
                              // Try loading as blob
                              if (rawMediaUrl) {
                                loadImageAsBlob(rawMediaUrl).then(newBlobUrl => {
                                  if (newBlobUrl) {
                                    setBlobUrls(prev => ({ ...prev, [storyKey]: newBlobUrl }));
                                  }
                                });
                              }
                            }}
                          >
                            <Text style={styles.retryButtonText}>Retry Loading</Text>
                          </TouchableOpacity>
                          
                          {/* Try direct URL button */}
                          <TouchableOpacity 
                            style={[styles.retryButton, styles.directUrlButton]}
                            onPress={() => {
                              // Open the URL in browser for debugging
                              if (rawMediaUrl) {
                                console.log('Direct URL:', rawMediaUrl);
                                Alert.alert('Direct URL', rawMediaUrl.substring(0, 100) + '...');
                              }
                            }}
                          >
                            <Text style={styles.retryButtonText}>Show Direct URL</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {/* The actual image */}
                      {(!imageError || blobUrl) && (
                        <Image 
                          source={{ uri: finalUrl }} 
                          style={styles.storyMedia}
                          resizeMode="cover"
                          onLoadStart={() => handleImageLoadStart(storyKey)}
                          onLoad={() => handleImageLoad(storyKey)}
                          onError={(e) => handleImageError(storyKey, e.nativeEvent.error)}
                          fadeDuration={300}
                        />
                      )}
                    </View>
                  ) : (
                    <LinearGradient
                      colors={getTypeGradient(story.type)}
                      style={styles.fallbackContainer}
                    >
                      <View style={styles.fallbackContent}>
                        <Text style={styles.fallbackIcon}>
                          {story.type === 'announcement' ? '📢' : 
                           story.type === 'event' ? '🎉' : 
                           story.type === 'achievement' ? '🏆' : 
                           story.type === 'policy' ? '📋' : '📱'}
                        </Text>
                        <Text style={styles.fallbackTitle}>
                          {story.title || 'Story'}
                        </Text>
                        <Text style={styles.noImageText}>
                          No image available
                        </Text>
                      </View>
                    </LinearGradient>
                  )}
                  
                  {/* Description overlay */}
                  {story.description && !showControls && (
                    <View style={styles.descriptionOverlay}>
                      <Text style={styles.descriptionText} numberOfLines={3}>
                        {story.description}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Comment Input Overlay */}
          <Animated.View 
            style={[
              styles.commentInputContainer,
              {
                transform: [{
                  translateY: commentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0]
                  })
                }],
                opacity: commentAnim
              }
            ]}
          >
            <View style={styles.commentInputWrapper}>
              <TextInput
                ref={commentInputRef}
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder={`Comment on "${currentStory.title || 'this story'}..."`}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                multiline
                maxLength={500}
              />
              
              <View style={styles.commentActions}>
                <TouchableOpacity 
                  style={styles.cancelCommentButton}
                  onPress={toggleCommentInput}
                >
                  <Text style={styles.cancelCommentText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sendCommentButton,
                    (!comment.trim() || sendingComment) && styles.sendCommentButtonDisabled
                  ]}
                  onPress={handleSendComment}
                  disabled={!comment.trim() || sendingComment}
                >
                  {sendingComment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Send size={18} color="#FFFFFF" />
                      <Text style={styles.sendCommentText}>Send</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Quick comment button */}
          {!showCommentInput && (
            <TouchableOpacity 
              style={[
                styles.quickCommentButton,
                keyboardVisible && styles.quickCommentButtonHidden
              ]}
              onPress={toggleCommentInput}
            >
              <View style={styles.quickCommentContent}>
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.quickCommentText}>
                  {currentStory.commentsCount || 0} comments
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Navigation hints */}
          {!showControls && !showCommentInput && (
            <>
              <View style={styles.leftHint}>
                <ChevronLeft size={20} color="rgba(255, 255, 255, 0.5)" />
              </View>
              <View style={styles.rightHint}>
                <ChevronRight size={20} color="rgba(255, 255, 255, 0.5)" />
              </View>
            </>
          )}

          {/* Progress indicator */}
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressText}>
              {currentIndex + 1}/{safeStories.length}
            </Text>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (isDark: boolean, keyboardHeight: number) => StyleSheet.create({
  keyboardAvoidView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  debugOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  debugText: {
    color: '#F59E0B',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  progressContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
    zIndex: 101,
  },
  progressBarBackground: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1,
  },
  progressBarEmpty: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  topControls: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  storyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  postedTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    alignItems: 'center',
    gap: 16,
  },
  commentButton: {
    alignItems: 'center',
    gap: 6,
  },
  commentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  commentLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  viewCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  typeIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 24,
    right: 20,
    zIndex: 101,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  storyContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 10,
  },
  debugUrlText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorUrlText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  directUrlButton: {
    backgroundColor: '#10B981',
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  storyMedia: {
    width: '100%',
    height: '100%',
  },
  noImageText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
  descriptionOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    padding: 20,
  },
  descriptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    zIndex: 200,
  },
  commentInputWrapper: {
    gap: 16,
  },
  commentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelCommentButton: {
    padding: 12,
  },
  cancelCommentText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  sendCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendCommentButtonDisabled: {
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
  },
  sendCommentText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickCommentButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    zIndex: 50,
  },
  quickCommentButtonHidden: {
    display: 'none',
  },
  quickCommentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  quickCommentText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  progressTextContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 24,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 101,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  leftHint: {
    position: 'absolute',
    left: 10,
    top: '50%',
    marginTop: -10,
    zIndex: 50,
  },
  rightHint: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -10,
    zIndex: 50,
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContent: {
    alignItems: 'center',
    padding: 40,
  },
  fallbackIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
});