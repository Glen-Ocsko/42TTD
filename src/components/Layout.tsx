import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { useDemo } from '../contexts/DemoContext';
import { supabase } from '../lib/supabase';
import DemoRoleSwitcher from './DemoRoleSwitcher';
import ErrorBoundary from './ErrorBoundary';
import RouteErrorBoundary from './RouteErrorBoundary';
import ScrollToTop from './ScrollToTop';
import NavigationHistoryButtons from './NavigationHistoryButtons';
import { initializeApp } from '../lib/capacitor';
import { useDeepLink } from '../hooks/useDeepLink';
import OfflineNotice from './OfflineNotice';
import { 
  LogOut, 
  User, 
  List, 
  Crown,
  Users,
  Bell,
  Mail,
  Shield,
  Building2,
  BadgeCheck,
  MessageSquare,
  Clock,
  Home
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { isPremium } = useUserRole();
  const { isDemoMode, demoUser, disableDemoMode } = useDemo();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isModerator, setIsModerator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadModerationCount, setUnreadModerationCount] = useState(0);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    if (user || (isDemoMode && demoUser)) {
      loadUnreadMessageCount();
      checkPendingRequests();
      checkModeratorStatus();
      checkUnreadModerationMessages();
      checkSuspensionStatus();
      
      // Set up subscription for new messages
      const subscription = supabase
        .channel('messages_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${isDemoMode ? '00000000-0000-0000-0000-000000000000' : user?.id}`
          },
          () => {
            loadUnreadMessageCount();
          }
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, isDemoMode, demoUser]);

  const loadUnreadMessageCount = async () => {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', isDemoMode ? '00000000-0000-0000-0000-000000000000' : user?.id)
        .eq('read', false);
      
      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error loading unread message count:', err);
    }
  };

  const checkPendingRequests = async () => {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', isDemoMode ? '00000000-0000-0000-0000-000000000000' : user?.id)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingRequestsCount(count || 0);
    } catch (err) {
      console.error('Error checking pending requests:', err);
    }
  };

  const checkModeratorStatus = async () => {
    if (isDemoMode && demoUser) {
      setIsModerator(demoUser.is_moderator);
      setIsAdmin(demoUser.is_admin);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_moderator, is_admin')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setIsModerator(data?.is_moderator || false);
      setIsAdmin(data?.is_admin || false);
    } catch (err) {
      console.error('Error checking moderator status:', err);
    }
  };

  const checkUnreadModerationMessages = async () => {
    try {
      const { count, error } = await supabase
        .from('moderation_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', isDemoMode ? '00000000-0000-0000-0000-000000000000' : user?.id)
        .eq('read', false);

      if (error) throw error;
      setUnreadModerationCount(count || 0);
    } catch (err) {
      console.error('Error checking unread moderation messages:', err);
    }
  };

  const checkSuspensionStatus = async () => {
    if (isDemoMode) return;
    
    try {
      const { data, error } = await supabase
        .rpc('is_user_suspended', { user_id: user?.id });
      
      if (error) throw error;
      setIsSuspended(data || false);
    } catch (err) {
      console.error('Error checking suspension status:', err);
    }
  };

  const handleSignOut = async () => {
    if (isDemoMode) {
      disableDemoMode();
    } else {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
    navigate('/login');
  };

  const isAuthenticated = user || (isDemoMode && demoUser);
  const hideFooter = location.pathname.startsWith('/community');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <img 
                  src="https://i.imgur.com/wZcjbN6.png" 
                  alt="42 Things To Do logo"
                  className="h-8 md:h-10"
                />
              </Link>

              {isAuthenticated && (
                <nav className="hidden md:flex ml-8 space-x-6">
                  <Link 
                    to="/" 
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                  >
                    <Home className="h-5 w-5" />
                    <span>Home</span>
                  </Link>
                  <Link 
                    to="/activities" 
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                  >
                    <List className="h-5 w-5" />
                    <span>Activities</span>
                  </Link>
                  <Link 
                    to="/community" 
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 relative"
                  >
                    <Users className="h-5 w-5" />
                    <span>Community</span>
                    {pendingRequestsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                      </span>
                    )}
                  </Link>
                  <Link 
                    to="/coaching" 
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                  >
                    <Bell className="h-5 w-5" />
                    <span>Coaching</span>
                  </Link>
                  <Link 
                    to="/supplier" 
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                  >
                    <Building2 className="h-5 w-5" />
                    <span>Suppliers</span>
                  </Link>
                  <Link 
                    to="/messages" 
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 relative"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  {(isAdmin || isModerator) && (
                    <Link 
                      to="/moderation/dashboard" 
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 relative"
                    >
                      <Shield className="h-5 w-5" />
                      <span>Moderation</span>
                      {unreadModerationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadModerationCount > 9 ? '9+' : unreadModerationCount}
                        </span>
                      )}
                    </Link>
                  )}
                </nav>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isDemoMode && <DemoRoleSwitcher />}

              {isAuthenticated ? (
                <>
                  {isSuspended && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Clock className="h-5 w-5" />
                      <span className="hidden md:inline">Suspended</span>
                    </div>
                  )}
                  
                  {!isPremium && !isDemoMode && (
                    <Link
                      to="/pricing"
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full hover:from-amber-600 hover:to-amber-700"
                    >
                      <Crown className="h-4 w-4" />
                      <span className="font-medium">Upgrade</span>
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 relative"
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                    {isPremium && (
                      <Crown className="h-4 w-4 text-amber-500" />
                    )}
                    {unreadModerationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadModerationCount > 9 ? '9+' : unreadModerationCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="hidden md:inline">Sign Out</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Register / Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      {!hideFooter && (
        <footer className="bg-gray-900 text-gray-300">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
              <div className="col-span-2">
                <h3 className="text-white font-bold text-lg mb-4">42 Things</h3>
                <p className="text-gray-400 mb-4">
                  Your journey to a more fulfilled life starts here.
                </p>
                <div className="flex gap-4">
                  <Link to="/" className="text-gray-400 hover:text-white">
                    <img 
                      src="https://i.imgur.com/wZcjbN6.png" 
                      alt="42 Things To Do logo"
                      className="h-6"
                    />
                  </Link>
                  <Link to="/contact" className="text-gray-400 hover:text-white">
                    <Mail className="h-5 w-5" />
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/about" className="hover:text-white">About Us</Link>
                  </li>
                  <li>
                    <Link to="/careers" className="hover:text-white">Careers</Link>
                  </li>
                  <li>
                    <Link to="/press" className="hover:text-white">Press</Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/blog" className="hover:text-white">Blog</Link>
                  </li>
                  <li>
                    <Link to="/help" className="hover:text-white">Help Center</Link>
                  </li>
                  <li>
                    <Link to="/contact" className="hover:text-white">Contact</Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/privacy" className="hover:text-white">Privacy</Link>
                  </li>
                  <li>
                    <Link to="/terms" className="hover:text-white">Terms</Link>
                  </li>
                  <li>
                    <Link to="/cookies" className="hover:text-white">Cookie Policy</Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Features</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/pricing" className="hover:text-white">Premium</Link>
                  </li>
                  <li>
                    <Link to="/teams" className="hover:text-white">For Teams</Link>
                  </li>
                  <li>
                    <Link to="/gift-cards" className="hover:text-white">Gift Cards</Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 42 Things. All rights reserved.
              </p>
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <Shield className="h-5 w-5 text-gray-400" />
                <Building2 className="h-5 w-5 text-gray-400" />
                <BadgeCheck className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}