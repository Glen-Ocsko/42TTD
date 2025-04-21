import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Heart, Loader2 } from 'lucide-react';

interface PostLikeButtonProps {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLikeChange?: (liked: boolean, count: number) => void;
  className?: string;
  showCount?: boolean;
}

export default function PostLikeButton({
  postId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  className = '',
  showCount = true
}: PostLikeButtonProps) {
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

    try {
      setLoading(true);
      
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) throw error;
        
        setLiked(false);
        setCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: userId
          });

        if (error) throw error;
        
        setLiked(true);
        setCount(prev => prev + 1);
      }
      
      if (onLikeChange) {
        onLikeChange(!liked, liked ? count - 1 : count + 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-1 ${
        liked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
      )}
      {showCount && <span>{count}</span>}
    </button>
  );
}