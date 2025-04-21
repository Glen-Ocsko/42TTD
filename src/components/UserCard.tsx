import React from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, Lock } from 'lucide-react';
import { UserProfile } from '../types/profile';
import FollowButton from './FollowButton';

interface UserCardProps {
  user: UserProfile;
  showFollowButton?: boolean;
}

export default function UserCard({ user, showFollowButton = true }: UserCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <Link to={`/users/${user.username}`} className="flex-shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link to={`/users/${user.username}`} className="font-medium hover:text-blue-600 truncate">
              {user.username}
            </Link>
            {user.privacy_default !== 'public' && (
              <Lock className="h-3 w-3 text-gray-400" />
            )}
          </div>
          
          {user.full_name && (
            <div className="text-sm text-gray-500 truncate">{user.full_name}</div>
          )}
          
          {user.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{user.location}</span>
            </div>
          )}
        </div>
        
        {showFollowButton && (
          <FollowButton 
            userId={user.id} 
            initialStatus={user.follow_status}
            className="ml-2"
            showText={false}
          />
        )}
      </div>
    </div>
  );
}