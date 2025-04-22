import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase, safeUserQuery } from '../lib/supabase';
import { Plus, Check, Loader2, Lock } from 'lucide-react';

interface DynamicAddToListButtonProps {
  activityId: string;
  onAddSuccess?: () => void;
  className?: string;
  iconOnly?: boolean;
}

export default function DynamicAddToListButton({ 
  activityId, 
  onAddSuccess, 
  className = "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg",
  iconOnly = false
}: DynamicAddToListButtonProps) {
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
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
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

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
      
      if (onAddSuccess) {
        onAddSuccess();
      }

      // Show toast message
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Added to your list!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

    } catch (err) {
      console.error('Error adding activity:', err);
      
      // Show error toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      
      if (err instanceof Error && err.message.includes('duplicate key')) {
        toast.textContent = 'Already on your list!';
      } else {
        toast.textContent = 'Failed to add to list. Please try again.';
      }
      
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <button
        disabled
        className={`${className} ${
          iconOnly 
            ? 'bg-gray-200/80 hover:bg-gray-200 shadow-md text-gray-400' 
            : 'bg-gray-100 text-gray-400'
        }`}
        aria-label="Checking if activity is on your list"
      >
        <Loader2 className="h-5 w-5 animate-spin" />
        {!iconOnly && <span>Checking...</span>}
      </button>
    );
  }

  if (isAdded) {
    return (
      <button
        onClick={() => {}} // Empty function to maintain button appearance
        className={`${className} ${
          iconOnly 
            ? 'bg-green-600 text-white shadow-md hover:bg-green-700' 
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
        aria-label="Activity added to your list"
      >
        <Check className="h-5 w-5" />
        {!iconOnly && <span>Added to My List</span>}
      </button>
    );
  }

  return (
    <button
      onClick={addToList}
      aria-label={isAuthenticated ? "Add to my list" : "Sign in to add to your list"}
      disabled={loading}
      className={`${className} ${
        iconOnly 
          ? `${isAuthenticated ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'} shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all`
          : `${isAuthenticated ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-600 text-white hover:bg-gray-700'}`
      } disabled:opacity-50`}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          {!iconOnly && <span>Adding...</span>}
        </>
      ) : (
        <>
          {isAuthenticated ? <Plus className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          {!iconOnly && <span>{isAuthenticated ? 'Add to My List' : 'Sign in to add to your list'}</span>}
        </>
      )}
    </button>
  );
}