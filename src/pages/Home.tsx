import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
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
  BadgeCheck
} from 'lucide-react';
import CommunityCarousel from '../components/CommunityCarousel';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import ProgressTracker from '../components/ProgressTracker';

export default function Home() {
  const { isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressTracker />

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
            className="bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-white rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <Clock className="h-8 w-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">Get Coaching</h3>
            <p className="text-white/90 mb-4">
              Set reminders and track habits
            </p>
            <button className="flex items-center gap-2 text-sm bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">
              Start Now
              <ChevronRight className="h-4 w-4" />
            </button>
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