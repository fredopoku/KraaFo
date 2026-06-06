import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, AlertCircle, FileText, Receipt, Users, Quote, Plus, Settings, ArrowRight, CheckCircle, Star, Mail, Send, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { useOrg } from '../hooks/useOrg';
import { api, formatCurrency } from '../utils/api';
import { LogoMark, Logo } from '../components/Logo';
import { cn } from '../utils/cn';

export default function Dashboard() {
  const navigate = useNavigate();
  const { org, loading } = useOrg();
  const [data, setData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Community state
  const [feedbackData, setFeedbackData] = useState<{ feedback: any[]; averageRating: number; total: number } | null>(null);
  const [subCount, setSubCount] = useState(0);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [showAllFeedback, setShowAllFeedback] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string>('');

  useEffect(() => {
    if (!org) return;
    api.analytics.get(org.id).then(d => { setData(d); setFetching(false); }).catch(() => setFetching(false));
    api.feedback.list().then(setFeedbackData).catch(() => {});
    api.subscribers.list().then(r => setSubCount(r.total)).catch(() => {});
    api.broadcasts.list().then(setBroadcasts).catch(() => {});
  }, [org]);

  const handleBroadcast = async () => {
    if (!broadcastForm.subject.trim() || !broadcastForm.body.trim()) return;
    setSending(true); setBroadcastResult('');
    try {
      const r = await api.broadcasts.send(broadcastForm);
      setBroadcastResult(`Sent to ${r.sent} subscriber${r.sent !== 1 ? 's' : ''}${r.failed ? ` (${r.failed} failed)` : ''}`);
      setBroadcastForm({ subject: '', body: '' });
      api.broadcasts.list().then(setBroadcasts).catch(() => {});
    } catch (err: any) {
      setBroadcastResult(err.message || 'Failed to send');
    } finally { setSending(false); }
  };

  if (loading || fetching) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <LogoMark size={72} className="animate-float" />
    </div>
  );

  if (!org) { navigate('/setup'); return null; }

  const sym = org.currency_symbol;
  const primary = org.primary_color;
  const s = data?.summary || {};

  const statCards = [
    { label: 'Total Revenue',  value: formatCurrency(s.totalRevenue || 0, sym), sub: `${s.paidInvoices || 0} paid invoices`,                                           icon: TrendingUp,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Outstanding',    value: formatCurrency(s.outstanding  || 0, sym), sub: 'Awaiting payment',                                                               icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-50'   },
    { label: 'Overdue',        value: formatCurrency(s.overdue      || 0, sym), sub: `${s.overdueCount || 0} overdue invoice${s.overdueCount !== 1 ? 's' : ''}`,       icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50'     },
    { label: 'Total Invoices', value: s.totalInvoices || 0,                     sub: `${s.totalReceipts || 0} receipts · ${s.totalQuotes || 0} quotes`,                 icon: FileText,    color: 'text-indigo-600', bg: 'bg-indigo-50'  },
  ];

  const maxRevenue = Math.max(...(data?.monthly || []).map((m: any) => m.revenue || 0), 1);

  const STATUS_COLOR: Record<string, string> = {
    paid:      'bg-emerald-50 text-emerald-700',
    sent:      'bg-blue-50 text-blue-700',
    draft:     'bg-slate-100 text-slate-500',
    overdue:   'bg-red-50 text-red-600',
    cancelled: 'bg-slate-100 text-slate-400',
  };

  return (
    <div className="min-h-screen bg-slate-50/70">

      {/* Header */}
      <header className="bg-white/90 glass border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-2" style={{ height: '68px' }}>

          {/* Brand — logo only on mobile, logo+name on sm+ */}
          <button onClick={() => navigate('/')} className="shrink-0 hover:opacity-80 transition-opacity">
            <Logo size="sm" className="sm:hidden" />
            <Logo size="md" className="hidden sm:flex" />
            <span className="text-slate-200 hidden sm:block">|</span>
            <span className="text-xs text-slate-400 font-medium hidden sm:block truncate max-w-[160px]">{org.name}</span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Clients + Quotes hidden on mobile */}
            <button onClick={() => navigate('/clients')} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all">
              <Users className="w-3.5 h-3.5" /> Clients
            </button>
            <button onClick={() => navigate('/generator', { state: { mode: 'quote' } })} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all">
              <Quote className="w-3.5 h-3.5" /> Quotes
            </button>

            {/* New Invoice — icon+text on sm+, icon only on mobile */}
            <button
              onClick={() => navigate('/generator')}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all btn-glow"
              style={{ background: primary }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Invoice</span>
            </button>

            <button onClick={() => navigate('/setup')} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8">

        {/* Greeting — split so long org names don't overflow */}
        <div className="mb-6 animate-fade-up">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Good {getGreeting()}</p>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">{org.name} 👋</h1>
          <p className="text-sm text-slate-400 mt-1">Here's your business overview</p>
        </div>

        {/* Stat cards — 2 col on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {statCards.map((card, i) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover-lift animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-3', card.bg)}>
                <card.icon className={cn('', card.color)} style={{ width: 16, height: 16 }} />
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">{card.value}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">{card.label}</div>
              <div className="text-[10px] text-slate-300 mt-1 leading-tight">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart + Top Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-up delay-100">
            <h2 className="text-sm font-black text-slate-700 tracking-tight mb-4">Revenue (Last 6 Months)</h2>
            {data?.monthly?.length > 0 ? (
              <div className="flex items-end gap-2 sm:gap-3 h-32">
                {data.monthly.map((m: any) => {
                  const height = Math.max(8, (m.revenue / maxRevenue) * 100);
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate w-full text-center">
                        {formatCurrency(m.revenue, sym, true)}
                      </div>
                      <div className="w-full rounded-t-lg transition-all" style={{ height: `${height}%`, background: primary, opacity: 0.85 }} />
                      <div className="text-[9px] sm:text-[10px] text-slate-400">{m.month.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-sm text-slate-300">No paid invoices yet — start billing!</div>
            )}
          </div>

          {/* Top clients */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-up delay-150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-700 tracking-tight">Top Clients</h2>
              <button onClick={() => navigate('/clients')} className="text-[11px] text-indigo-500 font-bold hover:text-indigo-700 flex items-center gap-0.5">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {data?.topClients?.length > 0 ? (
              <div className="space-y-3">
                {data.topClients.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{c.client_name}</div>
                      {c.company && <div className="text-[10px] text-slate-400 truncate">{c.company}</div>}
                    </div>
                    <div className="text-xs font-black text-slate-700 shrink-0">{formatCurrency(c.total_revenue, sym)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-300 text-center py-4">No data yet</div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-up delay-200">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-700 tracking-tight">Recent Activity</h2>
            <button onClick={() => navigate('/generator')} className="text-[11px] text-indigo-500 font-bold hover:text-indigo-700 flex items-center gap-0.5">
              New document <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {data?.recent?.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {data.recent.map((inv: any) => (
                <button
                  key={inv.id}
                  onClick={() => navigate('/generator', { state: { loadId: inv.id } })}
                  className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', inv.type === 'receipt' ? 'bg-emerald-50' : 'bg-indigo-50')}>
                      {inv.type === 'receipt'
                        ? <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        : <FileText className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800">{inv.number}</div>
                      <div className="text-xs text-slate-400 truncate">{inv.client_name} · {inv.issue_date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize hidden sm:inline-block', STATUS_COLOR[inv.status] || STATUS_COLOR.draft)}>
                      {inv.status}
                    </span>
                    <span className="text-sm font-black text-slate-700">{formatCurrency(inv.total, sym)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center">
              <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No documents yet</p>
              <button onClick={() => navigate('/generator')} className="mt-4 px-5 py-2 rounded-xl text-xs font-bold text-white btn-glow" style={{ background: primary }}>
                Create your first invoice
              </button>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up delay-300">
          {[
            { label: 'New Invoice', icon: FileText, action: () => navigate('/generator') },
            { label: 'New Quote',   icon: Quote,    action: () => navigate('/generator', { state: { mode: 'quote' } }) },
            { label: 'Clients',     icon: Users,    action: () => navigate('/clients') },
            { label: 'Settings',    icon: Settings, action: () => navigate('/setup') },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 hover-lift shadow-sm transition-all text-left hover:border-indigo-200 group">
              <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors shrink-0">
                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ── Community ─────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-up delay-300">

          {/* Ratings + Feedback panel */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-700 tracking-tight">User Feedback</h2>
                  {feedbackData && feedbackData.total > 0 && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {feedbackData.averageRating.toFixed(1)} avg · {feedbackData.total} review{feedbackData.total !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              {feedbackData && feedbackData.total > 0 && (
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={cn('w-3.5 h-3.5', n <= Math.round(feedbackData.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                  ))}
                </div>
              )}
            </div>

            {!feedbackData || feedbackData.total === 0 ? (
              <div className="py-10 text-center">
                <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-300">No feedback yet</p>
                <p className="text-xs text-slate-200 mt-1">Ratings appear here once users submit them on the landing page</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {(showAllFeedback ? feedbackData.feedback : feedbackData.feedback.slice(0, 4)).map((f: any) => (
                  <div key={f.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold text-slate-800">{f.name}</span>
                          {f.email && <span className="text-[10px] text-slate-400 truncate hidden sm:block">{f.email}</span>}
                        </div>
                        {f.message && <p className="text-xs text-slate-500 leading-relaxed">{f.message}</p>}
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} className={cn('w-3 h-3', n <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100')} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1.5">{new Date(f.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                ))}
                {feedbackData.feedback.length > 4 && (
                  <button
                    onClick={() => setShowAllFeedback(v => !v)}
                    className="w-full px-5 py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-700 hover:bg-slate-50 transition-colors"
                  >
                    {showAllFeedback ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show all {feedbackData.feedback.length} reviews</>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Broadcast panel */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-700 tracking-tight">Send Update Email</h2>
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
                placeholder={"Write your update here…\n\nTip: keep it short and exciting!"}
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none flex-1"
              />
              <button
                onClick={handleBroadcast}
                disabled={sending || !broadcastForm.subject.trim() || !broadcastForm.body.trim() || subCount === 0}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: primary }}
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending…' : `Send to ${subCount} subscriber${subCount !== 1 ? 's' : ''}`}
              </button>
              {broadcastResult && (
                <p className={cn('text-xs text-center font-semibold', broadcastResult.startsWith('Sent') ? 'text-emerald-600' : 'text-red-500')}>
                  {broadcastResult}
                </p>
              )}
              {subCount === 0 && <p className="text-xs text-slate-300 text-center">No subscribers yet — the signup form is live on your landing page</p>}
            </div>

            {/* Recent broadcasts */}
            {broadcasts.length > 0 && (
              <div className="border-t border-slate-50 px-5 pb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-3 mb-2">Recent sends</p>
                <div className="space-y-2">
                  {broadcasts.slice(0, 3).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-600 truncate font-medium">{b.subject}</p>
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
