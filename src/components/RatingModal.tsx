import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import {
  Star,
  DollarSign,
  Clock,
  Heart,
  Target,
  ChevronDown,
  ChevronUp,
  Zap,
  Palette,
  Dumbbell,
  BookOpen,
  Globe,
  Users,
  X,
  Loader2
} from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  status: 'started' | 'completed';
}

interface Rating {
  difficulty?: number;
  cost?: number;
  enjoyment?: number;
  time?: number;
  rating?: number;
  adventurousness?: number;
  creativity?: number;
  fitness?: number;
  learning?: number;
  impact?: number;
}

export default function RatingModal({ isOpen, onClose, activityId, status }: RatingModalProps) {
  const { userId, isDemoMode, user } = useCurrentUser();
  const [ratings, setRatings] = useState<Rating>({});
  const [showDetailed, setShowDetailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && activityId) {
      loadExistingRatings();
    }
  }, [isOpen, activityId]);

  const loadExistingRatings = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_activity_ratings')
        .select('*')
        .eq('user_id', isDemoMode ? '00000000-0000-0000-0000-000000000000' : userId)
        .eq('activity_id', activityId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (data) {
        setRatings(data);
      }
    } catch (err) {
      console.error('Error loading ratings:', err);
      setError('Failed to load existing ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activityId || !userId) return;

    try {
      setSaving(true);
      setError('');

      const ratingData = {
        activity_id: activityId,
        user_id: isDemoMode ? '00000000-0000-0000-0000-000000000000' : userId,
        status,
        ...ratings
      };

      let { error: upsertError } = await supabase
        .from('user_activity_ratings')
        .upsert(ratingData);

      // If the initial upsert fails and we're in demo mode, try with the demo user policy
      if (upsertError && isDemoMode) {
        const { error: demoUpsertError } = await supabase
          .from('user_activity_ratings')
          .insert([ratingData], { returning: 'minimal' });
          
        if (demoUpsertError) throw demoUpsertError;
      } else if (upsertError) {
        throw upsertError;
      }

      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Ratings saved successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      onClose();
    } catch (err) {
      console.error('Error saving ratings:', err);
      setError('Failed to save ratings');
    } finally {
      setSaving(false);
    }
  };

  const updateRating = (field: keyof Rating, value: number) => {
    setRatings(prev => ({ ...prev, [field]: value }));
  };

  const StarRating = ({ field, value }: { field: keyof Rating, value: number | undefined }) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => updateRating(field, star)}
          className="focus:outline-none"
          aria-label={`${star} out of 5 stars for ${field}`}
        >
          <Star
            className={`h-6 w-6 ${
              (value || 0) >= star
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Dialog
        open={isOpen}
        onClose={onClose}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-xl max-w-lg w-full mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold">
              Rate This Activity
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span>Overall Rating</span>
                </label>
                <StarRating field="rating" value={ratings.rating} />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-500" />
                  <span>Difficulty</span>
                </label>
                <StarRating field="difficulty" value={ratings.difficulty} />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <span>Cost</span>
                </label>
                <StarRating field="cost" value={ratings.cost} />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-gray-500" />
                  <span>Enjoyment</span>
                </label>
                <StarRating field="enjoyment" value={ratings.enjoyment} />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span>Time Required</span>
                </label>
                <StarRating field="time" value={ratings.time} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDetailed(!showDetailed)}
              className="w-full flex items-center justify-between py-2 text-gray-600 hover:text-gray-900"
              aria-expanded={showDetailed}
            >
              <span>Detailed Characteristics</span>
              {showDetailed ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {showDetailed && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-gray-500" />
                    <span>Adventurousness</span>
                  </label>
                  <StarRating field="adventurousness" value={ratings.adventurousness} />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-gray-500" />
                    <span>Creativity</span>
                  </label>
                  <StarRating field="creativity" value={ratings.creativity} />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-gray-500" />
                    <span>Fitness</span>
                  </label>
                  <StarRating field="fitness" value={ratings.fitness} />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-gray-500" />
                    <span>Learning</span>
                  </label>
                  <StarRating field="learning" value={ratings.learning} />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <span>Impact</span>
                  </label>
                  <StarRating field="impact" value={ratings.impact} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Ratings'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}