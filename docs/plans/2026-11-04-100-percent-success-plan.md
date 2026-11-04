# UnimaxDL 100% Success Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and ship the complete UnimaxDL multi-platform ecosystem: a high-traffic monetization web portal with real-time user/download analytics dashboard, native Android APK share-catcher, desktop local 4K downloader, and automated GitHub CI/CD releases with zero recurring server bills.

**Architecture:** A 3-tier hybrid model: static GitHub Pages for high-volume SEO discovery and Monetag ad revenue; client-side Supabase telemetry for live visitor and download metrics; and native Android/Desktop clients executing high-resolution 4K/8K media downloads locally on user devices without server bandwidth limits.

**Tech Stack:** GitHub Pages, Vanilla JavaScript (ES2022), Tailwind CSS, Supabase REST Telemetry API, Android Intent Filter (Kotlin/Java/Webview Shell), Electron/Tauri Desktop Runner (`yt-dlp`), GitHub Actions CI/CD.

---

### Task 1: Live Analytics & Telemetry Dashboard (`dashboard/index.html`)

**Files:**
- Create: `dashboard/index.html`
- Create: `server/static/dashboard/index.html`
- Modify: `assets/js/analytics.js`

**Step 1: Write the failing test / verification script**
Run a test to ensure `dashboard/index.html` exists and connects to Supabase REST endpoint:
```powershell
Test-Path "D:\Vidios\My Github\UnimaxDL\dashboard\index.html"
```
Expected: `False`

**Step 2: Implement `dashboard/index.html`**
Create a responsive Obsidian dark analytics dashboard featuring:
- Daily Unique Visitors counter (from `user_visits`).
- Total Downloads counter (from `download_events`).
- Platform Breakdown chart/table (YouTube, TikTok, Instagram, Twitter, Facebook).
- Top Downloaded Videos table (Title, Resolution, Time, Platform).
- Live refresh toggle (auto-refresh every 30 seconds).

**Step 3: Verification**
Verify that `dashboard/index.html` renders valid HTML and can fetch query endpoints from Supabase.

**Step 4: Commit**
```bash
git add dashboard/index.html assets/js/analytics.js
git commit -m "feat(analytics): add real-time telemetry dashboard for daily users and downloads"
```

---

### Task 2: Additional High-Intent SEO Landing Pages

**Files:**
- Create: `twitter-downloader.html`
- Create: `facebook-downloader.html`
- Modify: `sitemap.xml`
- Copy to: `server/static/`

**Step 1: Create `twitter-downloader.html` and `facebook-downloader.html`**
- Obsidian dark theme with zero emojis (SVG icons only).
- Non-blocking deferred Monetag ad loader.
- Schema.org `HowTo` and `SoftwareApplication` JSON-LD for Google rich snippets.
- Fast client-side URL parsing with download modals and fallback mirrors.

**Step 2: Update `sitemap.xml`**
Add both URLs with `priority` 0.8 and `changefreq` weekly.

**Step 3: Verification**
Verify both pages load valid HTML and pass schema checks.

**Step 4: Commit**
```bash
git add twitter-downloader.html facebook-downloader.html sitemap.xml
git commit -m "feat(seo): add Twitter/X and Facebook video downloader landing pages"
```

---

### Task 3: Android Native Share-Intent Shell (`android/`)

**Files:**
- Create: `android/app/src/main/AndroidManifest.xml`
- Create: `android/app/src/main/java/com/unimaxdl/app/MainActivity.java`
- Create: `android/app/build.gradle`
- Create: `android/README.md`

**Step 1: Create Android project scaffold**
- Configure `ACTION_SEND` intent-filter for `text/plain` so when a user shares a video from YouTube/TikTok/Instagram apps, UnimaxDL appears in the share sheet.
- Implement Android `DownloadManager` integration to save media directly into `/storage/emulated/0/Download/UnimaxDL/`.
- Add local storage permission and network security config.

**Step 2: Verification**
Verify Gradle files, AndroidManifest syntax, and intent filters.

**Step 3: Commit**
```bash
git add android/
git commit -m "feat(android): scaffold native share-intent handler and download manager"
```

---

### Task 4: Desktop Application Local Runner (`desktop/`)

**Files:**
- Create: `desktop/package.json`
- Create: `desktop/main.js`
- Create: `desktop/preload.js`
- Create: `desktop/README.md`

**Step 1: Create Desktop application package**
- Electron wrapper loading `https://unimaxdl.github.io/` with offline native bridge.
- Local execution interface for `yt-dlp` to download 4K 60FPS / 8K streams with zero server lag.
- Native file-save picker and download speed monitor.

**Step 2: Verification**
Verify package.json and main.js syntax.

**Step 3: Commit**
```bash
git add desktop/
git commit -m "feat(desktop): scaffold native cross-platform desktop runner"
```

---

### Task 5: GitHub Actions Automated Build & Release CI/CD

**Files:**
- Create: `.github/workflows/build-releases.yml`

**Step 1: Create GitHub Actions release workflow**
- Automated trigger on git tag push (`v*`).
- Builds web assets, validates sitemap, and packages the app.
- Creates GitHub Release drafts with direct `.apk` and desktop asset uploads.

**Step 2: Commit & Deploy**
```bash
git add .github/workflows/build-releases.yml
git commit -m "ci: add automated release workflow for multi-platform binaries"
```
