const SESSION_KEY = 'krafo_sid';

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function trackPage(page: string): void {
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
