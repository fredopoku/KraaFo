import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

// Look up an org by business email — returns the org if found
router.post('/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const org = db.prepare('SELECT * FROM organizations WHERE LOWER(email) = LOWER(?) LIMIT 1').get(email.trim()) as any;
  if (!org) {
    return res.status(404).json({ error: 'No account found with that email address.' });
  }

  res.json(org);
});

export default router;
