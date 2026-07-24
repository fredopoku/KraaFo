import { Request, Response, NextFunction } from 'express';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return res.status(503).json({ error: 'Admin access not configured on this server' });
  }
  const provided = req.headers['x-admin-token'];
  if (!provided || provided !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
