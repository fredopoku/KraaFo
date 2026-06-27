import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/schema';
import { signToken, UserRole } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  // Check org owner first
  const org = db.prepare('SELECT * FROM organizations WHERE LOWER(email) = LOWER(?) LIMIT 1').get(email.trim()) as any;
  if (org) {
    if (!org.password_hash) {
      return res.status(401).json({ error: 'This account was created before passwords were required. Use "Forgot password" to set one.' });
    }
    const valid = await bcrypt.compare(password, org.password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });

    const token = signToken({ orgId: org.id, userId: org.id, role: 'owner', email: org.email });
    const { password_hash: _, ...safeOrg } = org;
    return res.json({ org: safeOrg, token, role: 'owner' });
  }

  // Check team members
  const member = db.prepare('SELECT * FROM team_members WHERE LOWER(email) = LOWER(?) AND invite_accepted = 1 LIMIT 1').get(email.trim()) as any;
  if (!member) return res.status(401).json({ error: 'No account found with that email address' });
  if (!member.password_hash) return res.status(401).json({ error: 'Account not fully set up. Check your invite email.' });

  const valid = await bcrypt.compare(password, member.password_hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password' });

  const parentOrg = db.prepare('SELECT * FROM organizations WHERE id = ?').get(member.org_id) as any;
  if (!parentOrg) return res.status(401).json({ error: 'Organisation not found' });

  const token = signToken({ orgId: member.org_id, userId: member.id, role: member.role as UserRole, email: member.email });
  const { password_hash: _p, ...safeOrg } = parentOrg;
  res.json({ org: safeOrg, token, role: member.role, memberName: member.name });
});

router.post('/set-password', async (req: Request, res: Response) => {
  const { orgId, password } = req.body;
  if (!orgId || !password) return res.status(400).json({ error: 'orgId and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId) as any;
  if (!org) return res.status(404).json({ error: 'Account not found' });

  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE organizations SET password_hash = ? WHERE id = ?').run(hash, orgId);

  const token = signToken({ orgId: org.id, userId: org.id, role: 'owner', email: org.email });
  const { password_hash: _, ...safeOrg } = { ...org, password_hash: hash };
  res.json({ org: safeOrg, token, role: 'owner' });
});

router.post('/reset', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const org = db.prepare('SELECT * FROM organizations WHERE LOWER(email) = LOWER(?) LIMIT 1').get(email.trim()) as any;
  if (!org) return res.status(404).json({ error: 'No account found with that email' });

  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE organizations SET password_hash = ? WHERE id = ?').run(hash, org.id);

  const token = signToken({ orgId: org.id, userId: org.id, role: 'owner', email: org.email });
  const { password_hash: _, ...safeOrg } = { ...org, password_hash: hash };
  res.json({ org: safeOrg, token, role: 'owner' });
});

// Validate an invite token — returns org name and invitee email (public)
router.get('/join/:token', (req: Request, res: Response) => {
  const member = db.prepare('SELECT tm.*, o.name as org_name FROM team_members tm JOIN organizations o ON o.id = tm.org_id WHERE tm.invite_token = ? AND tm.invite_accepted = 0').get(req.params.token) as any;
  if (!member) return res.status(404).json({ error: 'Invite link is invalid or has already been used.' });
  res.json({ email: member.email, orgName: member.org_name, role: member.role });
});

// Accept an invite — set name + password, return token (public)
router.post('/join/:token', async (req: Request, res: Response) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Name and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const member = db.prepare('SELECT * FROM team_members WHERE invite_token = ? AND invite_accepted = 0').get(req.params.token) as any;
  if (!member) return res.status(404).json({ error: 'Invite link is invalid or has already been used.' });

  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE team_members SET name = ?, password_hash = ?, invite_accepted = 1, invite_token = NULL, updated_at = datetime(\'now\') WHERE id = ?').run(name, hash, member.id);

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(member.org_id) as any;
  const token = signToken({ orgId: member.org_id, userId: member.id, role: member.role as UserRole, email: member.email });
  const { password_hash: _, ...safeOrg } = org;
  res.json({ org: safeOrg, token, role: member.role });
});

export default router;
