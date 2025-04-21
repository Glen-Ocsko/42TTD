import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useDemo } from '../contexts/DemoContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Post, Hashtag, UserHashtag, FeedFilter } from '../types/social';
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
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [followedHashtags, setFollowedHashtags] = useState<UserHashtag[]>([]);
  const [showHashtagsModal, setShowHashtagsModal] = useState(false);
  const [hashtagToFollow, setHashtagToFollow] = useState('');
  const [followingHashtag, setFollowingHashtag] = useState(false);

  // Get hashtag from URL if present
  const hashtagParam = searchParams.get('hashtag');

  useEffect(() => {
    if (hashtagParam) {
      loadPostsByHashtag(hashtagParam);
    } else {
      loadInitialData();
    }
    
    if (userId) {
      checkPendingRequests();
      loadFollowedHashtags();
    }

    loadTrendingHashtags();
  }, [userId, hashtagParam]);

  useEffect(() => {
    if (activeFilter !== 'all' && !hashtagParam) {
      loadFilteredPosts();
    }
  }, [activeFilter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPosts(),
        loadUsers()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      // First, get the posts
      const { data: postsData, error: postsError } = await supabase
        .from('activity_posts')
        .select(`
          id,
          user_id,
          content,
          image_url,
          status,
          created_at,
          hashtags,
          activity:activities!activity_posts_activity_id_fkey (
            id,
            title
          ),
          profiles!activity_posts_user_id_fkey (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // If user is logged in, get their likes
      let userLikes: Record<string, boolean> = {};
      if (userId) {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', userId);

        if (likesError) throw likesError;
        userLikes = (likesData || []).reduce((acc, like) => {
          acc[like.post_id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }

      // Get like counts for all posts
      const postIds = postsData?.map(p => p.id) || [];
      let likesCount: Record<string, number> = {};
      
      if (postIds.length > 0) {
        const { data: likesCountData, error: likesCountError } = await supabase
          .from('post_likes')
          .select('post_id');
        
        if (likesCountError) throw likesCountError;
        
        // Count likes for each post in JavaScript
        likesCount = (likesCountData || []).reduce((acc, item) => {
          acc[item.post_id] = (acc[item.post_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      // Get comment counts for all posts
      let commentsCount: Record<string, number> = {};
      
      if (postIds.length > 0) {
        const { data: commentsCountData, error: commentsCountError } = await supabase
          .from('post_comments')
          .select('post_id');
        
        if (commentsCountError) throw commentsCountError;
        
        // Count comments for each post in JavaScript
        commentsCount = (commentsCountData || []).reduce((acc, item) => {
          acc[item.post_id] = (acc[item.post_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      // Transform the data
      const transformedPosts = postsData
        ?.filter(post => post.activity && post.profiles)
        .map(post => ({
          ...post,
          activity: post.activity,
          user: post.profiles,
          likes_count: likesCount[post.id] || 0,
          comments_count: commentsCount[post.id] || 0,
          user_liked: userLikes[post.id] || false
        })) || [];

      setPosts(transformedPosts);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load community posts');
    }
  };

  const loadFilteredPosts = async () => {
    try {
      setLoading(true);
      let data: any[] = [];
      let error: any = null;

      if (activeFilter === 'following') {
        // Get posts from users the current user follows
        const result = await supabase
          .rpc('get_posts_from_following', { user_id: userId });
        data = result.data || [];
        error = result.error;
      } else if (activeFilter === 'friends') {
        // Get posts from mutual followers (friends)
        const result = await supabase
          .rpc('get_posts_from_friends', { user_id: userId });
        data = result.data || [];
        error = result.error;
      } else if (activeFilter === 'hashtags') {
        // Get posts with hashtags the user follows
        const result = await supabase
          .rpc('get_posts_with_followed_hashtags', { user_id: userId });
        data = result.data || [];
        error = result.error;
      }

      if (error) throw error;

      // Get user info, likes, and comments for these posts
      if (data.length > 0) {
        // Get user info
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, full_name')
          .in('id', data.map(p => p.user_id));

        if (usersError) throw usersError;
        const usersMap = (usersData || []).reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, any>);

        // Get activity info
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('id, title')
          .in('id', data.filter(p => p.activity_id).map(p => p.activity_id));

        if (activitiesError) throw activitiesError;
        const activitiesMap = (activitiesData || []).reduce((acc, activity) => {
          acc[activity.id] = activity;
          return acc;
        }, {} as Record<string, any>);

        // Get like counts
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id');

        if (likesError) throw likesError;
        
        // Count likes for each post in JavaScript
        const likesCount = (likesData || []).reduce((acc, item) => {
          acc[item.post_id] = (acc[item.post_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Get user likes
        let userLikes: Record<string, boolean> = {};
        if (userId) {
          const { data: userLikesData, error: userLikesError } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', userId)
            .in('post_id', data.map(p => p.id));

          if (userLikesError) throw userLikesError;
          userLikes = (userLikesData || []).reduce((acc, like) => {
            acc[like.post_id] = true;
            return acc;
          }, {} as Record<string, boolean>);
        }

        // Get comment counts
        const { data: commentsData, error: commentsError } = await supabase
          .from('post_comments')
          .select('post_id');

        if (commentsError) throw commentsError;
        
        // Count comments for each post in JavaScript
        const commentsCount = (commentsData || []).reduce((acc, item) => {
          acc[item.post_id] = (acc[item.post_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Transform the data
        const transformedPosts = data.map(post => {
          const user = usersMap[post.user_id];
          const activity = post.activity_id ? activitiesMap[post.activity_id] : null;
          
          return {
            ...post,
            user: {
              username: user?.username || 'Unknown',
              avatar_url: user?.avatar_url,
              full_name: user?.full_name
            },
            activity: activity ? {
              id: activity.id,
              title: activity.title
            } : undefined,
            likes_count: likesCount[post.id] || 0,
            comments_count: commentsCount[post.id] || 0,
            user_liked: userLikes[post.id] || false
          };
        });

        setPosts(transformedPosts);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Error loading filtered posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadPostsByHashtag = async (hashtag: string) => {
    try {
      setLoading(true);
      
      // Get posts with this hashtag
      const { data, error } = await supabase
        .from('activity_posts')
        .select(`
          id,
          user_id,
          content,
          image_url,
          status,
          created_at,
          hashtags,
          activity:activities!activity_posts_activity_id_fkey (
            id,
            title
          ),
          profiles!activity_posts_user_id_fkey (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('visibility', 'public')
        .ilike('content', `%#${hashtag}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If user is logged in, get their likes
      let userLikes: Record<string, boolean> = {};
      if (userId) {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', userId);

        if (likesError) throw likesError;
        userLikes = (likesData || []).reduce((acc, like) => {
          acc[like.post_id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }

      // Get like counts for all posts
      const postIds = data?.map(p => p.id) || [];
      let likesCount: Record<string, number> = {};
      
      if (postIds.length > 0) {
        const { data: likesCountData, error: likesCountError } = await supabase
          .from('post_likes')
          .select('post_id');
        
        if (likesCountError) throw likesCountError;
        
        // Count likes for each post in JavaScript
        likesCount = (likesCountData || []).reduce((acc, item) => {
          acc[item.post_id] = (acc[item.post_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      // Get comment counts for all posts
      let commentsCount: Record<string, number> = {};
      
      if (postIds.length > 0) {
        const { data: commentsCountData, error: commentsCountError } = await supabase
          .from('post_comments')
          .select('post_id');
        
        if (commentsCountError) throw commentsCountError;
        
        // Count comments for each post in JavaScript
        commentsCount = (commentsCountData || []).reduce((acc, item) => {
          acc[item.post_id] = (acc[item.post_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      // Check if user follows this hashtag
      if (userId) {
        const { data: hashtagData } = await supabase
          .from('hashtags')
          .select('id')
          .ilike('name', hashtag)
          .single();

        if (hashtagData) {
          const { data: followData } = await supabase
            .from('user_hashtags')
            .select('id')
            .eq('user_id', userId)
            .eq('hashtag_id', hashtagData.id)
            .maybeSingle();

          setHashtagToFollow(hashtagData.id);
          setFollowingHashtag(!!followData);
        }
      }

      // Transform the data
      const transformedPosts = data
        ?.filter(post => post.activity && post.profiles)
        .map(post => ({
          ...post,
          activity: post.activity,
          user: post.profiles,
          likes_count: likesCount[post.id] || 0,
          comments_count: commentsCount[post.id] || 0,
          user_liked: userLikes[post.id] || false
        })) || [];

      setPosts(transformedPosts);
    } catch (err) {
      console.error('Error loading posts by hashtag:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('username', null)
      .eq('privacy_default', 'public')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;
    
    // If logged in, get follow status for each user
    let usersWithFollowStatus = data || [];
    
    if (userId) {
      const followStatuses = await Promise.all(
        usersWithFollowStatus.map(async (user) => {
          if (user.id === userId) return 'self';
          
          const { data: status } = await supabase
            .rpc('get_follow_status', { 
              user_id: userId, 
              target_id: user.id 
            });
          
          return status || 'none';
        })
      );
      
      usersWithFollowStatus = usersWithFollowStatus.map((user, index) => ({
        ...user,
        follow_status: followStatuses[index] === 'self' ? undefined : followStatuses[index]
      }));
    }
    
    setUsers(usersWithFollowStatus);
  };

  const loadTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .order('post_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTrendingHashtags(data || []);
    } catch (err) {
      console.error('Error loading trending hashtags:', err);
    }
  };

  const loadFollowedHashtags = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_followed_hashtags', { user_id: userId });

      if (error) throw error;
      setFollowedHashtags(data || []);
    } catch (err) {
      console.error('Error loading followed hashtags:', err);
    }
  };

  const checkPendingRequests = async () => {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingRequestsCount(count || 0);
    } catch (err) {
      console.error('Error checking pending requests:', err);
    }
  };

  const handleFollowHashtag = async (hashtagId: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

    try {
      setFollowingHashtag(true);
      
      if (followedHashtags.some(h => h.hashtag_id === hashtagId)) {
        // Unfollow
        const { error } = await supabase
          .from('user_hashtags')
          .delete()
          .eq('user_id', userId)
          .eq('hashtag_id', hashtagId);

        if (error) throw error;
        
        setFollowedHashtags(prev => prev.filter(h => h.hashtag_id !== hashtagId));
      } else {
        // Follow
        const { error } = await supabase
          .from('user_hashtags')
          .insert({
            user_id: userId,
            hashtag_id: hashtagId
          });

        if (error) throw error;
        
        // Get hashtag info to add to followed list
        const { data: hashtagData } = await supabase
          .from('hashtags')
          .select('*')
          .eq('id', hashtagId)
          .single();
          
        if (hashtagData) {
          setFollowedHashtags(prev => [...prev, {
            id: hashtagId,
            user_id: userId!,
            hashtag_id: hashtagId,
            hashtag_name: hashtagData.name,
            post_count: hashtagData.post_count,
            created_at: new Date().toISOString()
          }]);
        }
      }
    } catch (err) {
      console.error('Error following/unfollowing hashtag:', err);
    } finally {
      setFollowingHashtag(false);
    }
  };

  const handleFollowHashtagByName = async () => {
    if (!hashtagToFollow.trim()) return;
    
    try {
      // First check if hashtag exists
      const { data, error } = await supabase
        .from('hashtags')
        .select('id')
        .ilike('name', hashtagToFollow.trim())
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Hashtag exists, follow it
        await handleFollowHashtag(data.id);
      } else {
        // Hashtag doesn't exist, create it
        const { data: newHashtag, error: createError } = await supabase
          .from('hashtags')
          .insert({
            name: hashtagToFollow.trim().toLowerCase(),
            post_count: 0
          })
          .select()
          .single();

        if (createError) throw createError;
        
        if (newHashtag) {
          await handleFollowHashtag(newHashtag.id);
        }
      }
      
      setHashtagToFollow('');
    } catch (err) {
      console.error('Error following hashtag by name:', err);
    }
  };

  const handlePostUpdate = () => {
    if (hashtagParam) {
      loadPostsByHashtag(hashtagParam);
    } else if (activeFilter !== 'all') {
      loadFilteredPosts();
    } else {
      loadPosts();
    }
  };

  const handleFilterChange = (filter: FeedFilter) => {
    setActiveFilter(filter);
    
    // Clear hashtag param if switching to a different filter
    if (hashtagParam && filter !== 'all') {
      setSearchParams({});
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
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <div 
        className="relative bg-cover bg-center h-[400px]" 
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=80")'
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col items-center justify-center text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to the 42TTD Community
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mb-8">
            Connect with fellow adventurers, share your progress, and inspire others on their journey.
          </p>

          {/* Show CTA buttons only for non-authenticated users */}
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
              >
                <UserPlus className="h-5 w-5" />
                Join the Community
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white/90 text-gray-800 rounded-lg hover:bg-white/100 shadow-lg"
              >
                Already a member? Sign in
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Follow Requests Alert */}
        {pendingRequestsCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800">New Follow Requests</h3>
                <p className="text-sm text-blue-600">
                  You have {pendingRequestsCount} pending follow {pendingRequestsCount === 1 ? 'request' : 'requests'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRequestsModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Requests
            </button>
          </div>
        )}

        {/* Hashtag Header */}
        {hashtagParam && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Hash className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">#{hashtagParam}</h2>
                  <p className="text-gray-600">
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                  </p>
                </div>
              </div>
              {isAuthenticated && (
                <button
                  onClick={() => handleFollowHashtag(hashtagToFollow)}
                  disabled={followingHashtag}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    followedHashtags.some(h => h.hashtag_id === hashtagToFollow)
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {followingHashtag ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : followedHashtags.some(h => h.hashtag_id === hashtagToFollow) ? (
                    <>
                      <UserCheck className="h-5 w-5" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Feed Column */}
          <div className="lg:col-span-8">
            {/* Feed Container */}
            <div className="max-w-2xl mx-auto">
              {/* Feed Filters */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                      activeFilter === 'all' && !hashtagParam
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
                        <UserPlus className="h-5 w-5" />
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
                        <Hash className="h-5 w-5" />
                        My Hashtags
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-6">
                {hashtagParam 
                  ? `#${hashtagParam}` 
                  : activeFilter === 'following'
                  ? 'Posts from People You Follow'
                  : activeFilter === 'friends'
                  ? 'Posts from Friends'
                  : activeFilter === 'hashtags'
                  ? 'Posts with Hashtags You Follow'
                  : 'Community Feed'}
              </h2>
              
              {/* Posts Feed */}
              {error ? (
                <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                  {error}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">
                    {hashtagParam 
                      ? `No posts with #${hashtagParam} yet` 
                      : activeFilter === 'following'
                      ? 'No posts from people you follow yet'
                      : activeFilter === 'friends'
                      ? 'No posts from friends yet'
                      : activeFilter === 'hashtags'
                      ? followedHashtags.length === 0
                        ? 'You haven\'t followed any hashtags yet'
                        : 'No posts with your followed hashtags yet'
                      : 'No posts yet — be the first to share your journey!'}
                  </p>
                  {activeFilter === 'hashtags' && followedHashtags.length === 0 && (
                    <button
                      onClick={() => setShowHashtagsModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Follow Hashtags
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post, index) => (
                    <React.Fragment key={post.id}>
                      <ActivityPost 
                        post={post} 
                        onUpdate={handlePostUpdate}
                      />
                      
                      {/* Insert ad after every 5 posts */}
                      {(index + 1) % 5 === 0 && index < posts.length - 1 && (
                        <AdPlaceholder 
                          activityTags={post.activity?.title ? [post.activity.title] : []}
                          compact={true}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Community Members */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Community Members</h3>
                <Link to="/users" className="text-blue-600 text-sm flex items-center gap-1">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {users.map(user => (
                  <Link 
                    key={user.id} 
                    to={`/users/${user.username}`}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{user.username}</div>
                      {user.location && (
                        <div className="text-xs text-gray-500">{user.location}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Link
                  to="/users"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Users className="h-5 w-5" />
                  Find More People
                </Link>
              </div>
            </div>
            
            {/* Trending Hashtags */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Trending Hashtags</h3>
                {isAuthenticated && (
                  <button 
                    onClick={() => setShowHashtagsModal(true)}
                    className="text-blue-600 text-sm flex items-center gap-1"
                  >
                    Manage
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {trendingHashtags.map(hashtag => (
                  <Link
                    key={hashtag.id}
                    to={`/community?hashtag=${hashtag.name}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{hashtag.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{hashtag.post_count} posts</span>
                  </Link>
                ))}
                
                {trendingHashtags.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No trending hashtags yet
                  </div>
                )}
              </div>
            </div>
            
            {/* Followed Hashtags */}
            {isAuthenticated && followedHashtags.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Hashtags You Follow</h3>
                  <button 
                    onClick={() => setShowHashtagsModal(true)}
                    className="text-blue-600 text-sm flex items-center gap-1"
                  >
                    Manage
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {followedHashtags.map(hashtag => (
                    <Link
                      key={hashtag.hashtag_id}
                      to={`/community?hashtag=${hashtag.hashtag_name}`}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{hashtag.hashtag_name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{hashtag.post_count} posts</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Ad Placeholder */}
            <AdPlaceholder />
          </div>
        </div>
      </div>

      {/* Follow Requests Modal */}
      <FollowRequestsModal 
        isOpen={showRequestsModal}
        onClose={() => {
          setShowRequestsModal(false);
          checkPendingRequests(); // Refresh the count after closing
        }}
      />

      {/* Hashtags Modal */}
      <Dialog
        open={showHashtagsModal}
        onClose={() => setShowHashtagsModal(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold">
                Manage Hashtags
              </Dialog.Title>
              <button
                onClick={() => setShowHashtagsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Follow New Hashtag */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Follow a Hashtag</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={hashtagToFollow}
                    onChange={(e) => setHashtagToFollow(e.target.value)}
                    placeholder="Enter hashtag name"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleFollowHashtagByName}
                  disabled={!hashtagToFollow.trim() || followingHashtag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {followingHashtag ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Followed Hashtags */}
            <div>
              <h3 className="font-medium mb-2">Your Followed Hashtags</h3>
              {followedHashtags.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {followedHashtags.map(hashtag => (
                    <div 
                      key={hashtag.hashtag_id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{hashtag.hashtag_name}</span>
                      </div>
                      <button
                        onClick={() => handleFollowHashtag(hashtag.hashtag_id)}
                        disabled={followingHashtag}
                        className="p-1 text-red-500 hover:text-red-700 rounded-full"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                  You haven't followed any hashtags yet
                </div>
              )}
            </div>

            {/* Trending Hashtags */}
            <div className="mt-6">
              <h3 className="font-medium mb-2">Trending Hashtags</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {trendingHashtags.map(hashtag => (
                  <div 
                    key={hashtag.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <Link
                      to={`/community?hashtag=${hashtag.name}`}
                      className="flex items-center gap-2 flex-1"
                      onClick={() => setShowHashtagsModal(false)}
                    >
                      <Hash className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{hashtag.name}</span>
                      <span className="text-sm text-gray-500">{hashtag.post_count} posts</span>
                    </Link>
                    {!followedHashtags.some(h => h.hashtag_id === hashtag.id) && (
                      <button
                        onClick={() => handleFollowHashtag(hashtag.id)}
                        disabled={followingHashtag}
                        className="p-1 text-blue-500 hover:text-blue-700 rounded-full"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}