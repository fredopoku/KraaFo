import { Request } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';

// The visitor's real IP. Production traffic reaches Render through
// Cloudflare, which sets CF-Connecting-IP to the connecting client and
// overwrites any value the client sent - unlike X-Forwarded-For, whose
// first entry is whatever the client chose to put there (proxies append
// after it). Reading that first entry let a script send a fresh fake IP on
// every request and walk straight past every per-IP limit. X-Forwarded-For
// stays as a fallback for local dev and anything not behind Cloudflare.
export function getClientIp(req: Request): string {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf.trim()) return cf.trim();
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0].trim();
  return first || req.ip || req.socket?.remoteAddress || '';
}

// Rate-limit key for one visitor. IPv6 users typically control a whole /56
// or larger, so a per-address key would let them rotate addresses freely;
// ipKeyGenerator collapses an IPv6 address to its /56 network and leaves
// IPv4 untouched.
export function clientRateLimitKey(req: Request): string {
  return ipKeyGenerator(getClientIp(req), 56);
}

// Looser "same network" key: IPv4 /24, IPv6 /48.
export function clientNetworkKey(req: Request): string {
  const ip = getClientIp(req);
  if (ip.includes(':')) return ipKeyGenerator(ip, 48);
  return ip.split('.').slice(0, 3).join('.') || ip;
}

// Shared express-rate-limit options: key by the real client, and silence
// the library's X-Forwarded-For/trust-proxy check, which assumes the
// default req.ip key that these limiters no longer use.
export const clientLimiterOptions = {
  keyGenerator: clientRateLimitKey,
  validate: { xForwardedForHeader: false },
} as const;
