import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AppealFormProps {
  userId: string;
  actionId: string;
  postId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AppealForm({
  userId,
  actionId,
  postId,
  onSuccess,
  onCancel
}: AppealFormProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please provide a reason for your appeal');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error: submitError } = await supabase
        .from('moderation_appeals')
        .insert({
          user_id: userId,
          related_action_id: actionId || null,
          related_post_id: postId || null,
          message: message.trim(),
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      if (submitError) throw submitError;
      
      setSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error submitting appeal:', err);
      setError('Failed to submit appeal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="mt-3 text-lg font-medium text-gray-900">Appeal Submitted</h3>
        <p className="mt-2 text-sm text-gray-500">
          Your appeal has been submitted and will be reviewed by our moderation team.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Explain why you believe this action should be reconsidered
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Please provide details about why you think this decision should be reviewed..."
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Be specific and respectful. Appeals are reviewed by our moderation team.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Submit Appeal'
          )}
        </button>
      </div>
    </form>
  );
}