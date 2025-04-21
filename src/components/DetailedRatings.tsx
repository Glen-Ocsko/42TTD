import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, Palette, Dumbbell, BookOpen, Globe } from 'lucide-react';
import RatingDisplay from './RatingDisplay';

interface DetailedRatingsProps {
  ratings: {
    adventurousness: number;
    creativity: number;
    fitness: number;
    learning: number;
    impact: number;
  };
  reviewCounts?: {
    adventurousness?: number;
    creativity?: number;
    fitness?: number;
    learning?: number;
    impact?: number;
  };
}

export default function DetailedRatings({ ratings, reviewCounts = {} }: DetailedRatingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-medium">Detailed Characteristics</span>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <span>Adventurousness</span>
            </div>
            <RatingDisplay 
              value={ratings.adventurousness} 
              reviewCount={reviewCounts.adventurousness}
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              <span>Creativity</span>
            </div>
            <RatingDisplay 
              value={ratings.creativity} 
              reviewCount={reviewCounts.creativity}
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-green-500" />
              <span>Fitness</span>
            </div>
            <RatingDisplay 
              value={ratings.fitness} 
              reviewCount={reviewCounts.fitness}
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              <span>Learning</span>
            </div>
            <RatingDisplay 
              value={ratings.learning} 
              reviewCount={reviewCounts.learning}
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-teal-500" />
              <span>Impact</span>
            </div>
            <RatingDisplay 
              value={ratings.impact} 
              reviewCount={reviewCounts.impact}
              size="sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}