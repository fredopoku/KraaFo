import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, AlertCircle, FileText, Receipt, Users, Quote, Plus, Settings, ArrowRight, CheckCircle } from 'lucide-react';
import { useOrg } from '../hooks/useOrg';
import { api, formatCurrency } from '../utils/api';
import { LogoMark, Logo } from '../components/Logo';
import { cn } from '../utils/cn';

export default function Dashboard() {
  const navigate = useNavigate();
  const { org, loading } = useOrg();
  const [data, setData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!org) return;
    api.analytics.get(org.id).then(d => { setData(d); setFetching(false); }).catch(() => setFetching(false));
  }, [org]);

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
