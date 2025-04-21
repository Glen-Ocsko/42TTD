import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { initPushNotifications, isNative } from '../lib/capacitor';
import { useCurrentUser } from './useCurrentUser';

export function usePushNotifications() {
  const { userId } = useCurrentUser();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupPushNotifications = async () => {
      if (!isNative || !userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if user has notifications enabled in their profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', userId)
          .single();

        const pushEnabled = profile?.notification_preferences?.push;
        
        // If push is enabled in user preferences, initialize push notifications
        if (pushEnabled) {
          // Note: This will be a stub implementation in StackBlitz
          // The actual implementation will be added after export
          const success = await initPushNotifications();
          setIsEnabled(success);
        } else {
          setIsEnabled(false);
        }
      } catch (err) {
        console.error('Error setting up push notifications:', err);
        setError(err instanceof Error ? err.message : 'Failed to set up push notifications');
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    setupPushNotifications();
  }, [userId]);

  const togglePushNotifications = async (enable: boolean) => {
    if (!isNative || !userId) return false;

    try {
      setIsLoading(true);
      setError(null);

      // Update user preferences in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          notification_preferences: {
            push: enable,
            // Preserve other notification preferences
            ...(await supabase
              .from('profiles')
              .select('notification_preferences')
              .eq('id', userId)
              .single()
              .then(({ data }) => data?.notification_preferences || {}))
          }
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // If enabling, initialize push notifications
      // Note: This is a stub implementation in StackBlitz
      if (enable) {
        const success = await initPushNotifications();
        setIsEnabled(success);
        return success;
      } else {
        setIsEnabled(false);
        return true;
      }
    } catch (err) {
      console.error('Error toggling push notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isEnabled,
    isLoading,
    error,
    togglePushNotifications
  };
}