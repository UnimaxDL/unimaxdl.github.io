// assets/js/releases.js
(async function initReleaseManifest() {
  const PUBLIC_RELEASE_REPO = 'UnimaxDL/unimaxdl.github.io';

  try {
    const res = await fetch(`https://api.github.com/repos/${PUBLIC_RELEASE_REPO}/releases/latest`);
    if (!res.ok) return;

    const data = await res.json();
    const assets = data.assets || [];

    const winAsset = assets.find(a => a.name.endsWith('.exe') || a.name.endsWith('.zip'));
    const apkAsset = assets.find(a => a.name.endsWith('.apk'));
    const macAsset = assets.find(a => a.name.endsWith('.dmg'));
    const linuxAsset = assets.find(a => a.name.endsWith('.AppImage') || a.name.endsWith('.deb'));

    const winBtn = document.getElementById('btn-download-win');
    const apkBtn = document.getElementById('btn-download-android');
    const macBtn = document.getElementById('btn-download-mac');
    const linuxBtn = document.getElementById('btn-download-linux');

    if (winAsset && winBtn) winBtn.href = winAsset.browser_download_url;
    if (apkAsset && apkBtn) apkBtn.href = apkAsset.browser_download_url;
    if (macAsset && macBtn) macBtn.href = macAsset.browser_download_url;
    if (linuxAsset && linuxBtn) linuxBtn.href = linuxAsset.browser_download_url;
  } catch (err) {
    console.warn('Fallback: direct GitHub Releases manifest active.', err);
  }
})();
