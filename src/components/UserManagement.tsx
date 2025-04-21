import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { 
  User, 
  Loader2, 
  AlertTriangle, 
  Shield, 
  UserCheck, 
  UserX, 
  Clock, 
  Ban, 
  Search, 
  Filter, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog } from '@headlessui/react';

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_moderator: boolean;
  is_suspended: boolean;
  is_banned: boolean;
  suspension_end_date: string | null;
  created_at: string;
}

export default function UserManagement() {
  const { userId } = useCurrentUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'banned' | 'moderators'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'promote' | 'demote' | 'suspend' | 'ban' | 'unsuspend'>('suspend');
  const [actionReason, setActionReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState(1);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  useEffect(() => {
    checkModeratorStatus();
  }, [userId]);

  useEffect(() => {
    if (isModerator) {
      loadUsers();
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
        setError('You do not have permission to access this page');
        return;
      }
      
      setIsModerator(true);
    } catch (err) {
      console.error('Error checking moderator status:', err);
      setError('Failed to verify moderator status');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filterStatus === 'active') {
        query = query.eq('is_suspended', false).eq('is_banned', false);
      } else if (filterStatus === 'suspended') {
        query = query.eq('is_suspended', true).eq('is_banned', false);
      } else if (filterStatus === 'banned') {
        query = query.eq('is_banned', true);
      } else if (filterStatus === 'moderators') {
        query = query.or('is_moderator.eq.true,is_admin.eq.true');
      }
      
      // Apply search
      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser) return;
    
    try {
      setProcessingAction(true);
      
      switch (actionType) {
        case 'promote':
          const { error: promoteError } = await supabase
            .rpc('promote_to_moderator', {
              target_user_id: selectedUser.id
            });
          
          if (promoteError) throw promoteError;
          break;
          
        case 'demote':
          const { error: demoteError } = await supabase
            .rpc('demote_moderator', {
              target_user_id: selectedUser.id
            });
          
          if (demoteError) throw demoteError;
          break;
          
        case 'suspend':
          // Calculate suspension end date
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + suspensionDays);
          
          // Create moderation action
          const { data: actionData, error: actionError } = await supabase
            .from('moderation_actions')
            .insert({
              moderator_id: userId,
              target_user_id: selectedUser.id,
              action_type: 'suspension',
              reason: actionReason
            })
            .select()
            .single();
          
          if (actionError) throw actionError;
          
          // Create suspension record
          const { error: suspensionError } = await supabase
            .from('user_suspensions')
            .insert({
              user_id: selectedUser.id,
              moderator_id: userId,
              reason: actionReason,
              start_date: new Date().toISOString(),
              end_date: endDate.toISOString(),
              is_permanent: false
            });
          
          if (suspensionError) throw suspensionError;
          
          // Update user profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              is_suspended: true,
              suspension_end_date: endDate.toISOString()
            })
            .eq('id', selectedUser.id);
          
          if (updateError) throw updateError;
          
          // Send message to user
          await supabase
            .rpc('send_moderation_message', {
              receiver_id: selectedUser.id,
              message_text: actionReason,
              action_id: actionData.id,
              is_system: false
            });
          
          break;
          
        case 'ban':
          // Create moderation action
          const { data: banActionData, error: banActionError } = await supabase
            .from('moderation_actions')
            .insert({
              moderator_id: userId,
              target_user_id: selectedUser.id,
              action_type: 'ban',
              reason: actionReason
            })
            .select()
            .single();
          
          if (banActionError) throw banActionError;
          
          // Create permanent suspension record
          const { error: banError } = await supabase
            .from('user_suspensions')
            .insert({
              user_id: selectedUser.id,
              moderator_id: userId,
              reason: actionReason,
              start_date: new Date().toISOString(),
              is_permanent: true
            });
          
          if (banError) throw banError;
          
          // Update user profile
          const { error: banUpdateError } = await supabase
            .from('profiles')
            .update({
              is_banned: true,
              is_suspended: true
            })
            .eq('id', selectedUser.id);
          
          if (banUpdateError) throw banUpdateError;
          
          // Send message to user
          await supabase
            .rpc('send_moderation_message', {
              receiver_id: selectedUser.id,
              message_text: actionReason,
              action_id: banActionData.id,
              is_system: false
            });
          
          break;
          
        case 'unsuspend':
          // Update user profile
          const { error: unsuspendError } = await supabase
            .from('profiles')
            .update({
              is_suspended: false,
              suspension_end_date: null
            })
            .eq('id', selectedUser.id);
          
          if (unsuspendError) throw unsuspendError;
          
          // Create moderation action
          const { data: unsuspendActionData, error: unsuspendActionError } = await supabase
            .from('moderation_actions')
            .insert({
              moderator_id: userId,
              target_user_id: selectedUser.id,
              action_type: 'report_resolved',
              reason: 'Suspension lifted: ' + actionReason
            })
            .select()
            .single();
          
          if (unsuspendActionError) throw unsuspendActionError;
          
          // Send message to user
          await supabase
            .rpc('send_moderation_message', {
              receiver_id: selectedUser.id,
              message_text: 'Your account suspension has been lifted. ' + actionReason,
              action_id: unsuspendActionData.id,
              is_system: true
            });
          
          break;
      }
      
      setActionSuccess(true);
      
      // Reset form after successful action
      setTimeout(() => {
        setShowActionModal(false);
        setSelectedUser(null);
        setActionType('suspend');
        setActionReason('');
        setSuspensionDays(1);
        setActionSuccess(false);
        loadUsers();
      }, 2000);
    } catch (err) {
      console.error('Error taking action:', err);
      setError('Failed to perform action');
    } finally {
      setProcessingAction(false);
    }
  };

  const getUserStatusBadge = (user: UserProfile) => {
    if (user.is_banned) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          <Ban className="h-3 w-3" />
          Banned
        </span>
      );
    } else if (user.is_suspended) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
          <Clock className="h-3 w-3" />
          Suspended
        </span>
      );
    } else if (user.is_admin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      );
    } else if (user.is_moderator) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          <UserCheck className="h-3 w-3" />
          Moderator
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </span>
      );
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
        <User className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">User Management</h1>
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, username, or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Users</option>
            <option value="active">Active Users</option>
            <option value="suspended">Suspended Users</option>
            <option value="banned">Banned Users</option>
            <option value="moderators">Moderators & Admins</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Users Found</h2>
          <p className="text-gray-600">
            No users match your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUserStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!user.is_admin && !user.is_moderator && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType('promote');
                            setShowActionModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Promote
                        </button>
                      )}
                      
                      {user.is_moderator && !user.is_admin && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType('demote');
                            setShowActionModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900 mr-3"
                        >
                          Demote
                        </button>
                      )}
                      
                      {!user.is_suspended && !user.is_banned && !user.is_admin && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType('suspend');
                            setShowActionModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-900 mr-3"
                        >
                          Suspend
                        </button>
                      )}
                      
                      {user.is_suspended && !user.is_banned && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType('unsuspend');
                            setShowActionModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Unsuspend
                        </button>
                      )}
                      
                      {!user.is_banned && !user.is_admin && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType('ban');
                            setShowActionModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Ban
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      <Dialog
        open={showActionModal}
        onClose={() => {
          if (!processingAction && !actionSuccess) {
            setShowActionModal(false);
            setSelectedUser(null);
            setActionType('suspend');
            setActionReason('');
            setSuspensionDays(1);
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
                  The user management action has been successfully applied.
                </p>
              </div>
            ) : (
              <>
                <Dialog.Title className="text-lg font-bold mb-4 flex items-center gap-2">
                  {actionType === 'promote' && <UserCheck className="h-5 w-5 text-blue-500" />}
                  {actionType === 'demote' && <UserX className="h-5 w-5 text-gray-500" />}
                  {actionType === 'suspend' && <Clock className="h-5 w-5 text-orange-500" />}
                  {actionType === 'ban' && <Ban className="h-5 w-5 text-red-600" />}
                  {actionType === 'unsuspend' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {actionType === 'promote' && 'Promote to Moderator'}
                  {actionType === 'demote' && 'Remove Moderator Role'}
                  {actionType === 'suspend' && 'Suspend User'}
                  {actionType === 'ban' && 'Ban User'}
                  {actionType === 'unsuspend' && 'Remove Suspension'}
                </Dialog.Title>

                <div className="space-y-4">
                  {selectedUser && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        {selectedUser.avatar_url ? (
                          <img
                            src={selectedUser.avatar_url}
                            alt={selectedUser.username}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{selectedUser.username}</div>
                          <div className="text-sm text-gray-500">{selectedUser.email}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {actionType === 'suspend' && (
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

                  {(actionType === 'suspend' || actionType === 'ban' || actionType === 'unsuspend') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason
                      </label>
                      <textarea
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        rows={4}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={
                          actionType === 'suspend' 
                            ? 'Explain why this user is being suspended...' 
                            : actionType === 'ban'
                            ? 'Explain why this user is being banned...'
                            : 'Explain why this suspension is being removed...'
                        }
                        required
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowActionModal(false);
                        setSelectedUser(null);
                        setActionType('suspend');
                        setActionReason('');
                        setSuspensionDays(1);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      disabled={processingAction}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAction}
                      disabled={processingAction || ((actionType === 'suspend' || actionType === 'ban' || actionType === 'unsuspend') && !actionReason)}
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