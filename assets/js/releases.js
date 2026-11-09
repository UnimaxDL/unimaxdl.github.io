// assets/js/releases.js
(async function initReleaseManifest() {
  const PUBLIC_RELEASE_REPO = 'UnimaxDL/unimaxdl.github.io';
  const CURRENT_TAG = 'v1.0.0';

  try {
    const res = await fetch(`https://api.github.com/repos/${PUBLIC_RELEASE_REPO}/releases/tags/${CURRENT_TAG}`);
    if (!res.ok) return;

    const data = await res.json();
    const assets = data.assets || [];

    const macAsset = assets.find(a => a.name.includes('macos') && a.name.endsWith('.dmg'));
    const linuxAsset = assets.find(a => a.name.includes('linux') && a.name.endsWith('.AppImage'));

    const macBtn = document.getElementById('btn-download-mac');
    const linuxBtn = document.getElementById('btn-download-linux');

    if (macAsset && macBtn && !macBtn.href.includes('/downloads/')) macBtn.href = macAsset.browser_download_url;
    if (linuxAsset && linuxBtn && !linuxBtn.href.includes('/downloads/')) linuxBtn.href = linuxAsset.browser_download_url;
  } catch (err) {
    console.warn('Fallback: direct manifest active.', err);
  }
})();
