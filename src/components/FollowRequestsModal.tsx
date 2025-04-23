import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Dialog } from '@headlessui/react';
import { User, Check, X, Loader2, UserPlus } from 'lucide-react';
import { FollowRequest } from '../types/profile';

interface FollowRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FollowRequestsModal({ isOpen, onClose }: FollowRequestsModalProps) {
  const { userId } = useCurrentUser();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadRequests();
    }
  }, [isOpen, userId]);

  const loadRequests = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          follower_id,
          status,
          created_at,
          follower:profiles!follows_follower_id_fkey (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('following_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error loading follow requests:', err);
      setError('Failed to load follow requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    if (!userId) return;
    
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;
      
      // Update local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Follow request accepted!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (err) {
      console.error('Error accepting follow request:', err);
      setError('Failed to accept follow request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!userId) return;
    
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('follows')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      
      // Update local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (err) {
      console.error('Error rejecting follow request:', err);
      setError('Failed to reject follow request');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
          <Dialog.Title className="text-lg font-bold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Follow Requests
          </Dialog.Title>
          
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending follow requests
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {request.follower?.avatar_url ? (
                      <img
                        src={request.follower.avatar_url}
                        alt={request.follower.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <button
                        onClick={() => {
                          onClose();
                          navigate(`/profile/${request.follower?.username}`);
                        }}
                        className="font-medium hover:text-blue-600"
                      >
                        {request.follower?.username}
                      </button>
                      {request.follower?.full_name && (
                        <div className="text-sm text-gray-500">{request.follower.full_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={processingId === request.id}
                      className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processingId === request.id}
                      className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}