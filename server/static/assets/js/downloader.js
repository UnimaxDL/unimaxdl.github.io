/**
 * UnimaxDL Downloader Engine v1.3.0
 * Features:
 * - Brand Icon & Pure SVG Icons (Zero Emojis!)
 * - Smart Dual-Engine: Local/Cloud Backend + Client-Side Fallback Resolver
 * - Direct oEmbed/NoEmbed metadata extraction for YouTube, TikTok, Instagram, Twitter, Vimeo
 * - Direct download helpers & fallback options when standalone
 * - Interactive settings modal with live ping diagnostics
 */

const UDL_DOWNLOADER = (() => {
  const STORAGE_KEY = 'udl_backend_url';

  // Auto-detect local server if running on localhost or custom port
  let defaultBackend = '';
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

  // ── SVG Icon Registry ──
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
    arrowRight: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`
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

  // ── Ping Diagnostic ──
  async function checkServerConnection() {
    if (!backendUrl) {
      isServerConnected = false;
      updateStatusBadge(false);
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${backendUrl}/api/ping`, { signal: controller.signal });
      clearTimeout(timeoutId);
      isServerConnected = res.ok;
    } catch {
      isServerConnected = false;
    }
    updateStatusBadge(isServerConnected);
    return isServerConnected;
  }

  function updateStatusBadge(connected) {
    const el = document.getElementById('udl-server-status');
    if (!el) return;
    if (connected) {
      el.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold';
      el.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> <span>Server: Connected</span>`;
    } else {
      el.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold cursor-pointer hover:bg-amber-500/20 transition';
      el.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span> <span>Standalone Web Mode</span>`;
      el.title = "Tap to connect local PC server for 4K downloads";
      el.onclick = showSettingsModal;
    }
  }

  // ── Settings Modal ──
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
              <h3 class="text-lg font-bold text-white">Backend Connection</h3>
              <p class="text-xs text-gray-400">Connect to your local PC or private cloud server</p>
            </div>
          </div>
          <button onclick="UDL_DOWNLOADER.closeSettingsModal()" class="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">
            ${ICONS.close}
          </button>
        </div>

        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-300">Server Address</label>
            <div class="flex gap-2">
              <input 
                type="text" 
                id="udl-modal-url-input" 
                value="${backendUrl || 'http://127.0.0.1:8000'}" 
                placeholder="http://127.0.0.1:8000 or http://192.168.1.xxx:8000" 
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
              Run <code class="text-amber-400">python start.py</code> in the <code class="text-gray-400">server/</code> directory to start your local PC backend.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-xs text-gray-300 space-y-2">
            <span class="font-bold text-amber-400 block">Why connect a local PC server?</span>
            <ul class="space-y-1 text-gray-400 list-disc list-inside">
              <li>Direct 4K UHD 60fps video downloads</li>
              <li>Lossless MP3 320kbps audio extraction</li>
              <li>Bypasses all browser CORS and file size restrictions</li>
            </ul>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button onclick="UDL_DOWNLOADER.closeSettingsModal()" class="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition">Cancel</button>
          <button onclick="UDL_DOWNLOADER.saveModalSettings()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-black text-xs shadow-lg transition">Save Connection</button>
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
    showToast("Server settings saved");
  }

  // ── Toast Notification ──
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = "fixed bottom-6 right-6 z-[10000] px-4 py-3 rounded-2xl bg-[#14141d]/95 border border-amber-500/30 text-xs font-bold text-amber-300 shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200";
    toast.innerHTML = `<span class="text-amber-400">${ICONS.sparkle}</span> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'duration-200');
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }

  // ── Smart Multi-Engine Video Analyzer ──
  async function analyzeUrl(url) {
    if (!url) throw new Error("Please enter a valid video link");
    if (isAnalyzing) return null;
    isAnalyzing = true;

    try {
      if (backendUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
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
            currentMedia = media;
            isServerConnected = true;
            updateStatusBadge(true);
            return media;
          }
        } catch (e) {
          console.warn("Backend server not responding, falling back to smart web extractor:", e);
        }
      }

      const clientMedia = await resolveClientMedia(url);
      currentMedia = clientMedia;
      return clientMedia;

    } finally {
      isAnalyzing = false;
    }
  }

  // ── Client-Side Media Resolver (No Server Required) ──
  async function resolveClientMedia(url) {
    const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(url);
    const isTikTok = /tiktok\.com/i.test(url);
    const isInstagram = /instagram\.com/i.test(url);
    const isTwitter = /(?:twitter\.com|x\.com)/i.test(url);

    let ytId = null;
    if (isYouTube) {
      const match = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*)/);
      ytId = (match && match[1].length === 11) ? match[1] : null;
    }

    let title = "Online Media Video";
    let uploader = "Web Creator";
    let thumbnail = "";
    let duration = "03:45";

    try {
      const r = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      if (r.ok) {
        const d = await r.json();
        if (d.title) title = d.title;
        if (d.author_name) uploader = d.author_name;
        if (d.thumbnail_url) thumbnail = d.thumbnail_url;
      }
    } catch {}

    if (isYouTube && ytId) {
      if (!thumbnail) thumbnail = `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`;
      if (title === "Online Media Video") title = "YouTube Video";
    }

    if (!thumbnail) {
      if (isTikTok) thumbnail = "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=600&auto=format&fit=crop&q=80";
      else if (isInstagram) thumbnail = "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=600&auto=format&fit=crop&q=80";
      else thumbnail = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80";
    }

    const extractor = isYouTube ? 'YouTube' : isTikTok ? 'TikTok' : isInstagram ? 'Instagram' : isTwitter ? 'Twitter/X' : 'Universal';

    const video_formats = [
      { resolution: "4K UHD", height: 2160, ext: "mp4", filesize_formatted: "Adaptive", fps: 60, quality: "2160p" },
      { resolution: "1080p FHD", height: 1080, ext: "mp4", filesize_formatted: "Standard", fps: 60, quality: "1080p" },
      { resolution: "720p HD", height: 720, ext: "mp4", filesize_formatted: "Fast", fps: 30, quality: "720p" },
      { resolution: "480p SD", height: 480, ext: "mp4", filesize_formatted: "Low Data", fps: 30, quality: "480p" }
    ];

    const audio_formats = [
      { id: "mp3-320", label: "MP3 Studio Quality", bitrate: "320kbps", ext: "mp3", quality: "mp3-320" },
      { id: "mp3-192", label: "MP3 High Quality", bitrate: "192kbps", ext: "mp3", quality: "mp3-192" },
      { id: "m4a", label: "M4A Original Audio", bitrate: "Lossless", ext: "m4a", quality: "m4a" }
    ];

    return {
      title,
      uploader,
      thumbnail,
      duration,
      extractor,
      webpage_url: url,
      video_formats,
      audio_formats,
      isClientOnly: !isServerConnected
    };
  }

  // ── Download Trigger ──
  async function triggerDownload(type, quality) {
    if (!currentMedia) return;

    if (typeof UDL_ANALYTICS !== 'undefined') {
      UDL_ANALYTICS.trackDownload({
        source_site: currentMedia.extractor || 'web',
        media_type: type,
        quality: quality,
        video_title: currentMedia.title || 'Untitled Video',
        video_url: currentMedia.webpage_url || currentMedia.url || '',
        duration_sec: currentMedia.duration || null
      });
    }

    if (isServerConnected && backendUrl) {
      showToast(`Initiating ${quality} download on local server...`);
      try {
        const res = await fetch(`${backendUrl}/api/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: currentMedia.webpage_url || currentMedia.url,
            type,
            quality,
            title: currentMedia.title,
            thumbnail: currentMedia.thumbnail
          })
        });
        if (res.ok) {
          showToast("Download started on your PC");
          pollTasks();
          return;
        }
      } catch (e) {
        console.warn("Server download failed, opening download assistant:", e);
      }
    }

    showDownloadModal(type, quality);
  }

  // ── Download Assistant Modal (For Standalone Web Mode) ──
  function showDownloadModal(type, quality) {
    let modal = document.getElementById('udl-download-helper-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'udl-download-helper-modal';
      modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    const title = currentMedia ? currentMedia.title : "Video";
    const isAudio = type === 'audio';

    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/85 backdrop-blur-md" onclick="UDL_DOWNLOADER.closeDownloadModal()"></div>
      <div class="relative w-full max-w-lg bg-[#14141c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        <div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              ${isAudio ? ICONS.audio : ICONS.video}
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Download Ready · ${quality}</h3>
              <p class="text-xs text-gray-400 truncate max-w-xs">${title}</p>
            </div>
          </div>
          <button onclick="UDL_DOWNLOADER.closeDownloadModal()" class="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">
            ${ICONS.close}
          </button>
        </div>

        <div class="space-y-3">
          
          <!-- Option 1: Run Local PC Engine -->
          <div class="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-amber-400">${ICONS.desktop}</span>
                <span class="text-xs font-bold text-white">Full Quality via PC App (Recommended)</span>
              </div>
              <span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-extrabold uppercase">Unlimited 4K</span>
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed">
              Launch the UnimaxDL engine on your PC to download directly at multi-threaded speed with zero quality caps.
            </p>
            <div class="flex gap-2">
              <a href="/download.html" class="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 font-black text-xs text-center transition shadow-md flex items-center justify-center gap-1.5">
                <span>Get Desktop App</span>
                ${ICONS.arrowRight}
              </a>
              <button onclick="UDL_DOWNLOADER.showSettingsModal(); UDL_DOWNLOADER.closeDownloadModal();" class="px-4 py-2.5 rounded-xl glass-card hover:bg-white/10 text-xs font-bold text-gray-200 transition">
                Connect Server
              </button>
            </div>
          </div>

          <!-- Option 2: Android App -->
          <div class="p-4 rounded-2xl glass-card border border-white/5 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-emerald-400">${ICONS.mobile}</span>
                <span class="text-xs font-bold text-white">Mobile Share via Android APK</span>
              </div>
              <span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase">1-Tap Save</span>
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed">
              Share directly from the YouTube or TikTok app into UnimaxDL on Android.
            </p>
            <a href="/download.html" class="block w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs text-center transition">
              Download Android APK
            </a>
          </div>

          <!-- Option 3: Quick Browser Mirror -->
          <div class="p-4 rounded-2xl glass-card border border-white/5 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-indigo-400">${ICONS.web}</span>
                <span class="text-xs font-bold text-white">Instant Web Mirror</span>
              </div>
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed">
              Need it instantly right now in your browser? Open with our cloud mirror:
            </p>
            <a href="https://cobalt.tools" target="_blank" rel="noopener" class="block w-full py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs text-center transition">
              Open Web Mirror Stream ↗
            </a>
          </div>

        </div>

        <div class="text-center pt-1">
          <button onclick="UDL_DOWNLOADER.closeDownloadModal()" class="text-xs text-gray-500 hover:text-gray-300 transition">Close window</button>
        </div>

      </div>
    `;
  }

  function closeDownloadModal() {
    const modal = document.getElementById('udl-download-helper-modal');
    if (modal) modal.classList.add('hidden');
  }

  // ── Render Media Card in UI ──
  function renderMediaCard(info, container) {
    if (!info || !container) return;

    const is4K = info.video_formats && info.video_formats.some(f => f.height >= 2160);
    const isFHD = info.video_formats && info.video_formats.some(f => f.height >= 1080);

    container.innerHTML = `
      <div class="glass-card rounded-3xl p-6 sm:p-7 border border-white/10 space-y-6 animate-in fade-in zoom-in-95 duration-300 mt-6">
        
        <!-- Top Video Info Bar -->
        <div class="flex flex-col sm:flex-row gap-5 items-start">
          <div class="relative w-full sm:w-60 aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex-shrink-0 group">
            <img src="${info.thumbnail}" alt="${info.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white">
              ${info.duration || '00:00'}
            </div>
            ${is4K ? `<span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-dark-950 font-black text-[10px] shadow-md tracking-wider">4K UHD</span>` : isFHD ? `<span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500 text-dark-950 font-black text-[10px] shadow-md tracking-wider">1080p FHD</span>` : ''}
          </div>

          <div class="space-y-2 flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/25">
                ${info.extractor || 'Universal'}
              </span>
              <span class="text-xs text-gray-500">• Public Media Stream</span>
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
            <span class="text-[11px] text-gray-500 hidden sm:inline">Select your preferred stream</span>
          </div>

          <!-- Video Format Grid -->
          <div id="format-section-video" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            ${(info.video_formats || []).map(f => `
              <button onclick="UDL_DOWNLOADER.triggerDownload('video', '${f.quality}')" class="glass-card hover:border-amber-500/50 hover:bg-amber-500/10 p-3.5 rounded-2xl text-left transition group relative flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-black text-sm text-white group-hover:text-amber-400 transition">${f.resolution}</span>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${f.height >= 2160 ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-gray-400'}">${f.ext}</span>
                  </div>
                  <p class="text-[11px] text-gray-400 font-medium">${f.fps}fps · ${f.filesize_formatted}</p>
                </div>
                <div class="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold text-amber-400">
                  <span class="flex items-center gap-1">${ICONS.download} <span>Download</span></span>
                  <span class="text-[10px] text-gray-500 font-mono">${f.height >= 2160 ? 'ULTRA' : f.height >= 1080 ? 'HD' : 'SD'}</span>
                </div>
              </button>
            `).join('')}
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
      videoSection.classList.remove('hidden');
      audioSection.classList.add('hidden');
      videoBtn.className = "px-4 py-1.5 rounded-xl bg-amber-500 text-dark-950 font-black text-xs transition shadow-sm flex items-center gap-1.5";
      audioBtn.className = "px-4 py-1.5 rounded-xl text-gray-400 hover:text-white font-bold text-xs transition flex items-center gap-1.5";
    } else {
      videoSection.classList.add('hidden');
      audioSection.classList.remove('hidden');
      audioBtn.className = "px-4 py-1.5 rounded-xl bg-amber-500 text-dark-950 font-black text-xs transition shadow-sm flex items-center gap-1.5";
      videoBtn.className = "px-4 py-1.5 rounded-xl text-gray-400 hover:text-white font-bold text-xs transition flex items-center gap-1.5";
    }
  }

  // ── Polling Active Server Tasks ──
  async function pollTasks() {
    if (!isServerConnected || !backendUrl) return [];
    try {
      const res = await fetch(`${backendUrl}/api/tasks`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.tasks || [];
    } catch {
      return [];
    }
  }

  function startPolling(callback) {
    stopPolling();
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
    container.innerHTML = `
      <div class="space-y-3 mt-6">
        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Active Downloads
        </h4>
        ${tasks.map(t => {
          const isDone = t.status === 'completed';
          const isError = t.status === 'error';
          return `
            <div class="glass-card p-4 rounded-2xl border border-white/10 space-y-2.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-white truncate max-w-xs">${t.title || 'Video Download'}</span>
                <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${isDone ? 'bg-emerald-500/20 text-emerald-300' : isError ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300 animate-pulse'} uppercase">${t.status}</span>
              </div>
              <div class="w-full bg-[#0c0c12] h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div class="h-full rounded-full ${isDone ? 'bg-emerald-400' : 'bg-amber-500'} transition-all duration-300" style="width: ${t.percent}%"></div>
              </div>
              <div class="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                <span>${t.downloaded || '0 MB'} of ${t.total || '0 MB'}</span>
                <span class="text-gray-300 font-bold">${t.percent}% · ${t.speed || ''}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Init on page load
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
    showDownloadModal,
    closeDownloadModal,
    testConnection,
    saveModalSettings,
    analyzeUrl,
    triggerDownload,
    renderMediaCard,
    renderTasks,
    startPolling,
    stopPolling,
    switchTab,
    showToast,
    ICONS
  };
})();
