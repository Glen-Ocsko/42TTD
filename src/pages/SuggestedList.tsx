import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuiz } from '../contexts/QuizContext';
import { useDemo } from '../contexts/DemoContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import {
  Plus,
  MapPin,
  Star,
  ChevronRight,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  X,
  UserPlus,
} from 'lucide-react';
import { Dialog } from '@headlessui/react';

interface Activity {
  id: string;
  title: string;
  description: string | null;
  category_tags: string[];
  difficulty: number;
  is_location_specific: boolean;
  image_url: string | null;
  score: number;
}

interface QuizScores {
  risk_tolerance: number;
  adventure: number;
  creativity: number;
  sociability: number;
  travel: number;
  budget: number;
  time: number;
  accessibility: number;
}

const DIMENSION_MAPPING = {
  adventure: ['Adventure & Adrenaline', 'Outdoor Activities'],
  creativity: ['Creative Expression', 'Arts & Culture'],
  sociability: ['Community & Events', 'Social Impact'],
  travel: ['Travel & Exploration', 'Cultural Experience'],
  budget: ['Finance & Freedom', 'Investment'],
  time: ['Life Milestones', 'Career & Ambition'],
  accessibility: ['Health & Fitness', 'Personal Growth']
};

export default function SuggestedList() {
  const { user } = useAuth();
  const { scores } = useQuiz();
  const { isDemoMode } = useDemo();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [quizScores, setQuizScores] = useState<QuizScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Activity[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingList, setSavingList] = useState(false);

  if (!scores) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Please take the quiz first to get your personalized list</p>
          <button
            onClick={() => navigate('/quiz')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Target className="h-5 w-5" />
            Take the Quiz
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center p-8">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Your List is Ready!</h2>
          <p className="text-gray-600 mb-8">
            Create an account to save your personalized list of 42 activities and start tracking your progress!
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserPlus className="h-5 w-5" />
              Create Account
            </button>
            <button
              onClick={() => navigate('/activities')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <ChevronRight className="h-5 w-5" />
              Browse Activities
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (user && !isDemoMode) {
      loadQuizScores();
    } else if (isDemoMode && scores) {
      // In demo mode, use the scores directly without loading from database
      setQuizScores(scores);
      loadActivities(scores);
    }
  }, [user, isDemoMode, scores]);

  const loadQuizScores = async () => {
    try {
      const { data: scores, error: scoresError } = await supabase
        .from('user_quiz_scores')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (scoresError) throw scoresError;
      setQuizScores(scores);

      // Load and score activities based on quiz results
      await loadActivities(scores);
    } catch (err) {
      console.error('Error loading quiz scores:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async (scores: QuizScores) => {
    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Score and sort activities based on quiz results
      const scoredActivities = (activities || []).map(activity => ({
        ...activity,
        score: calculateActivityScore(activity, scores)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 42); // Get top 42 activities

      setActivities(scoredActivities);
      // Pre-select all recommended activities
      setSelectedActivities(scoredActivities.map(a => a.id));
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
    }
  };

  const calculateActivityScore = (activity: Activity, scores: QuizScores) => {
    let score = 0;
    let weightSum = 0;

    // Calculate weighted score based on matching categories
    Object.entries(DIMENSION_MAPPING).forEach(([dimension, tags]) => {
      const dimensionScore = scores[dimension as keyof QuizScores];
      const hasMatchingTags = tags.some(tag => 
        activity.category_tags?.includes(tag)
      );

      if (hasMatchingTags) {
        score += dimensionScore;
        weightSum += 100; // Max possible score
      }
    });

    // Normalize score to 0-100
    return weightSum > 0 ? (score / weightSum) * 100 : 0;
  };

  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      }
      if (prev.length >= 42) {
        return prev;
      }
      return [...prev, activityId];
    });
  };

  const searchActivities = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .ilike('title', `%${query}%`)
        .not('id', 'in', `(${activities.map(a => a.id).join(',')})`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching activities:', err);
    }
  };

  const handleConfirmList = async () => {
    if (selectedActivities.length !== 42) {
      setError('Please select exactly 42 activities');
      return;
    }

    setSavingList(true);
    try {
      // Skip database operations in demo mode
      if (!isDemoMode) {
        // Insert all selected activities into user_activities
        const activities = selectedActivities.map(activityId => ({
          user_id: user?.id,
          activity_id: activityId,
          status: 'not_started',
          progress: 0
        }));

        const { error } = await supabase
          .from('user_activities')
          .insert(activities);

        if (error) throw error;
      }

      setShowConfirmModal(true);
    } catch (err) {
      console.error('Error saving activity list:', err);
      setError('Failed to save your list');
    } finally {
      setSavingList(false);
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-4">Your 42 Things</h1>
            <p className="text-xl text-gray-600 mb-8">
              We've selected 42 activities based on your preferences. Review, customize, and confirm your list!
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="bg-white rounded-full px-6 py-3 shadow-sm">
                <span className="text-2xl font-bold text-blue-600">
                  {selectedActivities.length}
                </span>
                <span className="text-gray-600">/42 selected</span>
              </div>

              <button
                onClick={() => setShowSearchModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm hover:bg-gray-50"
              >
                <Search className="h-5 w-5 text-gray-400" />
                <span>Add Different Activities</span>
              </button>
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg mb-8">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
          </motion.div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-sm transition-all duration-200 ${
                selectedActivities.includes(activity.id)
                  ? 'ring-2 ring-blue-500'
                  : 'hover:shadow-md'
              }`}
            >
              {activity.image_url && (
                <img
                  src={activity.image_url}
                  alt={activity.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-semibold">{activity.title}</h2>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Target className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {Math.round(activity.score)}% match
                    </span>
                  </div>
                </div>

                {activity.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {activity.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {activity.category_tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {activity.is_location_specific && (
                  <div className="flex items-center gap-1 text-gray-500 mb-3">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Location-specific</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-600">Difficulty:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (activity.difficulty || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => toggleActivity(activity.id)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    selectedActivities.includes(activity.id)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {selectedActivities.includes(activity.id) ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Selected
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Select
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={handleConfirmList}
            disabled={selectedActivities.length !== 42 || savingList}
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingList ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            {selectedActivities.length === 42
              ? "Lock In My 42 Things!"
              : `Select ${42 - selectedActivities.length} More`}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search Modal */}
      <Dialog
        open={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-medium">
                Add Different Activities
              </Dialog.Title>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchActivities(e.target.value);
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {searchResults.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => toggleActivity(activity.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{activity.title}</h3>
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                    </div>
                    {selectedActivities.includes(activity.id) ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Plus className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog
        open={showConfirmModal}
        onClose={() => {}}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6 text-center">
            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <Dialog.Title className="text-xl font-bold mb-2">
              Your 42 Things Are Set!
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              Your personalized bucket list has been created. Ready to start your journey?
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              View My Dashboard
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}