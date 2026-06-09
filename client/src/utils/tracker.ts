const SESSION_KEY = 'krafo_sid';
const ADMIN_TOKEN_KEY = 'krafo_admin_token';

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function isAdminSession(): boolean {
  return Boolean(sessionStorage.getItem(ADMIN_TOKEN_KEY));
}

export function trackPage(page: string): void {
  // Never track admin sessions or admin pages
  if (isAdminSession() || page.startsWith('/admin')) return;
  try {
    const payload = JSON.stringify({
      page,
      referrer: document.referrer || null,
      session_id: getSessionId(),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch {}
}
