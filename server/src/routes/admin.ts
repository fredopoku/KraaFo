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

router.get('/analytics', adminAuth, (_req: Request, res: Response) => {
  const overview = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN date(created_at) = date('now') THEN 1 END) as today,
      COUNT(CASE WHEN created_at >= datetime('now', '-7 days')  THEN 1 END) as week,
      COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as month,
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(DISTINCT CASE WHEN date(created_at) = date('now') THEN session_id END) as today_sessions
    FROM page_views
  `).get() as any;

  const countries = db.prepare(`
    SELECT country, country_code, COUNT(*) as count
    FROM page_views
    WHERE country IS NOT NULL AND country NOT IN ('Unknown','Local','')
    GROUP BY country, country_code
    ORDER BY count DESC
    LIMIT 20
  `).all();

  const cities = db.prepare(`
    SELECT city, region, country, country_code, COUNT(*) as count
    FROM page_views
    WHERE city IS NOT NULL AND city != '' AND country NOT IN ('Unknown','Local','')
    GROUP BY city, region, country
    ORDER BY count DESC
    LIMIT 20
  `).all();

  const daily = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM page_views
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all();

  const pages = db.prepare(`
    SELECT page, COUNT(*) as count
    FROM page_views
    GROUP BY page
    ORDER BY count DESC
    LIMIT 10
  `).all();

  const devices = db.prepare(`
    SELECT device, COUNT(*) as count
    FROM page_views
    WHERE device IS NOT NULL
    GROUP BY device
    ORDER BY count DESC
  `).all();

  const browsers = db.prepare(`
    SELECT browser, COUNT(*) as count
    FROM page_views
    WHERE browser IS NOT NULL
    GROUP BY browser
    ORDER BY count DESC
    LIMIT 8
  `).all();

  const referrers = db.prepare(`
    SELECT referrer, COUNT(*) as count
    FROM page_views
    WHERE referrer IS NOT NULL AND referrer != ''
      AND referrer NOT LIKE '%kraafo%'
    GROUP BY referrer
    ORDER BY count DESC
    LIMIT 10
  `).all();

  res.json({ overview, countries, cities, daily, pages, devices, browsers, referrers });
});

export default router;
