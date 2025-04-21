import React from 'react';
import { Star, Users } from 'lucide-react';

interface RatingDisplayProps {
  value: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export default function RatingDisplay({ 
  value, 
  reviewCount, 
  size = 'md',
  showCount = true 
}: RatingDisplayProps) {
  const starSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSizes[size]} ${
              star <= Math.floor(value)
                ? 'text-yellow-400 fill-current'
                : star <= value
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      {showCount && reviewCount !== undefined && (
        <div className={`flex items-center gap-1 ${textSizes[size]} text-gray-500`}>
          <span>({value.toFixed(1)})</span>
          <Users className={starSizes[size]} />
          <span>{reviewCount}</span>
        </div>
      )}
    </div>
  );
}