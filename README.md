# 42 Things To Do - Mobile App

This repository contains the 42 Things To Do application, built with React and Capacitor for cross-platform deployment.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- For iOS development: macOS with Xcode 13+
- For Android development: Android Studio with SDK 30+

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Building for Mobile

### Initial Setup

Initialize Capacitor:
```bash
npm run cap:init
```

Add platforms:
```bash
npm run cap:add:ios     # For iOS
npm run cap:add:android # For Android
```

### Building and Running

Build the web app and sync with Capacitor:
```bash
npm run build:mobile
```

Open in native IDEs:
```bash
npm run cap:open:ios     # Opens in Xcode
npm run cap:open:android # Opens in Android Studio
```

## Post-Export Steps

After exporting from StackBlitz, you'll need to:

1. **Enable Service Workers**:
   - Uncomment the service worker registration in `src/main.tsx`
   - Implement the full push notification functionality in `src/lib/capacitor.ts`

2. **Set Up Push Notifications**:
   - For iOS: Configure APNs in your Apple Developer account
   - For Android: Set up Firebase Cloud Messaging

3. **Configure Deep Linking**:
   - iOS: Update `Info.plist` with URL schemes
   - Android: Update `AndroidManifest.xml` with intent filters

4. **Prepare App Store Assets**:
   - Generate app icons and splash screens
   - Prepare screenshots for store listings

## App Store Deployment

See `DEPLOYMENT.md` for detailed instructions on deploying to:
- Apple App Store
- Google Play Store

## Features

- PWA support for web deployment
- Native app wrapping with Capacitor
- Push notifications (after export)
- Offline support
- Deep linking

## Project Structure

- `/src` - React application source code
- `/public` - Public assets
- `/ios` - iOS platform code (after running `cap add ios`)
- `/android` - Android platform code (after running `cap add android`)
- `/public/app-store-assets` - Assets for app store listings

## License

[License information]