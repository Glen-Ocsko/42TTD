import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useDemo } from '../contexts/DemoContext';
import { supabase } from '../lib/supabase';
import { 
  User,
  MapPin,
  Mail,
  Calendar,
  Shield,
  Edit2,
  Save,
  X,
  Loader2,
  AlertTriangle,
  CreditCard,
  Bell,
  Lock,
  UserPlus,
  UserCheck
} from 'lucide-react';
import ActivityCard from './ActivityCard';
import ProgressTracker from './ProgressTracker';
import ProfileForm from './ProfileForm';
import UserBookings from './UserBookings';
import UserInbox from './UserInbox';
import PushNotificationSettings from './PushNotificationSettings';
import { isNative } from '../lib/capacitor';
import PrivacySettingsModal from './PrivacySettingsModal';
import FollowRequestsModal from './FollowRequestsModal';
import ModerationMessages from './ModerationMessages';

interface Activity {
  id: string;
  activity: {
    id: string;
    title: string;
    description: string | null;
    category_tags: string[];
    difficulty: number;
    image_url: string | null;
  };
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  location: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  is_admin: boolean;
  is_moderator: boolean;
  is_suspended: boolean;
  is_banned: boolean;
  suspension_end_date?: string;
  privacy_default: 'public' | 'friends' | 'private';
  profile_bio: string | null;
}

export default function Profile() {
  const { userId, isDemoMode } = useCurrentUser();
  const { demoUser, setDemoAdmin, setDemoModerator } = useDemo();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'activities' | 'bookings' | 'messages' | 'settings' | 'moderation'>('activities');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadModerationCount, setUnreadModerationCount] = useState(0);

  useEffect(() => {
    if (isDemoMode && demoUser) {
      setProfile({
        id: demoUser.id,
        username: demoUser.username,
        full_name: demoUser.full_name,
        email: demoUser.email,
        avatar_url: demoUser.avatar_url,
        location: demoUser.location,
        age: demoUser.age,
        gender: demoUser.gender,
        is_admin: demoUser.is_admin,
        is_moderator: demoUser.is_moderator,
        is_suspended: false,
        is_banned: false,
        privacy_default: demoUser.privacy_default,
        profile_bio: "Hi there! I'm a demo user exploring all the amazing activities on 42 Things To Do. I love adventure, travel, and trying new things. Join me on this journey!"
      });
      loadActivities();
    } else if (userId) {
      loadProfile();
      loadActivities();
      checkPendingRequests();
      checkUnreadModerationMessages();
    }
  }, [userId, isDemoMode, demoUser]);

  const loadProfile = async () => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    }
  };

  const loadActivities = async () => {
    try {
      const { data, error: activitiesError } = await supabase
        .from('user_activities')
        .select(`
          id,
          status,
          created_at,
          activity:activities (
            id,
            title,
            description,
            category_tags,
            difficulty,
            image_url
          )
        `)
        .eq('user_id', isDemoMode ? '00000000-0000-0000-0000-000000000000' : userId)
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;
      setActivities(data || []);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
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

  const checkUnreadModerationMessages = async () => {
    try {
      const { count, error } = await supabase
        .from('moderation_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) throw error;
      setUnreadModerationCount(count || 0);
    } catch (err) {
      console.error('Error checking unread moderation messages:', err);
    }
  };

  const handleEditComplete = () => {
    setEditing(false);
    loadProfile();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {editing ? (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <button
              onClick={() => setEditing(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ProfileForm isEditing={true} onComplete={handleEditComplete} />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Column */}
          <div className="lg:w-1/3 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Profile</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPrivacyModal(true)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Lock className="h-4 w-4" />
                    Privacy
                  </button>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-lg">{profile?.username}</h3>
                  {profile?.email && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Mail className="h-4 w-4" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {profile?.full_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{profile.full_name}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile?.age && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{profile.age} years old</span>
                  </div>
                )}
                {profile?.privacy_default && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Lock className="h-4 w-4" />
                    <span>
                      {profile.privacy_default === 'public' 
                        ? 'Public Profile' 
                        : profile.privacy_default === 'friends' 
                        ? 'Friends Only' 
                        : 'Private Profile'}
                    </span>
                  </div>
                )}
                {(profile?.is_admin || profile?.is_moderator) && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Shield className="h-4 w-4" />
                    <span>{profile.is_admin ? 'Administrator' : 'Moderator'}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile?.profile_bio && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Bio</h4>
                  <p className="text-gray-600">{profile.profile_bio}</p>
                </div>
              )}

              {/* Follow Requests Alert */}
              {pendingRequestsCount > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => setShowRequestsModal(true)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      <span>Follow Requests</span>
                    </div>
                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                    </span>
                  </button>
                </div>
              )}

              {/* Moderation Messages Alert */}
              {unreadModerationCount > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => setActiveTab('moderation')}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <span>Moderation Messages</span>
                    </div>
                    <span className="bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadModerationCount > 9 ? '9+' : unreadModerationCount}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Progress Card */}
            <ProgressTracker />

            {/* Notification Settings (Mobile Only) */}
            {isNative && (
              <PushNotificationSettings />
            )}

            {/* Demo Role Toggles */}
            {isDemoMode && demoUser && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Admin Access</h3>
                    </div>
                    <button
                      onClick={() => setDemoAdmin(!demoUser.is_admin)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        demoUser.is_admin ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          demoUser.is_admin ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      <h3 className="font-medium">Moderator Access</h3>
                    </div>
                    <button
                      onClick={() => setDemoModerator(!demoUser.is_moderator)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        demoUser.is_moderator ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          demoUser.is_moderator ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Toggle roles to test different access levels
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Content Column */}
          <div className="lg:w-2/3 space-y-6">
            {/* Tabs */}
            <div className="border-b overflow-x-auto">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'activities'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Activities
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'bookings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span>My Bookings</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'messages'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    <span>Messages</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'settings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('moderation')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === 'moderation'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 relative">
                    <Shield className="h-5 w-5" />
                    <span>Moderation</span>
                    {unreadModerationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadModerationCount > 9 ? '9+' : unreadModerationCount}
                      </span>
                    )}
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'activities' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Activities</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {activities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity.activity}
                      isOnList={true}
                    />
                  ))}
                  {activities.length === 0 && (
                    <div className="col-span-2 text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No activities added yet</p>
                      <button
                        onClick={() => navigate('/activities')}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Browse Activities
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <UserBookings />
            )}

            {activeTab === 'messages' && (
              <UserInbox />
            )}

            {activeTab === 'moderation' && (
              <ModerationMessages />
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Notification Settings</h2>
                <div className="space-y-6">
                  <PushNotificationSettings />
                  
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <span className="font-medium">Email Notifications</span>
                      </div>
                      <button
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Receive email notifications about messages, bookings, and activity reminders.
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-gray-500" />
                        <span className="font-medium">Privacy Settings</span>
                      </div>
                      <button
                        onClick={() => setShowPrivacyModal(true)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Control who can see your profile, activities, and posts.
                    </p>
                    <div className="mt-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Current setting:</span>
                        <span className="capitalize">{profile?.privacy_default || 'public'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy Settings Modal */}
      <PrivacySettingsModal 
        isOpen={showPrivacyModal}
        onClose={() => {
          setShowPrivacyModal(false);
          loadProfile(); // Refresh profile after closing
        }}
      />

      {/* Follow Requests Modal */}
      <FollowRequestsModal 
        isOpen={showRequestsModal}
        onClose={() => {
          setShowRequestsModal(false);
          checkPendingRequests(); // Refresh the count after closing
        }}
      />
    </div>
  );
}