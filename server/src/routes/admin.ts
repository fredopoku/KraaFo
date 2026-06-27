import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.get('/users', adminAuth, (_req: Request, res: Response) => {
  const orgs = db.prepare(`
    SELECT
      o.id, o.name, o.email, o.country, o.account_type, o.created_at, COALESCE(o.last_active_at, o.created_at) as last_active_at,
      -- Document counts
      (SELECT COUNT(*) FROM invoices WHERE org_id = o.id AND type = 'invoice') as invoice_count,
      (SELECT COUNT(*) FROM invoices WHERE org_id = o.id AND type = 'receipt') as receipt_count,
      (SELECT COUNT(*) FROM quotes WHERE org_id = o.id) as quote_count,
      (SELECT COUNT(*) FROM clients WHERE org_id = o.id) as client_count,
      -- Team
      (SELECT COUNT(*) FROM team_members WHERE org_id = o.id AND invite_accepted = 1) as team_member_count,
      (SELECT COUNT(*) FROM team_members WHERE org_id = o.id AND invite_accepted = 0) as pending_invites,
      -- Financials
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE org_id = o.id AND type = 'invoice') as total_invoiced,
      (SELECT COALESCE(SUM(amount_paid),0) FROM invoices WHERE org_id = o.id AND type = 'invoice') as total_collected,
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE org_id = o.id AND type = 'invoice' AND status = 'paid') as total_paid_invoices,
      (SELECT COALESCE(SUM(total - amount_paid),0) FROM invoices WHERE org_id = o.id AND type = 'invoice' AND status IN ('sent','overdue')) as outstanding,
      (SELECT COUNT(*) FROM invoices WHERE org_id = o.id AND type = 'invoice' AND status = 'overdue') as overdue_count,
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE org_id = o.id AND type = 'receipt') as receipt_revenue,
      -- Quote pipeline
      (SELECT COUNT(*) FROM quotes WHERE org_id = o.id AND status IN ('accepted','invoiced')) as accepted_quotes,
      (SELECT COUNT(*) FROM quotes WHERE org_id = o.id AND status = 'declined') as declined_quotes,
      (SELECT COUNT(*) FROM quotes WHERE org_id = o.id AND status IN ('draft','sent')) as pending_quotes
    FROM organizations o
    ORDER BY COALESCE(o.last_active_at, o.created_at) DESC
  `).all() as any[];

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_orgs,
      (SELECT COUNT(*) FROM invoices WHERE type = 'invoice') as total_invoices,
      (SELECT COUNT(*) FROM invoices WHERE type = 'receipt') as total_receipts,
      (SELECT COUNT(*) FROM quotes) as total_quotes,
      (SELECT COALESCE(SUM(amount_paid),0) FROM invoices WHERE type = 'invoice') as total_collected,
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE type = 'invoice') as total_invoiced,
      (SELECT COALESCE(SUM(total - amount_paid),0) FROM invoices WHERE type = 'invoice' AND status IN ('sent','overdue')) as total_outstanding,
      (SELECT COUNT(*) FROM invoices WHERE type = 'invoice' AND status = 'overdue') as total_overdue,
      (SELECT COUNT(*) FROM team_members WHERE invite_accepted = 1) as total_team_members,
      (SELECT COUNT(*) FROM organizations WHERE account_type = 'team') as team_accounts,
      (SELECT COUNT(*) FROM organizations WHERE account_type = 'solo' OR account_type IS NULL) as solo_accounts
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
    WHERE i.status = 'paid' AND i.paid_date IS NOT NULL
    ORDER BY i.paid_date DESC, i.updated_at DESC
    LIMIT 20
  `).all() as any[];

  // New signups last 7 days
  const newThisWeek = orgs.filter(o => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return o.created_at >= sevenDaysAgo;
  }).length;

  res.json({ orgs, summary: { ...summary, active_orgs, new_this_week: newThisWeek }, recentPayments });
});

router.get('/orgs/:id', adminAuth, (req: Request, res: Response) => {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id) as any;
  if (!org) return res.status(404).json({ error: 'Not found' });

  const recentDocs = db.prepare(`
    SELECT id, number, type, status, client_name, total, amount_paid, balance_due,
           issue_date, due_date, paid_date, currency_symbol, created_at
    FROM invoices WHERE org_id = ? ORDER BY created_at DESC LIMIT 25
  `).all(req.params.id) as any[];

  const recentQuotes = db.prepare(`
    SELECT id, number, status, client_name, total, issue_date, expiry_date
    FROM quotes WHERE org_id = ? ORDER BY created_at DESC LIMIT 15
  `).all(req.params.id) as any[];

  const clients = db.prepare(`
    SELECT c.id, c.name, c.email, c.company, c.phone, c.country,
           COUNT(i.id) as doc_count,
           COALESCE(SUM(CASE WHEN i.type='invoice' THEN i.amount_paid ELSE 0 END), 0) as total_paid
    FROM clients c
    LEFT JOIN invoices i ON i.client_id = c.id
    WHERE c.org_id = ?
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
    FROM invoices WHERE org_id = ?
    GROUP BY month ORDER BY month DESC LIMIT 6
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
  });
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

export default router;
