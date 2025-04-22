import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export function useCurrentUser() {
  const { user } = useAuth();
  const { isDemoMode, demoUser } = useDemo();
  const [isModerator, setIsModerator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isDemoMode && demoUser) {
      setIsModerator(demoUser.is_moderator || false);
      setIsAdmin(demoUser.is_admin || false);
    } else if (user) {
      checkModeratorStatus();
    }
  }, [user, isDemoMode, demoUser]);

  const checkModeratorStatus = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_moderator, is_admin')
        .eq('id', user?.id)
        .single();

      if (data) {
        setIsModerator(data.is_moderator || false);
        setIsAdmin(data.is_admin || false);
      }
    } catch (err) {
      console.error('Error checking moderator status:', err);
    }
  };

  // In demo mode, use the demo user
  const currentUser = isDemoMode ? {
    id: DEMO_USER_ID,
    ...demoUser
  } : user;

  return {
    user: currentUser,
    userId: currentUser?.id || null,
    isAuthenticated: Boolean(currentUser) || isDemoMode,
    isModerator,
    isAdmin,
    isDemoMode
  };
}