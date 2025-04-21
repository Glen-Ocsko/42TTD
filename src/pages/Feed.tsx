import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  Flag,
  MessageCircle,
  Image as ImageIcon,
  AlertTriangle,
  X,
  User,
  Loader2
} from 'lucide-react';
import { Dialog } from '@headlessui/react';

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  created_at: string;
  likes: number;
  user_liked: boolean;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
  activity: {
    title: string;
  };
}

const FLAG_REASONS = [
  'Inappropriate content',
  'Spam',
  'Harassment',
  'False information',
  'Other',
];

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80';

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activityId } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPost, setNewPost] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');

  useEffect(() => {
    loadPosts();
  }, [activityId]);

  const loadPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          media_url,
          created_at,
          user:profiles!posts_user_id_fkey (
            full_name,
            avatar_url
          ),
          activity:activities!posts_activity_id_fkey (
            title
          ),
          likes:likes (count),
          user_liked:likes!inner (id)
        `)
        .order('created_at', { ascending: false });

      if (activityId) {
        query = query.eq('activity_id', activityId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedPosts = data?.map(post => ({
        ...post,
        likes: post.likes[0]?.count || 0,
        user_liked: post.user_liked?.length > 0,
        user: {
          full_name: post.user?.full_name || 'Unknown User',
          avatar_url: post.user?.avatar_url || DEFAULT_AVATAR,
        },
        activity: {
          title: post.activity?.title || 'Unknown Activity',
        },
      }));

      setPosts(formattedPosts || []);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          activity_id: activityId,
          content: newPost.trim(),
          media_url: mediaUrl.trim() || null,
        });

      if (postError) throw postError;

      setNewPost('');
      setMediaUrl('');
      await loadPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.user_liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });
      }

      await loadPosts();
    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to update like');
    }
  };

  const handleFlag = async () => {
    if (!user || !selectedPost || !flagReason) return;

    try {
      const { error: flagError } = await supabase
        .from('flags')
        .insert({
          post_id: selectedPost,
          user_id: user.id,
          reason: flagReason,
        });

      if (flagError) throw flagError;

      setShowFlagModal(false);
      setSelectedPost(null);
      setFlagReason('');
    } catch (err) {
      console.error('Error flagging post:', err);
      setError('Failed to flag post');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {activityId ? 'Activity Discussion' : 'Community Feed'}
      </h1>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Create Post Form */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
        <form onSubmit={handleCreatePost}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder={user ? "What's on your mind?" : "Sign in to post"}
            className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={!user}
          />
          <div className="flex items-center gap-3 mb-3">
            <ImageIcon className="h-5 w-5 text-gray-400" />
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Add image URL (optional)"
              className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!user}
            />
          </div>
          <button
            type="submit"
            disabled={!user || !newPost.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {user ? 'Post' : 'Sign in to Post'}
          </button>
        </form>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {post.user.avatar_url ? (
                  <img
                    src={post.user.avatar_url}
                    alt={post.user.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{post.user.full_name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedPost(post.id);
                  setShowFlagModal(true);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Flag className="h-5 w-5" />
              </button>
            </div>

            {post.activity && (
              <div className="mb-3 text-sm text-blue-600">
                Re: {post.activity.title}
              </div>
            )}

            <p className="mb-4 whitespace-pre-wrap">{post.content}</p>

            {post.media_url && (
              <img
                src={post.media_url}
                alt="Post media"
                className="rounded-lg mb-4 max-h-96 w-full object-cover"
              />
            )}

            <div className="flex items-center gap-6 text-sm">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1 ${
                  post.user_liked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Heart
                  className={`h-5 w-5 ${post.user_liked ? 'fill-current' : ''}`}
                />
                {post.likes}
              </button>
              <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                <MessageCircle className="h-5 w-5" />
                Reply
              </button>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No posts yet. Be the first to share!
          </div>
        )}
      </div>

      {/* Flag Modal */}
      <Dialog
        open={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-medium">
                Report Post
              </Dialog.Title>
              <button
                onClick={() => setShowFlagModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm">
                  Help us maintain a respectful community by reporting inappropriate content.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for reporting
                </label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a reason</option>
                  {FLAG_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowFlagModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFlag}
                  disabled={!flagReason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Report Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}