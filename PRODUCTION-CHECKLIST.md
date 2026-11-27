# UnimaxDL Production Operations Checklist ($0 Tier)

All repository code, installers, SEO metadata, failover wiring, CI verification, and trimmed GitHub Pages packaging are configured. Complete the external dashboard steps below (each strictly on $0 free tiers) to finalize live cloud services.

## 1. Cloudflare Worker Edge Resolver ($0 - 100,000 requests/day)
Deploy `workers/edge-resolver.js` as a dedicated metadata resolver proxy so YouTube oEmbed and social OpenGraph lookups never suffer browser CORS failures:

1. Install dependencies or run Wrangler directly:
   ```bash
   cd workers
   npx wrangler login
   npx wrangler deploy
   ```
2. Copy the deployed `*.workers.dev` URL (for example `https://unimaxdl-edge.<your-subdomain>.workers.dev`).
3. Update `"edgeResolver"` in `assets/data/mirrors.json` to that URL, commit, and push. `assets/js/downloader.js` reads `mirrors.json` automatically and prioritizes `/resolve?url=...` before falling back to public oEmbed/Microlink mirrors.

## 2. Supabase Row-Level Security (RLS) Hardening ($0 Free Tier)
Verify that anonymous browser clients using `assets/js/analytics.js` can only insert telemetry events without reading or exporting visitor analytics rows:

In Supabase Dashboard (`olxgfytiyiupfzthoris`) -> **SQL Editor**, run:
```sql
ALTER TABLE IF EXISTS public.user_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.download_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_anon_insert_visits" ON public.user_visits;
CREATE POLICY "allow_anon_insert_visits"
  ON public.user_visits FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_insert_events" ON public.download_events;
CREATE POLICY "allow_anon_insert_events"
  ON public.download_events FOR INSERT TO anon
  WITH CHECK (true);
```
Note: Once `SELECT` is locked down on `user_visits`, update the Supabase keep-alive ping URL in `.github/workflows/health-and-keepalive.yml` from `/rest/v1/user_visits?select=id&limit=1` to `/rest/v1/` (which keeps PostgreSQL/PostgREST warm with HTTP 200 OpenAPI schema responses while exposing zero row data).

## 3. UptimeRobot Backend Keep-Alive & Alerting ($0 Free Tier - 50 Monitors)
1. Create a free account at `https://uptimerobot.com/`.
2. Add Monitor #1 (HTTP(S), 5-minute interval): `https://unimaxdl-server.onrender.com/api/ping`
3. Add Monitor #2 (HTTP(S), 5-minute interval): `https://unimaxdl.github.io/`
4. Configure email alerts to `atomicdhrubaofficial@gmail.com`.

## 4. Google Search Console & Bing Webmaster Submission ($0)
1. In Google Search Console (`https://search.google.com/search-console`), confirm ownership via the existing `google021fd839d14f44e1.html` verification file and meta tag.
2. Submit `https://unimaxdl.github.io/sitemap.xml` under **Sitemaps**.
3. Import the verified property into **Bing Webmaster Tools** (`https://www.bing.com/webmasters`) so Microsoft Edge/Bing and DuckDuckGo index all 14 canonical pages and `FAQPage` / `SoftwareApplication` schemas.

## 5. Git Credential Hygiene
Ensure no Personal Access Token remains hardcoded in your local `.git/config` remote URL after pushing:
```bash
git remote set-url origin https://github.com/UnimaxDL/unimaxdl.github.io.git
```
Authenticate via Windows Credential Manager (`git credential-manager`) or `gh auth login`, and revoke/rotate any previously embedded token in GitHub Settings -> Developer Settings -> Personal Access Tokens.
