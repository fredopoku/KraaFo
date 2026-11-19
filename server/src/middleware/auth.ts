import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/schema';
import { isAdminToken } from './adminAuth';

export const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
  ? (() => { throw new Error('JWT_SECRET environment variable must be set in production'); })()
  : 'krafo-dev-secret-change-in-prod');
export const JWT_EXPIRES = '30d';

export type UserRole = 'owner' | 'admin' | 'staff' | 'accountant';

export interface AuthPayload {
  orgId: string;
  userId: string;      // org.id for owner, team_member.id for members
  role: UserRole;
  email: string;
  tv?: number;         // session version - see checkSession
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

// Each login (owner or team member) has a session version stored with it.
// Tokens carry the version they were issued with; bumping the stored value
// (password reset, "sign out of all devices") makes every older token stop
// working at once, even though JWTs themselves can't be recalled.
function currentSessionVersion(orgId: string, userId: string): number {
  const row = userId === orgId
    ? db.prepare('SELECT token_version FROM organizations WHERE id = ?').get(orgId)
    : db.prepare('SELECT token_version FROM team_members WHERE id = ? AND org_id = ?').get(userId, orgId);
  return (row as { token_version?: number } | undefined)?.token_version || 0;
}

export function signToken(payload: AuthPayload): string {
  const { orgId, userId, role, email } = payload;
  const tv = currentSessionVersion(orgId, userId);
  return jwt.sign({ orgId, userId, role, email, tv }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function bumpSessionVersion(orgId: string, userId: string): void {
  if (userId === orgId) {
    db.prepare('UPDATE organizations SET token_version = COALESCE(token_version, 0) + 1 WHERE id = ?').run(orgId);
  } else {
    db.prepare('UPDATE team_members SET token_version = COALESCE(token_version, 0) + 1 WHERE id = ? AND org_id = ?').run(userId, orgId);
  }
}

// Verifies a bearer token AND that the session behind it is still valid:
// the account exists, a team member is still on the team (removed members
// lose access immediately, not when their token expires), the session
// hasn't been signed out everywhere, and the role is the member's current
// one rather than whatever it was when the token was issued.
export function checkSession(token: string): AuthPayload | null {
  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
  if (!payload?.orgId || !payload.userId) return null;
  if (payload.userId === payload.orgId) {
    const org = db.prepare('SELECT token_version FROM organizations WHERE id = ?').get(payload.orgId) as { token_version?: number } | undefined;
    if (!org || (org.token_version || 0) !== (payload.tv || 0)) return null;
    return { ...payload, role: 'owner' };
  }
  const member = db.prepare('SELECT role, invite_accepted, token_version FROM team_members WHERE id = ? AND org_id = ?')
    .get(payload.userId, payload.orgId) as { role: UserRole; invite_accepted: number; token_version?: number } | undefined;
  if (!member || !member.invite_accepted || (member.token_version || 0) !== (payload.tv || 0)) return null;
  return { ...payload, role: member.role };
}

export function canWrite(role: UserRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'staff';
}

export function canManageTeam(role: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}

const PUBLIC_PREFIXES = [
  '/api/auth/',
  '/api/stats',
  '/api/track',
  '/api/changelog',
  '/api/health',
  '/api/subscribers',
  '/api/feedback/highlights',
  '/api/team/join',
  '/api/pdf/',
];

function isPublic(req: Request): boolean {
  const p = req.path;
  if (!p.startsWith('/api/')) return true; // frontend routes - always pass through
  // Client statements live under /api/pdf/ but contain a business's private
  // records - they need a signed-in, verified account like any other route.
  if (p.startsWith('/api/pdf/statement/')) return false;
  if (PUBLIC_PREFIXES.some(prefix => p.startsWith(prefix))) return true;
  if (req.method === 'GET' && /^\/api\/invoices\/[^/]+\/public$/.test(p)) return true;
  if (req.method === 'POST' && p === '/api/feedback') return true;
  if (req.method === 'POST' && p === '/api/organizations') return true; // initial signup - no token yet
  if (req.method === 'POST' && p === '/api/upload/logo') return true; // logo uploaded before auth exists
  if (p.startsWith('/api/admin') || p.startsWith('/api/broadcasts')) return true;
  return false;
}

// Until an account confirms its email with a code (routes/auth.ts
// send-code/verify-code), or while it's held for review, the only API it can
// reach is reading its own organization - enough for the client to render
// the code screen (pages/VerifyCode.tsx) and nothing else. That covers every
// path that spends Resend credits or AI calls, and also stops changing the
// account email to someone else's address before verifying.
function isAllowedWhileUnverified(req: Request, orgId: string): boolean {
  if (req.method === 'GET' && req.path === `/api/organizations/${orgId}`) return true;
  return req.method === 'POST' && req.path === '/api/presence/heartbeat'; // admin live view only
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (isPublic(req)) { next(); return; }

  // Valid admin token gets full access to all endpoints
  if (isAdminToken(req.headers['x-admin-token'])) { next(); return; }

  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = checkSession(token);
    if (!payload) { res.status(401).json({ error: 'Session expired. Please sign in again.' }); return; }
    req.auth = payload;

    const org = db.prepare('SELECT verification_status FROM organizations WHERE id = ?').get(payload.orgId) as { verification_status?: string } | undefined;
    if (!org) { res.status(401).json({ error: 'Session expired. Please sign in again.' }); return; }
    const status = org.verification_status || 'pending_verification';

    if (status !== 'verified' && !isAllowedWhileUnverified(req, payload.orgId)) {
      if (status === 'pending_verification') {
        res.status(403).json({ error: 'Please confirm your email address to continue. Enter the code we emailed you.', code: 'verification_required' });
      } else {
        // held_for_review, rejected, or anything unexpected
        res.status(403).json({ error: "This account is under review before it can be used. We'll email you once it's cleared.", code: 'account_held' });
      }
      return;
    }

    // Role permissions, as promised on the Team page: Accountant is view
    // only; Staff creates and sends documents; only the owner or an admin
    // changes business settings (bank details, payment numbers, branding).
    // Enforced here so no individual route can forget it.
    const isRead = req.method === 'GET' || req.method === 'HEAD';
    if (!isRead && !canWrite(payload.role) && !(req.method === 'POST' && req.path === '/api/presence/heartbeat')) {
      res.status(403).json({ error: 'Your role is view only. Ask the account owner if you need to make changes.', code: 'read_only' });
      return;
    }
    if (req.method === 'PUT' && req.path.startsWith('/api/organizations/') && !canManageTeam(payload.role)) {
      res.status(403).json({ error: 'Only the account owner or an admin can change business settings.', code: 'settings_owner_admin' });
      return;
    }

    db.prepare("UPDATE organizations SET last_active_at = datetime('now') WHERE id = ?").run(payload.orgId);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}
