// contexts/TouchFixContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Platform } from 'react-native';

const TouchFixContext = createContext<{ version: number }>({ version: 0 });

export function TouchFixProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handler = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Force complete re-render of entire app
        setVersion(v => v + 1);
      }
    });

    return () => handler.remove();
  }, []);

  return (
    <TouchFixContext.Provider value={{ version }}>
      {children}
    </TouchFixContext.Provider>
  );
}

export const useTouchFix = () => useContext(TouchFixContext);