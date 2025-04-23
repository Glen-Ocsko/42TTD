import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePageState } from '../hooks/usePageState';
import { UserProfile as UserProfileType } from '../types/profile';
import { Post } from '../types/social';
import { 
  User, 
  MapPin, 
  Calendar, 
  Tag,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Heart,
  Image,
  BookOpen,
  List,
  MessageCircle,
  CreditCard
} from 'lucide-react';
import ActivityPost from '../components/ActivityPost';
import ActivityCard from '../components/ActivityCard';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { userId } = useCurrentUser();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'activities' | 'replies' | 'likes' | 'media' | 'messages' | 'bookings'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
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
          const { data: postsData, error: postsError } = await supabase
            .from('activity_posts')
            .select(`
              id,
              user_id,
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
                avatar_url,
                full_name
              )
            `)
            .eq('user_id', profile.id)
            .eq('visibility', 'public')
            .order('created_at', { ascending: false });
          
          if (postsError) throw postsError;
          
          // Transform the data
          const transformedPosts = postsData?.map(post => ({
            ...post,
            activity: post.activity,
            user: post.profiles,
            likes_count: 0, // Placeholder, would fetch actual counts in a real implementation
            comments_count: 0,
            user_liked: false
          })) || [];
          
          setPosts(transformedPosts);
          break;
          
        case 'activities':
          const { data: activitiesData, error: activitiesError } = await supabase
            .from('user_activities')
            .select(`
              id,
              status,
              created_at,
              activity:activities (
                id,
                title,
                display_title,
                description,
                category_tags,
                difficulty,
                image_url
              )
            `)
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          
          if (activitiesError) throw activitiesError;
          setActivities(activitiesData || []);
          break;
          
        case 'replies':
          // In a real implementation, we would fetch actual replies
          // For now, using dummy data
          setReplies([
            { id: 1, content: 'Great post!', post_title: 'Learning to Surf', created_at: new Date().toISOString() },
            { id: 2, content: 'I had a similar experience', post_title: 'Hiking in the Alps', created_at: new Date().toISOString() }
          ]);
          break;
          
        case 'likes':
          // In a real implementation, we would fetch actual liked posts
          // For now, using dummy data
          setLikes([
            { id: 1, title: 'My First Marathon', user: 'runner_ryan', created_at: new Date().toISOString() },
            { id: 2, title: 'Cooking Italian Food', user: 'chef_carlos', created_at: new Date().toISOString() }
          ]);
          break;
          
        case 'media':
          const { data: mediaData, error: mediaError } = await supabase
            .from('activity_posts')
            .select(`
              id,
              user_id,
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
                avatar_url,
                full_name
              )
            `)
            .eq('user_id', profile.id)
            .eq('visibility', 'public')
            .not('image_url', 'is', null)
            .order('created_at', { ascending: false });
          
          if (mediaError) throw mediaError;
          
          // Transform the data
          const transformedMedia = mediaData?.map(post => ({
            ...post,
            activity: post.activity,
            user: post.profiles,
            likes_count: 0,
            comments_count: 0,
            user_liked: false
          })) || [];
          
          setMedia(transformedMedia);
          break;
          
        case 'messages':
          // Only load if viewing own profile
          if (profile.id === userId) {
            // In a real implementation, we would fetch actual messages
            // For now, using dummy data
            setMessages([
              { id: 1, sender: 'adventure_alex', content: 'Hey, how are you?', created_at: new Date().toISOString() },
              { id: 2, sender: 'chef_carlos', content: 'About that cooking class...', created_at: new Date().toISOString() }
            ]);
          }
          break;
          
        case 'bookings':
          // Only load if viewing own profile
          if (profile.id === userId) {
            // In a real implementation, we would fetch actual bookings
            // For now, using dummy data
            setBookings([
              { id: 1, activity: 'Surfing Lesson', supplier: 'Beach Surf School', date: '2025-05-15', status: 'confirmed' },
              { id: 2, activity: 'Rock Climbing', supplier: 'Mountain Adventures', date: '2025-06-20', status: 'pending' }
            ]);
          }
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

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>User not found: {username}</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = userId === profile.id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4">
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

        <div className="mt-4">
          {profile.profile_bio && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-gray-700">{profile.profile_bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="border-b overflow-x-auto">
          <div className="flex">
            <button
              onClick={() => handleTabChange('posts')}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>Posts</span>
              </div>
            </button>
            
            <button
              onClick={() => handleTabChange('activities')}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === 'activities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <List className="h-5 w-5" />
                <span>Activities</span>
              </div>
            </button>
            
            <button
              onClick={() => handleTabChange('replies')}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === 'replies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span>Replies</span>
              </div>
            </button>
            
            <button
              onClick={() => handleTabChange('likes')}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === 'likes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                <span>Likes</span>
              </div>
            </button>
            
            <button
              onClick={() => handleTabChange('media')}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === 'media'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                <span>Media</span>
              </div>
            </button>
            
            {isOwnProfile && (
              <>
                <button
                  onClick={() => handleTabChange('messages')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap ${
                    activeTab === 'messages'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Messages</span>
                  </div>
                </button>
                
                <button
                  onClick={() => handleTabChange('bookings')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap ${
                    activeTab === 'bookings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Bookings</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="p-4">
          {tabLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
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
              
              {/* Activities Tab */}
              {activeTab === 'activities' && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activities.length > 0 ? (
                    activities.map(activity => (
                      <ActivityCard 
                        key={activity.id} 
                        activity={activity.activity}
                        isOnList={true}
                        showListActions={false}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No activities yet
                    </div>
                  )}
                </div>
              )}
              
              {/* Replies Tab */}
              {activeTab === 'replies' && (
                <div className="space-y-4">
                  {replies.length > 0 ? (
                    replies.map(reply => (
                      <div key={reply.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 mb-1">
                          Re: {reply.post_title}
                        </div>
                        <p className="text-gray-700">{reply.content}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(reply.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No replies yet
                    </div>
                  )}
                </div>
              )}
              
              {/* Likes Tab */}
              {activeTab === 'likes' && (
                <div className="space-y-4">
                  {likes.length > 0 ? (
                    likes.map(like => (
                      <div key={like.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500 fill-current" />
                          <h3 className="font-medium">{like.title}</h3>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Posted by @{like.user}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(like.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No likes yet
                    </div>
                  )}
                </div>
              )}
              
              {/* Media Tab */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  {media.length > 0 ? (
                    media.map(post => (
                      <ActivityPost key={post.id} post={post} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No media posts yet
                    </div>
                  )}
                </div>
              )}
              
              {/* Messages Tab (Only for own profile) */}
              {activeTab === 'messages' && isOwnProfile && (
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map(message => (
                      <div key={message.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="font-medium mb-1">
                          From: @{message.sender}
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(message.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No messages yet
                    </div>
                  )}
                </div>
              )}
              
              {/* Bookings Tab (Only for own profile) */}
              {activeTab === 'bookings' && isOwnProfile && (
                <div className="space-y-4">
                  {bookings.length > 0 ? (
                    bookings.map(booking => (
                      <div key={booking.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="font-medium mb-1">{booking.activity}</div>
                        <div className="text-sm text-gray-600">
                          Supplier: {booking.supplier}
                        </div>
                        <div className="text-sm text-gray-600">
                          Date: {booking.date}
                        </div>
                        <div className="text-sm">
                          Status: <span className={`${
                            booking.status === 'confirmed' ? 'text-green-600' : 
                            booking.status === 'pending' ? 'text-amber-600' : 'text-gray-600'
                          }`}>{booking.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No bookings yet
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