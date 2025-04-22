import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  imageUrl: string;
  unsplash_keywords?: string;
}

interface CategoryCarouselProps {
  categories: Category[];
  selectedCategories: string[];
  onCategorySelect: (categoryId: string) => void;
}

const getCategoryImage = (category: Category) => {
  // Add a timestamp to prevent caching issues with Unsplash
  const timestamp = new Date().getTime();
  const keywords = category.unsplash_keywords || encodeURIComponent(category.name.toLowerCase().replace(/[^a-z0-9]/g, ' '));
  return `${category.imageUrl}?t=${timestamp}`;
};

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
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden md:block">
        <button
          onClick={() => scroll('left')}
          className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-transform hover:scale-105"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`relative flex-none w-48 h-48 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              selectedCategories.includes(category.id)
                ? 'ring-4 ring-blue-500'
                : ''
            }`}
          >
            <div className="absolute inset-0 bg-gray-200 animate-pulse">
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <img
              src={getCategoryImage(category)}
              alt={`${category.name} category`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                // If image fails to load, set a fallback
                const target = e.target as HTMLImageElement;
                target.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(category.name.toLowerCase())}`;
              }}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 hover:opacity-80"
            />
            <div className="absolute inset-0 flex items-end p-4 z-10">
              <h3 className="text-white font-bold text-lg drop-shadow-md">
                {category.name}
              </h3>
            </div>
          </button>
        ))}
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden md:block">
        <button
          onClick={() => scroll('right')}
          className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-transform hover:scale-105"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6 text-gray-600" />
        </button>
      </div>
    </div>
  );
}