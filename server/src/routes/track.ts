import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';

const router = Router();

/* ── In-memory geo cache (keyed by IP) ─────────────────────── */
type GeoResult = { country: string; country_code: string; region: string; city: string };
const geoCache = new Map<string, GeoResult>();
const GEO_CACHE_MAX = 10_000;

const BOT_RE = /bot|crawl|spider|slurp|mediapartners|google|bing|yahoo|baidu|yandex|duckduck|facebook|twitter|linkedin|whatsapp|apple|slack|telegram|applebot|semrush|ahrefsbot|mj12bot|dotbot/i;

const PRIVATE_IP_RE = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|fd[0-9a-f]{2}:|fe80:)/i;

function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return (Array.isArray(fwd) ? fwd[0] : fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '';
}

function parseUA(ua: string): { device: string; browser: string } {
  const isTablet = /iPad|Tablet|PlayBook/i.test(ua);
  const isMobile = !isTablet && /Mobile|Android|iPhone|iPod|BlackBerry|Windows Phone/i.test(ua);
  const device = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';

  let browser = 'Other';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung';
  else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/MSIE|Trident/i.test(ua)) browser = 'IE';

  return { device, browser };
}

async function geolocate(ip: string): Promise<GeoResult> {
  if (geoCache.has(ip)) return geoCache.get(ip)!;

  if (!ip || PRIVATE_IP_RE.test(ip)) {
    return { country: 'Local', country_code: 'XX', region: '', city: '' };
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (res.ok) {
      const data = await res.json() as any;
      if (data.status === 'success') {
        const geo: GeoResult = {
          country: data.country || 'Unknown',
          country_code: data.countryCode || 'XX',
          region: data.regionName || '',
          city: data.city || '',
        };
        if (geoCache.size >= GEO_CACHE_MAX) geoCache.delete(geoCache.keys().next().value!);
        geoCache.set(ip, geo);
        return geo;
      }
    }
  } catch {}

  return { country: 'Unknown', country_code: 'XX', region: '', city: '' };
}

async function processView(req: Request): Promise<void> {
  const ua = req.headers['user-agent'] || '';
  if (BOT_RE.test(ua)) return;

  const { page, referrer, session_id } = req.body || {};
  if (!page || typeof page !== 'string') return;

  const ip = getClientIp(req);
  const { device, browser } = parseUA(ua);
  const geo = await geolocate(ip);

  db.prepare(`
    INSERT INTO page_views (id, page, referrer, country, country_code, region, city, device, browser, session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    page.slice(0, 255),
    referrer ? String(referrer).slice(0, 255) : null,
    geo.country, geo.country_code, geo.region, geo.city,
    device, browser,
    session_id ? String(session_id).slice(0, 64) : null
  );
}

router.post('/', (req: Request, res: Response) => {
  res.json({ ok: true });
  processView(req).catch(() => {});
});

export default router;
