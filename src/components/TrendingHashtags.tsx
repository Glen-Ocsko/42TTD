import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Hashtag } from '../types/social';
import { Hash, Plus, Loader2 } from 'lucide-react';

interface TrendingHashtagsProps {
  onFollowHashtag?: (hashtagId: string) => Promise<void>;
  limit?: number;
  compact?: boolean;
}

export default function TrendingHashtags({ 
  onFollowHashtag,
  limit = 10,
  compact = false 
}: TrendingHashtagsProps) {
  const { userId, isAuthenticated } = useCurrentUser();
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [followedHashtagIds, setFollowedHashtagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followingId, setFollowingId] = useState<string | null>(null);

  useEffect(() => {
    loadTrendingHashtags();
    if (userId) {
      loadFollowedHashtags();
    }
  }, [userId]);

  const loadTrendingHashtags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .order('post_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTrendingHashtags(data || []);
    } catch (err) {
      console.error('Error loading trending hashtags:', err);
      setError('Failed to load trending hashtags');
    } finally {
      setLoading(false);
    }
  };

  const loadFollowedHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('user_hashtags')
        .select('hashtag_id')
        .eq('user_id', userId);

      if (error) throw error;
      setFollowedHashtagIds(data?.map(item => item.hashtag_id) || []);
    } catch (err) {
      console.error('Error loading followed hashtags:', err);
    }
  };

  const handleFollow = async (hashtagId: string) => {
    if (!isAuthenticated || !userId) return;
    
    try {
      setFollowingId(hashtagId);
      
      if (onFollowHashtag) {
        await onFollowHashtag(hashtagId);
      } else {
        if (followedHashtagIds.includes(hashtagId)) {
          // Unfollow
          const { error } = await supabase
            .from('user_hashtags')
            .delete()
            .eq('user_id', userId)
            .eq('hashtag_id', hashtagId);

          if (error) throw error;
          setFollowedHashtagIds(prev => prev.filter(id => id !== hashtagId));
        } else {
          // Follow
          const { error } = await supabase
            .from('user_hashtags')
            .insert({
              user_id: userId,
              hashtag_id: hashtagId
            });

          if (error) throw error;
          setFollowedHashtagIds(prev => [...prev, hashtagId]);
        }
      }
    } catch (err) {
      console.error('Error following/unfollowing hashtag:', err);
      setError('Failed to follow/unfollow hashtag');
    } finally {
      setFollowingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (trendingHashtags.length === 0) {
    return (
      <div className={`text-center py-4 ${compact ? '' : 'bg-gray-50 rounded-lg'}`}>
        <p className="text-gray-500">No trending hashtags yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${compact ? 'max-h-40' : 'max-h-60'} overflow-y-auto`}>
      {trendingHashtags.map(hashtag => (
        <div 
          key={hashtag.id}
          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
        >
          <Link
            to={`/community?hashtag=${hashtag.name}`}
            className="flex items-center gap-2 flex-1"
          >
            <Hash className="h-4 w-4 text-blue-500" />
            <span className="font-medium">#{hashtag.name}</span>
            {!compact && (
              <span className="text-sm text-gray-500">{hashtag.post_count} posts</span>
            )}
          </Link>
          {isAuthenticated && (
            <button
              onClick={() => handleFollow(hashtag.id)}
              disabled={followingId === hashtag.id}
              className={`p-1 rounded-full ${
                followedHashtagIds.includes(hashtag.id)
                  ? 'text-gray-400 hover:text-gray-600'
                  : 'text-blue-500 hover:text-blue-700'
              }`}
            >
              {followingId === hashtag.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : followedHashtagIds.includes(hashtag.id) ? (
                <span className="text-xs font-medium">Following</span>
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}