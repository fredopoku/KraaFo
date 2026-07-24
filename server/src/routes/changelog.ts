import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

const VALID_TAGS = ['New', 'Improved', 'Fixed'];

router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM changelog ORDER BY published_at DESC').all();
  res.json({ entries: rows });
});

router.post('/', adminAuth, (req: Request, res: Response) => {
  const { title, description, tag } = req.body;
  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  const safeTag = VALID_TAGS.includes(tag) ? tag : 'New';
  const id = uuidv4();
  db.prepare('INSERT INTO changelog (id, title, description, tag) VALUES (?, ?, ?, ?)')
    .run(id, title.trim(), description.trim(), safeTag);
  const entry = db.prepare('SELECT * FROM changelog WHERE id = ?').get(id);
  res.json({ success: true, entry });
});

router.delete('/:id', adminAuth, (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM changelog WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Entry not found' });
  res.json({ success: true });
});

export default router;
