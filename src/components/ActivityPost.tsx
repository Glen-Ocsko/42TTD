import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Post, Comment } from '../types/social';
import { 
  User, 
  Clock, 
  CheckCircle2, 
  Target, 
  Heart, 
  MessageSquare, 
  MoreVertical,
  Flag,
  X,
  Send,
  Smile,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { Dialog } from '@headlessui/react';
import EmojiPicker from 'emoji-picker-react';
import RestrictedContent from './RestrictedContent';

interface ActivityPostProps {
  post: Post;
  onUpdate?: () => void;
}

export default function ActivityPost({ post, onUpdate }: ActivityPostProps) {
  const navigate = useNavigate();
  const { userId, isAuthenticated } = useCurrentUser();
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [gifUrl, setGifUrl] = useState('');
  const [error, setError] = useState('');
  const [canView, setCanView] = useState(true);

  useEffect(() => {
    // Check if the current user can view this post
    checkPostVisibility();
  }, [post.id, userId]);

  useEffect(() => {
    if (showComments && canView) {
      loadComments();
    }
  }, [showComments, canView]);

  const checkPostVisibility = async () => {
    // If the post is from the current user, they can always view it
    if (post.user_id === userId) {
      setCanView(true);
      return;
    }

    // Check post visibility
    try {
      const { data, error } = await supabase
        .from('activity_posts')
        .select('visibility')
        .eq('id', post.id)
        .single();

      if (error) {
        console.error('Error checking post visibility:', error);
        setCanView(false);
        return;
      }

      // If post is public, anyone can view
      if (data.visibility === 'public') {
        setCanView(true);
        return;
      }

      // If post is private, only the owner can view
      if (data.visibility === 'private') {
        setCanView(false);
        return;
      }

      // If post is friends-only, check if the user is a friend
      if (data.visibility === 'friends' && userId) {
        const { data: followData } = await supabase
          .rpc('get_follow_status', { 
            user_id: userId, 
            target_id: post.user_id 
          });
        
        setCanView(followData === 'friends');
      } else {
        setCanView(false);
      }
    } catch (err) {
      console.error('Error checking post visibility:', err);
      setCanView(false);
    }
  };

  const loadComments = async () => {
    try {
      setLoadingComments(true);
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
        .eq('post_id', post.id)
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
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', userId);

        if (error) throw error;
        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: userId
          });

        if (error) throw error;
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleReport = async () => {
    if (!reportReason) return;

    try {
      setSubmittingReport(true);
      const { error } = await supabase
        .from('post_reports')
        .insert({
          post_id: post.id,
          user_id: userId,
          reason: reportReason,
          extra_notes: reportNotes || null
        });

      if (error) throw error;
      setReportSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setShowReportModal(false);
        setReportReason('');
        setReportNotes('');
        setReportSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error reporting post:', err);
      setError('Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() && !gifUrl) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

    try {
      setSubmittingComment(true);
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: userId,
          content: newComment.trim(),
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

      if (error) throw error;

      if (data && data.length > 0) {
        const newCommentObj = {
          ...data[0],
          user: {
            username: data[0].profiles.username,
            avatar_url: data[0].profiles.avatar_url,
            full_name: data[0].profiles.full_name
          }
        };
        
        setComments(prev => [...prev, newCommentObj]);
        setNewComment('');
        setGifUrl('');
        setShowEmojiPicker(false);
      }

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEmojiSelect = (emojiData: any) => {
    setNewComment(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const getStatusBadge = () => {
    switch (post.status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed</span>
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            <Clock className="h-4 w-4" />
            <span>In Progress</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            <Target className="h-4 w-4" />
            <span>Not Started</span>
          </div>
        );
    }
  };

  // Function to render content with clickable hashtags
  const renderContentWithHashtags = (content: string) => {
    // Regular expression to match hashtags
    const hashtagRegex = /#(\w+)/g;
    
    // Split content by hashtags
    const parts = content.split(hashtagRegex);
    
    return parts.map((part, index) => {
      // Even indices are regular text, odd indices are hashtags
      if (index % 2 === 1) {
        return (
          <Link 
            key={index} 
            to={`/community?hashtag=${part}`}
            className="text-blue-600 hover:underline"
          >
            #{part}
          </Link>
        );
      }
      return part;
    });
  };

  if (!canView) {
    return <RestrictedContent message="This post is private or restricted to friends only" showBackButton={false} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Link to={`/users/${post.user.username}`} className="flex items-center gap-3">
            {post.user.avatar_url ? (
              <img
                src={post.user.avatar_url}
                alt={post.user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-medium">{post.user.username}</h3>
              <p className="text-sm text-gray-500">
                {format(new Date(post.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  >
                    <Flag className="h-4 w-4" />
                    Report Post
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-sm text-blue-600 mb-3">
          Re: {post.activity?.title}
        </div>

        <p className="text-gray-700 whitespace-pre-wrap mb-3">
          {renderContentWithHashtags(post.content)}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mt-4">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm ${liked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
            <span>{likesCount}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <MessageSquare className="h-5 w-5" />
            <span>{comments.length || post.comments_count || 0}</span>
          </button>
        </div>
      </div>

      {/* Image */}
      {post.media_url && (
        <img
          src={post.media_url}
          alt="Post media"
          className="w-full h-64 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://source.unsplash.com/random/800x600/?activity';
          }}
        />
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="p-4 bg-gray-50 border-t">
          <h4 className="font-medium mb-4">Comments</h4>
          
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4 mb-4">
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
                        to={`/users/${comment.user.username}`}
                        className="font-medium text-sm hover:text-blue-600"
                      >
                        {comment.user.username}
                      </Link>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </span>
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
          ) : (
            <div className="text-center py-4 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}

          {/* Comment Input */}
          {isAuthenticated ? (
            <div className="mt-4">
              <div className="flex gap-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
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
                        const gifUrl = prompt('Enter GIF URL:');
                        if (gifUrl) setGifUrl(gifUrl);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                  </div>
                  {showEmojiPicker && (
                    <div className="absolute right-0 mt-1 z-10">
                      <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSubmitComment}
                  disabled={submittingComment || (!newComment.trim() && !gifUrl)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
                >
                  {submittingComment ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              {gifUrl && (
                <div className="mt-2 relative inline-block">
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
                <div className="mt-2 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 text-center">
              <Link 
                to="/login" 
                className="text-blue-600 hover:underline"
                state={{ returnTo: window.location.pathname }}
              >
                Sign in to comment
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Report Modal */}
      <Dialog
        open={showReportModal}
        onClose={() => {
          if (!submittingReport && !reportSuccess) {
            setShowReportModal(false);
            setReportReason('');
            setReportNotes('');
          }
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            {reportSuccess ? (
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
                <Dialog.Title className="text-lg font-medium mb-4">
                  Report Post
                </Dialog.Title>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Why are you reporting this post?
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
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
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      rows={3}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide any additional information..."
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReportModal(false);
                        setReportReason('');
                        setReportNotes('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      disabled={submittingReport}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReport}
                      disabled={!reportReason || submittingReport}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submittingReport ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Submitting...
                        </div>
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
    </div>
  );
}