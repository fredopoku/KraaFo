import disposableDomains from 'disposable-email-domains';

// Vendored, actively-maintained blocklist:
// github.com/disposable-email-domains/disposable-email-domains (~3,700 domains,
// updated regularly). Pull the latest list with `npm update disposable-email-domains`.
//
// EXTRA_BLOCKED covers domains seen in local signup abuse that haven't made it
// upstream yet - add entries here without waiting on the package's release cycle.
const EXTRA_BLOCKED: string[] = [
];

const BLOCKED = new Set<string>([...disposableDomains, ...EXTRA_BLOCKED].map(d => d.toLowerCase()));

export function isDisposableEmailDomain(domain: string): boolean {
  return BLOCKED.has(domain.toLowerCase());
}

// Second, real-time layer on top of the static list above. debounce.io's
// free disposable-domain API (no key, no auth) is continuously updated, so
// it catches newer/rotating disposable services days or weeks before they'd
// land in a periodically-bumped npm dependency. Fails OPEN on any network
// error/timeout/non-boolean response - same philosophy as the MX check in
// emailValidation.ts - a third-party outage should never block a real
// signup, it just means this one extra layer sat out that request.
interface LiveCacheEntry { disposable: boolean; expires: number; }
const liveCache = new Map<string, LiveCacheEntry>();
const LIVE_CACHE_TTL_MS = 60 * 60 * 1000;
const LIVE_CACHE_MAX = 5_000;

export async function isDisposableEmailDomainLive(domain: string): Promise<boolean> {
  const lower = domain.toLowerCase();
  const cached = liveCache.get(lower);
  if (cached && cached.expires > Date.now()) return cached.disposable;

  let disposable = false;
  try {
    const res = await fetch(`https://disposable.debounce.io/?email=${encodeURIComponent(lower)}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data = await res.json() as any;
      disposable = data?.disposable === 'true' || data?.disposable === true;
    }
  } catch {
    disposable = false; // fail open
  }

  if (liveCache.size >= LIVE_CACHE_MAX) liveCache.delete(liveCache.keys().next().value!);
  liveCache.set(lower, { disposable, expires: Date.now() + LIVE_CACHE_TTL_MS });
  return disposable;
}
