import dns from 'dns';

const { resolveMx, resolve4, resolve6 } = dns.promises;

// Pragmatic RFC 5322 syntax check - the fully spec-compliant grammar allows
// obscure forms (quoted strings, comments, IP-literal domains) essentially
// nobody uses for real signups, and a regex covering all of it runs into the
// thousands of characters. This is the same pattern the WHATWG HTML living
// standard specifies for <input type="email">, plus explicit length limits
// (RFC 5321 4.5.3.1: local-part <= 64 octets, domain <= 253 octets) that the
// regex alone doesn't enforce.
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmailSyntax(email: string): boolean {
  if (!email || email.length > 254) return false;
  const at = email.lastIndexOf('@');
  if (at === -1) return false;
  if (at > 64) return false; // local-part too long
  if (email.length - at - 1 > 253) return false; // domain too long
  if (email.includes('..')) return false; // no consecutive dots anywhere
  return EMAIL_RE.test(email);
}

export function getEmailDomain(email: string): string {
  return email.slice(email.lastIndexOf('@') + 1).toLowerCase();
}

interface MxCacheEntry { ok: boolean; expires: number; }
const mxCache = new Map<string, MxCacheEntry>();
const MX_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour - domains rarely change mail setup
const MX_CACHE_MAX = 5_000;

// Confirms the domain can actually receive mail before we accept it. Checks
// MX first (the correct way to route mail); falls back to A/AAAA per RFC
// 5321 4.5.3.1's null-MX fallback, since some small domains still point mail
// straight at a host record instead of publishing MX. Fails OPEN on lookup
// errors/timeouts (DNS hiccup, resolver rate limit) so a transient network
// issue never blocks a legitimate signup - the disposable-domain and syntax
// checks already do the bulk of the fraud-relevant filtering here.
export async function domainAcceptsMail(domain: string): Promise<boolean> {
  const cached = mxCache.get(domain);
  if (cached && cached.expires > Date.now()) return cached.ok;

  const withTimeout = <T>(p: Promise<T>): Promise<T> => {
    return Promise.race([
      p,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('dns timeout')), 4000)),
    ]);
  };

  let ok = true;
  try {
    const records = await withTimeout(resolveMx(domain));
    ok = records.length > 0;
  } catch (mxErr: any) {
    if (mxErr?.code === 'ENOTFOUND' || mxErr?.code === 'ENODATA') {
      try {
        const [a4, a6] = await Promise.allSettled([withTimeout(resolve4(domain)), withTimeout(resolve6(domain))]);
        ok = (a4.status === 'fulfilled' && a4.value.length > 0) || (a6.status === 'fulfilled' && a6.value.length > 0);
      } catch {
        ok = true; // fail open - genuine DNS outage, not evidence the domain is fake
      }
    } else {
      ok = true; // timeout/SERVFAIL/etc - fail open
    }
  }

  if (mxCache.size >= MX_CACHE_MAX) mxCache.delete(mxCache.keys().next().value!);
  mxCache.set(domain, { ok, expires: Date.now() + MX_CACHE_TTL_MS });
  return ok;
}
