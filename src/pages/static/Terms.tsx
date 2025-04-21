import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 mb-8">
          Welcome to 42 Things To Do! We're here to help you live life to the fullest — but we've got a few simple ground rules.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Your Responsibilities</h2>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>Keep your account details secure.</li>
          <li>Be respectful in the community — no spam, bullying, or offensive content.</li>
          <li>Only share content (like photos or comments) you have the right to share.</li>
          <li>Use the platform for inspiration, connection and good vibes — not exploitation.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-12 mb-6">Our Role</h2>
        <p className="text-gray-600 mb-8">
          We provide a platform to help you find and track bucket list goals, connect with others, and (eventually) book experiences. We're not responsible for the services offered by third-party providers — but we aim to only work with those who share our values.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Membership</h2>
        <p className="text-gray-600 mb-8">
          Free accounts can access most features. Premium members unlock extra benefits. Memberships are billed monthly or annually and can be cancelled anytime.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Content</h2>
        <p className="text-gray-600 mb-8">
          We may feature user-submitted content to inspire others. If something you posted gets featured and you want it removed, just let us know.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Liability</h2>
        <p className="text-gray-600 mb-8">
          You take part in any activities at your own risk. We don't accept responsibility for anything that happens while you're ticking off your list — but we'll always do our best to promote safe, reliable providers.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Changes</h2>
        <p className="text-gray-600 mb-8">
          We may update these terms over time. We'll notify you of any major changes, and you can always find the latest version here.
        </p>

        <div className="bg-gray-50 p-8 rounded-xl mt-12">
          <p className="text-sm text-gray-500">
            Last updated: April 2025
          </p>
        </div>
      </div>
    </div>
  );
}