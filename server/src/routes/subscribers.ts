import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';
import { sendSubscriberWelcome } from '../services/emailService';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const existing = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email.toLowerCase()) as any;
  if (existing) {
    if (!existing.unsubscribed_at) return res.json({ success: true, alreadySubscribed: true });
    db.prepare('UPDATE subscribers SET unsubscribed_at = NULL, name = COALESCE(?, name) WHERE email = ?')
      .run(name?.trim() || null, email.toLowerCase());
    return res.json({ success: true, resubscribed: true });
  }

  const id = uuidv4();
  const token = uuidv4();
  db.prepare('INSERT INTO subscribers (id, email, name, token) VALUES (?, ?, ?, ?)')
    .run(id, email.toLowerCase(), name?.trim() || null, token);

  sendSubscriberWelcome(email, name).catch(console.error);

  res.json({ success: true });
});

router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT id, email, name, subscribed_at FROM subscribers WHERE unsubscribed_at IS NULL ORDER BY subscribed_at DESC").all();
  res.json({ subscribers: rows, total: (rows as any[]).length });
});

router.get('/unsubscribe/:token', (req: Request, res: Response) => {
  const sub = db.prepare('SELECT * FROM subscribers WHERE token = ?').get(req.params.token) as any;
  if (!sub) return res.status(404).json({ error: 'Invalid unsubscribe link' });
  if (sub.unsubscribed_at) return res.json({ success: true, already: true, email: sub.email });
  db.prepare("UPDATE subscribers SET unsubscribed_at = datetime('now') WHERE token = ?").run(req.params.token);
  res.json({ success: true, email: sub.email });
});

export default router;
