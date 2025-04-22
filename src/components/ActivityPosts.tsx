import React, { useState, useEffect } from 'react';
import { supabase, safeUserQuery } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Plus, Loader2, Filter, Tag } from 'lucide-react';
import ActivityPost from './ActivityPost';
import CreatePostModal from './CreatePostModal';
import AdPlaceholder from './AdPlaceholder';

interface Activity {
  id: string;
  title: string;
  display_title?: string;
  is_custom?: boolean;
}

interface ActivityPostsProps {
  activity: Activity;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
  activity: {
    id: string;
    title: string;
    category_tags?: string[];
  };
  user: {
    username: string;
    avatar_url: string | null;
  };
}

export default function ActivityPosts({ activity }: ActivityPostsProps) {
  const { userId, isDemoMode } = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    loadPosts();
  }, [activity.id, selectedStatus, selectedCategories]);

  const loadPosts = async () => {
    try {
      let query = supabase
        .from('activity_posts')
        .select(`
          id,
          content,
          image_url,
          status,
          created_at,
          activity:activities!activity_posts_activity_id_fkey (
            id,
            title,
            display_title
          ),
          profiles!activity_posts_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      // Add activity filter if viewing specific activity
      if (activity.id) {
        query = query.eq(
          activity.is_custom ? 'custom_activity_id' : 'activity_id',
          activity.id
        );
      }

      // Add status filter if selected
      if (selectedStatus.length > 0) {
        query = query.in('status', selectedStatus);
      }

      // Add category filter if selected
      if (selectedCategories.length > 0) {
        query = query.filter('activity.category_tags', 'cs', `{${selectedCategories.join(',')}}`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform and filter out posts with missing relations
      const transformedPosts = data
        ?.filter(post => post.activity && post.profiles)
        .map(post => ({
          ...post,
          activity: post.activity,
          user: post.profiles
        })) || [];

      setPosts(transformedPosts);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const allCategories = Array.from(
    new Set(
      posts.flatMap(post => post.activity.category_tags || [])
    )
  ).sort();

  return (
    <div>
      {/* Filters */}
      {!activity.id && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {['in_progress', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedStatus.includes(status)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'in_progress' ? 'In Progress' : 'Completed'}
                </button>
              ))}
            </div>

            {allCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Post Button */}
      {(userId || isDemoMode) && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-6"
        >
          <Plus className="h-5 w-5" />
          Share Update
        </button>
      )}

      {error && (
        <div className="text-red-600 bg-red-50 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post, index) => (
          <React.Fragment key={post.id}>
            <ActivityPost key={post.id} post={post} onUpdate={loadPosts} />
            
            {/* Insert ad after every 5 posts */}
            {(index + 1) % 5 === 0 && index < posts.length - 1 && (
              <AdPlaceholder 
                activityTags={post.activity.category_tags || []}
                compact={true}
              />
            )}
          </React.Fragment>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No posts yet — why not be the first to share?
          </div>
        )}
      </div>

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        activity={activity}
        onPostCreated={loadPosts}
      />
    </div>
  );
}