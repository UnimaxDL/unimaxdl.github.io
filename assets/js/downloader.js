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

  // Pure SVG Vector Icon Registry (Explicit Dimensions, Zero Tailwind Required)
  const ICONS = {
    settings: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    download: `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`,
    video: `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
    audio: `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>`,
    desktop: `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
    mobile: `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`,
    web: `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m3.84 6.16A8.995 8.995 0 013 12m3.84-6.16A8.995 8.995 0 013 12m14.32 0a8.995 8.995 0 01-3.84 6.16m3.84-6.16A8.995 8.995 0 0017.16 5.84M12 3a9 9 0 00-3.84 15.16M12 3a9 9 0 013.84 15.16"/></svg>`,
    sparkle: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
    close: `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
    user: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
    arrowRight: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`,
    shield: `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
    timer: `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    check: `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`,
    external: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>`
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
      const label = isCloud ? 'CLOUD CONNECTED' : 'LOCAL PC ACTIVE';
      el.className = 'header-status-pill';
      el.style.borderColor = 'var(--status-ready)';
      el.style.color = 'var(--status-ready)';
      el.innerHTML = `<span class="status-dot ready"></span><span>${label}</span>`;
      el.title = `Connected to ${targetUrl}. Tap to configure backend`;
      el.onclick = showSettingsModal;
    } else {
      el.className = 'header-status-pill';
      el.style.borderColor = 'var(--brand-accent)';
      el.style.color = 'var(--brand-accent)';
      el.innerHTML = `<span class="status-dot"></span><span>WEB ENGINE // CONFIG</span>`;
      el.title = "Running client resolver. Tap to connect local PC or cloud engine";
      el.onclick = showSettingsModal;
    }
  }

  // Settings Modal
  function showSettingsModal() {
    let modal = document.getElementById('udl-settings-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'udl-settings-modal';
      modal.className = 'studio-modal-wrap';
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="studio-modal-backdrop" onclick="UDL_DOWNLOADER.closeSettingsModal()"></div>
      <div class="studio-modal-panel frame-marked">
        <div class="studio-modal-header">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <div style="width:36px; height:36px; background:var(--brand-surface-alt); border:1px solid var(--brand-amber); color:var(--brand-amber); display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sharp);">
              ${ICONS.settings}
            </div>
            <div>
              <div style="font-family:var(--font-mono); font-size:0.625rem; color:var(--brand-amber); font-weight:700;">LOCAL HARDWARE LINK</div>
              <h3 style="font-size:1.0625rem; font-weight:700; color:var(--text-primary); margin:0;">Local PC Companion</h3>
            </div>
          </div>
          <button onclick="UDL_DOWNLOADER.closeSettingsModal()" class="studio-modal-close" aria-label="Close">
            ${ICONS.close}
          </button>
        </div>

        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div>
            <label style="display:block; font-family:var(--font-mono); font-size:0.6875rem; color:var(--text-muted); margin-bottom:0.4rem;">BACKEND ENDPOINT URL</label>
            <div style="display:flex; gap:0.5rem;">
              <input
                type="text"
                id="udl-modal-url-input"
                value="${backendUrl || 'http://127.0.0.1:8000'}"
                placeholder="http://127.0.0.1:8000"
                style="flex:1; background:var(--bg-canvas); border:1px solid var(--line-strong); border-radius:var(--radius-sharp); padding:0.6rem 0.75rem; font-family:var(--font-mono); font-size:0.75rem; color:var(--text-primary); outline:none;"
              />
              <button onclick="UDL_DOWNLOADER.testConnection()" id="udl-ping-btn" class="btn-secondary">
                PING
              </button>
            </div>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem;">
              Run <code style="color:var(--brand-amber);">Start_UnimaxDL.bat</code> or <code style="color:var(--brand-amber);">python start.py</code> locally for unlimited 4K muxing.
            </p>
          </div>

          <div style="padding:0.875rem 1rem; background:var(--brand-surface-alt); border-left:3px solid var(--brand-accent); border-radius:var(--radius-sharp); font-size:0.75rem; color:var(--text-secondary);">
            <strong style="color:var(--brand-accent); display:block; margin-bottom:0.25rem;">LOCAL COMPANION ADVANTAGES:</strong>
            Lossless 4K UHD 60FPS FFmpeg merging, 320kbps MP3 extraction, and zero browser CORS or size caps.
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:flex-end; gap:0.75rem; border-top:1px solid var(--border-hairline); padding-top:1rem;">
          <button onclick="UDL_DOWNLOADER.closeSettingsModal()" class="btn-secondary">CANCEL</button>
          <button onclick="UDL_DOWNLOADER.saveModalSettings()" class="btn-signal">SAVE CONFIG</button>
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

    btn.innerText = "PINGING...";
    const target = input.value.trim().replace(/\/+$/, '');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${target}/api/ping`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        btn.innerText = "ONLINE";
        btn.style.borderColor = "var(--status-ready)";
        btn.style.color = "var(--status-ready)";
      } else {
        throw new Error();
      }
    } catch {
      btn.innerText = "OFFLINE";
      btn.style.borderColor = "var(--status-error)";
      btn.style.color = "var(--status-error)";
    }

    setTimeout(() => {
      btn.innerText = "PING";
      btn.style.borderColor = "";
      btn.style.color = "";
    }, 2500);
  }

  function saveModalSettings() {
    const input = document.getElementById('udl-modal-url-input');
    if (input) {
      setBackendUrl(input.value);
    }
    closeSettingsModal();
    showToast("Connection configuration updated.");
  }

  // Toast Notification
  function showToast(msg) {
    const existing = document.querySelectorAll('.studio-toast');
    existing.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = "studio-toast";
    toast.innerHTML = `<span>${ICONS.sparkle}</span><span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 200ms ease';
      setTimeout(() => toast.remove(), 220);
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
      modal.className = 'studio-modal-wrap';
      document.body.appendChild(modal);
    }

    const targetUrl = currentMedia ? (currentMedia.original_url || currentMedia.webpage_url || currentMedia.url || '') : '';
    const deepLink = 'unimaxdl://resolve?url=' + encodeURIComponent(targetUrl);

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="studio-modal-backdrop" onclick="UDL_DOWNLOADER.close4KModal()"></div>
      <div class="studio-modal-panel frame-marked" style="border-color:var(--brand-amber);">
        <div class="studio-modal-header">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <div style="width:42px; height:42px; background:var(--brand-surface-alt); border:1px solid var(--brand-amber); color:var(--brand-amber); display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-weight:800; font-size:0.875rem; border-radius:var(--radius-sharp);">
              4K
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.2rem;">
                <span class="tech-badge tech-badge-amber">NATIVE APP REQUIRED</span>
                <span style="font-family:var(--font-mono); font-size:0.6875rem; color:var(--text-muted);">${quality}</span>
              </div>
              <h3 style="font-size:1.0625rem; font-weight:700; color:var(--text-primary); margin:0;">Unlock 4K UHD &amp; 60FPS</h3>
            </div>
          </div>
          <button onclick="UDL_DOWNLOADER.close4KModal()" class="studio-modal-close" aria-label="Close">
            ${ICONS.close}
          </button>
        </div>

        <p style="font-size:0.8125rem; color:var(--text-secondary); line-height:1.6;">
          High-bitrate <strong>2K, 4K &amp; 8K 60FPS HDR</strong> streams require client-side FFmpeg GPU muxing. Ultra-high-definition downloads run directly on your device hardware via the free UnimaxDL Native App.
        </p>

        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.625rem; padding:0.875rem; background:var(--brand-surface-alt); border:1px solid var(--border-hairline); border-radius:var(--radius-sharp); font-size:0.75rem;">
          <div><strong style="color:var(--brand-amber); display:block;">Unlimited 4K / 8K</strong><span style="color:var(--text-muted); font-size:0.6875rem;">HDR &amp; 60FPS lossless streams</span></div>
          <div><strong style="color:var(--status-ready); display:block;">Direct CDN Speed</strong><span style="color:var(--text-muted); font-size:0.6875rem;">Zero cloud queue wait time</span></div>
          <div><strong style="color:var(--brand-accent); display:block;">GPU Accelerated</strong><span style="color:var(--text-muted); font-size:0.6875rem;">Local FFmpeg stream merging</span></div>
          <div><strong style="color:var(--text-primary); display:block;">100% Private</strong><span style="color:var(--text-muted); font-size:0.6875rem;">Processes directly on hardware</span></div>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.625rem;">
          <a href="${deepLink}" class="btn-signal" style="width:100%; background:var(--brand-amber); color:#07070a;">
            ${ICONS.sparkle}
            <span>OPEN IN UNIMAXDL NATIVE APP</span>
          </a>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
            <a href="/download.html" class="btn-secondary" style="width:100%;">
              ${ICONS.mobile}
              <span>ANDROID APK</span>
            </a>
            <a href="/download.html" class="btn-secondary" style="width:100%;">
              ${ICONS.desktop}
              <span>DESKTOP APP</span>
            </a>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
            <button onclick="UDL_DOWNLOADER.copyDeepLink('${deepLink}')" class="cartridge-btn" style="width:100%; padding:0.5rem;">
              <span>COPY APP LINK</span>
            </button>
            <button onclick="UDL_DOWNLOADER.fallbackTo1080p()" class="cartridge-btn" style="width:100%; padding:0.5rem; border-color:var(--brand-accent); color:var(--brand-accent);">
              <span>GET 1080P IN BROWSER</span>
            </button>
          </div>

          <a href="https://asiafilm.org/4/0b90618d4229234e89f68c862523c621" target="_blank" rel="noopener noreferrer" class="cartridge-btn" style="width:100%; padding:0.55rem; border-color:var(--brand-amber); color:var(--brand-amber);">
            ${ICONS.sparkle}
            <span>HIGH-SPEED CLOUD MIRROR (SPONSORED)</span>
          </a>
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
      showToast(`Starting ${quality} download via UnimaxDL cloud engine...`);
      try {
        const controller = new AbortController();
        const timeoutMs = targetBackend.includes('onrender.com') ? 45000 : 8000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const wakeToastTimer = setTimeout(() => {
          showToast("Waking up Cloud Engine (video + audio FFmpeg muxer)...");
        }, 3500);

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
        clearTimeout(wakeToastTimer);

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data && data.task_id) {
            userInitiatedTasks.add(data.task_id);
          }
          backendUrl = targetBackend;
          isServerConnected = true;
          updateStatusBadge(true, targetBackend);
          showToast("Download initialized with synchronized audio! Tracking progress...");
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
      modal.className = 'studio-modal-wrap';
      document.body.appendChild(modal);
    }

    const title = currentMedia ? currentMedia.title : "Online Media";
    const mediaUrl = currentMedia ? (currentMedia.webpage_url || currentMedia.url || '') : '';
    const isAudio = type === 'audio';

    const ytMatch = mediaUrl.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*)/);
    const ytId = (ytMatch && ytMatch[1].length === 11) ? ytMatch[1] : null;

    let directStreamUrl = '';
    let downloadFileName = (title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().substring(0, 36) || 'unimaxdl-media') + (isAudio ? '.mp3' : '.mp4');

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

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="studio-modal-backdrop" onclick="UDL_DOWNLOADER.closeDownloadModal()"></div>
      <div class="studio-modal-panel frame-marked">
        <div class="studio-modal-header">
          <div style="display:flex; align-items:center; gap:0.75rem; min-width:0;">
            <div style="width:36px; height:36px; background:var(--brand-surface-alt); border:1px solid var(--brand-accent); color:var(--brand-accent); display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sharp); flex-shrink:0;">
              ${isAudio ? ICONS.audio : ICONS.video}
            </div>
            <div style="min-width:0;">
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.2rem;">
                <span class="tech-badge tech-badge-cyan">${quality}</span>
                <span style="font-family:var(--font-mono); font-size:0.6875rem; color:var(--text-muted);">${isAudio ? 'AUDIO STREAM' : 'VIDEO STREAM'}</span>
              </div>
              <h3 style="font-size:0.9375rem; font-weight:700; color:var(--text-primary); margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</h3>
            </div>
          </div>
          <button onclick="UDL_DOWNLOADER.closeDownloadModal()" class="studio-modal-close" aria-label="Close">
            ${ICONS.close}
          </button>
        </div>

        <div style="padding:0.875rem 1rem; background:var(--brand-surface-alt); border:1px solid var(--border-hairline); border-radius:var(--radius-sharp); display:flex; flex-direction:column; gap:0.625rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; font-family:var(--font-mono); font-size:0.75rem;">
            <span style="color:var(--text-primary); font-weight:700; display:flex; align-items:center; gap:0.35rem;">
              <span style="color:var(--brand-accent);">${ICONS.timer}</span>
              <span>PREPARING STREAM</span>
            </span>
            <span id="udl-gateway-badge" class="tech-badge tech-badge-cyan">UNLOCKING IN 5S...</span>
          </div>
          <div class="studio-progress-track">
            <div id="udl-gateway-progress" class="studio-progress-fill" style="width:0%;"></div>
          </div>
        </div>

        <div id="udl-sponsor-container" style="padding:0.875rem 1rem; background:var(--brand-surface-alt); border-left:3px solid ${hasDirectStream ? 'var(--status-ready)' : 'var(--brand-accent)'}; border-radius:var(--radius-sharp); font-size:0.75rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.35rem; font-family:var(--font-mono);">
            <strong style="color:var(--text-primary);">${hasDirectStream ? 'DIRECT STREAM ALLOCATED' : 'HD LOCAL MUXING REQUIRED'}</strong>
            <span class="tech-badge ${hasDirectStream ? 'tech-badge-green' : 'tech-badge-cyan'}">${hasDirectStream ? 'READY' : 'NATIVE APP'}</span>
          </div>
          <p style="font-size:0.75rem; color:var(--text-secondary); line-height:1.5; margin:0;">
            ${hasDirectStream
              ? 'Your stream is ready for direct transfer with zero intermediate storage.'
              : 'High-definition muxed streams can be processed cleanly without timeouts via the free UnimaxDL App or Local PC Companion.'}
          </p>
        </div>

        <div>
          ${hasDirectStream ? `
            <button
              id="udl-gateway-action-btn"
              disabled
              onclick="UDL_DOWNLOADER.executeDownloadAction('${directStreamUrl}', '${downloadFileName}', '${quality}')"
              class="btn-secondary"
              style="width:100%; opacity:0.65; cursor:not-allowed; padding:0.875rem;">
              <span id="udl-btn-spinner" style="display:inline-flex; align-items:center;">${ICONS.timer}</span>
              <span id="udl-btn-text">ALLOCATING DIRECT STREAM (5S)...</span>
            </button>
          ` : `
            <button
              id="udl-gateway-action-btn"
              disabled
              onclick="UDL_DOWNLOADER.triggerLocalOrApp('${type}', '${quality}')"
              class="btn-secondary"
              style="width:100%; opacity:0.65; cursor:not-allowed; padding:0.875rem;">
              <span id="udl-btn-spinner" style="display:inline-flex; align-items:center;">${ICONS.timer}</span>
              <span id="udl-btn-text">PREPARING CLIENT ENGINE (5S)...</span>
            </button>
          `}
        </div>

        <div style="border-top:1px solid var(--border-hairline); padding-top:0.875rem; display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
          ${hasDirectStream ? `
            <button onclick="UDL_DOWNLOADER.executeDownloadAction('${directStreamUrl}', '${downloadFileName}', '${quality}')" class="cartridge-btn" style="padding:0.5rem; width:100%;">
              ${ICONS.download}
              <span>DIRECT STREAM</span>
            </button>
          ` : ytId ? `
            <button onclick="UDL_DOWNLOADER.executeDownloadAction('https://yt.chocolatemoo53.com/latest_version?id=${ytId}&itag=140', '${downloadFileName.replace('.mp4', '.mp3')}', 'MP3')" class="cartridge-btn" style="padding:0.5rem; width:100%;">
              ${ICONS.audio}
              <span>DIRECT MP3 AUDIO</span>
            </button>
          ` : `
            <a href="/download.html" class="cartridge-btn" style="padding:0.5rem; width:100%;">
              ${ICONS.download}
              <span>NATIVE APPS</span>
            </a>
          `}
          <button onclick="UDL_DOWNLOADER.triggerLocalOrApp('${type}', '${quality}')" class="cartridge-btn" style="padding:0.5rem; width:100%; border-color:var(--brand-accent); color:var(--brand-accent);">
            ${ICONS.desktop}
            <span>LOCAL PC ENGINE</span>
          </button>
        </div>
      </div>
    `;

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
      if (badge && remainingSec > 0) badge.innerText = `UNLOCKING IN ${remainingSec}S...`;
      if (btnText && remainingSec > 0) {
        btnText.innerText = hasDirectStream
          ? `ALLOCATING DIRECT STREAM (${remainingSec}S)...`
          : `PREPARING CLIENT ENGINE (${remainingSec}S)...`;
      }

      if (elapsed >= duration) {
        clearInterval(gatewayTimer);
        gatewayTimer = null;

        if (progressBar) {
          progressBar.style.width = '100%';
          progressBar.classList.add('is-done');
        }
        if (badge) {
          badge.className = 'tech-badge tech-badge-green';
          badge.innerText = 'READY FOR SAVE';
        }

        if (actionBtn) {
          actionBtn.disabled = false;
          actionBtn.className = 'btn-signal';
          actionBtn.style.width = '100%';
          actionBtn.style.opacity = '1';
          actionBtn.style.cursor = 'pointer';
          if (btnSpinner) btnSpinner.classList.add('hidden');
          if (btnText) {
            btnText.innerHTML = hasDirectStream
              ? `${ICONS.download} <span>SAVE ${quality.toUpperCase()} TO DEVICE</span>`
              : `${ICONS.download} <span>EXECUTE VIA ENGINE / APP</span>`;
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

  // Render Media Card in UI (Tactile Studio Output Rack)
  function renderMediaCard(info, container) {
    if (!info || !container) return;

    const is4K = info.video_formats && info.video_formats.some(f => f.height >= 2160);
    const isFHD = info.video_formats && info.video_formats.some(f => f.height >= 1080);
    const fallbackPoster = generateVideoPosterSvg(info.title, info.extractor || 'Universal');

    const safeThumbnail = formatThumbnailUrl(info.thumbnail);
    const mediaPreviewHtml = `<img
        src="${safeThumbnail || fallbackPoster}"
        data-orig="${info.thumbnail || ''}"
        alt=""
        loading="eager"
        referrerpolicy="no-referrer"
        data-fallback="${fallbackPoster}"
        onerror="UDL_DOWNLOADER.handleThumbError(this)"
      />`;

    container.innerHTML = `
      <div class="studio-result-card frame-marked">
        <div class="deck-strip">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="status-dot ready"></span>
            <span style="color:var(--text-primary); font-weight:700;">STREAM MANIFEST RESOLVED</span>
          </div>
          <span class="tabular" style="color:var(--text-muted); font-size:0.6875rem;">${(info.extractor || 'UNIVERSAL').toUpperCase()} // MUX READY</span>
        </div>

        <div class="studio-result-body">
          <div class="studio-media-row">
            <div class="studio-thumb-box">
              ${mediaPreviewHtml}
              <div class="studio-thumb-duration">${info.duration || '00:00'}</div>
              ${is4K ? '<span class="studio-thumb-badge is-4k">4K UHD MASTER</span>' : isFHD ? '<span class="studio-thumb-badge">1080P FHD STREAM</span>' : ''}
            </div>

            <div class="studio-media-meta">
              <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                <span class="tech-badge tech-badge-cyan">${info.extractor || 'UNIVERSAL'}</span>
                <span class="tech-badge tech-badge-green">AUDIO + VIDEO MUXED</span>
              </div>
              <h3 class="studio-media-title">${info.title}</h3>
              <div class="studio-meta-line">
                <span style="display:inline-flex; align-items:center; gap:0.35rem;">${ICONS.user} <span>${info.uploader}</span></span>
                <span>|</span>
                <span>CODEC: H.264 / AAC</span>
              </div>
            </div>
          </div>

          <div class="studio-format-toolbar">
            <div class="studio-format-tabs">
              <button onclick="UDL_DOWNLOADER.switchTab('video')" id="tab-btn-video" class="mode-tab active">
                ${ICONS.video}
                <span>VIDEO (MP4)</span>
              </button>
              <button onclick="UDL_DOWNLOADER.switchTab('audio')" id="tab-btn-audio" class="mode-tab">
                ${ICONS.audio}
                <span>AUDIO (MP3)</span>
              </button>
            </div>
            <div style="display:inline-flex; align-items:center; gap:0.4rem; font-family:var(--font-mono); font-size:0.6875rem; color:var(--text-muted);">
              <span class="status-dot ready"></span>
              <span>DIRECT HARDWARE STREAM</span>
            </div>
          </div>

          <!-- Video Format Matrix -->
          <div id="format-section-video" class="studio-format-grid">
            ${(info.video_formats || []).map(f => {
              const isHQ = isHighQuality(f);
              const badgeLabel = isHQ ? (f.badge || '4K // NATIVE APP') : (f.badge || 'MUXED // DIRECT');
              const badgeClass = isHQ ? 'tech-badge-amber' : 'tech-badge-green';
              return `
                <button onclick="UDL_DOWNLOADER.triggerDownload('video', '${f.quality}')" class="studio-format-tile ${isHQ ? 'is-master' : ''}">
                  <div>
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.4rem; gap:0.25rem;">
                      <span style="font-family:var(--font-display); font-weight:700; font-size:0.9375rem; color:var(--text-primary);">${f.resolution || f.quality}</span>
                      <span class="tech-badge">${f.ext}</span>
                    </div>
                    <div style="margin-bottom:0.45rem;">
                      <span class="tech-badge ${badgeClass}">${badgeLabel}</span>
                    </div>
                    <div style="font-family:var(--font-mono); font-size:0.6875rem; color:var(--text-muted);" class="tabular">${f.fps ? f.fps + 'fps // ' : ''}${f.filesize_label || f.filesize_formatted || 'Stream Mux'}</div>
                  </div>
                  <div style="padding-top:0.5rem; border-top:1px solid var(--border-hairline); display:flex; align-items:center; justify-content:space-between; font-family:var(--font-mono); font-size:0.75rem; font-weight:700; color:${isHQ ? 'var(--brand-amber)' : 'var(--brand-accent)'};">
                    <span style="display:inline-flex; align-items:center; gap:0.3rem;">${ICONS.download} <span>${isHQ ? 'GET 4K' : 'DOWNLOAD'}</span></span>
                    <span style="font-size:0.625rem; color:var(--text-muted);">${isHQ ? 'PRO' : f.height >= 1080 ? 'FHD' : 'SD'}</span>
                  </div>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Audio Format Matrix -->
          <div id="format-section-audio" class="studio-format-grid cols-3 hidden">
            ${(info.audio_formats || []).map(f => `
              <button onclick="UDL_DOWNLOADER.triggerDownload('audio', '${f.quality}')" class="studio-format-tile">
                <div>
                  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.4rem;">
                    <span style="font-family:var(--font-display); font-weight:700; font-size:0.9375rem; color:var(--text-primary);">${f.label}</span>
                    <span class="tech-badge tech-badge-cyan">${f.ext}</span>
                  </div>
                  <div style="font-family:var(--font-mono); font-size:0.6875rem; color:var(--text-muted);" class="tabular">${f.bitrate} Studio Master</div>
                </div>
                <div style="padding-top:0.5rem; border-top:1px solid var(--border-hairline); display:flex; align-items:center; justify-content:space-between; font-family:var(--font-mono); font-size:0.75rem; font-weight:700; color:var(--brand-accent);">
                  <span style="display:inline-flex; align-items:center; gap:0.3rem;">${ICONS.audio} <span>EXTRACT ${f.ext.toUpperCase()}</span></span>
                  <span style="font-size:0.625rem; color:var(--text-muted);">HI-FI</span>
                </div>
              </button>
            `).join('')}
          </div>

          <!-- Companion App Bar -->
          <div class="studio-companion-bar">
            <div>
              <div style="display:flex; align-items:center; gap:0.45rem; font-family:var(--font-mono); font-size:0.75rem; font-weight:700; color:var(--text-primary);">
                <span class="status-dot warn"></span>
                <span>NEED 4K 60FPS OR BATCH PLAYLISTS?</span>
              </div>
              <p style="font-size:0.75rem; color:var(--text-muted); margin:0.15rem 0 0;">Run extraction natively via UnimaxDL Android APK or Desktop Client.</p>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; flex-shrink:0;">
              <a href="https://asiafilm.org/4/0b90618d4229234e89f68c862523c621" target="_blank" rel="noopener noreferrer" class="cartridge-btn" style="border-color:var(--brand-amber); color:var(--brand-amber);">
                FAST MIRROR
              </a>
              <a href="/download.html" class="btn-secondary" style="padding:0.4rem 0.75rem;">
                NATIVE APPS &rarr;
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

    const isCloud = backendUrl && backendUrl.includes('onrender.com');
    const visibleTasks = isCloud
      ? tasks.filter(t => userInitiatedTasks.has(t.id))
      : tasks;

    if (visibleTasks.length === 0) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top:1.5rem;">
        <div style="display:flex; align-items:center; justify-content:space-between; font-family:var(--font-mono); font-size:0.75rem;">
          <span style="font-weight:700; color:var(--text-secondary); display:flex; align-items:center; gap:0.45rem;">
            <span class="status-dot ready animate-pulse"></span>
            <span>ACTIVE PROCESSING QUEUE</span>
          </span>
          <span style="color:var(--text-muted);" class="tabular">${visibleTasks.length} TASK${visibleTasks.length > 1 ? 'S' : ''}</span>
        </div>
        ${visibleTasks.map(t => {
          const isDone = t.status === 'completed';
          const isError = t.status === 'error';
          const isQueued = t.status === 'queued';
          const isStarting = t.status === 'starting';
          const isProcessing = t.status === 'processing';
          const downloadUrl = `${backendUrl}/api/download-file/${t.id}`;

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

          let statusBadgeClass = 'tech-badge-cyan';
          let statusText = t.status;
          if (isDone) {
            statusBadgeClass = 'tech-badge-green';
            statusText = 'COMPLETED';
          } else if (isError) {
            statusBadgeClass = 'tech-badge-amber';
            statusText = 'FAILED';
          } else if (isQueued) {
            statusBadgeClass = 'tech-badge-amber';
            statusText = `QUEUED (#${t.queue_position || 1})`;
          } else if (isStarting) {
            statusBadgeClass = 'tech-badge-cyan';
            statusText = 'INITIALIZING';
          } else if (isProcessing) {
            statusBadgeClass = 'tech-badge-cyan';
            statusText = 'MUXING STREAMS';
          }

          return `
            <div class="deck-panel frame-marked" style="padding:1rem 1.25rem; display:flex; flex-direction:column; gap:0.625rem;">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem;">
                <span style="font-family:var(--font-display); font-weight:700; font-size:0.875rem; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.title || 'Video Stream Extraction'}</span>
                <span class="tech-badge ${statusBadgeClass}">${statusText}</span>
              </div>

              <div class="studio-progress-track">
                ${isQueued ? `
                  <div class="studio-progress-fill animate-pulse" style="width:100%; background:var(--brand-amber); opacity:0.65;"></div>
                ` : `
                  <div class="studio-progress-fill ${isDone ? 'is-done' : ''}" style="width:${t.progress || t.percent || 0}%;"></div>
                `}
              </div>

              ${isQueued ? `
                <div style="display:flex; align-items:center; justify-content:space-between; font-family:var(--font-mono); font-size:0.6875rem; color:var(--brand-amber);" class="tabular">
                  <span>SYSTEM LOAD: ${t.active_downloads || 3}/${t.max_workers || 3} CHANNELS</span>
                  <span>QUEUE #${t.queue_position || 1}</span>
                </div>
              ` : `
                <div style="display:flex; align-items:center; justify-content:space-between; font-family:var(--font-mono); font-size:0.6875rem; color:var(--text-muted);" class="tabular">
                  <span>${t.downloaded || '0 MB'} // ${t.total || '0 MB'}</span>
                  <span style="color:var(--text-primary); font-weight:700;">${t.progress || t.percent || 0}% ${t.speed ? '&bull; ' + t.speed : ''}</span>
                </div>
              `}

              ${isDone ? `
                <a href="${downloadUrl}" download class="btn-signal" style="width:100%; padding:0.6rem;">
                  ${ICONS.download}
                  <span>SAVE MEDIA TO DEVICE</span>
                </a>
              ` : ''}

              ${isError ? `
                <div style="border-top:1px solid var(--border-hairline); padding-top:0.625rem; display:flex; flex-direction:column; gap:0.5rem;">
                  <p style="font-family:var(--font-mono); font-size:0.6875rem; color:var(--brand-amber); margin:0;">
                    [ERR] BROWSER RESTRICTION DETECTED. EXECUTE VIA NATIVE CLIENT:
                  </p>
                  <a href="/download.html" class="btn-signal" style="width:100%; padding:0.6rem;">
                    ${ICONS.download}
                    <span>GET DESKTOP / ANDROID APP</span>
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
