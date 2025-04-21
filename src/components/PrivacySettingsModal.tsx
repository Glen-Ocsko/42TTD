import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Dialog } from '@headlessui/react';
import { Lock, Globe, Users, UserX, Loader2, AlertTriangle, X } from 'lucide-react';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacySettingsModal({ isOpen, onClose }: PrivacySettingsModalProps) {
  const { userId } = useCurrentUser();
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'friends' | 'private'>('public');
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      loadPrivacySettings();
    }
  }, [isOpen, userId]);

  const loadPrivacySettings = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('privacy_default')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setPrivacyLevel(data.privacy_default || 'public');
    } catch (err) {
      console.error('Error loading privacy settings:', err);
      setError('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    if (!userId) return;
    
    setSaving(true);
    setError('');
    
    try {
      // Update profile privacy setting
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ privacy_default: privacyLevel })
        .eq('id', userId);

      if (profileError) throw profileError;
      
      // If applying to existing content, update activity_posts and user_activities
      if (applyToExisting) {
        // Update activity posts
        const { error: postsError } = await supabase
          .from('activity_posts')
          .update({ visibility: privacyLevel === 'friends' ? 'friends' : (privacyLevel === 'private' ? 'private' : 'public') })
          .eq('user_id', userId);

        if (postsError) throw postsError;
        
        // Update user activities
        const { error: activitiesError } = await supabase
          .from('user_activities')
          .update({ privacy: privacyLevel === 'friends' ? 'friends' : (privacyLevel === 'private' ? 'private' : 'public') })
          .eq('user_id', userId);

        if (activitiesError) throw activitiesError;
      }
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Privacy settings updated successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      
      onClose();
    } catch (err) {
      console.error('Error saving privacy settings:', err);
      setError('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-bold flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              Privacy Settings
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who can see your profile and posts?
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={privacyLevel === 'public'}
                      onChange={() => setPrivacyLevel('public')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        Public
                      </div>
                      <div className="text-sm text-gray-500">Anyone can view your profile and posts</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="privacy"
                      value="friends"
                      checked={privacyLevel === 'friends'}
                      onChange={() => setPrivacyLevel('friends')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        Friends Only
                      </div>
                      <div className="text-sm text-gray-500">Only mutual followers can view your profile and posts</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="privacy"
                      value="private"
                      checked={privacyLevel === 'private'}
                      onChange={() => setPrivacyLevel('private')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <UserX className="h-4 w-4 text-gray-500" />
                        Private
                      </div>
                      <div className="text-sm text-gray-500">Only you can view your profile and posts</div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="applyToExisting"
                  checked={applyToExisting}
                  onChange={(e) => setApplyToExisting(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="applyToExisting" className="flex-1 text-sm text-blue-800">
                  Apply these privacy settings to all existing posts and activities
                </label>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={savePrivacySettings}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}