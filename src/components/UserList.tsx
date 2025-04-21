import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { UserProfile } from '../types/profile';
import { Search, Filter, Loader2, AlertTriangle } from 'lucide-react';
import UserCard from './UserCard';
import debounce from 'lodash.debounce';

interface UserListProps {
  initialUsers?: UserProfile[];
  showSearch?: boolean;
  showFilters?: boolean;
  title?: string;
  emptyMessage?: string;
  maxUsers?: number;
}

export default function UserList({
  initialUsers,
  showSearch = true,
  showFilters = true,
  title = 'Community Members',
  emptyMessage = 'No users found',
  maxUsers = 50
}: UserListProps) {
  const { userId } = useCurrentUser();
  const [users, setUsers] = useState<UserProfile[]>(initialUsers || []);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(!initialUsers);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [allInterests, setAllInterests] = useState<string[]>([]);

  // Debounced search function
  const debouncedSearch = debounce((query: string) => {
    filterUsers(query, selectedLocation, selectedInterests);
  }, 300);

  useEffect(() => {
    if (!initialUsers) {
      loadUsers();
    } else {
      setFilteredUsers(initialUsers);
      extractFilters(initialUsers);
    }
  }, [initialUsers]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('username', null)
        .order('username')
        .limit(maxUsers);

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
      setFilteredUsers(usersWithFollowStatus);
      extractFilters(usersWithFollowStatus);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const extractFilters = (users: UserProfile[]) => {
    // Extract unique locations
    const uniqueLocations = Array.from(
      new Set(users.map(user => user.location).filter(Boolean))
    ).sort();
    setLocations(uniqueLocations);

    // Extract unique interests
    const uniqueInterests = Array.from(
      new Set(users.flatMap(user => user.interests || []))
    ).sort();
    setAllInterests(uniqueInterests);
  };

  const filterUsers = (query: string, location: string, interests: string[]) => {
    let filtered = users;
    
    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(lowerQuery) ||
        (user.full_name && user.full_name.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Filter by location
    if (location) {
      filtered = filtered.filter(user => user.location === location);
    }
    
    // Filter by interests
    if (interests.length > 0) {
      filtered = filtered.filter(user => 
        interests.every(interest => user.interests?.includes(interest))
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const location = e.target.value;
    setSelectedLocation(location);
    filterUsers(searchQuery, location, selectedInterests);
  };

  const toggleInterest = (interest: string) => {
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    
    setSelectedInterests(newInterests);
    filterUsers(searchQuery, selectedLocation, newInterests);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-lg">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          
          {showFilters && (
            <div className="space-y-4">
              {locations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={handleLocationChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    {locations.map(location => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {allInterests.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allInterests.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedInterests.includes(interest)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* User Grid */}
      {filteredUsers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}