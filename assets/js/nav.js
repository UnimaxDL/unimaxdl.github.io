/**
 * UniMaxDL Navigation, Theme & Keyboard Controller v4.1
 * Zero Tailwind Dependency | Zero Emojis | Tactile Studio Utility
 */

(function () {
  'use strict';

  function updateThemeUI(theme) {
    const isLight = theme === 'light';
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      const label = btn.querySelector('.theme-toggle-label');
      if (label) {
        label.textContent = isLight ? 'LIGHT' : 'DARK';
      }
    });
  }

  window.toggleTheme = function () {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
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

    if (shouldOpen) {
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('overflow-hidden');
    } else {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('overflow-hidden');
    }
  };

  window.togglePlatformsDropdown = function (event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('platforms-dropdown');
    const btn = document.getElementById('platforms-dropdown-btn');
    if (!menu) return;

    const isOpen = menu.classList.contains('is-open');
    if (isOpen) {
      menu.classList.remove('is-open');
      menu.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    } else {
      menu.classList.remove('hidden');
      menu.classList.add('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    }
  };

  // Close menus on Escape or Outside Click
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.toggleMobileMenu(false);
      const menu = document.getElementById('platforms-dropdown');
      const btn = document.getElementById('platforms-dropdown-btn');
      if (menu && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        menu.classList.add('hidden');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
      if (typeof UDL_DOWNLOADER !== 'undefined') {
        UDL_DOWNLOADER.close4KModal();
        UDL_DOWNLOADER.closeSettingsModal();
        UDL_DOWNLOADER.closeDownloadModal();
      }
    }

    // Keyboard shortcut: / focuses URL input
    const active = document.activeElement;
    const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (!isInput && e.key === '/') {
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
        menu.classList.remove('is-open');
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
      }
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeUI(activeTheme);

    const path = window.location.pathname.replace(/\/$/, '') || '/index.html';
    document.querySelectorAll('.channel-tab').forEach(tab => {
      const href = tab.getAttribute('href');
      if (href && (path === href || path.endsWith(href))) {
        tab.classList.add('active');
      }
    });
  });
})();
