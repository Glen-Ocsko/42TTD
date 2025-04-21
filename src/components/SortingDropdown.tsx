import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowDown, ArrowUp, Clock, Star, Target, Heart, DollarSign } from 'lucide-react';

export type SortOption = {
  id: string;
  label: string;
  field: string;
  ascending?: boolean;
};

interface SortingDropdownProps {
  onSort: (option: SortOption) => void;
  currentSort: SortOption | null;
}

const sortOptions: SortOption[] = [
  { id: 'recent', label: 'Recently Added', field: 'created_at', ascending: false },
  { id: 'oldest', label: 'Oldest First', field: 'created_at', ascending: true },
  { id: 'a-z', label: 'A to Z', field: 'title', ascending: true },
  { id: 'z-a', label: 'Z to A', field: 'title', ascending: false },
  { id: 'difficulty-high', label: 'Most Difficult', field: 'difficulty', ascending: false },
  { id: 'difficulty-low', label: 'Least Difficult', field: 'difficulty', ascending: true },
  { id: 'cost-high', label: 'Most Expensive', field: 'cost', ascending: false },
  { id: 'cost-low', label: 'Least Expensive', field: 'cost', ascending: true },
  { id: 'rating-high', label: 'Highest Rated', field: 'rating', ascending: false },
  { id: 'rating-low', label: 'Lowest Rated', field: 'rating', ascending: true }
];

const getIconForSort = (option: SortOption) => {
  switch (option.field) {
    case 'created_at':
      return <Clock className="h-4 w-4" />;
    case 'rating':
      return <Star className="h-4 w-4" />;
    case 'difficulty':
      return <Target className="h-4 w-4" />;
    case 'cost':
      return <DollarSign className="h-4 w-4" />;
    default:
      return null;
  }
};

export default function SortingDropdown({ onSort, currentSort }: SortingDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors border"
      >
        <div className="flex items-center gap-2">
          {currentSort ? (
            <>
              {getIconForSort(currentSort)}
              <span className="text-gray-900">{currentSort.label}</span>
            </>
          ) : (
            <span className="text-gray-500">Sort by...</span>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border divide-y">
          {sortOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onSort(option);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                currentSort?.id === option.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {getIconForSort(option)}
                <span>{option.label}</span>
              </div>
              {option.ascending !== undefined && (
                option.ascending ? (
                  <ArrowUp className={`h-4 w-4 ${currentSort?.id === option.id ? 'text-blue-600' : 'text-gray-400'}`} />
                ) : (
                  <ArrowDown className={`h-4 w-4 ${currentSort?.id === option.id ? 'text-blue-600' : 'text-gray-400'}`} />
                )
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}