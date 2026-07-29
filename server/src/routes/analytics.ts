import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const org_id = req.auth!.orgId;

  const VALID_GRANULARITIES = new Set(['daily', 'monthly', 'yearly']);
  const granularity = VALID_GRANULARITIES.has(req.query.granularity as string)
    ? (req.query.granularity as string)
    : 'monthly';

  // Invoice financials — all-time, no date cap
  const totalInvoiced = (db.prepare(
    "SELECT COALESCE(SUM(total),0) as val FROM invoices WHERE org_id = ? AND type = 'invoice'"
  ).get(org_id) as any).val;

  const totalCollected = (db.prepare(
    "SELECT COALESCE(SUM(amount_paid),0) as val FROM invoices WHERE org_id = ? AND type = 'invoice'"
  ).get(org_id) as any).val;

  const totalRevenue = (db.prepare(
    "SELECT COALESCE(SUM(total),0) as val FROM invoices WHERE org_id = ? AND type = 'invoice' AND status = 'paid'"
  ).get(org_id) as any).val;

  const outstanding = (db.prepare(
    "SELECT COALESCE(SUM(total - amount_paid),0) as val FROM invoices WHERE org_id = ? AND type = 'invoice' AND status IN ('sent','overdue')"
  ).get(org_id) as any).val;

  const overdue = (db.prepare(
    "SELECT COALESCE(SUM(total - amount_paid),0) as val FROM invoices WHERE org_id = ? AND type = 'invoice' AND status = 'overdue'"
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

  // Receipt financials
  const totalReceipts = (db.prepare(
    "SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND type = 'receipt'"
  ).get(org_id) as any).c;

  const receiptRevenue = (db.prepare(
    "SELECT COALESCE(SUM(total),0) as val FROM invoices WHERE org_id = ? AND type = 'receipt'"
  ).get(org_id) as any).val;

  // Quote stats
  const totalQuotes = (db.prepare(
    "SELECT COUNT(*) as c FROM quotes WHERE org_id = ?"
  ).get(org_id) as any).c;

  const acceptedQuotes = (db.prepare(
    "SELECT COUNT(*) as c FROM quotes WHERE org_id = ? AND status IN ('accepted','invoiced')"
  ).get(org_id) as any).c;

  const declinedQuotes = (db.prepare(
    "SELECT COUNT(*) as c FROM quotes WHERE org_id = ? AND status = 'declined'"
  ).get(org_id) as any).c;

  const pendingQuotes = (db.prepare(
    "SELECT COUNT(*) as c FROM quotes WHERE org_id = ? AND status IN ('draft','sent')"
  ).get(org_id) as any).c;

  // Revenue chart — granularity-aware, always all-time except daily (last 90d for readability)
  let chartData: any[];
  if (granularity === 'daily') {
    chartData = db.prepare(`
      SELECT date(issue_date) as period,
             COALESCE(SUM(total),0) as revenue,
             COUNT(*) as count
      FROM invoices
      WHERE org_id = ? AND type = 'invoice' AND status = 'paid'
        AND issue_date >= date('now', '-90 days')
      GROUP BY period ORDER BY period ASC
    `).all(org_id);
  } else if (granularity === 'yearly') {
    chartData = db.prepare(`
      SELECT strftime('%Y', issue_date) as period,
             COALESCE(SUM(total),0) as revenue,
             COUNT(*) as count
      FROM invoices
      WHERE org_id = ? AND type = 'invoice' AND status = 'paid'
      GROUP BY period ORDER BY period ASC
    `).all(org_id);
  } else {
    // monthly — all time, no limit
    chartData = db.prepare(`
      SELECT strftime('%Y-%m', issue_date) as period,
             COALESCE(SUM(total),0) as revenue,
             COUNT(*) as count
      FROM invoices
      WHERE org_id = ? AND type = 'invoice' AND status = 'paid'
      GROUP BY period ORDER BY period ASC
    `).all(org_id);
  }

  // Top clients by collected amount — all time
  const topClients = db.prepare(`
    SELECT client_name, COALESCE(client_company,'') as company,
           COALESCE(SUM(amount_paid),0) as total_revenue,
           COUNT(*) as invoice_count
    FROM invoices
    WHERE org_id = ? AND type = 'invoice' AND client_name IS NOT NULL
    GROUP BY client_name ORDER BY total_revenue DESC LIMIT 5
  `).all(org_id);

  // Overdue invoices list
  const overdueList = db.prepare(`
    SELECT id, number, client_name, total, amount_paid, due_date, status
    FROM invoices
    WHERE org_id = ? AND type = 'invoice' AND status = 'overdue'
    ORDER BY due_date ASC LIMIT 10
  `).all(org_id);

  const totalClients = (db.prepare(
    'SELECT COUNT(*) as c FROM clients WHERE org_id = ?'
  ).get(org_id) as any).c;

  // Recent activity (all doc types)
  const recent = db.prepare(`
    SELECT id, type, number, client_name, total, amount_paid, status, issue_date
    FROM invoices WHERE org_id = ?
    UNION ALL
    SELECT id, 'quote' as type, number, client_name, total, 0 as amount_paid, status, issue_date
    FROM quotes WHERE org_id = ?
    ORDER BY issue_date DESC LIMIT 10
  `).all(org_id, org_id);

  res.json({
    summary: {
      totalInvoiced, totalCollected, totalRevenue, outstanding, overdue, overdueCount,
      totalInvoices, paidInvoices,
      totalReceipts, receiptRevenue,
      totalQuotes, acceptedQuotes, declinedQuotes, pendingQuotes,
      totalClients,
      collectionRate: totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0,
    },
    granularity,
    chartData,
    monthly: chartData, // kept for any existing references
    topClients,
    overdueList,
    recent,
  });
});

export default router;
