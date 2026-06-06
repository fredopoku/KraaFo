import { useState, useEffect, useCallback } from 'react';
import { Star, Mail, Send, Megaphone, ChevronDown, ChevronUp, LogOut, Shield } from 'lucide-react';
import { LogoMark } from '../components/Logo';
import { cn } from '../utils/cn';

const STORAGE_KEY = 'krafo_admin_token';
const BASE = '/api';

async function adminFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token, ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '');
  const [input, setInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [checking, setChecking] = useState(false);
  const [authed, setAuthed] = useState(false);

  const [feedbackData, setFeedbackData] = useState<{ feedback: any[]; averageRating: number; total: number } | null>(null);
  const [subCount, setSubCount] = useState(0);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [showAllFeedback, setShowAllFeedback] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState('');

  const loadData = useCallback(async (t: string) => {
    const [fb, subs, bcs] = await Promise.all([
      adminFetch<any>('/feedback', t),
      adminFetch<any>('/subscribers', t),
      adminFetch<any[]>('/broadcasts', t),
    ]);
    setFeedbackData(fb);
    setSubCount(subs.total);
    setBroadcasts(bcs);
  }, []);

  // Validate stored token on mount
  useEffect(() => {
    if (!token) return;
    adminFetch('/feedback', token)
      .then(() => { setAuthed(true); loadData(token); })
      .catch(() => { sessionStorage.removeItem(STORAGE_KEY); setToken(''); });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setChecking(true); setAuthError('');
    try {
      await adminFetch('/feedback', input.trim());
      sessionStorage.setItem(STORAGE_KEY, input.trim());
      setToken(input.trim());
      setAuthed(true);
      loadData(input.trim());
    } catch {
      setAuthError('Incorrect admin password. Try again.');
    } finally { setChecking(false); }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken(''); setAuthed(false); setInput(''); setBroadcastResult('');
  };

  const handleBroadcast = async () => {
    if (!broadcastForm.subject.trim() || !broadcastForm.body.trim()) return;
    setSending(true); setBroadcastResult('');
    try {
      const r = await adminFetch<any>('/broadcasts', token, {
        method: 'POST',
        body: JSON.stringify(broadcastForm),
      });
      setBroadcastResult(`Sent to ${r.sent} subscriber${r.sent !== 1 ? 's' : ''}${r.failed ? ` · ${r.failed} failed` : ''}`);
      setBroadcastForm({ subject: '', body: '' });
      adminFetch<any[]>('/broadcasts', token).then(setBroadcasts).catch(() => {});
    } catch (err: any) {
      setBroadcastResult(err.message || 'Failed to send');
    } finally { setSending(false); }
  };

  /* ── Password gate ────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <LogoMark size={52} className="mx-auto mb-5" />
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Admin Access</span>
            </div>
            <p className="text-slate-600 text-xs mt-2">This area is restricted to the platform owner.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Admin password"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {authError && <p className="text-red-400 text-xs">{authError}</p>}
            <button
              type="submit"
              disabled={checking || !input.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all disabled:opacity-50"
            >
              {checking ? 'Verifying…' : 'Enter Admin →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Admin panel ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <LogoMark size={30} />
          <div>
            <p className="text-white font-black text-sm leading-tight">KraaFo Admin</p>
            <p className="text-slate-500 text-[11px]">Platform management</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Avg Rating', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50',
              value: feedbackData ? `${feedbackData.averageRating} / 5` : '—',
              sub: `${feedbackData?.total ?? 0} review${feedbackData?.total !== 1 ? 's' : ''}`,
            },
            {
              label: 'Subscribers', icon: Mail, color: 'text-indigo-600', bg: 'bg-indigo-50',
              value: subCount,
              sub: 'active email subscribers',
            },
            {
              label: 'Broadcasts Sent', icon: Megaphone, color: 'text-emerald-600', bg: 'bg-emerald-50',
              value: broadcasts.length,
              sub: 'update emails sent',
            },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-3', c.bg)}>
                <c.icon className={cn('w-4 h-4', c.color)} />
              </div>
              <div className="text-xl font-black text-slate-900">{c.value}</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">{c.label}</div>
              <div className="text-[10px] text-slate-300 mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Feedback + Broadcast */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Feedback list */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-black text-slate-700">User Feedback</h2>
              </div>
              {feedbackData && feedbackData.total > 0 && (
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className={cn('w-3.5 h-3.5', n <= Math.round(feedbackData.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                  ))}
                </div>
              )}
            </div>

            {!feedbackData || feedbackData.total === 0 ? (
              <div className="py-14 text-center">
                <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-300">No feedback submitted yet</p>
                <p className="text-xs text-slate-200 mt-1">The rating widget is live on your landing page</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {(showAllFeedback ? feedbackData.feedback : feedbackData.feedback.slice(0, 5)).map((f: any) => (
                  <div key={f.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-bold text-slate-800">{f.name}</span>
                          {f.email && <span className="text-[10px] text-slate-400 truncate hidden sm:block">{f.email}</span>}
                        </div>
                        {f.message && <p className="text-xs text-slate-500 leading-relaxed">{f.message}</p>}
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={cn('w-3 h-3', n <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100')} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1.5">
                      {new Date(f.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}

                {feedbackData.feedback.length > 5 && (
                  <button
                    onClick={() => setShowAllFeedback(v => !v)}
                    className="w-full px-5 py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-500 hover:bg-slate-50 transition-colors"
                  >
                    {showAllFeedback
                      ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                      : <><ChevronDown className="w-3.5 h-3.5" /> Show all {feedbackData.feedback.length} reviews</>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Broadcast composer */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              <div>
                <h2 className="text-sm font-black text-slate-700">Send Update Email</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">{subCount} active subscriber{subCount !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-3">
              <input
                value={broadcastForm.subject}
                onChange={e => setBroadcastForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Subject line…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <textarea
                value={broadcastForm.body}
                onChange={e => setBroadcastForm(f => ({ ...f, body: e.target.value }))}
                placeholder={"Write your update here…\n\nSupports multiple paragraphs — just press Enter twice."}
                rows={7}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
              <button
                onClick={handleBroadcast}
                disabled={sending || !broadcastForm.subject.trim() || !broadcastForm.body.trim() || subCount === 0}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending…' : `Send to ${subCount} subscriber${subCount !== 1 ? 's' : ''}`}
              </button>
              {broadcastResult && (
                <p className={cn('text-xs text-center font-semibold', broadcastResult.startsWith('Sent') ? 'text-emerald-600' : 'text-red-500')}>
                  {broadcastResult}
                </p>
              )}
              {subCount === 0 && (
                <p className="text-xs text-slate-300 text-center">No subscribers yet — signup form is live on the landing page</p>
              )}
            </div>

            {broadcasts.length > 0 && (
              <div className="border-t border-slate-50 px-5 pb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-3 mb-2">Recent sends</p>
                <div className="space-y-2">
                  {broadcasts.slice(0, 4).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-600 truncate">{b.subject}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Mail className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] text-slate-400">{b.recipient_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
