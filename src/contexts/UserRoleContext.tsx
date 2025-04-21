import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useDemo } from './DemoContext';
import { supabase } from '../lib/supabase';

export type UserRole = 'free' | 'premium' | 'pro';

interface UserRoleContextType {
  role: UserRole;
  loading: boolean;
  isPremium: boolean;
  isPro: boolean;
  toggleRole: (newRole: UserRole) => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isDemoMode, demoUser, setDemoRole } = useDemo();
  const [role, setRole] = useState<UserRole>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode && demoUser) {
      setRole(demoUser.role);
      setLoading(false);
    } else if (user) {
      loadUserRole();
    } else {
      setRole('free');
      setLoading(false);
    }
  }, [user, isDemoMode, demoUser]);

  const loadUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setRole(data?.role || 'free');
    } catch (err) {
      console.error('Error loading user role:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (newRole: UserRole) => {
    if (isDemoMode) {
      setDemoRole(newRole);
      setRole(newRole);
      return;
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: newRole,
          upgraded_at: new Date().toISOString()
        });

      if (error) throw error;
      setRole(newRole);
    } catch (err) {
      console.error('Error updating role:', err);
      throw err;
    }
  };

  return (
    <UserRoleContext.Provider
      value={{
        role,
        loading,
        isPremium: role === 'premium' || role === 'pro',
        isPro: role === 'pro',
        toggleRole
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}