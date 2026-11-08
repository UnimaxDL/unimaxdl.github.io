/**
 * UnimaxDL Downloader Engine v2.0.0
 * Features:
 * - 100% Smart Client-Side Architecture (Zero Server Cost & Zero YouTube Bot-Checks)
 * - On-Site 5-Second Monetization Gateway with High-Viewability Sponsor Container
 * - Plug-and-Play Adsterra / Monetag / PropellerAds Ad Insertion Slots
 * - Multi-Platform Direct Resolvers: YouTube, Instagram, TikTok, Twitter/X, Vimeo
 * - Optional Local PC Companion (for 4K UHD local ffmpeg operations)
 * - Pure SVG Vector System (Strictly Zero Emojis)
 */

const UDL_DOWNLOADER = (() => {
  const STORAGE_KEY = 'udl_backend_url';

  // Production backend identifier (Render cloud companion)
  const PRODUCTION_API = 'https://unimaxdl-server.onrender.com';
  let defaultBackend = PRODUCTION_API;
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      defaultBackend = window.location.origin;
    }
  }

  let backendUrl = localStorage.getItem(STORAGE_KEY) || defaultBackend;
  let currentMedia = null;
  let pollInterval = null;
  let isAnalyzing = false;
  let isServerConnected = false;
  let gatewayTimer = null;
  const autoDownloadedTasks = new Set();
  const userInitiatedTasks = new Set();

  // Pure SVG Vector Icon Registry (Strictly Zero Emojis)
  const ICONS = {
    settings: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    download: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`,
    video: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
    audio: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>`,
    desktop: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
    mobile: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`,
    web: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m3.84 6.16A8.995 8.995 0 013 12m3.84-6.16A8.995 8.995 0 013 12m14.32 0a8.995 8.995 0 01-3.84 6.16m3.84-6.16A8.995 8.995 0 0017.16 5.84M12 3a9 9 0 00-3.84 15.16M12 3a9 9 0 013.84 15.16"/></svg>`,
    sparkle: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
    close: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
    user: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
    arrowRight: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`,
    shield: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
    timer: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    check: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`,
    external: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>`
  };

  function getBackendUrl() {
    return backendUrl;
  }

  function setBackendUrl(url) {
    backendUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEY, backendUrl);
    checkServerConnection();
  }

  function hasBackendUrl() {
    return !!backendUrl;
  }

  // Ping Diagnostic (Auto-detects running local PC companion on port 8000 or Render cloud backend)
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
      const label = isCloud ? 'Render Cloud: Connected' : 'Local PC: Connected';
      el.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold cursor-pointer hover:bg-emerald-500/20 transition';
      el.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> <span>${label}</span>`;
      el.title = `Connected to ${targetUrl}. Tap to view or configure backend`;
      el.onclick = showSettingsModal;
    } else {
      el.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold cursor-pointer hover:bg-cyan-500/20 transition';
      el.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400"></span> <span>Smart Web Mode (Zero Bills)</span>';
      el.title = "Running 100% in browser. Tap to connect local PC or Render backend";
      el.onclick = showSettingsModal;
    }
  }

  // Settings Modal
  function showSettingsModal() {
    let modal = document.getElementById('udl-settings-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'udl-settings-modal';
      modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md" onclick="UDL_DOWNLOADER.closeSettingsModal()"></div>
      <div class="relative w-full max-w-lg bg-[#121218] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        <div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              ${ICONS.settings}
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Local PC Companion</h3>
              <p class="text-xs text-gray-400">Connect your local computer for unlimited 4K 60fps downloads</p>
            </div>
          </div>
          <button onclick="UDL_DOWNLOADER.closeSettingsModal()" class="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">
            ${ICONS.close}
          </button>
        </div>

        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-300">Local Server Address</label>
            <div class="flex gap-2">
              <input 
                type="text" 
                id="udl-modal-url-input" 
                value="${backendUrl || 'http://127.0.0.1:8000'}" 
                placeholder="http://127.0.0.1:8000" 
                class="flex-1 bg-[#09090d] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:border-amber-500 focus:outline-none"
              />
              <button 
                onclick="UDL_DOWNLOADER.testConnection()" 
                id="udl-ping-btn" 
                class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition">
                Test Ping
              </button>
            </div>
            <p class="text-[11px] text-gray-500">
              Run <code class="text-amber-400">Start_UnimaxDL.bat</code> or <code class="text-amber-400">python start.py</code> in your companion folder to start your local PC backend.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 text-xs text-gray-300 space-y-2">
            <span class="font-bold text-cyan-400 block">Why run the Local PC Companion?</span>
            <ul class="space-y-1 text-gray-400 list-disc list-inside">
              <li>Lossless 4K UHD 60fps merging with local ffmpeg</li>
              <li>Lossless MP3 320kbps audio encoding</li>
              <li>Bypasses all browser CORS and file size limits</li>
            </ul>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button onclick="UDL_DOWNLOADER.closeSettingsModal()" class="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition">Cancel</button>
          <button onclick="UDL_DOWNLOADER.saveModalSettings()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-black text-xs shadow-lg transition">Save Settings</button>
        </div>

      </div>
    `;
  }

  function closeSettingsModal() {
    const modal = document.getElementById('udl-settings-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function testConnection() {
    const btn = document.getElementById('udl-ping-btn');
    const input = document.getElementById('udl-modal-url-input');
    if (!btn || !input) return;

    btn.innerText = "Pinging...";
    btn.className = "px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold transition";

    const target = input.value.trim().replace(/\/+$/, '');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${target}/api/ping`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        btn.innerText = "Connected";
        btn.className = "px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold";
      } else {
        throw new Error();
      }
    } catch {
      btn.innerText = "Unreachable";
      btn.className = "px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold";
    }

    setTimeout(() => {
      btn.innerText = "Test Ping";
      btn.className = "px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition";
    }, 2500);
  }

  function saveModalSettings() {
    const input = document.getElementById('udl-modal-url-input');
    if (input) {
      setBackendUrl(input.value);
    }
    closeSettingsModal();
    showToast("Connection settings saved");
  }

  // Toast Notification
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = "fixed bottom-6 right-6 z-[10000] px-4 py-3 rounded-2xl bg-[#14141d]/95 border border-cyan-500/30 text-xs font-bold text-cyan-300 shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200";
    toast.innerHTML = `<span class="text-cyan-400">${ICONS.sparkle}</span> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'duration-200');
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }

  // Format and proxy CDN thumbnails to bypass hotlink and referrer blocking
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

  // Graceful multi-tier image error handler
  function handleThumbError(imgEl) {
    if (!imgEl) return;
    const currentSrc = imgEl.src || '';
    const originalSrc = imgEl.dataset.orig || '';

    // Tier 1: Attempt wsrv.nl proxy if not tried yet
    if (!currentSrc.includes('wsrv.nl') && originalSrc && !originalSrc.startsWith('data:image')) {
      imgEl.src = `https://wsrv.nl/?url=${encodeURIComponent(originalSrc)}&output=webp&q=85`;
      return;
    }

    // Tier 2: Fall back to dynamic SVG video poster
    if (imgEl.dataset.fallback) {
      imgEl.onerror = null;
      imgEl.src = imgEl.dataset.fallback;
    }
  }

  // Generate dynamic branded video poster SVG for media cards
  function generateVideoPosterSvg(title, host) {
    const safeTitle = (title || 'Universal Video Stream')
      .replace(/[<>&"']/g, '')
      .trim();
    const safeHost = (host || 'Public Media Stream')
      .toUpperCase()
      .replace(/[<>&"']/g, '')
      .trim();
    const displayTitle = safeTitle.length > 40 ? safeTitle.substring(0, 37) + '...' : safeTitle;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="udl-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0b0f19" />
          <stop offset="50%" stop-color="#111827" />
          <stop offset="100%" stop-color="#030712" />
        </linearGradient>
        <linearGradient id="udl-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#06b6d4" />
          <stop offset="100%" stop-color="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#udl-bg)" />
      <circle cx="320" cy="145" r="46" fill="#ffffff" fill-opacity="0.05" />
      <circle cx="320" cy="145" r="34" fill="url(#udl-glow)" />
      <polygon points="314,133 333,145 314,157" fill="#030712" />
      <rect x="24" y="24" rx="6" ry="6" width="130" height="24" fill="#ffffff" fill-opacity="0.08" />
      <text x="89" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="800" fill="#38bdf8" text-anchor="middle" letter-spacing="1">${safeHost}</text>
      <text x="320" y="235" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#f8fafc" text-anchor="middle">${displayTitle}</text>
      <text x="320" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">High Definition Public Media Stream</text>
    </svg>`;

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // Multi-provider live metadata extractor
  async function fetchLiveMetadata(targetUrl) {
    const fetchers = [
      // Provider A: Microlink
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
                image: (json.data.image && json.data.image.url) ? json.data.image.url : null
              };
            }
          }
        } catch (e) {}
        return null;
      },
      // Provider B: OpenGraph.to
      async () => {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 2800);
        try {
          const res = await fetch(`https://www.opengraph.to/api/v1/og?url=${encodeURIComponent(targetUrl)}`, { signal: c.signal });
          clearTimeout(t);
          if (res.ok) {
            const json = await res.json();
            if (json) {
              const imgUrl = (json.image && typeof json.image === 'object') ? json.image.url : (typeof json.image === 'string' ? json.image : null);
              return {
                title: json.title || null,
                author: json.site_name || null,
                image: imgUrl
              };
            }
          }
        } catch (e) {}
        return null;
      },
      // Provider C: NoEmbed
      async () => {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 2200);
        try {
          const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(targetUrl)}`, { signal: c.signal });
          clearTimeout(t);
          if (res.ok) {
            const json = await res.json();
            if (json) {
              return {
                title: json.title || null,
                author: json.author_name || null,
                image: json.thumbnail_url || null
              };
            }
          }
        } catch (e) {}
        return null;
      }
    ];

    try {
      const results = await Promise.allSettled(fetchers.map(f => f()));
      let best = { title: null, author: null, image: null };
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

  // Smart Multi-Platform Video Analyzer
  async function analyzeUrl(url) {
    if (!url) throw new Error("Please enter a valid video link");
    if (isAnalyzing) return null;
    isAnalyzing = true;

    try {
      // If user has local companion or Render cloud backend connected, route through server yt-dlp
      const hasBackend = isServerConnected && backendUrl;
      if (hasBackend) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);
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
            if (media.thumbnail) {
              media.thumbnail = formatThumbnailUrl(media.thumbnail);
            }
            if (media.formats && !media.video_formats) {
              media.video_formats = media.formats;
            }
            if (!media.extractor && media.source) {
              media.extractor = media.source;
            }
            if (!media.uploader && media.source) {
              media.uploader = `${media.source} Creator`;
            }
            if (!media.duration && media.duration_label) {
              media.duration = media.duration_label;
            }
            media.url = media.url || media.original_url || url;
            media.webpage_url = media.webpage_url || media.original_url || url;
            media.original_url = media.original_url || url;
            currentMedia = media;
            return media;
          }
        } catch (e) {
          console.warn("Local server not responding, resolving via client engine:", e);
        }
      }

      // Fast standalone client resolver (YouTube, TikTok, Instagram, Twitter/X, Universal, etc.)
      const clientMedia = await resolveClientMedia(url);
      currentMedia = clientMedia;
      return clientMedia;

    } finally {
      isAnalyzing = false;
    }
  }

  // Client-Side Media Resolver (Zero Server Cost)
  async function resolveClientMedia(url) {
    const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(url);
    const isTikTok = /tiktok\.com/i.test(url);
    const isInstagram = /instagram\.com/i.test(url);
    const isTwitter = /(?:twitter\.com|x\.com)/i.test(url);
    const isFacebook = /(?:facebook\.com|fb\.watch)/i.test(url);

    let ytId = null;
    if (isYouTube) {
      const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*)/);
      ytId = (match && match[1].length === 11) ? match[1] : null;
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

    // Default smart titles, creators, and dynamic SVG video posters
    const isReel = url.toLowerCase().includes('/reel/');
    let title = "";
    let uploader = "";
    let thumbnail = "";
    let duration = "03:45";
    let directDownloadUrl = '';

    if (isYouTube) {
      title = ytId ? `YouTube Video #${ytId}` : "YouTube Video";
      uploader = "YouTube Creator";
      thumbnail = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : generateVideoPosterSvg(title, 'YouTube');
    } else if (isInstagram) {
      uploader = igUser ? `@${igUser}` : "Instagram Creator";
      title = igUser ? `@${igUser} • Instagram ${isReel ? 'Reel' : 'Post'}` : (igCode ? `Instagram ${isReel ? 'Reel' : 'Post'} (${igCode})` : "Instagram Media");
      thumbnail = generateVideoPosterSvg(title, 'Instagram');
    } else if (isTikTok) {
      title = "TikTok Video";
      uploader = "TikTok Creator";
      thumbnail = generateVideoPosterSvg(title, 'TikTok');
    } else if (isTwitter) {
      uploader = twUser ? `@${twUser}` : "X / Twitter Creator";
      title = twUser ? `@${twUser} on X` : (twId ? `Post #${twId} on X` : "Twitter / X Video");
      thumbnail = generateVideoPosterSvg(title, 'Twitter / X');
    } else if (isFacebook) {
      title = "Facebook Video";
      uploader = "Facebook Creator";
      thumbnail = generateVideoPosterSvg(title, 'Facebook');
    } else {
      let host = 'Online';
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
            cleanSlug = cleanSlug.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          }
        }
      } catch (e) {}

      title = cleanSlug || `${host} Video Stream`;
      uploader = `${host} Source`;
      thumbnail = generateVideoPosterSvg(title, host);
    }

    // 1. Fast oEmbed / NoEmbed lookup for YouTube
    if (isYouTube) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const r = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (r.ok) {
          const d = await r.json();
          if (d.title) title = d.title;
          if (d.author_name) uploader = d.author_name;
          if (d.thumbnail_url) thumbnail = d.thumbnail_url;
        }
      } catch (e) {}

      if (ytId) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const yRes = await fetch(`https://yt.chocolatemoo53.com/api/v1/videos/${ytId}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (yRes.ok) {
            const yData = await yRes.json();
            if (yData.title && (!title || title.startsWith("YouTube Video"))) title = yData.title;
            if (yData.author && (!uploader || uploader === "YouTube Creator")) uploader = yData.author;
            if (yData.lengthSeconds) duration = formatDuration(yData.lengthSeconds);
            const formatStreams = yData.formatStreams || [];
            if (formatStreams.length > 0 && formatStreams[0].url) {
              directDownloadUrl = formatStreams[0].url;
            }
          }
        } catch (e) {}
      }
    }

    // 2. TikTok metadata & stream resolution via TikWM
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

    // 3. Live multi-provider metadata extraction (Instagram, Twitter, Adult, Universal)
    if (!isYouTube && !isTikTok) {
      const liveMeta = await fetchLiveMetadata(url);
      if (liveMeta) {
        if (liveMeta.title && !['Instagram', 'xHamster', 'X', 'Twitter', 'Facebook'].includes(liveMeta.title)) {
          title = liveMeta.title;
        }
        if (liveMeta.author) uploader = liveMeta.author;
        if (liveMeta.image) thumbnail = liveMeta.image;
      }
    }

    const extractor = isYouTube ? 'YouTube' : isTikTok ? 'TikTok' : isInstagram ? 'Instagram' : isTwitter ? 'Twitter/X' : 'Universal';

    const video_formats = [
      { resolution: "4K UHD", height: 2160, ext: "mp4", filesize_formatted: "Adaptive 60fps", fps: 60, quality: "2160p" },
      { resolution: "1080p FHD", height: 1080, ext: "mp4", filesize_formatted: "High Definition", fps: 60, quality: "1080p" },
      { resolution: "720p HD", height: 720, ext: "mp4", filesize_formatted: "Standard Fast", fps: 30, quality: "720p" },
      { resolution: "480p SD", height: 480, ext: "mp4", filesize_formatted: "Data Saver", fps: 30, quality: "480p" }
    ];

    const audio_formats = [
      { id: "mp3-320", label: "MP3 Studio Quality", bitrate: "320kbps", ext: "mp3", quality: "mp3-320" },
      { id: "mp3-192", label: "MP3 High Quality", bitrate: "192kbps", ext: "mp3", quality: "mp3-192" },
      { id: "m4a", label: "M4A Original Audio", bitrate: "Lossless", ext: "m4a", quality: "m4a" }
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

  function show4KPromptModal(type, quality) {
    let modal = document.getElementById('udl-4k-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'udl-4k-modal';
      modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    const targetUrl = currentMedia ? (currentMedia.original_url || currentMedia.webpage_url || currentMedia.url || '') : '';
    const deepLink = 'unimaxdl://download?url=' + encodeURIComponent(targetUrl);

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/85 backdrop-blur-md" onclick="UDL_DOWNLOADER.close4KModal()"></div>
      <div class="relative w-full max-w-lg bg-[#121218] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
              4K
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">Native App Required</span>
                <span class="text-[11px] text-gray-400 font-mono">${quality}</span>
              </div>
              <h3 class="text-base sm:text-lg font-bold text-white mt-0.5">Unlock 4K Ultra HD & 60FPS</h3>
            </div>
          </div>
          <button onclick="UDL_DOWNLOADER.close4KModal()" class="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">
            ${ICONS.close}
          </button>
        </div>

        <!-- Description -->
        <div class="space-y-3 text-xs">
          <p class="text-gray-300 leading-relaxed">
            High-bitrate <strong>2K, 4K & 8K 60FPS HDR</strong> streams require client-side FFmpeg GPU muxing. To protect browser tabs from memory limits and cloud proxy rate limits, ultra-high-definition downloads run directly on your hardware via the free UnimaxDL Native App.
          </p>

          <!-- Why our app value props -->
          <div class="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px]">
            <div class="flex items-start gap-2">
              <span class="text-amber-400 mt-0.5">${ICONS.sparkle}</span>
              <div>
                <span class="font-bold text-white block">Unlimited 4K & 8K</span>
                <span class="text-gray-400 text-[10px]">60FPS, HDR, and uncompressed streams</span>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-emerald-400 mt-0.5">${ICONS.sparkle}</span>
              <div>
                <span class="font-bold text-white block">Direct CDN Speed</span>
                <span class="text-gray-400 text-[10px]">Zero server queue or waiting times</span>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-cyan-400 mt-0.5">${ICONS.desktop}</span>
              <div>
                <span class="font-bold text-white block">Hardware Accelerated</span>
                <span class="text-gray-400 text-[10px]">Local GPU FFmpeg stream merging</span>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-purple-400 mt-0.5">${ICONS.mobile}</span>
              <div>
                <span class="font-bold text-white block">100% Private</span>
                <span class="text-gray-400 text-[10px]">Runs locally on your phone or PC</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-2 pt-1">
          <!-- 1-Click Launch Deep Link -->
          <a href="${deepLink}" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-dark-950 font-black text-xs sm:text-sm text-center transition flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 ring-2 ring-amber-400/40">
            <svg class="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span>Open in UnimaxDL Native App</span>
          </a>

          <!-- App Install Row -->
          <div class="grid grid-cols-2 gap-2">
            <a href="/download.html" class="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 text-center transition flex items-center justify-center gap-1.5">
              ${ICONS.mobile}
              <span>Android APK</span>
            </a>
            <a href="/download.html" class="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 text-center transition flex items-center justify-center gap-1.5">
              ${ICONS.desktop}
              <span>Windows App</span>
            </a>
          </div>

          <!-- Deep Link Copy & Browser Fallback -->
          <div class="flex items-center gap-2 pt-1">
            <button onclick="UDL_DOWNLOADER.copyDeepLink('${deepLink}')" class="flex-1 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-[11px] font-bold text-gray-300 transition text-center flex items-center justify-center gap-1">
              <svg class="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              <span>Copy App Link</span>
            </button>
            <button onclick="UDL_DOWNLOADER.fallbackTo1080p()" class="flex-1 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-[11px] font-bold text-cyan-400 transition text-center">
              Download 1080p in Browser
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function copyDeepLink(link) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        showToast("Deep link copied! Paste into UnimaxDL App.");
      }).catch(() => {
        showToast(`App Link: ${link}`);
      });
    } else {
      showToast(`App Link: ${link}`);
    }
  }

  function close4KModal() {
    const modal = document.getElementById('udl-4k-modal');
    if (modal) modal.classList.add('hidden');
  }

  function fallbackTo1080p() {
    close4KModal();
    triggerDownload('video', '1080p');
  }

  // Trigger Download Action (Routes to On-Site Monetized Gateway)
  async function triggerDownload(type, quality) {
    if (!currentMedia) return;

    // Intercept 2K / 4K / 8K requests on web browser and prompt native APK
    if (type === 'video' && isHighQuality(quality) && !isNativeApp()) {
      show4KPromptModal(type, quality);
      return;
    }

    const targetUrl = currentMedia.original_url || currentMedia.webpage_url || currentMedia.url || '';
    if (!targetUrl) {
      showToast("Please enter a valid video link");
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

    // Route to server engine (Render cloud or local companion)
    const targetBackend = backendUrl || PRODUCTION_API;
    if (targetBackend) {
      showToast(`Starting ${quality} download via UnimaxDL engine...`);
      try {
        const controller = new AbortController();
        const timeoutMs = targetBackend.includes('onrender.com') ? 12000 : 4000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(`${targetBackend}/api/download`, {
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
          if (data && data.task_id) {
            userInitiatedTasks.add(data.task_id);
          }
          backendUrl = targetBackend;
          isServerConnected = true;
          updateStatusBadge(true, targetBackend);
          showToast("Download initialized on server! Tracking progress...");
          const tasksContainer = document.getElementById('tasks-container');
          if (tasksContainer) {
            tasksContainer.classList.remove('hidden');
            tasksContainer.scrollIntoView({ behavior: 'smooth' });
          }
          startPolling((tasks) => {
            renderTasks(tasks, document.getElementById('tasks-container'));
          });
          return;
        }
      } catch (e) {
        console.warn("Server backend download creation failed, falling back to direct stream modal:", e);
      }
    }

    // Fallback if cloud server is completely offline: On-Site 5-Second Gateway
    showMonetizedDownloadGateway(type, quality);
  }

  // On-Site 5-Second Monetization Download Gateway
  function showMonetizedDownloadGateway(type, quality) {
    if (gatewayTimer) {
      clearInterval(gatewayTimer);
      gatewayTimer = null;
    }

    let modal = document.getElementById('udl-download-helper-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'udl-download-helper-modal';
      modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    const title = currentMedia ? currentMedia.title : "Online Media";
    const mediaUrl = currentMedia ? (currentMedia.webpage_url || currentMedia.url || '') : '';
    const isAudio = type === 'audio';

    // Platform Stream Resolvers
    const ytMatch = mediaUrl.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*)/);
    const ytId = (ytMatch && ytMatch[1].length === 11) ? ytMatch[1] : null;
    const igMatch = mediaUrl.match(/(?:instagram\.com\/(?:p|reel|tv)\/)([\w-]+)/);
    const igCode = igMatch ? igMatch[1] : null;

    let directStreamUrl = '';
    let downloadFileName = (title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().substring(0, 36) || 'unimaxdl-media') + (isAudio ? '.mp3' : '.mp4');

    if (currentMedia && currentMedia.direct_download_url) {
      directStreamUrl = currentMedia.direct_download_url;
    } else if (ytId && isAudio) {
      // Direct high-speed M4A/MP3 audio stream via public mirror
      directStreamUrl = `https://yt.chocolatemoo53.com/latest_version?id=${ytId}&itag=140`;
    }

    const hasDirectStream = Boolean(directStreamUrl);

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/85 backdrop-blur-md" onclick="UDL_DOWNLOADER.closeDownloadModal()"></div>
      <div class="relative w-full max-w-lg bg-[#0e0e16] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
              ${isAudio ? ICONS.audio : ICONS.video}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">${quality}</span>
                <span class="text-xs text-gray-400 font-mono">${isAudio ? 'Audio Stream' : 'Video Stream'}</span>
              </div>
              <h3 class="text-sm font-bold text-white truncate max-w-xs sm:max-w-sm mt-0.5">${title}</h3>
            </div>
          </div>
          <button onclick="UDL_DOWNLOADER.closeDownloadModal()" class="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition flex-shrink-0">
            ${ICONS.close}
          </button>
        </div>

        <!-- 5-Second Countdown Status Bar -->
        <div class="p-4 rounded-2xl bg-[#09090e] border border-white/5 space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-300 font-bold flex items-center gap-1.5">
              <span class="text-cyan-400">${ICONS.timer}</span>
              <span>Preparing High-Speed Stream</span>
            </span>
            <span id="udl-gateway-badge" class="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
              Unlocking in 5s...
            </span>
          </div>
          <!-- Progress bar -->
          <div class="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div id="udl-gateway-progress" class="h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-emerald-400 transition-all duration-100" style="width: 0%"></div>
          </div>
        </div>

        <!-- Stream Status Slot (Zero Third-Party Lag) -->
        <div id="udl-sponsor-container" class="rounded-2xl p-4 bg-[#09090e] border ${hasDirectStream ? 'border-white/5' : 'border-cyan-500/20'} space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-300 font-bold flex items-center gap-1.5">
              <span class="text-cyan-400">${ICONS.sparkle}</span>
              <span>${hasDirectStream ? 'Direct High-Speed Stream Ready' : 'HD & 4K 60FPS Stream Ready'}</span>
            </span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded ${hasDirectStream ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'} font-bold">
              ${hasDirectStream ? '100% Free' : 'UnimaxDL Native'}
            </span>
          </div>
          <p class="text-[11px] text-gray-400 leading-relaxed">
            ${hasDirectStream 
              ? 'Your stream has been allocated. No registration or third-party players required. Direct save to device below.' 
              : 'High-definition video (1080p / 4K) requires local FFmpeg stream merging. Download natively with zero rate limits via the free UnimaxDL App or 1-Click Local Engine.'}
          </p>
        </div>

        <!-- Download Action Button (Unlocks after 5 Seconds) -->
        <div class="space-y-2">
          ${hasDirectStream ? `
            <button 
              id="udl-gateway-action-btn"
              disabled
              onclick="UDL_DOWNLOADER.executeDownloadAction('${directStreamUrl}', '${downloadFileName}', '${quality}')"
              class="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed transition-all duration-300">
              <span id="udl-btn-spinner" class="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></span>
              <span id="udl-btn-text">Allocating Direct Download (5s)...</span>
            </button>
          ` : `
            <button 
              id="udl-gateway-action-btn"
              disabled
              onclick="UDL_DOWNLOADER.triggerLocalOrApp('${type}', '${quality}')"
              class="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed transition-all duration-300">
              <span id="udl-btn-spinner" class="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></span>
              <span id="udl-btn-text">Preparing UnimaxDL App Download (5s)...</span>
            </button>
          `}
        </div>

        <!-- Format Quick-Switch / Direct Options -->
        <div class="pt-3 border-t border-white/[0.06] space-y-2">
          <div class="flex items-center justify-between text-[11px] text-gray-400">
            <span>Instant Options:</span>
            <span class="text-[10px] text-gray-500">100% Free &bull; Zero Redirects</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            ${hasDirectStream ? `
              <button onclick="UDL_DOWNLOADER.executeDownloadAction('${directStreamUrl}', '${downloadFileName}', '${quality}')" class="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white text-[11px] font-bold text-center transition flex items-center justify-center gap-1.5 cursor-pointer">
                ${ICONS.download}
                <span>Direct Stream</span>
              </button>
            ` : ytId ? `
              <button onclick="UDL_DOWNLOADER.executeDownloadAction('https://yt.chocolatemoo53.com/latest_version?id=${ytId}&itag=140', '${downloadFileName.replace('.mp4', '.mp3')}', 'MP3')" class="py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-300 text-[11px] font-bold text-center transition flex items-center justify-center gap-1.5 cursor-pointer">
                ${ICONS.audio}
                <span>Direct MP3 Audio</span>
              </button>
            ` : `
              <a href="/download.html" class="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 text-[11px] font-bold text-center transition flex items-center justify-center gap-1.5">
                ${ICONS.download}
                <span>Direct Download</span>
              </a>
            `}
            <button onclick="UDL_DOWNLOADER.triggerLocalOrApp('${type}', '${quality}')" class="py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold text-center transition flex items-center justify-center gap-1.5 cursor-pointer">
              ${ICONS.desktop}
              <span>1-Click PC Engine</span>
            </button>
          </div>
        </div>

        <!-- Native App Banner Promo -->
        <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
          <div class="space-y-0.5">
            <span class="text-xs font-bold text-white flex items-center gap-1.5">
              <span class="text-amber-400">${ICONS.desktop}</span>
              <span>UnimaxDL Native Apps</span>
            </span>
            <p class="text-[10px] text-gray-400">Need 4K 60FPS or batch downloads? Windows, Mac & Android.</p>
          </div>
          <a href="/download.html" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition flex-shrink-0">
            Get App
          </a>
        </div>

      </div>
    `;

    // Start 5-second countdown timer
    const startTime = Date.now();
    const duration = 5000;
    const progressBar = document.getElementById('udl-gateway-progress');
    const badge = document.getElementById('udl-gateway-badge');
    const actionBtn = document.getElementById('udl-gateway-action-btn');
    const btnSpinner = document.getElementById('udl-btn-spinner');
    const btnText = document.getElementById('udl-btn-text');

    gatewayTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
      const remainingSec = Math.max(0, Math.ceil((duration - elapsed) / 1000));

      if (progressBar) progressBar.style.width = `${progress}%`;
      if (badge && remainingSec > 0) badge.innerText = `Unlocking in ${remainingSec}s...`;
      if (btnText && remainingSec > 0) {
        btnText.innerText = hasDirectStream 
          ? `Allocating Direct Download (${remainingSec}s)...` 
          : `Preparing UnimaxDL App Download (${remainingSec}s)...`;
      }

      if (elapsed >= duration) {
        clearInterval(gatewayTimer);
        gatewayTimer = null;

        if (progressBar) progressBar.style.width = '100%';
        if (badge) {
          badge.className = 'px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
          badge.innerText = 'Download Ready!';
        }

        if (actionBtn) {
          actionBtn.disabled = false;
          actionBtn.className = hasDirectStream
            ? 'w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-dark-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400/40 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer animate-pulse'
            : 'w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:brightness-110 text-dark-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/25 ring-2 ring-cyan-400/40 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer animate-pulse';
          if (btnSpinner) btnSpinner.classList.add('hidden');
          if (btnText) {
            btnText.innerHTML = hasDirectStream
              ? `${ICONS.download} <span>Save ${quality} to Device</span>`
              : `${ICONS.download} <span>Download ${quality} via Free UnimaxDL App</span>`;
          }
        }
      }
    }, 100);
  }

  async function triggerLocalOrApp(type, quality) {
    const targetUrl = currentMedia ? (currentMedia.original_url || currentMedia.webpage_url || currentMedia.url || '') : '';
    if (!targetUrl) {
      showToast("Please enter a valid video link");
      return;
    }
    showToast("Connecting to UnimaxDL Engine...");
    const isConnected = await checkServerConnection();
    if (isConnected && backendUrl) {
      showToast("Engine connected! Starting download...");
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
          if (data && data.task_id) {
            userInitiatedTasks.add(data.task_id);
          }
          const tasksContainer = document.getElementById('tasks-container');
          if (tasksContainer) {
            tasksContainer.classList.remove('hidden');
            tasksContainer.scrollIntoView({ behavior: 'smooth' });
          }
          startPolling((tasks) => {
            renderTasks(tasks, document.getElementById('tasks-container'));
          });
          return;
        }
      } catch (e) {
        console.error("Direct server call failed:", e);
      }
    }
    showToast("Engine stream required. Connect PC Companion or get UnimaxDL App.");
  }

  function executeDownloadAction(url, filename, quality) {
    if (!url || url.includes('vevioz') || url.includes('piped') || url.includes('cobalt')) {
      showToast("Engine stream required. Starting download via server engine...");
      triggerDownload('video', quality || '720p');
      return;
    }
    showToast(`Opening high-speed stream for ${quality}...`);

    // Create invisible anchor to trigger browser download
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
        media_type: (quality && quality.toLowerCase().includes('mp3')) ? 'audio' : 'video',
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
    const modal = document.getElementById('udl-download-helper-modal');
    if (modal) modal.classList.add('hidden');
  }

  // Render Media Card in UI
  function renderMediaCard(info, container) {
    if (!info || !container) return;

    const is4K = info.video_formats && info.video_formats.some(f => f.height >= 2160);
    const isFHD = info.video_formats && info.video_formats.some(f => f.height >= 1080);
    const fallbackPoster = generateVideoPosterSvg(info.title, info.extractor || 'Universal');

    const isInstagramCard = (info.extractor === 'Instagram' || (info.webpage_url && info.webpage_url.includes('instagram.com')));
    const igCode = info.igCode || (info.webpage_url ? (info.webpage_url.match(/(?:p|reel|tv)\/([\w-]+)/) || [])[1] : null);
    const hasRealThumbnail = info.thumbnail && !info.thumbnail.startsWith('data:image/svg') && !info.thumbnail.includes('images.unsplash.com');

    const safeThumbnail = formatThumbnailUrl(info.thumbnail);
    const mediaPreviewHtml = `<img 
        src="${safeThumbnail || fallbackPoster}" 
        data-orig="${info.thumbnail || ''}"
        alt="" 
        loading="eager"
        referrerpolicy="no-referrer"
        data-fallback="${fallbackPoster}"
        onerror="UDL_DOWNLOADER.handleThumbError(this)"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
      />`;

    container.innerHTML = `
      <div class="glass-card rounded-3xl p-6 sm:p-7 border border-white/10 space-y-6 animate-in fade-in zoom-in-95 duration-300 mt-6">
        
        <!-- Top Video Info Bar -->
        <div class="flex flex-col sm:flex-row gap-5 items-start">
          <div class="relative w-full sm:w-60 aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex-shrink-0 group">
            ${mediaPreviewHtml}
            <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white">
              ${info.duration || '00:00'}
            </div>
            ${is4K ? '<span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-dark-950 font-black text-[10px] shadow-md tracking-wider">4K UHD</span>' : isFHD ? '<span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500 text-dark-950 font-black text-[10px] shadow-md tracking-wider">1080p FHD</span>' : ''}
          </div>

          <div class="space-y-2 flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/25">
                ${info.extractor || 'Universal'}
              </span>
              <span class="text-xs text-gray-500">&bull; Public Media Stream</span>
            </div>
            
            <h3 class="text-white font-extrabold text-base sm:text-lg leading-snug line-clamp-2">
              ${info.title}
            </h3>

            <p class="text-xs text-gray-400 flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-gray-400">
                ${ICONS.user}
              </span>
              <span class="font-semibold text-gray-300">${info.uploader}</span>
            </p>
          </div>
        </div>

        <!-- Format Selector Tabs -->
        <div class="border-t border-white/[0.08] pt-5 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 bg-[#0c0c12] p-1 rounded-2xl border border-white/5">
              <button onclick="UDL_DOWNLOADER.switchTab('video')" id="tab-btn-video" class="px-4 py-1.5 rounded-xl bg-amber-500 text-dark-950 font-black text-xs transition shadow-sm flex items-center gap-1.5">
                ${ICONS.video}
                <span>Video (MP4)</span>
              </button>
              <button onclick="UDL_DOWNLOADER.switchTab('audio')" id="tab-btn-audio" class="px-4 py-1.5 rounded-xl text-gray-400 hover:text-white font-bold text-xs transition flex items-center gap-1.5">
                ${ICONS.audio}
                <span>Audio (MP3)</span>
              </button>
            </div>
            <span class="text-[11px] text-gray-500 hidden sm:inline">Instant On-Site Download</span>
          </div>

          <!-- Video Format Grid -->
          <div id="format-section-video" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            ${(info.video_formats || []).map(f => {
              const isHQ = isHighQuality(f);
              const badgeLabel = isHQ ? (f.badge || '4K/UHD • Native App') : (f.badge || 'Instant Web');
              const badgeStyle = isHQ ? 'bg-amber-400/20 text-amber-300 border-amber-500/30' : 'bg-emerald-400/15 text-emerald-300 border-emerald-500/25';
              return `
                <button onclick="UDL_DOWNLOADER.triggerDownload('video', '${f.quality}')" class="glass-card ${isHQ ? 'hover:border-amber-500/50 hover:bg-amber-500/10' : 'hover:border-cyan-500/50 hover:bg-cyan-500/10'} p-3.5 rounded-2xl text-left transition group relative flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-1.5 gap-1">
                      <span class="font-black text-sm text-white ${isHQ ? 'group-hover:text-amber-400' : 'group-hover:text-cyan-400'} transition">${f.resolution || f.quality}</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${f.height >= 2160 ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-gray-400'}">${f.ext}</span>
                    </div>
                    <div class="mb-2">
                      <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${badgeStyle}">${badgeLabel}</span>
                    </div>
                    <p class="text-[11px] text-gray-400 font-medium">${f.fps ? f.fps + 'fps &bull; ' : ''}${f.filesize_label || f.filesize_formatted || 'High Definition'}</p>
                  </div>
                  <div class="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold ${isHQ ? 'text-amber-400' : 'text-cyan-400'}">
                    <span class="flex items-center gap-1">${ICONS.download} <span>${isHQ ? 'Unlock 4K' : 'Download'}</span></span>
                    <span class="text-[10px] text-gray-500 font-mono">${isHQ ? 'NATIVE' : f.height >= 1080 ? 'HD' : 'SD'}</span>
                  </div>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Audio Format Grid (Hidden by default) -->
          <div id="format-section-audio" class="hidden grid grid-cols-1 sm:grid-cols-3 gap-3">
            ${(info.audio_formats || []).map(f => `
              <button onclick="UDL_DOWNLOADER.triggerDownload('audio', '${f.quality}')" class="glass-card hover:border-amber-500/50 hover:bg-amber-500/10 p-3.5 rounded-2xl text-left transition group relative flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-black text-sm text-white group-hover:text-amber-400 transition">${f.label}</span>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono bg-purple-500/20 text-purple-300">${f.ext}</span>
                  </div>
                  <p class="text-[11px] text-gray-400 font-medium">${f.bitrate} Bitrate Audio</p>
                </div>
                <div class="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold text-amber-400">
                  <span class="flex items-center gap-1">${ICONS.audio} <span>Extract MP3</span></span>
                  <span class="text-[10px] text-gray-500 font-mono">HI-FI</span>
                </div>
              </button>
            `).join('')}
          </div>

          <!-- Native App Conversion Callout -->
          <div class="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-transparent border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="space-y-0.5 text-center sm:text-left">
              <span class="font-extrabold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                Want 4K Downloads & Faster Speeds?
              </span>
              <p class="text-gray-400 text-[11px]">Download our free Android APK or Desktop app for background queues and full 4K UHD support.</p>
            </div>
            <a href="/download.html" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition whitespace-nowrap">
              Get Free App
            </a>
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
      if (videoBtn) videoBtn.className = "px-4 py-1.5 rounded-xl bg-amber-500 text-dark-950 font-black text-xs transition shadow-sm flex items-center gap-1.5";
      if (audioBtn) audioBtn.className = "px-4 py-1.5 rounded-xl text-gray-400 hover:text-white font-bold text-xs transition flex items-center gap-1.5";
    } else {
      if (videoSection) videoSection.classList.add('hidden');
      if (audioSection) audioSection.classList.remove('hidden');
      if (audioBtn) audioBtn.className = "px-4 py-1.5 rounded-xl bg-amber-500 text-dark-950 font-black text-xs transition shadow-sm flex items-center gap-1.5";
      if (videoBtn) videoBtn.className = "px-4 py-1.5 rounded-xl text-gray-400 hover:text-white font-bold text-xs transition flex items-center gap-1.5";
    }
  }

  let emptyPollCount = 0;

  // Polling Active Server Tasks (Supports Render cloud or local PC companion)
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
    // Initial fetch immediately
    pollTasks().then(tasks => {
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

    // Cloud session isolation: on Render cloud, ONLY show tasks initiated by this visitor
    const isCloud = backendUrl && backendUrl.includes('onrender.com');
    const visibleTasks = isCloud
      ? tasks.filter(t => userInitiatedTasks.has(t.id))
      : tasks;

    if (visibleTasks.length === 0) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }

    container.innerHTML = `
      <div class="space-y-3 mt-6">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Active Downloads & Processing Queue
          </h4>
          <span class="text-[11px] text-gray-500 font-mono">${visibleTasks.length} task${visibleTasks.length > 1 ? 's' : ''}</span>
        </div>
        ${visibleTasks.map(t => {
          const isDone = t.status === 'completed';
          const isError = t.status === 'error';
          const isQueued = t.status === 'queued';
          const isStarting = t.status === 'starting';
          const isProcessing = t.status === 'processing';
          const downloadUrl = `${backendUrl}/api/download-file/${t.id}`;

          // Auto-trigger browser download once when completed ONLY for this user's task
          if (isDone && userInitiatedTasks.has(t.id) && !autoDownloadedTasks.has(t.id)) {
            autoDownloadedTasks.add(t.id);
            try {
              const a = document.createElement('a');
              a.href = downloadUrl;
              a.download = t.filename || 'download.mp4';
              document.body.appendChild(a);
              a.click();
              setTimeout(() => a.remove(), 300);
              showToast(`Download finished: ${t.filename || 'media'}. Saving to device!`);
            } catch (e) {
              console.warn("Auto-download trigger failed:", e);
            }
          }

          let statusBadgeClass = 'bg-cyan-500/20 text-cyan-300 animate-pulse';
          let statusText = t.status;
          if (isDone) {
            statusBadgeClass = 'bg-emerald-500/20 text-emerald-300';
            statusText = 'Completed';
          } else if (isError) {
            statusBadgeClass = 'bg-amber-500/20 text-amber-300';
            statusText = 'Failed';
          } else if (isQueued) {
            statusBadgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
            statusText = `In Queue (#${t.queue_position || 1})`;
          } else if (isStarting) {
            statusBadgeClass = 'bg-blue-500/20 text-blue-300 animate-pulse';
            statusText = 'Starting...';
          } else if (isProcessing) {
            statusBadgeClass = 'bg-purple-500/20 text-purple-300 animate-pulse';
            statusText = 'Muxing Streams...';
          }

          return `
            <div class="glass-card p-4 rounded-2xl border border-white/10 space-y-2.5">
              <div class="flex items-center justify-between text-xs gap-3">
                <span class="font-bold text-white truncate max-w-xs">${t.title || 'Video Download'}</span>
                <span class="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${statusBadgeClass} uppercase whitespace-nowrap">${statusText}</span>
              </div>

              <!-- Progress / Queue Bar -->
              <div class="w-full bg-[#0c0c12] h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                ${isQueued ? `
                  <div class="h-full rounded-full bg-gradient-to-r from-amber-500/40 via-amber-400 to-amber-500/40 animate-pulse w-full"></div>
                ` : `
                  <div class="h-full rounded-full ${isDone ? 'bg-emerald-400' : 'bg-cyan-400'} transition-all duration-300" style="width: ${t.progress || t.percent || 0}%"></div>
                `}
              </div>

              <!-- Status Detail Labels -->
              ${isQueued ? `
                <div class="flex items-center justify-between text-[11px] text-amber-300/80 font-mono">
                  <span>Server Busy (${t.active_downloads || 3}/${t.max_workers || 3} active slots)</span>
                  <span class="font-bold">Position #${t.queue_position || 1} &bull; Starting automatically</span>
                </div>
              ` : `
                <div class="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                  <span>${t.downloaded || '0 MB'} of ${t.total || '0 MB'}</span>
                  <span class="text-gray-300 font-bold">${t.progress || t.percent || 0}% &bull; ${t.speed || ''}</span>
                </div>
              `}

              ${isDone ? `
                <a href="${downloadUrl}" download class="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-dark-950 font-black text-xs text-center transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                  <svg class="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  <span>Save File to Device</span>
                </a>
              ` : ''}

              ${isError ? `
                <div class="space-y-2 pt-1 border-t border-white/5">
                  <p class="text-[11px] text-amber-400 font-medium">
                    Stream error or browser rate limit encountered. Download natively without restrictions:
                  </p>
                  <a href="/download.html" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:brightness-110 text-dark-950 font-black text-xs text-center transition flex items-center justify-center gap-1.5 shadow-md">
                    <svg class="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    <span>Download via Desktop / Android App</span>
                  </a>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Init on DOM ready
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

  // Lightweight Client-Side Keep-Alive & Wakeup Trigger (Render cold-start optimizer)
  window.addEventListener('focus', () => {
    UDL_DOWNLOADER.checkServerConnection();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input[type="url"], input[type="text"]');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        UDL_DOWNLOADER.checkServerConnection();
      }, { once: true });
      input.addEventListener('input', () => {
        UDL_DOWNLOADER.checkServerConnection();
      }, { once: true });
    });
  });
}
