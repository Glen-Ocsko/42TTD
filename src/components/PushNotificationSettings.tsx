import React from 'react';
import { Bell, Loader2, AlertTriangle } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { isNative } from '../lib/capacitor';

export default function PushNotificationSettings() {
  const { isEnabled, isLoading, error, togglePushNotifications } = usePushNotifications();

  if (!isNative) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">
          Push notifications are available in the mobile app.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
        <span>Loading notification settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="font-medium">Push Notifications</span>
        </div>
        <button
          onClick={() => togglePushNotifications(!isEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {isEnabled
          ? 'You will receive notifications about messages, bookings, and activity reminders.'
          : 'Enable notifications to stay updated on messages, bookings, and activity reminders.'}
      </p>
    </div>
  );
}