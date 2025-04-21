import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../contexts/UserRoleContext';
import { Crown, ChevronRight } from 'lucide-react';

interface PremiumFeatureProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PremiumFeature({ children, fallback }: PremiumFeatureProps) {
  const { isPremium, loading } = useUserRole();
  const navigate = useNavigate();

  if (loading) {
    return null;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 text-center">
      <Crown className="h-12 w-12 text-amber-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Premium Feature
      </h3>
      <p className="text-gray-600 mb-4">
        Upgrade to premium to unlock this feature and many more benefits!
      </p>
      <button
        onClick={() => navigate('/pricing')}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors"
      >
        See Pricing
        <ChevronRight className="ml-2 h-5 w-5" />
      </button>
    </div>
  );
}