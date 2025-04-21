import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase, safeUserQuery } from '../lib/supabase';
import { Plus, Check, Loader2, Lock } from 'lucide-react';

interface AddToListButtonProps {
  activityId: string;
  onSuccess?: () => void;
}

export default function AddToListButton({ activityId, onSuccess }: AddToListButtonProps) {
  const { user, userId } = useCurrentUser();
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkIfAdded();
  }, [activityId, userId]);

  const checkIfAdded = async () => {
    try {
      if (!userId) {
        setIsAdded(false);
        setChecking(false);
        return;
      }

      const { data } = await safeUserQuery(
        async (uid) => {
          return await supabase
            .from('user_activities')
            .select('id')
            .eq('user_id', uid)
            .eq('activity_id', activityId)
            .maybeSingle();
        },
        userId,
        { data: null }
      );

      setIsAdded(Boolean(data));
    } catch (err) {
      console.error('Error checking activity status:', err);
    } finally {
      setChecking(false);
    }
  };

  const addToList = async () => {
    if (isAdded || !userId) return;

    setLoading(true);
    try {
      await safeUserQuery(
        async (uid) => {
          const { error } = await supabase
            .from('user_activities')
            .insert({
              user_id: uid,
              activity_id: activityId,
              status: 'not_started',
              progress: 0,
              created_at: new Date().toISOString()
            });

          if (error) throw error;
        },
        userId
      );
      
      setIsAdded(true);
      onSuccess?.();

      // Show toast message
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Added to your list!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

    } catch (err) {
      console.error('Error adding activity:', err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <button 
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg"
      >
        <Loader2 className="h-5 w-5 animate-spin" />
        Checking...
      </button>
    );
  }

  if (isAdded) {
    return (
      <button 
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg"
      >
        <Check className="h-5 w-5" />
        Added to List
      </button>
    );
  }

  return (
    <button
      onClick={addToList}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          {user ? <Plus className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          {user ? 'Add to My List' : 'Sign In'}
        </>
      )}
    </button>
  );
}