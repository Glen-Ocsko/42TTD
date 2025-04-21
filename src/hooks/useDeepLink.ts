import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { isNative } from '../lib/capacitor';

export function useDeepLink() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNative) return;

    // Handler for deep links when app is already running
    const appUrlOpenListener = App.addListener('appUrlOpen', (data) => {
      // Example: https://app.42thingstodo.com/activities/123
      const url = new URL(data.url);
      const path = url.pathname;
      
      // Handle the deep link by navigating to the appropriate route
      if (path) {
        navigate(path);
      }
    });

    return () => {
      // Clean up the listener when the component unmounts
      appUrlOpenListener.remove();
    };
  }, [navigate]);
}