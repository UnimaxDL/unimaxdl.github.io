// assets/js/releases.js - UnimaxDL Fast Direct CDN Enforcer
(function initFastDownloads() {
  const cdnLinks = {
    'btn-download-android': '/downloads/UnimaxDL-v1.1.1.apk',
    'btn-download-win': '/downloads/UnimaxDL-Setup-v1.0.0.exe',
    'btn-download-mac': '/downloads/UnimaxDL-v1.0.0-macos.dmg',
    'btn-download-linux': '/downloads/UnimaxDL-v1.0.0-linux.AppImage'
  };

  Object.entries(cdnLinks).forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (el) {
      el.href = path;
      el.setAttribute('download', path.split('/').pop());
    }
  });
})();
