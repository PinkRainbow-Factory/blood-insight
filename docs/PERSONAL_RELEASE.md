# Blood Insight Agent Personal Release

## Current package identity
- App name: `Blood Insight Agent`
- Android package: `ai.bloodinsight.app`
- Version: `1.1.0`
- Version code: `2`

## Built outputs
- Debug APK: `app/android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `app/android/app/build/outputs/apk/release/app-release-unsigned.apk`

## Personal install flow
1. Use the debug APK for rapid local testing.
2. Use the unsigned release APK as the base artifact for final signing later.
3. When a keystore is prepared, build a signed release artifact from the same Android project in Android Studio.

## NAS sync
- Refresh NAS web/server package with:
  - `deploy/nas-package/blood-insight-nas-package.tar.gz`
  - `deploy/nas-package/blood-insight-nas-package-fixed.zip`
- Re-deploy after package upload so the web build matches the Android app wording and styles.
