import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export function useCurrentUser() {
  const { user } = useAuth();
  const { isDemoMode, demoUser } = useDemo();

  // In demo mode, use the demo user
  const currentUser = isDemoMode ? {
    id: DEMO_USER_ID,
    ...demoUser
  } : user;

  return {
    user: currentUser,
    userId: currentUser?.id || null,
    isAuthenticated: Boolean(currentUser) || isDemoMode,
    isDemoMode
  };
}