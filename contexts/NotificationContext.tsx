import React, { createContext, useContext, useState, ReactNode } from 'react';
import { notificationService } from '@/services/notificationService';

interface NotificationContextType {
  notificationCount: number;
  incrementNotificationCount: () => void;
  resetNotificationCount: () => void;
  refreshNotifications: () => Promise<void>;
  hasPermission: boolean;
  checkPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  // Initialize with explicit type and initial value
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const incrementNotificationCount = () => {
    setNotificationCount(prev => prev + 1);
  };

  const resetNotificationCount = () => {
    setNotificationCount(0);
  };

  const refreshNotifications = async () => {
    try {
      const count = await notificationService.getBadgeCountAsync();
      setNotificationCount(count);
      
      const enabled = await notificationService.areNotificationsEnabled();
      setHasPermission(enabled);
    } catch (error) {
      console.error('Failed to refresh notification count:', error);
    }
  };

  const checkPermission = async (): Promise<boolean> => {
    try {
      const enabled = await notificationService.areNotificationsEnabled();
      setHasPermission(enabled);
      return enabled;
    } catch (error) {
      console.error('Failed to check notification permission:', error);
      return false;
    }
  };

  return (
    <NotificationContext.Provider value={{
      notificationCount,
      incrementNotificationCount,
      resetNotificationCount,
      refreshNotifications,
      hasPermission,
      checkPermission,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}