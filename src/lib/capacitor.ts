import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';

// Check if running in a native app context
export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isAndroid = Capacitor.getPlatform() === 'android';

// Initialize native components
export const initializeApp = async () => {
  if (!isNative) return;

  // Hide the splash screen
  await SplashScreen.hide();

  // Set status bar style
  if (Capacitor.isPluginAvailable('StatusBar')) {
    StatusBar.setStyle({ style: Style.Light });
    if (isAndroid) {
      StatusBar.setBackgroundColor({ color: '#FFFFFF' });
    }
  }

  // Set up app URL open listener for deep links
  App.addListener('appUrlOpen', (data) => {
    console.log('App opened with URL:', data.url);
    
    // Example: handle deep links
    const slug = data.url.split('activities/').pop();
    if (slug) {
      // Navigate to the activity detail page
      window.location.href = `/activities/${slug}`;
    }
  });

  // Set up back button handling for Android
  if (isAndroid) {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  }
};

// Push notification functions
export const initPushNotifications = async () => {
  // This function will be implemented after export from StackBlitz
  // as it requires Service Worker registration
  console.log('Push notifications will be implemented after export');
  return false;
};

// Share functionality
export const shareActivity = async (activityId: string, title: string) => {
  if (!isNative) {
    // Web fallback
    if (navigator.share) {
      try {
        await navigator.share({
          title: `42 Things To Do - ${title}`,
          text: `Check out this activity: ${title}`,
          url: `https://app.42thingstodo.com/activities/${activityId}`
        });
        return true;
      } catch (error) {
        console.error('Error sharing:', error);
        return false;
      }
    }
    return false;
  }

  try {
    await Share.share({
      title: `42 Things To Do - ${title}`,
      text: `Check out this activity: ${title}`,
      url: `https://app.42thingstodo.com/activities/${activityId}`,
      dialogTitle: 'Share this activity'
    });
    return true;
  } catch (error) {
    console.error('Error sharing:', error);
    return false;
  }
};

// Storage functions for offline data
export const storeOfflineData = async (key: string, data: any) => {
  try {
    await Preferences.set({
      key,
      value: JSON.stringify(data)
    });
    return true;
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
    return false;
  }
};

export const getOfflineData = async (key: string) => {
  try {
    const result = await Preferences.get({ key });
    return result.value ? JSON.parse(result.value) : null;
  } catch (error) {
    console.error(`Error retrieving ${key}:`, error);
    return null;
  }
};

export const removeOfflineData = async (key: string) => {
  try {
    await Preferences.remove({ key });
    return true;
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
    return false;
  }
};