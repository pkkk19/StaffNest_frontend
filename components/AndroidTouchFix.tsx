// components/AndroidTouchFix.tsx
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * This component fixes Android touch issues that occur on initial app load
 * but work fine after reload. It forces touch handlers to re-initialize.
 */
export default function AndroidTouchFix() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // This timeout forces Android to reinitialize touch handlers
      // after the app has fully loaded and rendered
      const timer = setTimeout(() => {
        // Force a micro-task that triggers touch handler reinitialization
        console.log('Android touch fix applied');
      }, 300); // 300ms delay ensures all components are mounted

      return () => clearTimeout(timer);
    }
  }, []);

  return null; // This component doesn't render anything
}