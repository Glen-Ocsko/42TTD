import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertTriangle, ArrowLeft } from 'lucide-react';

interface RestrictedContentProps {
  message?: string;
  showBackButton?: boolean;
}

export default function RestrictedContent({ 
  message = "This content is private or has been removed", 
  showBackButton = true 
}: RestrictedContentProps) {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-lg shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="bg-red-100 p-3 rounded-full mb-4">
          <Lock className="h-8 w-8 text-red-600" />
        </div>
        
        <h2 className="text-xl font-bold mb-2">Content Restricted</h2>
        
        <div className="mb-6 text-gray-600">
          <p>{message}</p>
          <p className="mt-2 text-sm">
            This content may be private, limited to friends only, or has been removed by a moderator.
          </p>
        </div>
        
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        )}
      </div>
    </div>
  );
}