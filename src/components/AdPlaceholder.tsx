import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { SupplierAd } from '../types/supplier';
import SupplierAdCard from './SupplierAdCard';
import { Loader2, WifiOff } from 'lucide-react';

interface AdPlaceholderProps {
  activityTags?: string[];
  compact?: boolean;
}

export default function AdPlaceholder({ activityTags = [], compact = false }: AdPlaceholderProps) {
  const { userId } = useCurrentUser();
  const [ad, setAd] = useState<SupplierAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [hiddenAds, setHiddenAds] = useState<string[]>([]);

  useEffect(() => {
    // Check if we're online
    setIsOffline(!navigator.onLine);
    
    loadHiddenAds();
    loadRandomAd();
    
    // Add event listeners for online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      loadRandomAd();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activityTags]);

  const loadHiddenAds = async () => {
    if (!userId) return;
    
    try {
      const { data } = await supabase
        .from('ad_feedback')
        .select('ad_id')
        .eq('user_id', userId);
      
      if (data) {
        setHiddenAds(data.map(item => item.ad_id));
      }
    } catch (error) {
      console.error('Error loading hidden ads:', error);
    }
  };

  const loadRandomAd = async () => {
    if (isOffline) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Track which ads we've already shown to avoid repetition
      const viewedAds = JSON.parse(localStorage.getItem('viewedAds') || '[]');
      
      // Build the query
      let query = supabase
        .from('supplier_ads')
        .select(`
          *,
          supplier:suppliers (*)
        `)
        .eq('approved', true);
      
      // Add filter to exclude hidden and viewed ads if there are any
      const excludedIds = [...hiddenAds, ...viewedAds].filter(Boolean);
      if (excludedIds.length > 0) {
        query = query.not('id', 'in', `(${excludedIds.join(',')})`);
      }
      
      // Filter by activity tags if provided
      if (activityTags && activityTags.length > 0) {
        // Build an OR condition for each tag
        const tagConditions = activityTags.map(tag => {
          // Escape any special characters in the tag
          const safeTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return `activity_tags.cs.{${safeTag}}`;
        });
        
        if (tagConditions.length > 0) {
          query = query.or(tagConditions.join(','));
        }
      }
      
      // Order by random and limit to 1
      query = query.order('created_at', { ascending: false }).limit(1);
      
      const { data, error } = await query;

      if (error) throw error;
      
      if (data && data.length > 0) {
        setAd(data[0]);
        
        // Track impression
        await supabase.rpc('increment_ad_impressions', { ad_id: data[0].id });
        
        // Add to viewed ads
        const updatedViewedAds = [...viewedAds, data[0].id].slice(-10); // Keep last 10
        localStorage.setItem('viewedAds', JSON.stringify(updatedViewedAds));
      } else {
        setAd(null);
      }
    } catch (err) {
      console.error('Error loading ad:', err);
      setError('Failed to load advertisement');
      setAd(null);
    } finally {
      setLoading(false);
    }
  };

  const handleHideAd = () => {
    if (ad) {
      setHiddenAds(prev => [...prev, ad.id]);
      loadRandomAd();
    }
  };

  if (isOffline) {
    return null; // Don't show ads when offline
  }

  if (loading) {
    return (
      <div className={`flex justify-center items-center ${compact ? 'h-24' : 'h-48'} bg-gray-50 rounded-lg`}>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !ad) {
    return null; // Don't show error states to users
  }

  return <SupplierAdCard ad={ad} onHide={handleHideAd} compact={compact} />;
}