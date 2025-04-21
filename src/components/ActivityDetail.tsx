import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ActivityPosts from './ActivityPosts';
import AddToListButton from './AddToListButton';
import RateActivityButton from './RateActivityButton';
import RatingDisplay from './RatingDisplay';
import DetailedRatings from './DetailedRatings';
import AdPlaceholder from './AdPlaceholder';
import ActivityAdBlock from './ActivityAdBlock';
import MessageSupplierButton from './MessageSupplierButton';
import { shareActivity, isNative } from '../lib/capacitor';
import { 
  Loader2, 
  MapPin, 
  Tag, 
  AlertTriangle, 
  Building2, 
  ArrowRight, 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  Heart, 
  Target, 
  Users,
  ChevronDown, 
  ChevronUp,
  Zap,
  Palette,
  Dumbbell,
  BookOpen,
  Globe,
  MessageSquare,
  Share2
} from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  category_id: string;
  difficulty: number;
  created_at: string;
  updated_at: string;
  is_location_specific: boolean;
  category_tags: string[];
  video_url: string | null;
  image_url: string | null;
  unsplash_keywords?: string;
  // Public ratings
  rating: number;
  cost: number;
  enjoyment: number;
  time: number;
  popularity: number;
  // Detailed characteristics
  adventurousness: number;
  creativity: number;
  fitness: number;
  learning: number;
  impact: number;
  solo_social: 'solo' | 'social' | 'either';
  indoor_outdoor: 'indoor' | 'outdoor' | 'either';
  planning_required: number;
  risk_level: number;
}

interface ActivityStats {
  total_users: number;
  avg_difficulty: number;
  avg_cost: number;
  avg_enjoyment: number;
}

interface Supplier {
  id: string;
  user_id: string;
  supplier_name: string;
  logo_url?: string;
  approved: boolean;
}

const RatingBar = ({ value, icon, label }: { value: number | null; icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-4">
    <div className="w-8 flex-shrink-0 text-gray-500">{icon}</div>
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{(value || 0).toFixed(1)}/5</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${((value || 0) / 5) * 100}%` }}
        />
      </div>
    </div>
  </div>
);

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    loadActivityAndStats();
    loadRelatedSuppliers();
  }, [id]);

  const loadActivityAndStats = async () => {
    try {
      if (!id) {
        throw new Error('Activity ID is required');
      }

      // Load activity details
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', id)
        .single();

      if (activityError) throw activityError;

      // Load activity stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_activity_stats', { activity_id: id })
        .single();

      if (statsError) throw statsError;

      setActivity(activityData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedSuppliers = async () => {
    if (!id) return;
    
    try {
      // Find suppliers that have ads related to this activity
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, user_id, supplier_name, logo_url, approved')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error loading related suppliers:', err);
    }
  };

  const getUnsplashImage = () => {
    const keywords = activity?.unsplash_keywords || activity?.title;
    return `https://source.unsplash.com/1600x900/?${encodeURIComponent(keywords || '')}`;
  };

  const handleBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate('/activities');
    }
  };

  const handleRatingUpdated = () => {
    loadActivityAndStats();
  };

  const handleShare = async () => {
    if (!activity) return;
    
    setIsSharing(true);
    try {
      await shareActivity(activity.id, activity.title);
    } catch (error) {
      console.error('Error sharing activity:', error);
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error || 'Activity not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
      >
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Column */}
        <div className="lg:w-2/3 space-y-6">
          {/* Hero Image */}
          <div className="relative rounded-xl overflow-hidden aspect-video">
            <img
              src={activity.image_url || getUnsplashImage()}
              alt={activity.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getUnsplashImage();
              }}
            />
            {activity.is_location_specific && (
              <div className="absolute top-4 right-4 bg-white/90 px-3 py-1.5 rounded-full flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Location-based</span>
              </div>
            )}
          </div>

          {/* Title and Description */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold">{activity.title}</h1>
              {isNative && (
                <button 
                  onClick={handleShare}
                  disabled={isSharing}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              {activity.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {activity.category_tags?.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <AddToListButton activityId={activity.id} />
            </div>
          </div>

          {/* Community Posts */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Community Updates</h2>
            </div>
            <div className="p-6">
              <ActivityPosts activity={activity} />
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="lg:w-1/3 space-y-6">
          {/* Public Ratings */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Activity Ratings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Overall Rating</span>
                <RatingDisplay 
                  value={activity.rating} 
                  reviewCount={stats?.total_users || 0} 
                  size="md"
                />
              </div>
              
              <div className="space-y-3 mt-4">
                <RatingBar
                  value={activity.difficulty}
                  icon={<Target className="h-5 w-5" />}
                  label="Difficulty"
                />
                <RatingBar
                  value={activity.cost}
                  icon={<DollarSign className="h-5 w-5" />}
                  label="Cost"
                />
                <RatingBar
                  value={activity.time}
                  icon={<Clock className="h-5 w-5" />}
                  label="Time Required"
                />
                <RatingBar
                  value={activity.enjoyment}
                  icon={<Heart className="h-5 w-5" />}
                  label="Enjoyment"
                />
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-5 w-5" />
                  <span>People added this</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {stats?.total_users || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Rate This Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Your Rating</h2>
            <RateActivityButton 
              activityId={activity.id} 
              onRatingUpdated={handleRatingUpdated}
            />
          </div>

          {/* Detailed Characteristics */}
          {activity.adventurousness && activity.creativity && activity.fitness && activity.learning && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between"
              >
                <h2 className="text-lg font-semibold">Detailed Characteristics</h2>
                {showDetails ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {showDetails && (
                <div className="space-y-3 mt-4">
                  <RatingBar
                    value={activity.adventurousness}
                    icon={<Zap className="h-5 w-5" />}
                    label="Adventurousness"
                  />
                  <RatingBar
                    value={activity.creativity}
                    icon={<Palette className="h-5 w-5" />}
                    label="Creativity"
                  />
                  <RatingBar
                    value={activity.fitness}
                    icon={<Dumbbell className="h-5 w-5" />}
                    label="Fitness"
                  />
                  <RatingBar
                    value={activity.learning}
                    icon={<BookOpen className="h-5 w-5" />}
                    label="Learning"
                  />
                  <RatingBar
                    value={activity.impact}
                    icon={<Globe className="h-5 w-5" />}
                    label="Impact"
                  />
                </div>
              )}
            </div>
          )}

          {/* Activity-specific Ads */}
          <ActivityAdBlock 
            activityId={activity.id} 
            activityTitle={activity.title}
            activityTags={activity.category_tags}
          />

          {/* Generic Ad Placeholder (fallback) */}
          <AdPlaceholder activityTags={activity.category_tags} />

          {/* Supplier Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">
                  Run a business that offers this activity?
                </h2>
                <p className="text-gray-600 mb-4">
                  Get in front of people who want to do this. Contact us to promote your service.
                </p>
                <Link
                  to={`/contact-supplier?activity_id=${activity.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Us
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Related Suppliers */}
          {suppliers.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Related Suppliers</h2>
              <div className="space-y-4">
                {suppliers.map(supplier => (
                  <div key={supplier.id} className="flex items-center gap-3">
                    {supplier.logo_url ? (
                      <img 
                        src={supplier.logo_url} 
                        alt={supplier.supplier_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{supplier.supplier_name}</h3>
                    </div>
                    <MessageSupplierButton 
                      supplierId={supplier.user_id}
                      activityId={activity.id}
                      activityTitle={activity.title}
                      buttonClassName="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                      iconOnly={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}