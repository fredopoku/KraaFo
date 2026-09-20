import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const org_id = req.auth!.orgId;

  const VALID_GRANULARITIES = new Set(['daily', 'monthly', 'yearly']);
  const granularity = VALID_GRANULARITIES.has(req.query.granularity as string)
    ? (req.query.granularity as string)
    : 'monthly';

  // Invoice financials — all-time, no date cap. "Invoiced" means actually
  // billed, so drafts and cancelled invoices are left out (they'd otherwise
  // drag the collection rate down for money that was never owed).
  const totalInvoiced = (db.prepare(
    "SELECT COALESCE(SUM(total),0) as val FROM invoices WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND status NOT IN ('draft','cancelled')"
  ).get(org_id) as any).val;

  const totalCollected = (db.prepare(
    "SELECT COALESCE(SUM(amount_paid),0) as val FROM invoices WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice'"
  ).get(org_id) as any).val;

  const totalRevenue = (db.prepare(
    "SELECT COALESCE(SUM(total),0) as val FROM invoices WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND status = 'paid'"
  ).get(org_id) as any).val;

  const outstanding = (db.prepare(
    "SELECT COALESCE(SUM(total - amount_paid),0) as val FROM invoices WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND status IN ('sent','overdue')"
  ).get(org_id) as any).val;

  const overdue = (db.prepare(
    "SELECT COALESCE(SUM(total - amount_paid),0) as val FROM invoices WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND status = 'overdue'"
  ).get(org_id) as any).val;

  const overdueCount = (db.prepare(
    "SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND status = 'overdue'"
  ).get(org_id) as any).c;

  const totalInvoices = (db.prepare(
    "SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice'"
  ).get(org_id) as any).c;

  const paidInvoices = (db.prepare(
    "SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND status = 'paid'"
  ).get(org_id) as any).c;

  // Receipt financials
  const totalReceipts = (db.prepare(
    "SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND deleted_at IS NULL AND type = 'receipt'"
  ).get(org_id) as any).c;

  const receiptRevenue = (db.prepare(
    "SELECT COALESCE(SUM(total),0) as val FROM invoices WHERE org_id = ? AND deleted_at IS NULL AND type = 'receipt'"
  ).get(org_id) as any).val;

  // Quote stats
  const totalQuotes = (db.prepare(
    "SELECT COUNT(*) as c FROM quotes WHERE org_id = ? AND deleted_at IS NULL"
  ).get(org_id) as any).c;

  const acceptedQuotes = (db.prepare(
    "SELECT COUNT(*) as c FROM quotes WHERE org_id = ? AND deleted_at IS NULL AND status IN ('accepted','invoiced')"
  ).get(org_id) as any).c;

  const declinedQuotes = (db.prepare(
    "SELECT COUNT(*) as c FROM quotes WHERE org_id = ? AND deleted_at IS NULL AND status = 'declined'"
  ).get(org_id) as any).c;

  const pendingQuotes = (db.prepare(
    "SELECT COUNT(*) as c FROM quotes WHERE org_id = ? AND deleted_at IS NULL AND status IN ('draft','sent')"
  ).get(org_id) as any).c;

  // Revenue chart - cash actually collected (amount_paid) dated by when it
  // was paid, next to what was billed that period. The old chart only counted
  // fully-paid invoices by issue date, so it could sit empty while the
  // "Collected" card showed money (partial payments never appeared).
  // No payments table exists, so a partial payment (which has no paid_date)
  // falls back to the invoice's issue date.
  const periodExpr = (col: string) =>
    granularity === 'daily' ? `date(${col})`
    : granularity === 'yearly' ? `strftime('%Y', ${col})`
    : `strftime('%Y-%m', ${col})`;
  const dailyCut = (col: string) => (granularity === 'daily' ? ` AND date(${col}) >= date('now', '-90 days')` : '');
  const collectedCol = 'COALESCE(paid_date, issue_date)';

  const collectedRows = db.prepare(`
    SELECT ${periodExpr(collectedCol)} as period, COALESCE(SUM(amount_paid),0) as revenue, COUNT(*) as count
    FROM invoices
    WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND amount_paid > 0${dailyCut(collectedCol)}
    GROUP BY period
  `).all(org_id) as any[];
  const invoicedRows = db.prepare(`
    SELECT ${periodExpr('issue_date')} as period, COALESCE(SUM(total),0) as invoiced
    FROM invoices
    WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND status NOT IN ('draft','cancelled')${dailyCut('issue_date')}
    GROUP BY period
  `).all(org_id) as any[];

  const chartMap = new Map<string, { period: string; revenue: number; invoiced: number; count: number }>();
  for (const r of collectedRows) {
    if (!r.period) continue;
    chartMap.set(r.period, { period: r.period, revenue: r.revenue, invoiced: 0, count: r.count });
  }
  for (const r of invoicedRows) {
    if (!r.period) continue;
    const cur = chartMap.get(r.period) || { period: r.period, revenue: 0, invoiced: 0, count: 0 };
    cur.invoiced = r.invoiced;
    chartMap.set(r.period, cur);
  }
  const chartData = [...chartMap.values()].sort((x, y) => x.period.localeCompare(y.period));

  // This month vs last month, for the headline comparison cards
  const monthTotals = (month: string) => {
    const collected = (db.prepare(`
      SELECT COALESCE(SUM(amount_paid),0) as v FROM invoices
      WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND amount_paid > 0
        AND strftime('%Y-%m', ${collectedCol}) = ?
    `).get(org_id, month) as any).v;
    const invoiced = (db.prepare(`
      SELECT COALESCE(SUM(total),0) as v FROM invoices
      WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND status NOT IN ('draft','cancelled')
        AND strftime('%Y-%m', issue_date) = ?
    `).get(org_id, month) as any).v;
    return { collected, invoiced };
  };
  const thisMonthKey = (db.prepare("SELECT strftime('%Y-%m','now') as k").get() as any).k;
  const lastMonthKey = (db.prepare("SELECT strftime('%Y-%m','now','start of month','-1 month') as k").get() as any).k;
  const comparison = { thisMonth: monthTotals(thisMonthKey), lastMonth: monthTotals(lastMonthKey) };

  // Where the invoices stand right now
  const statusBreakdown = db.prepare(`
    SELECT status, COUNT(*) as count, COALESCE(SUM(total),0) as amount
    FROM invoices
    WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice'
    GROUP BY status
  `).all(org_id);

  // Receivables aging: unpaid balance by how far past due it is
  const agingRows = db.prepare(`
    SELECT CASE
             WHEN due_date IS NULL OR date(due_date) >= date('now') THEN 'current'
             WHEN julianday(date('now')) - julianday(date(due_date)) <= 30 THEN 'd1_30'
             WHEN julianday(date('now')) - julianday(date(due_date)) <= 60 THEN 'd31_60'
             WHEN julianday(date('now')) - julianday(date(due_date)) <= 90 THEN 'd61_90'
             ELSE 'd90_plus'
           END as bucket,
           COUNT(*) as count,
           COALESCE(SUM(total - amount_paid),0) as balance
    FROM invoices
    WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice'
      AND status IN ('sent','overdue') AND total - amount_paid > 0
    GROUP BY bucket
  `).all(org_id) as any[];
  const aging = ['current', 'd1_30', 'd31_60', 'd61_90', 'd90_plus'].map(bucket => {
    const r = agingRows.find(x => x.bucket === bucket);
    return { bucket, count: r?.count || 0, balance: r?.balance || 0 };
  });

  // How customers actually pay
  const payRow = db.prepare(`
    SELECT AVG(julianday(date(paid_date)) - julianday(date(issue_date))) as avgDays,
           SUM(CASE WHEN due_date IS NOT NULL AND date(paid_date) <= date(due_date) THEN 1 ELSE 0 END) as onTime,
           SUM(CASE WHEN due_date IS NOT NULL THEN 1 ELSE 0 END) as withDue,
           COUNT(*) as paidCount
    FROM invoices
    WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND status = 'paid' AND paid_date IS NOT NULL
  `).get(org_id) as any;
  const paymentStats = {
    paidCount: payRow?.paidCount || 0,
    avgDaysToPay: payRow?.avgDays == null ? null : Math.max(0, Math.round(payRow.avgDays * 10) / 10),
    onTimeRate: payRow?.withDue ? Math.round((payRow.onTime / payRow.withDue) * 100) : null,
  };

  // Top clients - what they've paid plus what they still owe
  const topClients = db.prepare(`
    SELECT client_name, COALESCE(client_company,'') as company,
           COALESCE(SUM(amount_paid),0) as total_revenue,
           COALESCE(SUM(CASE WHEN status IN ('sent','overdue') THEN total - amount_paid ELSE 0 END),0) as outstanding,
           COUNT(*) as invoice_count
    FROM invoices
    WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND client_name IS NOT NULL AND client_name != ''
    GROUP BY client_name ORDER BY total_revenue DESC, outstanding DESC LIMIT 5
  `).all(org_id);

  // Overdue invoices list
  const overdueList = db.prepare(`
    SELECT id, number, client_name, total, amount_paid, due_date, status
    FROM invoices
    WHERE org_id = ? AND deleted_at IS NULL AND type = 'invoice' AND status = 'overdue'
    ORDER BY due_date ASC LIMIT 10
  `).all(org_id);

  const totalClients = (db.prepare(
    'SELECT COUNT(*) as c FROM clients WHERE org_id = ? AND deleted_at IS NULL'
  ).get(org_id) as any).c;

  // Recent activity (all doc types)
  const recent = db.prepare(`
    SELECT id, type, number, client_name, total, amount_paid, status, issue_date
    FROM invoices WHERE org_id = ? AND deleted_at IS NULL
    UNION ALL
    SELECT id, 'quote' as type, number, client_name, total, 0 as amount_paid, status, issue_date
    FROM quotes WHERE org_id = ? AND deleted_at IS NULL
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
    comparison,
    statusBreakdown,
    aging,
    paymentStats,
    topClients,
    overdueList,
    recent,
  });
});

export default router;
