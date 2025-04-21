import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Star, Crown, Medal, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import DemoButton from '../components/DemoButton';

interface Plan {
  id: 'free' | 'premium' | 'pro';
  name: string;
  icon: React.ReactNode;
  price: number;
  description: string;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    icon: <Star className="h-6 w-6 text-gray-400" />,
    price: 0,
    description: 'Get started with basic features',
    features: [
      'Create your bucket list',
      'Track basic progress',
      'Join the community',
      '10% off activities'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: <Crown className="h-6 w-6 text-amber-400" />,
    price: 5.99,
    description: 'Enhanced features and support',
    features: [
      'All Free features',
      'Smart coaching',
      'Habit tracking',
      '30% off activities'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: <Medal className="h-6 w-6 text-purple-500" />,
    price: 12.99,
    description: 'Ultimate experience',
    features: [
      'All Premium features',
      'AI-powered suggestions',
      'VIP support',
      'Exclusive rewards'
    ]
  }
];

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'pro'>('free');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign up the user with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('Failed to create user account');
      }

      // Set initial user role if not free plan
      if (selectedPlan !== 'free') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: signUpData.user.id,
            role: selectedPlan,
            upgraded_at: new Date().toISOString()
          });

        if (roleError) {
          console.error('Role assignment error:', roleError);
          // Don't throw here, as the user is already created
          // Just log the error and continue
        }
      }

      navigate('/onboarding');
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error signing up with Google:', err);
      setError('Failed to sign up with Google. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Create Your Account</h1>

      {error && (
        <div className="max-w-md mx-auto mb-6 flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Sign Up Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 mb-6"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        {/* Plan Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Choose Your Plan</h2>
          <div className="space-y-4">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {plan.icon}
                    <h3 className="font-semibold">{plan.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {plan.price === 0 ? 'Free' : `£${plan.price}/mo`}
                    </span>
                    {selectedPlan === plan.id && (
                      <Check className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm text-gray-600 flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}