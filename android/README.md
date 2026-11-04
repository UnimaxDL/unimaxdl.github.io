# UnimaxDL Android App

Native Android wrapper with system-wide **Share-Sheet** integration.

## Features
- **Share to Download:** Open YouTube, TikTok, or Instagram, tap "Share", and select **UnimaxDL**. The app catches the video URL automatically and initiates analysis.
- **Native Download Manager:** Streams are handed directly to Android's `DownloadManager` for notification tray progress bars, automatic retries, and direct storage in `/storage/emulated/0/Download/UnimaxDL/`.
- **Zero Ads / 100% Free:** No popups or subscription walls.

## Building the APK
To compile the APK locally:
```bash
cd android
./gradlew assembleRelease
```
The compiled APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`
