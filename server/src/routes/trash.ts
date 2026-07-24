import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

// GET /api/trash - all deleted items for the org
router.get('/', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const invoices = db.prepare(
    "SELECT * FROM invoices WHERE org_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC"
  ).all(orgId);
  const quotes = db.prepare(
    "SELECT * FROM quotes WHERE org_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC"
  ).all(orgId);
  const clients = db.prepare(
    "SELECT * FROM clients WHERE org_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC"
  ).all(orgId);
  res.json({ invoices, quotes, clients });
});

// GET /api/trash/count - badge count
router.get('/count', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const inv = (db.prepare('SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND deleted_at IS NOT NULL').get(orgId) as any).c;
  const qts = (db.prepare('SELECT COUNT(*) as c FROM quotes WHERE org_id = ? AND deleted_at IS NOT NULL').get(orgId) as any).c;
  const cls = (db.prepare('SELECT COUNT(*) as c FROM clients WHERE org_id = ? AND deleted_at IS NOT NULL').get(orgId) as any).c;
  res.json({ count: inv + qts + cls });
});

// POST /api/trash/invoices/:id/restore
router.post('/invoices/:id/restore', (req: Request, res: Response) => {
  const r = db.prepare(
    "UPDATE invoices SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND org_id = ? AND deleted_at IS NOT NULL"
  ).run(req.params.id, req.auth!.orgId);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found in trash' });
  res.json({ success: true });
});

// POST /api/trash/quotes/:id/restore
router.post('/quotes/:id/restore', (req: Request, res: Response) => {
  const r = db.prepare(
    "UPDATE quotes SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND org_id = ? AND deleted_at IS NOT NULL"
  ).run(req.params.id, req.auth!.orgId);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found in trash' });
  res.json({ success: true });
});

// POST /api/trash/clients/:id/restore
router.post('/clients/:id/restore', (req: Request, res: Response) => {
  const r = db.prepare(
    "UPDATE clients SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND org_id = ? AND deleted_at IS NOT NULL"
  ).run(req.params.id, req.auth!.orgId);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found in trash' });
  res.json({ success: true });
});

// DELETE /api/trash/invoices/:id - permanent delete
router.delete('/invoices/:id', (req: Request, res: Response) => {
  const existing = db.prepare(
    'SELECT id FROM invoices WHERE id = ? AND org_id = ? AND deleted_at IS NOT NULL'
  ).get(req.params.id, req.auth!.orgId);
  if (!existing) return res.status(404).json({ error: 'Not found in trash' });
  // invoice_items cascade via FK
  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// DELETE /api/trash/quotes/:id - permanent delete
router.delete('/quotes/:id', (req: Request, res: Response) => {
  const existing = db.prepare(
    'SELECT id FROM quotes WHERE id = ? AND org_id = ? AND deleted_at IS NOT NULL'
  ).get(req.params.id, req.auth!.orgId);
  if (!existing) return res.status(404).json({ error: 'Not found in trash' });
  // quote_items cascade via FK
  db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// DELETE /api/trash/clients/:id - permanent delete
router.delete('/clients/:id', (req: Request, res: Response) => {
  const existing = db.prepare(
    'SELECT id FROM clients WHERE id = ? AND org_id = ? AND deleted_at IS NOT NULL'
  ).get(req.params.id, req.auth!.orgId);
  if (!existing) return res.status(404).json({ error: 'Not found in trash' });
  db.prepare('UPDATE invoices SET client_id = NULL WHERE client_id = ?').run(req.params.id);
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
