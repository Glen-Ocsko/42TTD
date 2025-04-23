import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function NavigationHistoryButtons() {
  const [canNavigate, setCanNavigate] = useState(false);

  useEffect(() => {
    // Check if navigation is possible
    setCanNavigate(window.history.length > 1);

    // Save scroll position on page unload
    const saveScrollPosition = () => {
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem(`scrollPos-${currentPath}`, window.scrollY.toString());
    };

    // Add event listeners
    window.addEventListener('beforeunload', saveScrollPosition);
    
    // Save position on route change
    const handleRouteChange = () => {
      saveScrollPosition();
    };

    // Create a MutationObserver to detect route changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.target.nodeName === 'TITLE') {
          handleRouteChange();
        }
      });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.querySelector('head')!, { childList: true, subtree: true });

    // Restore scroll position if available
    const currentPath = window.location.pathname + window.location.search;
    const savedPosition = sessionStorage.getItem(`scrollPos-${currentPath}`);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
    }

    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition);
      observer.disconnect();
    };
  }, []);

  if (!canNavigate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 md:left-4 z-40 flex items-center gap-2">
      <button
        onClick={() => {
          // Save current scroll position before navigating back
          const currentPath = window.location.pathname + window.location.search;
          sessionStorage.setItem(`scrollPos-${currentPath}`, window.scrollY.toString());
          window.history.back();
        }}
        className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5 text-gray-700" />
      </button>
      <button
        onClick={() => {
          // Save current scroll position before navigating forward
          const currentPath = window.location.pathname + window.location.search;
          sessionStorage.setItem(`scrollPos-${currentPath}`, window.scrollY.toString());
          window.history.forward();
        }}
        className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
        aria-label="Go forward"
      >
        <ArrowRight className="h-5 w-5 text-gray-700" />
      </button>
    </div>
  );
}