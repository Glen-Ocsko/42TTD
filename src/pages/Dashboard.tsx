import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  ChevronRight,
  ChevronDown, 
  Target,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  X,
  Users2,
  Edit2
} from 'lucide-react';
import ActivityStatusDropdown from '../components/ActivityStatusDropdown';
import ProgressTracker from '../components/ProgressTracker';
import RateActivityButton from '../components/RateActivityButton';
import { format } from 'date-fns';

interface Activity {
  id: string;
  title: string;
  display_title?: string;
  description: string | null;
  category_tags: string[];
  difficulty: number;
  image_url: string | null;
  cost: number;
  enjoyment: number;
  time: number;
  rating: number;
  activity_posts?: {
    visibility: 'public' | 'friends' | 'private';
  }[];
  proposed_for_main_list?: boolean;
  moderation_status?: 'approved' | 'rejected' | 'requested_changes';
  moderator_notes?: string;
}

interface UserActivity {
  id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  created_at: string;
  activity: Activity;
  rating_difficulty: number | null;
  rating_cost: number | null;
  rating_enjoyment: number | null;
}

interface Section {
  id: 'not-started' | 'in-progress' | 'completed';
  title: string;
  icon: React.ReactNode;
  status: string;
}

const sections: Section[] = [
  { 
    id: 'not-started', 
    title: '🎯 Yet to Start', 
    icon: <Target className="h-5 w-5 text-gray-400" />,
    status: 'not_started'
  },
  { 
    id: 'in-progress', 
    title: '🚀 In Progress', 
    icon: <Clock className="h-5 w-5 text-blue-500" />,
    status: 'in_progress'
  },
  { 
    id: 'completed', 
    title: '✅ Completed', 
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    status: 'completed'
  }
];

export default function Dashboard() {
  const { userId, isDemoMode } = useCurrentUser();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['not-started', 'in-progress']);
  const [filteredStatus, setFilteredStatus] = useState<string | null>(null);
  const [showHiddenActivities, setShowHiddenActivities] = useState(false);
  const [customActivities, setCustomActivities] = useState<Activity[]>([]);
  const [customActivityStats, setCustomActivityStats] = useState({ total: 0, published: 0 });

  useEffect(() => {
    loadUserActivities();
    loadCustomActivities();
  }, [userId]);

  const loadUserActivities = async () => {
    try {
      if (!userId) return;

      const { data, error: fetchError } = await supabase
        .from('user_activities')
        .select(`
          *,
          activity:activities (
            id,
            title,
            description,
            category_tags,
            difficulty,
            image_url,
            cost,
            enjoyment,
            time,
            rating
          )
        `)
        .eq('user_id', isDemoMode ? '00000000-0000-0000-0000-000000000000' : userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setActivities(data || []);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const filterByStatus = (status: string | null) => {
    setFilteredStatus(status);
    if (status) {
      const sectionId = status === 'not_started' ? 'not-started' : 
                        status === 'in_progress' ? 'in-progress' : 'completed';
      
      if (!expandedSections.includes(sectionId)) {
        setExpandedSections(prev => [...prev, sectionId]);
      }
    }
  };

  const truncateDescription = (text: string | null, maxLength: number = 180) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    const nearestPeriod = text.indexOf('.', maxLength - 30);
    const nearestQuestion = text.indexOf('?', maxLength - 30);
    const nearestExclamation = text.indexOf('!', maxLength - 30);
    
    let cutoff = maxLength;
    if (nearestPeriod > 0 && nearestPeriod < maxLength + 30) {
      cutoff = nearestPeriod + 1;
    } else if (nearestQuestion > 0 && nearestQuestion < maxLength + 30) {
      cutoff = nearestQuestion + 1;
    } else if (nearestExclamation > 0 && nearestExclamation < maxLength + 30) {
      cutoff = nearestExclamation + 1;
    }
    
    return text.substring(0, cutoff) + (cutoff < text.length ? '...' : '');
  };

  const ActivityCard = ({ activity }: { activity: UserActivity }) => {
    const isEligibleForRating = activity.status === 'in_progress' || activity.status === 'completed';
    const truncatedDescription = truncateDescription(activity.activity.description);
    const hasFullDescription = activity.activity.description && 
                              activity.activity.description.length > truncatedDescription.length;

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        {activity.activity.image_url && (
          <div className="relative mb-4 group">
            <Link to={`/activities/${activity.activity.id}`} title="View Full Details">
              <img
                src={activity.activity.image_url}
                alt={activity.activity.title}
                className="w-full h-48 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium">
                  View Full Details
                </span>
              </div>
            </Link>
          </div>
        )}
        
        <div className="flex items-start justify-between mb-2">
          <Link to={`/activities/${activity.activity.id}`} className="hover:text-blue-600 transition-colors">
            <h3 className="text-lg font-semibold">{activity.activity.display_title || activity.activity.title}</h3>
          </Link>
        </div>

        {activity.activity.description && (
          <p className="text-gray-600 text-sm mb-3">
            {truncatedDescription}
            {hasFullDescription && (
              <Link to={`/activities/${activity.activity.id}`} className="ml-1 text-blue-600 hover:text-blue-700">
                Read more
              </Link>
            )}
          </p>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Status:</label>
            <ActivityStatusDropdown
              activityId={activity.id}
              status={activity.status}
              onChange={(newStatus) => {
                setActivities(prev => prev.map(a => 
                  a.id === activity.id ? { ...a, status: newStatus } : a
                ));
              }}
            />
          </div>

          {isEligibleForRating ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Your Rating:</span>
              <RateActivityButton 
                activityId={activity.activity.id} 
                onRatingUpdated={loadUserActivities}
              />
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Start or complete this activity to leave a rating.
            </div>
          )}

          <div className="text-sm text-gray-500">
            Added {format(new Date(activity.created_at), 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activityCounts = {
    not_started: activities.filter(a => a.status === 'not_started').length,
    in_progress: activities.filter(a => a.status === 'in_progress').length,
    completed: activities.filter(a => a.status === 'completed').length
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Your Progress
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-blue-600">
                {activityCounts.completed}
              </span>
              <span className="text-gray-600">of</span>
              <span className="text-2xl font-bold text-gray-700">
                {activities.length}
              </span>
              <span className="text-gray-600">activities completed</span>
            </div>
            {customActivityStats.total > 0 && (
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <span>Activities Created: {customActivityStats.total} total | {customActivityStats.published} published</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => filterByStatus('completed')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                filteredStatus === 'completed' 
                  ? 'bg-green-100 text-green-700 font-medium' 
                  : 'bg-white/80 hover:bg-white text-gray-600'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{activityCounts.completed}</span>
              <span className="hidden sm:inline">Completed</span>
            </button>
            
            <button 
              onClick={() => filterByStatus('in_progress')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                filteredStatus === 'in_progress' 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'bg-white/80 hover:bg-white text-gray-600'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{activityCounts.in_progress}</span>
              <span className="hidden sm:inline">In Progress</span>
            </button>
            
            <button 
              onClick={() => filterByStatus('not_started')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                filteredStatus === 'not_started' 
                  ? 'bg-gray-200 text-gray-700 font-medium' 
                  : 'bg-white/80 hover:bg-white text-gray-600'
              }`}
            >
              <Target className="h-4 w-4" />
              <span>{activityCounts.not_started}</span>
              <span className="hidden sm:inline">Not Started</span>
            </button>
            
            {filteredStatus && (
              <button 
                onClick={() => filterByStatus(null)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm bg-white/80 hover:bg-white text-gray-600"
              >
                <X className="h-4 w-4" />
                <span>Clear Filter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHiddenActivities(!showHiddenActivities)}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            {showHiddenActivities ? (
              <>
                <EyeOff className="h-5 w-5" />
                Hide Private
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                Show All
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/activities')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Add Activities
          </button>
          <button
            onClick={() => navigate('/start')}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <Sparkles className="h-5 w-5" />
            Need some inspiration?
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      <div className="space-y-6">
        {sections.map((section) => {
          const sectionActivities = activities.filter(
            (a) => a.status === section.status && 
                  (filteredStatus === null || a.status === filteredStatus)
          );
          
          if (filteredStatus !== null && section.status !== filteredStatus) {
            return null;
          }
          
          const isExpanded = expandedSections.includes(section.id);

          return (
            <div key={section.id} className="bg-gray-50 rounded-lg p-4">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  {section.icon}
                  <h2 className="text-xl font-semibold">
                    {section.title} ({sectionActivities.length})
                  </h2>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
                  {sectionActivities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                  {sectionActivities.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No activities in this section
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Custom Activities Section */}
        {customActivities.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">My Created Activities</h3>
              <button
                onClick={() => setShowHiddenActivities(!showHiddenActivities)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                {showHiddenActivities ? (
                  <>
                    <EyeOff className="h-5 w-5" />
                    Hide Private
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    Show All
                  </>
                )}
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {customActivities
                .filter(activity => {
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
                          {activity.moderation_status !== 'approved' && (
                            <Link 
                              to={`/edit-activity/${activity.id}`}
                              className="p-1 text-gray-500 hover:text-blue-600"
                              title="Edit activity"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>
                          )}
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
    </div>
  );
}