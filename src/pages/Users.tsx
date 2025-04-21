import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { UserProfile } from '../types/profile';
import { Search, MapPin, Tag, Loader2, User, Filter, Users } from 'lucide-react';
import UserList from '../components/UserList';
import FollowRequestsModal from '../components/FollowRequestsModal';

export default function UsersPage() {
  const { userId } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  // Get query parameters
  const initialQuery = searchParams.get('q') || '';
  const initialLocation = searchParams.get('location') || '';
  const initialInterests = searchParams.get('interests')?.split(',') || [];

  useEffect(() => {
    loadUsers();
    
    if (userId) {
      checkPendingRequests();
    }
  }, [userId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('username', null)
        .order('username');

      if (error) throw error;
      
      // If logged in, get follow status for each user
      let usersWithFollowStatus = data || [];
      
      if (userId) {
        const followStatuses = await Promise.all(
          usersWithFollowStatus.map(async (user) => {
            if (user.id === userId) return 'self';
            
            const { data: status } = await supabase
              .rpc('get_follow_status', { 
                user_id: userId, 
                target_id: user.id 
              });
            
            return status || 'none';
          })
        );
        
        usersWithFollowStatus = usersWithFollowStatus.map((user, index) => ({
          ...user,
          follow_status: followStatuses[index] === 'self' ? undefined : followStatuses[index]
        }));
      }
      
      setUsers(usersWithFollowStatus);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const checkPendingRequests = async () => {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingRequestsCount(count || 0);
    } catch (err) {
      console.error('Error checking pending requests:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-7 w-7 text-blue-600" />
          Community
        </h1>
        
        {pendingRequestsCount > 0 && (
          <button
            onClick={() => setShowRequestsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <span className="font-bold">{pendingRequestsCount}</span>
            <span>Follow {pendingRequestsCount === 1 ? 'Request' : 'Requests'}</span>
          </button>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <UserList 
          initialUsers={users}
          showSearch={true}
          showFilters={true}
          title=""
          emptyMessage="No users found matching your criteria"
        />
      )}

      {/* Follow Requests Modal */}
      <FollowRequestsModal 
        isOpen={showRequestsModal}
        onClose={() => {
          setShowRequestsModal(false);
          checkPendingRequests(); // Refresh the count after closing
        }}
      />
    </div>
  );
}