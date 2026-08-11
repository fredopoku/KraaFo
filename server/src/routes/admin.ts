import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { adminAuth } from '../middleware/adminAuth';
import { getRiskConfig, saveRiskConfig, reloadRiskConfig } from '../config/riskConfig';
import { getMaintenanceConfig, setMaintenanceConfig } from '../config/maintenanceConfig';

const router = Router();

router.get('/users', adminAuth, (_req: Request, res: Response) => {
  const orgs = db.prepare(`
    SELECT
      o.id, o.name, o.email, o.country, o.account_type, o.created_at, COALESCE(o.last_active_at, o.created_at) as last_active_at,
      o.last_seen, o.current_page, COALESCE(o.total_logins, 0) as total_logins,
      -- Document counts (active only)
      (SELECT COUNT(*) FROM invoices WHERE org_id = o.id AND type = 'invoice' AND deleted_at IS NULL) as invoice_count,
      (SELECT COUNT(*) FROM invoices WHERE org_id = o.id AND type = 'receipt' AND deleted_at IS NULL) as receipt_count,
      (SELECT COUNT(*) FROM quotes WHERE org_id = o.id AND deleted_at IS NULL) as quote_count,
      (SELECT COUNT(*) FROM clients WHERE org_id = o.id AND deleted_at IS NULL) as client_count,
      -- Team
      (SELECT COUNT(*) FROM team_members WHERE org_id = o.id AND invite_accepted = 1) as team_member_count,
      (SELECT COUNT(*) FROM team_members WHERE org_id = o.id AND invite_accepted = 0) as pending_invites,
      -- Financials (active only)
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE org_id = o.id AND type = 'invoice' AND deleted_at IS NULL) as total_invoiced,
      (SELECT COALESCE(SUM(amount_paid),0) FROM invoices WHERE org_id = o.id AND type = 'invoice' AND deleted_at IS NULL) as total_collected,
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE org_id = o.id AND type = 'invoice' AND status = 'paid' AND deleted_at IS NULL) as total_paid_invoices,
      (SELECT COALESCE(SUM(total - amount_paid),0) FROM invoices WHERE org_id = o.id AND type = 'invoice' AND status IN ('sent','overdue') AND deleted_at IS NULL) as outstanding,
      (SELECT COUNT(*) FROM invoices WHERE org_id = o.id AND type = 'invoice' AND status = 'overdue' AND deleted_at IS NULL) as overdue_count,
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE org_id = o.id AND type = 'receipt' AND deleted_at IS NULL) as receipt_revenue,
      -- Quote pipeline (active only)
      (SELECT COUNT(*) FROM quotes WHERE org_id = o.id AND status IN ('accepted','invoiced') AND deleted_at IS NULL) as accepted_quotes,
      (SELECT COUNT(*) FROM quotes WHERE org_id = o.id AND status = 'declined' AND deleted_at IS NULL) as declined_quotes,
      (SELECT COUNT(*) FROM quotes WHERE org_id = o.id AND status IN ('draft','sent') AND deleted_at IS NULL) as pending_quotes,
      -- Trash
      (
        (SELECT COUNT(*) FROM invoices WHERE org_id = o.id AND deleted_at IS NOT NULL) +
        (SELECT COUNT(*) FROM quotes WHERE org_id = o.id AND deleted_at IS NOT NULL) +
        (SELECT COUNT(*) FROM clients WHERE org_id = o.id AND deleted_at IS NOT NULL)
      ) as trash_count
    FROM organizations o
    ORDER BY COALESCE(o.last_active_at, o.created_at) DESC
  `).all() as any[];

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_orgs,
      (SELECT COUNT(*) FROM invoices WHERE type = 'invoice' AND deleted_at IS NULL) as total_invoices,
      (SELECT COUNT(*) FROM invoices WHERE type = 'receipt' AND deleted_at IS NULL) as total_receipts,
      (SELECT COUNT(*) FROM quotes WHERE deleted_at IS NULL) as total_quotes,
      (SELECT COALESCE(SUM(amount_paid),0) FROM invoices WHERE type = 'invoice' AND deleted_at IS NULL) as total_collected,
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE type = 'invoice' AND deleted_at IS NULL) as total_invoiced,
      (SELECT COALESCE(SUM(total - amount_paid),0) FROM invoices WHERE type = 'invoice' AND status IN ('sent','overdue') AND deleted_at IS NULL) as total_outstanding,
      (SELECT COUNT(*) FROM invoices WHERE type = 'invoice' AND status = 'overdue' AND deleted_at IS NULL) as total_overdue,
      (SELECT COUNT(*) FROM team_members WHERE invite_accepted = 1) as total_team_members,
      (SELECT COUNT(*) FROM organizations WHERE account_type = 'team') as team_accounts,
      (SELECT COUNT(*) FROM organizations WHERE account_type = 'solo' OR account_type IS NULL) as solo_accounts,
      (
        (SELECT COUNT(*) FROM invoices WHERE deleted_at IS NOT NULL) +
        (SELECT COUNT(*) FROM quotes WHERE deleted_at IS NOT NULL) +
        (SELECT COUNT(*) FROM clients WHERE deleted_at IS NOT NULL)
      ) as total_trashed
    FROM organizations
  `).get() as any;

  // Active in last 30 days (by last_active_at API timestamp)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const active_orgs = orgs.filter(o => o.last_active_at && o.last_active_at >= thirtyDaysAgo).length;

  // Recent payments across all orgs (last 20 paid invoices)
  const recentPayments = db.prepare(`
    SELECT i.id, i.number, i.client_name, i.total, i.amount_paid, i.paid_date, i.status, i.type,
           o.name as org_name, o.currency_symbol
    FROM invoices i
    JOIN organizations o ON o.id = i.org_id
    WHERE i.status = 'paid' AND i.paid_date IS NOT NULL AND i.deleted_at IS NULL
    ORDER BY i.paid_date DESC, i.updated_at DESC
    LIMIT 20
  `).all() as any[];

  // New signups last 7 days
  const newThisWeek = orgs.filter(o => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return o.created_at >= sevenDaysAgo;
  }).length;

  // All-time platform revenue by month
  const platformRevenue = db.prepare(`
    SELECT strftime('%Y-%m', issue_date) as period,
           COALESCE(SUM(total),0) as revenue,
           COUNT(*) as count
    FROM invoices
    WHERE status = 'paid' AND deleted_at IS NULL
    GROUP BY period ORDER BY period ASC
  `).all() as any[];

  // All-time platform revenue by year
  const platformRevenueYearly = db.prepare(`
    SELECT strftime('%Y', issue_date) as period,
           COALESCE(SUM(total),0) as revenue,
           COUNT(*) as count
    FROM invoices
    WHERE status = 'paid' AND deleted_at IS NULL
    GROUP BY period ORDER BY period ASC
  `).all() as any[];

  res.json({ orgs, summary: { ...summary, active_orgs, new_this_week: newThisWeek }, recentPayments, platformRevenue, platformRevenueYearly });
});

// Live user presence — who is online right now
router.get('/presence', adminAuth, (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT
      o.id, o.name, o.email, o.country, o.current_page, o.last_seen,
      COALESCE(o.total_logins, 0) as total_logins,
      (SELECT COUNT(*) FROM invoices WHERE org_id = o.id AND deleted_at IS NULL) +
      (SELECT COUNT(*) FROM quotes WHERE org_id = o.id AND deleted_at IS NULL) as total_docs,
      CAST((julianday('now') - julianday(o.last_seen)) * 86400 AS INTEGER) as seconds_ago,
      (SELECT COALESCE(SUM(duration_seconds), 0) FROM org_sessions
       WHERE org_id = o.id AND date(started_at) = date('now')) as today_seconds,
      (SELECT COUNT(*) FROM org_sessions WHERE org_id = o.id) as total_sessions
    FROM organizations o
    WHERE o.last_seen IS NOT NULL
      AND o.last_seen >= datetime('now', '-30 minutes')
    ORDER BY o.last_seen DESC
  `).all() as any[];

  const online = rows.filter((r: any) => r.seconds_ago <= 180);
  const recently = rows.filter((r: any) => r.seconds_ago > 180);

  res.json({ online, recently, online_count: online.length });
});

// Per-org session analytics
router.get('/orgs/:id/activity', adminAuth, (req: Request, res: Response) => {
  const { id } = req.params;

  const sessions = db.prepare(`
    SELECT id, started_at, last_seen, duration_seconds, pages
    FROM org_sessions WHERE org_id = ?
    ORDER BY started_at DESC LIMIT 50
  `).all(id) as any[];

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_sessions,
      COALESCE(SUM(duration_seconds), 0) as total_seconds,
      COALESCE(AVG(NULLIF(duration_seconds, 0)), 0) as avg_session_seconds
    FROM org_sessions WHERE org_id = ?
  `).get(id) as any;

  // Aggregate page visits across all sessions
  const pageCounts: Record<string, number> = {};
  for (const s of sessions) {
    try {
      const pages: string[] = JSON.parse(s.pages || '[]');
      for (const p of pages) pageCounts[p] = (pageCounts[p] || 0) + 1;
    } catch {}
  }
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, visits]) => ({ page, visits }));

  // Sessions by hour of day (0-23)
  const byHour = db.prepare(`
    SELECT CAST(strftime('%H', started_at) AS INTEGER) as hour, COUNT(*) as sessions
    FROM org_sessions WHERE org_id = ?
    GROUP BY hour ORDER BY hour
  `).all(id) as any[];

  // Daily activity last 30 days
  const daily = db.prepare(`
    SELECT date(started_at) as date,
           COUNT(*) as sessions,
           COALESCE(SUM(duration_seconds), 0) as seconds
    FROM org_sessions
    WHERE org_id = ? AND started_at >= datetime('now', '-30 days')
    GROUP BY date ORDER BY date
  `).all(id) as any[];

  res.json({
    sessions: sessions.map(s => ({ ...s, pages: (() => { try { return JSON.parse(s.pages || '[]'); } catch { return []; } })() })),
    stats,
    topPages,
    byHour,
    daily,
  });
});

router.get('/orgs/:id', adminAuth, (req: Request, res: Response) => {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id) as any;
  if (!org) return res.status(404).json({ error: 'Not found' });

  const recentDocs = db.prepare(`
    SELECT id, number, type, status, client_name, total, amount_paid, balance_due,
           issue_date, due_date, paid_date, currency_symbol, created_at
    FROM invoices WHERE org_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 25
  `).all(req.params.id) as any[];

  const recentQuotes = db.prepare(`
    SELECT id, number, status, client_name, total, issue_date, expiry_date
    FROM quotes WHERE org_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 15
  `).all(req.params.id) as any[];

  const clients = db.prepare(`
    SELECT c.id, c.name, c.email, c.company, c.phone, c.country,
           COUNT(i.id) as doc_count,
           COALESCE(SUM(CASE WHEN i.type='invoice' THEN i.amount_paid ELSE 0 END), 0) as total_paid
    FROM clients c
    LEFT JOIN invoices i ON i.client_id = c.id AND i.deleted_at IS NULL
    WHERE c.org_id = ? AND c.deleted_at IS NULL
    GROUP BY c.id ORDER BY doc_count DESC LIMIT 20
  `).all(req.params.id) as any[];

  const team = db.prepare(`
    SELECT id, name, email, role, invite_accepted, created_at
    FROM team_members WHERE org_id = ? ORDER BY created_at ASC
  `).all(req.params.id) as any[];

  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', issue_date) as month,
           COALESCE(SUM(CASE WHEN type='invoice' THEN total ELSE 0 END),0) as invoiced,
           COALESCE(SUM(CASE WHEN type='invoice' THEN amount_paid ELSE 0 END),0) as collected,
           COALESCE(SUM(CASE WHEN type='receipt' THEN total ELSE 0 END),0) as receipts,
           COUNT(CASE WHEN type='invoice' THEN 1 END) as invoice_count,
           COUNT(CASE WHEN type='receipt' THEN 1 END) as receipt_count
    FROM invoices WHERE org_id = ? AND deleted_at IS NULL
    GROUP BY month ORDER BY month ASC
  `).all(req.params.id) as any[];

  // strip sensitive fields before sending
  const { password_hash, smtp_pass, dkim_private_key, ...safeOrg } = org;

  res.json({ org: safeOrg, recentDocs, recentQuotes, clients, team, monthly });
});

router.get('/analytics', adminAuth, (req: Request, res: Response) => {
  // days param: 7 | 30 | 90 | 0 (all time)
  const ALLOWED_DAYS = new Set([0, 7, 30, 90]);
  const days = ALLOWED_DAYS.has(Number(req.query.days)) ? Number(req.query.days) : 30;
  const since = days > 0 ? `datetime('now', '-${days} days')` : `'2000-01-01'`;
  const prevSince = days > 0 ? `datetime('now', '-${days * 2} days')` : `'2000-01-01'`;
  const prevUntil = days > 0 ? `datetime('now', '-${days} days')` : `datetime('now', '-${days} days')`;

  // Exclude admin pages
  const NOT_ADMIN = `page NOT LIKE '/admin%'`;

  const overview = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN date(created_at) = date('now') THEN 1 END) as today,
      COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as week,
      COUNT(CASE WHEN created_at >= ${since} THEN 1 END) as period,
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(DISTINCT CASE WHEN date(created_at) = date('now') THEN session_id END) as today_sessions,
      COUNT(DISTINCT CASE WHEN created_at >= datetime('now', '-7 days') THEN session_id END) as week_sessions
    FROM page_views
    WHERE ${NOT_ADMIN}
  `).get() as any;

  // Previous period for trend comparison
  const prev = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days') THEN 1 END) as week,
      COUNT(DISTINCT session_id) as unique_sessions
    FROM page_views
    WHERE ${NOT_ADMIN}
      AND created_at >= ${prevSince} AND created_at < ${prevUntil}
  `).get() as any;

  // Real-time: views in last 5 minutes
  const realtime = db.prepare(`
    SELECT COUNT(*) as active, COUNT(DISTINCT session_id) as sessions
    FROM page_views
    WHERE ${NOT_ADMIN} AND created_at >= datetime('now', '-5 minutes')
  `).get() as any;

  // Session metrics: avg duration and pages per session
  const sessionMetrics = db.prepare(`
    SELECT
      AVG(page_count) as avg_pages_per_session,
      AVG(duration_seconds) as avg_session_duration
    FROM (
      SELECT
        session_id,
        COUNT(*) as page_count,
        CAST((julianday(MAX(created_at)) - julianday(MIN(created_at))) * 86400 AS INTEGER) as duration_seconds
      FROM page_views
      WHERE ${NOT_ADMIN} AND created_at >= ${since}
      GROUP BY session_id
    )
  `).get() as any;

  // Bounce rate: sessions with only 1 page view
  const bounceData = db.prepare(`
    SELECT
      COUNT(*) as total_sessions,
      SUM(CASE WHEN page_count = 1 THEN 1 ELSE 0 END) as bounced
    FROM (
      SELECT session_id, COUNT(*) as page_count
      FROM page_views
      WHERE ${NOT_ADMIN} AND created_at >= ${since}
      GROUP BY session_id
    )
  `).get() as any;

  const countries = db.prepare(`
    SELECT country, country_code, COUNT(*) as count
    FROM page_views
    WHERE ${NOT_ADMIN} AND country IS NOT NULL AND country NOT IN ('Unknown','Local','')
      AND created_at >= ${since}
    GROUP BY country, country_code
    ORDER BY count DESC
    LIMIT 20
  `).all();

  const cities = db.prepare(`
    SELECT city, region, country, country_code, COUNT(*) as count
    FROM page_views
    WHERE ${NOT_ADMIN} AND city IS NOT NULL AND city != ''
      AND country NOT IN ('Unknown','Local','')
      AND created_at >= ${since}
    GROUP BY city, region, country
    ORDER BY count DESC
    LIMIT 20
  `).all();

  const daily = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count, COUNT(DISTINCT session_id) as sessions
    FROM page_views
    WHERE ${NOT_ADMIN} AND created_at >= ${since}
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all();

  const pages = db.prepare(`
    SELECT page, COUNT(*) as count, COUNT(DISTINCT session_id) as sessions
    FROM page_views
    WHERE ${NOT_ADMIN} AND created_at >= ${since}
    GROUP BY page
    ORDER BY count DESC
    LIMIT 10
  `).all();

  // Entry pages: first page of each session
  const entryPages = db.prepare(`
    SELECT page, COUNT(*) as count
    FROM (
      SELECT session_id, page, MIN(created_at) as first_seen
      FROM page_views
      WHERE ${NOT_ADMIN} AND created_at >= ${since}
      GROUP BY session_id
    )
    GROUP BY page
    ORDER BY count DESC
    LIMIT 10
  `).all();

  // Exit pages: last page of each session
  const exitPages = db.prepare(`
    SELECT page, COUNT(*) as count
    FROM (
      SELECT session_id, page, MAX(created_at) as last_seen
      FROM page_views
      WHERE ${NOT_ADMIN} AND created_at >= ${since}
      GROUP BY session_id
    )
    GROUP BY page
    ORDER BY count DESC
    LIMIT 10
  `).all();

  // Hourly distribution (0-23)
  const hourly = db.prepare(`
    SELECT CAST(strftime('%H', created_at, 'localtime') AS INTEGER) as hour, COUNT(*) as count
    FROM page_views
    WHERE ${NOT_ADMIN} AND created_at >= ${since}
    GROUP BY hour
    ORDER BY hour ASC
  `).all();

  const devices = db.prepare(`
    SELECT device, COUNT(*) as count
    FROM page_views
    WHERE ${NOT_ADMIN} AND device IS NOT NULL AND created_at >= ${since}
    GROUP BY device
    ORDER BY count DESC
  `).all();

  const browsers = db.prepare(`
    SELECT browser, COUNT(*) as count
    FROM page_views
    WHERE ${NOT_ADMIN} AND browser IS NOT NULL AND created_at >= ${since}
    GROUP BY browser
    ORDER BY count DESC
    LIMIT 8
  `).all();

  const referrers = db.prepare(`
    SELECT referrer, COUNT(*) as count
    FROM page_views
    WHERE ${NOT_ADMIN} AND referrer IS NOT NULL AND referrer != ''
      AND referrer NOT LIKE '%kraafo%'
      AND created_at >= ${since}
    GROUP BY referrer
    ORDER BY count DESC
    LIMIT 10
  `).all();

  // New signups per day
  const signupsDaily = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM organizations
    WHERE created_at >= ${since}
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all();

  // Documents created per day (invoices + quotes combined)
  const docsDaily = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM (
      SELECT created_at FROM invoices WHERE created_at >= ${since}
      UNION ALL
      SELECT created_at FROM quotes WHERE created_at >= ${since}
    )
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all();

  // Signup summary for funnel
  const signupSummary = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as week,
      COUNT(CASE WHEN date(created_at) = date('now') THEN 1 END) as today,
      COUNT(CASE WHEN created_at >= ${since} THEN 1 END) as period
    FROM organizations
  `).get() as any;

  // Active orgs: signed up and created ≥1 document
  const activeSignups = db.prepare(`
    SELECT COUNT(DISTINCT o.id) as count
    FROM organizations o
    WHERE o.created_at >= ${since}
      AND (
        EXISTS (SELECT 1 FROM invoices WHERE org_id = o.id)
        OR EXISTS (SELECT 1 FROM quotes WHERE org_id = o.id)
      )
  `).get() as any;

  // Senders: orgs that used deliver route (have sent docs, status = 'sent' or 'paid')
  const senderCount = db.prepare(`
    SELECT COUNT(DISTINCT org_id) as count
    FROM invoices
    WHERE status IN ('sent','paid','overdue') AND created_at >= ${since}
  `).get() as any;

  res.json({
    overview,
    prev,
    realtime,
    sessionMetrics,
    bounceData,
    countries,
    cities,
    daily,
    pages,
    entryPages,
    exitPages,
    hourly,
    devices,
    browsers,
    referrers,
    signupsDaily,
    docsDaily,
    signupSummary,
    activeSignups: activeSignups?.count ?? 0,
    senderCount: senderCount?.count ?? 0,
  });
});

router.get('/activity', adminAuth, (_req: Request, res: Response) => {
  const events = db.prepare(`
    SELECT 'signup' as type, id, name as title, email as subtitle, country,
           created_at as ts, NULL as amount, NULL as currency_symbol
    FROM organizations
    WHERE created_at >= datetime('now', '-30 days')
    UNION ALL
    SELECT
      CASE WHEN status = 'paid' THEN 'payment' WHEN status = 'sent' THEN 'sent' ELSE 'doc' END as type,
      i.id,
      (CASE i.type WHEN 'invoice' THEN 'Invoice' WHEN 'receipt' THEN 'Receipt' ELSE 'Doc' END) || ' ' || i.number as title,
      i.client_name as subtitle,
      NULL as country,
      COALESCE(i.paid_date, i.updated_at, i.created_at) as ts,
      CASE WHEN i.status = 'paid' THEN i.amount_paid ELSE i.total END as amount,
      i.currency_symbol
    FROM invoices i
    WHERE i.status IN ('sent', 'paid') AND i.deleted_at IS NULL
      AND COALESCE(i.paid_date, i.updated_at, i.created_at) >= datetime('now', '-30 days')
    UNION ALL
    SELECT 'quote' as type, id, 'Quote ' || number as title, client_name as subtitle,
           NULL as country, created_at as ts, total as amount, NULL as currency_symbol
    FROM quotes
    WHERE status IN ('sent', 'accepted', 'invoiced') AND deleted_at IS NULL
      AND created_at >= datetime('now', '-30 days')
    ORDER BY ts DESC
    LIMIT 25
  `).all();
  res.json({ events });
});

router.get('/analytics/views', adminAuth, (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const offset = Number(req.query.offset) || 0;
  const filterPage = req.query.page as string | undefined;

  const where = filterPage ? 'WHERE page = ?' : `WHERE page NOT LIKE '/admin%'`;
  const params: any[] = filterPage ? [filterPage, limit, offset] : [limit, offset];
  const countParams: any[] = filterPage ? [filterPage] : [];

  const views = db.prepare(
    `SELECT id, page, referrer, country, country_code, region, city, device, browser, session_id, created_at
     FROM page_views ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params);

  const { total } = db.prepare(
    `SELECT COUNT(*) as total FROM page_views ${where}`
  ).get(...countParams) as any;

  res.json({ views, total, limit, offset });
});

// ── Signup risk scoring: config + flagged signups ──────────────────

router.get('/risk-config', adminAuth, (_req: Request, res: Response) => {
  res.json(getRiskConfig());
});

router.put('/risk-config', adminAuth, (req: Request, res: Response) => {
  const { weights, thresholds } = req.body || {};
  if (!weights && !thresholds) {
    return res.status(400).json({ error: 'Provide weights and/or thresholds to update' });
  }
  const updated = saveRiskConfig({ weights, thresholds });
  res.json(updated);
});

// For an operator who hand-edited the config JSON file directly on the
// server instead of going through PUT above - picks up the file as-is.
router.post('/risk-config/reload', adminAuth, (_req: Request, res: Response) => {
  res.json(reloadRiskConfig());
});

router.get('/signups/flagged', adminAuth, (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;
  const status = req.query.status as string | undefined; // 'held_for_review' | 'pending_verification' | 'verified' | 'rejected'

  const where = status
    ? 'WHERE verification_status = ?'
    : `WHERE verification_status NOT IN ('verified') OR risk_action != 'allow'`;
  const params: any[] = status ? [status, limit, offset] : [limit, offset];
  const countParams: any[] = status ? [status] : [];

  const signups = db.prepare(`
    SELECT id, name, email, phone, country, created_at,
           verification_status, risk_score, risk_action,
           signup_ip, signup_asn, signup_country, signup_is_proxy, signup_is_hosting,
           fingerprint_hash, email_verified_at
    FROM organizations
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params);

  const { total } = db.prepare(`SELECT COUNT(*) as total FROM organizations ${where}`).get(...countParams) as any;

  res.json({ signups, total, limit, offset });
});

// Manual review outcome for a held/flagged signup - keeps a plain audit
// trail via verification_status rather than a separate log table, since
// that column already drives the access gate in middleware/auth.ts.
router.post('/signups/:id/review', adminAuth, (req: Request, res: Response) => {
  const { decision } = req.body as { decision?: 'clear' | 'verify' | 'reject' };
  if (!decision || !['clear', 'verify', 'reject'].includes(decision)) {
    return res.status(400).json({ error: "decision must be 'clear', 'verify', or 'reject'" });
  }
  const org = db.prepare('SELECT id FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Signup not found' });

  // 'clear' still requires the normal email-verification step; 'verify'
  // is for an admin who has independently confirmed the account is real.
  const nextStatus = decision === 'reject' ? 'rejected' : decision === 'verify' ? 'verified' : 'pending_verification';
  db.prepare('UPDATE organizations SET verification_status = ? WHERE id = ?').run(nextStatus, req.params.id);
  res.json({ id: req.params.id, verification_status: nextStatus });
});

// ── Maintenance mode ─────────────────────────────────────────────
// See middleware/maintenance.ts - this is exempt from the gate itself so
// toggling it off is always reachable regardless of current state.

router.get('/maintenance', adminAuth, (_req: Request, res: Response) => {
  res.json(getMaintenanceConfig());
});

router.put('/maintenance', adminAuth, (req: Request, res: Response) => {
  const { enabled, message } = req.body || {};
  if (typeof enabled !== 'boolean' && typeof message !== 'string') {
    return res.status(400).json({ error: 'Provide enabled and/or message to update' });
  }
  const updated = setMaintenanceConfig({
    ...(typeof enabled === 'boolean' ? { enabled } : {}),
    ...(typeof message === 'string' && message.trim() ? { message: message.trim() } : {}),
  });
  res.json(updated);
});

export default router;
