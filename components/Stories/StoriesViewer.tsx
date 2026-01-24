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
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { 
  X, 
  MessageCircle, 
  Send,
  Volume2, 
  VolumeX, 
  Pause, 
  Play,
  Eye,
  MoreVertical,
  Trash2
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';
import { storiesAPI } from '@/services/api'; // Import the API
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

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
  onDeleteStory?: (storyId: string) => Promise<void>;
  currentUserIndex?: number;
  totalUsers?: number;
  isCurrentUserStory?: boolean;
  onStoryDeleted?: (deletedStoryId: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;
type TimerRef = ReturnType<typeof setTimeout> | null;

export default function StoriesViewer({ 
  stories, 
  onClose, 
  initialIndex,
  onNextUser,
  onPreviousUser,
  onMarkAsSeen,
  onDeleteStory,
  currentUserIndex,
  totalUsers,
  isCurrentUserStory = false,
  onStoryDeleted,
}: StoriesViewerProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [showCommentInput, setShowCommentInput] = useState<boolean>(false);
  const [sendingComment, setSendingComment] = useState<boolean>(false);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [swipeOffset, setSwipeOffset] = useState<Animated.Value>(new Animated.Value(0));
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(0)).current;
  const commentAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<TimerRef>(null);
  const commentInputRef = useRef<TextInput>(null);
  const holdTimerRef = useRef<TimerRef>(null);
  const videoRef = useRef<Video>(null);
  
  const isDark = theme === 'dark';
  
  const safeStories = Array.isArray(stories) ? stories : [];
  const currentStory = safeStories[currentIndex];
  const styles = createStyles(isDark, keyboardHeight);

  const isMyStory = isCurrentUserStory || (currentStory?.postedBy?.id === user?._id);

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

  // ========== DELETE STORY FUNCTION ==========
  const handleDeleteStory = async () => {
    if (!currentStory || !currentStory.id) {
      Alert.alert('Error', 'Cannot delete story at this time');
      return;
    }

    pauseTimer();

    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story? This action cannot be undone.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            setIsDeleting(false);
            if (!showCommentInput && !showMoreOptions && !isHolding) {
              resumeTimer();
            }
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              
              if (onDeleteStory) {
                await onDeleteStory(currentStory.id);
              } else {
                const response = await storiesAPI.deleteStory(currentStory.id);
                
                if (!response.success) {
                  throw new Error(response.message || 'Failed to delete story');
                }
              }
              
              if (onStoryDeleted) {
                onStoryDeleted(currentStory.id);
              }
              
              Alert.alert('Success', 'Story deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => {
                    if (safeStories.length <= 1) {
                      handleClose();
                    } else {
                      handleNext();
                    }
                  }
                }
              ]);
              
            } catch (error: any) {
              console.error('Error deleting story:', error);
              Alert.alert(
                'Error', 
                error.message || 'Failed to delete story. Please try again.'
              );
              setIsDeleting(false);
              if (!showCommentInput && !showMoreOptions && !isHolding) {
                resumeTimer();
              }
            }
          }
        }
      ],
      { 
        onDismiss: () => {
          setIsDeleting(false);
          if (!showCommentInput && !showMoreOptions && !isHolding) {
            resumeTimer();
          }
        }
      }
    );
  };

  const handleDeleteStoryWithLoading = async () => {
    if (isDeleting) return;
    handleDeleteStory();
  };

  // PanResponder for swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2);
      },
      onPanResponderGrant: () => {
        pauseTimer();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          swipeOffset.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SWIPE_THRESHOLD) {
          Animated.timing(swipeOffset, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            handleClose();
          });
        } else {
          Animated.spring(swipeOffset, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          if (!isHolding && !showCommentInput && !isDeleting) {
            resumeTimer();
          }
        }
      },
    })
  ).current;

  // Handle screen press
  const handleScreenPress = useCallback((event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    const screenHalf = SCREEN_WIDTH / 2;
    
    if (showCommentInput || showMoreOptions || isDeleting) {
      return;
    }
    
    // Left half: Previous story
    if (locationX < screenHalf) {
      handlePrevious();
    }
    // Right half: Next story
    else {
      handleNext();
    }
  }, [showCommentInput, showMoreOptions, currentIndex, isDeleting]);

  // Handle long press (hold)
  const handleScreenPressIn = () => {
    if (showCommentInput || showMoreOptions || isDeleting) return;
    
    holdTimerRef.current = setTimeout(() => {
      setIsHolding(true);
      pauseTimer();
    }, 300);
  };

  const handleScreenPressOut = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    if (isHolding) {
      setIsHolding(false);
      if (!showCommentInput && !showMoreOptions && !isDeleting) {
        resumeTimer();
      }
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
        Alert.alert('Error', 'Could not send comment at this time');
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

    if (!currentStory || isDeleting) return;
    
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
    if (!isPaused || !currentStory || isDeleting) return;
    
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
      setIsVideoReady(false);
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
      setIsVideoReady(false);
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
    if (!isPaused && currentStory && !showCommentInput && !showMoreOptions && !isHolding && !isDeleting) {
      startTimer();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, isPaused, currentStory, showCommentInput, showMoreOptions, isHolding, isDeleting]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      progressAnim.removeAllListeners();
    };
  }, []);

  // Video loading handler
  const handleVideoLoad = () => {
    setIsVideoReady(true);
    setIsVideoLoading(false);
  };

  const handleVideoError = (error: any) => {
    console.error('Video loading error:', error);
    setIsVideoLoading(false);
    Alert.alert('Error', 'Could not load video. Please try again.');
  };

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
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [{
                translateY: swipeOffset.interpolate({
                  inputRange: [0, SCREEN_HEIGHT],
                  outputRange: [0, SCREEN_HEIGHT]
                })
              }],
              opacity: swipeOffset.interpolate({
                inputRange: [0, SCREEN_HEIGHT],
                outputRange: [1, 0.5]
              })
            }
          ]}
          {...panResponder.panHandlers}
        >
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Top Header - Always Visible */}
            <View style={styles.topHeader}>
              {/* Left: User Info */}
              <View style={styles.userInfo}>
                <Image 
                  source={{ 
                    uri: currentStory.postedBy?.avatar || 'https://via.placeholder.com/40' 
                  }} 
                  style={styles.storyAvatar}
                />
                <View style={styles.userInfoText}>
                  <Text style={styles.userName}>
                    {currentStory.postedBy?.name || 'User'}
                  </Text>
                  <Text style={styles.postedTime}>
                    {formatPostedTime(currentStory.postedAt)}
                    {currentStory.postedBy?.department && ` • ${currentStory.postedBy.department}`}
                  </Text>
                </View>
              </View>
              
              {/* Right: Close Button */}
              <TouchableOpacity 
                onPress={handleClose} 
                style={styles.closeButton}
                disabled={isDeleting}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

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
                              backgroundColor: '#FFFFFF',
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
                              backgroundColor: '#FFFFFF',
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

            {/* Story content */}
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={{ width: SCREEN_WIDTH * safeStories.length }}
              onTouchStart={handleScreenPressIn}
              onTouchEnd={handleScreenPressOut}
            >
              {safeStories.map((story, index) => {
                const storyKey = story.id || `story-${index}`;
                const mediaUrl = story.mediaUrl || story.imageUrl || story.thumbnailUrl;
                
                return (
                  <TouchableOpacity
                    key={storyKey}
                    style={styles.storyContent}
                    activeOpacity={1}
                    onPress={handleScreenPress}
                    disabled={isDeleting}
                  >
                    {mediaUrl && story.mediaType === 'video' ? (
                      <View style={styles.videoContainer}>
                        <Video
                          ref={videoRef}
                          source={{ uri: mediaUrl }}
                          style={styles.storyMedia}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={!isPaused && !isDeleting}
                          isLooping={false}
                          isMuted={isMuted}
                          onLoad={handleVideoLoad}
                          onError={handleVideoError}
                          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                            if (status.isLoaded && !status.isPlaying && !isPaused && !isDeleting) {
                              videoRef.current?.playAsync();
                            }
                          }}
                        />
                        {!isVideoReady && (
                          <View style={styles.videoLoadingOverlay}>
                            <ActivityIndicator size="large" color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    ) : mediaUrl ? (
                      <View style={styles.imageContainer}>
                        <Image 
                          source={{ uri: mediaUrl }} 
                          style={styles.storyMedia}
                          resizeMode="cover"
                          fadeDuration={300}
                        />
                      </View>
                    ) : (
                      <LinearGradient
                        colors={['#000000', '#1F2937']}
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
                            {story.description || 'No media available'}
                          </Text>
                        </View>
                      </LinearGradient>
                    )}
                    
                    {/* Pause indicator when holding */}
                    {isHolding && (
                      <View style={styles.holdIndicator}>
                        <Pause size={48} color="#FFFFFF" />
                        <Text style={styles.holdText}>Hold to pause</Text>
                      </View>
                    )}
                    
                    {/* Delete loading overlay */}
                    {isDeleting && (
                      <View style={styles.deleteOverlay}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <Text style={styles.deleteText}>Deleting story...</Text>
                      </View>
                    )}
                    
                    {/* Description overlay */}
                    {story.description && (
                      <View style={styles.descriptionOverlay}>
                        <Text style={styles.descriptionText} numberOfLines={3}>
                          {story.description}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Bottom Message Input - Always visible for non-owner stories */}
            {!isMyStory && !isDeleting && (
              <Animated.View 
                style={[
                  styles.messageInputContainer,
                  {
                    transform: [{
                      translateY: commentAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0]
                      })
                    }],
                    opacity: commentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1]
                    })
                  }
                ]}
              >
                <View style={styles.messageInputWrapper}>
                  <TextInput
                    ref={commentInputRef}
                    style={styles.messageInput}
                    value={comment}
                    onChangeText={setComment}
                    placeholder={`Reply to ${currentStory.postedBy?.name || 'user'}...`}
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    multiline
                    maxLength={500}
                  />
                  
                  <TouchableOpacity
                    style={[
                      styles.sendMessageButton,
                      (!comment.trim() || sendingComment) && styles.sendMessageButtonDisabled
                    ]}
                    onPress={handleSendComment}
                    disabled={!comment.trim() || sendingComment}
                  >
                    {sendingComment ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Send size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Delete Button - Only for owner stories */}
            {isMyStory && !isDeleting && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDeleteStoryWithLoading}
              >
                <View style={styles.deleteButtonContent}>
                  <Trash2 size={20} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>
                    Delete Story
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </SafeAreaView>
        </Animated.View>
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
  },
  safeArea: {
    flex: 1,
    position: 'relative',
  },
  topHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 20) + 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 101,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userInfoText: {
    flex: 1,
  },
  storyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : (StatusBar.currentHeight || 20) + 65,
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
  storyContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  storyMedia: {
    width: '100%',
    height: '100%',
  },
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  holdIndicator: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  holdText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  noImageText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  // Message Input Styles
  messageInputContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    zIndex: 50,
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    maxHeight: 80,
    paddingVertical: 10,
  },
  sendMessageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendMessageButtonDisabled: {
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
  },
  // Delete Button Styles
  deleteButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    zIndex: 50,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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