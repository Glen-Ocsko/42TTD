import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Plus, Sparkles } from 'lucide-react';

export default function CreateYourOwnActivityCard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();

  const handleClick = () => {
    if (isAuthenticated) {
      navigate('/create-activity');
    } else {
      navigate('/login', { state: { returnTo: '/create-activity' } });
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="p-4 flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium">Create Your Own Activity</h3>
          <p className="text-sm text-white/90">Add something unique to your list</p>
        </div>
      </div>
    </div>
  );
}
