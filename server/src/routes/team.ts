import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/schema';
import { canManageTeam } from '../middleware/auth';
import { sendTeamInvite } from '../services/emailService';

const router = Router();

// All team routes require auth — provided by global requireAuth middleware.
// Additionally, most mutating routes require owner/admin role.

router.get('/', (req: Request, res: Response) => {
  const auth = req.auth!;
  if (!canManageTeam(auth.role)) return res.status(403).json({ error: 'Only owner or admin can view team members' });

  const members = db.prepare(
    'SELECT id, name, email, role, invite_accepted, created_at, updated_at FROM team_members WHERE org_id = ? ORDER BY created_at ASC'
  ).all(auth.orgId);

  res.json(members);
});

router.post('/invite', async (req: Request, res: Response) => {
  const auth = req.auth!;
  if (!canManageTeam(auth.role)) return res.status(403).json({ error: 'Only owner or admin can invite members' });
  if (auth.role === 'admin') {
    const { role: targetRole } = req.body;
    if (targetRole === 'owner' || targetRole === 'admin') {
      return res.status(403).json({ error: 'Admins can only invite staff or accountants' });
    }
  }

  const { email, role, name } = req.body;
  if (!email || !role) return res.status(400).json({ error: 'Email and role required' });
  const allowed = ['admin', 'staff', 'accountant'];
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const existing = db.prepare('SELECT id FROM team_members WHERE LOWER(email) = LOWER(?) AND org_id = ?').get(email.trim(), auth.orgId);
  if (existing) return res.status(409).json({ error: 'This email has already been invited to your team' });

  // Also prevent inviting the org owner email
  const org = db.prepare('SELECT email FROM organizations WHERE id = ?').get(auth.orgId) as any;
  if (org && org.email.toLowerCase() === email.trim().toLowerCase()) {
    return res.status(409).json({ error: 'This email is already the account owner' });
  }

  const inviteToken = uuid();
  const memberId = uuid();

  db.prepare(
    'INSERT INTO team_members (id, org_id, name, email, role, invite_token, invite_accepted) VALUES (?, ?, ?, ?, ?, ?, 0)'
  ).run(memberId, auth.orgId, name || null, email.trim().toLowerCase(), role, inviteToken);

  const member = db.prepare('SELECT * FROM team_members WHERE id = ?').get(memberId) as any;
  sendTeamInvite(member, org, inviteToken).catch(console.error);

  res.json({ id: memberId, email: member.email, role, invite_accepted: 0 });
});

router.patch('/:memberId/role', (req: Request, res: Response) => {
  const auth = req.auth!;
  if (auth.role !== 'owner') return res.status(403).json({ error: 'Only the owner can change roles' });

  const { role } = req.body;
  const allowed = ['admin', 'staff', 'accountant'];
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const member = db.prepare('SELECT * FROM team_members WHERE id = ? AND org_id = ?').get(req.params.memberId, auth.orgId) as any;
  if (!member) return res.status(404).json({ error: 'Team member not found' });

  db.prepare("UPDATE team_members SET role = ?, updated_at = datetime('now') WHERE id = ?").run(role, member.id);
  res.json({ success: true });
});

router.delete('/:memberId', (req: Request, res: Response) => {
  const auth = req.auth!;
  if (!canManageTeam(auth.role)) return res.status(403).json({ error: 'Only owner or admin can remove members' });

  const member = db.prepare('SELECT * FROM team_members WHERE id = ? AND org_id = ?').get(req.params.memberId, auth.orgId) as any;
  if (!member) return res.status(404).json({ error: 'Team member not found' });
  if (auth.role === 'admin' && (member.role === 'admin' || member.role === 'owner')) {
    return res.status(403).json({ error: 'Admins cannot remove other admins' });
  }

  db.prepare('DELETE FROM team_members WHERE id = ?').run(member.id);
  res.json({ success: true });
});

router.post('/:memberId/resend', async (req: Request, res: Response) => {
  const auth = req.auth!;
  if (!canManageTeam(auth.role)) return res.status(403).json({ error: 'Permission denied' });

  const member = db.prepare('SELECT * FROM team_members WHERE id = ? AND org_id = ? AND invite_accepted = 0').get(req.params.memberId, auth.orgId) as any;
  if (!member) return res.status(404).json({ error: 'Pending invite not found' });

  const newToken = uuid();
  db.prepare("UPDATE team_members SET invite_token = ?, updated_at = datetime('now') WHERE id = ?").run(newToken, member.id);
  const org = db.prepare('SELECT email FROM organizations WHERE id = ?').get(auth.orgId) as any;
  sendTeamInvite({ ...member, invite_token: newToken }, org, newToken).catch(console.error);

  res.json({ success: true });
});

export default router;
