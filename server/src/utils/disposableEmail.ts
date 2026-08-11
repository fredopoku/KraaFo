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
