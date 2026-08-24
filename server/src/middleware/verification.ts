import { Request, Response, NextFunction } from 'express';
import db from '../db/schema';

// Gates the actual "send" actions (email delivery, team invites) - the
// operations that use KraaFo's own Resend reputation to contact a real
// third party. Everything else (dashboard, generator, creating invoices/
// quotes/clients) stays open even for pending_verification accounts, so
// the app still feels usable while someone checks their inbox.
export function requireVerified(req: Request, res: Response, next: NextFunction): void {
  const orgId = req.auth?.orgId;
  if (!orgId) { res.status(401).json({ error: 'Authentication required' }); return; }

  const org = db.prepare('SELECT verification_status FROM organizations WHERE id = ?').get(orgId) as
    { verification_status: string } | undefined;

  if (org?.verification_status === 'held_for_review') {
    res.status(403).json({ error: 'Your account is under review before you can send. We\'ll email you once it\'s cleared.' });
    return;
  }
  if (org?.verification_status !== 'verified') {
    res.status(403).json({ error: 'Please verify your email address before sending. Check your inbox for the verification link.' });
    return;
  }
  next();
}
