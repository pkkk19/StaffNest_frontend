import { useRef } from 'react';

export function useNotificationSubscription<T>() {
  const subscriptionRef = useRef<T | null>(null);
  
  const setSubscription = (subscription: T) => {
    subscriptionRef.current = subscription;
  };
  
  const removeSubscription = () => {
    subscriptionRef.current = null;
  };
  
  return {
    subscriptionRef,
    setSubscription,
    removeSubscription,
  };
}