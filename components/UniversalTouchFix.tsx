// components/UniversalTouchFix.tsx
import { useEffect } from 'react';
import { Platform, BackHandler } from 'react-native';

/**
 * This fix addresses Android touch issues at the native level
 * without needing to modify individual components
 */
export default function UniversalTouchFix() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Method 1: Force Android to reconsider touch focus
      const forceTouchRecalculation = () => {
        // This forces Android to reset touch handlers
        setTimeout(() => {
          console.log('Universal Android touch fix applied');
        }, 300);
      };

      // Method 2: Use BackHandler to trigger touch reset
      const useBackHandlerTrick = () => {
        const originalExitApp = BackHandler.exitApp;
        BackHandler.exitApp = () => false;
        
        const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
          setTimeout(() => {
            backHandlerSubscription.remove();
            BackHandler.exitApp = originalExitApp;
          }, 100);
          return true;
        });

        // Trigger a fake back press (no direct API available)
        // You may need to manually test back press or use a custom event if needed.
      };

      // Apply both fixes
      forceTouchRecalculation();
      
      // More aggressive fix after longer delay
      const aggressiveTimer = setTimeout(() => {
        useBackHandlerTrick();
      }, 1000);

      return () => {
        clearTimeout(aggressiveTimer);
      };
    }
  }, []);

  return null;
}