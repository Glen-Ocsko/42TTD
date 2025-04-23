import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useUserRole } from '../contexts/UserRoleContext';
import CreateYourOwnActivityCard from '../components/CreateYourOwnActivityCard';
import { 
  ChevronRight,
  ArrowRight,
  Target,
  Clock,
  CheckCircle2,
  Users,
  Crown,
  Heart,
  Globe,
  Mail,
  Shield,
  Building2,
  BadgeCheck,
  Plus,
  Sparkles,
  Calendar,
  Zap,
  Lock,
  Star
} from 'lucide-react';
import CommunityCarousel from '../components/CommunityCarousel';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import ProgressTracker from '../components/ProgressTracker';

export default function Home() {
  const { isAuthenticated } = useCurrentUser();
  const { isPremium, isPro } = useUserRole();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Tracker */}
            <ProgressTracker />

            {/* Create Your Own Activity Card */}
            <CreateYourOwnActivityCard />

            {/* Dashboard Tiles */}
            <div className="grid gap-6 md:grid-cols-3">
              <div 
                onClick={() => navigate('/activities')}
                className="bg-gradient-to-br from-[#FDBA4F] to-[#f59e0b] text-white rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <Target className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">Browse Activities</h3>
                <p className="text-white/90 mb-4">
                  Discover new activities to add to your list
                </p>
                <button className="flex items-center gap-2 text-sm bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">
                  Browse Now
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div 
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <CheckCircle2 className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">Track Progress</h3>
                <p className="text-white/90 mb-4">
                  Update and manage your activities
                </p>
                <button className="flex items-center gap-2 text-sm bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">
                  View Dashboard
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div 
                onClick={() => navigate('/coaching')}
                className={`bg-gradient-to-br ${isPremium || isPro ? 'from-[#8B5CF6] to-[#6D28D9]' : 'from-gray-400 to-gray-500'} text-white rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow relative`}
              >
                <Clock className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">Get Coaching</h3>
                <p className="text-white/90 mb-4">
                  Set reminders and track habits
                </p>
                {isPremium || isPro ? (
                  <button className="flex items-center gap-2 text-sm bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">
                    Start Now
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
                    <div className="bg-white/90 px-4 py-2 rounded-lg flex items-center gap-2">
                      <Lock className="h-4 w-4 text-gray-700" />
                      <span className="text-gray-800 font-medium">Premium Feature</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* What's Your Next Adventure Tile */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-8 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/start')}
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">What's your next adventure?</h2>
                  <p className="text-white/90 text-lg mb-6">
                    Browse the full list or click here for personalised ideas.
                  </p>
                  <button className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-lg hover:bg-white/30 text-white font-medium">
                    <Sparkles className="h-5 w-5" />
                    Need some inspiration?
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </button>
                </div>
                <div className="bg-white/10 p-6 rounded-full">
                  <Zap className="h-16 w-16 md:h-24 md:w-24" />
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-bold">Your Activity Stats</h3>
              </div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <span className="text-2xl font-bold text-blue-600">12</span>
                  <p className="text-sm text-gray-600">Activities Created</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-green-600">8</span>
                  <p className="text-sm text-gray-600">Published</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-purple-600">3</span>
                  <p className="text-sm text-gray-600">Completed This Month</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold">Upcoming Bookings</h3>
                </div>
                <Link to="/profile?tab=bookings" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-3 py-1">
                  <div className="flex justify-between">
                    <p className="font-medium">Surfing Lesson</p>
                    <span className="text-sm text-gray-500">Tomorrow</span>
                  </div>
                  <p className="text-sm text-gray-600">10:00 AM • Bondi Beach</p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-3 py-1">
                  <div className="flex justify-between">
                    <p className="font-medium">Rock Climbing</p>
                    <span className="text-sm text-gray-500">Next Week</span>
                  </div>
                  <p className="text-sm text-gray-600">2:30 PM • Indoor Climbing Center</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-3 py-1">
                  <div className="flex justify-between">
                    <p className="font-medium text-gray-500">No more bookings</p>
                  </div>
                  <p className="text-sm text-gray-500">Schedule something new!</p>
                </div>
              </div>
            </div>
            
            {/* Mini Coaching Module */}
            {(isPremium || isPro) ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold">Coaching</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Daily Habit</h4>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-purple-700">Morning Run</p>
                      <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">15/30 days</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                  
                  <Link to="/coaching" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
                    View all coaching
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold">Coaching</h3>
                </div>
                
                <div className="space-y-4 blur-sm">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Daily Habit</h4>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-purple-700">Morning Run</p>
                      <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">15/30 days</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="text-center">
                    <Crown className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-medium mb-2">Premium Feature</p>
                    <Link to="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700">
                      <Crown className="h-4 w-4" />
                      <span>Upgrade Now</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Supplier Advert */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=64&h=64" 
                  alt="Fitness First" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Sponsored</p>
                  <h3 className="font-bold">Fitness First</h3>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">Get 20% off your first month with code <span className="font-bold">42THINGS</span>. Perfect for your fitness goals!</p>
              
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Learn More
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="min-h-[80vh] bg-[url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center bg-no-repeat relative">
        <div className="absolute inset-0 bg-black/50 z-10"></div>

        <div className="relative z-20 min-h-[80vh] flex items-center justify-center">
          <div className="text-center px-4 py-24 sm:py-32">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
              Discover Your Next Adventure
            </h1>
            <p className="text-lg sm:text-xl text-gray-200 max-w-xl mx-auto mb-8">
              Build your personal bucket list and make it happen. Join thousands of others on their journey of discovery.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/start')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#FDBA4F] hover:bg-[#f59e0b] text-white rounded-xl shadow transition-all duration-200 hover:scale-105"
              >
                Start Your List
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/community')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 rounded-xl shadow transition-all duration-200 hover:scale-105"
              >
                <Users className="h-5 w-5" />
                Explore the Community
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Community Posts Carousel */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">From the Community</h2>
          <CommunityCarousel />
        </div>
      </div>

      {/* Explainer Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            It's not just a bucket list. It's your life, lived fully.
          </h2>
          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            We help you turn your dreams into reality with a supportive community, smart tools, and proven strategies for success.
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Set Your Goals</h3>
              <p className="text-gray-600">
                Choose from curated activities or create your own. Build a personalized list that excites you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Join the Community</h3>
              <p className="text-gray-600">
                Connect with like-minded people, share experiences, and inspire each other.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Make It Happen</h3>
              <p className="text-gray-600">
                Track your progress, get reminders, and celebrate your achievements.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/start')}
            className="mt-12 inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Start Your 42 Today
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Our Users Are Saying
          </h2>
          <TestimonialsCarousel />
        </div>
      </div>

      {/* Footer */}
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
                  <Globe className="h-5 w-5" />
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
    </div>
  );
}