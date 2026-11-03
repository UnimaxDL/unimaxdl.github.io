/**
 * UnimaxDL Analytics Module (v1.3.0)
 * ─────────────────────────────────────────────────────────────
 * Tracks anonymous visitor metrics and download events:
 * - Persistent anonymous user ID (localStorage)
 * - Session tracking (sessionStorage)
 * - Download logs: video title, source URL, platform, resolution, format
 * - Direct ingestion into Supabase PostgreSQL REST API.
 * ─────────────────────────────────────────────────────────────
 */

const UDL_ANALYTICS = (() => {
  // Replace these with your Supabase Project credentials:
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

  function getUserId() {
    try {
      let uid = localStorage.getItem('udl_uid');
      if (!uid) {
        uid = 'usr_' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
        localStorage.setItem('udl_uid', uid);
      }
      return uid;
    } catch (e) {
      return 'usr_guest';
    }
  }

  function getSessionId() {
    try {
      let sid = sessionStorage.getItem('udl_sid');
      if (!sid) {
        sid = 'ses_' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
        sessionStorage.setItem('udl_sid', sid);
      }
      return sid;
    } catch (e) {
      return 'ses_guest';
    }
  }

  const USER_ID = getUserId();
  const SESSION_ID = getSessionId();

  async function postToSupabase(table, payload) {
    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      // Analytics unconfigured or offline — silent pass
      return;
    }
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // Fire-and-forget: never disrupt the user's download experience
    }
  }

  // Track visit / page view
  async function trackVisit() {
    return postToSupabase('user_visits', {
      user_id: USER_ID,
      session_id: SESSION_ID,
      platform: 'web',
      page: window.location.pathname || '/',
      referrer: document.referrer || '',
      user_agent: navigator.userAgent || ''
    });
  }

  // Track download event
  async function trackDownload(data = {}) {
    return postToSupabase('download_events', {
      user_id: USER_ID,
      session_id: SESSION_ID,
      platform: data.platform || 'web',
      source_site: data.source_site || 'unknown',
      media_type: data.media_type || 'video',
      quality: data.quality || 'default',
      video_title: data.video_title || 'Untitled',
      video_url: data.video_url || '',
      duration_sec: data.duration_sec || null,
      page: window.location.pathname || '/',
      referrer: document.referrer || '',
      user_agent: navigator.userAgent || ''
    });
  }

  // Track app installation clicks
  async function trackAppInstall(os) {
    return postToSupabase('user_visits', {
      user_id: USER_ID,
      session_id: SESSION_ID,
      platform: 'web',
      page: `/download.html#${os}`,
      referrer: document.referrer || '',
      user_agent: navigator.userAgent || ''
    });
  }

  // Auto-record page view on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackVisit);
  } else {
    trackVisit();
  }

  return {
    USER_ID,
    SESSION_ID,
    trackVisit,
    trackDownload,
    trackAppInstall,
    setCredentials(url, key) {
      // Dynamically configurable if injected via environment
    }
  };
})();
