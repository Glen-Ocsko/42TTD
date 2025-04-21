import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { supabase } from '../lib/supabase';
import ProfileForm from '../components/ProfileForm';
import { Loader2 } from 'lucide-react';

export default function Onboarding() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    if (user) {
      checkOnboardingStatus();
    } else {
      setLoading(false);
    }
  }, [user, isDemoMode]);

  const checkOnboardingStatus = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user?.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data?.onboarding_completed) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check onboarding status');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    navigate('/community');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-md">
          <p className="font-medium">Error loading profile</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-center mb-8">Complete Your Profile</h1>
          <ProfileForm onComplete={handleOnboardingComplete} />
        </div>
      </div>
    </div>
  );
}