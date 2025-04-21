import React from 'react';
import { KeyRound as Pound, Clock, Target, Trophy, Heart, Users, X } from 'lucide-react';

interface FilterProps {
  onFilterChange: (type: string, value: number) => void;
  onClearFilters: () => void;
  filters?: {
    difficulty?: number;
    cost?: number;
    enjoyment?: number;
    time?: number;
    rating?: number;
    popularity?: number;
  };
}

const FilterSection = ({
  icon: Icon,
  label,
  value = 0,
  onChange,
  symbol = '★'
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  onChange: (value: number) => void;
  symbol?: string;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 text-gray-700">
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            star <= value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          {symbol}
        </button>
      ))}
    </div>
  </div>
);

export default function ActivityFilters({ onFilterChange, onClearFilters, filters = {} }: FilterProps) {
  const {
    difficulty = 0,
    cost = 0,
    enjoyment = 0,
    time = 0,
    rating = 0,
    popularity = 0
  } = filters;

  const hasActiveFilters = [difficulty, cost, enjoyment, time, rating, popularity].some(value => value > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            Clear all filters
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <FilterSection
          icon={Target}
          label="Difficulty"
          value={difficulty}
          onChange={(value) => onFilterChange('difficulty', value)}
          symbol="🎯"
        />
        <FilterSection
          icon={Pound}
          label="Cost"
          value={cost}
          onChange={(value) => onFilterChange('cost', value)}
          symbol="£"
        />
        <FilterSection
          icon={Heart}
          label="Enjoyment"
          value={enjoyment}
          onChange={(value) => onFilterChange('enjoyment', value)}
          symbol="❤️"
        />
        <FilterSection
          icon={Clock}
          label="Time"
          value={time}
          onChange={(value) => onFilterChange('time', value)}
          symbol="⏰"
        />
        <FilterSection
          icon={Trophy}
          label="Rating"
          value={rating}
          onChange={(value) => onFilterChange('rating', value)}
          symbol="⭐"
        />
        <FilterSection
          icon={Users}
          label="Popularity"
          value={popularity}
          onChange={(value) => onFilterChange('popularity', value)}
          symbol="👥"
        />
      </div>
    </div>
  );
}