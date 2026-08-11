import { Organization, Invoice, AISuggestion, BrandColors } from '../types';

const BASE = '/api';

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('krafo_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // `headers` must be spread AFTER `...options`, not before - options also
  // has its own `headers` key, and a later spread of the same key replaces
  // the earlier one entirely rather than merging. Doing it the other way
  // around (as this used to) silently drops Content-Type/Authorization
  // whenever a caller passes its own headers (e.g. api.ai.suggest's
  // fingerprint header), since object spread doesn't merge nested keys.
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    // Token expired - clear it so the app redirects to login
    if (res.status === 401) localStorage.removeItem('krafo_token');
    throw new ApiError(err.error || 'Request failed', err.code);
  }
  return res.json();
}

async function mobilePdfAction(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch PDF');
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const name = match?.[1] ?? filename;
  const blob = await res.blob();
  // Try the native Web Share API (shows iOS/Android share sheet with Save to Files, WhatsApp, etc.)
  if (navigator.canShare) {
    const file = new File([blob], name, { type: 'application/pdf' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return; // user cancelled
      }
    }
  }
  // Fallback: blob URL + hidden anchor download
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function pdfOpen(url: string, filename: string): Promise<void> {
  if (!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.open(url, '_blank');
    return Promise.resolve();
  }
  return mobilePdfAction(url, filename);
}

export const api = {
  organizations: {
    get: (id: string) => request<Organization>(`/organizations/${id}`),
    create: (data: Partial<Organization> & { cf_turnstile_response?: string; fingerprint_hash?: string; turnstile_unavailable?: boolean }) => request<Organization>('/organizations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Organization>) => request<Organization>(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  invoices: {
    list: (orgId: string, params?: { type?: string; status?: string; client_id?: string }) => {
      const q = new URLSearchParams({ org_id: orgId, ...(params || {}) });
      return request<Invoice[]>(`/invoices?${q}`);
    },
    get: (id: string) => request<Invoice>(`/invoices/${id}`),
    create: (data: Partial<Invoice> & { items: object[] }) => request<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Invoice> & { items?: object[] }) => request<Invoice>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/invoices/${id}`, { method: 'DELETE' }),
  },

  upload: {
    logo: async (file: File): Promise<{ logo_url: string; colors: BrandColors }> => {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch(`${BASE}/upload/logo`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
  },

  ai: {
    status: () => request<{ ai_enabled: boolean }>('/ai/status'),
    // Requires a verified account (see middleware/auth.ts) - the caller
    // (Generator.tsx) checks isDemo before calling and redirects to /setup
    // instead, so this only ever runs for a real logged-in request.
    suggest: (opts: { industry?: string; existing_items?: string[]; client_type?: string; notes?: string }) =>
      request<AISuggestion & { source: 'ai' | 'templates' }>('/ai/suggest', { method: 'POST', body: JSON.stringify(opts) }),
    enhance: (description: string) =>
      request<{ enhanced: string }>('/ai/enhance', { method: 'POST', body: JSON.stringify({ description }) }),
    parseReceipt: async (file: File): Promise<Record<string, unknown>> => {
      const formData = new FormData();
      formData.append('image', file); // field name stays 'image'; backend accepts PDF too
      const res = await fetch(`${BASE}/ai/parse-receipt`, {
        method: 'POST',
        body: formData,
        headers: authHeader(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new ApiError(err.error || 'Parse failed', err.code);
      }
      return res.json();
    },
  },

  clients: {
    list: (orgId: string, q?: string) => {
      const params = new URLSearchParams({ org_id: orgId, ...(q ? { q } : {}) });
      return request<any[]>(`/clients?${params}`);
    },
    create: (data: Record<string, unknown>) => request<any>('/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => request<any>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/clients/${id}`, { method: 'DELETE' }),
  },

  quotes: {
    list: (orgId: string) => request<any[]>(`/quotes?org_id=${orgId}`),
    get: (id: string) => request<any>(`/quotes/${id}`),
    create: (data: Record<string, unknown>) => request<any>('/quotes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => request<any>(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    convert: (id: string) => request<any>(`/quotes/${id}/convert`, { method: 'POST' }),
    updateStatus: (id: string, status: string) => request<any>(`/quotes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request<any>(`/quotes/${id}`, { method: 'DELETE' }),
  },

  trash: {
    list: () => request<{ invoices: any[]; quotes: any[]; clients: any[] }>('/trash'),
    count: () => request<{ count: number }>('/trash/count'),
    restore: (type: 'invoices' | 'quotes' | 'clients', id: string) =>
      request<{ success: boolean }>(`/trash/${type}/${id}/restore`, { method: 'POST' }),
    permanentDelete: (type: 'invoices' | 'quotes' | 'clients', id: string) =>
      request<{ success: boolean }>(`/trash/${type}/${id}`, { method: 'DELETE' }),
  },

  invoicePayment: {
    record: (id: string, amount_paid: number, paid_date: string, payment_method?: string) =>
      request<any>(`/invoices/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ amount_paid, paid_date, payment_method }) }),
    createReceipt: (id: string) => request<any>(`/invoices/${id}/receipt`, { method: 'POST' }),
  },

  deliver: {
    email: (invoiceId: string, to: string, message?: string) =>
      request<any>(`/deliver/email/${invoiceId}`, { method: 'POST', body: JSON.stringify({ to, message }) }),
    whatsapp: (invoiceId: string) => request<{ url: string; message: string }>(`/deliver/whatsapp/${invoiceId}`),
    paymentLinks: (invoiceId: string) => request<any>(`/deliver/payment-links/${invoiceId}`),
    generateDKIM: (domain: string, selector?: string) =>
      request<{ privateKey: string; publicKey: string; dnsRecord: string; dnsName: string }>('/deliver/generate-dkim', { method: 'POST', body: JSON.stringify({ domain, selector }) }),
    testEmail: (_org_id: string, to: string) =>
      request<{ success: boolean }>('/deliver/test-email', { method: 'POST', body: JSON.stringify({ to }) }),
  },

  analytics: {
    get: (params?: { granularity?: string }) => {
      const qs = params?.granularity ? `?granularity=${params.granularity}` : '';
      return request<any>(`/analytics${qs}`);
    },
  },

  statement: {
    get: (clientId: string, _orgId: string) => request<any>(`/clients/${clientId}/statement`),
    download: (clientId: string, _orgId: string) => {
      const token = localStorage.getItem('krafo_token');
      const url = `${BASE}/pdf/statement/${clientId}`;
      return fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(r => r.ok ? r.blob() : Promise.reject(new Error('Failed to fetch statement')))
        .then(blob => {
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl; a.download = 'statement.pdf';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        });
    },
    preview: (clientId: string, _orgId: string) => {
      const token = localStorage.getItem('krafo_token');
      const url = `${BASE}/pdf/statement/${clientId}?inline=true`;
      return fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(r => r.ok ? r.blob() : Promise.reject(new Error('Failed to fetch statement')))
        .then(blob => { window.open(URL.createObjectURL(blob), '_blank'); });
    },
  },

  stats: {
    get: () => request<{ documents: number; countries: number; avgRating: number | null; ratingCount: number }>('/stats'),
  },
  feedback: {
    submit: (data: { name: string; email?: string; rating: number; message?: string; cf_turnstile_response?: string }) =>
      request<{ success: boolean }>('/feedback', { method: 'POST', body: JSON.stringify(data) }),
    list: () => request<{ feedback: any[]; averageRating: number; total: number }>('/feedback'),
    highlights: () => request<{ highlights: Array<{ id: string; name: string; rating: number; message: string; created_at: string }> }>('/feedback/highlights'),
  },

  subscribers: {
    subscribe: (data: { email: string; name?: string }) =>
      request<{ success: boolean; alreadySubscribed?: boolean; resubscribed?: boolean }>('/subscribers', { method: 'POST', body: JSON.stringify(data) }),
    list: () => request<{ subscribers: any[]; total: number }>('/subscribers'),
    unsubscribe: (token: string) =>
      request<{ success: boolean; email: string; already?: boolean }>(`/subscribers/unsubscribe/${token}`),
  },

  broadcasts: {
    send: (data: { subject: string; body: string }) =>
      request<{ success: boolean; sent: number; failed: number }>('/broadcasts', { method: 'POST', body: JSON.stringify(data) }),
    list: () => request<any[]>('/broadcasts'),
  },

  changelog: {
    list: () => request<{ entries: Array<{ id: string; title: string; description: string; tag: string; published_at: string }> }>('/changelog'),
    post: (data: { title: string; description: string; tag: string }) =>
      request<{ success: boolean; entry: any }>('/changelog', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string) => request<{ success: boolean }>(`/changelog/${id}`, { method: 'DELETE' }),
  },

  auth: {
    login: (email: string, password: string) =>
      request<{ org: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    setPassword: (orgId: string, password: string) =>
      request<{ org: any; token: string }>('/auth/set-password', { method: 'POST', body: JSON.stringify({ orgId, password }) }),
    forgot: (email: string) =>
      request<{ sent: boolean }>('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
    reset: (email: string, code: string, password: string) =>
      request<{ org: any; token: string }>('/auth/reset', { method: 'POST', body: JSON.stringify({ email, code, password }) }),
    getInvite: (token: string) =>
      request<{ email: string; orgName: string; role: string }>(`/auth/join/${token}`),
    acceptInvite: (token: string, name: string, password: string) =>
      request<{ org: any; token: string; role: string }>(`/auth/join/${token}`, { method: 'POST', body: JSON.stringify({ name, password }) }),
    verifyEmail: (token: string) =>
      request<{ success: boolean; held: boolean }>(`/auth/verify-email?token=${encodeURIComponent(token)}`),
    resendVerification: () =>
      request<{ sent: boolean; alreadyVerified?: boolean }>('/auth/resend-verification', { method: 'POST' }),
  },

  team: {
    list: () => request<any[]>('/team'),
    invite: (email: string, role: string, name?: string) =>
      request<any>('/team/invite', { method: 'POST', body: JSON.stringify({ email, role, name }) }),
    changeRole: (memberId: string, role: string) =>
      request<any>(`/team/${memberId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    remove: (memberId: string) =>
      request<any>(`/team/${memberId}`, { method: 'DELETE' }),
    resendInvite: (memberId: string) =>
      request<any>(`/team/${memberId}/resend`, { method: 'POST' }),
  },

  pdf: {
    preview: (invoiceId: string) => pdfOpen(`${BASE}/pdf/${invoiceId}?inline=true`, 'invoice.pdf'),
    download: (invoiceId: string) => pdfOpen(`${BASE}/pdf/${invoiceId}`, 'invoice.pdf'),
    previewQuote: (quoteId: string) => pdfOpen(`${BASE}/pdf/quote/${quoteId}?inline=true`, 'quote.pdf'),
    downloadQuote: (quoteId: string) => pdfOpen(`${BASE}/pdf/quote/${quoteId}`, 'quote.pdf'),
    guestDownload: async (payload: Record<string, unknown>, filename: string): Promise<void> => {
      const res = await fetch(`${BASE}/pdf/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as any).error || 'Failed to generate PDF');
      }
      const blob = await res.blob();
      if (navigator.canShare) {
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: filename }); return; }
          catch (e) { if ((e as Error).name === 'AbortError') return; }
        }
      }
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    },
  },
};

export function formatCurrency(amount: number, symbol = '$', short = false): string {
  if (short) {
    if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}k`;
  }
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateInvoiceNumber(prefix: string, existingCount: number): string {
  const num = String(existingCount + 1).padStart(4, '0');
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${num}`;
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
