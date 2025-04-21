import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase } from '../lib/supabase';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';

export default function Start() {
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const [activityCount, setActivityCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserActivities();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadUserActivities = async () => {
    try {
      const { count, error } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      setActivityCount(count || 0);
    } catch (err) {
      console.error('Error loading activity count:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIntroText = () => {
    if (!userId) {
      return "Your journey starts here. Take a quick quiz or browse all activities to build your ultimate adventure list.";
    }
    if (activityCount === 0) {
      return "Ready to begin? Explore and add your first adventures.";
    }
    if (activityCount >= 42) {
      return "Keep it going — the next adventure is waiting!";
    }
    return "What's next? Add your next challenge and keep the adventure going.";
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
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-6">Choose Your Path</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {getIntroText()}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Quiz Card */}
          <button
            onClick={() => navigate('/quiz')}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {/* Background Image */}
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80"
              alt="Person looking at a map"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
            
            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-left text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-6 w-6" />
                <h3 className="text-2xl font-bold">Take the Quiz</h3>
              </div>
              <p className="text-lg text-white/90 mb-2">
                Let us help you discover new adventures.
              </p>
              <p className="text-sm text-white/75 mb-4">
                Answer a few quick questions and we'll suggest ideas you might not have thought about yet.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-white/90 group-hover:text-white">
                Start Quiz
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Browse Card */}
          <button
            onClick={() => navigate('/activities')}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {/* Background Image */}
            <img
              src="https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1200&q=80"
              alt="Various adventures collage"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
            
            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-left text-white">
              <div className="flex items-center gap-2 mb-2">
                <Compass className="h-6 w-6" />
                <h3 className="text-2xl font-bold">Explore All Activities</h3>
              </div>
              <p className="text-lg text-white/90 mb-2">
                Thousands of ideas — just one click away.
              </p>
              <p className="text-sm text-white/75 mb-4">
                Discover everything from daring feats to wholesome hobbies. Filter by what matters to you.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-white/90 group-hover:text-white">
                Browse Activities
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}