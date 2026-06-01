import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { org_id } = req.query;
  if (!org_id) return res.status(400).json({ error: 'org_id required' });

  const totalRevenue = (db.prepare(
    "SELECT COALESCE(SUM(total),0) as val FROM invoices WHERE org_id = ? AND type = 'invoice' AND status = 'paid'"
  ).get(org_id) as any).val;

  const outstanding = (db.prepare(
    "SELECT COALESCE(SUM(balance_due),0) as val FROM invoices WHERE org_id = ? AND type = 'invoice' AND status IN ('sent','overdue')"
  ).get(org_id) as any).val;

  const overdue = (db.prepare(
    "SELECT COALESCE(SUM(balance_due),0) as val FROM invoices WHERE org_id = ? AND type = 'invoice' AND status = 'overdue'"
  ).get(org_id) as any).val;

  const overdueCount = (db.prepare(
    "SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND type = 'invoice' AND status = 'overdue'"
  ).get(org_id) as any).c;

  const totalInvoices = (db.prepare(
    "SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND type = 'invoice'"
  ).get(org_id) as any).c;

  const paidInvoices = (db.prepare(
    "SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND type = 'invoice' AND status = 'paid'"
  ).get(org_id) as any).c;

  const totalReceipts = (db.prepare(
    "SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND type = 'receipt'"
  ).get(org_id) as any).c;

  const totalQuotes = (db.prepare(
    "SELECT COUNT(*) as c FROM quotes WHERE org_id = ?"
  ).get(org_id) as any).c;

  const acceptedQuotes = (db.prepare(
    "SELECT COUNT(*) as c FROM quotes WHERE org_id = ? AND status IN ('accepted','invoiced')"
  ).get(org_id) as any).c;

  // Monthly revenue for last 6 months
  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', issue_date) as month,
           SUM(total) as revenue,
           COUNT(*) as count
    FROM invoices
    WHERE org_id = ? AND type = 'invoice' AND status = 'paid'
      AND issue_date >= date('now', '-6 months')
    GROUP BY month ORDER BY month ASC
  `).all(org_id);

  // Top clients by revenue
  const topClients = db.prepare(`
    SELECT client_name, COALESCE(client_company,'') as company,
           SUM(total) as total_revenue, COUNT(*) as invoice_count
    FROM invoices
    WHERE org_id = ? AND type = 'invoice' AND status = 'paid' AND client_name IS NOT NULL
    GROUP BY client_name ORDER BY total_revenue DESC LIMIT 5
  `).all(org_id);

  // Recent activity
  const recent = db.prepare(`
    SELECT id, type, number, client_name, total, status, issue_date
    FROM invoices WHERE org_id = ?
    ORDER BY created_at DESC LIMIT 8
  `).all(org_id);

  res.json({
    summary: { totalRevenue, outstanding, overdue, overdueCount, totalInvoices, paidInvoices, totalReceipts, totalQuotes, acceptedQuotes },
    monthly,
    topClients,
    recent,
  });
});

export default router;
