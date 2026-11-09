/**
 * UnimaxDL Navigation & UI Interaction Controller v2.0
 * Zero Emojis | Pure SVG | Hardware Accelerated
 */

(function () {
  'use strict';

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
