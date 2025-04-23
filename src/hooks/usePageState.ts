import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Define a type for the state we want to preserve
export interface PageState {
  scrollPosition?: number;
  searchQuery?: string;
  filters?: Record<string, any>;
  sortOption?: string;
  viewMode?: string;
  [key: string]: any; // Allow for additional properties
}

export function usePageState(initialState: PageState = {}) {
  const location = useLocation();
  const [state, setState] = useState<PageState>(initialState);
  const currentPath = location.pathname + location.search;
  
  // Load state from sessionStorage when component mounts or route changes
  useEffect(() => {
    const savedState = sessionStorage.getItem(`pageState-${currentPath}`);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setState(prev => ({ ...prev, ...parsedState }));
        
        // Restore scroll position if available
        if (parsedState.scrollPosition) {
          window.scrollTo(0, parsedState.scrollPosition);
        }
      } catch (e) {
        console.error('Error parsing saved page state:', e);
      }
    }
  }, [currentPath]);
  
  // Save state to sessionStorage when it changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Add current scroll position to state before saving
      const stateWithScroll = {
        ...state,
        scrollPosition: window.scrollY
      };
      sessionStorage.setItem(`pageState-${currentPath}`, JSON.stringify(stateWithScroll));
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also save when component unmounts
      handleBeforeUnload();
    };
  }, [state, currentPath]);
  
  // Update state function that also saves to sessionStorage
  const updateState = (newState: Partial<PageState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      sessionStorage.setItem(`pageState-${currentPath}`, JSON.stringify(updated));
      return updated;
    });
  };
  
  return [state, updateState] as const;
}