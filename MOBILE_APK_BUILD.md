# Mobile APK Build Guide

## Prerequisites Installed ✓
- Node.js 18+
- npm dependencies (customer-app & staff-app)
- eas-cli globally installed

## Step 1: Login to Expo

```powershell
eas login
```

**Don't have an Expo account?**
- Create one at: https://expo.dev/signup
- It's free for building APKs

## Step 2: Configure Projects

Both apps already have `eas.json` configured for APK builds!

### Customer App Config (mobile/customer-app/eas.json):
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## Step 3: Update API Base URL

### For Production Builds:

**Customer App:**
```powershell
cd mobile/customer-app
```

Create `.env` file:
```
EXPO_PUBLIC_API_BASE=https://your-production-url.vercel.app
```

**Staff App:**
```powershell
cd mobile/staff-app
```

Create `.env` file:
```
EXPO_PUBLIC_API_BASE=https://your-production-url.vercel.app
```

## Step 4: Build Customer App APK

```powershell
cd mobile/customer-app

# For preview/testing
eas build --platform android --profile preview

# For production
eas build --platform android --profile production
```

**What happens:**
1. EAS creates a build job
2. Uploads your code to Expo servers
3. Builds APK in the cloud (takes 10-15 minutes)
4. Provides download URL when complete

**Monitor build:**
- View progress at: https://expo.dev/accounts/YOUR-ACCOUNT/projects/dkee-customer/builds
- Or watch in terminal

## Step 5: Build Staff App APK

```powershell
cd ../staff-app

# For preview/testing
eas build --platform android --profile preview

# For production
eas build --platform android --profile production
```

## Step 6: Download APKs

### Option A: Download via URL
After build completes, EAS provides a download URL:
```
✔ Build finished
https://expo.dev/artifacts/eas/xxxxx.apk
```

Click the URL to download.

### Option B: Download via CLI
```powershell
# List recent builds
eas build:list

# Download specific build
eas build:download --id YOUR-BUILD-ID
```

## Step 7: Host APKs on Your Website

1. Rename downloaded files:
   ```powershell
   # After downloading
   mv downloaded-file.apk dkee-customer.apk
   mv downloaded-file-2.apk dkee-staff.apk
   ```

2. Copy to public directory:
   ```powershell
   # From project root
   cp path/to/dkee-customer.apk public/downloads/
   cp path/to/dkee-staff.apk public/downloads/
   ```

3. Commit and deploy:
   ```powershell
   git add public/downloads/*.apk
   git commit -m "Add mobile APK files for download"
   git push origin main
   ```

4. Download pages are already live at:
   - Customer: `https://your-site.com/downloads/customer`
   - Staff: `https://your-site.com/downloads/staff`

## Step 8: Update App Versions

When releasing updates:

1. Update version in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1",
       "android": {
         "versionCode": 2
       }
     }
   }
   ```

2. Rebuild APK (repeat Steps 4-7)

3. Update download page with new version number

## Alternative: Local Builds (Requires Android Studio)

If you prefer building locally:

```powershell
# Configure for local builds
eas build --platform android --profile preview --local

# Requires:
# - Android Studio installed
# - Android SDK configured
# - Java Development Kit (JDK)
```

## Build Profiles Explained

### Preview Profile
- Development builds
- Not signed for Play Store
- Good for direct distribution
- Faster build times

### Production Profile
- Optimized builds
- Can be signed for Play Store (if needed later)
- Slightly slower build times
- Better performance

## Testing APKs

### Before Distribution:
1. Install on test device:
   ```
   adb install dkee-customer.apk
   ```

2. Test all features:
   - [ ] Login works
   - [ ] API calls succeed
   - [ ] Loyalty points load
   - [ ] Appointments booking works
   - [ ] Payments initiate
   - [ ] Push notifications arrive

3. Test on multiple devices:
   - Different Android versions (5.0+)
   - Different screen sizes
   - Different network conditions

## APK Size Optimization

Current size: ~25MB per app

To reduce size:
1. Enable Hermes engine (already enabled)
2. Enable ProGuard in production
3. Remove unused dependencies
4. Optimize images

## Build Troubleshooting

### Build fails with "Missing credentials":
```powershell
eas credentials
# Select your project and platform
# Follow prompts to configure
```

### Build fails with timeout:
- Check your internet connection
- Try again (EAS servers may be busy)

### "Project not found" error:
1. Run in app directory:
   ```powershell
   eas init
   ```
2. Follow prompts to link project

### Need to update EAS CLI:
```powershell
npm install -g eas-cli@latest
```

## Build Status & History

View all builds:
```powershell
eas build:list
```

View specific build details:
```powershell
eas build:view BUILD-ID
```

Cancel running build:
```powershell
eas build:cancel
```

## Cost & Limits

**Free Tier (Expo):**
- Unlimited builds
- Queue priority (may wait during peak times)
- 30-day artifact retention

**Paid Tier ($29/month):**
- Priority builds (faster)
- Longer artifact retention
- More concurrent builds

## Distribution Checklist

Before sharing APKs with users:

- [ ] Test on multiple devices
- [ ] Verify API connection works
- [ ] Test authentication flow
- [ ] Verify push notifications
- [ ] Test offline behavior
- [ ] Check performance
- [ ] Update version numbers
- [ ] Create release notes
- [ ] Update download page
- [ ] Notify users via email/SMS

## Security Note

APKs are **unsigned** by default (good for direct distribution).

For Play Store:
- Need signing certificate
- Configure in `eas.json`
- Requires Google Play Developer account ($25 one-time)

## Quick Reference Commands

```powershell
# Build preview APK
eas build -p android --profile preview

# Build production APK
eas build -p android --profile production

# List builds
eas build:list

# Download build
eas build:download

# View build logs
eas build:view BUILD-ID

# Clear local cache
eas build:cancel --all
```

## Support

- EAS Documentation: https://docs.expo.dev/build/introduction/
- Expo Forums: https://forums.expo.dev/
- Discord: https://chat.expo.dev/

---

**Ready to build? Run:**
```powershell
cd mobile/customer-app
eas login
eas build --platform android --profile production
```
