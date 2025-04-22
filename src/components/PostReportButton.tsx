import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Flag, X, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Dialog } from '@headlessui/react';

interface PostReportButtonProps {
  postId: string;
  className?: string;
}

export default function PostReportButton({
  postId,
  className = ''
}: PostReportButtonProps) {
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }
    
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!reason) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const { error: submitError } = await supabase
        .from('post_reports')
        .insert({
          post_id: postId,
          user_id: userId,
          reason,
          extra_notes: notes || null,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (submitError) throw submitError;
      
      setSuccess(true);
      
      // Reset form and close modal after delay
      setTimeout(() => {
        setShowModal(false);
        setReason('');
        setNotes('');
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error reporting post:', err);
      setError('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`text-gray-400 hover:text-gray-600 ${className}`}
        title="Report Post"
      >
        <Flag className="h-5 w-5" />
      </button>

      <Dialog
        open={showModal}
        onClose={() => {
          if (!submitting && !success) {
            setShowModal(false);
            setReason('');
            setNotes('');
          }
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            {success ? (
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">Report Submitted</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Thanks for reporting this post. Our moderation team will review it shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-medium">
                    Report Post
                  </Dialog.Title>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">
                      Help us maintain a respectful community by reporting inappropriate content.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Why are you reporting this post?
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a reason</option>
                      <option value="Spam">Spam</option>
                      <option value="Abuse">Abuse</option>
                      <option value="Inappropriate Content">Inappropriate Content</option>
                      <option value="Off-topic">Off-topic</option>
                      <option value="Unofficial advertising">Unofficial advertising</option>
                      <option value="Something else">Something else</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional details (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide any additional information..."
                    />
                  </div>

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
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!reason || submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Submit Report'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}