/**
 * UnimaxDL Downloader Engine v5.0 (Prism Studio)
 * Features:
 * - Client-Side Resolvers (YouTube, TikTok, Instagram, Twitter/X, Reddit, Universal)
 * - Optional Local PC Companion & Render Cloud Engine
 * - On-Site 5-Second Stream Preparation Gateway (#udl-download-helper-modal) with reserved Sponsor Frame
 * - OS-Aware 4K Native App Upsell Modal (#udl-4k-modal) with non-bouncing 1080p browser fallback
 * - Strict DOM-CONTRACT.md compatibility, XSS-safe rendering, zero emojis
 */

const UDL_DOWNLOADER = (() => {
  const STORAGE_KEY = 'udl_backend_url';
  const PRODUCTION_API = 'https://unimaxdl-server.onrender.com';
  const CLOUD_MIRROR_URL = 'https://asiafilm.org/4/0b90618d4229234e89f68c862523c621';

  let defaultBackend = PRODUCTION_API;
  if (typeof window !== 'undefined') {
    if (
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      (window.location.port === '8000' || window.location.port === '5000')
    ) {
      defaultBackend = window.location.origin;
    }
  }

  let backendUrl = '';
  try {
    backendUrl = localStorage.getItem(STORAGE_KEY) || defaultBackend;
  } catch (e) {
    backendUrl = defaultBackend;
  }

  let currentMedia = null;
  let pollInterval = null;
  let isAnalyzing = false;
  let isServerConnected = false;
  let gatewayTimer = null;
  let toastDismissTimer = null;
  const modalCloseTimers = new WeakMap();
  const autoDownloadedTasks = new Set();
  const userInitiatedTasks = new Set();

  function escapeHtml(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeHref(url) {
    const raw = String(url ?? '').trim();
    if (/^(https?:|unimaxdl:|\/)/i.test(raw)) return raw;
    return '#';
  }

  function detectVisitorOS() {
    const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '').toLowerCase();
    if (ua.includes('android')) {
      return { os: 'android', label: 'Android APK (v2.1.0)', href: '/downloads/UnimaxDL-v2.1.0.apk', file: 'UnimaxDL-v2.1.0.apk' };
    }
    if (ua.includes('mac os') || ua.includes('macintosh')) {
      return { os: 'macos', label: 'macOS App (v1.0.0)', href: '/downloads/UnimaxDL-v1.0.0-macos.dmg', file: 'UnimaxDL-v1.0.0-macos.dmg' };
    }
    if (ua.includes('linux')) {
      return { os: 'linux', label: 'Linux AppImage (v1.0.0)', href: '/downloads/UnimaxDL-v1.0.0-linux.AppImage', file: 'UnimaxDL-v1.0.0-linux.AppImage' };
    }
    return { os: 'windows', label: 'Windows App (v1.0.0)', href: '/downloads/UnimaxDL-Setup-v1.0.0.exe', file: 'UnimaxDL-Setup-v1.0.0.exe' };
  }

  function openModalEl(modal) {
    if (!modal) return;
    const pending = modalCloseTimers.get(modal);
    if (pending) {
      clearTimeout(pending);
      modalCloseTimers.delete(modal);
    }
    modal.classList.remove('hidden', 'is-closing');
  }

  function closeModalEl(modal) {
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('is-closing');
    const timer = setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('is-closing');
      modalCloseTimers.delete(modal);
    }, 180);
    modalCloseTimers.set(modal, timer);
  }

  // Crisp 1.85px Stroke Inline SVG Registry (Zero Emojis)
  const ICONS = {
    settings: `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>`,
    download: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`,
    video: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
    audio: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/></svg>`,
    desktop: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M8 20h8M12 16v4"/></svg>`,
    mobile: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01"/></svg>`,
    sparkle: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
    close: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
    user: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
    timer: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 2"/></svg>`,
    check: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
    external: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>`
  };

  function getBackendUrl() {
    return backendUrl;
  }

  function setBackendUrl(url) {
    backendUrl = url.trim().replace(/\/+$/, '');
    try {
      localStorage.setItem(STORAGE_KEY, backendUrl);
    } catch (e) {}
    checkServerConnection();
  }

  function hasBackendUrl() {
    return Boolean(backendUrl);
  }

  async function checkServerConnection() {
    const candidates = [];
    if (backendUrl) candidates.push(backendUrl);
    candidates.push('http://127.0.0.1:8000', 'http://127.0.0.1:5000');
    if (PRODUCTION_API && !candidates.includes(PRODUCTION_API)) {
      candidates.push(PRODUCTION_API);
    }

    for (const target of candidates) {
      try {
        const controller = new AbortController();
        const timeoutMs = target.includes('onrender.com') ? 3500 : 1200;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(`${target}/api/ping`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          backendUrl = target;
          isServerConnected = true;
          updateStatusBadge(true, target);
          return true;
        }
      } catch (e) {}
    }

    isServerConnected = false;
    updateStatusBadge(false, '');
    return false;
  }

  function updateStatusBadge(connected, targetUrl) {
    const el = document.getElementById('udl-server-status');
    if (!el) return;
    if (connected) {
      const isCloud = targetUrl && targetUrl.includes('onrender.com');
      const label = isCloud ? 'Cloud Engine Ready' : 'Local App Connected';
      el.className = 'header-status-pill';
      el.innerHTML = `<span class="status-dot ready"></span><span>${label}</span>`;
      el.title = `Connected to ${targetUrl}. Click to customize backend settings.`;
      el.onclick = showSettingsModal;
    } else {
      el.className = 'header-status-pill';
      el.innerHTML = `<span class="status-dot"></span><span>Web Mode Ready</span>`;
      el.title = 'Running instant browser resolver. Click to connect a local PC companion.';
      el.onclick = showSettingsModal;
    }
  }

  function showSettingsModal() {
    let modal = document.getElementById('udl-settings-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'udl-settings-modal';
      modal.className = 'studio-modal-wrap';
      document.body.appendChild(modal);
    }

    openModalEl(modal);
    modal.innerHTML = `
      <div class="studio-modal-backdrop" onclick="UDL_DOWNLOADER.closeSettingsModal()"></div>
      <div class="studio-modal-panel" role="dialog" aria-modal="true" aria-labelledby="udl-settings-title">
        <div class="studio-modal-header">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:38px; height:38px; background:var(--bg-amber-tint); border:1px solid var(--border-amber-tint); color:var(--brand-amber-text); display:flex; align-items:center; justify-content:center; border-radius:10px; flex-shrink:0;">
              ${ICONS.settings}
            </div>
            <div>
              <div style="font-size:0.75rem; font-weight:700; color:var(--brand-amber-text);">Companion Server</div>
              <h3 id="udl-settings-title" style="font-size:1.0625rem; font-weight:700; margin:0;">Local Desktop Connection</h3>
            </div>
          </div>
          <button onclick="UDL_DOWNLOADER.closeSettingsModal()" class="studio-modal-close" aria-label="Close">
            ${ICONS.close}
          </button>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          <div>
            <label for="udl-modal-url-input" style="display:block; font-size:0.8125rem; font-weight:600; color:var(--text-primary); margin-bottom:6px;">Server URL</label>
            <div style="display:flex; gap:8px;">
              <input
                type="url"
                inputmode="url"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                id="udl-modal-url-input"
                value="${escapeHtml(backendUrl || 'http://127.0.0.1:8000')}"
                placeholder="http://127.0.0.1:8000"
                style="flex:1; min-width:0; min-height:44px; background:var(--bg-well); border:1px solid var(--line-strong); border-radius:10px; padding:8px 12px; font-size:1rem; color:var(--text-primary); outline:none;"
              />
              <button onclick="UDL_DOWNLOADER.testConnection()" id="udl-ping-btn" class="btn-secondary">
                Check
              </button>
            </div>
            <p style="font-size:0.8125rem; color:var(--text-secondary); margin-top:8px;">
              Connect the free desktop companion app to unlock local 4K UHD merging and batch playlists directly on your computer.
            </p>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:flex-end; gap:10px; border-top:1px solid var(--line-subtle); padding-top:14px;">
          <button onclick="UDL_DOWNLOADER.closeSettingsModal()" class="btn-secondary">Cancel</button>
          <button onclick="UDL_DOWNLOADER.saveModalSettings()" class="btn-primary" style="min-height:42px; padding:8px 18px;">Save Settings</button>
        </div>
      </div>
    `;
  }

  function closeSettingsModal() {
    closeModalEl(document.getElementById('udl-settings-modal'));
  }

  async function testConnection() {
    const btn = document.getElementById('udl-ping-btn');
    const input = document.getElementById('udl-modal-url-input');
    if (!btn || !input) return;

    btn.innerText = 'Checking...';
    const target = input.value.trim().replace(/\/+$/, '');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${target}/api/ping`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        btn.innerText = 'Connected';
        btn.style.borderColor = 'var(--status-ready)';
        btn.style.color = 'var(--status-ready)';
      } else {
        throw new Error();
      }
    } catch {
      btn.innerText = 'Offline';
      btn.style.borderColor = 'var(--status-error)';
      btn.style.color = 'var(--status-error)';
    }

    setTimeout(() => {
      btn.innerText = 'Check';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2400);
  }

  function saveModalSettings() {
    const input = document.getElementById('udl-modal-url-input');
    if (input) {
      setBackendUrl(input.value);
    }
    closeSettingsModal();
    showToast('Connection settings updated.');
  }

  function showToast(msg) {
    if (toastDismissTimer) {
      clearTimeout(toastDismissTimer);
      toastDismissTimer = null;
    }
    document.querySelectorAll('.studio-toast').forEach((t) => t.remove());

    const toast = document.createElement('div');
    toast.className = 'studio-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `<span style="flex-shrink:0; display:inline-flex;">${ICONS.sparkle}</span><span>${escapeHtml(msg)}</span>`;
    document.body.appendChild(toast);

    toastDismissTimer = setTimeout(() => {
      toast.classList.add('is-exiting');
      setTimeout(() => toast.remove(), 220);
      toastDismissTimer = null;
    }, 3000);
  }

  function formatThumbnailUrl(url) {
    if (!url || typeof url !== 'string') return '';
    if (url.startsWith('data:image')) return url;
    if (url.includes('ytimg.com') || url.includes('youtube.com')) return url;
    if (url.includes('wsrv.nl') || url.includes('weserv.nl')) return url;
    if (
      url.includes('cdninstagram') ||
      url.includes('fbcdn.net') ||
      url.includes('tiktokcdn') ||
      url.includes('twimg.com') ||
      url.includes('reddit') ||
      url.includes('pinimg.com') ||
      url.includes('xhamster') ||
      url.startsWith('http://')
    ) {
      return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=webp&q=85`;
    }
    return url;
  }

  function handleThumbError(imgEl) {
    if (!imgEl) return;
    const currentSrc = imgEl.src || '';
    const originalSrc = imgEl.dataset.orig || '';

    if (!currentSrc.includes('wsrv.nl') && originalSrc && !originalSrc.startsWith('data:image')) {
      imgEl.src = `https://wsrv.nl/?url=${encodeURIComponent(originalSrc)}&output=webp&q=85`;
      return;
    }

    if (imgEl.dataset.fallback) {
      imgEl.onerror = null;
      imgEl.src = imgEl.dataset.fallback;
    }
  }

  function generateVideoPosterSvg(title, host) {
    const safeTitle = (title || 'Ready to Download').replace(/[<>&"']/g, '').trim();
    const safeHost = (host || 'UnimaxDL Studio').replace(/[<>&"']/g, '').trim();
    const displayTitle = safeTitle.length > 38 ? safeTitle.substring(0, 35) + '...' : safeTitle;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="udl-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0D1321" />
          <stop offset="100%" stop-color="#172033" />
        </linearGradient>
        <linearGradient id="udl-prism" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00D4FF" />
          <stop offset="100%" stop-color="#FFB800" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#udl-bg)" />
      <circle cx="320" cy="145" r="46" fill="#FFFFFF" fill-opacity="0.06" />
      <circle cx="320" cy="145" r="34" fill="url(#udl-prism)" />
      <polygon points="313,132 334,145 313,158" fill="#0D1321" />
      <rect x="24" y="24" rx="12" ry="12" width="144" height="26" fill="#00D4FF" fill-opacity="0.16" />
      <text x="96" y="41" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#22D3EE" text-anchor="middle">${safeHost}</text>
      <text x="320" y="232" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC" text-anchor="middle">${displayTitle}</text>
      <text x="320" y="258" font-family="system-ui, sans-serif" font-size="13" fill="#94A3B8" text-anchor="middle">Clean Video &amp; Audio Stream</text>
    </svg>`;

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  async function fetchLiveMetadata(targetUrl) {
    const fetchers = [
      async () => {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 2800);
        try {
          const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}`, { signal: c.signal });
          clearTimeout(t);
          if (res.ok) {
            const json = await res.json();
            if (json && json.data) {
              return {
                title: json.data.title || null,
                author: json.data.author || null,
                image: json.data.image && json.data.image.url ? json.data.image.url : null
              };
            }
          }
        } catch (e) {}
        return null;
      },
      async () => {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 2800);
        try {
          const res = await fetch(`https://www.opengraph.to/api/v1/og?url=${encodeURIComponent(targetUrl)}`, { signal: c.signal });
          clearTimeout(t);
          if (res.ok) {
            const json = await res.json();
            if (json) {
              const imgUrl = json.image && typeof json.image === 'object' ? json.image.url : typeof json.image === 'string' ? json.image : null;
              return { title: json.title || null, author: json.site_name || null, image: imgUrl };
            }
          }
        } catch (e) {}
        return null;
      },
      async () => {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 2200);
        try {
          const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(targetUrl)}`, { signal: c.signal });
          clearTimeout(t);
          if (res.ok) {
            const json = await res.json();
            if (json) {
              return { title: json.title || null, author: json.author_name || null, image: json.thumbnail_url || null };
            }
          }
        } catch (e) {}
        return null;
      }
    ];

    try {
      const results = await Promise.allSettled(fetchers.map((f) => f()));
      const best = { title: null, author: null, image: null };
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          if (!best.title && r.value.title) best.title = r.value.title;
          if (!best.author && r.value.author) best.author = r.value.author;
          if (!best.image && r.value.image) best.image = r.value.image;
        }
      }
      return best;
    } catch (e) {
      return { title: null, author: null, image: null };
    }
  }

  async function analyzeUrl(url) {
    if (!url) throw new Error('Please paste a valid media link.');
    if (isAnalyzing) return null;
    isAnalyzing = true;

    try {
      const hasBackend = isServerConnected && backendUrl;
      if (hasBackend) {
        try {
          const controller = new AbortController();
          const analyzeTimeout = backendUrl.includes('onrender.com') ? 3000 : 8000;
          const timeoutId = setTimeout(() => controller.abort(), analyzeTimeout);
          const res = await fetch(`${backendUrl}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const media = data.data || data;
            if (media.thumbnail) media.thumbnail = formatThumbnailUrl(media.thumbnail);
            if (media.formats && !media.video_formats) media.video_formats = media.formats;
            if (!media.extractor && media.source) media.extractor = media.source;
            if (!media.uploader && media.source) media.uploader = `${media.source} Creator`;
            if (!media.duration && media.duration_label) media.duration = media.duration_label;
            media.url = media.url || media.original_url || url;
            media.webpage_url = media.webpage_url || media.original_url || url;
            media.original_url = media.original_url || url;
            currentMedia = media;
            return media;
          }
        } catch (e) {}
      }

      const clientMedia = await resolveClientMedia(url);
      currentMedia = clientMedia;
      return clientMedia;
    } finally {
      isAnalyzing = false;
    }
  }

  async function resolveClientMedia(url) {
    const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(url);
    const isTikTok = /tiktok\.com/i.test(url);
    const isInstagram = /instagram\.com/i.test(url);
    const isTwitter = /(?:twitter\.com|x\.com)/i.test(url);
    const isFacebook = /(?:facebook\.com|fb\.watch)/i.test(url);
    const isReddit = /(?:reddit\.com|redd\.it)/i.test(url);
    const isSoundCloud = /soundcloud\.com/i.test(url);
    const isTwitch = /twitch\.tv/i.test(url);
    const isPinterest = /pinterest\./i.test(url);

    let ytId = null;
    if (isYouTube) {
      const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*)/);
      ytId = match && match[1].length === 11 ? match[1] : null;
    }

    let igCode = null;
    let igUser = null;
    if (isInstagram) {
      const userMatch = url.match(/instagram\.com\/([a-zA-Z0-9._]+)\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/i);
      const directMatch = url.match(/(?:instagram\.com\/(?:reel|p|tv)\/)([a-zA-Z0-9_-]+)/i);
      if (userMatch) {
        igUser = userMatch[1];
        igCode = userMatch[2];
      } else if (directMatch) {
        igCode = directMatch[1];
      }
    }

    let twUser = null;
    let twId = null;
    if (isTwitter) {
      const match = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)/i);
      if (match) {
        twUser = match[1];
        twId = match[2];
      }
    }

    const isReel = url.toLowerCase().includes('/reel/');
    let title = '';
    let uploader = '';
    let thumbnail = '';
    let duration = '03:32';
    let directDownloadUrl = '';

    if (isYouTube) {
      title = ytId ? `YouTube Video (${ytId})` : 'YouTube Video';
      uploader = 'YouTube Creator';
      thumbnail = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : generateVideoPosterSvg(title, 'YouTube');
    } else if (isInstagram) {
      uploader = igUser ? `@${igUser}` : 'Instagram Creator';
      title = igUser ? `@${igUser} Instagram ${isReel ? 'Reel' : 'Post'}` : igCode ? `Instagram ${isReel ? 'Reel' : 'Post'} (${igCode})` : 'Instagram Video';
      thumbnail = generateVideoPosterSvg(title, 'Instagram');
    } else if (isTikTok) {
      title = 'TikTok Clip (No Watermark)';
      uploader = 'TikTok Creator';
      thumbnail = generateVideoPosterSvg(title, 'TikTok');
    } else if (isTwitter) {
      uploader = twUser ? `@${twUser}` : 'X Creator';
      title = twUser ? `Post by @${twUser}` : twId ? `X Post #${twId}` : 'X / Twitter Video';
      thumbnail = generateVideoPosterSvg(title, 'X / Twitter');
    } else if (isReddit) {
      title = 'Reddit Video (Sound + Video Merged)';
      uploader = 'Reddit Creator';
      thumbnail = generateVideoPosterSvg(title, 'Reddit');
    } else if (isSoundCloud) {
      title = 'SoundCloud Track (320k MP3)';
      uploader = 'SoundCloud Artist';
      thumbnail = generateVideoPosterSvg(title, 'SoundCloud');
    } else if (isTwitch) {
      title = 'Twitch Highlight Clip';
      uploader = 'Twitch Channel';
      thumbnail = generateVideoPosterSvg(title, 'Twitch');
    } else if (isPinterest) {
      title = 'Pinterest Video Pin';
      uploader = 'Pinterest Creator';
      thumbnail = generateVideoPosterSvg(title, 'Pinterest');
    } else if (isFacebook) {
      title = 'Facebook Video';
      uploader = 'Facebook Creator';
      thumbnail = generateVideoPosterSvg(title, 'Facebook');
    } else {
      let host = 'Web Source';
      let cleanSlug = '';
      try {
        const parsed = new URL(url);
        host = parsed.hostname.replace(/^www\./, '');
        const segments = parsed.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          const rawSlug = segments[segments.length - 1] || '';
          cleanSlug = rawSlug
            .replace(/\.[a-zA-Z0-9]+$/, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\b\d{4,}\b/g, '')
            .trim();
          if (cleanSlug.length > 3) {
            cleanSlug = cleanSlug
              .split(' ')
              .filter(Boolean)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(' ');
          }
        }
      } catch (e) {}

      title = cleanSlug || `${host} Media`;
      uploader = host;
      thumbnail = generateVideoPosterSvg(title, host);
    }

    if (isYouTube) {
      const ytTasks = [
        (async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1600);
          try {
            const r = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (r.ok) return { kind: 'noembed', data: await r.json() };
          } catch (e) {
            clearTimeout(timeoutId);
          }
          return null;
        })()
      ];
      if (ytId) {
        ytTasks.push(
          (async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1600);
            try {
              const yRes = await fetch(`https://yt.chocolatemoo53.com/api/v1/videos/${ytId}`, { signal: controller.signal });
              clearTimeout(timeoutId);
              if (yRes.ok) return { kind: 'invidious', data: await yRes.json() };
            } catch (e) {
              clearTimeout(timeoutId);
            }
            return null;
          })()
        );
      }
      const ytResults = await Promise.allSettled(ytTasks);
      for (const item of ytResults) {
        if (item.status !== 'fulfilled' || !item.value) continue;
        const { kind, data } = item.value;
        if (kind === 'noembed' && data) {
          if (data.title) title = data.title;
          if (data.author_name) uploader = data.author_name;
          if (data.thumbnail_url) thumbnail = data.thumbnail_url;
        } else if (kind === 'invidious' && data) {
          if (data.title && (!title || title.startsWith('YouTube Video'))) title = data.title;
          if (data.author && (!uploader || uploader === 'YouTube Creator')) uploader = data.author;
          if (data.lengthSeconds) duration = formatDuration(data.lengthSeconds);
          const formatStreams = data.formatStreams || [];
          if (formatStreams.length > 0 && formatStreams[0].url) {
            directDownloadUrl = formatStreams[0].url;
          }
        }
      }
    }

    if (isTikTok) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const tkRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (tkRes.ok) {
          const tkData = await tkRes.json();
          if (tkData && tkData.data) {
            if (tkData.data.title) title = tkData.data.title;
            if (tkData.data.author && tkData.data.author.nickname) uploader = tkData.data.author.nickname;
            if (tkData.data.cover) thumbnail = tkData.data.cover;
            if (tkData.data.play) directDownloadUrl = tkData.data.play;
            if (tkData.data.duration) duration = formatDuration(tkData.data.duration);
          }
        }
      } catch (e) {}
    }

    if (!isYouTube && !isTikTok) {
      const liveMeta = await fetchLiveMetadata(url);
      if (liveMeta) {
        if (liveMeta.title && !['Instagram', 'xHamster', 'X', 'Twitter', 'Facebook', 'Reddit'].includes(liveMeta.title)) {
          title = liveMeta.title;
        }
        if (liveMeta.author) uploader = liveMeta.author;
        if (liveMeta.image) thumbnail = liveMeta.image;
      }
    }

    const extractor = isYouTube
      ? 'YouTube'
      : isTikTok
        ? 'TikTok'
        : isInstagram
          ? 'Instagram'
          : isReddit
            ? 'Reddit'
            : isSoundCloud
              ? 'SoundCloud'
              : isTwitch
                ? 'Twitch'
                : isPinterest
                  ? 'Pinterest'
                  : isFacebook
                    ? 'Facebook'
                    : isTwitter
                      ? 'X / Twitter'
                      : 'Web Video';

    const video_formats = [
      { resolution: '4K UHD', height: 2160, ext: 'mp4', filesize_formatted: 'Native 60fps', fps: 60, quality: '2160p' },
      { resolution: '1080p Full HD', height: 1080, ext: 'mp4', filesize_formatted: 'Crisp MP4', fps: 60, quality: '1080p' },
      { resolution: '720p HD', height: 720, ext: 'mp4', filesize_formatted: 'Fast Save', fps: 30, quality: '720p' },
      { resolution: '480p Compact', height: 480, ext: 'mp4', filesize_formatted: 'Small File', fps: 30, quality: '480p' }
    ];

    const audio_formats = [
      { id: 'mp3-320', label: '320k MP3 Audio', bitrate: '320kbps', ext: 'mp3', quality: 'mp3-320' },
      { id: 'mp3-192', label: '192k MP3 Standard', bitrate: '192kbps', ext: 'mp3', quality: 'mp3-192' },
      { id: 'm4a', label: 'M4A Original Track', bitrate: 'Original', ext: 'm4a', quality: 'm4a' }
    ];

    return {
      title,
      uploader,
      thumbnail: formatThumbnailUrl(thumbnail),
      duration,
      extractor,
      webpage_url: url,
      direct_download_url: directDownloadUrl,
      video_formats,
      audio_formats,
      isClientOnly: true
    };
  }

  function formatDuration(sec) {
    const s = parseInt(sec, 10) || 0;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${rem < 10 ? '0' : ''}${rem}`;
  }

  function isNativeApp() {
    return typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('UnimaxDL-Android');
  }

  function isHighQuality(f) {
    if (!f) return false;
    if (typeof f === 'string') {
      const q = f.toLowerCase();
      return q.includes('2160') || q.includes('4320') || q.includes('1440') || q.includes('4k') || q.includes('8k') || q.includes('2k');
    }
    if (f.requires_app) return true;
    const q = String(f.quality || f.resolution || '').toLowerCase();
    const h = parseInt(f.height, 10) || 0;
    const fps = parseInt(f.fps, 10) || 30;
    return h > 1080 || (h === 1080 && fps > 60) || q.includes('2160') || q.includes('4320') || q.includes('1440') || q.includes('4k') || q.includes('8k') || q.includes('2k');
  }

  function bindDelegatedActions(root) {
    if (!root || root.dataset.udlDelegated) return;
    root.dataset.udlDelegated = '1';
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-udl-action]');
      if (!btn) return;
      const act = btn.dataset.udlAction;
      if (act === 'download') {
        triggerDownload(btn.dataset.type || 'video', btn.dataset.quality || '1080p');
      } else if (act === 'exec-download') {
        executeDownloadAction(btn.dataset.url || '', btn.dataset.filename || 'unimaxdl-media', btn.dataset.quality || 'HD');
      } else if (act === 'local-or-app') {
        triggerLocalOrApp(btn.dataset.type || 'video', btn.dataset.quality || '1080p');
      } else if (act === 'copy-link') {
        copyDeepLink(btn.dataset.link || '');
      }
    });
  }

  function show4KPromptModal(type, quality) {
    let modal = document.getElementById('udl-4k-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'udl-4k-modal';
      modal.className = 'studio-modal-wrap';
      document.body.appendChild(modal);
    }
    bindDelegatedActions(modal);

    const targetUrl = currentMedia ? currentMedia.original_url || currentMedia.webpage_url || currentMedia.url || '' : '';
    const deepLink = 'unimaxdl://resolve?url=' + encodeURIComponent(targetUrl);
    const visitor = detectVisitorOS();

    openModalEl(modal);
    modal.innerHTML = `
      <div class="studio-modal-backdrop" onclick="UDL_DOWNLOADER.close4KModal()"></div>
      <div class="studio-modal-panel" role="dialog" aria-modal="true" aria-labelledby="udl-4k-title">
        <div class="studio-modal-header">
          <div style="display:flex; align-items:center; gap:12px; min-width:0;">
            <div style="width:42px; height:42px; background:var(--brand-amber); color:var(--brand-amber-ink); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:800; font-size:0.9375rem; border-radius:10px; flex-shrink:0;">
              4K
            </div>
            <div style="min-width:0;">
              <span class="tech-badge tech-badge-amber">Free Native App</span>
              <h3 id="udl-4k-title" style="font-size:1.125rem; font-weight:700; margin:4px 0 0;">Save 4K HDR &amp; Full Playlists</h3>
            </div>
          </div>
          <button onclick="UDL_DOWNLOADER.close4KModal()" class="studio-modal-close" aria-label="Close">
            ${ICONS.close}
          </button>
        </div>

        <p style="font-size:0.9375rem; color:var(--text-secondary); line-height:1.55;">
          Browsers cap direct saves at 1080p. Install the free UnimaxDL app for uncompressed <strong>${escapeHtml(quality)} 60fps</strong>, whole playlists, and one-tap Android Share Sheet capture.
        </p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div style="padding:12px; border-radius:12px; background:var(--bg-well); border:1px solid var(--line-subtle);">
            <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:4px;">Web Browser</div>
            <div style="font-size:0.875rem; font-weight:700; color:var(--text-primary);">Up to 1080p MP4 &amp; MP3</div>
          </div>
          <div style="padding:12px; border-radius:12px; background:var(--bg-amber-tint); border:1px solid var(--border-amber-tint);">
            <div style="font-size:0.75rem; font-weight:700; color:var(--brand-amber-text); margin-bottom:4px;">UnimaxDL Native App</div>
            <div style="font-size:0.875rem; font-weight:700; color:var(--text-primary);">4K 60fps + Batch Queues</div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <a href="${escapeHtml(visitor.href)}" download="${escapeHtml(visitor.file)}" class="btn-primary btn-amber" style="width:100%;">
            ${visitor.os === 'android' ? ICONS.mobile : ICONS.desktop}
            <span>Download Free ${escapeHtml(visitor.label)}</span>
          </a>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <a href="${escapeHtml(safeHref(deepLink))}" class="btn-secondary" style="width:100%;">
              <span>Open Installed App</span>
            </a>
            <a href="/download.html" class="btn-secondary" style="width:100%;">
              <span>All Downloads</span>
            </a>
          </div>

          <button onclick="UDL_DOWNLOADER.fallbackTo1080p()" class="pill-btn" style="width:100%; border-color:var(--border-cyan-tint); color:var(--brand-cyan-text);">
            <span>Continue with 1080p HD in browser &rarr;</span>
          </button>

          <div style="padding-top:12px; margin-top:4px; border-top:1px solid var(--line-subtle); display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
            <span class="sponsor-eyebrow">Sponsored</span>
            <a href="${CLOUD_MIRROR_URL}" target="_blank" rel="noopener noreferrer" style="font-size:0.8125rem; font-weight:600; color:var(--brand-amber-text); display:inline-flex; align-items:center; gap:5px;">
              <span>Try Fast Sponsored Cloud Mirror</span>
              ${ICONS.external}
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function copyDeepLink(link) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(link)
        .then(() => showToast('App link copied cleanly.'))
        .catch(() => showToast(`App Link: ${link}`));
    } else {
      showToast(`App Link: ${link}`);
    }
  }

  function close4KModal() {
    closeModalEl(document.getElementById('udl-4k-modal'));
  }

  function fallbackTo1080p() {
    close4KModal();
    triggerDownload('video', '1080p');
  }

  async function triggerDownload(type, quality) {
    if (!currentMedia) return;

    if (type === 'video' && isHighQuality(quality) && !isNativeApp()) {
      show4KPromptModal(type, quality);
      return;
    }

    const targetUrl = currentMedia.original_url || currentMedia.webpage_url || currentMedia.url || '';
    if (!targetUrl) {
      showToast('Please enter a valid media link.');
      return;
    }

    if (typeof UDL_ANALYTICS !== 'undefined') {
      UDL_ANALYTICS.trackDownload({
        source_site: currentMedia.extractor || 'web',
        media_type: type,
        quality: quality,
        video_title: currentMedia.title || 'Untitled Video',
        video_url: targetUrl,
        duration_sec: currentMedia.duration || null
      });
    }

    // If a local PC companion (127.0.0.1 / localhost) is actively connected, route directly to local FFmpeg
    const isLocalCompanion = isServerConnected && backendUrl && !backendUrl.includes('onrender.com');
    if (isLocalCompanion) {
      showToast(`Starting ${quality} local companion transfer...`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${backendUrl}/api/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: targetUrl,
            type,
            quality,
            title: currentMedia.title || '',
            thumbnail: currentMedia.thumbnail || ''
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data && data.task_id) userInitiatedTasks.add(data.task_id);
          const tasksContainer = document.getElementById('tasks-container');
          if (tasksContainer) {
            tasksContainer.classList.remove('hidden');
            tasksContainer.scrollIntoView({ behavior: 'smooth' });
          }
          startPolling((tasks) => renderTasks(tasks, document.getElementById('tasks-container')));
          return;
        }
      } catch (e) {}
    }

    // Standard browser mode: Open the 5-Second Stream Preparation Gateway immediately (0ms wait)
    showMonetizedDownloadGateway(type, quality);
  }

  // On-Site 5-Second Stream Preparation Gateway (#udl-download-helper-modal)
  function showMonetizedDownloadGateway(type, quality) {
    if (gatewayTimer) {
      clearInterval(gatewayTimer);
      gatewayTimer = null;
    }

    let modal = document.getElementById('udl-download-helper-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'udl-download-helper-modal';
      modal.className = 'studio-modal-wrap';
      document.body.appendChild(modal);
    }
    bindDelegatedActions(modal);

    const title = currentMedia ? currentMedia.title : 'Media File';
    const mediaUrl = currentMedia ? currentMedia.webpage_url || currentMedia.url || '' : '';
    const isAudio = type === 'audio';

    const ytMatch = mediaUrl.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*)/);
    const ytId = ytMatch && ytMatch[1].length === 11 ? ytMatch[1] : null;

    let directStreamUrl = '';
    const downloadFileName =
      (title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().substring(0, 36) || 'unimaxdl-media') + (isAudio ? '.mp3' : '.mp4');

    if (ytId) {
      if (isAudio) {
        directStreamUrl = `https://yt.chocolatemoo53.com/latest_version?id=${ytId}&itag=140`;
      } else if (quality === '720p' || quality === '480p' || quality === '360p') {
        directStreamUrl = `https://yt.chocolatemoo53.com/latest_version?id=${ytId}&itag=22`;
      }
    } else if (currentMedia && currentMedia.direct_download_url) {
      directStreamUrl = currentMedia.direct_download_url;
    }

    const hasDirectStream = Boolean(directStreamUrl);
    const safeTitle = escapeHtml(title);
    const safeQuality = escapeHtml(quality);
    const safeStream = escapeHtml(directStreamUrl);
    const safeFile = escapeHtml(downloadFileName);
    const safeType = escapeHtml(type);
    const ringCircumference = 100.53;

    openModalEl(modal);
    modal.innerHTML = `
      <div class="studio-modal-backdrop" onclick="UDL_DOWNLOADER.closeDownloadModal()"></div>
      <div class="studio-modal-panel" role="dialog" aria-modal="true" aria-labelledby="udl-gw-title">
        <div class="studio-modal-header">
          <div style="display:flex; align-items:center; gap:12px; min-width:0;">
            <div style="width:40px; height:40px; background:var(--bg-cyan-tint); border:1px solid var(--border-cyan-tint); color:var(--brand-cyan-text); display:flex; align-items:center; justify-content:center; border-radius:10px; flex-shrink:0;">
              ${isAudio ? ICONS.audio : ICONS.video}
            </div>
            <div style="min-width:0;">
              <span class="tech-badge tech-badge-cyan">${safeQuality} ${isAudio ? 'Audio' : 'Video'}</span>
              <h3 id="udl-gw-title" title="${safeTitle}" style="font-size:1rem; font-weight:700; margin:4px 0 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Preparing Your Download</h3>
            </div>
          </div>
          <button onclick="UDL_DOWNLOADER.closeDownloadModal()" class="studio-modal-close" aria-label="Close">
            ${ICONS.close}
          </button>
        </div>

        <div style="padding:14px; background:var(--bg-well); border:1px solid var(--line-subtle); border-radius:14px; display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <svg width="36" height="36" viewBox="0 0 38 38" style="flex-shrink:0;" aria-hidden="true">
                <defs>
                  <linearGradient id="udl-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#00D4FF"/>
                    <stop offset="100%" stop-color="#FFB800"/>
                  </linearGradient>
                </defs>
                <circle cx="19" cy="19" r="16" fill="none" stroke="var(--line-strong)" stroke-width="3.5"/>
                <circle id="udl-gateway-ring-fill" cx="19" cy="19" r="16" fill="none" stroke="url(#udl-ring-grad)" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${ringCircumference}" stroke-dashoffset="${ringCircumference}" transform="rotate(-90 19 19)"/>
              </svg>
              <span style="font-size:0.8125rem; font-weight:600; color:var(--text-secondary);">Syncing video &amp; audio</span>
            </div>
            <span id="udl-gateway-badge" class="tech-badge tech-badge-cyan tabular" style="flex-shrink:0;">5.0s</span>
          </div>

          <div style="font-size:0.9375rem; font-weight:700; color:var(--text-primary); line-height:1.35;">${safeTitle}</div>

          <div class="gateway-steps-row">
            <div id="udl-gw-step-1" class="gateway-step-chip is-active">1. Connect</div>
            <div id="udl-gw-step-2" class="gateway-step-chip">2. Sync</div>
            <div id="udl-gw-step-3" class="gateway-step-chip">3. Ready</div>
          </div>

          <div class="studio-progress-track">
            <div id="udl-gateway-progress" class="studio-progress-fill" style="transform:scaleX(0);"></div>
          </div>
        </div>

        <div id="udl-sponsor-container" class="gateway-sponsor-frame">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <span class="sponsor-eyebrow">Sponsored</span>
            <a href="${CLOUD_MIRROR_URL}" target="_blank" rel="noopener noreferrer" style="font-size:0.8125rem; font-weight:700; color:var(--brand-amber-text); display:inline-flex; align-items:center; gap:5px;">
              <span>Open Sponsored Cloud Mirror</span>
              ${ICONS.external}
            </a>
          </div>
          <p style="font-size:0.8125rem; color:var(--text-secondary); margin:0;">
            Free open-source hosting is funded by transparent partners. Try the Sponsored Cloud Mirror above if your browser transfer feels slow.
          </p>
        </div>

        <div style="margin-top:2px;">
          ${hasDirectStream ? `
            <button
              id="udl-gateway-action-btn"
              disabled
              data-udl-action="exec-download"
              data-url="${safeStream}"
              data-filename="${safeFile}"
              data-quality="${safeQuality}"
              class="btn-secondary"
              style="width:100%; min-height:48px; opacity:0.7; cursor:not-allowed;">
              <span id="udl-btn-spinner" style="display:inline-flex; align-items:center;">${ICONS.timer}</span>
              <span id="udl-btn-text">Preparing download (5s)...</span>
            </button>
          ` : `
            <button
              id="udl-gateway-action-btn"
              disabled
              data-udl-action="local-or-app"
              data-type="${safeType}"
              data-quality="${safeQuality}"
              class="btn-secondary"
              style="width:100%; min-height:48px; opacity:0.7; cursor:not-allowed;">
              <span id="udl-btn-spinner" style="display:inline-flex; align-items:center;">${ICONS.timer}</span>
              <span id="udl-btn-text">Preparing download (5s)...</span>
            </button>
          `}
        </div>

        <div style="border-top:1px solid var(--line-subtle); padding-top:12px; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <span style="font-size:0.8125rem; color:var(--text-secondary);">Need 4K 60fps playlists?</span>
          <a href="/download.html" style="font-size:0.8125rem; font-weight:700; color:var(--brand-cyan-text);">
            Get Free Native App &rarr;
          </a>
        </div>
      </div>
    `;

    const startTime = Date.now();
    const duration = 5000;
    const progressBar = document.getElementById('udl-gateway-progress');
    const ringFill = document.getElementById('udl-gateway-ring-fill');
    const badge = document.getElementById('udl-gateway-badge');
    const actionBtn = document.getElementById('udl-gateway-action-btn');
    const btnSpinner = document.getElementById('udl-btn-spinner');
    const btnText = document.getElementById('udl-btn-text');
    const step1 = document.getElementById('udl-gw-step-1');
    const step2 = document.getElementById('udl-gw-step-2');
    const step3 = document.getElementById('udl-gw-step-3');

    gatewayTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const ratio = Math.min(1, elapsed / duration);
      const remainingSec = Math.max(0, (duration - elapsed) / 1000);

      if (progressBar) progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
      if (ringFill) ringFill.style.strokeDashoffset = String((ringCircumference * (1 - ratio)).toFixed(2));
      if (badge && remainingSec > 0) badge.textContent = `${remainingSec.toFixed(1)}s`;
      if (btnText && remainingSec > 0) {
        btnText.textContent = `Preparing download (${Math.ceil(remainingSec)}s)...`;
      }

      if (elapsed >= 1700 && step1 && step2) {
        step1.className = 'gateway-step-chip is-done';
        step2.className = 'gateway-step-chip is-active';
      }
      if (elapsed >= 3600 && step2 && step3) {
        step2.className = 'gateway-step-chip is-done';
        step3.className = 'gateway-step-chip is-active';
      }

      if (elapsed >= duration) {
        clearInterval(gatewayTimer);
        gatewayTimer = null;

        if (progressBar) {
          progressBar.style.transform = 'scaleX(1)';
          progressBar.classList.add('is-done');
        }
        if (ringFill) ringFill.style.strokeDashoffset = '0';
        if (step1) step1.className = 'gateway-step-chip is-done';
        if (step2) step2.className = 'gateway-step-chip is-done';
        if (step3) step3.className = 'gateway-step-chip is-done';

        if (badge) {
          badge.className = 'tech-badge tech-badge-green';
          badge.textContent = 'Ready';
        }

        if (actionBtn) {
          actionBtn.disabled = false;
          actionBtn.className = 'btn-primary btn-ready';
          actionBtn.style.width = '100%';
          actionBtn.style.opacity = '1';
          actionBtn.style.cursor = 'pointer';
          if (btnSpinner) btnSpinner.classList.add('hidden');
          if (btnText) {
            btnText.style.display = 'inline-flex';
            btnText.style.alignItems = 'center';
            btnText.style.justifyContent = 'center';
            btnText.style.gap = '8px';
            btnText.innerHTML = `${ICONS.download} <span>Save File Now (${safeQuality})</span>`;
          }
        }
      }
    }, 100);
  }

  async function triggerLocalOrApp(type, quality) {
    const targetUrl = currentMedia ? currentMedia.original_url || currentMedia.webpage_url || currentMedia.url || '' : '';
    if (!targetUrl) {
      showToast('Please paste a valid media link.');
      return;
    }
    showToast('Connecting to companion engine...');
    const isConnected = await checkServerConnection();
    if (isConnected && backendUrl) {
      closeDownloadModal();
      try {
        const res = await fetch(`${backendUrl}/api/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: targetUrl,
            type,
            quality,
            title: currentMedia.title || '',
            thumbnail: currentMedia.thumbnail || ''
          })
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data && data.task_id) userInitiatedTasks.add(data.task_id);
          const tasksContainer = document.getElementById('tasks-container');
          if (tasksContainer) {
            tasksContainer.classList.remove('hidden');
            tasksContainer.scrollIntoView({ behavior: 'smooth' });
          }
          startPolling((tasks) => renderTasks(tasks, document.getElementById('tasks-container')));
          return;
        }
      } catch (e) {}
    }
    showToast('Download the free Android APK or Desktop App for full HD merging.');
  }

  function executeDownloadAction(url, filename, quality) {
    if (!url || url.includes('vevioz') || url.includes('piped') || url.includes('cobalt')) {
      showToast('Starting clean transfer via UnimaxDL cloud engine...');
      triggerDownload('video', quality || '720p');
      return;
    }
    showToast(`Saving ${quality} file to your device...`);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'unimaxdl-media';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 150);

    if (typeof UDL_ANALYTICS !== 'undefined' && currentMedia) {
      UDL_ANALYTICS.trackDownload({
        source_site: currentMedia.extractor || 'web',
        media_type: quality && quality.toLowerCase().includes('mp3') ? 'audio' : 'video',
        quality: quality || 'HD',
        video_title: currentMedia.title || 'Untitled',
        video_url: currentMedia.webpage_url || ''
      });
    }
  }

  function closeDownloadModal() {
    if (gatewayTimer) {
      clearInterval(gatewayTimer);
      gatewayTimer = null;
    }
    closeModalEl(document.getElementById('udl-download-helper-modal'));
  }

  function renderMediaCard(info, container) {
    if (!info || !container) return;
    currentMedia = info;
    bindDelegatedActions(container);

    const videoFormats = Array.isArray(info.video_formats) ? info.video_formats : [];
    const audioFormats = Array.isArray(info.audio_formats) ? info.audio_formats : [];
    const is4K = videoFormats.some((f) => f.height >= 2160);
    const isFHD = videoFormats.some((f) => f.height >= 1080);
    const safeTitle = escapeHtml(info.title || 'Media Ready');
    const safeExtractor = escapeHtml(info.extractor || 'Web Video');
    const safeUploader = escapeHtml(info.uploader || 'Creator');
    const safeDuration = escapeHtml(info.duration || '00:00');
    const fallbackPoster = generateVideoPosterSvg(info.title, info.extractor || 'UnimaxDL');

    const safeThumbnail = formatThumbnailUrl(info.thumbnail);
    const mediaPreviewHtml = `<img
        src="${escapeHtml(safeThumbnail || fallbackPoster)}"
        data-orig="${escapeHtml(info.thumbnail || '')}"
        alt=""
        loading="eager"
        referrerpolicy="no-referrer"
        data-fallback="${escapeHtml(fallbackPoster)}"
        onerror="UDL_DOWNLOADER.handleThumbError(this)"
      />`;

    container.innerHTML = `
      <div class="studio-result-card">
        <div class="deck-strip">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="status-dot ready"></span>
            <span style="color:var(--text-primary); font-weight:700;">Ready to Save</span>
          </div>
          <span class="tech-badge tech-badge-cyan">${safeExtractor}</span>
        </div>

        <div class="studio-result-body">
          <div class="studio-media-row">
            <div class="studio-thumb-box">
              ${mediaPreviewHtml}
              <div class="studio-thumb-duration">${safeDuration}</div>
              ${is4K ? '<span class="studio-thumb-badge is-4k">4K Available</span>' : isFHD ? '<span class="studio-thumb-badge">1080p HD</span>' : ''}
            </div>

            <div class="studio-media-meta">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span class="tech-badge tech-badge-green">Sound + Video Merged</span>
                <span class="tech-badge">Zero Watermarks</span>
              </div>
              <h3 class="studio-media-title" title="${safeTitle}">${safeTitle}</h3>
              <div class="studio-meta-line">
                <span style="display:inline-flex; align-items:center; gap:5px; min-width:0;">${ICONS.user} <span>${safeUploader}</span></span>
                <span aria-hidden="true">|</span>
                <span>Clean MP4 &amp; 320k MP3</span>
              </div>
            </div>
          </div>

          <div class="studio-format-toolbar">
            <div class="studio-format-tabs">
              <button onclick="UDL_DOWNLOADER.switchTab('video')" id="tab-btn-video" class="mode-tab active">
                ${ICONS.video}
                <span>Video (MP4)</span>
              </button>
              <button onclick="UDL_DOWNLOADER.switchTab('audio')" id="tab-btn-audio" class="mode-tab">
                ${ICONS.audio}
                <span>Audio (MP3)</span>
              </button>
            </div>
            <span style="font-size:0.8125rem; color:var(--text-secondary);">Choose quality below to save</span>
          </div>

          <div id="format-section-video" class="studio-format-grid">
            ${
              videoFormats.length > 0
                ? videoFormats
                    .map((f) => {
                      const isHQ = isHighQuality(f);
                      const qStr = escapeHtml(f.quality || f.resolution || '720p');
                      const resLabel = escapeHtml(f.resolution || f.quality || 'HD Video');
                      const extLabel = escapeHtml((f.ext || 'mp4').toUpperCase());
                      const fpsSpec = f.fps ? `${escapeHtml(f.fps)}fps` : 'Smooth';
                      const sizeSpec = escapeHtml(f.filesize_label || f.filesize_formatted || 'Clean Save');
                      const tierTag = isHQ ? 'Native App' : f.height >= 1080 ? 'Full HD' : 'Fast Save';
                      return `
                        <button data-udl-action="download" data-type="video" data-quality="${qStr}" class="studio-format-tile ${isHQ ? 'is-master' : ''}">
                          <div style="min-width:0; width:100%;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; gap:6px;">
                              <span style="font-family:var(--font-display); font-weight:700; font-size:0.9375rem; color:var(--text-primary); min-width:0;">${resLabel}</span>
                              <span class="tech-badge ${isHQ ? 'tech-badge-amber' : ''}">${extLabel}</span>
                            </div>
                            <div style="font-size:0.75rem; color:var(--text-secondary);" class="tabular">${fpsSpec} &middot; ${sizeSpec}</div>
                          </div>
                          <div style="width:100%; padding-top:8px; border-top:1px solid var(--line-subtle); display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:0.8125rem; font-weight:700; color:${isHQ ? 'var(--brand-amber-text)' : 'var(--brand-cyan-text)'};">
                            <span style="display:inline-flex; align-items:center; gap:5px;">${ICONS.download} <span>${isHQ ? 'Get 4K App' : 'Download'}</span></span>
                            <span style="font-size:0.75rem; color:var(--text-muted);">${tierTag}</span>
                          </div>
                        </button>
                      `;
                    })
                    .join('')
                : `<div style="grid-column:1 / -1; padding:12px; font-size:0.875rem; color:var(--text-muted);">No video formats exposed here. Switch to Audio (MP3) above.</div>`
            }
          </div>

          <div id="format-section-audio" class="studio-format-grid cols-3 hidden">
            ${
              audioFormats.length > 0
                ? audioFormats
                    .map((f) => {
                      const qStr = escapeHtml(f.quality || f.id || 'mp3-320');
                      const labelStr = escapeHtml(f.label || 'Audio File');
                      const extStr = escapeHtml((f.ext || 'mp3').toUpperCase());
                      const bitrateStr = escapeHtml(f.bitrate || '320kbps');
                      return `
                        <button data-udl-action="download" data-type="audio" data-quality="${qStr}" class="studio-format-tile">
                          <div style="min-width:0; width:100%;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; gap:6px;">
                              <span style="font-family:var(--font-display); font-weight:700; font-size:0.9375rem; color:var(--text-primary); min-width:0;">${labelStr}</span>
                              <span class="tech-badge tech-badge-cyan">${extStr}</span>
                            </div>
                            <div style="font-size:0.75rem; color:var(--text-secondary);" class="tabular">${bitrateStr} Clean Audio</div>
                          </div>
                          <div style="width:100%; padding-top:8px; border-top:1px solid var(--line-subtle); display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:0.8125rem; font-weight:700; color:var(--brand-cyan-text);">
                            <span style="display:inline-flex; align-items:center; gap:5px;">${ICONS.audio} <span>Save ${extStr}</span></span>
                            <span style="font-size:0.75rem; color:var(--text-muted);">Hi-Fi</span>
                          </div>
                        </button>
                      `;
                    })
                    .join('')
                : `<div style="grid-column:1 / -1; padding:12px; font-size:0.875rem; color:var(--text-muted);">No direct audio tracks exposed for this link.</div>`
            }
          </div>

          <div class="studio-companion-bar">
            <div>
              <div style="font-size:0.875rem; font-weight:700; color:var(--text-primary);">Want 4K 60fps &amp; full playlists?</div>
              <p style="font-size:0.8125rem; color:var(--text-secondary); margin:2px 0 0;">Save unlimited high-bitrate clips natively with Android APK v2.1.0 or Desktop v1.0.0.</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <a href="${CLOUD_MIRROR_URL}" target="_blank" rel="noopener noreferrer" class="pill-btn" style="border-color:var(--border-amber-tint); color:var(--brand-amber-text);">
                Sponsored Cloud Mirror
              </a>
              <a href="/download.html" class="btn-secondary">
                Get Free Apps &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function switchTab(tab) {
    const videoSection = document.getElementById('format-section-video');
    const audioSection = document.getElementById('format-section-audio');
    const videoBtn = document.getElementById('tab-btn-video');
    const audioBtn = document.getElementById('tab-btn-audio');

    if (tab === 'video') {
      if (videoSection) videoSection.classList.remove('hidden');
      if (audioSection) audioSection.classList.add('hidden');
      if (videoBtn) videoBtn.classList.add('active');
      if (audioBtn) audioBtn.classList.remove('active');
    } else {
      if (videoSection) videoSection.classList.add('hidden');
      if (audioSection) audioSection.classList.remove('hidden');
      if (audioBtn) audioBtn.classList.add('active');
      if (videoBtn) videoBtn.classList.remove('active');
    }
  }

  let emptyPollCount = 0;

  async function pollTasks() {
    if (!backendUrl) return [];
    if (backendUrl.includes('onrender.com') && userInitiatedTasks.size === 0) return [];

    try {
      const controller = new AbortController();
      const timeoutMs = backendUrl.includes('onrender.com') ? 4000 : 1500;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${backendUrl}/api/tasks`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return [];
      const data = await res.json();
      const tasks = data.tasks || [];
      if (tasks.length === 0) {
        emptyPollCount++;
        if (emptyPollCount >= 10) stopPolling();
      } else {
        emptyPollCount = 0;
      }
      return tasks;
    } catch {
      return [];
    }
  }

  function startPolling(callback) {
    stopPolling();
    if (!backendUrl) return;

    emptyPollCount = 0;
    pollTasks().then((tasks) => {
      if (callback && tasks.length > 0) callback(tasks);
    });

    pollInterval = setInterval(async () => {
      const tasks = await pollTasks();
      if (callback && tasks.length > 0) callback(tasks);
    }, 1500);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  function renderTasks(tasks, container) {
    if (!container || !tasks || tasks.length === 0) return;

    const isCloud = backendUrl && backendUrl.includes('onrender.com');
    const visibleTasks = isCloud ? tasks.filter((t) => userInitiatedTasks.has(t.id)) : tasks;

    if (visibleTasks.length === 0) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px; margin-top:20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.8125rem;">
          <span style="font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:7px;">
            <span class="status-dot ready"></span>
            <span>Active Downloads</span>
          </span>
          <span class="tabular" style="color:var(--text-muted);">${visibleTasks.length} item${visibleTasks.length > 1 ? 's' : ''}</span>
        </div>
        ${visibleTasks
          .map((t) => {
            const isDone = t.status === 'completed';
            const isError = t.status === 'error';
            const isQueued = t.status === 'queued';
            const downloadUrl = `${backendUrl}/api/download-file/${encodeURIComponent(t.id || '')}`;

            if (isDone && userInitiatedTasks.has(t.id) && !autoDownloadedTasks.has(t.id)) {
              autoDownloadedTasks.add(t.id);
              try {
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = t.filename || 'download.mp4';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => a.remove(), 300);
                showToast(`Saved ${t.filename || 'your file'} cleanly!`);
              } catch (e) {}
            }

            let statusBadgeClass = 'tech-badge-cyan';
            let statusText = escapeHtml(t.status || 'Preparing');
            if (isDone) {
              statusBadgeClass = 'tech-badge-green';
              statusText = 'Ready';
            } else if (isError) {
              statusBadgeClass = 'tech-badge-amber';
              statusText = 'Needs App';
            } else if (isQueued) {
              statusBadgeClass = 'tech-badge-amber';
              statusText = `Queued (#${Number(t.queue_position) || 1})`;
            } else {
              statusText = 'Saving...';
            }

            const pctNum = Math.max(0, Math.min(100, Number(t.progress ?? t.percent ?? 0) || 0));
            const safeTaskTitle = escapeHtml(t.title || 'Media Download');

            return `
              <div class="deck-panel" style="padding:14px 16px; display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; min-width:0;">
                  <span title="${safeTaskTitle}" style="font-family:var(--font-display); font-weight:700; font-size:0.9375rem; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0;">${safeTaskTitle}</span>
                  <span class="tech-badge ${statusBadgeClass}">${statusText}</span>
                </div>

                <div class="studio-progress-track">
                  <div class="studio-progress-fill ${isDone ? 'is-done' : ''}" style="transform:scaleX(${(pctNum / 100).toFixed(4)});"></div>
                </div>

                <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.75rem; color:var(--text-muted);" class="tabular">
                  <span>${escapeHtml(t.downloaded || '0 MB')} / ${escapeHtml(t.total || '0 MB')}</span>
                  <span style="color:var(--text-primary); font-weight:700;">${pctNum}% ${t.speed ? '&middot; ' + escapeHtml(t.speed) : ''}</span>
                </div>

                ${
                  isDone
                    ? `<a href="${escapeHtml(downloadUrl)}" download class="btn-primary btn-ready" style="width:100%;">
                        ${ICONS.download}
                        <span>Save File Now</span>
                      </a>`
                    : ''
                }

                ${
                  isError
                    ? `<div style="border-top:1px solid var(--line-subtle); padding-top:10px; display:flex; flex-direction:column; gap:8px;">
                        <p style="font-size:0.8125rem; color:var(--brand-amber-text); margin:0;">
                          Browser transfer blocked for this clip. Use the free Android APK or Desktop app instead:
                        </p>
                        <a href="/download.html" class="btn-primary btn-amber" style="width:100%;">
                          ${ICONS.download}
                          <span>Get Free Native App</span>
                        </a>
                      </div>`
                    : ''
                }
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    checkServerConnection();
  });

  return {
    getBackendUrl,
    setBackendUrl,
    hasBackendUrl,
    checkServerConnection,
    showSettingsModal,
    closeSettingsModal,
    showDownloadModal: showMonetizedDownloadGateway,
    showMonetizedDownloadGateway,
    closeDownloadModal,
    executeDownloadAction,
    triggerLocalOrApp,
    testConnection,
    saveModalSettings,
    analyzeUrl,
    triggerDownload,
    renderMediaCard,
    generateVideoPosterSvg,
    formatThumbnailUrl,
    handleThumbError,
    fetchLiveMetadata,
    renderTasks,
    startPolling,
    stopPolling,
    switchTab,
    showToast,
    show4KPromptModal,
    close4KModal,
    fallbackTo1080p,
    copyDeepLink,
    ICONS
  };
})();

if (typeof window !== 'undefined') {
  window.UDL_DOWNLOADER = UDL_DOWNLOADER;

  window.addEventListener('focus', () => {
    UDL_DOWNLOADER.checkServerConnection();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input[type="url"], input[type="text"]');
    inputs.forEach((input) => {
      input.addEventListener('focus', () => UDL_DOWNLOADER.checkServerConnection(), { once: true });
      input.addEventListener('input', () => UDL_DOWNLOADER.checkServerConnection(), { once: true });
    });
  });
}
