import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Tag, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import debounce from 'lodash.debounce';

interface CommunityPost {
  id: string;
  content: string;
  created_at: string;
  activity: {
    id: string;
    title: string;
  };
  user: {
    username: string;
    avatar_url: string | null;
  };
}

export default function CommunityCarousel() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    loadPosts();
    // Set up interval to refresh posts
    const interval = setInterval(loadPosts, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('activity_posts')
        .select(`
          id,
          content,
          created_at,
          activity:activities!activity_posts_activity_id_fkey (
            id,
            title
          ),
          profiles!activity_posts_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(12);

      if (fetchError) throw fetchError;

      // Filter out posts with missing relations and transform the data
      const transformedPosts = data
        ?.filter(post => post.activity && post.profiles)
        .map(post => ({
          ...post,
          activity: post.activity,
          user: post.profiles
        })) || [];

      setPosts(transformedPosts);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      e.preventDefault();
      const x = e.pageX - containerRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      containerRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollAmount = direction === 'left' ? -container.offsetWidth : container.offsetWidth;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const debouncedHandleMouseMove = debounce(handleMouseMove, 10);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No community posts yet – be the first to share!
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={debouncedHandleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="flex gap-6 pb-4 px-4"
          style={{ 
            paddingLeft: '1px',
            gridAutoFlow: 'column',
            gridAutoColumns: 'minmax(250px, 1fr)'
          }}
        >
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                flex-none
                w-[300px] sm:w-[350px]
                bg-white rounded-xl shadow-sm p-6
                hover:shadow-md transition-shadow
                cursor-pointer
                ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
              `}
              onClick={() => navigate(`/users?activity=${post.activity.id}`)}
            >
              <div className="flex items-center gap-4 mb-4">
                {post.user.avatar_url ? (
                  <img
                    src={post.user.avatar_url}
                    alt={post.user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{post.user.username}</h3>
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <Tag className="h-3 w-3" />
                    {post.activity.title}
                  </div>
                </div>
              </div>
              <div className="relative">
                <p className="text-gray-600 line-clamp-3">{post.content}</p>
                <div className="absolute bottom-0 right-0 bg-gradient-to-l from-white via-white/90 to-transparent px-2">
                  <span className="text-blue-600 text-sm hover:text-blue-700">
                    Read more
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll Buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 hidden md:block"
      >
        <ChevronLeft className="h-6 w-6 text-gray-600" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 hidden md:block"
      >
        <ChevronRight className="h-6 w-6 text-gray-600" />
      </button>
    </div>
  );
}