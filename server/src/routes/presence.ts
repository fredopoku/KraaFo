import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../db/schema';

const router = Router();

router.post('/heartbeat', (req: Request, res: Response) => {
  const orgId = req.auth?.orgId;
  if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

  const page = typeof req.body.page === 'string' ? req.body.page.slice(0, 100) : '/dashboard';

  db.prepare(`UPDATE organizations SET last_seen = datetime('now'), current_page = ? WHERE id = ?`).run(page, orgId);

  // Find active session within last 5 minutes
  const active = db.prepare(`
    SELECT id, pages, duration_seconds FROM org_sessions
    WHERE org_id = ? AND last_seen >= datetime('now', '-5 minutes')
    ORDER BY last_seen DESC LIMIT 1
  `).get(orgId) as any;

  if (active) {
    let pages: string[] = [];
    try { pages = JSON.parse(active.pages || '[]'); } catch {}
    if (!pages.includes(page)) pages.push(page);
    db.prepare(`
      UPDATE org_sessions
      SET last_seen = datetime('now'), pages = ?, duration_seconds = duration_seconds + 30
      WHERE id = ?
    `).run(JSON.stringify(pages), active.id);
  } else {
    db.prepare(`
      INSERT INTO org_sessions (id, org_id, started_at, last_seen, duration_seconds, pages)
      VALUES (?, ?, datetime('now'), datetime('now'), 0, ?)
    `).run(crypto.randomUUID(), orgId, JSON.stringify([page]));
  }

  res.json({ ok: true });
});

export default router;
