import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Plus, Check, Loader2 } from 'lucide-react';

interface HashtagFollowButtonProps {
  hashtagId: string;
  hashtagName: string;
  className?: string;
  showText?: boolean;
}

export default function HashtagFollowButton({
  hashtagId,
  hashtagName,
  className = '',
  showText = true
}: HashtagFollowButtonProps) {
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (userId) {
      checkFollowStatus();
    } else {
      setLoading(false);
    }
  }, [userId, hashtagId]);

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_hashtags')
        .select('id')
        .eq('user_id', userId)
        .eq('hashtag_id', hashtagId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (err) {
      console.error('Error checking hashtag follow status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

    try {
      setUpdating(true);
      
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_hashtags')
          .delete()
          .eq('user_id', userId)
          .eq('hashtag_id', hashtagId);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        // Follow
        const { error } = await supabase
          .from('user_hashtags')
          .insert({
            user_id: userId,
            hashtag_id: hashtagId
          });

        if (error) throw error;
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Error toggling hashtag follow:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg ${className}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {showText && <span>Loading...</span>}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={updating}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isFollowing
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } ${className}`}
    >
      {updating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <Check className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      {showText && <span>{isFollowing ? `Following #${hashtagName}` : `Follow #${hashtagName}`}</span>}
    </button>
  );
}