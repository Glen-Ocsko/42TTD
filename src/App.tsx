import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRoleProvider } from './contexts/UserRoleContext';
import { DemoProvider, useDemo } from './contexts/DemoContext';
import { QuizProvider } from './contexts/QuizContext';
import { PaymentProvider } from './components/PaymentProvider';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import DemoModeIndicator from './components/DemoModeIndicator';
import ErrorBoundary from './components/ErrorBoundary';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import { initializeApp } from './lib/capacitor';
import { useDeepLink } from './hooks/useDeepLink';
import OfflineNotice from './components/OfflineNotice';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Activities from './pages/Activities';
import ActivityDetail from './pages/ActivityDetail';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import OnboardingQuiz from './pages/OnboardingQuiz';
import SuggestedList from './pages/SuggestedList';
import Feed from './pages/Feed';
import Community from './pages/Community';
import Coaching from './pages/Coaching';
import Pricing from './pages/Pricing';
import ContactSupplier from './pages/ContactSupplier';
import Quiz from './pages/Quiz';
import Start from './pages/Start';
import AdminEditor from './pages/AdminEditor';
import Supplier from './pages/Supplier';
import AdminSuppliers from './pages/AdminSuppliers';
import Messages from './pages/Messages';
import UserProfile from './pages/UserProfile';
import Users from './pages/Users';
import ModerationQueue from './components/ModerationQueue';
import ModerationDashboard from './components/ModerationDashboard';
import ModerationSettings from './components/ModerationSettings';
import UserManagement from './components/UserManagement';
import ModerationAppeals from './components/ModerationAppeals';

// Static Pages
import AboutUs from './pages/static/AboutUs';
import PrivacyPolicy from './pages/static/PrivacyPolicy';
import Terms from './pages/static/Terms';
import Contact from './pages/static/Contact';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isDemoMode, demoUser } = useDemo();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user && !isDemoMode) {
    return <Navigate to="/login" />;
  }

  return <RouteErrorBoundary>{children}</RouteErrorBoundary>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isDemoMode, demoUser } = useDemo();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode && demoUser) {
      setProfile({
        onboarding_completed: true,
        quiz_completed: true
      });
      setLoadingProfile(false);
      return;
    }

    if (user) {
      loadProfile();
    } else {
      setLoadingProfile(false);
    }
  }, [user, isDemoMode, demoUser]);

  const loadProfile = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('onboarding_completed, quiz_completed')
        .eq('id', user?.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user?.id,
            email: user?.email,
            health_considerations: ['none'],
            onboarding_completed: false,
            quiz_completed: false
          });

        if (insertError) throw insertError;
        setProfile({ onboarding_completed: false, quiz_completed: false });
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-md">
          <p className="font-medium">Error loading profile</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return <Navigate to="/login" />;
  }

  if (isDemoMode && demoUser) {
    return <RouteErrorBoundary>{children}</RouteErrorBoundary>;
  }

  if (!profile || !profile.onboarding_completed) {
    return <Navigate to="/onboarding" />;
  }

  if (!profile.quiz_completed) {
    return <Navigate to="/onboarding/quiz" />;
  }

  return <RouteErrorBoundary>{children}</RouteErrorBoundary>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isDemoMode, demoUser } = useDemo();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (isDemoMode && demoUser) {
      setIsAdmin(demoUser.is_admin);
      setCheckingAdmin(false);
      return;
    }

    if (user) {
      checkAdminStatus();
    } else {
      setCheckingAdmin(false);
    }
  }, [user, isDemoMode, demoUser]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (err) {
      console.error('Error checking admin status:', err);
    } finally {
      setCheckingAdmin(false);
    }
  };

  if (loading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return <RouteErrorBoundary>{children}</RouteErrorBoundary>;
}

function ModeratorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isDemoMode, demoUser } = useDemo();
  const [isModerator, setIsModerator] = useState(false);
  const [checkingModerator, setCheckingModerator] = useState(true);

  useEffect(() => {
    if (isDemoMode && demoUser) {
      setIsModerator(demoUser.is_moderator || demoUser.is_admin);
      setCheckingModerator(false);
      return;
    }

    if (user) {
      checkModeratorStatus();
    } else {
      setCheckingModerator(false);
    }
  }, [user, isDemoMode, demoUser]);

  const checkModeratorStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_moderator, is_admin')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setIsModerator(data?.is_moderator || data?.is_admin || false);
    } catch (err) {
      console.error('Error checking moderator status:', err);
    } finally {
      setCheckingModerator(false);
    }
  };

  if (loading || checkingModerator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return <Navigate to="/login" />;
  }

  if (!isModerator) {
    return <Navigate to="/" />;
  }

  return <RouteErrorBoundary>{children}</RouteErrorBoundary>;
}

function AppRoutes() {
  // Set up deep linking
  useDeepLink();
  
  return (
    <Routes>
      <Route path="/" element={<RouteErrorBoundary><Home /></RouteErrorBoundary>} />
      <Route path="/login" element={<RouteErrorBoundary><Login /></RouteErrorBoundary>} />
      <Route path="/register" element={<RouteErrorBoundary><Register /></RouteErrorBoundary>} />
      <Route path="/pricing" element={<RouteErrorBoundary><Pricing /></RouteErrorBoundary>} />
      <Route path="/feed" element={<RouteErrorBoundary><Feed /></RouteErrorBoundary>} />
      <Route path="/feed/:activityId" element={<RouteErrorBoundary><Feed /></RouteErrorBoundary>} />
      <Route path="/activities" element={<RouteErrorBoundary><Activities /></RouteErrorBoundary>} />
      <Route path="/activities/:id" element={<RouteErrorBoundary><ActivityDetail /></RouteErrorBoundary>} />
      <Route path="/community" element={<RouteErrorBoundary><Community /></RouteErrorBoundary>} />
      <Route path="/users" element={<RouteErrorBoundary><Users /></RouteErrorBoundary>} />
      <Route path="/users/:username" element={<RouteErrorBoundary><UserProfile /></RouteErrorBoundary>} />
      <Route path="/contact-supplier" element={<RouteErrorBoundary><ContactSupplier /></RouteErrorBoundary>} />
      <Route path="/quiz" element={<RouteErrorBoundary><Quiz /></RouteErrorBoundary>} />
      <Route path="/start" element={<RouteErrorBoundary><Start /></RouteErrorBoundary>} />
      <Route path="/messages" element={<RouteErrorBoundary><Messages /></RouteErrorBoundary>} />

      {/* Static Pages */}
      <Route path="/about" element={<RouteErrorBoundary><AboutUs /></RouteErrorBoundary>} />
      <Route path="/privacy" element={<RouteErrorBoundary><PrivacyPolicy /></RouteErrorBoundary>} />
      <Route path="/terms" element={<RouteErrorBoundary><Terms /></RouteErrorBoundary>} />
      <Route path="/contact" element={<RouteErrorBoundary><Contact /></RouteErrorBoundary>} />

      {/* Supplier Routes */}
      <Route
        path="/supplier"
        element={
          <PrivateRoute>
            <Supplier />
          </PrivateRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin-editor"
        element={
          <AdminRoute>
            <AdminEditor />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/suppliers"
        element={
          <AdminRoute>
            <AdminSuppliers />
          </AdminRoute>
        }
      />

      {/* Moderation Routes */}
      <Route
        path="/moderation/queue"
        element={
          <ModeratorRoute>
            <ModerationQueue />
          </ModeratorRoute>
        }
      />
      <Route
        path="/moderation/dashboard"
        element={
          <ModeratorRoute>
            <ModerationDashboard />
          </ModeratorRoute>
        }
      />
      <Route
        path="/moderation/settings"
        element={
          <ModeratorRoute>
            <ModerationSettings />
          </ModeratorRoute>
        }
      />
      <Route
        path="/moderation/users"
        element={
          <ModeratorRoute>
            <UserManagement />
          </ModeratorRoute>
        }
      />
      <Route
        path="/moderation/appeals"
        element={
          <ModeratorRoute>
            <ModerationAppeals />
          </ModeratorRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <PrivateRoute>
            <Onboarding />
          </PrivateRoute>
        }
      />
      <Route
        path="/onboarding/quiz"
        element={
          <PrivateRoute>
            <OnboardingQuiz />
          </PrivateRoute>
        }
      />
      <Route
        path="/suggested-list"
        element={
          <PrivateRoute>
            <SuggestedList />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <OnboardingRoute>
            <Profile />
          </OnboardingRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <OnboardingRoute>
            <Dashboard />
          </OnboardingRoute>
        }
      />
      <Route
        path="/coaching"
        element={
          <OnboardingRoute>
            <Coaching />
          </OnboardingRoute>
        }
      />
    </Routes>
  );
}

function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const setupApp = async () => {
      try {
        // Initialize Capacitor plugins and native functionality
        await initializeApp();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsAppReady(true);
      }
    };

    setupApp();
  }, []);

  if (!isAppReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <DemoProvider>
        <Router>
          <ScrollToTop />
          <AuthProvider>
            <UserRoleProvider>
              <QuizProvider>
                <PaymentProvider>
                  <Layout>
                    <OfflineNotice />
                    <AppRoutes />
                    <DemoModeIndicator />
                  </Layout>
                </PaymentProvider>
              </QuizProvider>
            </UserRoleProvider>
          </AuthProvider>
        </Router>
      </DemoProvider>
    </ErrorBoundary>
  );
}

export default App;