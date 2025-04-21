import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ModerationStats, ModerationAction, UserSuspension } from '../types/moderation';
import { 
  Shield, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Ban, 
  Trash2, 
  User, 
  Flag, 
  MessageSquare, 
  ArrowRight, 
  BarChart2,
  Users,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export default function ModerationDashboard() {
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const [stats, setStats] = useState<ModerationStats>({
    total_reports: 0,
    open_reports: 0,
    resolved_reports: 0,
    dismissed_reports: 0,
    warnings_issued: 0,
    posts_removed: 0,
    users_suspended: 0,
    users_banned: 0
  });
  const [recentActions, setRecentActions] = useState<ModerationAction[]>([]);
  const [activeSuspensions, setActiveSuspensions] = useState<UserSuspension[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    checkModeratorStatus();
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (isModerator) {
      loadDashboardData();
    }
  }, [isModerator]);

  const checkModeratorStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_moderator, is_admin')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (!data.is_moderator && !data.is_admin) {
        navigate('/');
        return;
      }
      
      setIsModerator(true);
    } catch (err) {
      console.error('Error checking moderator status:', err);
      setError('Failed to verify moderator status');
      navigate('/');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load moderation stats
      const { data: reportsData, error: reportsError } = await supabase
        .from('post_reports')
        .select('status', { count: 'exact' });
      
      if (reportsError) throw reportsError;
      
      // Load recent moderation actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('moderation_actions')
        .select(`
          *,
          moderator:profiles!moderation_actions_moderator_user_id_fkey (
            username,
            avatar_url
          ),
          target_user:profiles!moderation_actions_target_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (actionsError) throw actionsError;
      
      // Load active suspensions
      const { data: suspensionsData, error: suspensionsError } = await supabase
        .from('user_suspensions')
        .select(`
          *,
          moderator:profiles!user_suspensions_created_by_fkey (
            username,
            avatar_url
          )
        `)
        .or('end_date.gt.now(),is_permanent.eq.true')
        .order('created_at', { ascending: false });
      
      if (suspensionsError) throw suspensionsError;
      
      // Calculate stats
      const totalReports = reportsData?.length || 0;
      const openReports = reportsData?.filter(r => r.status === 'pending' || r.status === null).length || 0;
      const resolvedReports = reportsData?.filter(r => r.status === 'resolved').length || 0;
      const dismissedReports = reportsData?.filter(r => r.status === 'dismissed').length || 0;
      
      const warningsIssued = actionsData?.filter(a => a.action_type === 'warning').length || 0;
      const postsRemoved = actionsData?.filter(a => a.action_type === 'post_removal').length || 0;
      const usersSuspended = suspensionsData?.filter(s => !s.is_permanent).length || 0;
      const usersBanned = suspensionsData?.filter(s => s.is_permanent).length || 0;
      
      setStats({
        total_reports: totalReports,
        open_reports: openReports,
        resolved_reports: resolvedReports,
        dismissed_reports: dismissedReports,
        warnings_issued: warningsIssued,
        posts_removed: postsRemoved,
        users_suspended: usersSuspended,
        users_banned: usersBanned
      });
      
      setRecentActions(actionsData || []);
      setActiveSuspensions(suspensionsData || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'post_removal':
        return <Trash2 className="h-5 w-5 text-red-500" />;
      case 'suspension':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'ban':
        return <Ban className="h-5 w-5 text-red-600" />;
      case 'report_dismissed':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'report_resolved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'escalated':
        return <ArrowRight className="h-5 w-5 text-purple-500" />;
      default:
        return <Shield className="h-5 w-5 text-blue-500" />;
    }
  };

  const getActionTitle = (actionType: string) => {
    switch (actionType) {
      case 'warning':
        return 'Warning Issued';
      case 'post_removal':
        return 'Post Removed';
      case 'suspension':
        return 'User Suspended';
      case 'ban':
        return 'User Banned';
      case 'report_dismissed':
        return 'Report Dismissed';
      case 'report_resolved':
        return 'Report Resolved';
      case 'escalated':
        return 'Escalated to Admin';
      default:
        return 'Action Taken';
    }
  };

  if (!isModerator) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
        </div>
        
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Flag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Open Reports</h3>
                  <p className="text-2xl font-bold">{stats.open_reports}</p>
                </div>
              </div>
              <Link 
                to="/moderation/queue" 
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                View Queue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Warnings Issued</h3>
                  <p className="text-2xl font-bold">{stats.warnings_issued}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Last 30 days
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Active Suspensions</h3>
                  <p className="text-2xl font-bold">{stats.users_suspended}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Currently active
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Ban className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Banned Users</h3>
                  <p className="text-2xl font-bold">{stats.users_banned}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Total bans
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Actions */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-bold">Recent Moderation Actions</h2>
              </div>
              
              <div className="overflow-y-auto max-h-96">
                {recentActions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No recent moderation actions
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentActions.map((action) => (
                      <div key={action.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-gray-100">
                            {getActionIcon(action.action_type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium">{getActionTitle(action.action_type)}</h3>
                              <span className="text-xs text-gray-500">
                                {format(new Date(action.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            
                            <div className="text-sm mb-2">
                              <span className="font-medium">Target:</span>{' '}
                              <Link 
                                to={`/users/${action.target_user?.username}`}
                                className="text-blue-600 hover:underline"
                              >
                                {action.target_user?.username || 'Unknown User'}
                              </Link>
                            </div>
                            
                            <div className="text-sm mb-2">
                              <span className="font-medium">Moderator:</span>{' '}
                              {action.moderator?.username || 'System'}
                            </div>
                            
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Reason:</span>{' '}
                              <span className="line-clamp-2">{action.reason}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Active Suspensions */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-bold">Active Suspensions & Bans</h2>
              </div>
              
              <div className="overflow-y-auto max-h-96">
                {activeSuspensions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No active suspensions or bans
                  </div>
                ) : (
                  <div className="divide-y">
                    {activeSuspensions.map((suspension) => (
                      <div key={suspension.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-gray-100">
                            {suspension.is_permanent ? (
                              <Ban className="h-5 w-5 text-red-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-orange-500" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium">
                                {suspension.is_permanent ? 'Permanent Ban' : 'Temporary Suspension'}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {format(new Date(suspension.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                            
                            <div className="text-sm mb-2">
                              <span className="font-medium">User ID:</span>{' '}
                              {suspension.user_id}
                            </div>
                            
                            {!suspension.is_permanent && suspension.end_date && (
                              <div className="text-sm mb-2">
                                <span className="font-medium">Ends:</span>{' '}
                                {format(new Date(suspension.end_date), 'MMM d, yyyy')}
                              </div>
                            )}
                            
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Reason:</span>{' '}
                              <span className="line-clamp-2">{suspension.reason}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/moderation/queue"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <Flag className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-bold">Moderation Queue</h3>
              </div>
              <p className="text-gray-600">
                Review and take action on reported content
              </p>
            </Link>
            
            <Link
              to="/users"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-bold">User Management</h3>
              </div>
              <p className="text-gray-600">
                View and manage user profiles
              </p>
            </Link>
            
            <Link
              to="/moderation/settings"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <BarChart2 className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-bold">Moderation Settings</h3>
              </div>
              <p className="text-gray-600">
                Configure moderation preferences and templates
              </p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}