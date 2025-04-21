import { useState, useEffect } from 'react';
import { getOfflineData, storeOfflineData, isNative } from '../lib/capacitor';
import { supabase } from '../lib/supabase';

interface UseOfflineDataOptions<T> {
  key: string;
  fetchFn: () => Promise<T[]>;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useOfflineData<T>({ 
  key, 
  fetchFn, 
  enabled = true,
  refetchInterval
}: UseOfflineDataOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const isOnline = navigator.onLine;
      setIsOffline(!isOnline);
      return isOnline;
    };

    const loadData = async () => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Check if we're online
        const isOnline = checkConnection();

        if (isOnline) {
          // Fetch fresh data
          const freshData = await fetchFn();
          setData(freshData);

          // Store for offline use
          if (isNative) {
            await storeOfflineData(key, freshData);
          }
        } else {
          // We're offline, try to load cached data
          const cachedData = await getOfflineData(key);
          if (cachedData) {
            setData(cachedData);
          } else {
            setError('No cached data available while offline');
          }
        }
      } catch (err) {
        console.error(`Error in useOfflineData for ${key}:`, err);
        setError(err instanceof Error ? err.message : 'An error occurred');

        // Try to load cached data as fallback
        if (isNative) {
          const cachedData = await getOfflineData(key);
          if (cachedData) {
            setData(cachedData);
            setError(null); // Clear error if we have cached data
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up interval for refetching if specified
    let intervalId: number | undefined;
    if (refetchInterval && enabled) {
      intervalId = window.setInterval(loadData, refetchInterval);
    }

    // Set up online/offline listeners
    window.addEventListener('online', loadData);
    window.addEventListener('offline', () => setIsOffline(true));

    return () => {
      window.removeEventListener('online', loadData);
      window.removeEventListener('offline', () => setIsOffline(true));
      if (intervalId) clearInterval(intervalId);
    };
  }, [key, enabled, refetchInterval]);

  // Function to manually refetch data
  const refetch = async () => {
    if (!navigator.onLine) {
      setIsOffline(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const freshData = await fetchFn();
      setData(freshData);

      // Store for offline use
      if (isNative) {
        await storeOfflineData(key, freshData);
      }
    } catch (err) {
      console.error(`Error refetching data for ${key}:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, isOffline, refetch };
}

// Example usage for activities
export function useOfflineActivities(userId: string | null, enabled = true) {
  return useOfflineData({
    key: 'user_activities',
    fetchFn: async () => {
      if (!userId) return [];
      
      const { data } = await supabase
        .from('user_activities')
        .select(`
          *,
          activity:activities (
            id,
            title,
            description,
            category_tags,
            difficulty,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      return data || [];
    },
    enabled: !!userId && enabled
  });
}