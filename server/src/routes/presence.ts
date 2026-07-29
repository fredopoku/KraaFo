import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

// POST /api/presence/heartbeat — authenticated users call this every 30s
router.post('/heartbeat', (req: Request, res: Response) => {
  const orgId = (req as any).orgId;
  if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

  const page = typeof req.body.page === 'string' ? req.body.page.slice(0, 100) : '/dashboard';

  db.prepare(`
    UPDATE organizations
    SET last_seen = datetime('now'), current_page = ?
    WHERE id = ?
  `).run(page, orgId);

  res.json({ ok: true });
});

export default router;
