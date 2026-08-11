import { useState, useEffect, useCallback } from 'react';
import { Star, Mail, Send, Megaphone, ChevronDown, ChevronUp, LogOut, Shield, Building2, Users, FileText, Receipt, Quote, TrendingUp, TrendingDown, Activity, Trash2, Zap, Plus, X, ArrowRight, CheckCircle, AlertCircle, Globe, Monitor, Smartphone, Tablet, Eye, ChevronRight, Phone, ExternalLink, UserCheck, Clock, BarChart2, MousePointerClick, UserPlus, PenSquare, Search, Flame } from 'lucide-react';
import { LogoMark } from '../components/Logo';
import { cn } from '../utils/cn';

const STORAGE_KEY = 'krafo_admin_token';
const BASE = '/api';

function timeAgo(ts: string): string {
  if (!ts) return '—';
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard', '/generator': 'Invoice Generator', '/clients': 'Clients',
  '/quotes': 'Quotes', '/team': 'Team', '/trash': 'Trash', '/changelog': "What's New",
  '/settings': 'Settings', '/admin': 'Admin',
};
function pageName(p: string) { return PAGE_LABELS[p] || (p ? p.replace(/^\//, '') || 'App' : 'App'); }
function secsAgo(s: number) {
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
function fmtDuration(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getOrgStatus(org: any) {
  if (org.total_collected > 0) return { label: 'Power', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  const total = (org.invoice_count || 0) + (org.receipt_count || 0) + (org.quote_count || 0);
  if (org.outstanding > 0) return { label: 'Active', cls: 'bg-blue-50 text-blue-600 border-blue-100' };
  if (total > 0) return { label: 'Warm', cls: 'bg-amber-50 text-amber-600 border-amber-100' };
  return { label: 'Cold', cls: 'bg-slate-50 text-slate-400 border-slate-100' };
}

function makeArea(vals: number[], W: number, H: number) {
  if (vals.length < 2) return null;
  const max = Math.max(...vals, 1);
  const px = 3, py = 5;
  const pts = vals.map((v, i) => ({
    x: px + (i / (vals.length - 1)) * (W - px * 2),
    y: H - py - (v / max) * (H - py * 2),
  }));
  const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fill = `${pts[0].x.toFixed(1)},${H} ${line} ${pts[pts.length-1].x.toFixed(1)},${H}`;
  return { line, fill };
}

function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const r = 28, cx = 36, cy = 36, sw = 9;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cum = 0;
  return (
    <svg viewBox="0 0 72 72" className="w-[72px] h-[72px] shrink-0">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = Math.max(pct * circ - 2, 0);
        const rot = cum * 360 - 90;
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={sw} strokeDasharray={`${dash} ${circ}`} transform={`rotate(${rot}, ${cx}, ${cy})`} />;
        cum += pct;
        return el;
      })}
      <circle cx={cx} cy={cy} r={r - sw / 2 - 1} fill="white" />
    </svg>
  );
}

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
  const [usersData, setUsersData] = useState<{ orgs: any[]; summary: any; recentPayments?: any[]; platformRevenue?: any[]; platformRevenueYearly?: any[] } | null>(null);
  const [presence, setPresence] = useState<{ online: any[]; recently: any[]; online_count: number } | null>(null);
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const [changelogEntries, setChangelogEntries] = useState<any[]>([]);
  const [clForm, setClForm] = useState({ title: '', description: '', tag: 'New' });
  const [postingCl, setPostingCl] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<null | 'reviews' | 'subscribers' | 'broadcasts'>(null);
  const [showAddReview, setShowAddReview] = useState(false);
  const [addReviewForm, setAddReviewForm] = useState({ name: '', email: '', rating: 5, message: '' });
  const [addReviewHover, setAddReviewHover] = useState(0);
  const [addingReview, setAddingReview] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [adminRevenueGranularity, setAdminRevenueGranularity] = useState<'monthly' | 'yearly'>('monthly');
  const [viewsModal, setViewsModal] = useState<{ open: boolean; page?: string }>({ open: false });
  const [viewsData, setViewsData] = useState<{ views: any[]; total: number } | null>(null);
  const [viewsLoading, setViewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'users' | 'financials' | 'comms' | 'security'>('overview');
  const [flaggedSignups, setFlaggedSignups] = useState<any[]>([]);
  const [riskConfig, setRiskConfig] = useState<{ weights: Record<string, number>; thresholds: Record<string, number> } | null>(null);
  const [riskConfigDraft, setRiskConfigDraft] = useState<{ weights: Record<string, number>; thresholds: Record<string, number> } | null>(null);
  const [savingRiskConfig, setSavingRiskConfig] = useState(false);
  const [reviewingSignupId, setReviewingSignupId] = useState<string | null>(null);
  const [signupStatusFilter, setSignupStatusFilter] = useState<string>('');
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string; forcedByEnv?: boolean; effectiveEnabled?: boolean } | null>(null);
  const [maintenanceMessageDraft, setMaintenanceMessageDraft] = useState('');
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [orgSearch, setOrgSearch] = useState('');

  // Org detail drill-down
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgDetail, setOrgDetail] = useState<any | null>(null);
  const [orgDetailLoading, setOrgDetailLoading] = useState(false);
  const [orgDetailTab, setOrgDetailTab] = useState<'overview' | 'documents' | 'clients' | 'team' | 'activity'>('overview');
  const [orgActivity, setOrgActivity] = useState<any | null>(null);
  const [orgActivityLoading, setOrgActivityLoading] = useState(false);

  const loadPresence = useCallback(async (t: string) => {
    const data = await adminFetch<any>('/admin/presence', t).catch(() => null);
    if (data) setPresence(data);
  }, []);

  const loadData = useCallback(async (t: string, d = 30) => {
    const [fb, subs, bcs, users, cl, analytics, activity, flagged, risk, maint] = await Promise.all([
      adminFetch<any>('/feedback', t).catch(() => null),
      adminFetch<any>('/subscribers', t).catch(() => ({ subscribers: [], total: 0 })),
      adminFetch<any[]>('/broadcasts', t).catch(() => []),
      adminFetch<any>('/admin/users', t).catch(() => null),
      fetch(`${BASE}/changelog`).then(r => r.json()).catch(() => ({ entries: [] })),
      adminFetch<any>(`/admin/analytics?days=${d}`, t).catch(() => null),
      adminFetch<any>('/admin/activity', t).catch(() => ({ events: [] })),
      adminFetch<any>('/admin/signups/flagged', t).catch(() => ({ signups: [] })),
      adminFetch<any>('/admin/risk-config', t).catch(() => null),
      adminFetch<any>('/admin/maintenance', t).catch(() => null),
    ]);
    if (fb) setFeedbackData(fb);
    setSubCount(subs?.total ?? 0);
    setSubscribers(subs?.subscribers || []);
    setBroadcasts(bcs || []);
    if (users) setUsersData(users);
    setChangelogEntries(cl?.entries || []);
    if (analytics) setAnalyticsData(analytics);
    setActivityData(activity?.events || []);
    setFlaggedSignups(flagged?.signups || []);
    if (risk) { setRiskConfig(risk); setRiskConfigDraft(risk); }
    if (maint) { setMaintenance(maint); setMaintenanceMessageDraft(maint.message); }
    await loadPresence(t);
  }, [loadPresence]);

  const loadFlaggedSignups = useCallback(async (status: string) => {
    if (!token) return;
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const data = await adminFetch<any>(`/admin/signups/flagged${qs}`, token).catch(() => ({ signups: [] }));
    setFlaggedSignups(data?.signups || []);
  }, [token]);

  const handleReviewSignup = async (id: string, decision: 'clear' | 'verify' | 'reject') => {
    setReviewingSignupId(id);
    try {
      await adminFetch(`/admin/signups/${id}/review`, token, { method: 'POST', body: JSON.stringify({ decision }) });
      await loadFlaggedSignups(signupStatusFilter);
      showToast('success', `Signup ${decision === 'reject' ? 'rejected' : decision === 'verify' ? 'verified' : 'cleared'}.`);
    } catch (err: any) {
      showToast('error', err.message || 'Could not update signup');
    } finally {
      setReviewingSignupId(null);
    }
  };

  const handleSaveRiskConfig = async () => {
    if (!riskConfigDraft) return;
    setSavingRiskConfig(true);
    try {
      const updated = await adminFetch<any>('/admin/risk-config', token, { method: 'PUT', body: JSON.stringify(riskConfigDraft) });
      setRiskConfig(updated);
      setRiskConfigDraft(updated);
      showToast('success', 'Risk config saved.');
    } catch (err: any) {
      showToast('error', err.message || 'Could not save risk config');
    } finally {
      setSavingRiskConfig(false);
    }
  };

  const handleToggleMaintenance = async (enabled: boolean) => {
    setSavingMaintenance(true);
    try {
      const updated = await adminFetch<any>('/admin/maintenance', token, { method: 'PUT', body: JSON.stringify({ enabled }) });
      setMaintenance(updated);
      showToast('success', enabled ? 'Maintenance mode is now ON - the live site is showing the maintenance page.' : 'Maintenance mode is now off.');
    } catch (err: any) {
      showToast('error', err.message || 'Could not update maintenance mode');
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleSaveMaintenanceMessage = async () => {
    setSavingMaintenance(true);
    try {
      const updated = await adminFetch<any>('/admin/maintenance', token, { method: 'PUT', body: JSON.stringify({ message: maintenanceMessageDraft }) });
      setMaintenance(updated);
      setMaintenanceMessageDraft(updated.message);
      showToast('success', 'Maintenance message saved.');
    } catch (err: any) {
      showToast('error', err.message || 'Could not save maintenance message');
    } finally {
      setSavingMaintenance(false);
    }
  };

  const refreshAnalytics = async (d: number) => {
    if (!token) return;
    setAnalyticsLoading(true);
    try {
      const data = await adminFetch<any>(`/admin/analytics?days=${d}`, token);
      setAnalyticsData(data);
    } catch {} finally { setAnalyticsLoading(false); }
  };

  const openOrgDetail = async (id: string) => {
    setSelectedOrgId(id);
    setOrgDetail(null);
    setOrgActivity(null);
    setOrgDetailTab('overview');
    setOrgDetailLoading(true);
    try {
      const data = await adminFetch<any>(`/admin/orgs/${id}`, token);
      setOrgDetail(data);
    } catch (err: any) {
      showToast('error', err.message || 'Could not load org details');
      setSelectedOrgId(null);
    } finally { setOrgDetailLoading(false); }
  };

  const loadOrgActivity = async (id: string) => {
    if (orgActivity) return; // already loaded
    setOrgActivityLoading(true);
    try {
      const data = await adminFetch<any>(`/admin/orgs/${id}/activity`, token);
      setOrgActivity(data);
    } catch {} finally { setOrgActivityLoading(false); }
  };

  const closeOrgDetail = () => { setSelectedOrgId(null); setOrgDetail(null); setOrgActivity(null); };

  // Validate stored token on mount
  useEffect(() => {
    if (!token) return;
    adminFetch('/feedback', token)
      .then(() => { setAuthed(true); loadData(token); })
      .catch(() => { sessionStorage.removeItem(STORAGE_KEY); setToken(''); });
  }, []);

  // Refresh presence every 30s when on users tab
  useEffect(() => {
    if (!token || !authed) return;
    const id = setInterval(() => loadPresence(token), 30000);
    return () => clearInterval(id);
  }, [token, authed, loadPresence]);

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

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ title, message, onConfirm });
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken(''); setAuthed(false); setInput('');
  };

  const handleBroadcast = async () => {
    if (!broadcastForm.subject.trim() || !broadcastForm.body.trim()) return;
    setSending(true);
    try {
      const r = await adminFetch<any>('/broadcasts', token, {
        method: 'POST',
        body: JSON.stringify(broadcastForm),
      });
      setBroadcastForm({ subject: '', body: '' });
      adminFetch<any[]>('/broadcasts', token).then(setBroadcasts).catch(() => {});
      showToast('success', `Sent to ${r.sent} subscriber${r.sent !== 1 ? 's' : ''}${r.failed ? ` · ${r.failed} failed` : ''}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send broadcast');
    } finally { setSending(false); }
  };

  const handleAddReview = async () => {
    if (!addReviewForm.name.trim()) return;
    setAddingReview(true);
    try {
      await fetch(`${BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addReviewForm),
      });
      setShowAddReview(false);
      setAddReviewForm({ name: '', email: '', rating: 5, message: '' });
      setAddReviewHover(0);
      adminFetch<any>('/feedback', token).then(setFeedbackData).catch(() => {});
      showToast('success', 'Review added successfully');
    } catch {
      showToast('error', 'Failed to add review - please try again');
    } finally { setAddingReview(false); }
  };

  const handleDeleteFeedback = (id: string) => {
    showConfirm(
      'Remove review?',
      'This review will be permanently deleted and will no longer appear on the landing page.',
      async () => {
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
          showToast('success', 'Review removed');
        } catch {
          showToast('error', 'Failed to delete review');
        }
      }
    );
  };

  const handleApproveFeedback = async (id: string, currentlyApproved: boolean) => {
    try {
      await adminFetch(`/feedback/${id}/approve`, token, { method: 'PATCH' });
      setFeedbackData(prev => prev ? {
        ...prev,
        feedback: prev.feedback.map(f => f.id === id ? { ...f, approved: currentlyApproved ? 0 : 1 } : f),
      } : prev);
      showToast('success', currentlyApproved ? 'Removed from homepage' : 'Now showing on homepage');
    } catch {
      showToast('error', 'Failed to update review');
    }
  };

  const handlePostChangelog = async () => {
    if (!clForm.title.trim() || !clForm.description.trim()) return;
    setPostingCl(true);
    try {
      const r = await adminFetch<any>('/changelog', token, { method: 'POST', body: JSON.stringify(clForm) });
      setChangelogEntries(prev => [r.entry, ...prev]);
      setClForm({ title: '', description: '', tag: 'New' });
      showToast('success', 'Changelog entry posted');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to post entry');
    } finally { setPostingCl(false); }
  };

  const handleDeleteChangelog = (id: string) => {
    showConfirm(
      'Delete changelog entry?',
      'This update will be permanently removed from the public changelog and the What\'s New panel.',
      async () => {
        try {
          await adminFetch(`/changelog/${id}`, token, { method: 'DELETE' });
          setChangelogEntries(prev => prev.filter(e => e.id !== id));
          showToast('success', 'Entry deleted');
        } catch {
          showToast('error', 'Failed to delete entry');
        }
      }
    );
  };

  const openViewsModal = async (page?: string) => {
    setViewsModal({ open: true, page });
    setViewsLoading(true);
    try {
      const url = page ? `/admin/analytics/views?page=${encodeURIComponent(page)}&limit=200` : '/admin/analytics/views?limit=200';
      const data = await adminFetch<any>(url, token);
      setViewsData(data);
    } catch { setViewsData(null); }
    finally { setViewsLoading(false); }
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

      {/* Tab navigation */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-[60px] z-30">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {([
            { key: 'overview', label: 'Overview', icon: BarChart2 },
            { key: 'traffic', label: 'Traffic', icon: Globe },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'financials', label: 'Financials', icon: TrendingUp },
            { key: 'comms', label: 'Comms', icon: Megaphone },
            { key: 'security', label: 'Security', icon: Shield },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all',
                activeTab === tab.key
                  ? 'border-indigo-400 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ══ OVERVIEW TAB ══════════════════════════════════════ */}
        {activeTab === 'overview' && (() => {
          const ov = analyticsData?.overview;
          const pv = analyticsData?.prev;
          const periodTrend = ov && pv?.total ? { pct: Math.round(((ov.period - pv.total) / pv.total) * 100), up: ov.period >= pv.total } : null;
          const dateMap: Record<string, { views: number; signups: number }> = {};
          analyticsData?.daily?.forEach((d: any) => { dateMap[d.date] = { views: d.count, signups: 0 }; });
          analyticsData?.signupsDaily?.forEach((d: any) => {
            if (dateMap[d.date]) dateMap[d.date].signups = d.count;
            else dateMap[d.date] = { views: 0, signups: d.count };
          });
          const chartDates = Object.keys(dateMap).sort();
          const viewSeries = chartDates.map(d => dateMap[d].views);
          const signupSeries = chartDates.map(d => dateMap[d].signups);
          const maxV = Math.max(...viewSeries, 1);
          const W = 500, H = 100;
          const viewArea = makeArea(viewSeries, W, H);
          const signupAreaScaled = makeArea(signupSeries.map(v => (v / Math.max(...signupSeries, 1)) * maxV), W, H);
          return (<>

        {/* ── Live Pulse Banner ──────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                <span className="text-white font-black text-sm">Platform Pulse</span>
                {analyticsData?.realtime?.active > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {analyticsData.realtime.active} visitors on site
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {([{ label: '7d', value: 7 }, { label: '30d', value: 30 }, { label: '90d', value: 90 }, { label: 'All', value: 0 }] as const).map(opt => (
                  <button key={opt.value} onClick={() => { setDays(opt.value); refreshAnalytics(opt.value); }}
                    className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all', days === opt.value ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70')}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Visitors', sub: `${days > 0 ? days + 'd' : 'all time'}`, value: (ov?.period ?? 0).toLocaleString(), extra: periodTrend ? `${periodTrend.up ? '▲' : '▼'} ${Math.abs(periodTrend.pct)}% vs prev` : null, extraColor: periodTrend?.up ? 'text-emerald-400' : 'text-red-400' },
                { label: "Today's views", sub: 'page views', value: (ov?.today ?? 0).toLocaleString(), extra: null, extraColor: '' },
                { label: 'Total Signups', sub: 'all time', value: (analyticsData?.signupSummary?.total ?? 0).toLocaleString(), extra: `${analyticsData?.signupSummary?.period ?? 0} last ${days > 0 ? days + 'd' : 'period'} · ${analyticsData?.signupSummary?.today ?? 0} today`, extraColor: 'text-emerald-400' },
                { label: 'Active orgs', sub: 'last 30 days', value: (usersData?.summary?.active_orgs ?? 0).toLocaleString(), extra: `${usersData?.summary?.new_this_week ?? 0} this week`, extraColor: 'text-white/40' },
              ].map(item => (
                <div key={item.label} className="bg-white/[0.07] hover:bg-white/10 transition-colors rounded-xl p-3.5 border border-white/10">
                  <div className="text-xl sm:text-2xl font-black text-white leading-none">{item.value}</div>
                  <div className="text-[10px] text-white/50 mt-1.5">{item.label}</div>
                  {item.extra && <div className={cn('text-[10px] font-bold mt-0.5', item.extraColor)}>{item.extra}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI cards ──────────────────────────────────────── */}
        {usersData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total orgs', value: usersData.summary.total_orgs, sub: `${usersData.summary.new_this_week} new this week`, icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-50', ring: 'ring-indigo-100' },
              { label: 'Invoices', value: usersData.summary.total_invoices, sub: `+ ${usersData.summary.total_receipts} receipts · ${usersData.summary.total_quotes} quotes${usersData.summary.total_trashed > 0 ? ` · ${usersData.summary.total_trashed} in trash` : ''}`, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-100' },
              { label: 'Collected', value: `$${Number(usersData.summary.total_collected || 0).toLocaleString()}`, sub: `$${Number(usersData.summary.total_outstanding || 0).toLocaleString()} outstanding`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
              { label: 'Team members', value: usersData.summary.total_team_members, sub: `${usersData.summary.team_accounts} team accounts`, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', ring: 'ring-violet-100' },
            ].map(card => (
              <div key={card.label} className={cn('bg-white rounded-2xl p-4 ring-1 shadow-sm', card.ring)}>
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-3', card.bg)}>
                  <card.icon className={cn('w-4 h-4', card.color)} />
                </div>
                <div className="text-2xl font-black text-slate-900 leading-none">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-medium">{card.label}</div>
                <div className="text-[9px] text-slate-300 mt-0.5 truncate">{card.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Growth chart + Funnel ───────────────────────── */}
        {analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-black text-slate-700">Growth Trend</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-500 inline-block rounded" />Views</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />Signups</span>
                </div>
              </div>
              {viewArea ? (
                <div className="mt-3">
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ovGradV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="ovGradS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75].map(y => (
                      <line key={y} x1="0" y1={y * H} x2={W} y2={y * H} stroke="#f1f5f9" strokeWidth="1" />
                    ))}
                    <polygon points={viewArea.fill} fill="url(#ovGradV)" />
                    <polyline points={viewArea.line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {signupAreaScaled && <>
                      <polygon points={signupAreaScaled.fill} fill="url(#ovGradS)" />
                      <polyline points={signupAreaScaled.line} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </>}
                  </svg>
                  <div className="flex justify-between text-[9px] text-slate-300 mt-1">
                    <span>{chartDates[0]?.slice(5)}</span>
                    <span>{chartDates[chartDates.length - 1]?.slice(5)}</span>
                  </div>
                </div>
              ) : (
                <div className="h-28 flex items-center justify-center text-slate-200 text-sm">No data yet</div>
              )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-5">
              <p className="text-xs font-black text-slate-700 mb-4">Conversion Funnel</p>
              {(() => {
                const visitors = analyticsData.overview?.period ?? 0;
                const signups = analyticsData.signupSummary?.period ?? 0;
                const active = analyticsData.activeSignups ?? 0;
                const senders = analyticsData.senderCount ?? 0;
                const steps = [
                  { label: 'Visitors', value: visitors, hex: '#6366f1' },
                  { label: 'Signups', value: signups, hex: '#10b981' },
                  { label: 'Created doc', value: active, hex: '#3b82f6' },
                  { label: 'Sent doc', value: senders, hex: '#8b5cf6' },
                ];
                const max = Math.max(visitors, 1);
                return (
                  <div className="space-y-3">
                    {steps.map((step, i) => {
                      const pct = Math.round((step.value / max) * 100);
                      const conv = i > 0 && steps[i-1].value > 0 ? Math.round((step.value / steps[i-1].value) * 100) : null;
                      return (
                        <div key={step.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-slate-600">{step.label}</span>
                            <div className="flex items-center gap-2">
                              {conv !== null && <span className="text-[9px] font-bold text-slate-400">{conv}%</span>}
                              <span className="text-xs font-black text-slate-800">{step.value.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: step.hex }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Activity feed + Comms ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-black text-slate-700">Platform Activity</h2>
              </div>
              <span className="text-[10px] text-slate-400">Last 30 days</span>
            </div>
            {activityData.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-300">Activity will appear here as users interact</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[340px] overflow-y-auto">
                {activityData.map((ev: any, idx: number) => {
                  const cfg: Record<string, { icon: any; bg: string; color: string; label: string }> = {
                    signup:  { icon: UserPlus,    bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'New signup' },
                    payment: { icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-700', label: 'Payment received' },
                    sent:    { icon: Send,         bg: 'bg-blue-50',    color: 'text-blue-600',    label: 'Document sent' },
                    doc:     { icon: FileText,     bg: 'bg-indigo-50',  color: 'text-indigo-600',  label: 'Document' },
                    quote:   { icon: Quote,        bg: 'bg-violet-50',  color: 'text-violet-600',  label: 'Quote' },
                  };
                  const c = cfg[ev.type] || cfg.doc;
                  const Icon = c.icon;
                  return (
                    <div key={idx} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', c.bg)}>
                        <Icon className={cn('w-3.5 h-3.5', c.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate">{ev.title}</span>
                          {ev.amount > 0 && (
                            <span className="text-[10px] font-black text-emerald-700 shrink-0">
                              {ev.currency_symbol || '$'}{Number(ev.amount).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {[ev.subtitle, ev.country].filter(Boolean).join(' · ') || c.label}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-300 shrink-0 tabular-nums">{timeAgo(ev.ts)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3">
            {[
              { label: 'Avg Rating', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', ring: 'ring-amber-100', value: feedbackData ? `${feedbackData.averageRating}/5` : '—', sub: `${feedbackData?.total ?? 0} reviews`, modal: 'reviews' as const },
              { label: 'Subscribers', icon: Mail, color: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-100', value: String(subCount), sub: 'email subscribers', modal: 'subscribers' as const },
              { label: 'Broadcasts', icon: Megaphone, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100', value: String(broadcasts.length), sub: 'sent to subscribers', modal: 'broadcasts' as const },
            ].map(c => (
              <button key={c.label} onClick={() => setActiveModal(c.modal)}
                className={cn('bg-white rounded-2xl ring-1 shadow-sm p-4 text-left hover:shadow-md transition-all flex items-center gap-4 group', c.ring)}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', c.bg)}>
                  <c.icon className={cn('w-4.5 h-4.5', c.color)} style={{ width: 18, height: 18 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-2xl font-black text-slate-900 leading-none">{c.value}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{c.label} · {c.sub}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        </>);
        })()}

        {/* ══ USERS TAB ════════════════════════════════════════ */}
        {activeTab === 'users' && (<>

        {/* ── Live Users ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', presence && presence.online_count > 0 ? 'bg-emerald-400' : 'bg-slate-300')} />
                <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', presence && presence.online_count > 0 ? 'bg-emerald-500' : 'bg-slate-300')} />
              </span>
              <h2 className="text-sm font-black text-slate-700">Live Users</h2>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', presence && presence.online_count > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
                {presence ? `${presence.online_count} online now` : 'Loading…'}
              </span>
            </div>
            <span className="text-[10px] text-slate-300">Updates every 30s</span>
          </div>

          {(!presence || presence.online.length === 0) ? (
            <div className="py-10 text-center">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-xs text-slate-300">No users online right now</p>
              {presence && presence.recently.length > 0 && (
                <p className="text-[10px] text-slate-300 mt-1">{presence.recently.length} active in last 30 min</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-5 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Business</th>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Currently On</th>
                    <th className="px-3 py-2.5 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">Last Seen</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Today</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Sessions</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {presence.online.map((u: any) => (
                    <tr key={u.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          <div>
                            <div className="font-bold text-slate-800">{u.name || '—'}</div>
                            <div className="text-[10px] text-slate-400">{u.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                          {pageName(u.current_page)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-[10px] font-bold text-emerald-600">{secsAgo(u.seconds_ago)}</span>
                      </td>
                      <td className="px-3 py-3 text-right hidden sm:table-cell">
                        <span className="font-bold text-slate-700">{fmtDuration(u.today_seconds || 0)}</span>
                        <div className="text-[10px] text-slate-300">online</div>
                      </td>
                      <td className="px-3 py-3 text-right hidden sm:table-cell">
                        <span className="font-bold text-slate-700">{u.total_sessions || u.total_logins || 1}</span>
                        <div className="text-[10px] text-slate-300">sessions</div>
                      </td>
                      <td className="px-3 py-3 text-right hidden sm:table-cell">
                        <span className="font-bold text-slate-700">{u.total_docs}</span>
                        <div className="text-[10px] text-slate-300">docs</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Recently active (3–30 min ago) */}
              {presence.recently.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                  <p className="text-[10px] font-bold text-slate-400 mb-2">RECENTLY ACTIVE (last 30 min)</p>
                  <div className="flex flex-wrap gap-2">
                    {presence.recently.map((u: any) => (
                      <div key={u.id} className="flex items-center gap-1.5 text-[10px] bg-white ring-1 ring-slate-100 rounded-lg px-2.5 py-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                        <span className="font-bold text-slate-600">{u.name}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">{pageName(u.current_page)}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">{secsAgo(u.seconds_ago)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Platform Usage ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-black text-slate-700">Organisations</h2>
              {usersData && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {usersData.summary.active_orgs} active (30d)
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-300 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={orgSearch}
                onChange={e => setOrgSearch(e.target.value)}
                placeholder="Search by name, email…"
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 w-48"
              />
            </div>
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
          {!usersData || (usersData.orgs.filter((o: any) => !orgSearch || o.name?.toLowerCase().includes(orgSearch.toLowerCase()) || o.email?.toLowerCase().includes(orgSearch.toLowerCase())).length === 0) ? (
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
                    <th className="px-3 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Status</th>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden md:table-cell">Type</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Docs</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Team</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden lg:table-cell">Collected</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden lg:table-cell">Outstanding</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Overdue</th>
                    <th className="px-3 py-2.5 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden md:table-cell">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(() => {
                    const filtered = usersData.orgs.filter((o: any) => !orgSearch || o.name?.toLowerCase().includes(orgSearch.toLowerCase()) || o.email?.toLowerCase().includes(orgSearch.toLowerCase()));
                    return (showAllOrgs ? filtered : filtered.slice(0, 15)).map((org: any) => {
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                    const isActive = org.last_active_at && org.last_active_at >= thirtyDaysAgo;
                    const totalDocs = (org.invoice_count || 0) + (org.receipt_count || 0) + (org.quote_count || 0);
                    const lastSeen = org.last_active_at ? new Date(org.last_active_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
                    const fmt = (n: number) => n > 0 ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—';
                    return (
                      <tr key={org.id} onClick={() => openOrgDetail(org.id)} className="hover:bg-indigo-50/40 transition-colors cursor-pointer group">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="font-bold text-slate-800 truncate max-w-[170px]">{org.name || '—'}</div>
                            <ChevronRight className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                          {org.email && <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{org.email}</div>}
                          <div className="text-[10px] text-slate-300 mt-0.5">
                            {org.country || ''} · Joined {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          {(() => { const s = getOrgStatus(org); return <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', s.cls)}>{s.label}</span>; })()}
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', org.account_type === 'team' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500')}>
                            {org.account_type === 'team' ? '👥 Team' : '👤 Solo'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="font-bold text-slate-700">{totalDocs}</div>
                          <div className="text-[10px] text-slate-400">
                            {org.invoice_count}i · {org.receipt_count}r · {org.quote_count}q
                            {org.trash_count > 0 && <span className="text-slate-300"> · {org.trash_count} trashed</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right hidden sm:table-cell">
                          {org.account_type === 'team'
                            ? <span className="font-bold text-indigo-600">{org.team_member_count || 0}</span>
                            : <span className="text-slate-300">—</span>}
                          {org.pending_invites > 0 && <div className="text-[10px] text-amber-500">{org.pending_invites} pending</div>}
                        </td>
                        <td className="px-3 py-3 text-right hidden lg:table-cell">
                          <span className="font-bold text-emerald-700">{fmt(org.total_collected)}</span>
                        </td>
                        <td className="px-3 py-3 text-right hidden lg:table-cell">
                          <span className={cn('font-bold', org.outstanding > 0 ? 'text-amber-600' : 'text-slate-300')}>{fmt(org.outstanding)}</span>
                        </td>
                        <td className="px-3 py-3 text-right hidden sm:table-cell">
                          {org.overdue_count > 0
                            ? <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{org.overdue_count}</span>
                            : <span className="text-slate-200">—</span>}
                        </td>
                        <td className="px-3 py-3 text-center hidden md:table-cell">
                          <div className={cn('text-[10px] font-bold', isActive ? 'text-emerald-600' : 'text-slate-400')}>{isActive ? '● ' : '○ '}{lastSeen}</div>
                        </td>
                      </tr>
                    );
                  });
                  })()}
                </tbody>
              </table>

              {usersData.orgs.filter((o: any) => !orgSearch || o.name?.toLowerCase().includes(orgSearch.toLowerCase()) || o.email?.toLowerCase().includes(orgSearch.toLowerCase())).length > 15 && (
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

        </>)}

        {/* ══ FINANCIALS TAB ═══════════════════════════════════ */}
        {activeTab === 'financials' && (<>

        {/* ── Platform financials + activity ───────────────────── */}
        {usersData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Collected', value: usersData.summary.total_collected, sub: `of ${Number(usersData.summary.total_invoiced || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} invoiced`, color: 'from-emerald-500 to-emerald-600', icon: TrendingUp, raw: false },
              { label: 'Outstanding', value: usersData.summary.total_outstanding, sub: `${usersData.summary.total_overdue || 0} overdue`, color: 'from-amber-500 to-amber-600', icon: Activity, raw: false },
              { label: 'Active Accounts', value: usersData.summary.active_orgs, sub: `${usersData.summary.new_this_week || 0} new this week`, color: 'from-indigo-500 to-indigo-600', icon: Users, raw: true },
              { label: 'Account Mix', value: `${usersData.summary.team_accounts || 0}T / ${usersData.summary.solo_accounts || 0}S`, sub: `${usersData.summary.total_team_members || 0} team members`, color: 'from-violet-500 to-violet-600', icon: Building2, raw: true },
            ].map(card => (
              <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl px-4 py-4 text-white`}>
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <card.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{card.label}</span>
                </div>
                <div className="text-xl font-black">
                  {card.raw ? card.value : Number(card.value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] mt-0.5 opacity-70">{card.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Platform revenue chart ───────────────────────────── */}
        {(usersData?.platformRevenue?.length ?? 0) > 0 && (() => {
          const revData: any[] = adminRevenueGranularity === 'yearly'
            ? (usersData?.platformRevenueYearly ?? [])
            : (usersData?.platformRevenue ?? []);
          const maxRev = Math.max(...revData.map((m: any) => m.revenue || 0), 1);
          const fmtLabel = (p: string) => {
            if (adminRevenueGranularity === 'yearly') return p;
            const [y, mo] = p.split('-');
            const d = new Date(Number(y), Number(mo) - 1, 1);
            return d.toLocaleDateString('en-US', { month: 'short' }) + " '" + y.slice(2);
          };
          return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-sm font-black text-slate-700">Platform Revenue · All Time</h2>
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
                  {(['monthly', 'yearly'] as const).map(g => (
                    <button key={g} onClick={() => setAdminRevenueGranularity(g)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all capitalize ${adminRevenueGranularity === g ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="flex items-end gap-1 sm:gap-2 h-40" style={{ minWidth: revData.length > 18 ? `${revData.length * 30}px` : undefined }}>
                  {revData.map((m: any) => {
                    const h = Math.max(6, (m.revenue / maxRev) * 100);
                    return (
                      <div key={m.period} className="flex-1 flex flex-col items-center gap-1 min-w-[28px] group relative">
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-10">
                          {Number(m.revenue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} · {m.count} paid
                        </div>
                        <div className="w-full rounded-t-lg transition-all bg-indigo-500" style={{ height: `${h}%`, opacity: 0.8 }} />
                        <div className="text-[9px] text-slate-400 truncate w-full text-center">{fmtLabel(m.period)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Recent payments across all orgs ──────────────────── */}
        {(usersData?.recentPayments ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-black text-slate-700">Recent Payments (Platform-wide)</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {(usersData?.recentPayments ?? []).slice(0, 10).map((p: any) => (
                <div key={p.id} className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{p.number} · {p.client_name || '—'}</div>
                    <div className="text-[10px] text-slate-400">{p.org_name} · Paid {p.paid_date || '—'}</div>
                  </div>
                  <div className="text-xs font-black text-emerald-700 shrink-0 ml-4">
                    {p.currency_symbol || '$'}{Number(p.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        </>)}

        {/* ══ COMMS TAB ════════════════════════════════════════ */}
        {activeTab === 'comms' && (<>

        {/* Feedback + Broadcast */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Feedback list */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-black text-slate-700">User Feedback</h2>
              </div>
              <div className="flex items-center gap-3">
                {feedbackData && feedbackData.total > 0 && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={cn('w-3.5 h-3.5', n <= Math.round(feedbackData.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowAddReview(v => !v)}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>

            {showAddReview && (
              <div className="px-5 py-4 border-b border-slate-50 bg-amber-50/40 space-y-2.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Add a review manually</p>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onMouseEnter={() => setAddReviewHover(n)}
                      onMouseLeave={() => setAddReviewHover(0)}
                      onClick={() => setAddReviewForm(f => ({ ...f, rating: n }))}
                    >
                      <Star className={cn('w-5 h-5 transition-colors', n <= (addReviewHover || addReviewForm.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={addReviewForm.name}
                    onChange={e => setAddReviewForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Reviewer name*"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <input
                    value={addReviewForm.email}
                    onChange={e => setAddReviewForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Email (optional)"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <textarea
                  value={addReviewForm.message}
                  onChange={e => setAddReviewForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Review message (optional - needed to show on the landing page)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddReview}
                    disabled={addingReview || !addReviewForm.name.trim()}
                    className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {addingReview ? 'Adding…' : 'Add Review'}
                  </button>
                  <button
                    onClick={() => setShowAddReview(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!feedbackData || feedbackData.total === 0 ? (
              <div className="py-14 text-center">
                <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-300">No feedback submitted yet</p>
                <p className="text-xs text-slate-200 mt-1">The rating widget is live on your landing page</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {(showAllFeedback ? feedbackData.feedback : feedbackData.feedback.slice(0, 5)).map((f: any) => (
                  <div key={f.id} className={cn('px-5 py-3.5 group transition-colors', f.approved ? 'bg-emerald-50/40' : '')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">{f.name}</span>
                          {f.email && <span className="text-[10px] text-slate-400 truncate hidden sm:block">{f.email}</span>}
                          {f.approved ? (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">On homepage</span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Hidden</span>
                          )}
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
                          onClick={() => handleApproveFeedback(f.id, Boolean(f.approved))}
                          className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all', f.approved ? 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-red-50 hover:text-red-500 hover:border-red-200' : 'border-slate-200 text-slate-400 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200')}
                          title={f.approved ? 'Remove from homepage' : 'Show on homepage'}
                        >
                          {f.approved ? '✓ Approved' : 'Approve'}
                        </button>
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
                placeholder={"Write your update here…\n\nSupports multiple paragraphs - just press Enter twice."}
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
              {subCount === 0 && (
                <p className="text-xs text-slate-300 text-center">No subscribers yet - signup form is live on the landing page</p>
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
          </div>

          {/* Existing entries */}
          {changelogEntries.length === 0 ? (
            <div className="py-10 text-center">
              <Zap className="w-7 h-7 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-300">No entries yet - post your first update above</p>
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

        </>)}

        {/* ══ SECURITY TAB ═════════════════════════════════════ */}
        {activeTab === 'security' && (<>

        {/* ── Maintenance mode ─────────────────────────────────── */}
        <div className={cn('rounded-2xl ring-1 shadow-sm overflow-hidden', maintenance?.effectiveEnabled ? 'bg-red-50 ring-red-100' : 'bg-white ring-slate-100')}>
          <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className={cn('w-4 h-4', maintenance?.effectiveEnabled ? 'text-red-500' : 'text-slate-300')} />
              <div>
                <h2 className="text-sm font-black text-slate-700">Maintenance Mode</h2>
                <p className="text-[10px] text-slate-400">
                  {maintenance?.forcedByEnv
                    ? 'LIVE - forced on by the MAINTENANCE_MODE env var on the host (survives deploys). Remove it there to turn off.'
                    : maintenance?.enabled
                    ? 'LIVE - visitors are seeing the maintenance page right now'
                    : 'Off - the live site is running normally'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggleMaintenance(!maintenance?.enabled)}
              disabled={savingMaintenance || !maintenance || maintenance?.forcedByEnv}
              title={maintenance?.forcedByEnv ? 'Forced on by the MAINTENANCE_MODE env var - remove it on the host to regain control here' : undefined}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40',
                maintenance?.enabled ? 'bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50' : 'bg-slate-800 text-white hover:bg-slate-900'
              )}
            >
              {maintenance?.enabled ? 'Turn off' : 'Turn on'}
            </button>
          </div>
          {maintenance && (
            <div className="px-5 pb-5">
              <label className="block">
                <span className="text-[10px] text-slate-500 font-medium">Message shown to visitors</span>
                <textarea
                  value={maintenanceMessageDraft}
                  onChange={e => setMaintenanceMessageDraft(e.target.value)}
                  rows={2}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </label>
              {maintenanceMessageDraft !== maintenance.message && (
                <button
                  onClick={handleSaveMaintenanceMessage}
                  disabled={savingMaintenance}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition-all disabled:opacity-40"
                >
                  Save message
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Risk scoring config ─────────────────────────────── */}
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-black text-slate-700">Signup Risk Scoring</h2>
            </div>
            <p className="text-[10px] text-slate-300">Takes effect immediately - no restart needed</p>
          </div>
          {!riskConfigDraft ? (
            <div className="py-10 text-center text-xs text-slate-300">Loading…</div>
          ) : (
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Signal weights</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(riskConfigDraft.weights).map(([key, val]) => (
                    <label key={key} className="block">
                      <span className="text-[10px] text-slate-500 font-medium">{key}</span>
                      <input
                        type="number"
                        value={val}
                        onChange={e => setRiskConfigDraft(d => d && ({ ...d, weights: { ...d.weights, [key]: Number(e.target.value) } }))}
                        className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Thresholds</p>
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  {Object.entries(riskConfigDraft.thresholds).map(([key, val]) => (
                    <label key={key} className="block">
                      <span className="text-[10px] text-slate-500 font-medium capitalize">{key}</span>
                      <input
                        type="number"
                        value={val}
                        onChange={e => setRiskConfigDraft(d => d && ({ ...d, thresholds: { ...d.thresholds, [key]: Number(e.target.value) } }))}
                        className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSaveRiskConfig}
                  disabled={savingRiskConfig || JSON.stringify(riskConfigDraft) === JSON.stringify(riskConfig)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {savingRiskConfig ? 'Saving…' : 'Save changes'}
                </button>
                {JSON.stringify(riskConfigDraft) !== JSON.stringify(riskConfig) && (
                  <button onClick={() => setRiskConfigDraft(riskConfig)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                    Discard
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Flagged signups ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-black text-slate-700">Flagged Signups</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{flaggedSignups.length}</span>
            </div>
            <select
              value={signupStatusFilter}
              onChange={e => { setSignupStatusFilter(e.target.value); loadFlaggedSignups(e.target.value); }}
              className="text-[10px] font-bold border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="">All flagged (default view)</option>
              <option value="pending_verification">Pending verification</option>
              <option value="held_for_review">Held for review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {flaggedSignups.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
              <p className="text-xs text-slate-300">Nothing flagged right now</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-5 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Account</th>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-3 py-2.5 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">Risk</th>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Signals</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Signed up</th>
                    <th className="px-5 py-2.5 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {flaggedSignups.map((s: any) => {
                    const statusCls: Record<string, string> = {
                      held_for_review: 'bg-red-50 text-red-600',
                      pending_verification: 'bg-amber-50 text-amber-700',
                      verified: 'bg-emerald-50 text-emerald-700',
                      rejected: 'bg-slate-100 text-slate-400',
                    };
                    const actionCls: Record<string, string> = {
                      hold: 'text-red-600',
                      friction: 'text-amber-600',
                      allow: 'text-slate-400',
                    };
                    const signals: string[] = [];
                    if (s.signup_is_proxy) signals.push('Proxy');
                    if (s.signup_is_hosting) signals.push('Hosting');
                    if (s.fingerprint_hash) signals.push('FP seen');
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-bold text-slate-800">{s.name || '—'}</div>
                          <div className="text-[10px] text-slate-400">{s.email}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', statusCls[s.verification_status] || 'bg-slate-100 text-slate-400')}>
                            {(s.verification_status || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={cn('font-black', actionCls[s.risk_action] || 'text-slate-400')}>{s.risk_score}</span>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-[10px] text-slate-400">{signals.join(' · ') || '—'}</span>
                          {s.signup_country && <span className="text-[10px] text-slate-300 ml-1">({s.signup_country})</span>}
                        </td>
                        <td className="px-3 py-3 text-right hidden sm:table-cell text-[10px] text-slate-400">
                          {timeAgo(s.created_at)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReviewSignup(s.id, 'verify')}
                              disabled={reviewingSignupId === s.id}
                              title="Mark verified - skips email verification"
                              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-all disabled:opacity-40"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleReviewSignup(s.id, 'clear')}
                              disabled={reviewingSignupId === s.id}
                              title="Clear the hold - still requires email verification"
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-all disabled:opacity-40"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => handleReviewSignup(s.id, 'reject')}
                              disabled={reviewingSignupId === s.id}
                              title="Reject - blocks the account"
                              className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-all disabled:opacity-40"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        </>)}

        {/* ══ TRAFFIC TAB ══════════════════════════════════════ */}
        {activeTab === 'traffic' && (<>

        {/* ── Analytics Dashboard ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Header + date range */}
          <div className="px-5 py-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-black text-slate-700">Website Analytics</h2>
              {analyticsData?.realtime?.active > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                  {analyticsData.realtime.active} visitors on site
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {([{ label: '7d', value: 7 }, { label: '30d', value: 30 }, { label: '90d', value: 90 }, { label: 'All', value: 0 }] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setDays(opt.value); refreshAnalytics(opt.value); }}
                  className={cn('px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all', days === opt.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {!analyticsData || analyticsLoading ? (
            <div className="py-14 text-center">
              <Globe className="w-8 h-8 text-slate-200 mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-slate-300">{analyticsLoading ? 'Refreshing…' : 'Loading analytics…'}</p>
            </div>
          ) : (
            <div className="p-5 space-y-6">

              {/* Overview + session metrics */}
              {(() => {
                const ov = analyticsData.overview;
                const pv = analyticsData.prev;
                const calcTrend = (current: number, previous: number) => {
                  if (!previous) return null;
                  const pct = Math.round(((current - previous) / previous) * 100);
                  return { pct, up: pct >= 0 };
                };
                const periodTrend = calcTrend(ov.period, pv.total);
                const sessionTrend = calcTrend(ov.week_sessions, pv.unique_sessions);
                const sm = analyticsData.sessionMetrics;
                const bd = analyticsData.bounceData;
                const bounceRate = bd?.total_sessions ? Math.round((bd.bounced / bd.total_sessions) * 100) : 0;
                const avgDuration = Math.round(sm?.avg_session_duration || 0);
                const avgPages = Number((sm?.avg_pages_per_session || 0).toFixed(1));

                const cards = [
                  { label: `Views (${days > 0 ? `${days}d` : 'all'})`, value: (ov.period ?? 0).toLocaleString(), trend: periodTrend, color: 'text-indigo-600', bg: 'bg-indigo-50', clickable: false },
                  { label: 'Today', value: (ov.today ?? 0).toLocaleString(), trend: null, color: 'text-emerald-600', bg: 'bg-emerald-50', clickable: false },
                  { label: 'This Week', value: (ov.week ?? 0).toLocaleString(), trend: null, color: 'text-blue-600', bg: 'bg-blue-50', clickable: false },
                  { label: 'All-time Views', value: (ov.total ?? 0).toLocaleString(), trend: null, color: 'text-slate-600', bg: 'bg-slate-50', clickable: true },
                  { label: 'Sessions', value: (ov.unique_sessions ?? 0).toLocaleString(), trend: sessionTrend, color: 'text-amber-600', bg: 'bg-amber-50', clickable: false },
                  { label: 'Today Sessions', value: (ov.today_sessions ?? 0).toLocaleString(), trend: null, color: 'text-rose-600', bg: 'bg-rose-50', clickable: false },
                ];

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {cards.map(s => {
                        const inner = (
                          <>
                            <div className={`text-xl font-black ${s.color} leading-none`}>{s.value}</div>
                            <div className="text-[10px] font-medium text-slate-500 mt-1">{s.label}</div>
                            {s.trend && (
                              <div className={cn('flex items-center gap-0.5 mt-1 text-[10px] font-bold', s.trend.up ? 'text-emerald-600' : 'text-red-500')}>
                                {s.trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {s.trend.up ? '+' : ''}{s.trend.pct}% vs prev
                              </div>
                            )}
                            {s.clickable && <div className="text-[9px] text-indigo-400 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View all →</div>}
                          </>
                        );
                        return s.clickable
                          ? <button key={s.label} onClick={() => openViewsModal()} className={`${s.bg} rounded-xl p-3 text-left hover:ring-2 hover:ring-indigo-300 transition-all group`}>{inner}</button>
                          : <div key={s.label} className={`${s.bg} rounded-xl p-3`}>{inner}</div>;
                      })}
                    </div>

                    {/* Session quality metrics */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { short: 'Pages/Session', long: 'Avg Pages / Session', value: String(avgPages), color: 'text-indigo-600' },
                        { short: 'Avg Duration', long: 'Avg Session Duration', value: avgDuration >= 60 ? `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s` : `${avgDuration}s`, color: 'text-emerald-600' },
                        { short: 'Bounce Rate', long: 'Bounce Rate', value: `${bounceRate}%`, color: bounceRate > 70 ? 'text-red-500' : bounceRate > 50 ? 'text-amber-600' : 'text-emerald-600' },
                      ].map(m => (
                        <div key={m.long} className="bg-slate-50 rounded-xl p-2 sm:p-3 text-center">
                          <div className={`text-lg sm:text-xl font-black ${m.color} leading-none`}>{m.value}</div>
                          <div className="text-[9px] sm:text-[10px] font-medium text-slate-500 mt-1 leading-tight">
                            <span className="sm:hidden">{m.short}</span>
                            <span className="hidden sm:inline">{m.long}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}

              {/* Daily area chart */}
              {analyticsData.daily && analyticsData.daily.length > 0 && (() => {
                const vals = analyticsData.daily.map((d: any) => d.count);
                const sessVals = analyticsData.daily.map((d: any) => d.sessions);
                const CW = 600, CH = 100;
                const va = makeArea(vals, CW, CH);
                const sa = makeArea(sessVals.map((v: number) => (v / Math.max(...sessVals, 1)) * Math.max(...vals, 1)), CW, CH);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Page views - {days > 0 ? `last ${days} days` : 'all time'}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-500 inline-block rounded" />Views</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" />Sessions</span>
                      </div>
                    </div>
                    {va ? (
                      <>
                        <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full h-24" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="trGradV" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="trGradS" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
                              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {[0.25, 0.5, 0.75].map(y => <line key={y} x1="0" y1={y * CH} x2={CW} y2={y * CH} stroke="#f1f5f9" strokeWidth="1" />)}
                          <polygon points={va.fill} fill="url(#trGradV)" />
                          <polyline points={va.line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {sa && <>
                            <polygon points={sa.fill} fill="url(#trGradS)" />
                            <polyline points={sa.line} fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </>}
                        </svg>
                        <div className="flex justify-between text-[9px] text-slate-300 mt-1">
                          <span>{analyticsData.daily[0]?.date?.slice(5)}</span>
                          <span>{analyticsData.daily[analyticsData.daily.length - 1]?.date?.slice(5)}</span>
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })()}

              {/* Hourly heatmap */}
              {analyticsData.hourly && analyticsData.hourly.length > 0 && (() => {
                const hourMap: Record<number, number> = {};
                analyticsData.hourly.forEach((h: any) => { hourMap[h.hour] = h.count; });
                const maxH = Math.max(...Object.values(hourMap), 1);
                return (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Traffic by hour of day</p>
                    <div className="flex items-end gap-[2px] h-14">
                      {Array.from({ length: 24 }, (_, h) => h).map(h => {
                        const count = hourMap[h] || 0;
                        return (
                          <div key={h} className="flex-1 flex flex-col items-center justify-end group relative">
                            <div
                              className="w-full rounded-t-[2px] bg-indigo-400 hover:bg-indigo-600 transition-colors cursor-default"
                              style={{ height: `${Math.max((count / maxH) * 52, count > 0 ? 3 : 1)}px` }}
                            />
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              {h}:00 · {count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-300 mt-1 px-0.5">
                      <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
                    </div>
                  </div>
                );
              })()}

              {/* Countries + Cities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {analyticsData.countries && analyticsData.countries.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Top countries</p>
                    <div className="space-y-2">
                      {(() => {
                        const maxC = Math.max(...analyticsData.countries.map((c: any) => c.count), 1);
                        return analyticsData.countries.map((c: any) => {
                          const flag = c.country_code && c.country_code !== 'XX'
                            ? String.fromCodePoint(...[...c.country_code.toUpperCase()].map((ch: string) => 0x1F1E6 + ch.charCodeAt(0) - 65))
                            : '🌐';
                          return (
                            <div key={c.country} className="flex items-center gap-2">
                              <span className="text-base leading-none w-6 shrink-0">{flag}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs font-medium text-slate-700 truncate">{c.country}</span>
                                  <span className="text-xs font-bold text-slate-500 ml-2 shrink-0">{c.count}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(c.count / maxC) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
                {analyticsData.cities && analyticsData.cities.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Top cities</p>
                    <div className="space-y-2">
                      {(() => {
                        const maxCt = Math.max(...analyticsData.cities.map((c: any) => c.count), 1);
                        return analyticsData.cities.map((c: any) => {
                          const flag = c.country_code && c.country_code !== 'XX'
                            ? String.fromCodePoint(...[...c.country_code.toUpperCase()].map((ch: string) => 0x1F1E6 + ch.charCodeAt(0) - 65))
                            : '🌐';
                          return (
                            <div key={`${c.city}-${c.region}`} className="flex items-center gap-2">
                              <span className="text-base leading-none w-6 shrink-0">{flag}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <div className="min-w-0">
                                    <span className="text-xs font-medium text-slate-700 truncate">{c.city}</span>
                                    {c.region && <span className="text-[10px] text-slate-400 ml-1">{c.region}</span>}
                                  </div>
                                  <span className="text-xs font-bold text-slate-500 ml-2 shrink-0">{c.count}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(c.count / maxCt) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Devices + Browsers + Top pages */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {analyticsData.devices && analyticsData.devices.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Devices</p>
                    {(() => {
                      const total = analyticsData.devices.reduce((s: number, d: any) => s + d.count, 0) || 1;
                      const hexColors: Record<string, string> = { Desktop: '#6366f1', Mobile: '#10b981', Tablet: '#f59e0b' };
                      const icons: Record<string, any> = { Desktop: Monitor, Mobile: Smartphone, Tablet };
                      const segments = analyticsData.devices.map((d: any) => ({ value: d.count, color: hexColors[d.device] || '#94a3b8', label: d.device }));
                      return (
                        <div className="flex items-center gap-4">
                          <DonutChart segments={segments} />
                          <div className="flex-1 space-y-2">
                            {analyticsData.devices.map((d: any) => {
                              const Icon = icons[d.device] || Monitor;
                              const pct = Math.round((d.count / total) * 100);
                              return (
                                <div key={d.device} className="flex items-center gap-2">
                                  <Icon className="w-3 h-3 shrink-0" style={{ color: hexColors[d.device] || '#94a3b8' }} />
                                  <span className="text-xs text-slate-600 flex-1">{d.device}</span>
                                  <span className="text-xs font-black text-slate-700">{pct}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {analyticsData.browsers && analyticsData.browsers.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Browsers</p>
                    <div className="space-y-2">
                      {(() => {
                        const total = analyticsData.browsers.reduce((s: number, b: any) => s + b.count, 0) || 1;
                        return analyticsData.browsers.map((b: any) => {
                          const pct = Math.round((b.count / total) * 100);
                          return (
                            <div key={b.browser}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium text-slate-700">{b.browser}</span>
                                <span className="text-xs font-bold text-slate-500">{pct}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
                {analyticsData.pages && analyticsData.pages.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Top pages</p>
                    <div className="space-y-2">
                      {(() => {
                        const maxP = Math.max(...analyticsData.pages.map((p: any) => p.count), 1);
                        return analyticsData.pages.map((p: any) => (
                          <button key={p.page} onClick={() => openViewsModal(p.page)} className="w-full text-left group">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium text-slate-700 truncate max-w-[120px] group-hover:text-indigo-600 transition-colors" title={p.page}>{p.page || '/'}</span>
                              <div className="flex items-center gap-1.5 ml-1 shrink-0">
                                <span className="text-xs font-bold text-slate-500">{p.count}</span>
                                <ArrowRight className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-400 group-hover:bg-indigo-400 rounded-full transition-colors" style={{ width: `${(p.count / maxP) * 100}%` }} />
                            </div>
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Entry + Exit pages */}
              {((analyticsData.entryPages?.length > 0) || (analyticsData.exitPages?.length > 0)) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {analyticsData.entryPages?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Entry pages <span className="normal-case font-normal">(where sessions start)</span>
                      </p>
                      <div className="space-y-1.5">
                        {(() => {
                          const maxE = Math.max(...analyticsData.entryPages.map((p: any) => p.count), 1);
                          return analyticsData.entryPages.map((p: any) => (
                            <div key={p.page} className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs text-slate-700 truncate max-w-[180px]" title={p.page}>{p.page || '/'}</span>
                                  <span className="text-xs font-bold text-slate-400 ml-2 shrink-0">{p.count}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(p.count / maxE) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                  {analyticsData.exitPages?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Exit pages <span className="normal-case font-normal">(where sessions end)</span>
                      </p>
                      <div className="space-y-1.5">
                        {(() => {
                          const maxX = Math.max(...analyticsData.exitPages.map((p: any) => p.count), 1);
                          return analyticsData.exitPages.map((p: any) => (
                            <div key={p.page} className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs text-slate-700 truncate max-w-[180px]" title={p.page}>{p.page || '/'}</span>
                                  <span className="text-xs font-bold text-slate-400 ml-2 shrink-0">{p.count}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(p.count / maxX) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Referrers */}
              {analyticsData.referrers && analyticsData.referrers.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Traffic sources</p>
                  <div className="space-y-1.5">
                    {(() => {
                      const maxR = Math.max(...analyticsData.referrers.map((r: any) => r.count), 1);
                      return analyticsData.referrers.map((r: any) => (
                        <div key={r.referrer} className="flex items-center gap-2">
                          <Eye className="w-3 h-3 text-slate-300 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs text-slate-600 truncate max-w-[260px]" title={r.referrer}>{r.referrer}</span>
                              <span className="text-xs font-bold text-slate-400 ml-2 shrink-0">{r.count}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(r.count / maxR) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {analyticsData.overview?.total === 0 && (
                <div className="py-8 text-center">
                  <Globe className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No page views recorded yet</p>
                  <p className="text-xs text-slate-300 mt-1">Tracking starts automatically as visitors arrive</p>
                </div>
              )}

            </div>
          )}
        </div>

        </>)}

      </main>

      {/* ── Page Views Detail Modal ───────────────────────────── */}
      {viewsModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setViewsModal({ open: false })} />
          <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-8">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden my-8">

              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-black text-slate-900 text-sm">
                    {viewsModal.page ? `Visits - ${viewsModal.page}` : 'All Page Views'}
                  </h2>
                  {viewsData && (
                    <span className="text-xs text-slate-400">{viewsData.total.toLocaleString()} total</span>
                  )}
                </div>
                <button onClick={() => setViewsModal({ open: false })} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                {viewsLoading ? (
                  <div className="py-16 text-center">
                    <Globe className="w-8 h-8 text-slate-200 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm text-slate-300">Loading visits…</p>
                  </div>
                ) : !viewsData || viewsData.views.length === 0 ? (
                  <div className="py-16 text-center">
                    <Eye className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">No page views recorded yet</p>
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-50 z-10">
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Page</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date & Time</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Location</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Device</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px] hidden md:table-cell">Browser</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {viewsData.views.map((v: any) => {
                        const flag = v.country_code && v.country_code !== 'XX'
                          ? String.fromCodePoint(...[...v.country_code.toUpperCase()].map((ch: string) => 0x1F1E6 + ch.charCodeAt(0) - 65))
                          : '🌐';
                        const dt = new Date(v.created_at);
                        return (
                          <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2.5">
                              <span className="font-medium text-slate-800 truncate max-w-[140px] block" title={v.page}>{v.page || '/'}</span>
                              {v.referrer && (
                                <span className="text-[10px] text-slate-300 truncate max-w-[140px] block" title={v.referrer}>↩ {v.referrer}</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="text-slate-700">{dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              <div className="text-[10px] text-slate-400">{dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm leading-none">{flag}</span>
                                <div>
                                  <div className="text-slate-700">{v.country || 'Unknown'}</div>
                                  {v.city && <div className="text-[10px] text-slate-400">{v.city}{v.region ? `, ${v.region}` : ''}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 hidden sm:table-cell">
                              <span className={cn(
                                'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full',
                                v.device === 'Mobile' ? 'bg-emerald-50 text-emerald-700' :
                                v.device === 'Tablet' ? 'bg-amber-50 text-amber-700' :
                                'bg-indigo-50 text-indigo-700'
                              )}>{v.device || 'Desktop'}</span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 hidden md:table-cell">{v.browser || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {viewsData && viewsData.total > 200 && (
                <div className="px-6 py-3 border-t border-slate-50 text-xs text-slate-400 text-center">
                  Showing most recent 200 of {viewsData.total.toLocaleString()} visits
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ────────────────────────────────── */}
      {toast && (
        <div className={cn(
          'fixed top-5 right-5 z-[80] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold max-w-xs',
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
        )}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 transition-opacity shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Confirm modal ─────────────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4.5 h-4.5 text-red-600" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm leading-tight">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modals ──────────────────────────────────────── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-8">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden my-8">

              {/* ── Reviews modal ── */}
              {activeModal === 'reviews' && (
                <>
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <h2 className="font-black text-slate-900 text-sm">All Reviews</h2>
                      <span className="text-xs text-slate-400">{feedbackData?.total ?? 0} total</span>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {feedbackData && feedbackData.total > 0 && (
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-6 bg-amber-50/40">
                      <div className="text-center shrink-0">
                        <div className="text-4xl font-black text-slate-900 leading-none">{feedbackData.averageRating}</div>
                        <div className="flex justify-center gap-0.5 mt-1.5">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} className={cn('w-3.5 h-3.5', n <= Math.round(feedbackData.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">out of 5</p>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[5,4,3,2,1].map(star => {
                          const count = feedbackData.feedback.filter((f: any) => f.rating === star).length;
                          const pct = feedbackData.total ? (count / feedbackData.total) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-5 shrink-0">{star}★</span>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-slate-400 w-5 text-right shrink-0">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
                    {!feedbackData || feedbackData.total === 0 ? (
                      <div className="py-14 text-center text-sm text-slate-300">No reviews yet</div>
                    ) : feedbackData.feedback.map((f: any) => (
                      <div key={f.id} className="px-6 py-4 group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-800">{f.name}</span>
                              {f.email && <span className="text-xs text-slate-400">{f.email}</span>}
                            </div>
                            {f.message && <p className="text-sm text-slate-500 mt-1 leading-relaxed">"{f.message}"</p>}
                            <p className="text-[10px] text-slate-300 mt-1.5">
                              {new Date(f.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(n => <Star key={n} className={cn('w-3 h-3', n <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100')} />)}
                            </div>
                            <button
                              onClick={() => { handleDeleteFeedback(f.id); }}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Subscribers modal ── */}
              {activeModal === 'subscribers' && (
                <>
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-600" />
                      <h2 className="font-black text-slate-900 text-sm">Subscribers</h2>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-700">{subCount} active subscriber{subCount !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-indigo-400">Newest first</span>
                  </div>

                  <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
                    {subscribers.length === 0 ? (
                      <div className="py-14 text-center text-sm text-slate-300">No subscribers yet</div>
                    ) : subscribers.map((s: any, i: number) => (
                      <div key={s.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-600">
                            {(s.name || s.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">{s.email}</div>
                            {s.name && <div className="text-xs text-slate-400 truncate">{s.name}</div>}
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 shrink-0">
                          {new Date(s.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Broadcasts modal ── */}
              {activeModal === 'broadcasts' && (
                <>
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-emerald-600" />
                      <h2 className="font-black text-slate-900 text-sm">Broadcast History</h2>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
                    {broadcasts.length === 0 ? (
                      <div className="py-14 text-center text-sm text-slate-300">No broadcasts sent yet</div>
                    ) : broadcasts.map((b: any) => (
                      <details key={b.id} className="group px-6 py-4 cursor-pointer">
                        <summary className="flex items-start justify-between gap-3 list-none">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{b.subject}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(b.sent_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Mail className="w-3 h-3" /> {b.recipient_count}
                            </div>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-300 group-open:rotate-180 transition-transform" />
                          </div>
                        </summary>
                        {b.body && (
                          <p className="mt-3 pt-3 border-t border-slate-50 text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
                            {b.body}
                          </p>
                        )}
                      </details>
                    ))}
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Org Detail Slide-over ─────────────────────────────── */}
      {selectedOrgId && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/30 backdrop-blur-[2px]" onClick={closeOrgDetail} />

          {/* Panel */}
          <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">

            {/* Panel header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-600 to-violet-600">
              <div className="min-w-0">
                {orgDetail ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', orgDetail.org.account_type === 'team' ? 'bg-white/20 text-white' : 'bg-white/15 text-white/80')}>
                        {orgDetail.org.account_type === 'team' ? '👥 Team' : '👤 Solo'}
                      </span>
                      {orgDetail.org.country && <span className="text-[10px] text-white/60">{orgDetail.org.country}</span>}
                    </div>
                    <h2 className="text-lg font-black text-white truncate">{orgDetail.org.name}</h2>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {orgDetail.org.email && <span className="text-xs text-white/70 flex items-center gap-1"><Mail className="w-3 h-3" />{orgDetail.org.email}</span>}
                      {orgDetail.org.phone && <span className="text-xs text-white/70 flex items-center gap-1"><Phone className="w-3 h-3" />{orgDetail.org.phone}</span>}
                      {orgDetail.org.website && <a href={orgDetail.org.website} target="_blank" rel="noopener noreferrer" className="text-xs text-white/70 flex items-center gap-1 hover:text-white"><ExternalLink className="w-3 h-3" />{orgDetail.org.website}</a>}
                    </div>
                    <p className="text-[10px] text-white/50 mt-1">
                      Joined {new Date(orgDetail.org.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {orgDetail.org.last_active_at && ` · Last active ${new Date(orgDetail.org.last_active_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </>
                ) : (
                  <div className="h-14 flex items-center">
                    <div className="w-48 h-5 bg-white/20 rounded animate-pulse" />
                  </div>
                )}
              </div>
              <button onClick={closeOrgDetail} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 mt-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto">
              {(['overview','documents','clients','team','activity'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setOrgDetailTab(tab);
                    if (tab === 'activity' && selectedOrgId) loadOrgActivity(selectedOrgId);
                  }}
                  className={cn('flex-1 min-w-fit px-3 py-3 text-xs font-bold capitalize transition-colors whitespace-nowrap', orgDetailTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-400 hover:text-slate-600')}
                >
                  {tab === 'overview' && <BarChart2 className="w-3.5 h-3.5 inline mr-1" />}
                  {tab === 'documents' && <FileText className="w-3.5 h-3.5 inline mr-1" />}
                  {tab === 'clients' && <Users className="w-3.5 h-3.5 inline mr-1" />}
                  {tab === 'team' && <UserCheck className="w-3.5 h-3.5 inline mr-1" />}
                  {tab === 'activity' && <Activity className="w-3.5 h-3.5 inline mr-1" />}
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {orgDetailLoading && (
                <div className="flex items-center justify-center h-48">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!orgDetailLoading && orgDetail && orgDetailTab === 'overview' && (() => {
                const o = orgDetail.org;
                const sym = o.currency_symbol || '$';
                const fmt = (n: number) => `${sym}${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                const totalInvoiced = orgDetail.recentDocs.filter((d:any)=>d.type==='invoice').reduce((s:number,d:any)=>s+d.total,0);
                const totalCollected = orgDetail.recentDocs.filter((d:any)=>d.type==='invoice').reduce((s:number,d:any)=>s+d.amount_paid,0);
                const outstanding = orgDetail.recentDocs.filter((d:any)=>d.type==='invoice'&&(d.status==='sent'||d.status==='overdue')).reduce((s:number,d:any)=>s+d.balance_due,0);
                const overdue = orgDetail.recentDocs.filter((d:any)=>d.status==='overdue').length;
                return (
                  <div className="p-5 space-y-5">
                    {/* KPI row */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Collected', value: fmt(totalCollected), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Outstanding', value: fmt(outstanding), color: outstanding > 0 ? 'text-amber-600' : 'text-slate-400', bg: 'bg-amber-50' },
                        { label: 'Overdue', value: String(overdue), color: overdue > 0 ? 'text-red-500' : 'text-slate-400', bg: 'bg-red-50' },
                        { label: 'Clients', value: String(orgDetail.clients.length), color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      ].map(s => (
                        <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
                          <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Monthly revenue mini chart */}
                    {orgDetail.monthly.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Monthly Activity</p>
                        <div className="space-y-2">
                          {[...orgDetail.monthly].reverse().map((m: any) => {
                            const maxInvoiced = Math.max(...orgDetail.monthly.map((x:any) => x.invoiced), 1);
                            return (
                              <div key={m.month} className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400 w-14 shrink-0">{m.month}</span>
                                <div className="flex-1 bg-slate-100 rounded-full h-2 relative overflow-hidden">
                                  <div className="absolute inset-y-0 left-0 bg-indigo-400 rounded-full" style={{ width: `${(m.invoiced / maxInvoiced) * 100}%` }} />
                                  <div className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full" style={{ width: `${(m.collected / maxInvoiced) * 100}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 shrink-0">{fmt(m.collected)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />Invoiced</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Collected</span>
                        </div>
                      </div>
                    )}

                    {/* Org details */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Business Details</p>
                      <div className="space-y-2 text-xs text-slate-600">
                        {o.address && <div className="flex gap-2"><span className="text-slate-400 w-20 shrink-0">Address</span><span>{[o.address, o.city, o.state, o.zip, o.country].filter(Boolean).join(', ')}</span></div>}
                        {o.currency && <div className="flex gap-2"><span className="text-slate-400 w-20 shrink-0">Currency</span><span>{o.currency} ({o.currency_symbol})</span></div>}
                        {o.tax_name && o.tax_rate > 0 && <div className="flex gap-2"><span className="text-slate-400 w-20 shrink-0">Tax</span><span>{o.tax_name} {o.tax_rate}%</span></div>}
                        {o.invoice_prefix && <div className="flex gap-2"><span className="text-slate-400 w-20 shrink-0">Prefixes</span><span>{o.invoice_prefix} / {o.receipt_prefix} / {o.quote_prefix}</span></div>}
                        {o.bank_name && <div className="flex gap-2"><span className="text-slate-400 w-20 shrink-0">Bank</span><span>{o.bank_name}{o.bank_account ? ` · ${o.bank_account}` : ''}</span></div>}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {!orgDetailLoading && orgDetail && orgDetailTab === 'documents' && (
                <div>
                  {orgDetail.recentDocs.length === 0 ? (
                    <div className="py-12 text-center text-slate-300 text-sm">No documents yet</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {orgDetail.recentDocs.map((doc: any) => {
                        const statusColor: Record<string,string> = { paid: 'text-emerald-600 bg-emerald-50', sent: 'text-blue-600 bg-blue-50', overdue: 'text-red-500 bg-red-50', draft: 'text-slate-400 bg-slate-100', cancelled: 'text-slate-300 bg-slate-50', none: 'text-slate-400 bg-slate-100' };
                        const sym = doc.currency_symbol || '$';
                        return (
                          <div key={doc.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{doc.type}</span>
                                <span className="text-xs font-bold text-slate-700">{doc.number}</span>
                                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', statusColor[doc.status] || 'text-slate-400 bg-slate-100')}>{doc.status}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{doc.client_name || '—'} · {doc.issue_date}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-black text-slate-800">{sym}{Number(doc.total||0).toLocaleString()}</div>
                              {doc.type === 'invoice' && doc.amount_paid > 0 && doc.amount_paid < doc.total && (
                                <div className="text-[10px] text-emerald-600">{sym}{Number(doc.amount_paid).toLocaleString()} paid</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {orgDetail.recentQuotes.length > 0 && (
                    <>
                      <div className="px-5 py-2 bg-slate-50 border-y border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quotes</p>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {orgDetail.recentQuotes.map((q: any) => {
                          const statusColor: Record<string,string> = { accepted: 'text-emerald-600 bg-emerald-50', declined: 'text-red-500 bg-red-50', sent: 'text-blue-600 bg-blue-50', invoiced: 'text-indigo-600 bg-indigo-50', draft: 'text-slate-400 bg-slate-100', expired: 'text-slate-300 bg-slate-50' };
                          return (
                            <div key={q.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-700">{q.number}</span>
                                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', statusColor[q.status] || 'text-slate-400 bg-slate-100')}>{q.status}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{q.client_name || '—'} · {q.issue_date}</div>
                              </div>
                              <div className="text-sm font-black text-slate-800 shrink-0">{orgDetail.org.currency_symbol||'$'}{Number(q.total||0).toLocaleString()}</div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {!orgDetailLoading && orgDetail && orgDetailTab === 'clients' && (
                <div>
                  {orgDetail.clients.length === 0 ? (
                    <div className="py-12 text-center text-slate-300 text-sm">No clients yet</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {orgDetail.clients.map((c: any) => (
                        <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-800 truncate">{c.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{c.company ? `${c.company} · ` : ''}{c.email || c.phone || '—'}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-slate-600">{c.doc_count} doc{c.doc_count !== 1 ? 's' : ''}</div>
                            {c.total_paid > 0 && <div className="text-[10px] text-emerald-600">{Number(c.total_paid).toLocaleString()} paid</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Activity Tab ─────────────────────────────────── */}
              {orgDetailTab === 'activity' && (
                <div>
                  {orgActivityLoading && (
                    <div className="flex items-center justify-center h-48">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!orgActivityLoading && !orgActivity && (
                    <div className="py-12 text-center text-slate-300 text-sm">No activity data yet</div>
                  )}
                  {!orgActivityLoading && orgActivity && (() => {
                    const { stats, topPages, byHour, daily, sessions } = orgActivity;
                    const maxHour = Math.max(...byHour.map((h: any) => h.sessions), 1);
                    const maxDaily = Math.max(...daily.map((d: any) => d.seconds), 1);
                    return (
                      <div>
                        {/* Summary stats */}
                        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                          {[
                            { label: 'Total Time Online', value: fmtDuration(stats.total_seconds || 0) },
                            { label: 'Sessions', value: stats.total_sessions || 0 },
                            { label: 'Avg Session', value: fmtDuration(Math.round(stats.avg_session_seconds || 0)) },
                          ].map(s => (
                            <div key={s.label} className="px-4 py-4 text-center">
                              <div className="text-lg font-black text-slate-800">{s.value}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{s.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Top pages */}
                        {topPages.length > 0 && (
                          <div className="px-5 py-4 border-b border-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Most Visited Pages</p>
                            <div className="space-y-2">
                              {topPages.map((p: any, i: number) => {
                                const pct = Math.round((p.visits / topPages[0].visits) * 100);
                                return (
                                  <div key={i} className="flex items-center gap-3">
                                    <span className="text-[10px] text-slate-400 w-4 text-right shrink-0">{i + 1}</span>
                                    <span className="text-xs font-bold text-slate-700 w-32 shrink-0 truncate">{pageName(p.page)}</span>
                                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 w-8 text-right shrink-0">{p.visits}×</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Activity by hour */}
                        {byHour.length > 0 && (
                          <div className="px-5 py-4 border-b border-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Active Hours (local time)</p>
                            <div className="flex items-end gap-0.5 h-16">
                              {Array.from({ length: 24 }, (_, h) => {
                                const entry = byHour.find((b: any) => b.hour === h);
                                const count = entry?.sessions || 0;
                                const heightPct = count > 0 ? Math.max(10, Math.round((count / maxHour) * 100)) : 0;
                                return (
                                  <div key={h} className="flex-1 flex flex-col items-center gap-0.5" title={`${h}:00 — ${count} session${count !== 1 ? 's' : ''}`}>
                                    <div className="w-full rounded-sm" style={{ height: `${heightPct}%`, background: count > 0 ? '#6366f1' : '#e2e8f0', minHeight: count > 0 ? 4 : 2 }} />
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-300 mt-1">
                              <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
                            </div>
                          </div>
                        )}

                        {/* Daily activity last 30 days */}
                        {daily.length > 0 && (
                          <div className="px-5 py-4 border-b border-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Daily Activity (last 30 days)</p>
                            <div className="flex items-end gap-0.5 h-12">
                              {daily.map((d: any) => {
                                const heightPct = Math.max(6, Math.round((d.seconds / maxDaily) * 100));
                                return (
                                  <div key={d.date} className="flex-1 rounded-sm bg-emerald-400" style={{ height: `${heightPct}%` }}
                                    title={`${d.date}: ${d.sessions} session${d.sessions !== 1 ? 's' : ''}, ${fmtDuration(d.seconds)}`} />
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Recent sessions list */}
                        <div className="px-5 py-4">
                          <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Recent Sessions</p>
                          {sessions.length === 0 ? (
                            <p className="text-xs text-slate-300">No sessions recorded yet</p>
                          ) : (
                            <div className="space-y-2">
                              {sessions.slice(0, 20).map((s: any) => (
                                <div key={s.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                                  <div className="w-1 h-full min-h-4 bg-indigo-200 rounded-full mt-1 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-slate-700">
                                        {new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        {' · '}
                                        {new Date(s.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                      </span>
                                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">{fmtDuration(s.duration_seconds)}</span>
                                    </div>
                                    {s.pages.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {s.pages.map((p: string) => (
                                          <span key={p} className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{pageName(p)}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {!orgDetailLoading && orgDetail && orgDetailTab === 'team' && (
                <div>
                  <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
                    <p className="text-xs text-slate-500">{orgDetail.team.length} member{orgDetail.team.length !== 1 ? 's' : ''} · {orgDetail.team.filter((t:any) => t.invite_accepted).length} active</p>
                  </div>
                  {orgDetail.team.length === 0 ? (
                    <div className="py-12 text-center text-slate-300 text-sm">Solo account - no team members</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {orgDetail.team.map((m: any) => (
                        <div key={m.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-bold text-slate-800 truncate">{m.name || m.email}</div>
                              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', m.invite_accepted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
                                {m.invite_accepted ? 'Active' : 'Pending'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">{m.email} · <span className="capitalize">{m.role}</span></div>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-300 shrink-0">
                            <Clock className="w-3 h-3" />
                            {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
