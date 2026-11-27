/**
 * UnimaxDL Edge Metadata Resolver — Free Tier Cloudflare Worker (100,000 req/day)
 * Deploy once with: npx wrangler deploy
 * Set the resulting *.workers.dev URL into assets/data/mirrors.json ("edgeResolver").
 */

const ALLOWED_ORIGIN_RE = /^https:\/\/unimaxdl\.github\.io$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const ALLOWED_MEDIA_HOST_RE = /(?:^|\.)(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|reddit\.com|redd\.it|twitter\.com|x\.com|soundcloud\.com|twitch\.tv|facebook\.com|fb\.watch|pinterest\.com|vimeo\.com)$/i;

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGIN_RE.test(origin) ? origin : 'https://unimaxdl.github.io';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

function extractMeta(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
  const rev = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i');
  const m = html.match(re) || html.match(rev);
  return m ? m[1] : null;
}

export default {
  async fetch(request, env, ctx) {
    const urlObj = new URL(request.url);
    const headers = corsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (urlObj.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'unimaxdl-edge' }), { status: 200, headers });
    }

    if (urlObj.pathname !== '/resolve') {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
    }

    const rawTarget = urlObj.searchParams.get('url') || '';
    let parsedTarget;
    try {
      parsedTarget = new URL(rawTarget);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid target URL' }), { status: 400, headers });
    }

    if (parsedTarget.protocol !== 'https:' && parsedTarget.protocol !== 'http:') {
      return new Response(JSON.stringify({ error: 'Unsupported protocol' }), { status: 400, headers });
    }

    if (!ALLOWED_MEDIA_HOST_RE.test(parsedTarget.hostname)) {
      return new Response(JSON.stringify({ error: 'Host not in supported media allowlist' }), { status: 403, headers });
    }

    const cache = caches.default;
    const cacheKey = new Request(urlObj.toString(), { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    try {
      const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(parsedTarget.toString())}`, {
        cf: { cacheTtl: 1800 }
      });
      if (noembedRes.ok) {
        const data = await noembedRes.json();
        if (data && data.title) {
          const out = new Response(
            JSON.stringify({
              title: data.title,
              author: data.author_name || null,
              image: data.thumbnail_url || null,
              source: 'noembed'
            }),
            { status: 200, headers: { ...headers, 'Cache-Control': 'public, max-age=1800' } }
          );
          ctx.waitUntil(cache.put(cacheKey, out.clone()));
          return out;
        }
      }

      const pageRes = await fetch(parsedTarget.toString(), {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UnimaxDLEdge/1.0)' },
        redirect: 'follow',
        cf: { cacheTtl: 900 }
      });
      const html = (await pageRes.text()).slice(0, 120000);
      const title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title');
      const image = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image');
      const author = extractMeta(html, 'og:site_name') || parsedTarget.hostname.replace(/^www\./, '');

      const out = new Response(
        JSON.stringify({ title, author, image, source: 'og-edge' }),
        { status: 200, headers: { ...headers, 'Cache-Control': 'public, max-age=900' } }
      );
      ctx.waitUntil(cache.put(cacheKey, out.clone()));
      return out;
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Upstream metadata fetch failed' }), { status: 502, headers });
    }
  }
};
