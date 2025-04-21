import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  imageUrl: string;
}

interface CategoryCarouselProps {
  categories: Category[];
  selectedCategories: string[];
  onCategorySelect: (categoryId: string) => void;
}

export default function CategoryCarousel({ 
  categories = [], 
  selectedCategories = [], 
  onCategorySelect 
}: CategoryCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollAmount = direction === 'left' ? -300 : 300;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="relative mb-8">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10">
        <button
          onClick={() => scroll('left')}
          className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`relative flex-none w-48 h-48 rounded-lg overflow-hidden transition-transform hover:scale-105 ${
              selectedCategories.includes(category.id)
                ? 'ring-4 ring-blue-500'
                : ''
            }`}
          >
            <img
              src={category.imageUrl}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex items-end p-4">
              <h3 className="text-white font-medium text-lg">
                {category.name}
              </h3>
            </div>
          </button>
        ))}
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10">
        <button
          onClick={() => scroll('right')}
          className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
        >
          <ChevronRight className="h-6 w-6 text-gray-600" />
        </button>
      </div>
    </div>
  );
}