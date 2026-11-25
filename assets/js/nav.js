/**
 * UniMaxDL Navigation & Theme Interaction Controller v3.0
 * Zero Emojis | Pure SVG | Hardware Accelerated
 */

(function () {
  'use strict';

  // Theme Controller (Archival Paper Light <-> Studio Rack Dark)
  window.toggleTheme = function () {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('udl-theme', nextTheme);
    } catch (e) {}
    updateThemeIcons(nextTheme);
  };

  function updateThemeIcons(theme) {
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      const sun = btn.querySelector('.icon-sun');
      const moon = btn.querySelector('.icon-moon');
      if (sun && moon) {
        if (theme === 'dark') {
          sun.classList.remove('hidden');
          moon.classList.add('hidden');
        } else {
          sun.classList.add('hidden');
          moon.classList.remove('hidden');
        }
      }
    });
  }

  // Initialize theme on load
  document.addEventListener('DOMContentLoaded', function () {
    const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeIcons(activeTheme);
  });

  // Toggle Mobile Navigation Drawer
  window.toggleMobileMenu = function (forceState) {
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-overlay');
    const btn = document.getElementById('mobile-menu-btn');
    if (!drawer || !overlay) return;

    const isClosed = drawer.classList.contains('-translate-x-full');
    const shouldOpen = typeof forceState === 'boolean' ? forceState : isClosed;

    if (shouldOpen) {
      drawer.classList.remove('-translate-x-full');
      overlay.classList.remove('hidden');
      setTimeout(() => overlay.classList.remove('opacity-0'), 10);
      if (btn) btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('overflow-hidden');
    } else {
      drawer.classList.add('-translate-x-full');
      overlay.classList.add('opacity-0');
      setTimeout(() => overlay.classList.add('hidden'), 250);
      if (btn) btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('overflow-hidden');
    }
  };

  // Toggle Desktop Platforms Dropdown
  window.togglePlatformsDropdown = function (event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('platforms-dropdown');
    if (!menu) return;
    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
      menu.classList.remove('hidden');
      setTimeout(() => menu.classList.remove('opacity-0', 'scale-95'), 10);
    } else {
      menu.classList.add('opacity-0', 'scale-95');
      setTimeout(() => menu.classList.add('hidden'), 150);
    }
  };

  // Close menus on Escape or Outside Click
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.toggleMobileMenu(false);
      const menu = document.getElementById('platforms-dropdown');
      if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('opacity-0', 'scale-95');
        setTimeout(() => menu.classList.add('hidden'), 150);
      }
    }
  });

  document.addEventListener('click', function (e) {
    const menu = document.getElementById('platforms-dropdown');
    const btn = document.getElementById('platforms-dropdown-btn');
    if (menu && !menu.classList.contains('hidden')) {
      if (btn && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('opacity-0', 'scale-95');
        setTimeout(() => menu.classList.add('hidden'), 150);
      }
    }
  });
})();
