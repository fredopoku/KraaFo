import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/schema';
import { signToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const org = db.prepare('SELECT * FROM organizations WHERE LOWER(email) = LOWER(?) LIMIT 1').get(email.trim()) as any;
  if (!org) return res.status(401).json({ error: 'No account found with that email address' });

  // Legacy accounts (no password set) — block and guide them to set one
  if (!org.password_hash) {
    return res.status(401).json({ error: 'This account was created before passwords were required. Please use "Forgot password" to set one, or contact support.' });
  }

  const valid = await bcrypt.compare(password, org.password_hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password' });

  const token = signToken({ orgId: org.id, email: org.email });
  const { password_hash: _, ...safeOrg } = org;
  res.json({ org: safeOrg, token });
});

// Called after org is created in Setup — sets the password and returns a token
router.post('/set-password', async (req: Request, res: Response) => {
  const { orgId, password } = req.body;
  if (!orgId || !password) return res.status(400).json({ error: 'orgId and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId) as any;
  if (!org) return res.status(404).json({ error: 'Account not found' });

  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE organizations SET password_hash = ? WHERE id = ?').run(hash, orgId);

  const token = signToken({ orgId: org.id, email: org.email });
  const { password_hash: _, ...safeOrg } = { ...org, password_hash: hash };
  res.json({ org: safeOrg, token });
});

// Set/reset password for accounts without one (legacy recovery)
router.post('/reset', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const org = db.prepare('SELECT * FROM organizations WHERE LOWER(email) = LOWER(?) LIMIT 1').get(email.trim()) as any;
  if (!org) return res.status(404).json({ error: 'No account found with that email' });

  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE organizations SET password_hash = ? WHERE id = ?').run(hash, org.id);

  const token = signToken({ orgId: org.id, email: org.email });
  const { password_hash: _, ...safeOrg } = { ...org, password_hash: hash };
  res.json({ org: safeOrg, token });
});

export default router;
