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
  Ban, 
  Trash2, 
  User, 
  Flag, 
  MessageSquare, 
  ArrowRight, 
  Filter, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog } from '@headlessui/react';

interface ReportedPost {
  report_id: string;
  post_id: string;
  reporter_id: string;
  reporter_username: string;
  reported_user_id: string;
  reported_username: string;
  post_content: string;
  image_url?: string;
  reason: string;
  extra_notes?: string;
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  created_at: string;
  post_visibility?: 'public' | 'private' | 'friends';
}

export default function ModerationQueue() {
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportedPost | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'warning' | 'post_removal' | 'suspension' | 'ban' | 'report_dismissed' | 'report_resolved'>('warning');
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [suspensionDays, setSuspensionDays] = useState(1);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_review'>('all');
  const [expandedReports, setExpandedReports] = useState<string[]>([]);
  const [sendModeratorMessage, setSendModeratorMessage] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    checkModeratorStatus();
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (isModerator) {
      loadReports();
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

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Get reported posts using the function that enforces privacy
      const { data, error } = await supabase
        .rpc('get_reported_posts_for_moderation');
      
      if (error) throw error;
      
      // Filter by status if needed
      let filteredReports = data || [];
      if (filterStatus !== 'all') {
        filteredReports = filteredReports.filter(report => 
          filterStatus === 'pending' ? report.status === 'pending' : report.status === 'in_review'
        );
      }
      
      setReports(filteredReports);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedReport || !actionType || !actionReason) return;
    
    try {
      setProcessingAction(true);
      
      // Calculate suspension end date if applicable
      let suspensionEndDate = null;
      if (actionType === 'suspension' && suspensionDays > 0) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + suspensionDays);
        suspensionEndDate = endDate.toISOString();
      }
      
      // Create moderation action
      const { data: actionData, error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          moderator_id: userId,
          target_user_id: selectedReport.reported_user_id,
          post_id: selectedReport.post_id,
          action_type: actionType,
          reason: actionReason,
          notes: actionNotes || null
        })
        .select()
        .single();
      
      if (actionError) throw actionError;
      
      // Update report status
      const { error: reportError } = await supabase
        .from('post_reports')
        .update({
          status: actionType === 'report_dismissed' ? 'dismissed' : 'resolved'
        })
        .eq('id', selectedReport.report_id);
      
      if (reportError) throw reportError;
      
      // Take action based on action type
      switch (actionType) {
        case 'warning':
          // Send a warning message to the user if checkbox is checked
          if (sendModeratorMessage) {
            const { error: messageError } = await supabase
              .from('messages')
              .insert({
                sender_id: userId,
                receiver_id: selectedReport.reported_user_id,
                message_text: actionReason,
                from_moderator: true
              });
            
            if (messageError) throw messageError;
          }
          
          // Also send a moderation message
          const { error: modMessageError } = await supabase
            .from('moderation_messages')
            .insert({
              receiver_id: selectedReport.reported_user_id,
              sender_id: userId,
              action_id: actionData.id,
              message_text: actionReason,
              is_system: false
            });
          
          if (modMessageError) throw modMessageError;
          break;
          
        case 'post_removal':
          // Delete the post
          const { error: deleteError } = await supabase
            .from('activity_posts')
            .delete()
            .eq('id', selectedReport.post_id);
          
          if (deleteError) throw deleteError;
          
          // Send a notification to the user if checkbox is checked
          if (sendModeratorMessage) {
            const { error: removalMessageError } = await supabase
              .from('messages')
              .insert({
                sender_id: userId,
                receiver_id: selectedReport.reported_user_id,
                message_text: `Your post has been removed: ${actionReason}`,
                from_moderator: true
              });
            
            if (removalMessageError) throw removalMessageError;
          }
          
          // Also send a moderation message
          const { error: removalModMessageError } = await supabase
            .from('moderation_messages')
            .insert({
              receiver_id: selectedReport.reported_user_id,
              sender_id: userId,
              action_id: actionData.id,
              message_text: `Your post has been removed: ${actionReason}`,
              is_system: false
            });
          
          if (removalModMessageError) throw removalModMessageError;
          break;
          
        case 'suspension':
          // Create suspension record
          const { error: suspensionError } = await supabase
            .from('user_suspensions')
            .insert({
              user_id: selectedReport.reported_user_id,
              reason: actionReason,
              start_date: new Date().toISOString(),
              end_date: suspensionEndDate,
              created_by: userId
            });
          
          if (suspensionError) throw suspensionError;
          
          // Update user profile
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              is_suspended: true,
              suspension_end_date: suspensionEndDate
            })
            .eq('id', selectedReport.reported_user_id);
          
          if (profileError) throw profileError;
          
          // Send a notification to the user if checkbox is checked
          if (sendModeratorMessage) {
            const { error: suspensionMessageError } = await supabase
              .from('messages')
              .insert({
                sender_id: userId,
                receiver_id: selectedReport.reported_user_id,
                message_text: `Your account has been suspended for ${suspensionDays} day(s): ${actionReason}`,
                from_moderator: true
              });
            
            if (suspensionMessageError) throw suspensionMessageError;
          }
          
          // Also send a moderation message
          const { error: suspensionModMessageError } = await supabase
            .from('moderation_messages')
            .insert({
              receiver_id: selectedReport.reported_user_id,
              sender_id: userId,
              action_id: actionData.id,
              message_text: `Your account has been suspended for ${suspensionDays} day(s): ${actionReason}`,
              is_system: false
            });
          
          if (suspensionModMessageError) throw suspensionModMessageError;
          break;
          
        case 'ban':
          // Create permanent ban record
          const { error: banError } = await supabase
            .from('user_suspensions')
            .insert({
              user_id: selectedReport.reported_user_id,
              reason: actionReason,
              start_date: new Date().toISOString(),
              end_date: null, // No end date for permanent ban
              created_by: userId,
              is_permanent: true
            });
          
          if (banError) throw banError;
          
          // Update user profile
          const { error: banProfileError } = await supabase
            .from('profiles')
            .update({
              is_banned: true,
              is_suspended: true
            })
            .eq('id', selectedReport.reported_user_id);
          
          if (banProfileError) throw banProfileError;
          
          // Send a notification to the user if checkbox is checked
          if (sendModeratorMessage) {
            const { error: banMessageError } = await supabase
              .from('messages')
              .insert({
                sender_id: userId,
                receiver_id: selectedReport.reported_user_id,
                message_text: `Your account has been permanently banned: ${actionReason}`,
                from_moderator: true
              });
            
            if (banMessageError) throw banMessageError;
          }
          
          // Also send a moderation message
          const { error: banModMessageError } = await supabase
            .from('moderation_messages')
            .insert({
              receiver_id: selectedReport.reported_user_id,
              sender_id: userId,
              action_id: actionData.id,
              message_text: `Your account has been permanently banned: ${actionReason}`,
              is_system: false
            });
          
          if (banModMessageError) throw banModMessageError;
          break;
          
        case 'report_dismissed':
          // Send a notification to the reporter if checkbox is checked
          if (sendModeratorMessage) {
            const { error: dismissMessageError } = await supabase
              .from('messages')
              .insert({
                sender_id: userId,
                receiver_id: selectedReport.reporter_id,
                message_text: `Your report has been reviewed and dismissed: ${actionReason}`,
                from_moderator: true
              });
            
            if (dismissMessageError) throw dismissMessageError;
          }
          break;
          
        case 'report_resolved':
          // Send a notification to the reporter if checkbox is checked
          if (sendModeratorMessage) {
            const { error: resolveMessageError } = await supabase
              .from('messages')
              .insert({
                sender_id: userId,
                receiver_id: selectedReport.reporter_id,
                message_text: `Your report has been reviewed and appropriate action has been taken: ${actionReason}`,
                from_moderator: true
              });
            
            if (resolveMessageError) throw resolveMessageError;
          }
          break;
      }
      
      setActionSuccess(true);
      
      // Reset form after successful action
      setTimeout(() => {
        setShowActionModal(false);
        setSelectedReport(null);
        setActionType('warning');
        setActionReason('');
        setActionNotes('');
        setSuspensionDays(1);
        setSendModeratorMessage(true);
        setActionSuccess(false);
        loadReports();
      }, 2000);
    } catch (err) {
      console.error('Error taking action:', err);
      setError('Failed to take moderation action');
    } finally {
      setProcessingAction(false);
    }
  };

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
            <Flag className="h-3 w-3" />
            Pending
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            In Review
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  const getPrivacyBadge = (visibility?: string) => {
    if (!visibility || visibility === 'public') return null;
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium ml-2">
        <Lock className="h-3 w-3" />
        {visibility === 'private' ? 'Private' : 'Friends Only'}
      </span>
    );
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
        <h1 className="text-3xl font-bold">Moderation Queue</h1>
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
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'in_review')}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending Reports</option>
            <option value="in_review">In Review</option>
          </select>
        </div>
        
        <button
          onClick={loadReports}
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
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Reports to Review</h2>
          <p className="text-gray-600">
            There are currently no reports that match your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <div 
              key={report.report_id} 
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-4 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(report.status)}
                      {getPrivacyBadge(report.post_visibility)}
                      <span className="text-sm text-gray-500">
                        Reported {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <h3 className="font-medium">
                      Post by <span className="text-blue-600">{report.reported_username}</span>
                    </h3>
                  </div>
                  <button
                    onClick={() => toggleReportExpansion(report.report_id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedReports.includes(report.report_id) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedReports.includes(report.report_id) && (
                <>
                  <div className="p-4 bg-gray-50">
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Post Content</h4>
                      <div className="bg-white p-3 rounded border">
                        <p className="whitespace-pre-wrap">{report.post_content}</p>
                        {report.image_url && (
                          <img 
                            src={report.image_url} 
                            alt="Post media" 
                            className="mt-2 max-h-48 rounded"
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">Report Details</h4>
                        <div className="bg-white p-3 rounded border">
                          <div className="mb-2">
                            <span className="font-medium">Reason:</span> {report.reason}
                          </div>
                          {report.extra_notes && (
                            <div>
                              <span className="font-medium">Additional Notes:</span>
                              <p className="text-sm mt-1">{report.extra_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Reporter</h4>
                        <div className="bg-white p-3 rounded border">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-gray-400" />
                            <span>{report.reporter_username}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white border-t">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setActionType('warning');
                          setShowActionModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                      >
                        <AlertTriangle className="h-5 w-5" />
                        Warn User
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setActionType('post_removal');
                          setShowActionModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        <Trash2 className="h-5 w-5" />
                        Remove Post
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setActionType('suspension');
                          setShowActionModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                      >
                        <Clock className="h-5 w-5" />
                        Suspend User
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setActionType('ban');
                          setShowActionModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        <Ban className="h-5 w-5" />
                        Ban User
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setActionType('report_dismissed');
                          setShowActionModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <XCircle className="h-5 w-5" />
                        Dismiss Report
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setActionType('report_resolved');
                          setShowActionModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Resolve Report
                      </button>
                    </div>
                  </div>
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
            setSelectedReport(null);
            setActionType('warning');
            setActionReason('');
            setActionNotes('');
            setSuspensionDays(1);
            setSendModeratorMessage(true);
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
                  The moderation action has been successfully applied.
                </p>
              </div>
            ) : (
              <>
                <Dialog.Title className="text-lg font-bold mb-4 flex items-center gap-2">
                  {actionType === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                  {actionType === 'post_removal' && <Trash2 className="h-5 w-5 text-red-500" />}
                  {actionType === 'suspension' && <Clock className="h-5 w-5 text-orange-500" />}
                  {actionType === 'ban' && <Ban className="h-5 w-5 text-red-600" />}
                  {actionType === 'report_dismissed' && <XCircle className="h-5 w-5 text-gray-500" />}
                  {actionType === 'report_resolved' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {actionType === 'warning' && 'Issue Warning'}
                  {actionType === 'post_removal' && 'Remove Post'}
                  {actionType === 'suspension' && 'Suspend User'}
                  {actionType === 'ban' && 'Ban User'}
                  {actionType === 'report_dismissed' && 'Dismiss Report'}
                  {actionType === 'report_resolved' && 'Resolve Report'}
                </Dialog.Title>

                <div className="space-y-4">
                  {selectedReport && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">User:</span> {selectedReport.reported_username}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Report Reason:</span> {selectedReport.reason}
                      </div>
                      {selectedReport.post_visibility && selectedReport.post_visibility !== 'public' && (
                        <div className="text-sm mt-1 flex items-center gap-1 text-purple-700">
                          <Lock className="h-4 w-4" />
                          <span>This is a {selectedReport.post_visibility === 'private' ? 'private' : 'friends-only'} post</span>
                        </div>
                      )}
                    </div>
                  )}

                  {actionType === 'suspension' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Suspension Duration (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={suspensionDays}
                        onChange={(e) => setSuspensionDays(parseInt(e.target.value))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message to {actionType === 'report_dismissed' || actionType === 'report_resolved' ? 'Reporter' : 'User'}
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      rows={4}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Explain the reason for this ${actionType === 'report_dismissed' || actionType === 'report_resolved' ? 'decision' : 'action'}...`}
                      required
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="sendModeratorMessage"
                      checked={sendModeratorMessage}
                      onChange={(e) => setSendModeratorMessage(e.target.checked)}
                      className="mt-1"
                    />
                    <label htmlFor="sendModeratorMessage" className="text-sm text-gray-700">
                      Send as direct message to {actionType === 'report_dismissed' || actionType === 'report_resolved' ? 'reporter' : 'user'} (appears in their inbox with moderator badge)
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Internal Notes (optional)
                    </label>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      rows={2}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any internal notes about this action..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        if (!processingAction) {
                          setShowActionModal(false);
                          setSelectedReport(null);
                          setActionType('warning');
                          setActionReason('');
                          setActionNotes('');
                          setSuspensionDays(1);
                          setSendModeratorMessage(true);
                        }
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      disabled={processingAction}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAction}
                      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      disabled={processingAction || !actionReason}
                    >
                      {processingAction ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        'Take Action'
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