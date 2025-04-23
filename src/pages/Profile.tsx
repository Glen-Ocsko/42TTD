import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePageState } from '../hooks/usePageState';
import { UserProfile as UserProfileType } from '../types/profile';
import { Post } from '../types/social';
import { 
  User,
  Calendar,
  MapPin,
  Tag,
  Loader2
} from 'lucide-react';
import ActivityPost from '../components/ActivityPost';
import ActivityCard from '../components/ActivityCard';
import ProfileStats from '../components/ProfileStats';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { userId } = useCurrentUser();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'activities' | 'replies' | 'likes' | 'media' | 'messages' | 'bookings'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [replies, setReplies] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Post[]>([]);
  const [media, setMedia] = useState<Post[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [tabLoading, setTabLoading] = useState(false);
  const [pageState, updatePageState] = usePageState({
    activeTab: 'posts'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            post_count:activity_posts(count)
          `)
          .eq('username', username)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          setError('Profile not found');
          return;
        }
        
        setProfile(data);
        setPostCount(data.post_count?.[0]?.count || 0);
        
        // Load initial tab data
        loadTabData(pageState.activeTab || 'posts');
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching the profile');
      } finally {
        setLoading(false);
      }
    };
    
    if (username) {
      fetchProfile();
    }
  }, [username, pageState.activeTab]);

  const loadTabData = async (tab: string) => {
    if (!profile) return;
    
    setTabLoading(true);
    
    try {
      switch (tab) {
        case 'posts':
          const { data: postsData } = await supabase
            .from('activity_posts')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          setPosts(postsData || []);
          break;
          
        case 'activities':
          const { data: activitiesData } = await supabase
            .from('user_activities')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          setActivities(activitiesData || []);
          break;
          
        case 'replies':
          const { data: repliesData } = await supabase
            .from('post_comments')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          setReplies(repliesData || []);
          break;
          
        case 'likes':
          const { data: likesData } = await supabase
            .from('post_likes')
            .select('post_id, activity_posts(*)')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          setLikes(likesData?.map(like => like.activity_posts) || []);
          break;
          
        case 'media':
          const { data: mediaData } = await supabase
            .from('activity_posts')
            .select('*')
            .eq('user_id', profile.id)
            .not('image_url', 'is', null)
            .order('created_at', { ascending: false });
          setMedia(mediaData || []);
          break;
          
        case 'messages':
          // TODO: Implement messages loading
          break;
          
        case 'bookings':
          const { data: bookingsData } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          setBookings(bookingsData || []);
          break;
      }
    } catch (err) {
      console.error(`Error loading ${tab} data:`, err);
    } finally {
      setTabLoading(false);
    }
  };

  const handleTabChange = (tab: 'posts' | 'activities' | 'replies' | 'likes' | 'media' | 'messages' | 'bookings') => {
    setActiveTab(tab);
    updatePageState({ activeTab: tab });
    loadTabData(tab);
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
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error || 'Profile not found'}
        </div>
      </div>
    );
  }

  const isOwnProfile = userId === profile.id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="flex items-center space-x-4 mb-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || 'User avatar'}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                {profile.full_name && (
                  <p className="text-gray-600">{profile.full_name} • <span>{postCount} posts</span></p>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1 text-gray-500 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>

            {profile.profile_bio && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">About</h2>
                <p className="text-gray-700">{profile.profile_bio}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 mt-4">
              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        <Tag className="h-3 w-3" />
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {profile.created_at && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Member Since</h3>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:w-2/3">
            <ProfileStats userId={profile.id} isOwnProfile={isOwnProfile} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => handleTabChange('posts')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'posts'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => handleTabChange('activities')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'activities'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Activities
            </button>
            <button
              onClick={() => handleTabChange('media')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'media'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => handleTabChange('likes')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'likes'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Likes
            </button>
          </nav>
        </div>

        <div className="p-4">
          {tabLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {posts.length > 0 ? (
                    posts.map(post => (
                      <ActivityPost key={post.id} post={post} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No posts yet
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activities.length > 0 ? (
                    activities.map(activity => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 col-span-2">
                      No activities yet
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-4">
                  {media.length > 0 ? (
                    media.map(post => (
                      <div key={post.id} className="mb-4">
                        {post.image_url && (
                          <div className="rounded-lg overflow-hidden mb-2">
                            <img 
                              src={post.image_url} 
                              alt="Post media" 
                              className="w-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/800x600?text=Image+Error';
                              }}
                            />
                          </div>
                        )}
                        <ActivityPost post={post} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No media posts yet
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'likes' && (
                <div className="space-y-4">
                  {likes.length > 0 ? (
                    likes.map(post => (
                      <ActivityPost key={post.id} post={post} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No liked posts yet
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}