import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';
import { sendBroadcast } from '../services/emailService';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

router.post('/', adminAuth, async (req: Request, res: Response) => {
  const { subject, body } = req.body;
  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Subject and body are required' });
  }
  try {
    const result = await sendBroadcast(subject.trim(), body.trim());
    const id = uuidv4();
    db.prepare('INSERT INTO broadcasts (id, subject, body, recipient_count) VALUES (?, ?, ?, ?)')
      .run(id, subject.trim(), body.trim(), result.sent);
    res.json({ success: true, sent: result.sent, failed: result.failed });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Broadcast failed' });
  }
});

router.get('/', adminAuth, (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT id, subject, body, sent_at, recipient_count FROM broadcasts ORDER BY sent_at DESC').all();
  res.json(rows);
});

export default router;
