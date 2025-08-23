// components/ForceTouchable.tsx
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, TouchableOpacityProps, Platform, AppState } from 'react-native';

/**
 * This component forces TouchableOpacity to re-render on Android
 * to fix the "touch works after reload but not initially" bug
 */
export default function ForceTouchable(props: TouchableOpacityProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Fix for initial load
      const timer1 = setTimeout(() => setKey(1), 100);
    const timer2 = setTimeout(() => setKey(2), 300);
    const timer3 = setTimeout(() => setKey(3), 500);

      // Fix for app state changes (when app comes from background to foreground)
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          setKey(prev => prev + 1); // Re-render when app becomes active
        }
      });

      return () => {
        clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
        subscription.remove();
      };
    }
  }, []);

  return <TouchableOpacity {...props} key={key} />;
}