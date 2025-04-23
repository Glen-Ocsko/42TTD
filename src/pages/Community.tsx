import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { usePageState } from '../hooks/usePageState';
import { useDemo } from '../contexts/DemoContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Post, Hashtag, UserHashtag, FeedFilter, CustomActivity } from '../types/social';
import { 
  Users, 
  Globe, 
  Heart, 
  ArrowRight, 
  Target, 
  Star,
  User,
  Clock,
  CheckCircle2,
  Filter,
  Tag,
  Loader2,
  WifiOff,
  UserPlus,
  X,
  ChevronRight,
  Trophy,
  Flag,
  Sparkles,
  Bell,
  Hash,
  Plus,
  UserCheck,
  Users2
} from 'lucide-react';
import ActivityPost from '../components/ActivityPost';
import AdPlaceholder from '../components/AdPlaceholder';
import UserList from '../components/UserList';
import FollowRequestsModal from '../components/FollowRequestsModal';
import { UserProfile } from '../types/profile';
import { Dialog } from '@headlessui/react';

export default function Community() {
  const { isDemoMode } = useDemo();
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [pageState, updatePageState] = usePageState({
    activeFilter: 'all' as FeedFilter
  });
  const { activeFilter } = pageState;
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [followedHashtags, setFollowedHashtags] = useState<UserHashtag[]>([]);
  const [showHashtagsModal, setShowHashtagsModal] = useState(false);
  const [hashtagToFollow, setHashtagToFollow] = useState('');
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>([]);
  const [loadingCustomActivities, setLoadingCustomActivities] = useState(false);
  const [followingHashtag, setFollowingHashtag] = useState(false);

  // Get hashtag from URL if present
  const hashtagParam = searchParams.get('hashtag');

  const checkPendingRequests = async () => {
    if (!userId) return;
    
    try {
      const { data: requests, error } = await supabase
        .from('follows')
        .select('id')
        .eq('following_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingRequestsCount(requests?.length || 0);
    } catch (err) {
      console.error('Error checking pending requests:', err);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('activity_posts')
        .select(`
          *,
          profiles!activity_posts_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          activity:activity_id (*),
          custom_activity:custom_activity_id (*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;
      setPosts(postsData || []);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPostsByHashtag = async (hashtag: string) => {
    setLoading(true);
    setError('');
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('activity_posts')
        .select(`
          *,
          profiles!activity_posts_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          activity:activity_id (*),
          custom_activity:custom_activity_id (*)
        `)
        .contains('hashtags', [hashtag])
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;
      setPosts(postsData || []);
    } catch (err) {
      console.error('Error loading posts by hashtag:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredPosts = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('activity_posts')
        .select(`
          *,
          profiles!activity_posts_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          activity:activity_id (*),
          custom_activity:custom_activity_id (*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activeFilter === 'following') {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId)
          .eq('status', 'accepted');

        const followingIds = followingData?.map(f => f.following_id) || [];
        query = query.in('user_id', followingIds);
      } else if (activeFilter === 'friends') {
        const { data: friendsData } = await supabase
          .from('friendships')
          .select('friend_id')
          .eq('user_id', userId)
          .eq('status', 'accepted');

        const friendIds = friendsData?.map(f => f.friend_id) || [];
        query = query.in('user_id', friendIds);
      } else if (activeFilter === 'hashtags') {
        const { data: userHashtags } = await supabase
          .from('user_hashtags')
          .select('hashtag_id')
          .eq('user_id', userId);

        if (userHashtags && userHashtags.length > 0) {
          const hashtagIds = userHashtags.map(h => h.hashtag_id);
          const { data: hashtags } = await supabase
            .from('hashtags')
            .select('name')
            .in('id', hashtagIds);

          const hashtagNames = hashtags?.map(h => h.name) || [];
          query = query.overlaps('hashtags', hashtagNames);
        } else {
          setPosts([]);
          setLoading(false);
          return;
        }
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;
      setPosts(postsData || []);
    } catch (err) {
      console.error('Error loading filtered posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingHashtags = async () => {
    try {
      const { data: hashtags, error } = await supabase
        .from('hashtags')
        .select('*')
        .order('post_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTrendingHashtags(hashtags || []);
    } catch (err) {
      console.error('Error loading trending hashtags:', err);
    }
  };

  const loadFollowedHashtags = async () => {
    if (!userId) return;

    try {
      const { data: userHashtags, error } = await supabase
        .from('user_hashtags')
        .select(`
          *,
          hashtag:hashtag_id (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      setFollowedHashtags(userHashtags || []);
    } catch (err) {
      console.error('Error loading followed hashtags:', err);
    }
  };

  const loadCustomActivities = async () => {
    if (!userId) return;
    
    setLoadingCustomActivities(true);
    try {
      const { data: activities, error } = await supabase
        .from('custom_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomActivities(activities || []);
    } catch (err) {
      console.error('Error loading custom activities:', err);
    } finally {
      setLoadingCustomActivities(false);
    }
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  const handleFilterChange = (filter: FeedFilter) => {
    updatePageState({ activeFilter: filter });
  };

  useEffect(() => {
    if (hashtagParam) {
      loadPostsByHashtag(hashtagParam);
    } else {
      loadInitialData();
    }
    
    if (userId) {
      checkPendingRequests();
      loadFollowedHashtags();
      loadCustomActivities();
    }

    loadTrendingHashtags();
  }, [userId, hashtagParam]);

  useEffect(() => {
    if (activeFilter !== 'all' && !hashtagParam) {
      loadFilteredPosts();
    }
  }, [activeFilter]);

  return (
    <div className="min-h-screen">
      {/* Feed Filters */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-6">
        <button
          onClick={() => handleFilterChange('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Globe className="h-5 w-5" />
          All Posts
        </button>

        {isAuthenticated && (
          <>
            <button
              onClick={() => handleFilterChange('following')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                activeFilter === 'following'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="h-5 w-5" />
              Following
            </button>

            <button
              onClick={() => handleFilterChange('friends')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                activeFilter === 'friends'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users2 className="h-5 w-5" />
              Friends
            </button>

            <button
              onClick={() => handleFilterChange('hashtags')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                activeFilter === 'hashtags'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tag className="h-5 w-5" />
              My Hashtags
            </button>
          </>
        )}
      </div>

      {/* Feed Content */}
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <WifiOff className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadInitialData}
              className="mt-2 text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Posts Found</h3>
            <p className="text-gray-600">
              {hashtagParam
                ? `No posts found with hashtag #${hashtagParam}`
                : activeFilter === 'following'
                ? "You're not following anyone yet"
                : activeFilter === 'friends'
                ? "You don't have any friends yet"
                : activeFilter === 'hashtags'
                ? "You're not following any hashtags"
                : 'Be the first to share something!'}
            </p>
          </div>
        ) : (
          posts.map((post, index) => (
            <React.Fragment key={post.id}>
              <ActivityPost post={post} onUpdate={handlePostUpdate} />
              {/* Show ad placeholder every 5 posts */}
              {(index + 1) % 5 === 0 && <AdPlaceholder />}
            </React.Fragment>
          ))
        )}
      </div>

      {/* Modals */}
      <FollowRequestsModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        onRequestsUpdated={checkPendingRequests}
      />

      <Dialog
        open={showHashtagsModal}
        onClose={() => setShowHashtagsModal(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <Dialog.Title className="text-lg font-medium mb-4">
              Follow a Hashtag
            </Dialog.Title>
            <div className="space-y-4">
              <input
                type="text"
                value={hashtagToFollow}
                onChange={(e) => setHashtagToFollow(e.target.value)}
                placeholder="Enter hashtag name"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <button
                onClick={() => {
                  // Handle following hashtag
                  setShowHashtagsModal(false);
                }}
                disabled={!hashtagToFollow || followingHashtag}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {followingHashtag ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  'Follow Hashtag'
                )}
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}