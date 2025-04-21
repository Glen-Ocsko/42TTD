import React, { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { supabase, safeUserQuery } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import RatingModal from './RatingModal';

interface RateActivityButtonProps {
  activityId: string;
  onRatingUpdated?: () => void;
}

export default function RateActivityButton({ activityId, onRatingUpdated }: RateActivityButtonProps) {
  const { userId, isDemoMode } = useCurrentUser();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'started' | 'completed' | null>(null);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    if (activityId) {
      checkActivityStatus();
      checkRatingStatus();
    } else {
      setLoading(false);
    }
  }, [userId, activityId]);

  const checkActivityStatus = async () => {
    // Return early if no userId and not in demo mode
    if (!userId && !isDemoMode) {
      setLoading(false);
      return;
    }

    try {
      const effectiveUserId = isDemoMode ? '00000000-0000-0000-0000-000000000000' : userId;
      
      const { data, error } = await safeUserQuery(
        async (uid) => {
          return await supabase
            .from('user_activities')
            .select('status')
            .eq('user_id', uid)
            .eq('activity_id', activityId)
            .maybeSingle();
        },
        effectiveUserId,
        { data: null }
      );

      if (error) throw error;

      if (data?.status === 'in_progress') {
        setStatus('started');
      } else if (data?.status === 'completed') {
        setStatus('completed');
      }
    } catch (err) {
      console.error('Error checking activity status:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkRatingStatus = async () => {
    // Return early if no userId and not in demo mode
    if (!userId && !isDemoMode) {
      return;
    }

    try {
      const effectiveUserId = isDemoMode ? '00000000-0000-0000-0000-000000000000' : userId;
      
      const { data, error } = await safeUserQuery(
        async (uid) => {
          return await supabase
            .from('user_activity_ratings')
            .select('id')
            .eq('user_id', uid)
            .eq('activity_id', activityId)
            .maybeSingle();
        },
        effectiveUserId,
        { data: null }
      );

      if (error) throw error;
      setHasRated(!!data);
    } catch (err) {
      console.error('Error checking rating status:', err);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    checkRatingStatus();
    if (onRatingUpdated) {
      onRatingUpdated();
    }
  };

  // Show login prompt if user is not authenticated and not in demo mode
  if (!userId && !isDemoMode) {
    return (
      <div className="text-sm text-gray-500 italic">
        Please log in to rate this activity.
      </div>
    );
  }

  if (loading) {
    return (
      <button disabled className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading...
      </button>
    );
  }

  if (!status) {
    return (
      <div className="text-sm text-gray-500 italic">
        Start or complete this activity to leave a rating.
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-4 py-2 ${
          hasRated 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white rounded-lg transition-colors`}
      >
        <Star className="h-5 w-5" />
        {hasRated ? 'Update Your Rating' : 'Rate This Activity'}
      </button>

      <RatingModal
        isOpen={showModal}
        onClose={handleModalClose}
        activityId={activityId}
        status={status}
      />
    </>
  );
}