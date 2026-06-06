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

export default router;
