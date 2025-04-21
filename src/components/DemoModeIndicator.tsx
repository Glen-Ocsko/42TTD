import React from 'react';
import { useDemo } from '../contexts/DemoContext';
import { Crown, Star, Medal } from 'lucide-react';

export default function DemoModeIndicator() {
  const { isDemoMode, demoUser } = useDemo();

  if (!isDemoMode || !demoUser) {
    return null;
  }

  const getRoleIcon = () => {
    switch (demoUser.role) {
      case 'premium':
        return <Crown className="h-4 w-4" />;
      case 'pro':
        return <Medal className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      {getRoleIcon()}
      <span>Demo Mode - {demoUser.role.toUpperCase()}</span>
    </div>
  );
}