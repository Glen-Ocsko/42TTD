import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePageState } from '../hooks/usePageState';
import { supabase } from '../lib/supabase';
import CreateYourOwnActivityCard from '../components/CreateYourOwnActivityCard';
import { 
  Search, 
  Filter, 
  ArrowUpDown,
  Loader2,
  X, 
  Eye,
  Check,
  ChevronDown,
  Tag,
  Clock,
  DollarSign,
  Target,
  LayoutGrid
} from 'lucide-react';
import ActivityCard from '../components/ActivityCard';
import DynamicAddToListButton from '../components/DynamicAddToListButton';
import debounce from 'lodash.debounce';

type ViewMode = 'compact' | 'regular' | 'spacious';

type SortOption = {
  id: string;
  label: string;
  field: string;
  ascending: boolean;
};

type FilterOption = {
  id: string;
  value: string | number;
  label: string;
};

type FilterCategory = {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
  selected: string[];
};

interface Activity {
  id: string;
  title: string;
  display_title?: string;
  description: string | null;
  category_id: string | null;
  category_tags: string[];
  difficulty: number;
  is_location_specific: boolean;
  image_url: string | null;
  created_at: string;
  cost?: number;
  time?: number;
  rating?: number;
  popularity?: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  unsplash_keywords?: string;
}

const PAGE_SIZE = 20;

const SORT_OPTIONS: SortOption[] = [
  { id: 'a-z', label: 'A to Z', field: 'title', ascending: true },
  { id: 'z-a', label: 'Z to A', field: 'title', ascending: false },
  { id: 'popular', label: 'Most Popular', field: 'popularity', ascending: false },
  { id: 'rating', label: 'Highest Rated', field: 'rating', ascending: false },
  { id: 'newest', label: 'Newest First', field: 'created_at', ascending: false },
  { id: 'random', label: 'Random', field: 'id', ascending: true }
];

const DIFFICULTY_OPTIONS: FilterOption[] = [
  { id: 'easy', value: 1, label: 'Easy' },
  { id: 'moderate', value: 3, label: 'Moderate' },
  { id: 'challenging', value: 5, label: 'Challenging' }
];

const COST_OPTIONS: FilterOption[] = [
  { id: 'free', value: 1, label: 'Free' },
  { id: 'budget', value: 3, label: 'Budget' },
  { id: 'premium', value: 5, label: 'Premium' }
];

const DURATION_OPTIONS: FilterOption[] = [
  { id: 'short', value: 1, label: 'Short' },
  { id: 'half-day', value: 3, label: 'Half Day' },
  { id: 'full-day', value: 4, label: 'Full Day' },
  { id: 'multi-day', value: 5, label: 'Multi-Day' }
];

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('regular');
  const [page, setPage] = useState(0);
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<{[key: string]: string[]}>({});
  const [pageState, updatePageState] = usePageState({
    currentSort: SORT_OPTIONS[0],
    searchQuery: '',
    showFilterPanel: false,
    showSortDropdown: false,
    viewMode: 'regular' as ViewMode,
    page: 0,
    filterCategories: [] as FilterCategory[],
    selectedFilters: {} as {[key: string]: string[]}
  });
  
  const { searchQuery: currentSearchQuery, showFilterPanel: currentShowFilterPanel, showSortDropdown: currentShowSortDropdown, viewMode: currentViewMode, page: currentPage, filterCategories: currentFilterCategories, selectedFilters: currentSelectedFilters } = pageState;
  const sortRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();
  const observer = useRef<IntersectionObserver>();
  const lastActivityRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        updatePageState({ page: page + 1 });
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setActivities([]);
    updatePageState({ page: 0 });
    setHasMore(true);
    fetchActivities(0);
  }, [selectedFilters, pageState.currentSort, searchQuery]);

  useEffect(() => {
    if (page > 0) {
      fetchActivities(page);
    }
  }, [page]);

  useEffect(() => {
    // Close sort dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('*, category_images(url, keywords)');

      if (error) throw error;

      const transformedCategories = data?.map(category => {
        // Check if we have a custom image from the category_images table
        const customImage = category.category_images?.url;
        const keywords = category.category_images?.keywords || category.name;
        
        return {
          ...category,
          imageUrl: customImage || `https://source.unsplash.com/800x600/?${encodeURIComponent(keywords.toLowerCase().replace(/[^a-z0-9]/g, ' '))}`,
          unsplash_keywords: keywords
        };
      }) || [];

      setCategories(transformedCategories);
      
      // Initialize filter categories
      const categoryFilterOptions = transformedCategories.map(cat => ({
        id: cat.id,
        value: cat.id,
        label: cat.name
      }));
      
      setFilterCategories([
        {
          id: 'categories',
          label: 'Categories',
          options: categoryFilterOptions,
          multiSelect: true,
          selected: []
        },
        {
          id: 'difficulty',
          label: 'Difficulty',
          options: DIFFICULTY_OPTIONS,
          selected: []
        },
        {
          id: 'cost',
          label: 'Cost',
          options: COST_OPTIONS,
          selected: []
        },
        {
          id: 'time',
          label: 'Duration',
          options: DURATION_OPTIONS,
          selected: []
        }
      ]);
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

      // Apply category filters
      if (selectedFilters.categories?.length > 0) {
        query = query.in('category_id', selectedFilters.categories);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,display_title.ilike.%${searchQuery}%`);
      }

      // Apply difficulty filter
      if (selectedFilters.difficulty?.length > 0) {
        const difficultyValues = selectedFilters.difficulty.map(id => 
          DIFFICULTY_OPTIONS.find(opt => opt.id === id)?.value
        ).filter(Boolean);
        
        if (difficultyValues.length > 0) {
          query = query.in('difficulty', difficultyValues);
        }
      }
      
      // Apply cost filter
      if (selectedFilters.cost?.length > 0) {
        const costValues = selectedFilters.cost.map(id => 
          COST_OPTIONS.find(opt => opt.id === id)?.value
        ).filter(Boolean);
        
        if (costValues.length > 0) {
          query = query.in('cost', costValues);
        }
      }
      
      // Apply time/duration filter
      if (selectedFilters.time?.length > 0) {
        const timeValues = selectedFilters.time.map(id => 
          DURATION_OPTIONS.find(opt => opt.id === id)?.value
        ).filter(Boolean);
        
        if (timeValues.length > 0) {
          query = query.in('time', timeValues);
        }
      }

      // Apply sorting
      if (pageState.currentSort.id === 'random') {
        // For random sorting, we'll use a different approach
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order(pageState.currentSort.field, {
          ascending: pageState.currentSort.ascending
        });
      }

      // Apply pagination
      query = query
        .range(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      if (pageNumber === 0) {
        // For random sorting, shuffle the results
        if (pageState.currentSort.id === 'random') {
          setActivities([...(data || [])].sort(() => Math.random() - 0.5));
        } else {
          setActivities(data || []);
        }
      } else {
        if (pageState.currentSort.id === 'random') {
          setActivities(prev => [...prev, ...([...(data || [])].sort(() => Math.random() - 0.5))]);
        } else {
          setActivities(prev => [...prev, ...(data || [])]);
        }
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
    updatePageState({ searchQuery: value });
  }, 300);

  const handleFilterChange = (categoryId: string, optionId: string) => {
    const updatedCategories = filterCategories.map(category => {
      if (category.id === categoryId) {
        // For multi-select categories
        if (category.multiSelect) {
          const newSelected = category.selected.includes(optionId)
            ? category.selected.filter(id => id !== optionId)
            : [...category.selected, optionId];
          
          return { ...category, selected: newSelected };
        } 
        // For single-select categories
        else {
          const newSelected = category.selected.includes(optionId)
            ? []
            : [optionId];
          
          return { ...category, selected: newSelected };
        }
      }
      return category;
    });

    updatePageState({ filterCategories: updatedCategories });

    // Update the selectedFilters object
    updateSelectedFilters();
  };

  const updateSelectedFilters = () => {
    const newFilters: {[key: string]: string[]} = {};
    
    filterCategories.forEach(category => {
      if (category.selected.length > 0) {
        newFilters[category.id] = category.selected;
      }
    });

    updatePageState({ selectedFilters: newFilters });
  };

  const handleSortChange = (option: SortOption) => {
    updatePageState({ 
      currentSort: option,
      showSortDropdown: false 
    });
  };

  const handleClearFilters = () => {
    const clearedCategories = filterCategories.map(category => ({ ...category, selected: [] }));
    updatePageState({ 
      filterCategories: clearedCategories,
      selectedFilters: {} 
    });
  };

  const handleRemoveFilter = (categoryId: string, optionId: string) => {
    handleFilterChange(categoryId, optionId);
  };

  const getFilterLabel = (categoryId: string, optionId: string): string => {
    const category = filterCategories.find(c => c.id === categoryId);
    if (!category) return '';
    
    const option = category.options.find(o => o.id === optionId);
    return option ? `${category.label}: ${option.label}` : '';
  };

  const getGridColsClass = () => {
    switch (viewMode) {
      case 'compact':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
      case 'spacious':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 'regular':
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };
  
  // Count total active filters
  const activeFilterCount = Object.values(selectedFilters).reduce(
    (count, filters) => count + filters.length, 
    0
  );

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign Up to Track Activities
            </button>
          )}
        </div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm rounded-lg p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  onChange={(e) => handleSearch(e.target.value)}
                  value={searchQuery}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => updatePageState({ showFilterPanel: !showFilterPanel })}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-lg border hover:bg-gray-50 transition-colors relative"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center justify-between gap-2 px-4 py-2 bg-white rounded-lg border hover:bg-gray-50 transition-colors w-full md:w-auto"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5" />
                    <span>Sort: {pageState.currentSort.label}</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 border overflow-hidden">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleSortChange(option)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${
                          pageState.currentSort.id === option.id ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        <span>{option.label}</span>
                        {pageState.currentSort.id === option.id && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Mode Selector */}
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-gray-500" />
                <div className="flex rounded-lg overflow-hidden border">
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`px-3 py-1 text-sm ${viewMode === 'compact' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => setViewMode('regular')}
                    className={`px-3 py-1 text-sm ${viewMode === 'regular' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                  >
                    Regular
                  </button>
                  <button
                    onClick={() => setViewMode('spacious')}
                    className={`px-3 py-1 text-sm ${viewMode === 'spacious' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                  >
                    Spacious
                  </button>
                </div>
              </div>
            </div>
            
            {/* Filter Panel */}
            {showFilterPanel && (
              <div className="bg-white rounded-lg border p-4 mt-2 animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Filter Activities</h3>
                  {activeFilterCount > 0 && (
                    <button 
                      onClick={handleClearFilters}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filterCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-1">
                        {category.id === 'categories' && <Tag className="h-4 w-4" />}
                        {category.id === 'difficulty' && <Target className="h-4 w-4" />}
                        {category.id === 'cost' && <DollarSign className="h-4 w-4" />}
                        {category.id === 'time' && <Clock className="h-4 w-4" />}
                        {category.label}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {category.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleFilterChange(category.id, option.id)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${
                              category.selected.includes(option.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {Object.entries(selectedFilters).map(([categoryId, optionIds]) => 
                  optionIds.map(optionId => (
                    <div 
                      key={`${categoryId}-${optionId}`}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      <span>{getFilterLabel(categoryId, optionId)}</span>
                      <button 
                        onClick={() => handleRemoveFilter(categoryId, optionId)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      <div className={`grid ${getGridColsClass()} gap-4`}>
        {/* Manually inserted card - always appears first regardless of filters/sorting */}
        <CreateYourOwnActivityCard />
        
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
                className="relative group"
              >
                <div className="relative overflow-hidden rounded-lg">
                  <div 
                    className="cursor-pointer"
                    onClick={() => navigate(`/activities/${activity.id}`)}
                  >
                    <img 
                      src={activity.image_url || `https://source.unsplash.com/800x600/?${encodeURIComponent(activity.title)}`}
                      alt={activity.title}
                      className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(activity.title)}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <div className="text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        <span>View Details</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 z-10 flex items-center">
                    {!isAuthenticated && (
                      <div className="bg-gray-800/80 text-white text-xs px-2 py-1 rounded-lg mr-2 whitespace-nowrap flex items-center gap-1 z-20">
                        Sign in to add to your list
                      </div>
                    )}
                    <DynamicAddToListButton 
                      activityId={activity.id}
                      className="px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-1 text-xs font-medium z-20"
                      iconOnly={true}
                    />
                  </div>
                </div>
                <div className="p-3 bg-white rounded-b-lg">
                  <h3 className="font-bold text-gray-900 truncate">{activity.display_title || activity.title}</h3>
                  {viewMode !== 'compact' && activity.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{activity.description}</p>
                  )}
                  {viewMode === 'spacious' && activity.category_tags && activity.category_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {activity.category_tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                          {tag}
                        </span>
                      ))}
                      {activity.category_tags.length > 2 && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                          +{activity.category_tags.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
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