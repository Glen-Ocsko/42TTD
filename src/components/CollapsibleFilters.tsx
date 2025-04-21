import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ActivityFilters from './ActivityFilters';

interface CollapsibleFiltersProps {
  filters: {
    difficulty: number;
    cost: number;
    enjoyment: number;
    time: number;
    rating: number;
    popularity: number;
  };
  onFilterChange: (type: string, value: number) => void;
  onClearFilters: () => void;
}

export default function CollapsibleFilters({ filters, onFilterChange, onClearFilters }: CollapsibleFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium">Filter Activities</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <ActivityFilters
          filters={filters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />
      </div>
    </div>
  );
}