import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Constant-time check of the admin secret. Both sides are hashed first so
// the comparison takes the same time whatever the length or content of the
// guess - a plain === can leak how many leading characters matched.
export function isAdminToken(provided: unknown): boolean {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || typeof provided !== 'string' || !provided) return false;
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(adminToken).digest();
  return crypto.timingSafeEqual(a, b);
}

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  if (!process.env.ADMIN_TOKEN) {
    return res.status(503).json({ error: 'Admin access not configured on this server' });
  }
  if (!isAdminToken(req.headers['x-admin-token'])) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
