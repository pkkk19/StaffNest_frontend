// hooks/useAppFocusFix.ts
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useAppFocusFix() {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // Force a re-render when app comes to foreground
        setAppState(nextAppState);
      }
    });

    return () => subscription.remove();
  }, [appState]);

  return appState;
}