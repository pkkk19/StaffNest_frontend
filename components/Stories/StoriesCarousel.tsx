import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  AppState,
  AppStateStatus
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import StoryItem from './StoryItem';
import StoriesViewer from './StoriesViewer';
import { storiesAPI } from '@/services/api';

// Updated Story interface to match backend
interface Story {
  _id: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: 'image' | 'video';
  duration: number;
  caption?: string;
  type: 'announcement' | 'policy' | 'event' | 'update' | 'personal';
  createdAt: string;
  hasViewed: boolean;
  isCurrentUser: boolean;
  userInfo?: {
    _id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
}

interface StoryGroup {
  userId: string;
  userInfo: {
    _id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
  isCurrentUser: boolean;
}

// Create a type that matches StoriesViewer's Story interface
interface StoriesViewerStory {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  imageUrl: string;
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
  likesCount?: number;
  mediaType?: 'image' | 'video';
  mimeType?: string;
}

// SIMPLIFIED URL cleaning function - backend now returns clean URLs
const cleanImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  try {
    // Backend already returns clean URLs, but just in case
    if (url.includes('?')) {
      return url.split('?')[0];
    }
    
    return url;
  } catch (error) {
    console.error('Error cleaning URL:', error);
    return url || '';
  }
};

// Function to preload images
const preloadImage = async (url: string): Promise<boolean> => {
  try {
    const cleanedUrl = cleanImageUrl(url);
    return await Image.prefetch(cleanedUrl);
  } catch (error) {
    console.log('Preload error:', error);
    return false;
  }
};

export default function StoriesCarousel() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [viewerStories, setViewerStories] = useState<StoriesViewerStory[]>([]);
  
  // Store preloaded image status
  const [preloadedImages, setPreloadedImages] = useState<{[key: string]: boolean}>({});
  const [preloading, setPreloading] = useState(false);
  const preloadedRef = useRef<{[key: string]: boolean}>({});
  
  // Add state for tracking upload status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastNavigationTime, setLastNavigationTime] = useState<number>(0);
  const appState = useRef(AppState.currentState);

  const isDark = theme === 'dark';
  const styles = createStyles(isDark);

  // Transform backend story to StoriesViewer format
  const transformStoryToViewerFormat = (story: Story, groupUserInfo?: any): StoriesViewerStory => {
    const userInfo = story.userInfo || groupUserInfo;
    const mediaUrl = cleanImageUrl(story.mediaUrl || '');
    
    // Determine image URL for the viewer
    const imageUrl = story.thumbnailUrl ? cleanImageUrl(story.thumbnailUrl) : mediaUrl;
    
    return {
      id: story._id || `story-${Date.now()}`,
      title: story.caption || (story.type ? story.type.charAt(0).toUpperCase() + story.type.slice(1) : 'Story'),
      description: story.caption || `A ${story.type || 'personal'} story`,
      mediaUrl: mediaUrl,
      imageUrl: imageUrl,
      thumbnailUrl: story.thumbnailUrl,
      postedBy: {
        id: userInfo?._id || 'unknown',
        name: userInfo ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'User' : 'User',
        avatar: cleanImageUrl(userInfo?.profile_picture_url),
        department: 'General'
      },
      postedAt: story.createdAt || new Date().toISOString(),
      duration: story.duration || 5,
      isSeen: story.hasViewed || false,
      type: (story.type || 'personal') as any,
      viewsCount: 0,
      likesCount: 0,
      mediaType: story.mediaType,
    };
  };

  // Preload all story images
  const preloadAllStoryImages = async (groups: StoryGroup[]) => {
    setPreloading(true);
    const newPreloadedImages: {[key: string]: boolean} = {};
    
    // Only preload first few images to avoid overload
    const maxPreload = 5;
    let preloadCount = 0;
    
    for (const group of groups) {
      for (const story of group.stories) {
        if (preloadCount >= maxPreload) break;
        
        const storyKey = `${group.userId}-${story._id}`;
        const imageUrl = story.thumbnailUrl || story.mediaUrl;
        
        if (imageUrl) {
          try {
            const success = await preloadImage(imageUrl);
            newPreloadedImages[storyKey] = success;
          } catch (error) {
            newPreloadedImages[storyKey] = false;
          }
          preloadCount++;
        }
      }
      if (preloadCount >= maxPreload) break;
    }
    
    preloadedRef.current = newPreloadedImages;
    setPreloadedImages(newPreloadedImages);
    setPreloading(false);
  };

  // Fetch stories from backend
  const fetchStories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await storiesAPI.getStoryFeed();
      
      if (response.success && Array.isArray(response.data)) {
        setStoryGroups(response.data);
        
        // Start preloading immediately
        preloadAllStoryImages(response.data);
      } else {
        setStoryGroups([]);
        if (response.message) {
          setError(response.message);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch stories:', err);
      setError(err.message || 'Failed to load stories');
      setStoryGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
    
    // Refresh stories every 30 seconds when component is active
    const interval = setInterval(fetchStories, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for navigation events using useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      
      // Check if we're coming back from story upload (within last 3 seconds)
      if (now - lastNavigationTime < 3000) {
        simulateUploadProgress();
      }
      
      fetchStories();
      
      return () => {
        // Cleanup if needed
      };
    }, [lastNavigationTime])
  );

  // Track navigation time when component mounts
  useEffect(() => {
    // Store current time as last navigation time
    setLastNavigationTime(Date.now());
  }, []);

  // Track app state changes to detect when coming back from upload
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        const now = Date.now();
        
        // If we just came back within 3 seconds, simulate upload
        if (now - lastNavigationTime < 3000) {
          simulateUploadProgress();
        }
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [lastNavigationTime]);

  // Simulate upload progress animation
  const simulateUploadProgress = () => {
    if (isUploading) return; // Don't start another upload if already uploading
    
    setIsUploading(true);
    setUploadProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          fetchStories(); // Refresh stories after upload completes
        }, 500);
      }
    }, 200);
  };

  const handleStoryPress = (groupIndex: number, storyIndex: number) => {
    const group = storyGroups[groupIndex];
    if (!group) {
      console.error('Group not found at index:', groupIndex);
      return;
    }

    const story = group.stories[storyIndex];
    if (!story) {
      console.error('Story not found at index:', storyIndex, 'in group:', group);
      return;
    }

    setSelectedUserIndex(groupIndex);
    setSelectedStoryIndex(storyIndex);
    
    // Transform the stories for the current group
    try {
      const transformedStories = group.stories.map(s => 
        transformStoryToViewerFormat(s, group.userInfo)
      );
      
      setViewerStories(transformedStories);
      setViewerVisible(true);

    } catch (transformError) {
      console.error('Error transforming stories:', transformError);
      Alert.alert('Error', 'Failed to load story content');
      return;
    }

    // Mark story as viewed in backend
    if (!story.hasViewed && !story.isCurrentUser) {
      markStoryAsViewed(story._id);
    }
  };

  const markStoryAsViewed = async (storyId: string) => {
    try {
      await storiesAPI.viewStory(storyId);
      // Update local state
      setStoryGroups(prev => 
        prev.map(group => ({
          ...group,
          stories: group.stories.map(story => 
            story._id === storyId 
              ? { ...story, hasViewed: true } 
              : story
          ),
          hasUnviewed: group.stories.some(s => !s.hasViewed && s._id !== storyId)
        }))
      );
    } catch (err) {
      console.error('Failed to mark story as viewed:', err);
    }
  };

  const handleAddStory = () => {
    // Update last navigation time when going to upload
    setLastNavigationTime(Date.now());
    // Navigate to story creation screen
    router.push('/stories/upload');
  };

  const handleViewerClose = () => {
    setViewerVisible(false);
    setViewerStories([]);
    // Refresh stories after viewing
    fetchStories();
  };

  const handleNextUser = () => {
    if (selectedUserIndex < storyGroups.length - 1) {
      const newUserIndex = selectedUserIndex + 1;
      const newGroup = storyGroups[newUserIndex];
      
      if (newGroup && newGroup.stories.length > 0) {
        setSelectedUserIndex(newUserIndex);
        setSelectedStoryIndex(0);
        
        // Transform stories for the next user
        const transformedStories = newGroup.stories.map(story => 
          transformStoryToViewerFormat(story, newGroup.userInfo)
        );
        setViewerStories(transformedStories);
      } else {
        handleViewerClose();
      }
    } else {
      handleViewerClose();
    }
  };

  const handlePreviousUser = () => {
    if (selectedUserIndex > 0) {
      const newUserIndex = selectedUserIndex - 1;
      const newGroup = storyGroups[newUserIndex];
      
      if (newGroup && newGroup.stories.length > 0) {
        setSelectedUserIndex(newUserIndex);
        setSelectedStoryIndex(newGroup.stories.length - 1);
        
        // Transform stories for the previous user
        const transformedStories = newGroup.stories.map(story => 
          transformStoryToViewerFormat(story, newGroup.userInfo)
        );
        setViewerStories(transformedStories);
      }
    }
  };

  // Show error inline if there's an error
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.carouselContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <StoryItem
              id="your-story"
              title="Your Story"
              imageUrl={user?.profile_picture_url || 'https://via.placeholder.com/400'}
              isSeen={false}
              isCurrentUser={true}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onPress={handleAddStory}
            />
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: isDark ? '#EF4444' : '#DC2626' }]}>
                {error}
              </Text>
              <TouchableOpacity onPress={fetchStories} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Show empty state if no stories
  if (storyGroups.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.carouselContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <StoryItem
              id="your-story"
              title="Your Story"
              imageUrl={user?.profile_picture_url || 'https://via.placeholder.com/400'}
              isSeen={false}
              isCurrentUser={true}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onPress={handleAddStory}
            />
            <View style={styles.noStoriesContainer}>
              <Text style={[styles.noStoriesText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                No stories yet
              </Text>
              <Text style={[styles.noStoriesSubtext, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                Be the first to share!
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stories carousel */}
      <View style={styles.carouselContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* "Your Story" option - ALWAYS SHOW */}
          <StoryItem
            id="your-story"
            title="Your Story"
            imageUrl={user?.profile_picture_url || 'https://via.placeholder.com/400'}
            isSeen={false}
            isCurrentUser={true}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            onPress={handleAddStory}
          />

          {/* Show loading indicator for other stories while loading */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
          ) : (
            // Other users' stories
            storyGroups.map((group, groupIndex) => {
              const hasUnviewedStories = group.stories?.some(story => !story.hasViewed) || false;
              
              return (
                <StoryItem
                  key={group.userId || groupIndex}
                  id={group.userId || `user-${groupIndex}`}
                  title={`${group.userInfo?.first_name || ''} ${group.userInfo?.last_name || ''}`.trim() || 'User'}
                  subtitle={`${group.stories?.length || 0} story${group.stories?.length !== 1 ? 's' : ''}`}
                  imageUrl={cleanImageUrl(group.userInfo?.profile_picture_url) || 'https://via.placeholder.com/400'}
                  isSeen={!hasUnviewedStories}
                  onPress={() => handleStoryPress(groupIndex, 0)}
                />
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Story viewer modal */}
      {viewerVisible && viewerStories.length > 0 && (
        <StoriesViewer
          stories={viewerStories}
          onClose={handleViewerClose}
          initialIndex={selectedStoryIndex}
          onNextUser={handleNextUser}
          onPreviousUser={handlePreviousUser}
          currentUserIndex={selectedUserIndex}
          totalUsers={storyGroups.length}
          onMarkAsSeen={async (storyId: string) => {
            try {
              await storiesAPI.viewStory(storyId);
            } catch (err) {
              console.error('Failed to mark story as seen:', err);
            }
          }}
        />
      )}
    </View>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 15,
    marginHorizontal: 15,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  carouselContainer: {
    minHeight: 110,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  loadingContainer: {
    width: 84,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: isDark ? '#3B82F6' : '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noStoriesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  noStoriesText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  noStoriesSubtext: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
});