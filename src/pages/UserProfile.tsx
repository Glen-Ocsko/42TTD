import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { UserProfile, FollowRequest } from '../types/profile';
import { Post } from '../types/social';
import { 
  User,
  MapPin,
  Tag,
  CheckCircle2,
  Clock,
  Target,
  Loader2,
  AlertTriangle,
  UserPlus,
  UserCheck,
  UserX,
  Lock,
  Calendar,
  Heart,
  Settings,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ActivityPost from '../components/ActivityPost';
import { format } from 'date-fns';
import { Dialog } from '@headlessui/react';

interface ActivityStats {
  completed: number;
  in_progress: number;
  not_started: number;
  total: number;
}

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { userId, isAuthenticated } = useCurrentUser();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followStatus, setFollowStatus] = useState<'none' | 'following' | 'pending' | 'requested' | 'friends'>('none');
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowRequest[]>([]);
  const [following, setFollowing] = useState<FollowRequest[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'activities'>('posts');
  const [showBioExpanded, setShowBioExpanded] = useState(false);

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username, userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;
      
      // Check if we can view this profile based on privacy settings
      if (profileData.privacy_default !== 'public' && userId !== profileData.id) {
        // For friends-only profiles, check if we're friends
        if (profileData.privacy_default === 'friends') {
          const { data: followData } = await supabase
            .rpc('get_follow_status', { 
              user_id: userId, 
              target_id: profileData.id 
            });
          
          if (followData !== 'friends') {
            setProfile({
              ...profileData,
              privacy_default: 'private' // Treat as private if not friends
            });
            setLoading(false);
            return;
          }
        } else if (profileData.privacy_default === 'private' && userId !== profileData.id) {
          // For private profiles, only show limited info
          setProfile(profileData);
          setLoading(false);
          return;
        }
      }

      // Get follow counts
      const [followerCount, followingCount] = await Promise.all([
        supabase.rpc('get_follower_count', { user_id: profileData.id }),
        supabase.rpc('get_following_count', { user_id: profileData.id })
      ]);
      
      // Get follow status if logged in
      let status = 'none';
      if (userId) {
        const { data: followStatus } = await supabase
          .rpc('get_follow_status', { 
            user_id: userId, 
            target_id: profileData.id 
          });
        
        status = followStatus || 'none';
      }

      setProfile({
        ...profileData,
        follower_count: followerCount.data || 0,
        following_count: followingCount.data || 0,
        follow_status: status
      });
      setFollowStatus(status);

      // Load activity stats if we can view the profile
      if (profileData.privacy_default === 'public' || userId === profileData.id || 
          (profileData.privacy_default === 'friends' && status === 'friends')) {
        
        // Load activity stats
        const { data: activities, error: statsError } = await supabase
          .from('user_activities')
          .select('status')
          .eq('user_id', profileData.id);

        if (statsError) throw statsError;

        const stats = {
          completed: activities?.filter(a => a.status === 'completed').length || 0,
          in_progress: activities?.filter(a => a.status === 'in_progress').length || 0,
          not_started: activities?.filter(a => a.status === 'not_started').length || 0,
          total: activities?.length || 0
        };
        setStats(stats);

        // Load public posts
        const { data: postsData, error: postsError } = await supabase
          .from('activity_posts')
          .select(`
            id,
            content,
            image_url,
            status,
            created_at,
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
          .eq('user_id', profileData.id)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        const transformedPosts = postsData
          ?.filter(post => post.activity && post.profiles)
          .map(post => ({
            ...post,
            activity: post.activity,
            user: post.profiles
          })) || [];

        setPosts(transformedPosts);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: `/users/${username}` } });
      return;
    }

    if (!profile || isUpdatingFollow) return;

    setIsUpdatingFollow(true);
    try {
      if (followStatus === 'none' || followStatus === 'rejected') {
        // Create new follow request
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: userId,
            following_id: profile.id,
            status: profile.privacy_default === 'public' ? 'accepted' : 'pending'
          });

        if (error) throw error;
        
        setFollowStatus(profile.privacy_default === 'public' ? 'following' : 'requested');
      } else if (followStatus === 'following' || followStatus === 'friends' || followStatus === 'requested') {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', profile.id);

        if (error) throw error;
        
        setFollowStatus('none');
      }

      // Refresh profile to update counts
      loadProfile();
    } catch (err) {
      console.error('Error updating follow status:', err);
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const loadFollowers = async () => {
    if (!profile) return;
    
    setLoadingConnections(true);
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          follower_id,
          status,
          created_at,
          follower:profiles!follows_follower_id_fkey (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('following_id', profile.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFollowers(data || []);
      setShowFollowersModal(true);
    } catch (err) {
      console.error('Error loading followers:', err);
    } finally {
      setLoadingConnections(false);
    }
  };

  const loadFollowing = async () => {
    if (!profile) return;
    
    setLoadingConnections(true);
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          following_id,
          status,
          created_at,
          following:profiles!follows_following_id_fkey (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('follower_id', profile.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFollowing(data || []);
      setShowFollowingModal(true);
    } catch (err) {
      console.error('Error loading following:', err);
    } finally {
      setLoadingConnections(false);
    }
  };

  const getFollowButtonText = () => {
    switch (followStatus) {
      case 'following':
        return 'Following';
      case 'friends':
        return 'Friends';
      case 'requested':
        return 'Requested';
      case 'pending':
        return 'Accept';
      default:
        return 'Follow';
    }
  };

  const getFollowButtonIcon = () => {
    switch (followStatus) {
      case 'following':
      case 'friends':
        return <UserCheck className="h-4 w-4" />;
      case 'requested':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <UserPlus className="h-4 w-4" />;
      default:
        return <UserPlus className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  const isPrivateProfile = profile.privacy_default === 'private' && userId !== profile.id;
  const isFriendsOnlyProfile = profile.privacy_default === 'friends' && followStatus !== 'friends' && userId !== profile.id;
  const canViewContent = !isPrivateProfile && !isFriendsOnlyProfile;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Sidebar */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col items-center text-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-32 h-32 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <User className="h-16 w-16 text-gray-400" />
                </div>
              )}
              <h1 className="text-2xl font-bold mb-1">{profile.username}</h1>
              {profile.full_name && (
                <p className="text-gray-600 mb-2">{profile.full_name}</p>
              )}
              
              {/* Privacy indicator */}
              {profile.privacy_default !== 'public' && (
                <div className="flex items-center gap-1 text-gray-500 mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm">{profile.privacy_default === 'friends' ? 'Friends Only' : 'Private'}</span>
                </div>
              )}
              
              {profile.location && (
                <div className="flex items-center gap-1 text-gray-500 mb-3">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {/* Follow/Unfollow button */}
              {userId !== profile.id && (
                <button
                  onClick={handleFollow}
                  disabled={isUpdatingFollow}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    followStatus === 'following' || followStatus === 'friends'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : followStatus === 'requested'
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isUpdatingFollow ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    getFollowButtonIcon()
                  )}
                  <span>{getFollowButtonText()}</span>
                </button>
              )}
              
              {/* Follower/Following counts */}
              <div className="flex justify-center gap-8 mt-4">
                <button 
                  onClick={loadFollowers}
                  className="text-center"
                >
                  <div className="font-bold">{profile.follower_count || 0}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </button>
                <button 
                  onClick={loadFollowing}
                  className="text-center"
                >
                  <div className="font-bold">{profile.following_count || 0}</div>
                  <div className="text-sm text-gray-500">Following</div>
                </button>
              </div>
            </div>

            {/* Bio */}
            {profile.profile_bio && (
              <div className="mt-4 text-center">
                <p className={`text-gray-600 ${!showBioExpanded && 'line-clamp-3'}`}>
                  {profile.profile_bio}
                </p>
                {profile.profile_bio.length > 150 && (
                  <button
                    onClick={() => setShowBioExpanded(!showBioExpanded)}
                    className="text-blue-600 text-sm mt-1"
                  >
                    {showBioExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}
            
            {/* Member since */}
            <div className="mt-4 text-center text-sm text-gray-500">
              Member since {format(new Date(profile.created_at), 'MMMM yyyy')}
            </div>
          </div>

          {/* Interests */}
          {canViewContent && profile.interests && profile.interests.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-medium mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                  >
                    <Tag className="h-3 w-3" />
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activity Stats */}
          {canViewContent && stats && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-medium mb-4">Activity Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Completed</span>
                  </div>
                  <span className="font-medium">{stats.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Clock className="h-5 w-5" />
                    <span>In Progress</span>
                  </div>
                  <span className="font-medium">{stats.in_progress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Target className="h-5 w-5" />
                    <span>Not Started</span>
                  </div>
                  <span className="font-medium">{stats.not_started}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between font-medium">
                    <span>Total Activities</span>
                    <span>{stats.total}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Column */}
        <div className="md:col-span-2">
          {isPrivateProfile ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">This Account is Private</h2>
              <p className="text-gray-600 mb-6">
                Follow this account to see their posts and activities.
              </p>
              <button
                onClick={handleFollow}
                disabled={isUpdatingFollow || followStatus === 'requested'}
                className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg ${
                  followStatus === 'requested'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {followStatus === 'requested' ? (
                  <>
                    <Clock className="h-5 w-5" />
                    Request Sent
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Request to Follow
                  </>
                )}
              </button>
            </div>
          ) : isFriendsOnlyProfile ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Friends Only Account</h2>
              <p className="text-gray-600 mb-6">
                This account only shares content with friends. Follow this account to see their posts and activities.
              </p>
              <button
                onClick={handleFollow}
                disabled={isUpdatingFollow || followStatus === 'requested'}
                className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg ${
                  followStatus === 'requested'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {followStatus === 'requested' ? (
                  <>
                    <Clock className="h-5 w-5" />
                    Request Sent
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Follow
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="border-b mb-6">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 ${
                      activeTab === 'posts'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Posts
                  </button>
                  <button
                    onClick={() => setActiveTab('activities')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 ${
                      activeTab === 'activities'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Activities
                  </button>
                </nav>
              </div>

              {/* Content based on active tab */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-4">Recent Posts</h2>
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <ActivityPost key={post.id} post={post} />
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                      No posts yet
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-4">Activities</h2>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Completed
                    </h3>
                    {stats && stats.completed > 0 ? (
                      <p>Showing completed activities will be implemented in a future update.</p>
                    ) : (
                      <p className="text-gray-500">No completed activities yet</p>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      In Progress
                    </h3>
                    {stats && stats.in_progress > 0 ? (
                      <p>Showing in-progress activities will be implemented in a future update.</p>
                    ) : (
                      <p className="text-gray-500">No in-progress activities</p>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-gray-600" />
                      Wishlist
                    </h3>
                    {stats && stats.not_started > 0 ? (
                      <p>Showing wishlist activities will be implemented in a future update.</p>
                    ) : (
                      <p className="text-gray-500">No activities in wishlist</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Followers Modal */}
      <Dialog
        open={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-bold mb-4">
              Followers
            </Dialog.Title>
            
            {loadingConnections ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : followers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No followers yet
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {followers.map((follow) => (
                  <div key={follow.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {follow.follower?.avatar_url ? (
                        <img
                          src={follow.follower.avatar_url}
                          alt={follow.follower.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{follow.follower?.username}</div>
                        {follow.follower?.full_name && (
                          <div className="text-sm text-gray-500">{follow.follower.full_name}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowFollowersModal(false);
                        navigate(`/users/${follow.follower?.username}`);
                      }}
                      className="text-sm text-blue-600"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowFollowersModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Following Modal */}
      <Dialog
        open={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-bold mb-4">
              Following
            </Dialog.Title>
            
            {loadingConnections ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : following.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Not following anyone yet
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {following.map((follow) => (
                  <div key={follow.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {follow.following?.avatar_url ? (
                        <img
                          src={follow.following.avatar_url}
                          alt={follow.following.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{follow.following?.username}</div>
                        {follow.following?.full_name && (
                          <div className="text-sm text-gray-500">{follow.following.full_name}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowFollowingModal(false);
                        navigate(`/users/${follow.following?.username}`);
                      }}
                      className="text-sm text-blue-600"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowFollowingModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}