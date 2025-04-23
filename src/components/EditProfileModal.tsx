import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Dialog } from '@headlessui/react';
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
  Edit3,
  CheckCircle2
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
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
  'Volunteering',
  'Sports',
  'Arts',
  'Learning',
  'Photography',
  'Fitness'
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

const GENDERS = [
  'male',
  'female',
  'non_binary',
  'prefer_not_to_say'
];

export default function EditProfileModal({ isOpen, onClose, onSuccess, initialData }: EditProfileModalProps) {
  const { userId } = useCurrentUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    full_name: '',
    username: '',
    age: '',
    location: '',
    avatar_url: '',
    profile_bio: '',
    interests: [] as string[],
    hobbies: '',
    health_considerations: [] as string[],
    notification_preferences: {
      push: true,
      email: true
    },
    privacy_default: 'public' as 'public' | 'friends' | 'private',
    gender: '' as 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | '',
    occupation: '',
    ethnicity: '',
    education_level: '',
    income_bracket: '',
    faith_or_belief: ''
  });

  useEffect(() => {
    if (initialData) {
      // Split full name into first and last name if they don't exist
      let firstName = '';
      let lastName = '';
      
      if (initialData.full_name) {
        const nameParts = initialData.full_name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      setFormData({
        ...initialData,
        first_name: initialData.first_name || firstName,
        last_name: initialData.last_name || lastName,
        age: initialData.age?.toString() || '',
        interests: initialData.interests || [],
        health_considerations: initialData.health_considerations || [],
        notification_preferences: initialData.notification_preferences || {
          push: true,
          email: true
        },
        hobbies: initialData.hobbies || '',
        gender: initialData.gender || '',
        occupation: initialData.occupation || '',
        ethnicity: initialData.ethnicity || '',
        education_level: initialData.education_level || '',
        income_bracket: initialData.income_bracket || '',
        faith_or_belief: initialData.faith_or_belief || ''
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.startsWith('notification_')) {
      const key = name.replace('notification_', '');
      setFormData(prev => ({
        ...prev,
        notification_preferences: {
          ...prev.notification_preferences,
          [key]: checked
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `avatars/${userId}/${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setSaving(true);
    setError('');
    
    try {
      // Combine first and last name into full_name
      const full_name = `${formData.first_name} ${formData.last_name}`.trim();
      
      const profileData = {
        ...formData,
        full_name,
        age: formData.age ? parseInt(formData.age) : null,
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      setSuccess(true);
      
      // Show success message and close modal
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSave();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex justify-center mb-6">
        <div className="flex space-x-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full ${
                currentStep === index + 1
                  ? 'bg-blue-600'
                  : currentStep > index + 1
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => !saving && onClose()}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Profile Updated!</h3>
              <p className="text-gray-600">Your profile has been successfully updated.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-xl font-bold">
                  {currentStep === 1 && "Basic Information"}
                  {currentStep === 2 && "Bio & Interests"}
                  {currentStep === 3 && "Health & Preferences"}
                  {currentStep === 4 && "Additional Information"}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                  disabled={saving}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {renderStepIndicator()}

              {error && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="max-h-[60vh] overflow-y-auto pr-2">
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Picture
                      </label>
                      <div className="flex items-center gap-4">
                        {formData.avatar_url ? (
                          <img
                            src={formData.avatar_url}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 w-full"
                          >
                            <Upload className="h-4 w-4" />
                            <span>Upload Image</span>
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/*"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG or GIF, max 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                        Age
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          id="age"
                          name="age"
                          min="13"
                          max="120"
                          value={formData.age}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Bio & Interests */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="profile_bio" className="block text-sm font-medium text-gray-700 mb-1">
                        Bio (max 200 characters)
                      </label>
                      <div className="relative">
                        <Edit3 className="absolute left-3 top-3 text-gray-400" />
                        <textarea
                          id="profile_bio"
                          name="profile_bio"
                          value={formData.profile_bio}
                          onChange={(e) => {
                            if (e.target.value.length <= 200) {
                              setFormData(prev => ({ ...prev, profile_bio: e.target.value }));
                            }
                          }}
                          rows={4}
                          className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell us about yourself..."
                        />
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          {formData.profile_bio?.length || 0}/200 characters
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interests
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
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
                      <label htmlFor="hobbies" className="block text-sm font-medium text-gray-700 mb-1">
                        Hobbies
                      </label>
                      <textarea
                        id="hobbies"
                        name="hobbies"
                        value={formData.hobbies}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="What do you enjoy doing in your free time?"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Health & Preferences */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Health Considerations
                      </label>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Privacy Settings
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="privacy_default"
                            value="public"
                            checked={formData.privacy_default === 'public'}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div>
                            <div className="font-medium">Public</div>
                            <div className="text-sm text-gray-500">Everyone can see your profile and posts</div>
                          </div>
                        </label>
                        
                        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="privacy_default"
                            value="friends"
                            checked={formData.privacy_default === 'friends'}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div>
                            <div className="font-medium">Friends Only</div>
                            <div className="text-sm text-gray-500">Only mutual followers can see your profile and posts</div>
                          </div>
                        </label>
                        
                        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="privacy_default"
                            value="private"
                            checked={formData.privacy_default === 'private'}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div>
                            <div className="font-medium">Private</div>
                            <div className="text-sm text-gray-500">Only you can see your profile and posts</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notification Preferences
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            name="notification_push"
                            checked={formData.notification_preferences.push}
                            onChange={handleCheckboxChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium">Push Notifications</div>
                            <div className="text-xs text-gray-500">Receive notifications on your device</div>
                          </div>
                        </label>
                        
                        <label className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            name="notification_email"
                            checked={formData.notification_preferences.email}
                            onChange={handleCheckboxChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium">Email Notifications</div>
                            <div className="text-xs text-gray-500">Receive updates via email</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Extra Demographics */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                      These optional fields help us personalize your experience. Your privacy is important to us.
                    </p>

                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                        Occupation
                      </label>
                      <input
                        type="text"
                        id="occupation"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="What do you do?"
                      />
                    </div>

                    <div>
                      <label htmlFor="ethnicity" className="block text-sm font-medium text-gray-700 mb-1">
                        Ethnicity
                      </label>
                      <input
                        type="text"
                        id="ethnicity"
                        name="ethnicity"
                        value={formData.ethnicity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label htmlFor="education_level" className="block text-sm font-medium text-gray-700 mb-1">
                        Education Level
                      </label>
                      <select
                        id="education_level"
                        name="education_level"
                        value={formData.education_level}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select an option</option>
                        <option value="high_school">High School</option>
                        <option value="college">College/University</option>
                        <option value="graduate">Graduate Degree</option>
                        <option value="doctorate">Doctorate</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="income_bracket" className="block text-sm font-medium text-gray-700 mb-1">
                        Income Bracket
                      </label>
                      <select
                        id="income_bracket"
                        name="income_bracket"
                        value={formData.income_bracket}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Prefer not to say</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="faith_or_belief" className="block text-sm font-medium text-gray-700 mb-1">
                        Faith or Belief
                      </label>
                      <input
                        type="text"
                        id="faith_or_belief"
                        name="faith_or_belief"
                        value={formData.faith_or_belief}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-6">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Back
                  </button>
                ) : (
                  <div></div> // Empty div to maintain layout
                )}

                <button
                  type="button"
                  onClick={currentStep < totalSteps ? nextStep : handleSave}
                  disabled={saving || (currentStep === 1 && !formData.username)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : currentStep < totalSteps ? (
                    <>
                      Next
                      <ChevronRight className="h-5 w-5" />
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}