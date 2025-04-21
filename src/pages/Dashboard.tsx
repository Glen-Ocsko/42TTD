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
  ArrowRight
} from 'lucide-react';
import ActivityStatusDropdown from '../components/ActivityStatusDropdown';
import ProgressTracker from '../components/ProgressTracker';
import RateActivityButton from '../components/RateActivityButton';
import { format } from 'date-fns';

interface Activity {
  id: string;
  title: string;
  description: string | null;
  category_tags: string[];
  difficulty: number;
  image_url: string | null;
  cost: number;
  enjoyment: number;
  time: number;
  rating: number;
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

  useEffect(() => {
    loadUserActivities();
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
      
      // Ensure the section is expanded
      if (!expandedSections.includes(sectionId)) {
        setExpandedSections(prev => [...prev, sectionId]);
      }
    }
  };

  const truncateDescription = (text: string | null, maxLength: number = 180) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    // Find the nearest sentence end within reasonable distance of maxLength
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
        {/* Image - Clickable to navigate to activity detail */}
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
            <h3 className="text-lg font-semibold">{activity.activity.title}</h3>
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

  // Count activities by status
  const activityCounts = {
    not_started: activities.filter(a => a.status === 'not_started').length,
    in_progress: activities.filter(a => a.status === 'in_progress').length,
    completed: activities.filter(a => a.status === 'completed').length
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Compact Progress Tracker */}
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
          // Filter activities by section status and any additional filter
          const sectionActivities = activities.filter(
            (a) => a.status === section.status && 
                  (filteredStatus === null || a.status === filteredStatus)
          );
          
          // If filtering is active and this section doesn't match, hide it
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
      </div>
    </div>
  );
}