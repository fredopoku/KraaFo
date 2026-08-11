import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/schema';

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
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
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
  if (PUBLIC_PREFIXES.some(prefix => p.startsWith(prefix))) return true;
  if (req.method === 'GET' && /^\/api\/invoices\/[^/]+\/public$/.test(p)) return true;
  if (req.method === 'POST' && p === '/api/feedback') return true;
  if (req.method === 'POST' && p === '/api/organizations') return true; // initial signup - no token yet
  if (req.method === 'POST' && p === '/api/upload/logo') return true; // logo uploaded before auth exists
  if (p.startsWith('/api/admin') || p.startsWith('/api/broadcasts')) return true;
  return false;
}

// Routes gated behind email verification / risk review. Everything else
// (org settings, presence, analytics reads, etc.) stays reachable so an
// unverified user isn't locked out of the app entirely - just out of
// creating/sending real documents and managing a team, which is where
// bulk-signup abuse actually does damage.
const CORE_FEATURE_PREFIXES = ['/api/invoices', '/api/quotes', '/api/clients', '/api/deliver', '/api/ai', '/api/team'];

function isCoreFeatureRequest(req: Request): boolean {
  return CORE_FEATURE_PREFIXES.some(prefix => req.path.startsWith(prefix));
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (isPublic(req)) { next(); return; }

  // Valid admin token gets full access to all endpoints
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken && req.headers['x-admin-token'] === adminToken) { next(); return; }

  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.auth = payload;

    const org = db.prepare('SELECT verification_status FROM organizations WHERE id = ?').get(payload.orgId) as { verification_status?: string } | undefined;
    // Column default is 'verified' (see schema.ts's addCol comment) so
    // existing accounts get that value automatically; the fallback here is
    // just defense in depth (e.g. the org row somehow not being found).
    const status = org?.verification_status || 'verified';

    // Any status other than these two is a full hold (held_for_review,
    // or rejected after manual review) - block core features entirely
    // rather than enumerating every non-good status by name.
    const isFullyHeld = status !== 'verified' && status !== 'pending_verification';
    if (isFullyHeld && isCoreFeatureRequest(req)) {
      res.status(403).json({ error: "This account is under review before it can be used. We'll email you once it's cleared.", code: 'account_held' });
      return;
    }
    if (status === 'pending_verification' && req.method !== 'GET' && isCoreFeatureRequest(req)) {
      res.status(403).json({ error: 'Please verify your email address to unlock this feature. Check your inbox for the verification link.', code: 'verification_required' });
      return;
    }

    db.prepare("UPDATE organizations SET last_active_at = datetime('now') WHERE id = ?").run(payload.orgId);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}
