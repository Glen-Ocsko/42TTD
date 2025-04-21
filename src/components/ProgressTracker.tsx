import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase, safeUserQuery } from '../lib/supabase';
import { Trophy, Target, Sparkles, Flame, Medal, Loader2 } from 'lucide-react';

interface ProgressStats {
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
}

export default function ProgressTracker() {
  const { userId, isDemoMode } = useCurrentUser();
  const [stats, setStats] = useState<ProgressStats>({
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();

    // Set up real-time subscription
    const subscription = supabase
      .channel('user_activities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activities',
          filter: `user_id=eq.${isDemoMode ? '00000000-0000-0000-0000-000000000000' : userId}`
        },
        () => {
          loadStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, isDemoMode]);

  const loadStats = async () => {
    try {
      const effectiveUserId = isDemoMode ? '00000000-0000-0000-0000-000000000000' : userId;

      if (!effectiveUserId) {
        setStats({
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          total: 0
        });
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await safeUserQuery(
        async (uid) => {
          return await supabase
            .from('user_activities')
            .select('status')
            .eq('user_id', uid);
        },
        effectiveUserId,
        { data: [] }
      );

      if (fetchError) throw fetchError;

      const completed = data?.filter(d => d.status === 'completed').length || 0;
      const inProgress = data?.filter(d => d.status === 'in_progress').length || 0;
      const notStarted = data?.filter(d => d.status === 'not_started').length || 0;
      const total = data?.length || 0;

      setStats({
        completed,
        inProgress,
        notStarted,
        total
      });
    } catch (err) {
      console.error('Error loading progress stats:', err);
      setError('Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 rounded-xl p-4 mb-4">
        <p className="text-center">{error}</p>
      </div>
    );
  }

  const progressPercent = Math.round((stats.completed / stats.total) * 100) || 0;

  const getFeedback = () => {
    if (stats.completed === stats.total && stats.total > 0) return {
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      message: "🎉 You've completed all your activities! Amazing!"
    };
    if (progressPercent >= 50) return {
      icon: <Medal className="h-5 w-5 text-purple-500" />,
      message: "💪 You're more than halfway there!"
    };
    if (progressPercent >= 25) return {
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      message: "🔥 You're on a roll!"
    };
    return {
      icon: <Target className="h-5 w-5 text-blue-500" />,
      message: "🎯 Just getting started!"
    };
  };

  const feedback = getFeedback();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Your Progress
        </h2>
        {feedback.icon}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl font-bold text-blue-600">{stats.completed}</span>
        <span className="text-gray-600">of</span>
        <span className="text-xl font-bold text-gray-700">{stats.total}</span>
        <span className="text-gray-600">activities completed</span>
      </div>

      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="text-sm text-gray-600">{feedback.message}</p>
    </div>
  );
}