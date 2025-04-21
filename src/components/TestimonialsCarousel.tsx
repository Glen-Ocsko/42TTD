import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Crown, Trophy, User } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  quote: string;
  achievement: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Premium Member",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80",
    quote: "The premium features helped me achieve my goals faster than I ever thought possible. The community support is incredible!",
    achievement: "Completed 15 bucket list items in 6 months"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "Pro Member",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80",
    quote: "The AI suggestions opened my eyes to adventures I'd never considered before. Now I'm living life to the fullest!",
    achievement: "Sponsored 5 community goals"
  },
  {
    id: 3,
    name: "Emily Taylor",
    role: "Premium Member",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80",
    quote: "Streak tracking keeps me motivated, and the community support is incredible. I've made amazing friends here!",
    achievement: "Maintained a 90-day activity streak"
  },
  {
    id: 4,
    name: "David Kim",
    role: "Pro Member",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80",
    quote: "The coaching features helped me turn my dreams into reality. I've accomplished things I never thought possible.",
    achievement: "Completed all 42 activities"
  },
  {
    id: 5,
    name: "Sophia Martinez",
    role: "Premium Member",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80",
    quote: "This platform changed my life. I'm more adventurous, confident, and connected than ever before.",
    achievement: "Inspired 20+ community members"
  }
];

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollAmount = direction === 'left' ? -container.offsetWidth : container.offsetWidth;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      scroll('right');
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-6 pb-4 px-4">
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-none w-[300px] sm:w-[350px] bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                {testimonial.image ? (
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{testimonial.name}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    {testimonial.role === 'Premium Member' ? (
                      <Crown className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Trophy className="h-4 w-4 text-purple-500" />
                    )}
                    <span className="text-gray-600">{testimonial.role}</span>
                  </div>
                </div>
              </div>
              <blockquote className="text-gray-600 mb-4">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                <Trophy className="h-4 w-4" />
                {testimonial.achievement}
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