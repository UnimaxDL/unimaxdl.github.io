/**
 * UnimaxDL Downloader Module
 * Handles: URL analysis, download triggering, progress polling, UI rendering
 * Backend URL is configurable via localStorage or settings modal.
 */

const UDL_DOWNLOADER = (() => {
  const STORAGE_KEY = 'udl_backend_url';
  const DEFAULT_API = '';

  // ── State ──
  let backendUrl = localStorage.getItem(STORAGE_KEY) || DEFAULT_API;
  let currentMedia = null;
  let pollInterval = null;
  let isAnalyzing = false;

  // ── Backend URL Management ──
  function getBackendUrl() {
    return backendUrl;
  }

  function setBackendUrl(url) {
    backendUrl = url.replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEY, backendUrl);
  }

  function hasBackendUrl() {
    return !!backendUrl;
  }

  // ── Settings Modal ──
  function showSettingsModal() {
    if (document.getElementById('udl-settings-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'udl-settings-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="UDL_DOWNLOADER.closeSettingsModal()"></div>
      <div class="relative w-full max-w-md bg-[#13131a]/95 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
        <button onclick="UDL_DOWNLOADER.closeSettingsModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <h3 class="text-xl font-bold text-white mb-2">⚙️ Server Settings</h3>
        <p class="text-gray-400 text-sm mb-5">Configure where UnimaxDL sends download requests.</p>
        
        <div class="space-y-3 mb-5">
          <button onclick="UDL_DOWNLOADER.selectServer('cloud')" class="w-full p-4 rounded-xl border border-white/10 hover:border-amber-500/50 bg-white/5 text-left transition group" id="udl-opt-cloud">
            <div class="flex items-center gap-3">
              <span class="text-2xl">☁️</span>
              <div>
                <div class="text-white font-semibold group-hover:text-amber-400 transition">Cloud API</div>
                <div class="text-gray-500 text-xs">Use api.unimaxdl.com (may have limits)</div>
              </div>
            </div>
          </button>
          <button onclick="UDL_DOWNLOADER.selectServer('local')" class="w-full p-4 rounded-xl border border-white/10 hover:border-indigo-500/50 bg-white/5 text-left transition group" id="udl-opt-local">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🖥️</span>
              <div>
                <div class="text-white font-semibold group-hover:text-indigo-400 transition">Local Server</div>
                <div class="text-gray-500 text-xs">Run your own server for unlimited downloads</div>
              </div>
            </div>
          </button>
        </div>

        <div id="udl-custom-url-box" class="hidden mb-4">
          <label class="block text-sm text-gray-400 mb-1.5">Server URL</label>
          <input type="url" id="udl-custom-url" placeholder="http://localhost:8000" value="${backendUrl}"
            class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-sm" />
        </div>

        <button onclick="UDL_DOWNLOADER.saveSettings()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold hover:from-amber-400 hover:to-amber-500 transition text-sm">
          Save & Connect
        </button>
        <p class="text-center text-gray-600 text-xs mt-3">Your data never leaves your device. 100% private.</p>
      </div>
    `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('opacity-100'));
  }

  function closeSettingsModal() {
    const modal = document.getElementById('udl-settings-modal');
    if (modal) modal.remove();
  }

  let selectedServerType = '';

  function selectServer(type) {
    selectedServerType = type;
    const customBox = document.getElementById('udl-custom-url-box');
    const urlInput = document.getElementById('udl-custom-url');
    const cloudBtn = document.getElementById('udl-opt-cloud');
    const localBtn = document.getElementById('udl-opt-local');

    cloudBtn.classList.toggle('border-amber-500/60', type === 'cloud');
    cloudBtn.classList.toggle('bg-amber-500/10', type === 'cloud');
    localBtn.classList.toggle('border-indigo-500/60', type === 'local');
    localBtn.classList.toggle('bg-indigo-500/10', type === 'local');

    if (type === 'cloud') {
      customBox.classList.add('hidden');
    } else {
      customBox.classList.remove('hidden');
      urlInput.value = backendUrl || 'http://localhost:8000';
      urlInput.focus();
    }
  }

  function saveSettings() {
    if (selectedServerType === 'cloud') {
      setBackendUrl('https://api.unimaxdl.com');
    } else if (selectedServerType === 'local') {
      const url = document.getElementById('udl-custom-url').value.trim();
      if (!url) return;
      setBackendUrl(url);
    }
    closeSettingsModal();
    updateSettingsIndicator();
  }

  function updateSettingsIndicator() {
    const el = document.getElementById('udl-server-status');
    if (!el) return;
    if (hasBackendUrl()) {
      const isLocal = backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1');
      el.innerHTML = `<span class="inline-flex items-center gap-1.5 text-xs"><span class="w-1.5 h-1.5 rounded-full ${isLocal ? 'bg-indigo-400' : 'bg-emerald-400'} animate-pulse"></span><span class="text-gray-400">${isLocal ? 'Local' : 'Cloud'}</span></span>`;
    } else {
      el.innerHTML = `<span class="text-xs text-red-400">Not connected</span>`;
    }
  }

  // ── API Calls ──
  async function analyzeUrl(url) {
    if (!hasBackendUrl()) {
      showSettingsModal();
      return null;
    }
    if (isAnalyzing) return null;
    isAnalyzing = true;

    try {
      const res = await fetch(`${backendUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      currentMedia = data;
      return data;
    } catch (err) {
      console.error('Analyze failed:', err);
      throw err;
    } finally {
      isAnalyzing = false;
    }
  }

  async function triggerDownload(type, quality) {
    if (!hasBackendUrl() || !currentMedia) return null;

    try {
      if (typeof UDL_ANALYTICS !== 'undefined') {
        UDL_ANALYTICS.trackDownload(currentMedia.extractor || 'unknown', type, quality);
      }

      const res = await fetch(`${backendUrl}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: currentMedia.url || currentMedia.webpage_url,
          type,
          quality,
          title: currentMedia.title,
          thumbnail: currentMedia.thumbnail
        })
      });

      if (!res.ok) throw new Error(`Download error: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Download failed:', err);
      throw err;
    }
  }

  async function pollTasks() {
    if (!hasBackendUrl()) return [];
    try {
      const res = await fetch(`${backendUrl}/api/tasks`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  function startPolling(callback) {
    stopPolling();
    pollInterval = setInterval(async () => {
      const tasks = await pollTasks();
      if (callback) callback(tasks);
    }, 1500);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  // ── UI Rendering ──
  function renderMediaCard(info, container) {
    if (!info || !container) return;
    currentMedia = info;

    const duration = info.duration ? formatDuration(info.duration) : '';
    const thumbnail = info.thumbnail || '';
    const title = info.title || 'Unknown';
    const uploader = info.uploader || info.channel || '';

    // Build formats
    const videoFormats = [];
    const audioFormats = [];

    if (info.formats && info.formats.length) {
      const seenVideo = new Set();
      const seenAudio = new Set();
      info.formats.forEach(f => {
        if (f.vcodec && f.vcodec !== 'none' && f.height) {
          const label = `${f.height}p`;
          if (!seenVideo.has(label)) {
            seenVideo.add(label);
            videoFormats.push({ label, quality: f.height + 'p', ext: f.ext || 'mp4' });
          }
        } else if (f.acodec && f.acodec !== 'none' && f.abr) {
          const label = `${Math.round(f.abr)}kbps`;
          if (!seenAudio.has(label)) {
            seenAudio.add(label);
            audioFormats.push({ label, quality: Math.round(f.abr) + 'k', ext: f.ext || 'mp3' });
          }
        }
      });
    }

    // Fallback defaults
    if (!videoFormats.length) {
      ['2160p', '1440p', '1080p', '720p', '480p', '360p'].forEach(q => {
        videoFormats.push({ label: q, quality: q, ext: 'mp4' });
      });
    }
    if (!audioFormats.length) {
      ['320kbps', '256kbps', '192kbps', '128kbps'].forEach(q => {
        audioFormats.push({ label: q, quality: q.replace('kbps', 'k'), ext: 'mp3' });
      });
    }

    // Sort by quality descending
    videoFormats.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
    audioFormats.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Media Info -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
          ${thumbnail ? `<div class="sm:w-52 flex-shrink-0 rounded-xl overflow-hidden border border-white/10">
            <img src="${thumbnail}" alt="${title}" class="w-full h-auto object-cover" loading="lazy" />
          </div>` : ''}
          <div class="flex-1 min-w-0">
            <h3 class="text-white font-bold text-lg leading-snug mb-1 line-clamp-2">${escapeHtml(title)}</h3>
            ${uploader ? `<p class="text-gray-400 text-sm mb-2">${escapeHtml(uploader)}</p>` : ''}
            ${duration ? `<span class="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-md"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${duration}</span>` : ''}
          </div>
        </div>

        <!-- Video Formats -->
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            Video
          </h4>
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
            ${videoFormats.map(f => `
              <button onclick="UDL_DOWNLOADER.triggerDownload('video', '${f.quality}')" 
                class="udl-format-btn group relative px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:border-amber-500/50 hover:bg-amber-500/10 text-center transition-all duration-200">
                <span class="text-white text-sm font-semibold group-hover:text-amber-400 transition">${f.label}</span>
                <span class="block text-[10px] text-gray-500 uppercase">${f.ext}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Audio Formats -->
        <div>
          <h4 class="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
            Audio
          </h4>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${audioFormats.map(f => `
              <button onclick="UDL_DOWNLOADER.triggerDownload('audio', '${f.quality}')"
                class="udl-format-btn group px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-center transition-all duration-200">
                <span class="text-white text-sm font-semibold group-hover:text-indigo-400 transition">${f.label}</span>
                <span class="block text-[10px] text-gray-500 uppercase">${f.ext}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderTasks(tasks, container) {
    if (!tasks || !tasks.length || !container) {
      if (container) container.innerHTML = '';
      return;
    }

    container.innerHTML = tasks.map(task => {
      const progress = task.progress || 0;
      const status = task.status || 'pending';
      const title = task.title || 'Download';
      const statusColors = {
        pending: 'text-gray-400',
        downloading: 'text-amber-400',
        processing: 'text-indigo-400',
        done: 'text-emerald-400',
        error: 'text-red-400'
      };
      const barColors = {
        pending: 'bg-gray-600',
        downloading: 'bg-amber-500',
        processing: 'bg-indigo-500',
        done: 'bg-emerald-500',
        error: 'bg-red-500'
      };

      return `
        <div class="bg-white/5 border border-white/10 rounded-xl p-4 mb-3 animate-fade-in">
          <div class="flex items-center justify-between mb-2">
            <span class="text-white text-sm font-medium truncate max-w-[70%]">${escapeHtml(title)}</span>
            <span class="text-xs font-mono ${statusColors[status] || 'text-gray-400'} capitalize">${status}</span>
          </div>
          <div class="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div class="${barColors[status] || 'bg-gray-600'} h-full rounded-full transition-all duration-300 ease-out" style="width: ${progress}%"></div>
          </div>
          ${task.speed ? `<p class="text-[10px] text-gray-500 mt-1.5 font-mono">${task.speed} • ${progress}%</p>` : `<p class="text-[10px] text-gray-500 mt-1.5 font-mono">${progress}%</p>`}
          ${status === 'done' && task.download_url ? `<a href="${task.download_url}" class="inline-flex items-center gap-1 mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition" download>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Save File
          </a>` : ''}
        </div>
      `;
    }).join('');
  }

  // ── Helpers ──
  function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Init on load
  document.addEventListener('DOMContentLoaded', () => {
    updateSettingsIndicator();
  });

  return {
    getBackendUrl,
    setBackendUrl,
    hasBackendUrl,
    showSettingsModal,
    closeSettingsModal,
    selectServer,
    saveSettings,
    updateSettingsIndicator,
    analyzeUrl,
    triggerDownload,
    pollTasks,
    startPolling,
    stopPolling,
    renderMediaCard,
    renderTasks,
    get currentMedia() { return currentMedia; }
  };
})();
