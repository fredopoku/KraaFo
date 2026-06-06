import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { name, email, rating, message } = req.body;
  if (!name || !rating) return res.status(400).json({ error: 'Name and rating are required' });
  const r = Math.round(Number(rating));
  if (r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be 1–5' });
  const id = uuidv4();
  db.prepare('INSERT INTO feedback (id, name, email, rating, message) VALUES (?, ?, ?, ?, ?)')
    .run(id, name.trim(), email?.trim() || null, r, message?.trim() || null);
  res.json({ success: true, id });
});

router.get('/', adminAuth, (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM feedback ORDER BY created_at DESC').all() as any[];
  const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;
  res.json({ feedback: rows, averageRating: Number(avg.toFixed(1)), total: rows.length });
});

export default router;
