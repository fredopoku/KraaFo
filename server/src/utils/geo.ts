// Shared IP geolocation + reputation lookup, backed by ip-api.com's free
// endpoint (already used for page-view analytics before this). Its free
// tier also exposes `proxy`/`hosting`/`as` fields, which covers the
// signup-fraud IP-reputation requirement without a second vendor account.
export interface GeoResult {
  country: string;
  country_code: string;
  region: string;
  city: string;
  asn: string;       // e.g. "AS15169 Google LLC" - empty string if unknown
  isProxy: boolean;   // VPN/proxy
  isHosting: boolean; // datacenter/hosting range
}

const UNKNOWN: GeoResult = { country: 'Unknown', country_code: 'XX', region: '', city: '', asn: '', isProxy: false, isHosting: false };

const geoCache = new Map<string, GeoResult>();
const GEO_CACHE_MAX = 10_000;

export const PRIVATE_IP_RE = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|fd[0-9a-f]{2}:|fe80:)/i;

export async function geolocate(ip: string): Promise<GeoResult> {
  if (geoCache.has(ip)) return geoCache.get(ip)!;

  if (!ip || PRIVATE_IP_RE.test(ip)) {
    return { country: 'Local', country_code: 'XX', region: '', city: '', asn: '', isProxy: false, isHosting: false };
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,as,proxy,hosting`,
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
          asn: data.as || '',
          isProxy: !!data.proxy,
          isHosting: !!data.hosting,
        };
        if (geoCache.size >= GEO_CACHE_MAX) geoCache.delete(geoCache.keys().next().value!);
        geoCache.set(ip, geo);
        return geo;
      }
    }
  } catch {}

  return UNKNOWN;
}
