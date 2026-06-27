import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/schema';

export const JWT_SECRET = process.env.JWT_SECRET || 'krafo-dev-secret-change-in-prod';
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
];

function isPublic(req: Request): boolean {
  const p = req.path;
  if (PUBLIC_PREFIXES.some(prefix => p.startsWith(prefix))) return true;
  if (req.method === 'GET' && /^\/api\/invoices\/[^/]+\/public$/.test(p)) return true;
  if (req.method === 'POST' && p === '/api/feedback') return true;
  if (p.startsWith('/api/admin') || p.startsWith('/api/broadcasts')) return true;
  return false;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (isPublic(req)) { next(); return; }

  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.auth = payload;
    db.prepare("UPDATE organizations SET last_active_at = datetime('now') WHERE id = ?").run(payload.orgId);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired — please sign in again' });
  }
}
