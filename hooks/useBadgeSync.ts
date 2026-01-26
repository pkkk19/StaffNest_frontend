import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';

export function useBadgeSync() {
  const { user } = useAuth();

  const syncBadgeCount = useCallback(async () => {
    if (user?._id) {
      try {
        console.log('🔄 Syncing badge count on app state change');
        await notificationService.syncBadgeCountWithBackend(user._id);
      } catch (error) {
        console.error('Failed to sync badge count:', error);
      }
    }
  }, [user?._id]);

  useEffect(() => {
    // Sync on mount
    syncBadgeCount();

    // Sync when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        syncBadgeCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [syncBadgeCount]);

  return { syncBadgeCount };
}