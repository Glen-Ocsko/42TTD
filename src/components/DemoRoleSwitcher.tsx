import React from 'react';
import { Crown, Star, Medal, Shield, UserCheck } from 'lucide-react';
import { useDemo } from '../contexts/DemoContext';

export default function DemoRoleSwitcher() {
  const { isDemoMode, demoUser, setDemoRole, setDemoAdmin, setDemoModerator } = useDemo();

  if (!isDemoMode || !demoUser) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 px-3 py-2 bg-gray-100 rounded-lg">
      <div className="flex gap-1">
        <button
          onClick={() => setDemoRole('free')}
          className={`flex items-center gap-1 px-2 py-1 rounded ${
            demoUser.role === 'free'
              ? 'bg-gray-200 text-gray-800'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Star className="h-4 w-4" />
          <span className="text-sm">Free</span>
        </button>

        <button
          onClick={() => setDemoRole('premium')}
          className={`flex items-center gap-1 px-2 py-1 rounded ${
            demoUser.role === 'premium'
              ? 'bg-amber-200 text-amber-800'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Crown className="h-4 w-4" />
          <span className="text-sm">Premium</span>
        </button>

        <button
          onClick={() => setDemoRole('pro')}
          className={`flex items-center gap-1 px-2 py-1 rounded ${
            demoUser.role === 'pro'
              ? 'bg-purple-200 text-purple-800'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Medal className="h-4 w-4" />
          <span className="text-sm">Pro</span>
        </button>
      </div>

      <div className="border-l border-gray-300 pl-4 flex gap-2">
        <button
          onClick={() => setDemoAdmin(!demoUser.is_admin)}
          className={`flex items-center gap-1 px-2 py-1 rounded ${
            demoUser.is_admin
              ? 'bg-blue-200 text-blue-800'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span className="text-sm">Admin</span>
        </button>
        
        <button
          onClick={() => setDemoModerator(!demoUser.is_moderator)}
          className={`flex items-center gap-1 px-2 py-1 rounded ${
            demoUser.is_moderator
              ? 'bg-green-200 text-green-800'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span className="text-sm">Moderator</span>
        </button>
      </div>
    </div>
  );
}