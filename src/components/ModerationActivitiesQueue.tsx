import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { 
  Shield, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Edit2, 
  User, 
  Filter, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog } from '@headlessui/react';

interface CustomActivity {
  id: string;
  user_id: string;
  title: string;
  display_title?: string;
  description: string;
  category_tags: string[];
  created_at: string;
  proposed_for_main_list: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected' | 'requested_changes';
  moderator_notes?: string;
  user: {
    username: string;
    avatar_url: string | null;
  };
}

export default function ModerationActivitiesQueue() {
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<CustomActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CustomActivity | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'request_changes' | 'reject'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending'>('pending');
  const [expandedActivities, setExpandedActivities] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    checkModeratorStatus();
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (isModerator) {
      loadActivities();
    }
  }, [isModerator, filterStatus]);

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

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('custom_activities')
        .select(`
          *,
          user:profiles!custom_activities_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('proposed_for_main_list', true)
        .order('created_at', { ascending: false });
      
      // Apply filter if needed
      if (filterStatus === 'pending') {
        query = query.eq('moderation_status', 'pending');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedActivity) return;
    
    try {
      setProcessingAction(true);
      
      // Update the custom activity status
      const { error: updateError } = await supabase
        .from('custom_activities')
        .update({
          moderation_status: actionType === 'approve' ? 'approved' : 
                            actionType === 'reject' ? 'rejected' : 'requested_changes',
          moderator_notes: actionReason
        })
        .eq('id', selectedActivity.id);
      
      if (updateError) throw updateError;
      
      // If approving, copy to main activities table
      if (actionType === 'approve') {
        const { error: insertError } = await supabase
          .from('activities')
          .insert({
            title: selectedActivity.title,
            display_title: selectedActivity.display_title || selectedActivity.title,
            description: selectedActivity.description,
            category_tags: selectedActivity.category_tags,
            submitted_by: selectedActivity.user_id,
            status: 'active'
          });
        
        if (insertError) throw insertError;
      }
      
      // Send notification to user
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: selectedActivity.user_id,
          message_text: getNotificationMessage(actionType, actionReason),
          from_moderator: true
        });
      
      if (messageError) throw messageError;
      
      setActionSuccess(true);
      
      // Reset form after successful action
      setTimeout(() => {
        setShowActionModal(false);
        setSelectedActivity(null);
        setActionType('approve');
        setActionReason('');
        setActionSuccess(false);
        loadActivities();
      }, 2000);
    } catch (err) {
      console.error('Error taking action:', err);
      setError('Failed to process activity');
    } finally {
      setProcessingAction(false);
    }
  };

  const getNotificationMessage = (action: string, reason: string) => {
    switch (action) {
      case 'approve':
        return `Your activity "${selectedActivity?.title}" has been approved and added to our official activities list! ${reason ? `Note from moderator: ${reason}` : ''}`;
      case 'reject':
        return `Your activity "${selectedActivity?.title}" was not approved for the official activities list. ${reason ? `Reason: ${reason}` : ''}`;
      case 'request_changes':
        return `Your activity "${selectedActivity?.title}" needs some changes before it can be approved. ${reason ? `Requested changes: ${reason}` : ''}`;
      default:
        return `There has been an update regarding your activity "${selectedActivity?.title}".`;
    }
  };

  const toggleActivityExpansion = (activityId: string) => {
    setExpandedActivities(prev => 
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      case 'requested_changes':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <Edit2 className="h-3 w-3" />
            Changes Requested
          </span>
        );
      default:
        return null;
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
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Activity Moderation Queue</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending')}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Submissions</option>
            <option value="pending">Pending Review</option>
          </select>
        </div>
        
        <button
          onClick={loadActivities}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Activities to Review</h2>
          <p className="text-gray-600">
            There are currently no user-submitted activities that match your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-4 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(activity.moderation_status)}
                      <span className="text-sm text-gray-500">
                        Submitted {format(new Date(activity.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h3 className="font-medium">
                      {activity.display_title || activity.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <User className="h-4 w-4" />
                      <span>By {activity.user.username}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActivityExpansion(activity.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedActivities.includes(activity.id) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedActivities.includes(activity.id) && (
                <>
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Activity Details</h4>
                        <div className="bg-white p-3 rounded border">
                          <div className="mb-2">
                            <span className="font-medium">Title:</span> {activity.title}
                          </div>
                          <div className="mb-2">
                            <span className="font-medium">Display Title:</span> {activity.display_title || activity.title}
                          </div>
                          <div className="mb-2">
                            <span className="font-medium">Description:</span>
                            <p className="text-sm mt-1">{activity.description}</p>
                          </div>
                          <div>
                            <span className="font-medium">Categories:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {activity.category_tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Submitter</h4>
                        <div className="bg-white p-3 rounded border">
                          <div className="flex items-center gap-3">
                            {activity.user.avatar_url ? (
                              <img
                                src={activity.user.avatar_url}
                                alt={activity.user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{activity.user.username}</div>
                              <div className="text-sm text-gray-500">
                                Submitted on {format(new Date(activity.created_at), 'MMMM d, yyyy')}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {activity.moderator_notes && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Moderator Notes</h4>
                            <div className="bg-white p-3 rounded border">
                              <p className="text-sm">{activity.moderator_notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {activity.moderation_status === 'pending' && (
                    <div className="p-4 bg-white border-t">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setActionType('approve');
                            setShowActionModal(true);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          Approve
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setActionType('request_changes');
                            setShowActionModal(true);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          <Edit2 className="h-5 w-5" />
                          Request Changes
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setActionType('reject');
                            setShowActionModal(true);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          <XCircle className="h-5 w-5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      <Dialog
        open={showActionModal}
        onClose={() => {
          if (!processingAction && !actionSuccess) {
            setShowActionModal(false);
            setSelectedActivity(null);
            setActionType('approve');
            setActionReason('');
          }
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            {actionSuccess ? (
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">Action Completed</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {actionType === 'approve' 
                    ? 'The activity has been approved and added to the official list.' 
                    : actionType === 'reject'
                    ? 'The activity has been rejected.'
                    : 'Changes have been requested from the user.'}
                </p>
              </div>
            ) : (
              <>
                <Dialog.Title className="text-lg font-bold mb-4 flex items-center gap-2">
                  {actionType === 'approve' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {actionType === 'request_changes' && <Edit2 className="h-5 w-5 text-blue-500" />}
                  {actionType === 'reject' && <XCircle className="h-5 w-5 text-red-500" />}
                  {actionType === 'approve' && 'Approve Activity'}
                  {actionType === 'request_changes' && 'Request Changes'}
                  {actionType === 'reject' && 'Reject Activity'}
                </Dialog.Title>

                <div className="space-y-4">
                  {selectedActivity && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">Activity:</span> {selectedActivity.display_title || selectedActivity.title}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Submitted by:</span> {selectedActivity.user.username}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {actionType === 'approve' 
                        ? 'Message to User (Optional)' 
                        : 'Reason / Feedback'}
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      rows={4}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={
                        actionType === 'approve' 
                          ? 'Optional message to the user about their approved activity...' 
                          : actionType === 'reject'
                          ? 'Explain why this activity is being rejected...'
                          : 'Explain what changes are needed before approval...'
                      }
                      required={actionType !== 'approve'}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowActionModal(false);
                        setSelectedActivity(null);
                        setActionType('approve');
                        setActionReason('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      disabled={processingAction}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAction}
                      disabled={processingAction || (actionType !== 'approve' && !actionReason)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {processingAction ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Processing...
                        </div>
                      ) : (
                        'Confirm'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}