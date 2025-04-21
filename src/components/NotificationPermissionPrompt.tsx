import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { isNative } from '../lib/capacitor';

export default function NotificationPermissionPrompt() {
  const [dismissed, setDismissed] = useState(false);
  const { isEnabled, togglePushNotifications } = usePushNotifications();
  
  // Don't show if not in a native app, already enabled, or dismissed
  if (!isNative || isEnabled || dismissed) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg z-40 border-t border-gray-200">
      <div className="max-w-md mx-auto flex items-start gap-3">
        <div className="bg-blue-100 p-2 rounded-full">
          <Bell className="h-6 w-6 text-blue-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">Stay Updated</h3>
          <p className="text-sm text-gray-600 mt-1 mb-3">
            Enable notifications to get updates on messages, bookings, and activity reminders.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => togglePushNotifications(true)}
              className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              Enable
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              Not Now
            </button>
          </div>
        </div>
        
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}