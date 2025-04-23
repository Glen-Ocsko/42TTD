import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase } from '../lib/supabase';
import { 
  Award, 
  Flame, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  Target, 
  Sparkles,
  Image as ImageIcon,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfileStatsProps {
  userId?: string;
  isOwnProfile?: boolean;
}

export default function ProfileStats({ userId, isOwnProfile = true }: ProfileStatsProps) {
  const { userId: currentUserId, isDemoMode } = useCurrentUser();
  const effectiveUserId = userId || currentUserId;
  
  const [stats, setStats] = useState({
    totalActivities: 0,
    completedActivities: 0,
    inProgressActivities: 0,
    totalPosts: 0,
    totalReplies: 0,
    createdActivities: 0,
    approvedActivities: 0,
    streak: 0,
    mediaCount: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [media, setMedia] = useState<string[]>([]);
  
  useEffect(() => {
    if (effectiveUserId) {
      loadStats();
    }
  }, [effectiveUserId]);
  
  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Load user activities stats
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('user_activities')
        .select('status')
        .eq('user_id', effectiveUserId);
      
      if (activitiesError) throw activitiesError;
      
      const totalActivities = activitiesData?.length || 0;
      const completedActivities = activitiesData?.filter(a => a.status === 'completed').length || 0;
      const inProgressActivities = activitiesData?.filter(a => a.status === 'in_progress').length || 0;
      
      // Load posts stats
      const { data: postsData, error: postsError } = await supabase
        .from('activity_posts')
        .select('id, image_url')
        .eq('user_id', effectiveUserId);
      
      if (postsError) throw postsError;
      
      const totalPosts = postsData?.length || 0;
      
      // Load custom activities stats
      const { data: customActivitiesData, error: customActivitiesError } = await supabase
        .from('custom_activities')
        .select('id, moderation_status, proposed_for_main_list')
        .eq('user_id', effectiveUserId);
      
      if (customActivitiesError) throw customActivitiesError;
      
      const createdActivities = customActivitiesData?.length || 0;
      const approvedActivities = customActivitiesData?.filter(
        a => a.moderation_status === 'approved' && a.proposed_for_main_list
      ).length || 0;
      
      // Get media from posts
      const mediaUrls = postsData
        ?.filter(post => post.image_url)
        .map(post => post.image_url)
        .filter(Boolean) as string[];
      
      setMedia(mediaUrls || []);
      
      // Calculate streak (placeholder for now)
      // In a real implementation, this would check for consecutive days with completed activities
      const streak = isDemoMode ? 3 : Math.floor(Math.random() * 5);
      
      setStats({
        totalActivities,
        completedActivities,
        inProgressActivities,
        totalPosts,
        totalReplies: 0, // Placeholder for now
        createdActivities,
        approvedActivities,
        streak,
        mediaCount: mediaUrls?.length || 0
      });
    } catch (err) {
      console.error('Error loading profile stats:', err);
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600" />
          Activity Stats
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-blue-600">{stats.totalActivities}</span>
            <span className="text-sm text-gray-600">Total Activities</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-green-600">{stats.completedActivities}</span>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-amber-600">{stats.inProgressActivities}</span>
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-purple-600">{stats.totalPosts}</span>
            <span className="text-sm text-gray-600">Posts</span>
          </div>
        </div>
        
        {stats.createdActivities > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Created Activities</span>
              <span className="font-medium">{stats.createdActivities}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Published</span>
              <span className="font-medium">{stats.approvedActivities}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Streak Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Activity Streak
        </h2>
        
        {stats.streak > 0 ? (
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-full">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <div className="text-xl font-bold">{stats.streak}-day streak</div>
              <p className="text-sm text-gray-600">Keep it going!</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <div className="font-medium text-gray-700">No active streak</div>
              <p className="text-sm text-gray-600">Complete an activity today to start!</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Media Gallery */}
      {media.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              Media Gallery
            </h2>
            
            {isOwnProfile && (
              <Link 
                to="/profile?tab=media" 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {media.slice(0, 6).map((url, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden">
                <img 
                  src={url} 
                  alt={`User media ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/150?text=Image+Error';
                  }}
                />
              </div>
            ))}
          </div>
          
          {media.length > 6 && (
            <div className="mt-3 text-center">
              <Link 
                to="/profile?tab=media" 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                +{media.length - 6} more
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* Achievements Section (Placeholder) */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Achievements
        </h2>
        
        <div className="space-y-3">
          {stats.completedActivities > 0 && (
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium">First Completion</div>
                <p className="text-sm text-gray-600">Completed your first activity</p>
              </div>
            </div>
          )}
          
          {stats.totalActivities >= 10 && (
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Goal Setter</div>
                <p className="text-sm text-gray-600">Added 10+ activities to your list</p>
              </div>
            </div>
          )}
          
          {stats.totalPosts >= 5 && (
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">Community Contributor</div>
                <p className="text-sm text-gray-600">Shared 5+ posts with the community</p>
              </div>
            </div>
          )}
          
          {stats.streak >= 3 && (
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="font-medium">On Fire</div>
                <p className="text-sm text-gray-600">Maintained a 3+ day streak</p>
              </div>
            </div>
          )}
          
          {stats.approvedActivities > 0 && (
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="font-medium">Activity Creator</div>
                <p className="text-sm text-gray-600">Had an activity published to the main list</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}