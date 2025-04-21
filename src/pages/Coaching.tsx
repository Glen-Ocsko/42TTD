import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase } from '../lib/supabase';
import { Dialog } from '@headlessui/react';
import { format, formatDistanceToNow, addDays, isBefore } from 'date-fns';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCcw,
  Trash2,
  Trophy,
  X,
  AlertCircle,
} from 'lucide-react';
import PremiumFeature from '../components/PremiumFeature';

interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  current_count: number;
  last_checked_at: string | null;
  activity: {
    title: string;
  };
}

interface Nudge {
  id: string;
  message: string;
  scheduled_at: string;
  sent: boolean;
  activity: {
    title: string;
  };
}

interface Activity {
  id: string;
  title: string;
}

const DEMO_HABITS: Habit[] = [
  {
    id: '1',
    title: 'Morning Run',
    frequency: 'daily',
    target_count: 30,
    current_count: 15,
    last_checked_at: new Date().toISOString(),
    activity: { title: 'Running' }
  },
  {
    id: '2',
    title: 'Learn Guitar',
    frequency: 'weekly',
    target_count: 12,
    current_count: 4,
    last_checked_at: new Date().toISOString(),
    activity: { title: 'Music' }
  }
];

const DEMO_NUDGES: Nudge[] = [
  {
    id: '1',
    message: 'Time for your daily meditation!',
    scheduled_at: addDays(new Date(), 1).toISOString(),
    sent: false,
    activity: { title: 'Meditation' }
  },
  {
    id: '2',
    message: 'Check out the new hiking trail this weekend!',
    scheduled_at: addDays(new Date(), 3).toISOString(),
    sent: false,
    activity: { title: 'Hiking' }
  }
];

const DEMO_ACTIVITIES: Activity[] = [
  { id: '1', title: 'Running' },
  { id: '2', title: 'Meditation' },
  { id: '3', title: 'Hiking' },
  { id: '4', title: 'Photography' },
  { id: '5', title: 'Music' }
];

export default function Coaching() {
  const { user, isDemoMode } = useCurrentUser();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  
  const [newHabit, setNewHabit] = useState({
    activity_id: '',
    title: '',
    frequency: 'daily' as const,
    target_count: 1,
  });

  const [newNudge, setNewNudge] = useState({
    activity_id: '',
    message: '',
    scheduled_at: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
  });

  useEffect(() => {
    if (isDemoMode) {
      setHabits(DEMO_HABITS);
      setNudges(DEMO_NUDGES);
      setActivities(DEMO_ACTIVITIES);
      setLoading(false);
      return;
    }

    loadData();
  }, [user, isDemoMode]);

  const loadData = async () => {
    try {
      // Load habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select(`
          *,
          activity:activities (
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (habitsError) throw habitsError;
      setHabits(habitsData || []);

      // Load nudges
      const { data: nudgesData, error: nudgesError } = await supabase
        .from('nudges')
        .select(`
          *,
          activity:activities (
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('scheduled_at', { ascending: true });

      if (nudgesError) throw nudgesError;
      setNudges(nudgesData || []);

      // Load activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('id, title')
        .order('title');

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async () => {
    if (isDemoMode) {
      const newHabitData: Habit = {
        id: `demo-${Date.now()}`,
        title: newHabit.title,
        frequency: newHabit.frequency,
        target_count: newHabit.target_count,
        current_count: 0,
        last_checked_at: new Date().toISOString(),
        activity: {
          title: activities.find(a => a.id === newHabit.activity_id)?.title || 'Unknown Activity'
        }
      };
      setHabits(prev => [...prev, newHabitData]);
      setShowHabitModal(false);
      setNewHabit({
        activity_id: '',
        title: '',
        frequency: 'daily',
        target_count: 1,
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('habits')
        .insert({
          user_id: user?.id,
          ...newHabit,
        });

      if (error) throw error;

      setShowHabitModal(false);
      setNewHabit({
        activity_id: '',
        title: '',
        frequency: 'daily',
        target_count: 1,
      });
      await loadData();
    } catch (err) {
      console.error('Error creating habit:', err);
      setError('Failed to create habit');
    }
  };

  const createNudge = async () => {
    if (isDemoMode) {
      const newNudgeData: Nudge = {
        id: `demo-${Date.now()}`,
        message: newNudge.message,
        scheduled_at: newNudge.scheduled_at,
        sent: false,
        activity: {
          title: activities.find(a => a.id === newNudge.activity_id)?.title || 'Unknown Activity'
        }
      };
      setNudges(prev => [...prev, newNudgeData]);
      setShowNudgeModal(false);
      setNewNudge({
        activity_id: '',
        message: '',
        scheduled_at: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('nudges')
        .insert({
          user_id: user?.id,
          ...newNudge,
        });

      if (error) throw error;

      setShowNudgeModal(false);
      setNewNudge({
        activity_id: '',
        message: '',
        scheduled_at: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      });
      await loadData();
    } catch (err) {
      console.error('Error creating nudge:', err);
      setError('Failed to create nudge');
    }
  };

  const updateHabitCount = async (habitId: string, increment: boolean) => {
    if (isDemoMode) {
      setHabits(prev => prev.map(habit => {
        if (habit.id === habitId) {
          return {
            ...habit,
            current_count: increment
              ? habit.current_count + 1
              : Math.max(0, habit.current_count - 1),
            last_checked_at: new Date().toISOString()
          };
        }
        return habit;
      }));
      return;
    }

    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const newCount = increment
        ? habit.current_count + 1
        : Math.max(0, habit.current_count - 1);

      const { error } = await supabase
        .from('habits')
        .update({
          current_count: newCount,
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', habitId);

      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('Error updating habit:', err);
      setError('Failed to update habit');
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (isDemoMode) {
      setHabits(prev => prev.filter(habit => habit.id !== habitId));
      return;
    }

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('Error deleting habit:', err);
      setError('Failed to delete habit');
    }
  };

  const markNudgeAsSent = async (nudgeId: string) => {
    if (isDemoMode) {
      setNudges(prev => prev.map(nudge => {
        if (nudge.id === nudgeId) {
          return { ...nudge, sent: true };
        }
        return nudge;
      }));
      return;
    }

    try {
      const { error } = await supabase
        .from('nudges')
        .update({ sent: true })
        .eq('id', nudgeId);

      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('Error updating nudge:', err);
      setError('Failed to update nudge');
    }
  };

  const deleteNudge = async (nudgeId: string) => {
    if (isDemoMode) {
      setNudges(prev => prev.filter(nudge => nudge.id !== nudgeId));
      return;
    }

    try {
      const { error } = await supabase
        .from('nudges')
        .delete()
        .eq('id', nudgeId);

      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('Error deleting nudge:', err);
      setError('Failed to delete nudge');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PremiumFeature>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Habits Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Habits & Goals</h2>
              <button
                onClick={() => setShowHabitModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                New Habit
              </button>
            </div>

            <div className="space-y-4">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="bg-white rounded-lg shadow-sm p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{habit.title}</h3>
                      <p className="text-sm text-gray-500">
                        {habit.activity.title}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm capitalize">{habit.frequency}</span>
                    </div>
                    {habit.last_checked_at && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          Last: {formatDistanceToNow(new Date(habit.last_checked_at), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateHabitCount(habit.id, false)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <RefreshCcw className="h-5 w-5" />
                      </button>
                      <span className="font-medium">
                        {habit.current_count} / {habit.target_count}
                      </span>
                      <button
                        onClick={() => updateHabitCount(habit.id, true)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                    </div>
                    {habit.current_count >= habit.target_count && (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}

              {habits.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No habits created yet. Start by adding one!
                </div>
              )}
            </div>
          </div>

          {/* Nudges Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Reminders & Nudges</h2>
              <button
                onClick={() => setShowNudgeModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                New Reminder
              </button>
            </div>

            <div className="space-y-4">
              {nudges.map((nudge) => {
                const isPast = isBefore(new Date(nudge.scheduled_at), new Date());
                return (
                  <div
                    key={nudge.id}
                    className={`bg-white rounded-lg shadow-sm p-4 ${
                      nudge.sent ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Bell className={`h-5 w-5 ${
                            nudge.sent
                              ? 'text-gray-400'
                              : isPast
                              ? 'text-red-500'
                              : 'text-blue-500'
                          }`} />
                          <h3 className="font-medium">{nudge.activity.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {nudge.message}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteNudge(nudge.id)}
                        className="text-gray-400 hover:text-red-500 ml-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {format(new Date(nudge.scheduled_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      {!nudge.sent && (
                        <button
                          onClick={() => markNudgeAsSent(nudge.id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Mark as Done
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {nudges.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No reminders set. Add one to stay on track!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Habit Modal */}
        <Dialog
          open={showHabitModal}
          onClose={() => setShowHabitModal(false)}
          className="fixed inset-0 z-10 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

            <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-medium">
                  Create New Habit
                </Dialog.Title>
                <button
                  onClick={() => setShowHabitModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity
                  </label>
                  <select
                    value={newHabit.activity_id}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, activity_id: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select an activity</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Habit Title
                  </label>
                  <input
                    type="text"
                    value={newHabit.title}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Run 5km"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={newHabit.frequency}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newHabit.target_count}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, target_count: parseInt(e.target.value) }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowHabitModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createHabit}
                    disabled={!newHabit.activity_id || !newHabit.title}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create Habit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog>

        {/* Create Nudge Modal */}
        <Dialog
          open={showNudgeModal}
          onClose={() => setShowNudgeModal(false)}
          className="fixed inset-0 z-10 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

            <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-medium">
                  Create New Reminder
                </Dialog.Title>
                <button
                  onClick={() => setShowNudgeModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity
                  </label>
                  <select
                    value={newNudge.activity_id}
                    onChange={(e) => setNewNudge(prev => ({ ...prev, activity_id: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select an activity</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={newNudge.message}
                    onChange={(e) => setNewNudge(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter your reminder message"
                    rows={3}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule For
                  </label>
                  <input
                    type="datetime-local"
                    value={newNudge.scheduled_at}
                    onChange={(e) => setNewNudge(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowNudgeModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNudge}
                    disabled={!newNudge.activity_id || !newNudge.message || !newNudge.scheduled_at}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create Reminder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </PremiumFeature>
  );
}