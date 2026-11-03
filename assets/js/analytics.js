/**
 * UnimaxDL Analytics Module
 * Tracks: page views, downloads, app installs (anonymous, privacy-first)
 * All data is sent to Supabase REST API. No cookies, no fingerprinting.
 */

const UDL_ANALYTICS = (() => {
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

  function getSessionId() {
    let sid = sessionStorage.getItem('udl_sid');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('udl_sid', sid);
    }
    return sid;
  }

  const SESSION_ID = getSessionId();

  async function trackEvent(event, data = {}) {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          event_type: event,
          platform: 'web',
          session_id: SESSION_ID,
          page: window.location.pathname,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          ...data
        })
      });
    } catch (e) { /* silent fail */ }
  }

  async function trackDownload(platform, format, quality) {
    return trackEvent('download', { platform, format, quality });
  }

  async function trackAppInstall(os) {
    return trackEvent('app_install', { os });
  }

  // Auto-track page view on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => trackEvent('page_view'));
  } else {
    trackEvent('page_view');
  }

  return { trackEvent, trackDownload, trackAppInstall, getSessionId, SESSION_ID };
})();
