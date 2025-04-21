import React from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase, safeUserQuery } from '../lib/supabase';
import { Target, Clock, CheckCircle2, Loader2 } from 'lucide-react';

interface ActivityStatusToggleProps {
  activityId: string;
  currentStatus: 'not_started' | 'in_progress' | 'completed';
  onStatusChange: (newStatus: 'not_started' | 'in_progress' | 'completed') => void;
  className?: string;
}

export default function ActivityStatusToggle({ 
  activityId, 
  currentStatus, 
  onStatusChange,
  className = ''
}: ActivityStatusToggleProps) {
  const { userId, isDemoMode } = useCurrentUser();
  const [loading, setLoading] = React.useState(false);

  const updateStatus = async (newStatus: 'not_started' | 'in_progress' | 'completed') => {
    if (loading || newStatus === currentStatus) return;

    setLoading(true);
    try {
      if (isDemoMode) {
        onStatusChange(newStatus);
        return;
      }

      if (!userId) {
        console.error('Cannot update status: No user ID available');
        return;
      }

      await safeUserQuery(
        async (uid) => {
          const { error } = await supabase
            .from('user_activities')
            .update({ status: newStatus })
            .eq('user_id', uid)
            .eq('activity_id', activityId);

          if (error) throw error;
        },
        userId
      );
      
      onStatusChange(newStatus);

    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => updateStatus('not_started')}
        disabled={loading || currentStatus === 'not_started'}
        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
          currentStatus === 'not_started'
            ? 'bg-gray-100 text-gray-700'
            : 'hover:bg-gray-100 text-gray-600'
        }`}
      >
        <Target className="h-4 w-4" />
        Reset
      </button>

      <button
        onClick={() => updateStatus('in_progress')}
        disabled={loading || currentStatus === 'in_progress'}
        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
          currentStatus === 'in_progress'
            ? 'bg-blue-100 text-blue-700'
            : 'hover:bg-blue-100 text-blue-600'
        }`}
      >
        <Clock className="h-4 w-4" />
        Start
      </button>

      <button
        onClick={() => updateStatus('completed')}
        disabled={loading || currentStatus === 'completed'}
        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
          currentStatus === 'completed'
            ? 'bg-green-100 text-green-700'
            : 'hover:bg-green-100 text-green-600'
        }`}
      >
        <CheckCircle2 className="h-4 w-4" />
        Complete
      </button>

      {loading && (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      )}
    </div>
  );
}