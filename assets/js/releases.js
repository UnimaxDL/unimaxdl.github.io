// assets/js/releases.js
(async function initReleaseManifest() {
  const GITHUB_DESKTOP_REPO = 'UnimaxDL/unimaxdl-desktop';
  const GITHUB_ANDROID_REPO = 'UnimaxDL/unimaxdl-android';

  try {
    const [desktopRes, androidRes] = await Promise.allSettled([
      fetch(`https://api.github.com/repos/${GITHUB_DESKTOP_REPO}/releases/latest`),
      fetch(`https://api.github.com/repos/${GITHUB_ANDROID_REPO}/releases/latest`)
    ]);

    if (desktopRes.status === 'fulfilled' && desktopRes.value.ok) {
      const desktopData = await desktopRes.value.json();
      const assets = desktopData.assets || [];

      const winAsset = assets.find(a => a.name.endsWith('.exe'));
      const macAsset = assets.find(a => a.name.endsWith('.dmg'));
      const linuxAsset = assets.find(a => a.name.endsWith('.AppImage'));

      const winBtn = document.getElementById('btn-download-win');
      const macBtn = document.getElementById('btn-download-mac');
      const linuxBtn = document.getElementById('btn-download-linux');

      if (winAsset && winBtn) winBtn.href = winAsset.browser_download_url;
      if (macAsset && macBtn) macBtn.href = macAsset.browser_download_url;
      if (linuxAsset && linuxBtn) linuxBtn.href = linuxAsset.browser_download_url;
    }

    if (androidRes.status === 'fulfilled' && androidRes.value.ok) {
      const androidData = await androidRes.value.json();
      const assets = androidData.assets || [];
      const apkAsset = assets.find(a => a.name.endsWith('.apk'));
      const androidBtn = document.getElementById('btn-download-android');
      if (apkAsset && androidBtn) {
        androidBtn.href = apkAsset.browser_download_url;
      }
    }
  } catch (err) {
    console.warn('Fallback: direct releases link active.', err);
  }
})();
