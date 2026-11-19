// Helpers for putting user-supplied values into server-built HTML (PDF
// templates rendered by headless Chromium, and outgoing emails). Anything a
// user typed - names, line items, notes, addresses - must go through
// escapeHtml before it is interpolated, or it becomes live markup.

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;',
};

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`]/g, ch => HTML_ESCAPES[ch]);
}

// Escaped text with line breaks kept, for multi-line fields like notes.
export function escapeMultiline(value: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

// Only plain colour values may reach a style attribute: #rgb/#rrggbb(aa),
// rgb()/rgba() with numbers, or a bare colour keyword. Anything else
// (quotes, semicolons, url(), expression()) falls back.
export function safeCssColor(value: unknown, fallback: string): string {
  const v = String(value ?? '').trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v;
  if (/^rgba?\(\s*[\d.\s,%]+\)$/.test(v)) return v;
  if (/^[a-zA-Z]{3,20}$/.test(v)) return v;
  return fallback;
}

// Images in generated documents must be inline data URLs - the PDF renderer
// blocks every network request, and an attacker-chosen URL must never be
// fetched by the server.
export function safeImageDataUrl(value: unknown): string | undefined {
  const v = String(value ?? '').trim();
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/.test(v)) return v;
  return undefined;
}

export function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
