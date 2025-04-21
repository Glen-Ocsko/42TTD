import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase } from '../lib/supabase';
import ProgressTracker from '../components/ProgressTracker';
import { 
  Search, 
  Filter, 
  Plus, 
  Lock, 
  ChevronDown,
  ChevronUp,
  Loader2,
  UserPlus,
  X
} from 'lucide-react';
import ActivityCard from '../components/ActivityCard';
import CollapsibleFilters from '../components/CollapsibleFilters';
import SortingDropdown, { SortOption } from '../components/SortingDropdown';
import CategoryCarousel from '../components/CategoryCarousel';
import debounce from 'lodash.debounce';

interface Activity {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  category_tags: string[];
  difficulty: number;
  is_location_specific: boolean;
  image_url: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
}

const PAGE_SIZE = 20;

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentSort, setCurrentSort] = useState<SortOption | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    difficulty: 0,
    cost: 0,
    enjoyment: 0,
    time: 0,
    rating: 0,
    popularity: 0
  });

  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();
  const observer = useRef<IntersectionObserver>();
  const lastActivityRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setActivities([]);
    setPage(0);
    setHasMore(true);
    fetchActivities(0);
  }, [selectedCategories, currentSort, filters, searchQuery]);

  useEffect(() => {
    if (page > 0) {
      fetchActivities(page);
    }
  }, [page]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('*');

      if (error) throw error;

      const transformedCategories = data.map(category => ({
        ...category,
        imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(category.name.toLowerCase().replace(/[^a-z0-9]/g, ','))}`
      }));

      setCategories(transformedCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchActivities = async (pageNumber: number) => {
    try {
      if (pageNumber === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let query = supabase
        .from('activities')
        .select('*', { count: 'exact' });

      // Apply category filter
      if (selectedCategories.length > 0) {
        query = query.in('category_id', selectedCategories);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply other filters
      if (filters.difficulty > 0) {
        query = query.gte('difficulty', filters.difficulty);
      }
      if (filters.cost > 0) {
        query = query.gte('cost', filters.cost);
      }
      if (filters.enjoyment > 0) {
        query = query.gte('enjoyment', filters.enjoyment);
      }
      if (filters.time > 0) {
        query = query.gte('time', filters.time);
      }
      if (filters.rating > 0) {
        query = query.gte('rating', filters.rating);
      }

      // Apply sorting
      if (currentSort) {
        query = query.order(currentSort.field, {
          ascending: currentSort.ascending
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query
        .range(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      if (pageNumber === 0) {
        setActivities(data || []);
      } else {
        setActivities(prev => [...prev, ...(data || [])]);
      }

      setHasMore(count ? (pageNumber + 1) * PAGE_SIZE < count : false);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = debounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSort = (option: SortOption) => {
    setCurrentSort(option);
  };

  const handleFilterChange = (type: string, value: number) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      difficulty: 0,
      cost: 0,
      enjoyment: 0,
      time: 0,
      rating: 0,
      popularity: 0
    });
    setSelectedCategories([]);
    setSearchQuery('');
    setCurrentSort(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserPlus className="h-5 w-5" />
              Sign Up to Track Activities
            </button>
          )}
        </div>

        {/* Search and Filters Row */}
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter and Sort Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-lg border hover:bg-gray-50"
            >
              <Filter className="h-5 w-5" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              {showFilters ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={() => setShowSort(!showSort)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-lg border hover:bg-gray-50"
            >
              <Filter className="h-5 w-5" />
              <span>{showSort ? 'Hide Sort Options' : 'Sort Activities'}</span>
              {showSort ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Filters */}
          <div className={`transition-all duration-300 ${showFilters ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <CollapsibleFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Sort Options */}
          <div className={`transition-all duration-300 ${showSort ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <SortingDropdown onSort={handleSort} currentSort={currentSort} />
          </div>
        </div>
      </div>

      {/* Category Carousel */}
      <CategoryCarousel 
        categories={categories}
        selectedCategories={selectedCategories}
        onCategorySelect={handleCategorySelect}
      />

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : activities.length > 0 ? (
          <>
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                ref={index === activities.length - 1 ? lastActivityRef : undefined}
              >
                <ActivityCard activity={activity} />
              </div>
            ))}
            {loadingMore && (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
              </div>
            )}
          </>
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No activities found</p>
          </div>
        )}
      </div>
    </div>
  );
}