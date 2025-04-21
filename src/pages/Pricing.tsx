import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { Dialog } from '@headlessui/react';
import {
  Check,
  Crown,
  Star,
  Medal,
  Sparkles,
  X,
  CreditCard,
  CalendarClock,
  BadgeCheck,
} from 'lucide-react';

interface PricingPlan {
  name: string;
  badge: React.ReactNode;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlight?: boolean;
  buttonText: string;
  buttonAction: () => void;
}

interface Testimonial {
  name: string;
  role: string;
  image: string;
  quote: string;
  achievement: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Premium Member",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    quote: "The premium features helped me achieve my goals faster than I ever thought possible.",
    achievement: "Completed 15 bucket list items in 6 months"
  },
  {
    name: "Marcus Rodriguez",
    role: "Pro Member",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    quote: "The AI suggestions opened my eyes to adventures I'd never considered before.",
    achievement: "Sponsored 5 community goals"
  },
  {
    name: "Emily Taylor",
    role: "Premium Member",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
    quote: "Streak tracking keeps me motivated, and the community support is incredible.",
    achievement: "Maintained a 90-day activity streak"
  }
];

export default function Pricing() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'pro' | null>(null);

  const handleUpgrade = (plan: 'premium' | 'pro') => {
    if (!user) {
      navigate('/register');
      return;
    }
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const calculateYearlyPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    // Calculate yearly price with 10% discount
    return Math.round(monthlyPrice * 12 * 0.9);
  };

  const calculateYearlySavings = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    const yearlyTotal = monthlyPrice * 12;
    const discountedYearlyPrice = calculateYearlyPrice(monthlyPrice);
    return Math.round(yearlyTotal - discountedYearlyPrice);
  };

  const plans: PricingPlan[] = [
    {
      name: "Free",
      badge: <Star className="h-8 w-8 text-gray-400" />,
      description: "Perfect for getting started",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "Access to 42 Things list",
        "10% off selected activities",
        "Public community access",
        "Basic activity tracking",
        "Standard support"
      ],
      buttonText: user ? "Current Plan" : "Get Started Free",
      buttonAction: () => navigate('/register')
    },
    {
      name: "Premium",
      badge: <Crown className="h-8 w-8 text-amber-400" />,
      description: "Most popular choice",
      monthlyPrice: 5.99,
      yearlyPrice: calculateYearlyPrice(5.99),
      highlight: true,
      features: [
        "30% off selected activities",
        "Smart coaching nudges",
        "Streak & habit tracking",
        "Premium-only experiences",
        "Digital medals system",
        "Priority email support",
        "Advanced analytics"
      ],
      buttonText: role === 'premium' ? "Current Plan" : "Go Premium",
      buttonAction: () => handleUpgrade('premium')
    },
    {
      name: "Pro",
      badge: <Medal className="h-8 w-8 text-purple-500" />,
      description: "For serious achievers",
      monthlyPrice: 12.99,
      yearlyPrice: calculateYearlyPrice(12.99),
      features: [
        "All Premium features",
        "Sponsor a Stranger's Goal",
        "AI-powered suggestions",
        "VIP badges",
        "Exclusive merch rewards",
        "1-on-1 goal planning",
        "24/7 priority support"
      ],
      buttonText: role === 'pro' ? "Current Plan" : "Upgrade to Pro",
      buttonAction: () => handleUpgrade('pro')
    }
  ];

  return (
    <div className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Adventure Level
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Unlock premium features to achieve your goals faster and join a community of achievers
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isYearly ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Monthly billing
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm flex items-center gap-1 ${isYearly ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Yearly billing
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Save 10%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.highlight
                  ? 'bg-white shadow-xl ring-2 ring-blue-500'
                  : 'bg-white shadow-md'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-gray-500">{plan.description}</p>
                </div>
                {plan.badge}
              </div>

              <div className="mb-6">
                <p className="text-4xl font-bold">
                  £{isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  {plan.monthlyPrice > 0 && (
                    <span className="text-lg text-gray-500">
                      /{isYearly ? 'year' : 'mo'}
                    </span>
                  )}
                </p>
                {isYearly && plan.monthlyPrice > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    Save £{calculateYearlySavings(plan.monthlyPrice)} per year
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={plan.buttonAction}
                disabled={
                  (role === 'premium' && plan.name === 'Premium') ||
                  (role === 'pro' && plan.name === 'Pro')
                }
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  plan.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : plan.name === 'Pro'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Success Stories from Our Community
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium">{testimonial.name}</h3>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                  <BadgeCheck className="h-5 w-5" />
                  {testimonial.achievement}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Can I switch plans later?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade, downgrade, or cancel your plan at any time. Changes take effect at the end of your billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and Apple Pay. All payments are processed securely.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Is there a refund policy?</h3>
              <p className="text-gray-600">
                Yes, we offer a 14-day money-back guarantee if you're not satisfied with your premium features.
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Modal */}
        <Dialog
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          className="fixed inset-0 z-10 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

            <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-medium">
                  Upgrade to {selectedPlan?.charAt(0).toUpperCase() + selectedPlan?.slice(1)}
                </Dialog.Title>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg">
                  <Sparkles className="h-5 w-5" />
                  <p className="text-sm">
                    You're about to unlock amazing new features!
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {isYearly ? 'Yearly' : 'Monthly'} subscription
                    </p>
                    <p className="text-sm text-gray-500">
                      £{isYearly
                        ? selectedPlan === 'premium' ? calculateYearlyPrice(5.99) : calculateYearlyPrice(12.99)
                        : selectedPlan === 'premium' ? '5.99' : '12.99'
                      }/{isYearly ? 'year' : 'month'}
                    </p>
                    {isYearly && (
                      <p className="text-sm text-green-600">
                        Save £{calculateYearlySavings(selectedPlan === 'premium' ? 5.99 : 12.99)} per year
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CalendarClock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Next billing date</p>
                    <p className="text-sm text-gray-500">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // This would be replaced with actual payment processing
                    setShowUpgradeModal(false);
                  }}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirm Upgrade
                </button>

                <p className="text-center text-sm text-gray-500">
                  You can cancel anytime. No questions asked.
                </p>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}