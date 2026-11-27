/**
 * UnimaxDL Prism Studio — Navigation, Theme, Stageshow & Extractor Glue v5.0
 * Zero Dependencies | Zero Emojis | DOM-CONTRACT Preserved
 */

(function () {
  'use strict';

  let lastDrawerTrigger = null;

  function syncThemeColorMeta(theme) {
    const color = theme === 'dark' ? '#0A0E15' : '#F5F6FA';
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }

  function updateThemeUI(theme) {
    const isDark = theme === 'dark';
    document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('aria-pressed', String(isDark));
      const label = btn.querySelector('.theme-toggle-label');
      if (label) {
        label.textContent = isDark ? 'Dark' : 'Light';
      }
    });
    syncThemeColorMeta(theme);
  }

  window.toggleTheme = function () {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('udl-theme', nextTheme);
    } catch (e) {}
    updateThemeUI(nextTheme);
  };

  window.toggleMobileMenu = function (forceState) {
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-overlay');
    const btn = document.getElementById('mobile-menu-btn');
    if (!drawer || !overlay) return;

    const isOpen = drawer.classList.contains('is-open');
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
    if (shouldOpen === isOpen) return;

    if (shouldOpen) {
      lastDrawerTrigger = document.activeElement;
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('overflow-hidden');
      const closeBtn = drawer.querySelector('button');
      if (closeBtn) closeBtn.focus();
    } else {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('overflow-hidden');
      if (lastDrawerTrigger && typeof lastDrawerTrigger.focus === 'function') {
        lastDrawerTrigger.focus();
        lastDrawerTrigger = null;
      }
    }
  };

  window.togglePlatformsDropdown = function (event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('platforms-dropdown');
    const btn = document.getElementById('platforms-dropdown-btn');
    if (!menu) return;

    menu.classList.remove('hidden');
    const isOpen = menu.classList.contains('is-open');
    if (isOpen) {
      menu.classList.remove('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    } else {
      menu.classList.add('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    }
  };

  function closePlatformsDropdown() {
    const menu = document.getElementById('platforms-dropdown');
    const btn = document.getElementById('platforms-dropdown-btn');
    if (menu && menu.classList.contains('is-open')) {
      menu.classList.remove('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  }

  // Live Platform URL Detector for Omnibox & Platform Chips
  function detectPlatformFromUrl(url) {
    const u = String(url || '').toLowerCase();
    if (u.includes('youtube.com') || u.includes('youtu.be')) return { id: 'youtube', label: 'YT' };
    if (u.includes('tiktok.com')) return { id: 'tiktok', label: 'TT' };
    if (u.includes('instagram.com')) return { id: 'instagram', label: 'IG' };
    if (u.includes('reddit.com') || u.includes('redd.it')) return { id: 'reddit', label: 'RD' };
    if (u.includes('twitter.com') || u.includes('x.com')) return { id: 'twitter', label: 'X' };
    if (u.includes('soundcloud.com')) return { id: 'soundcloud', label: 'SC' };
    if (u.includes('twitch.tv')) return { id: 'twitch', label: 'TW' };
    if (u.includes('facebook.com') || u.includes('fb.watch')) return { id: 'facebook', label: 'FB' };
    if (u.includes('pinterest.')) return { id: 'pinterest', label: 'PN' };
    return null;
  }

  function syncUrlInputUI() {
    const urlInput = document.getElementById('url-input');
    const clearBtn = document.getElementById('clear-btn');
    const sourceBadge = document.getElementById('udl-source-badge');
    if (!urlInput) return;

    const val = urlInput.value.trim();
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', val.length === 0);
    }

    const detected = detectPlatformFromUrl(val);
    if (sourceBadge) {
      sourceBadge.textContent = detected ? detected.label : 'URL';
      sourceBadge.setAttribute('data-detected', detected ? detected.id : 'none');
    }

    document.querySelectorAll('.platform-chip[data-platform]').forEach((chip) => {
      chip.classList.toggle('is-active', Boolean(detected && chip.dataset.platform === detected.id));
    });
  }

  // Extractor Global Handlers (Preserved across all HTML pages)
  window.clearInput = function () {
    const urlInput = document.getElementById('url-input');
    if (!urlInput) return;
    urlInput.value = '';
    syncUrlInputUI();
    urlInput.focus();
  };

  window.pasteClipboard = async function () {
    const urlInput = document.getElementById('url-input');
    try {
      const text = await navigator.clipboard.readText();
      if (text && urlInput) {
        urlInput.value = text.trim();
        syncUrlInputUI();
        window.handleAnalyze();
      } else if (urlInput) {
        urlInput.focus();
      }
    } catch (err) {
      if (typeof UDL_DOWNLOADER !== 'undefined') {
        UDL_DOWNLOADER.showToast('Clipboard access was blocked. Paste the link manually with Ctrl+V.');
      }
      if (urlInput) urlInput.focus();
    }
  };

  window.setSample = function (url) {
    const urlInput = document.getElementById('url-input');
    if (!urlInput) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    urlInput.value = url;
    syncUrlInputUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.handleAnalyze();
  };

  window.handleAnalyze = async function () {
    const urlInput = document.getElementById('url-input');
    const url = urlInput ? urlInput.value.trim() : '';
    const mediaContainer = document.getElementById('media-card-container');
    const skeleton = document.getElementById('loading-skeleton');
    const stageshow = document.getElementById('udl-stageshow-preview');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');

    if (!url) {
      if (typeof UDL_DOWNLOADER !== 'undefined') {
        UDL_DOWNLOADER.showToast('Paste a video or audio link first.');
      }
      if (urlInput) urlInput.focus();
      return;
    }

    if (stageshow) stageshow.classList.add('hidden');
    if (btnText) btnText.textContent = 'Checking...';
    if (spinner) spinner.classList.remove('hidden');
    if (skeleton) skeleton.classList.remove('hidden');
    if (mediaContainer) mediaContainer.innerHTML = '';

    try {
      const info = await UDL_DOWNLOADER.analyzeUrl(url);
      if (skeleton) skeleton.classList.add('hidden');
      if (info && mediaContainer) {
        UDL_DOWNLOADER.renderMediaCard(info, mediaContainer);
        if (window.udlPreferredTab === 'audio') {
          UDL_DOWNLOADER.switchTab('audio');
        }
        mediaContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      if (skeleton) skeleton.classList.add('hidden');
      if (stageshow && mediaContainer && !mediaContainer.innerHTML.trim()) {
        stageshow.classList.remove('hidden');
      }
      if (typeof UDL_DOWNLOADER !== 'undefined') {
        UDL_DOWNLOADER.showToast((err && err.message) || 'Could not inspect this link. Check the URL and try again.');
      }
    } finally {
      if (btnText) btnText.textContent = 'Get Formats';
      if (spinner) spinner.classList.add('hidden');
    }
  };

  // Interactive Stageshow Example Controller
  const STAGESHOW_SCENARIOS = {
    youtube: {
      sampleUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      mode: 'wide',
      title: 'Big Buck Bunny 60fps 4K — Blender Short',
      source: 'YouTube Video',
      durationSec: 634,
      videoTitle: '1080p MP4 Ready',
      videoSub: '4K HDR available via free Native App',
      videoBadge: '1080p + 4K',
      audioTitle: '320k MP3 Audio',
      audioSub: 'Clean studio audio extraction included',
      audioBadge: '320kbps',
      caption: 'YouTube links unlock HD browser saves plus native 4K 60fps in the free app.'
    },
    tiktok: {
      sampleUrl: 'https://www.tiktok.com/@scout2015/video/6718335390845095173',
      mode: 'vertical',
      title: 'Street Skate Edit — 60fps Vertical',
      source: 'TikTok Clean',
      durationSec: 38,
      videoTitle: 'Watermark Removed',
      videoSub: 'Clean 1080x1920 vertical MP4 without overlay',
      videoBadge: 'No Watermark',
      audioTitle: 'Original Sound Track',
      audioSub: 'Save background sound directly as MP3',
      audioBadge: 'MP3 Ready',
      caption: 'TikTok clips strip the corner logo automatically cleanly at 9:16 portrait ratio.'
    },
    reddit: {
      sampleUrl: 'https://www.reddit.com/r/Blender/comments/101v4d5/',
      mode: 'wide',
      title: 'Blender Open Movie Breakdown Clip',
      source: 'Reddit Clip',
      durationSec: 74,
      videoTitle: 'Sound + Video Merged',
      videoSub: 'Combines split DASH video and audio into one MP4',
      videoBadge: 'Auto Merged',
      audioTitle: 'Synchronized AAC Track',
      audioSub: 'Never downloads a silent Reddit video file',
      audioBadge: 'Synced',
      caption: 'Reddit stores video and audio separately; UnimaxDL merges both streams for you.'
    },
    soundcloud: {
      sampleUrl: 'https://soundcloud.com/forss/flickermood',
      mode: 'audio',
      title: 'Flickermood by Forss',
      source: 'SoundCloud Track',
      durationSec: 198,
      videoTitle: 'Audio-Only Source',
      videoSub: 'Cover artwork and track tags preserved cleanly',
      videoBadge: 'Track Art',
      audioTitle: '320k Studio MP3 Ready',
      audioSub: 'Direct high-bitrate MP3 and lossless M4A export',
      audioBadge: '320k MP3',
      caption: 'SoundCloud URLs prioritize clean 320kbps MP3 export with embedded metadata.'
    }
  };

  let activeScenarioKey = 'youtube';

  function formatMmSs(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${rem < 10 ? '0' : ''}${rem}`;
  }

  function renderStageshowScenario(key) {
    const deck = document.getElementById('udl-stageshow-preview');
    if (!deck) return;
    const data = STAGESHOW_SCENARIOS[key] || STAGESHOW_SCENARIOS.youtube;
    activeScenarioKey = key;

    deck.querySelectorAll('.stageshow-tab').forEach((tab) => {
      const isMatch = tab.dataset.scenario === key;
      tab.classList.toggle('is-active', isMatch);
      tab.setAttribute('aria-selected', String(isMatch));
    });

    const artEl = document.getElementById('udl-stageshow-art');
    const rangeEl = document.getElementById('udl-stageshow-range');
    const timeEl = document.getElementById('udl-stageshow-timecode');
    const vTitle = document.getElementById('udl-stage-v-title');
    const vSub = document.getElementById('udl-stage-v-sub');
    const vBadge = document.getElementById('udl-stage-v-badge');
    const aTitle = document.getElementById('udl-stage-a-title');
    const aSub = document.getElementById('udl-stage-a-sub');
    const aBadge = document.getElementById('udl-stage-a-badge');
    const captionEl = document.getElementById('udl-stage-caption');

    if (artEl) {
      if (data.mode === 'vertical') {
        artEl.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:center; gap:16px; width:100%;">
            <div class="specimen-scene-vertical">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4" fill="#00D4FF" fill-opacity="0.22"/></svg>
              <span style="font-size:0.75rem; font-weight:700; color:#F8FAFC; text-align:center;">9:16 Clean</span>
              <span style="font-size:0.6875rem; color:#22D3EE;">Zero Logo</span>
            </div>
            <div style="min-width:0;">
              <div style="font-size:0.75rem; font-weight:700; color:#22D3EE; margin-bottom:2px;">${data.source}</div>
              <div style="font-size:0.9375rem; font-weight:700; color:#FFFFFF;">${data.title}</div>
              <div style="font-size:0.75rem; color:#94A3B8; margin-top:4px;">1080 x 1920 Portrait MP4</div>
            </div>
          </div>
        `;
      } else if (data.mode === 'audio') {
        artEl.innerHTML = `
          <div class="specimen-scene-wide">
            <div class="specimen-eq-bars" aria-hidden="true">
              <div class="specimen-eq-bar"></div>
              <div class="specimen-eq-bar"></div>
              <div class="specimen-eq-bar"></div>
              <div class="specimen-eq-bar"></div>
              <div class="specimen-eq-bar"></div>
              <div class="specimen-eq-bar"></div>
              <div class="specimen-eq-bar"></div>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.75rem; font-weight:700; color:#FBBF24; margin-bottom:2px;">${data.source}</div>
              <div style="font-size:0.9375rem; font-weight:700; color:#FFFFFF;">${data.title}</div>
              <div style="font-size:0.75rem; color:#94A3B8; margin-top:4px;">320kbps Stereo MP3 / Lossless M4A</div>
            </div>
          </div>
        `;
      } else {
        artEl.innerHTML = `
          <div class="specimen-scene-wide">
            <div style="display:flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:14px; background:rgba(0,212,255,0.12); border:1px solid rgba(0,212,255,0.35); flex-shrink:0;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4" fill="#00D4FF" fill-opacity="0.25"/></svg>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.75rem; font-weight:700; color:#22D3EE; margin-bottom:2px;">${data.source}</div>
              <div style="font-size:0.9375rem; font-weight:700; color:#FFFFFF; line-height:1.3;">${data.title}</div>
              <div style="font-size:0.75rem; color:#94A3B8; margin-top:4px;">16:9 Widescreen · Clean Audio &amp; Video</div>
            </div>
          </div>
        `;
      }
    }

    if (rangeEl) {
      rangeEl.max = String(data.durationSec);
      const startSec = Math.floor(data.durationSec * 0.28);
      rangeEl.value = String(startSec);
      if (timeEl) {
        timeEl.textContent = `${formatMmSs(startSec)} / ${formatMmSs(data.durationSec)}`;
      }
    }

    if (vTitle) vTitle.textContent = data.videoTitle;
    if (vSub) vSub.textContent = data.videoSub;
    if (vBadge) vBadge.textContent = data.videoBadge;
    if (aTitle) aTitle.textContent = data.audioTitle;
    if (aSub) aSub.textContent = data.audioSub;
    if (aBadge) aBadge.textContent = data.audioBadge;
    if (captionEl) captionEl.textContent = data.caption;
  }

  function initStageshowPreview() {
    const deck = document.getElementById('udl-stageshow-preview');
    if (!deck) return;

    deck.querySelectorAll('.stageshow-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.scenario || 'youtube';
        renderStageshowScenario(key);
      });
    });

    const rangeEl = document.getElementById('udl-stageshow-range');
    const timeEl = document.getElementById('udl-stageshow-timecode');
    if (rangeEl && timeEl) {
      rangeEl.addEventListener('input', () => {
        const data = STAGESHOW_SCENARIOS[activeScenarioKey] || STAGESHOW_SCENARIOS.youtube;
        timeEl.textContent = `${formatMmSs(Number(rangeEl.value))} / ${formatMmSs(data.durationSec)}`;
      });
    }

    const tryBtn = document.getElementById('udl-try-sample-btn');
    if (tryBtn) {
      tryBtn.addEventListener('click', () => {
        const data = STAGESHOW_SCENARIOS[activeScenarioKey] || STAGESHOW_SCENARIOS.youtube;
        window.setSample(data.sampleUrl);
      });
    }

    renderStageshowScenario('youtube');
  }

  // Escape & '/' shortcut
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.toggleMobileMenu(false);
      closePlatformsDropdown();
      if (typeof UDL_DOWNLOADER !== 'undefined') {
        UDL_DOWNLOADER.close4KModal();
        UDL_DOWNLOADER.closeSettingsModal();
        UDL_DOWNLOADER.closeDownloadModal();
      }
      if (typeof window.toggleQrModal === 'function') {
        window.toggleQrModal(false);
      }
    }

    const active = document.activeElement;
    const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (!isInput && e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const urlInput = document.getElementById('url-input');
      if (urlInput) {
        e.preventDefault();
        urlInput.focus();
        urlInput.select();
      }
    }
  });

  document.addEventListener('click', function (e) {
    const menu = document.getElementById('platforms-dropdown');
    const btn = document.getElementById('platforms-dropdown-btn');
    if (menu && menu.classList.contains('is-open')) {
      if (btn && !btn.contains(e.target) && !menu.contains(e.target)) {
        closePlatformsDropdown();
      }
    }
  });

  function initNavAndExtractor() {
    const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeUI(activeTheme);

    const dropdown = document.getElementById('platforms-dropdown');
    if (dropdown) {
      dropdown.classList.remove('hidden');
    }

    const path = window.location.pathname.replace(/\/$/, '') || '/index.html';
    document.querySelectorAll('.channel-tab, .nav-links > a').forEach((tab) => {
      const href = tab.getAttribute('href');
      if (href && (path === href || (href === '/' && (path === '' || path === '/index.html')))) {
        tab.classList.add('active');
      }
    });

    const urlInput = document.getElementById('url-input');
    if (urlInput) {
      urlInput.addEventListener('input', syncUrlInputUI);
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.handleAnalyze();
        }
      });
      syncUrlInputUI();
    }

    const analyzeBtn = document.getElementById('btn-analyze');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', (e) => {
        if (!analyzeBtn.getAttribute('onclick')) {
          e.preventDefault();
          window.handleAnalyze();
        }
      });
    }

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn && !clearBtn.getAttribute('onclick')) {
      clearBtn.addEventListener('click', window.clearInput);
    }

    const pasteBtn = document.getElementById('udl-paste-btn');
    if (pasteBtn && !pasteBtn.getAttribute('onclick')) {
      pasteBtn.addEventListener('click', window.pasteClipboard);
    }

    initStageshowPreview();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavAndExtractor);
  } else {
    initNavAndExtractor();
  }
})();
