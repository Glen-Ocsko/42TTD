import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { UserHashtag } from '../types/social';
import { Hash, Plus, X, Loader2 } from 'lucide-react';

interface HashtagsFollowingListProps {
  onFollowHashtag?: (hashtagId: string) => Promise<void>;
  compact?: boolean;
}

export default function HashtagsFollowingList({ 
  onFollowHashtag,
  compact = false 
}: HashtagsFollowingListProps) {
  const { userId, isAuthenticated } = useCurrentUser();
  const [followedHashtags, setFollowedHashtags] = useState<UserHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadFollowedHashtags();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadFollowedHashtags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_followed_hashtags', { user_id: userId });

      if (error) throw error;
      setFollowedHashtags(data || []);
    } catch (err) {
      console.error('Error loading followed hashtags:', err);
      setError('Failed to load followed hashtags');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (hashtagId: string) => {
    if (!isAuthenticated || !userId) return;
    
    try {
      setUnfollowingId(hashtagId);
      
      if (onFollowHashtag) {
        await onFollowHashtag(hashtagId);
      } else {
        const { error } = await supabase
          .from('user_hashtags')
          .delete()
          .eq('user_id', userId)
          .eq('hashtag_id', hashtagId);

        if (error) throw error;
      }
      
      setFollowedHashtags(prev => prev.filter(h => h.hashtag_id !== hashtagId));
    } catch (err) {
      console.error('Error unfollowing hashtag:', err);
      setError('Failed to unfollow hashtag');
    } finally {
      setUnfollowingId(null);
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

  if (followedHashtags.length === 0) {
    return (
      <div className={`text-center py-4 ${compact ? '' : 'bg-gray-50 rounded-lg'}`}>
        <p className="text-gray-500">You haven't followed any hashtags yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${compact ? 'max-h-40' : 'max-h-60'} overflow-y-auto`}>
      {followedHashtags.map(hashtag => (
        <div 
          key={hashtag.hashtag_id}
          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
        >
          <Link
            to={`/community?hashtag=${hashtag.hashtag_name}`}
            className="flex items-center gap-2 flex-1"
          >
            <Hash className="h-4 w-4 text-blue-500" />
            <span className="font-medium">#{hashtag.hashtag_name}</span>
            {!compact && (
              <span className="text-sm text-gray-500">{hashtag.post_count} posts</span>
            )}
          </Link>
          <button
            onClick={() => handleUnfollow(hashtag.hashtag_id)}
            disabled={unfollowingId === hashtag.hashtag_id}
            className="p-1 text-red-500 hover:text-red-700 rounded-full"
          >
            {unfollowingId === hashtag.hashtag_id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}