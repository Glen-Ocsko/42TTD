import React, { useState } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import UserInbox from '../components/UserInbox';
import { MessageSquare } from 'lucide-react';

interface MessagesProps {
  className?: string;
}

export default function Messages({ className }: MessagesProps) {
  const { isAuthenticated } = useCurrentUser();

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your Messages</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to view your messages and conversations.
          </p>
          <a 
            href="/login" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${className}`}>
      <h1 className="text-3xl font-bold mb-6">Your Messages</h1>
      <UserInbox />
    </div>
  );
}