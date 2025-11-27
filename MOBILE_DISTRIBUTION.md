# Mobile Apps Distribution

## Overview
Both Customer and Staff apps are available for direct download from the website. No app store accounts needed.

## Build Configuration

### Android (APK)
```bash
# Customer App
cd mobile/customer-app
eas build --platform android --profile preview

# Staff App
cd mobile/staff-app
eas build --platform android --profile preview
```

### iOS (IPA - requires Apple Developer account for signing)
```bash
# Customer App
cd mobile/customer-app
eas build --platform ios --profile preview

# Staff App
cd mobile/staff-app
eas build --platform ios --profile preview
```

## Distribution Setup

### 1. Build with EAS (Expo Application Services)

Install EAS CLI:
```bash
npm install -g eas-cli
```

Login to Expo:
```bash
eas login
```

Configure build profiles in `eas.json`:
- **preview**: For testing and web distribution (unsigned)
- **production**: For signed builds

### 2. Generate APK Downloads

For Android, create unsigned APKs that users can install directly:
```bash
cd mobile/customer-app
eas build --platform android --profile preview --local
```

This creates an APK file you can host on your website.

### 3. Host on Website

Place built APKs in `public/downloads/`:
- `public/downloads/dkee-customer.apk`
- `public/downloads/dkee-staff.apk`

### 4. Web Download Pages

Download pages are available at:
- Customer App: `/downloads/customer`
- Staff App: `/downloads/staff`

## Installation Instructions

### Android
1. Download APK from website
2. Enable "Install from Unknown Sources" in Settings
3. Open downloaded APK and tap "Install"

### iOS (Development Only)
For iOS without App Store:
1. Requires device UDID registration in Apple Developer portal
2. Build with ad-hoc provisioning profile
3. Install via TestFlight or direct OTA distribution

**Note**: iOS distribution without App Store is complex. Consider:
- PWA (Progressive Web App) version for iOS users
- TestFlight for beta distribution (up to 10,000 users)
- Apple Developer Enterprise Program ($299/year) for internal distribution

## Alternative: PWA Support

For broader compatibility, the customer app can also work as a PWA:
- Works on iOS without app store
- Installable from browser
- Offline support
- Push notifications (Android)

Enable PWA in `next.config.js` and add manifest.json.

## Security Notes

- APK signing: Use `eas build` with credentials for production
- HTTPS required: Host downloads over HTTPS
- Version control: Implement update notifications in apps
- Analytics: Track download/installation metrics

## Updates

When releasing updates:
1. Increment version in `app.json`
2. Build new APK/IPA
3. Replace files in `public/downloads/`
4. Update version number on download pages
5. Add "Update Available" banner in apps
