import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Image as ImageIcon, Loader2, AlertTriangle, Hash } from 'lucide-react';
import { supabase, safeUserQuery } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import EmojiPicker from 'emoji-picker-react';

interface Activity {
  id: string;
  title: string;
  is_custom?: boolean;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  onPostCreated: () => void;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  activity,
  onPostCreated
}: CreatePostModalProps) {
  const { userId, isDemoMode } = useCurrentUser();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'in_progress' | 'completed'>('in_progress');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    if (userId && !isDemoMode) {
      checkSuspensionStatus();
    }
  }, [userId, isDemoMode]);

  const checkSuspensionStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('is_user_suspended', { user_id: userId });
      
      if (error) throw error;
      setIsSuspended(data || false);
    } catch (err) {
      console.error('Error checking suspension status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Check if user is suspended
    if (isSuspended) {
      setError('Your account is currently suspended. You cannot create new posts.');
      setSubmitting(false);
      return;
    }

    try {
      if (!content.trim()) {
        throw new Error('Please enter some content for your post');
      }

      const effectiveUserId = isDemoMode ? '00000000-0000-0000-0000-000000000000' : userId;
      
      if (!effectiveUserId) {
        throw new Error('You must be logged in to create a post');
      }

      // Add hashtags to content if they're not already included
      let finalContent = content;
      hashtags.forEach(tag => {
        if (!finalContent.includes(`#${tag}`)) {
          finalContent += ` #${tag}`;
        }
      });

      await safeUserQuery(
        async (uid) => {
          const postData = {
            user_id: uid,
            content: finalContent.trim(),
            image_url: imageUrl.trim() || null,
            status,
            visibility: 'public',
            ...(activity.is_custom
              ? { custom_activity_id: activity.id }
              : { activity_id: activity.id })
          };

          const { error: submitError } = await supabase
            .from('activity_posts')
            .insert(postData);

          if (submitError) throw submitError;
        },
        effectiveUserId
      );

      onPostCreated();
      onClose();
      setContent('');
      setImageUrl('');
      setStatus('in_progress');
      setHashtags([]);
      setNewHashtag('');
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setContent(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const addHashtag = () => {
    if (!newHashtag.trim()) return;
    
    // Remove any # at the beginning and spaces
    const cleanedTag = newHashtag.trim().replace(/^#/, '');
    
    if (cleanedTag && !hashtags.includes(cleanedTag)) {
      setHashtags([...hashtags, cleanedTag]);
      setNewHashtag('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-xl max-w-lg w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium">
              Share Your Experience
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isSuspended ? (
            <div className="bg-orange-50 p-4 rounded-lg text-orange-700 mb-4">
              <h3 className="font-medium mb-2">Account Suspended</h3>
              <p>Your account is currently suspended. You cannot create new posts until the suspension is lifted.</p>
              <p className="mt-2 text-sm">
                If you believe this is an error, you can appeal this decision from your profile page.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'in_progress' | 'completed')}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Update
                </label>
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Share your experience..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600"
                  >
                    😊
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute right-0 bottom-12 z-10">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {500 - content.length} characters remaining
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Hashtags
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={newHashtag}
                      onChange={(e) => setNewHashtag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addHashtag();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add a hashtag"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addHashtag}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {hashtags.map(tag => (
                      <div 
                        key={tag} 
                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeHashtag(tag)}
                          className="text-blue-700 hover:text-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Hashtags help others discover your post. You can also type # directly in your post.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (optional)
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Update'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Dialog>
  );
}