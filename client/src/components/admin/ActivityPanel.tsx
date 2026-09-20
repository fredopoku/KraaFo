import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Search, ShieldAlert, Sparkles, Activity as ActivityIcon, X, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

// Admin "Activity" tab: everything users, the system and the admin do, read from
// /api/admin/events (see server/src/services/activityLog.ts). Actions and metadata
// only - never document contents.

type Api = <T>(path: string, options?: RequestInit) => Promise<T>;

interface EventRow {
  id: number;
  created_at: string;
  org_id: string | null;
  org_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  type: string;
  ref_type: string | null;
  ref_id: string | null;
  ok: boolean;
  ip: string | null;
  meta: Record<string, any> | null;
}

interface Summary {
  days: number;
  totals: { events: number; logins: number; failedLogins: number; sendFailures: number; aiCalls: number; aiBlocked: number; activeOrgs: number };
  byType: { type: string; count: number; failed: number }[];
  failedLoginsByIp: { ip: string; attempts: number; emails: number; last_at: string }[];
  failedLoginsByEmail: { email: string; attempts: number; ips: number; last_at: string }[];
  daily: { date: string; events: number; failed_logins: number }[];
  topOrgs: { org_id: string; name: string; events: number; last_at: string }[];
}

interface AiUsage {
  defaultLimit: number;
  todayTotal: number;
  orgs: { id: string; name: string; email: string; today: number; last7: number; last30: number; blocked30: number; limit: number; customLimit: boolean }[];
  daily: { date: string; calls: number }[];
}

// Server timestamps are UTC ("YYYY-MM-DD HH:MM:SS") without a zone marker
const parseTs = (ts: string) => new Date(ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z');
function ago(ts: string): string {
  const s = Math.max(0, Math.floor((Date.now() - parseTs(ts).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const LABELS: Record<string, string> = {
  'auth.login': 'Signed in',
  'auth.login_failed': 'Failed sign-in',
  'auth.password_reset_requested': 'Asked for a password reset',
  'auth.password_reset': 'Reset password',
  'auth.password_reset_failed': 'Wrong reset code',
  'auth.password_set': 'Set a password',
  'auth.email_verified': 'Verified email',
  'auth.email_verify_failed': 'Verification link failed',
  'auth.verification_resent': 'Resent verification email',
  'org.signup': 'Signed up',
  'org.update': 'Changed business settings',
  'org.test_email': 'Tested email settings',
  'doc.create': 'Created',
  'doc.update': 'Edited',
  'doc.delete': 'Deleted invoice/receipt',
  'doc.payment': 'Recorded a payment',
  'doc.receipt': 'Issued a receipt',
  'doc.email': 'Emailed a document',
  'doc.whatsapp_link': 'Opened WhatsApp share',
  'quote.create': 'Created a quote',
  'quote.update': 'Edited a quote',
  'quote.convert': 'Converted quote to invoice',
  'quote.delete': 'Deleted a quote',
  'quote.status': 'Changed quote status',
  'client.create': 'Added a client',
  'client.update': 'Edited a client',
  'client.delete': 'Deleted a client',
  'trash.restore': 'Restored from Trash',
  'trash.purge': 'Permanently deleted',
  'team.invite': 'Invited a team member',
  'team.role': 'Changed a role',
  'team.remove': 'Removed a team member',
  'team.resend': 'Resent an invite',
  'team.join': 'Joined a team',
  'ai.suggest': 'Smart Fill',
  'ai.enhance': 'Improved a description',
  'ai.parse_receipt': 'Imported a document',
  'ai.blocked': 'Hit the daily AI limit',
  'admin.maintenance': 'Maintenance mode',
  'admin.risk_config': 'Changed risk settings',
  'admin.signup_review': 'Reviewed a signup',
  'admin.ai_limit': 'Changed an AI limit',
  'system.reminder': 'Overdue reminder',
  'system.lifecycle': 'Onboarding email',
  'system.recurring': 'Recurring invoice created',
  'system.recurring_email': 'Recurring invoice emailed',
  'system.overdue_flip': 'Invoices marked overdue',
};

const FAMILIES: { value: string; label: string }[] = [
  { value: '', label: 'Everything' },
  { value: 'auth.', label: 'Sign-in & security' },
  { value: 'org.', label: 'Business settings' },
  { value: 'doc.', label: 'Invoices & receipts' },
  { value: 'quote.', label: 'Quotes' },
  { value: 'client.', label: 'Clients' },
  { value: 'trash.', label: 'Trash' },
  { value: 'team.', label: 'Team' },
  { value: 'ai.', label: 'AI' },
  { value: 'system.', label: 'System jobs' },
  { value: 'admin.', label: 'Admin actions' },
];

function labelFor(e: EventRow): string {
  const base = LABELS[e.type] || e.type;
  if ((e.type === 'doc.create' || e.type === 'doc.update') && e.meta?.docType) return `${base} ${e.meta.docType}`;
  return base;
}

// One short line of context per event, built from whatever metadata it carries
function detailFor(e: EventRow): string {
  const m = e.meta || {};
  const bits: string[] = [];
  if (m.number) bits.push(String(m.number));
  if (m.from && m.to && m.from !== m.to) bits.push(`${m.from} → ${m.to}`);
  else if (m.status) bits.push(String(m.status));
  if (m.amount_paid !== undefined) bits.push(`paid ${m.amount_paid}`);
  else if (m.total !== undefined) bits.push(`total ${m.total}`);
  if (m.to_domain) bits.push(`to @${m.to_domain}`);
  if (m.invitee || m.member) bits.push(String(m.invitee || m.member));
  if (m.role) bits.push(String(m.role));
  if (m.reason) bits.push(String(m.reason).replace(/_/g, ' '));
  if (m.fields) bits.push(`fields: ${m.fields}`);
  if (m.used !== undefined && m.limit !== undefined) bits.push(`${m.used}/${m.limit} today`);
  if (m.decision) bits.push(String(m.decision));
  if (m.enabled !== undefined) bits.push(m.enabled ? 'turned on' : 'turned off');
  if (m.limit !== undefined && m.used === undefined) bits.push(`limit ${m.limit ?? 'default'}`);
  if (m.country) bits.push(String(m.country));
  if (m.risk_score !== undefined) bits.push(`risk ${m.risk_score} (${m.action})`);
  if (m.count !== undefined) bits.push(`${m.count} invoices`);
  if (m.days_overdue !== undefined) bits.push(`${m.days_overdue}d overdue`);
  if (m.email) bits.push(String(m.email));
  if (m.receiptsTrashed) bits.push(`${m.receiptsTrashed} receipt to Trash`);
  return bits.join(' · ');
}

const tone = (e: EventRow) =>
  !e.ok ? 'bg-red-500'
  : e.type.startsWith('auth.') ? 'bg-sky-500'
  : e.type.startsWith('ai.') ? 'bg-violet-500'
  : e.type.startsWith('admin.') ? 'bg-amber-500'
  : e.type.startsWith('system.') ? 'bg-slate-400'
  : e.type.startsWith('team.') ? 'bg-teal-500'
  : 'bg-emerald-500';

const CARD = 'bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm';

interface Props {
  api: Api;
  orgFilter: { id: string; name: string } | null;
  onFilterOrg: (o: { id: string; name: string } | null) => void;
}

export default function ActivityPanel({ api, orgFilter, onFilterOrg }: Props) {
  const [view, setView] = useState<'feed' | 'ai' | 'security'>('feed');
  const [days, setDays] = useState(7);
  const [family, setFamily] = useState('');
  const [onlyFailures, setOnlyFailures] = useState(false);
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [live, setLive] = useState(false);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [ai, setAi] = useState<AiUsage | null>(null);
  const [limitDrafts, setLimitDrafts] = useState<Record<string, string>>({});
  const [savingLimit, setSavingLimit] = useState<string | null>(null);

  const PAGE = 50;

  const query = useCallback((offset: number) => {
    const p = new URLSearchParams({ days: String(days), limit: String(PAGE), offset: String(offset) });
    if (family) p.set('type', family);
    if (onlyFailures) p.set('ok', '0');
    if (search) p.set('q', search);
    if (orgFilter) p.set('org_id', orgFilter.id);
    return `/admin/events?${p.toString()}`;
  }, [days, family, onlyFailures, search, orgFilter]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const [sum, ev] = await Promise.all([
        api<Summary>(`/admin/events/summary?days=${days}`),
        api<{ events: EventRow[]; total: number }>(query(0)),
      ]);
      setSummary(sum);
      setEvents(ev.events);
      setTotal(ev.total);
    } catch (e: any) {
      setError(e?.message || 'Could not load activity');
    } finally {
      setLoading(false);
    }
  }, [api, days, query]);

  const loadAi = useCallback(async () => {
    try { setAi(await api<AiUsage>('/admin/ai-usage')); } catch (e: any) { setError(e?.message || 'Could not load AI usage'); }
  }, [api]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (view === 'ai') loadAi(); }, [view, loadAi]);

  // Live mode: quietly refresh every 30s while the tab is visible
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => { if (!document.hidden) loadRef.current(true); }, 30000);
    return () => clearInterval(id);
  }, [live]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const ev = await api<{ events: EventRow[]; total: number }>(query(events.length));
      setEvents(prev => [...prev, ...ev.events]);
      setTotal(ev.total);
    } catch (e: any) { setError(e?.message || 'Could not load more'); }
    finally { setLoadingMore(false); }
  };

  const saveLimit = async (orgId: string, value: string | null) => {
    setSavingLimit(orgId);
    try {
      const limit = value === null ? null : Math.floor(Number(value));
      if (limit !== null && (!Number.isFinite(limit) || limit < 0)) throw new Error('Enter a whole number (0 turns AI off for this account)');
      await api(`/admin/orgs/${orgId}/ai-limit`, { method: 'PUT', body: JSON.stringify({ limit }) });
      setLimitDrafts(d => { const n = { ...d }; delete n[orgId]; return n; });
      await loadAi();
    } catch (e: any) { setError(e?.message || 'Could not save the limit'); }
    finally { setSavingLimit(null); }
  };

  const t = summary?.totals;
  const cards = [
    { label: 'Events', value: t?.events ?? 0, sub: `${t?.logins ?? 0} sign-ins`, tone: 'text-slate-900' },
    { label: 'Active accounts', value: t?.activeOrgs ?? 0, sub: `in the last ${days === 1 ? '24h' : days + ' days'}`, tone: 'text-slate-900' },
    { label: 'Failed sign-ins', value: t?.failedLogins ?? 0, sub: 'wrong password / no account', tone: (t?.failedLogins ?? 0) > 0 ? 'text-red-600' : 'text-slate-900' },
    { label: 'Send failures', value: t?.sendFailures ?? 0, sub: 'emails that did not go out', tone: (t?.sendFailures ?? 0) > 0 ? 'text-amber-600' : 'text-slate-900' },
    { label: 'AI requests', value: t?.aiCalls ?? 0, sub: `${t?.aiBlocked ?? 0} blocked by the limit`, tone: 'text-violet-600' },
  ];

  const maxDaily = Math.max(1, ...(summary?.daily || []).map(d => d.events));

  return (
    <div className="space-y-4">
      {/* Header + range */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <ActivityIcon className="w-4 h-4 text-indigo-500" />
          <div>
            <h2 className="text-sm font-black text-slate-800">Activity</h2>
            <p className="text-[10px] text-slate-400">What users, the system and you are doing - actions only, never document contents. Kept for 90 days.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
            {[{ l: '24h', v: 1 }, { l: '7d', v: 7 }, { l: '30d', v: 30 }, { l: '90d', v: 90 }].map(r => (
              <button key={r.v} onClick={() => setDays(r.v)}
                className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all', days === r.v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                {r.l}
              </button>
            ))}
          </div>
          <button onClick={() => setLive(l => !l)}
            className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold ring-1 transition-all', live ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-white text-slate-500 ring-slate-200 hover:text-slate-700')}
            title="Refresh every 30 seconds">
            <span className={cn('w-1.5 h-1.5 rounded-full', live ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} /> Live
          </button>
          <button onClick={() => load()} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all" title="Refresh now">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 ring-1 ring-red-100 rounded-xl px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map(c => (
          <div key={c.label} className={cn(CARD, 'p-4')}>
            <div className={cn('text-xl font-black tracking-tight', c.tone)}>{c.value.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">{c.label}</div>
            <div className="text-[10px] text-slate-300 mt-1 leading-tight">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* View switch */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 w-fit">
        {([['feed', 'Feed'], ['ai', 'AI usage'], ['security', 'Sign-ins & security']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setView(k)}
            className={cn('px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all', view === k ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
            {l}
          </button>
        ))}
      </div>

      {/* ── FEED ── */}
      {view === 'feed' && (
        <div className={cn(CARD, 'overflow-hidden')}>
          <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2 flex-wrap">
            <select value={family} onChange={e => setFamily(e.target.value)}
              className="text-xs font-bold text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5 ring-1 ring-slate-200 focus:outline-none focus:ring-indigo-300">
              {FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 cursor-pointer select-none">
              <input type="checkbox" checked={onlyFailures} onChange={e => setOnlyFailures(e.target.checked)} className="accent-red-500" />
              Failures only
            </label>
            {orgFilter && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 rounded-full pl-2.5 pr-1 py-0.5">
                {orgFilter.name}
                <button onClick={() => onFilterOrg(null)} className="p-0.5 rounded-full hover:bg-indigo-100" title="Show all accounts"><X className="w-3 h-3" /></button>
              </span>
            )}
            <form onSubmit={e => { e.preventDefault(); setSearch(searchDraft.trim()); }} className="ml-auto flex items-center gap-1.5">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-300 absolute left-2 top-1/2 -translate-y-1/2" />
                <input value={searchDraft} onChange={e => setSearchDraft(e.target.value)} placeholder="Email, IP, account, invoice no."
                  className="w-52 text-xs pl-6 pr-2 py-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 focus:outline-none focus:ring-indigo-300 placeholder:text-slate-300" />
              </div>
              {search && <button type="button" onClick={() => { setSearch(''); setSearchDraft(''); }} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Clear</button>}
            </form>
          </div>

          {loading && events.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-300">Loading…</div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-300">Nothing matches these filters yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {events.map(e => {
                const detail = detailFor(e);
                return (
                  <div key={e.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-slate-50/60">
                    <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', tone(e))} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">{labelFor(e)}</span>
                        {!e.ok && <span className="text-[9px] font-black uppercase tracking-wide text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Failed</span>}
                        {e.org_id && e.org_name && (
                          <button onClick={() => onFilterOrg({ id: e.org_id!, name: e.org_name! })}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 truncate max-w-[180px]" title="Show only this account">
                            {e.org_name}
                          </button>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {[e.actor_email && e.actor_email !== 'system' && e.actor_email !== 'admin' ? e.actor_email : (e.actor_role === 'system' ? 'system' : e.actor_role === 'admin' ? 'admin' : null), detail, e.ip].filter(Boolean).join(' · ')}
                      </div>
                      {e.meta?.error && <div className="text-[11px] text-red-500 truncate" title={String(e.meta.error)}>{String(e.meta.error)}</div>}
                    </div>
                    <span className="text-[10px] text-slate-300 whitespace-nowrap mt-0.5" title={parseTs(e.created_at).toLocaleString()}>{ago(e.created_at)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
            <span>Showing {events.length.toLocaleString()} of {total.toLocaleString()}</span>
            {events.length < total && (
              <button onClick={loadMore} disabled={loadingMore} className="font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── AI USAGE ── */}
      {view === 'ai' && (
        <div className="space-y-4">
          <div className={cn(CARD, 'p-4 flex items-center gap-4 flex-wrap')}>
            <Sparkles className="w-4 h-4 text-violet-500" />
            <div className="text-xs text-slate-500 flex-1 min-w-[220px]">
              Smart Fill and document import are paid API calls. Each account gets <b className="text-slate-800">{ai?.defaultLimit ?? '…'}</b> requests a day
              (resets at midnight UTC). Raise it for a heavy legitimate user, lower it - or set 0 - for an account that's burning credits.
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-violet-600">{ai?.todayTotal ?? 0}</div>
              <div className="text-[10px] text-slate-400">requests today</div>
            </div>
          </div>

          {ai && ai.daily.length > 0 && (
            <div className={cn(CARD, 'p-4')}>
              <div className="text-[11px] font-bold text-slate-500 mb-3">Requests per day (30 days)</div>
              <div className="flex items-end gap-1 h-16">
                {ai.daily.map(d => (
                  <div key={d.date} className="flex-1 min-w-[6px] bg-violet-300 rounded-t" style={{ height: `${Math.max(6, (d.calls / Math.max(...ai.daily.map(x => x.calls))) * 100)}%` }} title={`${d.date}: ${d.calls}`} />
                ))}
              </div>
            </div>
          )}

          <div className={cn(CARD, 'overflow-hidden')}>
            <div className="hidden sm:grid grid-cols-[1fr_60px_60px_60px_60px_170px] gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-50">
              <span>Account</span><span className="text-right">Today</span><span className="text-right">7d</span><span className="text-right">30d</span><span className="text-right">Blocked</span><span>Daily limit</span>
            </div>
            {!ai ? (
              <div className="py-12 text-center text-sm text-slate-300">Loading…</div>
            ) : ai.orgs.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-300">No AI requests recorded yet</div>
            ) : ai.orgs.map(o => {
              const draft = limitDrafts[o.id];
              const dirty = draft !== undefined && draft !== String(o.limit);
              return (
                <div key={o.id} className="grid grid-cols-2 sm:grid-cols-[1fr_60px_60px_60px_60px_170px] gap-2 px-4 py-2.5 items-center border-b border-slate-50 last:border-0">
                  <div className="min-w-0 col-span-2 sm:col-span-1">
                    <button onClick={() => { onFilterOrg({ id: o.id, name: o.name }); setView('feed'); setFamily('ai.'); }} className="text-xs font-bold text-slate-800 hover:text-indigo-600 truncate block max-w-full text-left">{o.name}</button>
                    <div className="text-[10px] text-slate-400 truncate">{o.email}</div>
                  </div>
                  <span className={cn('text-xs font-black text-right', o.today >= o.limit ? 'text-red-600' : 'text-slate-700')}>{o.today}</span>
                  <span className="text-xs text-slate-500 text-right">{o.last7}</span>
                  <span className="text-xs text-slate-500 text-right">{o.last30}</span>
                  <span className={cn('text-xs text-right', o.blocked30 > 0 ? 'font-black text-red-500' : 'text-slate-300')}>{o.blocked30}</span>
                  <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5">
                    <input type="number" min={0} value={draft ?? String(o.limit)}
                      onChange={e => setLimitDrafts(d => ({ ...d, [o.id]: e.target.value }))}
                      className={cn('w-16 text-xs font-bold text-right px-2 py-1 rounded-lg ring-1 focus:outline-none focus:ring-indigo-300', o.customLimit ? 'ring-violet-200 bg-violet-50 text-violet-700' : 'ring-slate-200 bg-slate-50 text-slate-600')} />
                    {dirty && <button onClick={() => saveLimit(o.id, draft!)} disabled={savingLimit === o.id} className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-2 py-1 disabled:opacity-50">Save</button>}
                    {!dirty && o.customLimit && <button onClick={() => saveLimit(o.id, null)} disabled={savingLimit === o.id} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Reset</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECURITY ── */}
      {view === 'security' && (
        <div className="space-y-4">
          {summary && summary.daily.length > 0 && (
            <div className={cn(CARD, 'p-4')}>
              <div className="text-[11px] font-bold text-slate-500 mb-3">Events per day <span className="text-red-400 font-medium">(red = failed sign-ins)</span></div>
              <div className="flex items-end gap-1 h-16">
                {summary.daily.map(d => (
                  <div key={d.date} className="flex-1 min-w-[6px] flex flex-col justify-end" title={`${d.date}: ${d.events} events, ${d.failed_logins} failed sign-ins`}>
                    <div className="w-full bg-red-400 rounded-t" style={{ height: `${(d.failed_logins / maxDaily) * 64}px` }} />
                    <div className="w-full bg-indigo-200" style={{ height: `${Math.max(2, ((d.events - d.failed_logins) / maxDaily) * 64)}px` }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={cn(CARD, 'overflow-hidden')}>
              <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <h3 className="text-xs font-black text-slate-700">Failed sign-ins by IP address</h3>
              </div>
              {!summary || summary.failedLoginsByIp.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-300">No failed sign-ins in this period</div>
              ) : summary.failedLoginsByIp.map(r => {
                const sus = r.emails >= 3 || r.attempts >= 10;
                return (
                  <div key={r.ip} className="px-4 py-2.5 flex items-center gap-3 border-b border-slate-50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono font-bold text-slate-700">{r.ip}</div>
                      <div className="text-[10px] text-slate-400">{r.emails} different email{r.emails !== 1 ? 's' : ''} tried · last {ago(r.last_at)}</div>
                    </div>
                    {sus && <span className="text-[9px] font-black uppercase tracking-wide text-red-600 bg-red-50 px-1.5 py-0.5 rounded" title="Many attempts or many different emails from one address - looks like guessing">Suspicious</span>}
                    <span className="text-sm font-black text-red-600 w-8 text-right">{r.attempts}</span>
                    <button onClick={() => { setSearchDraft(r.ip); setSearch(r.ip); setFamily('auth.'); setView('feed'); }} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">View</button>
                  </div>
                );
              })}
            </div>

            <div className={cn(CARD, 'overflow-hidden')}>
              <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <h3 className="text-xs font-black text-slate-700">Accounts being guessed at</h3>
              </div>
              {!summary || summary.failedLoginsByEmail.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-300">No failed sign-ins in this period</div>
              ) : summary.failedLoginsByEmail.map(r => {
                const sus = r.attempts >= 5;
                return (
                  <div key={r.email} className="px-4 py-2.5 flex items-center gap-3 border-b border-slate-50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-700 truncate">{r.email}</div>
                      <div className="text-[10px] text-slate-400">from {r.ips} address{r.ips !== 1 ? 'es' : ''} · last {ago(r.last_at)}</div>
                    </div>
                    {sus && <span className="text-[9px] font-black uppercase tracking-wide text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Repeated</span>}
                    <span className="text-sm font-black text-amber-600 w-8 text-right">{r.attempts}</span>
                    <button onClick={() => { setSearchDraft(r.email); setSearch(r.email); setFamily('auth.'); setView('feed'); }} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">View</button>
                  </div>
                );
              })}
            </div>
          </div>

          {summary && summary.byType.length > 0 && (
            <div className={cn(CARD, 'p-4')}>
              <div className="text-[11px] font-bold text-slate-500 mb-3">What happened most</div>
              <div className="flex flex-wrap gap-2">
                {summary.byType.slice(0, 14).map(b => (
                  <button key={b.type} onClick={() => { setFamily(''); setSearchDraft(''); setSearch(''); setView('feed'); setFamily(b.type.split('.')[0] + '.'); }}
                    className="text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-100 rounded-lg px-2.5 py-1">
                    {LABELS[b.type] || b.type} <span className="text-slate-400 font-medium">{b.count}</span>{b.failed > 0 && <span className="text-red-500 font-black"> · {b.failed} failed</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
