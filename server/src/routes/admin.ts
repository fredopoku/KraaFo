import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.get('/users', adminAuth, (_req: Request, res: Response) => {
  const orgs = db.prepare(`
    SELECT
      o.id, o.name, o.email, o.country, o.created_at,
      (SELECT COUNT(*) FROM invoices WHERE org_id = o.id AND type = 'invoice') as invoice_count,
      (SELECT COUNT(*) FROM invoices WHERE org_id = o.id AND type = 'receipt') as receipt_count,
      (SELECT COUNT(*) FROM quotes WHERE org_id = o.id) as quote_count,
      (SELECT COUNT(*) FROM clients WHERE org_id = o.id) as client_count,
      (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE org_id = o.id AND status = 'paid') as total_revenue,
      (SELECT MAX(created_at) FROM invoices WHERE org_id = o.id) as last_active
    FROM organizations o
    ORDER BY o.created_at DESC
  `).all() as any[];

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_orgs,
      (SELECT COUNT(*) FROM invoices WHERE type = 'invoice') as total_invoices,
      (SELECT COUNT(*) FROM invoices WHERE type = 'receipt') as total_receipts,
      (SELECT COUNT(*) FROM quotes) as total_quotes,
      (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'paid') as total_revenue
    FROM organizations
  `).get() as any;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const active_orgs = orgs.filter(o => o.last_active && o.last_active >= thirtyDaysAgo).length;

  res.json({ orgs, summary: { ...summary, active_orgs } });
});

router.get('/analytics', adminAuth, (req: Request, res: Response) => {
  // days param: 7 | 30 | 90 | 0 (all time)
  const days = Number(req.query.days) || 30;
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
