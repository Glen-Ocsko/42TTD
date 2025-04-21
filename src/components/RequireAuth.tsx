import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isDemoMode } = useCurrentUser();

  // Allow access in both authenticated and demo modes
  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}