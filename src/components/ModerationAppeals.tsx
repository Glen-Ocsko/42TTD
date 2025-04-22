import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { 
  Shield, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare,
  User,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog } from '@headlessui/react';

interface Appeal {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  related_action_id: string | null;
  related_post_id: string | null;
  action_type: string | null;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  moderator_response: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function ModerationAppeals() {
  const { userId, isAuthenticated } = useCurrentUser();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [response, setResponse] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadAppeals();
    }
  }, [isAuthenticated, filterStatus]);

  const loadAppeals = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('moderation_appeals')
        .select(`
          *,
          profiles!moderation_appeals_user_id_fkey (
            username,
            avatar_url
          ),
          moderation_actions (
            action_type
          )
        `)
        .order('created_at', { ascending: false });
      
      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      // Transform data
      const transformedAppeals = data?.map(appeal => ({
        id: appeal.id,
        user_id: appeal.user_id,
        username: appeal.profiles?.username || 'Unknown User',
        avatar_url: appeal.profiles?.avatar_url,
        related_action_id: appeal.related_action_id,
        related_post_id: appeal.related_post_id,
        action_type: appeal.moderation_actions?.action_type,
        message: appeal.message,
        status: appeal.status,
        moderator_response: appeal.moderator_response,
        reviewed_by: appeal.reviewed_by,
        reviewed_at: appeal.reviewed_at,
        created_at: appeal.created_at
      })) || [];
      
      setAppeals(transformedAppeals);
    } catch (err) {
      console.error('Error loading appeals:', err);
      setError('Failed to load appeals');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (appeal: Appeal, approve: boolean) => {
    setSelectedAppeal(appeal);
    setIsApproving(approve);
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedAppeal || !response.trim()) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      if (isApproving) {
        // Call RPC function to approve appeal
        const { error: approveError } = await supabase
          .rpc('approve_moderation_appeal', {
            appeal_id: selectedAppeal.id,
            moderator_id: userId,
            response: response.trim()
          });
        
        if (approveError) throw approveError;
      } else {
        // Call RPC function to reject appeal
        const { error: rejectError } = await supabase
          .rpc('reject_moderation_appeal', {
            appeal_id: selectedAppeal.id,
            moderator_id: userId,
            response: response.trim()
          });
        
        if (rejectError) throw rejectError;
      }
      
      setSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setShowResponseModal(false);
        setSelectedAppeal(null);
        setResponse('');
        setSuccess(false);
        loadAppeals();
      }, 2000);
    } catch (err) {
      console.error('Error submitting response:', err);
      setError('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
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
      default:
        return null;
    }
  };

  const getActionBadge = (actionType: string | null) => {
    if (!actionType) return null;
    
    switch (actionType) {
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </span>
        );
      case 'post_removal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Post Removal
          </span>
        );
      case 'suspension':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            Suspension
          </span>
        );
      case 'ban':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Ban
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Moderation Appeals</h1>
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
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Appeals</option>
            <option value="pending">Pending Appeals</option>
            <option value="approved">Approved Appeals</option>
            <option value="rejected">Rejected Appeals</option>
          </select>
        </div>
        
        <button
          onClick={loadAppeals}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {appeals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Appeals Found</h2>
          <p className="text-gray-600">
            There are currently no appeals that match your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {appeals.map((appeal) => (
            <div key={appeal.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {appeal.avatar_url ? (
                      <img
                        src={appeal.avatar_url}
                        alt={appeal.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{appeal.username}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{format(new Date(appeal.created_at), 'MMM d, yyyy')}</span>
                        {getStatusBadge(appeal.status)}
                        {getActionBadge(appeal.action_type)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Appeal Message</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="whitespace-pre-wrap">{appeal.message}</p>
                  </div>
                </div>
                
                {appeal.status !== 'pending' && appeal.moderator_response && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Moderator Response</h4>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="whitespace-pre-wrap">{appeal.moderator_response}</p>
                      {appeal.reviewed_at && (
                        <p className="text-sm text-gray-500 mt-2">
                          Responded on {format(new Date(appeal.reviewed_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {appeal.status === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleRespond(appeal, true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Approve Appeal
                    </button>
                    <button
                      onClick={() => handleRespond(appeal, false)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="h-5 w-5" />
                      Reject Appeal
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      <Dialog
        open={showResponseModal}
        onClose={() => {
          if (!submitting && !success) {
            setShowResponseModal(false);
            setSelectedAppeal(null);
            setResponse('');
          }
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            {success ? (
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">Response Submitted</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Your response has been sent to the user.
                </p>
              </div>
            ) : (
              <>
                <Dialog.Title className="text-lg font-bold mb-4 flex items-center gap-2">
                  {isApproving ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Approve Appeal
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      Reject Appeal
                    </>
                  )}
                </Dialog.Title>

                <div className="space-y-4">
                  {selectedAppeal && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">User:</span> {selectedAppeal.username}
                      </div>
                      <div className="text-sm mt-1">
                        <span className="font-medium">Appeal:</span> {selectedAppeal.message}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Response to User
                    </label>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={4}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={isApproving 
                        ? "Explain why you're approving this appeal..." 
                        : "Explain why you're rejecting this appeal..."}
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowResponseModal(false);
                        setSelectedAppeal(null);
                        setResponse('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitResponse}
                      disabled={submitting || !response.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Submitting...
                        </div>
                      ) : (
                        'Submit Response'
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