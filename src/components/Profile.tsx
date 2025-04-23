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
  Plus,
  Eye,
  EyeOff,
  Flag
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
import UserWarningBanner from './UserWarningBanner';

interface Activity {
  id: string;
  activity: {
    id: string;
    title: string;
    display_title?: string;
    description: string | null;
    category_tags: string[];
    difficulty: number;
    image_url: string | null;
  };
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
  is_custom?: boolean;
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

interface Warning {
  id: string;
  action_type: string;
  reason: string;
  created_at: string;
  moderator_username: string;
  post_id?: string;
  has_appeal: boolean;
  appeal_status?: string;
}

interface Suspension {
  id: string;
  reason: string;
  start_date: string;
  end_date?: string;
  is_permanent: boolean;
  created_at: string;
  moderator_username: string;
  days_remaining?: number;
  has_appeal: boolean;
  appeal_status?: string;
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
  const [showHiddenActivities, setShowHiddenActivities] = useState(false);
  const [customActivities, setCustomActivities] = useState<any[]>([]);
  const [customActivityStats, setCustomActivityStats] = useState({ total: 0, published: 0 });
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadModerationCount, setUnreadModerationCount] = useState(0);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [suspension, setSuspension] = useState<Suspension | null>(null);
  const [hideWarningBanner, setHideWarningBanner] = useState(false);

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
      loadCustomActivities();
      checkPendingRequests();
      checkUnreadModerationMessages();
      loadWarningsAndSuspensions();
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

  const loadWarningsAndSuspensions = async () => {
    try {
      // Load warnings
      const { data: warningsData, error: warningsError } = await supabase
        .rpc('get_user_warnings', { user_id: userId });
      
      if (warningsError) throw warningsError;
      setWarnings(warningsData || []);
      
      // Load suspension info
      const { data: suspensionData, error: suspensionError } = await supabase
        .rpc('get_user_suspension_info', { user_id: userId });
      
      if (suspensionError) throw suspensionError;
      
      if (suspensionData && suspensionData.length > 0) {
        // Check if suspension is still active
        const currentSuspension = suspensionData[0];
        
        if (currentSuspension.is_permanent || 
            (currentSuspension.end_date && new Date(currentSuspension.end_date) > new Date())) {
          setSuspension(currentSuspension);
        } else {
          setSuspension(null);
        }
      } else {
        setSuspension(null);
      }
    } catch (err) {
      console.error('Error loading warnings and suspensions:', err);
    }
  };

  const loadCustomActivities = async () => {
    try {
      // Load custom activities created by the user
      const { data, error: activitiesError } = await supabase
        .from('custom_activities')
        .select('*, activity_posts(id, visibility)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;
      
      // Count published activities (those that have been approved for the main list)
      const publishedCount = data?.filter(a => a.moderation_status === 'approved' && a.proposed_for_main_list).length || 0;
      
      setCustomActivities(data || []);
      setCustomActivityStats({
        total: data?.length || 0,
        published: publishedCount
      });
    } catch (err) {
      console.error('Error loading custom activities:', err);
      setError('Failed to load custom activities');
    }
  };

  const handleEditComplete = () => {
    setEditing(false);
    loadProfile();
  };

  const canCreateContent = () => {
    if (isDemoMode) return true;
    if (!profile) return false;
    
    // Check if user is suspended or banned
    return !profile.is_suspended && !profile.is_banned;
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
      {/* Warning Banner */}
      {!hideWarningBanner && (warnings.length > 0 || suspension) && (
        <UserWarningBanner 
          warnings={warnings}
          suspension={suspension || undefined}
          userId={userId || ''}
          onClose={() => setHideWarningBanner(true)}
        />
      )}

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
                {customActivityStats.total > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Plus className="h-4 w-4" />
                    <span>Activities Created: {customActivityStats.total} total | {customActivityStats.published} published</span>
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
                {profile?.is_suspended && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Clock className="h-4 w-4" />
                    <span>Account Suspended</span>
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
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">My Activities</h2>
                  <button
                    onClick={() => setShowHiddenActivities(!showHiddenActivities)}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    {showHiddenActivities ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Hide Private
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Show All
                      </>
                    )}
                  </button>
                </div>
                
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
                        disabled={!canCreateContent()}
                      >
                        Browse Activities
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Custom Activities Section */}
                {customActivities.length > 0 && (
                  <div className="mt-10">
                    <h3 className="text-xl font-bold mb-4">My Created Activities</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      {customActivities
                        .filter(activity => {
                          // Filter based on visibility if not showing hidden
                          if (!showHiddenActivities) {
                            const postVisibility = activity.activity_posts?.[0]?.visibility;
                            return !postVisibility || postVisibility === 'public';
                          }
                          return true;
                        })
                        .map((activity) => (
                          <div key={activity.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{activity.display_title || activity.title}</h3>
                                <div className="flex items-center gap-1">
                                  {activity.proposed_for_main_list && (
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      activity.moderation_status === 'approved' ? 'bg-green-100 text-green-700' :
                                      activity.moderation_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                      activity.moderation_status === 'requested_changes' ? 'bg-blue-100 text-blue-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {activity.moderation_status === 'approved' ? 'Published' :
                                       activity.moderation_status === 'rejected' ? 'Rejected' :
                                       activity.moderation_status === 'requested_changes' ? 'Changes Requested' :
                                       'Pending Review'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {activity.category_tags?.map((tag: string) => (
                                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              
                              {activity.activity_posts && activity.activity_posts.length > 0 && (
                                <div className="text-sm text-gray-500 mb-2">
                                  Visibility: {activity.activity_posts[0].visibility === 'public' ? 'Public' : 
                                              activity.activity_posts[0].visibility === 'friends' ? 'Friends Only' : 
                                              'Private'}
                                </div>
                              )}
                              
                              {activity.moderation_status === 'requested_changes' && activity.moderator_notes && (
                                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                                  <p className="text-sm text-blue-700">
                                    <span className="font-medium">Requested Changes:</span> {activity.moderator_notes}
                                  </p>
                                </div>
                              )}
                              
                              {activity.moderation_status === 'rejected' && activity.moderator_notes && (
                                <div className="bg-red-50 p-3 rounded-lg mb-3">
                                  <p className="text-sm text-red-700">
                                    <span className="font-medium">Rejection Reason:</span> {activity.moderator_notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
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
                        className="relative inline-flex h-