import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import {
  User,
  MapPin,
  Calendar,
  Heart,
  Bell,
  Mail,
  Lock,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  X,
  Upload,
  Edit3
} from 'lucide-react';

interface ProfileFormProps {
  onComplete?: () => void;
  isEditing?: boolean;
}

const INTERESTS = [
  'Travel',
  'Adventure',
  'Food',
  'Creativity',
  'Community',
  'Health',
  'Music',
  'Tech',
  'Nature',
  'Volunteering'
];

const HEALTH_CONSIDERATIONS = [
  'Limited mobility',
  'Chronic fatigue',
  'Heart condition',
  'Mental health support',
  'Sensory sensitivity',
  'Allergies',
  'Visual impairment',
  'Hearing impairment',
  'None'
];

export default function ProfileForm({ onComplete, isEditing = false }: ProfileFormProps) {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    age: '',
    location: '',
    avatar_url: '',
    interests: [] as string[],
    hobbies: '',
    health_considerations: [] as string[],
    notification_preferences: {
      push: true,
      email: true
    },
    privacy_default: 'public' as 'public' | 'friends' | 'private',
    onboarding_completed: false,
    profile_bio: ''
  });

  useEffect(() => {
    if (isEditing) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [isEditing]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          ...data,
          age: data.age?.toString() || '',
          interests: data.interests || [],
          health_considerations: data.health_considerations || [],
          notification_preferences: data.notification_preferences || {
            push: true,
            email: true
          },
          hobbies: data.hobbies || '',
          profile_bio: data.profile_bio || ''
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id && !isDemoMode) return;

    setSaving(true);
    setError('');

    try {
      const profileData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        updated_at: new Date().toISOString(),
        onboarding_completed: true
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: isDemoMode ? '00000000-0000-0000-0000-000000000000' : user?.id,
          ...profileData
        });

      if (upsertError) throw upsertError;

      if (onComplete) {
        onComplete();
      } else if (!isEditing) {
        navigate('/community');
      }

      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Profile saved successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSave();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-1/5 h-2 rounded-full ${
                step <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Basic Info</span>
          <span>Bio</span>
          <span>Interests</span>
          <span>Health</span>
          <span>Settings</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Tell us about yourself</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age (optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="13"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City, Country"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avatar URL (optional)
            </label>
            <div className="relative">
              <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Bio */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Tell us more about yourself</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio (max 200 characters)
            </label>
            <div className="relative">
              <Edit3 className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={formData.profile_bio}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setFormData(prev => ({ ...prev, profile_bio: e.target.value }));
                  }
                }}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Share a bit about yourself..."
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {formData.profile_bio?.length || 0}/200 characters
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Interests */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">What interests you?</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select your interests
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INTERESTS.map((interest) => (
                <label key={interest} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.interests.includes(interest)}
                    onChange={(e) => {
                      const newInterests = e.target.checked
                        ? [...formData.interests, interest]
                        : formData.interests.filter(i => i !== interest);
                      setFormData(prev => ({ ...prev, interests: newInterests }));
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{interest}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hobbies (optional)
            </label>
            <textarea
              value={formData.hobbies}
              onChange={(e) => setFormData(prev => ({ ...prev, hobbies: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Tell us about your hobbies..."
            />
          </div>
        </div>
      )}

      {/* Step 4: Health */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Health Considerations</h2>
          
          <p className="text-gray-600">
            Optional. This helps us avoid suggesting activities that may be difficult for you — but it's totally up to you.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🩺 Are there any health considerations we should be aware of when suggesting activities?
            </label>
            <div className="space-y-2">
              {HEALTH_CONSIDERATIONS.map((consideration) => (
                <label key={consideration} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.health_considerations.includes(consideration)}
                    onChange={(e) => {
                      let newConsiderations;
                      if (consideration === 'None') {
                        newConsiderations = e.target.checked ? ['None'] : [];
                      } else {
                        newConsiderations = e.target.checked
                          ? [...formData.health_considerations.filter(c => c !== 'None'), consideration]
                          : formData.health_considerations.filter(c => c !== consideration);
                      }
                      setFormData(prev => ({ ...prev, health_considerations: newConsiderations }));
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{consideration}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Settings */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Privacy & Notifications</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Privacy
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={formData.privacy_default === 'public'}
                    onChange={() => setFormData(prev => ({ ...prev, privacy_default: 'public' }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-gray-500">Anyone can view your profile and posts</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="friends"
                    checked={formData.privacy_default === 'friends'}
                    onChange={() => setFormData(prev => ({ ...prev, privacy_default: 'friends' }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <div className="font-medium">Friends Only</div>
                    <div className="text-sm text-gray-500">Only mutual followers can view your profile and posts</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={formData.privacy_default === 'private'}
                    onChange={() => setFormData(prev => ({ ...prev, privacy_default: 'private' }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-gray-500">Only you can view your profile and posts</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-400" />
                <span>Push Notifications</span>
              </div>
              <button
                onClick={() => setFormData(prev => ({
                  ...prev,
                  notification_preferences: {
                    ...prev.notification_preferences,
                    push: !prev.notification_preferences.push
                  }
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notification_preferences.push ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notification_preferences.push ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <span>Email Notifications</span>
              </div>
              <button
                onClick={() => setFormData(prev => ({
                  ...prev,
                  notification_preferences: {
                    ...prev.notification_preferences,
                    email: !prev.notification_preferences.email
                  }
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.notification_preferences.email ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notification_preferences.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        {currentStep > 1 && (
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
        )}

        <div className="flex gap-3 ml-auto">
          {currentStep < 5 && (
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Skip this step
            </button>
          )}

          {currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || !formData.full_name || !formData.username}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Complete Profile'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}