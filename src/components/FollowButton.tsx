import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { UserPlus, UserCheck, Clock, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  userId: string;
  initialStatus?: 'none' | 'following' | 'pending' | 'requested' | 'friends';
  onStatusChange?: (status: 'none' | 'following' | 'pending' | 'requested' | 'friends') => void;
  className?: string;
  showText?: boolean;
}

export default function FollowButton({
  userId,
  initialStatus = 'none',
  onStatusChange,
  className = '',
  showText = true
}: FollowButtonProps) {
  const { userId: currentUserId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [followStatus, setFollowStatus] = useState<'none' | 'following' | 'pending' | 'requested' | 'friends'>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialStatus !== 'none') {
      setFollowStatus(initialStatus);
      setLoading(false);
      return;
    }

    if (currentUserId && userId) {
      checkFollowStatus();
    } else {
      setLoading(false);
    }
  }, [currentUserId, userId, initialStatus]);

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_follow_status', { 
          user_id: currentUserId, 
          target_id: userId 
        });

      if (error) throw error;
      setFollowStatus(data || 'none');
    } catch (err) {
      console.error('Error checking follow status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

    if (isUpdating || currentUserId === userId) return;

    setIsUpdating(true);
    try {
      if (followStatus === 'none' || followStatus === 'rejected') {
        // Get user's privacy setting
        const { data: profile } = await supabase
          .from('profiles')
          .select('privacy_default')
          .eq('id', userId)
          .single();

        // Create new follow request
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId,
            status: profile?.privacy_default === 'public' ? 'accepted' : 'pending'
          });

        if (error) throw error;
        
        const newStatus = profile?.privacy_default === 'public' ? 'following' : 'requested';
        setFollowStatus(newStatus);
        if (onStatusChange) onStatusChange(newStatus);
      } else if (followStatus === 'following' || followStatus === 'friends' || followStatus === 'requested') {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);

        if (error) throw error;
        
        setFollowStatus('none');
        if (onStatusChange) onStatusChange('none');
      }
    } catch (err) {
      console.error('Error updating follow status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getButtonStyle = () => {
    switch (followStatus) {
      case 'following':
      case 'friends':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
      case 'requested':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const getButtonText = () => {
    switch (followStatus) {
      case 'following':
        return 'Following';
      case 'friends':
        return 'Friends';
      case 'requested':
        return 'Requested';
      default:
        return 'Follow';
    }
  };

  const getButtonIcon = () => {
    if (isUpdating) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    switch (followStatus) {
      case 'following':
      case 'friends':
        return <UserCheck className="h-4 w-4" />;
      case 'requested':
        return <Clock className="h-4 w-4" />;
      default:
        return <UserPlus className="h-4 w-4" />;
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

  if (currentUserId === userId) {
    return null;
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isUpdating}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${getButtonStyle()} ${className}`}
    >
      {getButtonIcon()}
      {showText && <span>{getButtonText()}</span>}
    </button>
  );
}