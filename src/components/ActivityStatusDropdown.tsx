import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowDown, Clock, Target, CheckCircle2, Loader2 } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase, safeUserQuery } from '../lib/supabase';

interface ActivityStatusDropdownProps {
  activityId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  onChange: (status: 'not_started' | 'in_progress' | 'completed') => void;
  className?: string;
}

export default function ActivityStatusDropdown({ 
  activityId,
  status, 
  onChange,
  className = ''
}: ActivityStatusDropdownProps) {
  const { userId } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const statusConfig = {
    not_started: {
      icon: <Target className="h-4 w-4" />,
      text: 'Not Started',
      classes: 'text-gray-700'
    },
    in_progress: {
      icon: <Clock className="h-4 w-4" />,
      text: 'In Progress',
      classes: 'text-blue-700'
    },
    completed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      text: 'Completed',
      classes: 'text-green-700'
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2`;
    
    const icon = type === 'success' 
      ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
      : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
    
    toast.innerHTML = `${icon}<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleSelect = async (newStatus: 'not_started' | 'in_progress' | 'completed') => {
    if (loading || newStatus === status || !userId) return;

    setLoading(true);
    try {
      await safeUserQuery(
        async (uid) => {
          const { error } = await supabase
            .from('user_activities')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', uid)
            .eq('id', activityId);

          if (error) throw error;
        },
        userId
      );

      onChange(newStatus);
      setIsOpen(false);
      showToast(`Status updated to ${newStatus.replace('_', ' ')}`);

    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!loading) setIsOpen(!isOpen);
        }}
        disabled={loading}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            statusConfig[status].icon
          )}
          <span className={statusConfig[status].classes}>
            {loading ? 'Updating...' : statusConfig[status].text}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => handleSelect(key as 'not_started' | 'in_progress' | 'completed')}
              disabled={loading || key === status}
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                key === status ? 'bg-gray-50' : ''
              } ${config.classes}`}
            >
              {config.icon}
              {config.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}