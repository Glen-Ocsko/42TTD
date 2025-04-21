# App Store Deployment Guide

This document provides step-by-step instructions for deploying the 42 Things To Do app to the Apple App Store and Google Play Store.

## Prerequisites

- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time fee)
- Xcode 13+ (for iOS)
- Android Studio (for Android)
- Node.js 18+ and npm

## Post-Export Steps

Before deploying, complete these steps after exporting from StackBlitz:

### 1. Enable Service Workers

Uncomment the service worker registration in `src/main.tsx`:

```javascript
// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
```

### 2. Implement Push Notifications

Complete the implementation in `src/lib/capacitor.ts`:

```javascript
export const initPushNotifications = async () => {
  if (!isNative) return false;
  
  // Check if we have permission
  const permissionStatus = await PushNotifications.checkPermissions();
  
  if (permissionStatus.receive === 'prompt') {
    // Request permission
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      return false;
    }
  } else if (permissionStatus.receive !== 'granted') {
    return false;
  }

  // Register with FCM/APNS
  await PushNotifications.register();

  // Setup push notification handlers
  PushNotifications.addListener('registration', (token) => {
    // Send token to your server
    console.log('Push registration success:', token.value);
    savePushToken(token.value);
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration failed:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received:', notification);
    // Handle foreground notification
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push notification action performed:', notification);
    // Handle notification click
    const data = notification.notification.data;
    if (data.type === 'message') {
      window.location.href = '/messages';
    } else if (data.type === 'booking') {
      window.location.href = '/profile?tab=bookings';
    }
  });

  return true;
};
```

### 3. Set Up Offline Support

Implement the full offline caching strategy using Workbox or similar.

## Building the App

### 1. Prepare the Environment

Ensure you have the latest dependencies:
```bash
npm install
```

### 2. Update Version Numbers

Update the version number in:
- `package.json`
- `ios/App/App.xcodeproj/project.pbxproj` (for iOS)
- `android/app/build.gradle` (for Android)

### 3. Build the Web App

```bash
npm run build
```

### 4. Sync with Capacitor

```bash
npm run cap:sync
```

## iOS Deployment

### 1. Open the iOS Project

```bash
npm run cap:open:ios
```

### 2. Configure Signing & Capabilities in Xcode

1. Select the project in the Project Navigator
2. Select the "App" target
3. Go to the "Signing & Capabilities" tab
4. Select your Team
5. Ensure "Automatically manage signing" is checked
6. Add capabilities:
   - Push Notifications
   - Background Modes (if needed)

### 3. Create App Store Connect Record

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Go to "My Apps" and click the "+" button
3. Select "New App"
4. Fill in the required information:
   - Platform: iOS
   - Name: 42 Things To Do
   - Primary language: English
   - Bundle ID: com.fortytwo.thingstodo
   - SKU: 42TTD001
   - User Access: Full Access

### 4. Configure App Information

1. Fill in the app information:
   - Privacy Policy URL
   - App Store Icon (1024x1024px)
   - App Preview and Screenshots
   - Description, Keywords, etc.

### 5. Build and Archive

1. In Xcode, select "Generic iOS Device" as the build target
2. Select Product > Archive
3. When archiving completes, click "Distribute App"
4. Select "App Store Connect" and follow the prompts
5. Submit the build to App Store Connect

### 6. Submit for Review

1. In App Store Connect, select your app
2. Go to the "App Store" tab
3. Select the build you just uploaded
4. Complete all required information
5. Click "Submit for Review"

## Android Deployment

### 1. Open the Android Project

```bash
npm run cap:open:android
```

### 2. Configure Signing

1. In Android Studio, go to Build > Generate Signed Bundle/APK
2. Select "Android App Bundle" and click Next
3. Create a new keystore or use an existing one
4. Fill in the key store path, password, key alias, and key password
5. Click Next and then Finish

### 3. Create Google Play Console Listing

1. Log in to [Google Play Console](https://play.google.com/console/)
2. Click "Create app"
3. Fill in the app details:
   - App name: 42 Things To Do
   - Default language: English
   - App or Game: App
   - Free or Paid: Free
   - Declarations

### 4. Set Up Store Listing

1. Go to "Store presence" > "Store listing"
2. Fill in:
   - Short description
   - Full description
   - Screenshots
   - Feature graphic
   - App icon
   - Content rating

### 5. Upload the App Bundle

1. Go to "Production" > "Create new release"
2. Upload the AAB file generated from Android Studio
3. Add release notes
4. Save and review the release

### 6. Submit for Review

1. Complete all required sections:
   - App content
   - Store listing
   - Content rating
   - Pricing & distribution
2. Click "Start rollout to Production"

## TestFlight (iOS Testing)

### 1. Set Up TestFlight

1. In App Store Connect, go to your app
2. Select the "TestFlight" tab
3. Add internal testers (Apple ID email addresses)

### 2. Upload a Build

1. Archive your app in Xcode
2. Submit to TestFlight instead of App Store
3. Wait for processing (usually a few minutes)

### 3. Invite Testers

1. Once the build is processed, enable it for testing
2. Add test information (what to test, etc.)
3. Send invitations to testers

## Google Play Internal Testing

### 1. Set Up Internal Testing Track

1. In Google Play Console, go to your app
2. Go to "Testing" > "Internal testing"
3. Create a new release

### 2. Upload a Build

1. Upload your AAB file
2. Add release notes
3. Save the release

### 3. Manage Testers

1. Add testers via email addresses
2. Create and share the opt-in URL with testers

## Troubleshooting

### Common iOS Issues

- **Provisioning Profile Issues**: Ensure your Apple Developer account has the correct certificates and profiles.
- **App Icon Issues**: Make sure all required icon sizes are included.
- **Rejection Due to Metadata**: Double-check all app information for accuracy.

### Common Android Issues

- **Signing Issues**: Ensure you're using the same keystore for updates.
- **Target API Level**: Make sure you're targeting the required API level.
- **Large APK Size**: Consider using Android App Bundle instead of APK.

## Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Capacitor Documentation](https://capacitorjs.com/docs)