import React, { createContext, useContext, useState } from 'react';

export type DemoUser = {
  id: string;
  email: string;
  role: 'free' | 'premium' | 'pro';
  username: string;
  full_name: string;
  avatar_url: string;
  onboarding_completed: boolean;
  quiz_completed: boolean;
  location: string;
  age: number;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  interests: string[];
  health_considerations: string[];
  notification_preferences: { push: boolean; email: boolean };
  privacy_default: 'public' | 'friends' | 'private';
  is_admin: boolean;
  is_moderator: boolean;
};

interface DemoContextType {
  isDemoMode: boolean;
  demoUser: DemoUser | null;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  setDemoRole: (role: 'free' | 'premium' | 'pro') => void;
  setDemoAdmin: (isAdmin: boolean) => void;
  setDemoModerator: (isModerator: boolean) => void;
  getDemoUserId: () => string | null;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const DEFAULT_DEMO_USER: DemoUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@example.com',
  role: 'free',
  username: 'demo_user',
  full_name: 'Demo User',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  location: 'San Francisco, CA',
  age: 28,
  gender: 'prefer_not_to_say',
  interests: ['Adventure', 'Travel', 'Photography', 'Fitness', 'Learning'],
  health_considerations: ['none'],
  notification_preferences: { push: true, email: true },
  privacy_default: 'public',
  onboarding_completed: true,
  quiz_completed: true,
  is_admin: false,
  is_moderator: false
};

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  const enableDemoMode = () => {
    setDemoUser(DEFAULT_DEMO_USER);
    setIsDemoMode(true);
  };

  const disableDemoMode = () => {
    setDemoUser(null);
    setIsDemoMode(false);
  };

  const setDemoRole = (role: 'free' | 'premium' | 'pro') => {
    if (demoUser) {
      setDemoUser({ ...demoUser, role });
    }
  };

  const setDemoAdmin = (isAdmin: boolean) => {
    if (demoUser) {
      setDemoUser({ ...demoUser, is_admin: isAdmin });
    }
  };

  const setDemoModerator = (isModerator: boolean) => {
    if (demoUser) {
      setDemoUser({ ...demoUser, is_moderator: isModerator });
    }
  };

  const getDemoUserId = () => {
    return isDemoMode && demoUser ? demoUser.id : null;
  };

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      demoUser,
      enableDemoMode,
      disableDemoMode,
      setDemoRole,
      setDemoAdmin,
      setDemoModerator,
      getDemoUserId
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}