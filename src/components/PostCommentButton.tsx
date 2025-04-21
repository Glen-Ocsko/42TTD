import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { MessageSquare, X, Send, Smile, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Comment } from '../types/social';
import { Dialog } from '@headlessui/react';
import EmojiPicker from 'emoji-picker-react';

interface PostCommentButtonProps {
  postId: string;
  initialCount?: number;
  onCommentAdded?: (comment: Comment) => void;
  className?: string;
  showCount?: boolean;
}

export default function PostCommentButton({
  postId,
  initialCount = 0,
  onCommentAdded,
  className = '',
  showCount = true
}: PostCommentButtonProps) {
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [count, setCount] = useState(initialCount);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');
  const [gifUrl, setGifUrl] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }
    
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!comment.trim() && !gifUrl) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const { data, error: submitError } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: comment.trim(),
          gif_url: gifUrl || null,
          created_at: new Date().toISOString()
        })
        .select(`
          id,
          post_id,
          user_id,
          content,
          gif_url,
          emoji_reactions,
          created_at,
          updated_at,
          profiles!post_comments_user_id_fkey (
            username,
            avatar_url,
            full_name
          )
        `);

      if (submitError) throw submitError;

      if (data && data.length > 0) {
        const newComment = {
          ...data[0],
          user: {
            username: data[0].profiles.username,
            avatar_url: data[0].profiles.avatar_url,
            full_name: data[0].profiles.full_name
          }
        };
        
        setCount(prev => prev + 1);
        
        if (onCommentAdded) {
          onCommentAdded(newComment);
        }
        
        setShowModal(false);
        setComment('');
        setGifUrl('');
        setShowEmojiPicker(false);
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setComment(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1 text-gray-500 hover:text-gray-700 ${className}`}
      >
        <MessageSquare className="h-5 w-5" />
        {showCount && <span>{count}</span>}
      </button>

      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-medium">
                Add a Comment
              </Dialog.Title>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your comment..."
                  rows={4}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute right-2 bottom-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Simple implementation - in a real app, you'd use a GIF picker API
                      const url = prompt('Enter GIF URL:');
                      if (url) setGifUrl(url);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                </div>
                {showEmojiPicker && (
                  <div className="absolute right-0 mt-1 z-10">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>

              {gifUrl && (
                <div className="relative inline-block">
                  <img src={gifUrl} alt="Selected GIF" className="h-20 rounded" />
                  <button
                    onClick={() => setGifUrl('')}
                    className="absolute top-1 right-1 bg-gray-800/70 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {error && (
                <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || (!comment.trim() && !gifUrl)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Comment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}