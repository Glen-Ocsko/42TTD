import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 mb-8">
          We respect your privacy and are committed to protecting your personal information.
        </p>

        <p className="text-xl text-gray-600 mb-8">
          This policy explains what data we collect, why we collect it, and how we use it.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">What We Collect</h2>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>Your name and contact details (if you create an account)</li>
          <li>Activity selections, preferences, and quiz results</li>
          <li>Usage data to help improve the app</li>
          <li>Optional location or demographic data, if you choose to share it</li>
        </ul>

        <p className="text-gray-600 mb-8">
          We only collect what's necessary to help personalise your experience, improve our services, and connect you with things we think you'll love.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">What We Don't Do</h2>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>We don't sell your data.</li>
          <li>We don't spam.</li>
          <li>We don't snoop.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-12 mb-6">Third Parties</h2>
        <p className="text-gray-600 mb-8">
          We work with trusted services (like Supabase, Stripe, and image libraries) to run the platform. If you book activities or buy merchandise, those payments will be handled by secure third-party processors.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Your Choices</h2>
        <p className="text-gray-600 mb-8">
          You can view, update, or delete your data any time by going to your profile. If you want your account removed completely, just let us know.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Updates</h2>
        <p className="text-gray-600 mb-8">
          We'll update this policy as things evolve. If there's ever anything major, we'll let you know first.
        </p>

        <div className="bg-gray-50 p-8 rounded-xl mt-12">
          <p className="text-gray-600 mb-4">
            Still got questions? Drop us a message via the{' '}
            <Link to="/contact" className="text-blue-600 hover:text-blue-700">
              Contact page
            </Link>
            .
          </p>
          <p className="text-sm text-gray-500">
            Last updated: April 2025
          </p>
        </div>
      </div>
    </div>
  );
}