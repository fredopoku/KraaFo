import { useState, useEffect, useCallback } from 'react';
import { Star, Mail, Send, Megaphone, ChevronDown, ChevronUp, LogOut, Shield, Building2, Users, FileText, Receipt, Quote, TrendingUp, Activity, Trash2, Zap, Plus } from 'lucide-react';
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
  const [usersData, setUsersData] = useState<{ orgs: any[]; summary: any } | null>(null);
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const [changelogEntries, setChangelogEntries] = useState<any[]>([]);
  const [clForm, setClForm] = useState({ title: '', description: '', tag: 'New' });
  const [postingCl, setPostingCl] = useState(false);
  const [clResult, setClResult] = useState('');

  const loadData = useCallback(async (t: string) => {
    const [fb, subs, bcs, users, cl] = await Promise.all([
      adminFetch<any>('/feedback', t),
      adminFetch<any>('/subscribers', t),
      adminFetch<any[]>('/broadcasts', t),
      adminFetch<any>('/admin/users', t),
      fetch(`${BASE}/changelog`).then(r => r.json()),
    ]);
    setFeedbackData(fb);
    setSubCount(subs.total);
    setBroadcasts(bcs);
    setUsersData(users);
    setChangelogEntries(cl.entries || []);
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

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Remove this review? It will also disappear from the landing page.')) return;
    try {
      await adminFetch(`/feedback/${id}`, token, { method: 'DELETE' });
      setFeedbackData(prev => prev ? {
        ...prev,
        feedback: prev.feedback.filter(f => f.id !== id),
        total: prev.total - 1,
        averageRating: (() => {
          const remaining = prev.feedback.filter(f => f.id !== id);
          return remaining.length ? Number((remaining.reduce((s: number, r: any) => s + r.rating, 0) / remaining.length).toFixed(1)) : 0;
        })(),
      } : null);
    } catch {}
  };

  const handlePostChangelog = async () => {
    if (!clForm.title.trim() || !clForm.description.trim()) return;
    setPostingCl(true); setClResult('');
    try {
      const r = await adminFetch<any>('/changelog', token, { method: 'POST', body: JSON.stringify(clForm) });
      setChangelogEntries(prev => [r.entry, ...prev]);
      setClForm({ title: '', description: '', tag: 'New' });
      setClResult('Posted!');
      setTimeout(() => setClResult(''), 3000);
    } catch (err: any) {
      setClResult(err.message || 'Failed to post');
    } finally { setPostingCl(false); }
  };

  const handleDeleteChangelog = async (id: string) => {
    if (!confirm('Delete this changelog entry?')) return;
    try {
      await adminFetch(`/changelog/${id}`, token, { method: 'DELETE' });
      setChangelogEntries(prev => prev.filter(e => e.id !== id));
    } catch {}
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

        {/* ── Platform Usage ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-black text-slate-700">Platform Usage</h2>
            </div>
            {usersData && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {usersData.summary.active_orgs} active (30d)
              </span>
            )}
          </div>

          {/* Summary mini-stats */}
          {usersData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-50 border-b border-slate-50">
              {[
                { label: 'Organisations', value: usersData.summary.total_orgs, icon: Building2, color: 'text-indigo-600' },
                { label: 'Invoices', value: usersData.summary.total_invoices, icon: FileText, color: 'text-blue-600' },
                { label: 'Receipts', value: usersData.summary.total_receipts, icon: Receipt, color: 'text-emerald-600' },
                { label: 'Quotes', value: usersData.summary.total_quotes, icon: Quote, color: 'text-purple-600' },
              ].map(s => (
                <div key={s.label} className="px-5 py-3 flex items-center gap-3">
                  <s.icon className={cn('w-4 h-4 shrink-0', s.color)} />
                  <div>
                    <div className="text-lg font-black text-slate-900 leading-none">{s.value}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Org table */}
          {!usersData || usersData.orgs.length === 0 ? (
            <div className="py-14 text-center">
              <Building2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-300">No organisations registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-5 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Business</th>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden md:table-cell">Country</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Invoices</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Receipts</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Quotes</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden lg:table-cell">Clients</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Revenue</th>
                    <th className="px-3 py-2.5 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden md:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(showAllOrgs ? usersData.orgs : usersData.orgs.slice(0, 8)).map((org: any) => {
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                    const isActive = org.last_active && org.last_active >= thirtyDaysAgo;
                    const totalDocs = (org.invoice_count || 0) + (org.receipt_count || 0) + (org.quote_count || 0);
                    return (
                      <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-bold text-slate-800 truncate max-w-[160px]">{org.name || '—'}</div>
                          {org.email && <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{org.email}</div>}
                          <div className="text-[10px] text-slate-300 mt-0.5">
                            Joined {new Date(org.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-500 hidden md:table-cell">{org.country || '—'}</td>
                        <td className="px-3 py-3 text-right font-bold text-slate-700">{org.invoice_count || 0}</td>
                        <td className="px-3 py-3 text-right text-slate-500 hidden sm:table-cell">{org.receipt_count || 0}</td>
                        <td className="px-3 py-3 text-right text-slate-500 hidden sm:table-cell">{org.quote_count || 0}</td>
                        <td className="px-3 py-3 text-right text-slate-500 hidden lg:table-cell">{org.client_count || 0}</td>
                        <td className="px-3 py-3 text-right font-bold text-slate-700">
                          {org.total_revenue > 0
                            ? `${Number(org.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                            : totalDocs > 0 ? <span className="text-slate-300 font-normal">$0</span> : <span className="text-slate-200 font-normal">—</span>}
                        </td>
                        <td className="px-3 py-3 text-center hidden md:table-cell">
                          {totalDocs === 0
                            ? <span className="text-[10px] text-slate-300 font-medium">No docs</span>
                            : isActive
                              ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">● Active</span>
                              : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">● Idle</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {usersData.orgs.length > 8 && (
                <button
                  onClick={() => setShowAllOrgs(v => !v)}
                  className="w-full px-5 py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-500 hover:bg-slate-50 transition-colors border-t border-slate-50"
                >
                  {showAllOrgs
                    ? <><ChevronUp className="w-3.5 h-3.5" /> Show fewer</>
                    : <><ChevronDown className="w-3.5 h-3.5" /> Show all {usersData.orgs.length} organisations</>}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Revenue overview row ─────────────────────────────── */}
        {usersData && usersData.summary.total_revenue > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-indigo-200" />
              <div>
                <p className="text-indigo-200 text-[11px] font-bold uppercase tracking-wider">Total Revenue Processed</p>
                <p className="text-white text-xl font-black mt-0.5">
                  {Number(usersData.summary.total_revenue).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-indigo-300 text-[11px]">across {usersData.summary.total_orgs} org{usersData.summary.total_orgs !== 1 ? 's' : ''}</p>
              <p className="text-indigo-200 text-[11px] mt-0.5">{usersData.summary.active_orgs} active in last 30 days</p>
            </div>
          </div>
        )}

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
                  <div key={f.id} className="px-5 py-3.5 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-bold text-slate-800">{f.name}</span>
                          {f.email && <span className="text-[10px] text-slate-400 truncate hidden sm:block">{f.email}</span>}
                        </div>
                        {f.message && <p className="text-xs text-slate-500 leading-relaxed">{f.message}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} className={cn('w-3 h-3', n <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100')} />
                          ))}
                        </div>
                        <button
                          onClick={() => handleDeleteFeedback(f.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 p-0.5 rounded"
                          title="Delete review"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
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

        {/* ── Changelog Management ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-black text-slate-700">Changelog</h2>
            </div>
            <span className="text-[10px] text-slate-400">Posts appear on /changelog and the What's New panel</span>
          </div>

          {/* Post form */}
          <div className="p-5 border-b border-slate-50 space-y-3">
            <input
              value={clForm.title}
              onChange={e => setClForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Update title…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="flex gap-3">
              <select
                value={clForm.tag}
                onChange={e => setClForm(f => ({ ...f, tag: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="New">🆕 New</option>
                <option value="Improved">✨ Improved</option>
                <option value="Fixed">🔧 Fixed</option>
              </select>
              <button
                onClick={handlePostChangelog}
                disabled={postingCl || !clForm.title.trim() || !clForm.description.trim()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {postingCl ? 'Posting…' : 'Post Update'}
              </button>
            </div>
            <textarea
              value={clForm.description}
              onChange={e => setClForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe what changed…"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
            {clResult && (
              <p className={cn('text-xs font-semibold', clResult === 'Posted!' ? 'text-emerald-600' : 'text-red-500')}>
                {clResult}
              </p>
            )}
          </div>

          {/* Existing entries */}
          {changelogEntries.length === 0 ? (
            <div className="py-10 text-center">
              <Zap className="w-7 h-7 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-300">No entries yet — post your first update above</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {changelogEntries.map(e => {
                const tagCls: Record<string, string> = {
                  New: 'bg-indigo-100 text-indigo-700',
                  Improved: 'bg-amber-100 text-amber-700',
                  Fixed: 'bg-emerald-100 text-emerald-700',
                };
                return (
                  <div key={e.id} className="px-5 py-3.5 flex items-start justify-between gap-3 group">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', tagCls[e.tag] || 'bg-slate-100 text-slate-600')}>
                          {e.tag}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{e.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{e.description}</p>
                      <p className="text-[10px] text-slate-300 mt-1">
                        {new Date(e.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteChangelog(e.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 p-1 rounded shrink-0"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
