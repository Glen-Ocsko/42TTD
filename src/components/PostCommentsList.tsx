import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Comment } from '../types/social';
import { User, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';

interface PostCommentsListProps {
  postId: string;
  onCommentAdded?: (comment: Comment) => void;
}

export default function PostCommentsList({
  postId,
  onCommentAdded
}: PostCommentsListProps) {
  const { userId } = useCurrentUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('post_comments')
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
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedComments = data?.map(comment => ({
        ...comment,
        user: {
          username: comment.profiles.username,
          avatar_url: comment.profiles.avatar_url,
          full_name: comment.profiles.full_name
        }
      })) || [];

      setComments(transformedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
      
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <div key={comment.id} className="flex gap-3">
          <div className="flex-shrink-0">
            {comment.user.avatar_url ? (
              <img
                src={comment.user.avatar_url}
                alt={comment.user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <Link 
                to={`/profile/${comment.user?.username || 'unknown'}`}
                className="font-medium text-sm hover:text-blue-600"
              >
                {comment.user?.username || 'Unknown User'}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                </span>
                {comment.user_id === userId && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-700">{comment.content}</p>
            {comment.gif_url && (
              <img 
                src={comment.gif_url} 
                alt="GIF" 
                className="mt-2 max-h-32 rounded"
              />
            )}
            {comment.emoji_reactions && comment.emoji_reactions.length > 0 && (
              <div className="flex gap-1 mt-2">
                {comment.emoji_reactions.map((emoji, index) => (
                  <span key={index} className="text-sm">{emoji}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}