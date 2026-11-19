import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db/schema';
import { logEvent } from '../services/activityLog';
import { signToken, UserRole, checkSession, bumpSessionVersion } from '../middleware/auth';
import { sendPasswordReset, sendOrgWelcome, sendAdminSignupAlert } from '../services/emailService';
import { issueEmailCode, checkEmailCode, publicOrg, MAX_ATTEMPTS } from '../services/emailCode';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  // Check org owner first
  const org = db.prepare('SELECT * FROM organizations WHERE LOWER(email) = LOWER(?) LIMIT 1').get(email.trim()) as any;
  if (org) {
    if (!org.password_hash) {
      return res.status(401).json({ error: 'Incorrect email or password. If you haven\'t set a password yet, use "Forgot password".' });
    }
    const valid = await bcrypt.compare(password, org.password_hash);
    if (!valid) {
      logEvent({ req, orgId: org.id, actorEmail: email.trim(), type: 'auth.login_failed', ok: false, meta: { reason: 'bad_password' } });
      return res.status(401).json({ error: 'Incorrect email or password. If you haven\'t set a password yet, use "Forgot password".' });
    }

    db.prepare(`UPDATE organizations SET total_logins = COALESCE(total_logins, 0) + 1 WHERE id = ?`).run(org.id);
    logEvent({ req, orgId: org.id, actorId: org.id, actorEmail: org.email, actorRole: 'owner', type: 'auth.login' });
    const token = signToken({ orgId: org.id, userId: org.id, role: 'owner', email: org.email });
    return res.json({ org: publicOrg(org), token, role: 'owner' });
  }

  // Check team members
  const member = db.prepare('SELECT * FROM team_members WHERE LOWER(email) = LOWER(?) AND invite_accepted = 1 LIMIT 1').get(email.trim()) as any;
  if (!member) {
    logEvent({ req, orgId: null, actorEmail: email.trim(), type: 'auth.login_failed', ok: false, meta: { reason: 'no_account' } });
    return res.status(401).json({ error: 'Incorrect email or password. If you haven\'t set a password yet, use "Forgot password".' });
  }
  if (!member.password_hash) return res.status(401).json({ error: 'Incorrect email or password. If you haven\'t set a password yet, use "Forgot password".' });

  const valid = await bcrypt.compare(password, member.password_hash);
  if (!valid) {
    logEvent({ req, orgId: member.org_id, actorId: member.id, actorEmail: member.email, actorRole: member.role, type: 'auth.login_failed', ok: false, meta: { reason: 'bad_password' } });
    return res.status(401).json({ error: 'Incorrect email or password. If you haven\'t set a password yet, use "Forgot password".' });
  }

  const parentOrg = db.prepare('SELECT * FROM organizations WHERE id = ?').get(member.org_id) as any;
  if (!parentOrg) return res.status(401).json({ error: 'Organisation not found' });

  const token = signToken({ orgId: member.org_id, userId: member.id, role: member.role as UserRole, email: member.email });
  const safeOrg = publicOrg(parentOrg);
  logEvent({ req, orgId: member.org_id, actorId: member.id, actorEmail: member.email, actorRole: member.role, type: 'auth.login' });
  res.json({ org: safeOrg, token, role: member.role, memberName: member.name });
});

// First-time password set (during setup - org has no password yet)
router.post('/set-password', async (req: Request, res: Response) => {
  const { orgId, password } = req.body;
  if (!orgId || !password) return res.status(400).json({ error: 'orgId and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId) as any;
  if (!org) return res.status(404).json({ error: 'Account not found' });
  if (org.password_hash) return res.status(409).json({ error: 'Password already set. Use forgot password to reset it.' });

  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE organizations SET password_hash = ? WHERE id = ?').run(hash, orgId);

  const token = signToken({ orgId: org.id, userId: org.id, role: 'owner', email: org.email });
  const safeOrg = publicOrg(org);
  logEvent({ req, orgId: org.id, actorId: org.id, actorEmail: org.email, actorRole: 'owner', type: 'auth.password_set' });
  res.json({ org: safeOrg, token, role: 'owner' });
});

// Step 1: request a reset code (sends 6-digit code to email)
router.post('/forgot', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const org = db.prepare('SELECT * FROM organizations WHERE LOWER(email) = LOWER(?) LIMIT 1').get(email.trim()) as any;
  // Always return success - don't reveal whether account exists
  if (!org) {
    logEvent({ req, orgId: null, actorEmail: email.trim(), type: 'auth.password_reset_requested', ok: false, meta: { reason: 'no_account' } });
    return res.json({ sent: true });
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const hash = await bcrypt.hash(code, 10);
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.prepare('UPDATE organizations SET reset_token = ?, reset_token_expires = ?, reset_attempts = 0 WHERE id = ?').run(hash, expires, org.id);

  await sendPasswordReset(org, code).catch(() => {}); // fire-and-forget; don't expose send errors
  logEvent({ req, orgId: org.id, actorEmail: org.email, type: 'auth.password_reset_requested' });
  res.json({ sent: true });
});

// Step 2: verify code + set new password
router.post('/reset', async (req: Request, res: Response) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password) return res.status(400).json({ error: 'Email, code and new password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const org = db.prepare('SELECT * FROM organizations WHERE LOWER(email) = LOWER(?) LIMIT 1').get(email.trim()) as any;
  if (!org || !org.reset_token || !org.reset_token_expires) {
    return res.status(400).json({ error: 'Reset code is invalid or has expired. Please request a new one.' });
  }

  if (new Date(org.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
  }

  if ((org.reset_attempts || 0) >= MAX_ATTEMPTS) {
    return res.status(400).json({ error: 'Too many wrong attempts. Please request a new reset code.' });
  }
  const codeValid = await bcrypt.compare(String(code).trim(), org.reset_token);
  if (!codeValid) {
    db.prepare('UPDATE organizations SET reset_attempts = COALESCE(reset_attempts, 0) + 1 WHERE id = ?').run(org.id);
    logEvent({ req, orgId: org.id, actorEmail: org.email, type: 'auth.password_reset_failed', ok: false, meta: { reason: 'bad_code' } });
    return res.status(400).json({ error: 'Incorrect reset code. Please check your email.' });
  }

  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE organizations SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, reset_attempts = 0 WHERE id = ?').run(hash, org.id);
  // The reset code went to the account email, so this also proves the inbox.
  db.prepare(`UPDATE organizations SET verification_status = 'verified', email_verified_at = datetime('now'),
    automation_grace_until = NULL, email_code_hash = NULL, email_code_expires = NULL
    WHERE id = ? AND verification_status = 'pending_verification'`).run(org.id);

  // A password reset ends every other session - whoever knew the old
  // password (or held an old token) is signed out.
  bumpSessionVersion(org.id, org.id);
  const token = signToken({ orgId: org.id, userId: org.id, role: 'owner', email: org.email });
  const safeOrg = publicOrg(db.prepare('SELECT * FROM organizations WHERE id = ?').get(org.id));
  logEvent({ req, orgId: org.id, actorId: org.id, actorEmail: org.email, actorRole: 'owner', type: 'auth.password_reset' });
  res.json({ org: safeOrg, token, role: 'owner' });
});

// Validate an invite token - returns org name and invitee email (public)
router.get('/join/:token', (req: Request, res: Response) => {
  const member = db.prepare('SELECT tm.*, o.name as org_name FROM team_members tm JOIN organizations o ON o.id = tm.org_id WHERE tm.invite_token = ? AND tm.invite_accepted = 0').get(req.params.token) as any;
  if (!member) return res.status(404).json({ error: 'Invite link is invalid or has already been used.' });
  res.json({ email: member.email, orgName: member.org_name, role: member.role });
});

// Accept an invite - set name + password, return token (public)
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
  const safeOrg = publicOrg(org);
  logEvent({ req, orgId: member.org_id, actorId: member.id, actorEmail: member.email, actorRole: member.role, type: 'team.join' });
  res.json({ org: safeOrg, token, role: member.role });
});

// Hit by the EmailVerify page (client/src/pages/EmailVerify.tsx) after the
// user clicks the link in their verification email - the frontend page reads
// ?token= and calls this as a normal JSON request rather than following a
// server-side redirect, so it can show a proper loading/success/error state.
// Looks up the org by hashed token so a DB leak alone can't be replayed as a
// live link (public - the user isn't necessarily logged in on this device).
router.get('/verify-email', (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token) return res.status(400).json({ success: false, error: 'Token required' });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const org = db.prepare('SELECT * FROM organizations WHERE email_verify_token_hash = ?').get(tokenHash) as any;

  if (!org || !org.email_verify_expires || new Date(org.email_verify_expires) < new Date()) {
    logEvent({ req, orgId: org?.id ?? null, actorEmail: org?.email ?? null, type: 'auth.email_verify_failed', ok: false });
    return res.status(400).json({ success: false, error: 'This verification link is invalid or has expired.' });
  }

  // Verifying the email confirms ownership, but a high-risk signup still
  // needs a human to clear it - only promote pending_verification accounts.
  db.prepare(`
    UPDATE organizations
    SET verification_status = CASE WHEN verification_status = 'pending_verification' THEN 'verified' ELSE verification_status END,
        email_verified_at = datetime('now'), automation_grace_until = NULL,
        email_verify_token_hash = NULL, email_verify_expires = NULL
    WHERE id = ?
  `).run(org.id);

  logEvent({ req, orgId: org.id, actorId: org.id, actorEmail: org.email, actorRole: 'owner', type: 'auth.email_verified', meta: { held: org.verification_status === 'held_for_review' } });
  res.json({ success: true, held: org.verification_status === 'held_for_review' });
});

// Email code verification for the signed-in account (see
// services/emailCode.ts). These sit under the blanket '/api/auth/' public
// prefix in middleware/auth.ts - which is what lets an unverified account
// reach them at all - so they check the JWT themselves. Only the owner can
// request or enter the code: it goes to the account email, which a team
// member doesn't control. Per-IP limits are in index.ts; per-account
// cooldown, daily cap and attempt cap are in emailCode.ts.
function ownerFromBearer(req: Request, res: Response): any | null {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  const payload = checkSession(token);
  if (!payload) { res.status(401).json({ error: 'Session expired. Please sign in again.' }); return null; }
  if (payload.role !== 'owner') {
    res.status(403).json({ error: 'Only the account owner can confirm the account email.', code: 'owner_only' });
    return null;
  }
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(payload.orgId) as any;
  if (!org) { res.status(404).json({ error: 'Account not found' }); return null; }
  return org;
}

async function handleSendCode(req: Request, res: Response) {
  const org = ownerFromBearer(req, res);
  if (!org) return;
  if (org.verification_status === 'verified') return res.json({ sent: false, alreadyVerified: true });

  const result = await issueEmailCode(org.id).catch(err => {
    console.error('send-code failed:', err);
    return null;
  });
  if (!result) return res.status(502).json({ error: "We couldn't send the email just now. Please try again in a minute." });

  if (result.sent) {
    logEvent({ req, orgId: org.id, actorId: org.id, actorEmail: org.email, actorRole: 'owner', type: 'auth.email_code_sent', meta: { reason: org.verify_reason } });
    return res.json({ sent: true, cooldownSeconds: result.cooldownSeconds, email: org.email });
  }
  if (result.reason === 'already_verified') return res.json({ sent: false, alreadyVerified: true });
  if (result.reason === 'cooldown') return res.json({ sent: false, cooldownSeconds: result.cooldownSeconds, email: org.email });
  logEvent({ req, orgId: org.id, actorId: org.id, actorEmail: org.email, actorRole: 'owner', type: 'auth.email_code_limited', ok: false });
  return res.status(429).json({ error: "You've requested too many codes today. Please try again tomorrow or contact support.", code: 'daily_limit' });
}

router.post('/send-code', handleSendCode);
// Older clients (Dashboard's resend button) still call this name.
router.post('/resend-verification', handleSendCode);

router.post('/verify-code', async (req: Request, res: Response) => {
  const org = ownerFromBearer(req, res);
  if (!org) return;
  if (org.verification_status === 'verified') return res.json({ success: true, held: false });

  const result = checkEmailCode(org.id, req.body?.code);
  if (!result.ok) {
    logEvent({ req, orgId: org.id, actorId: org.id, actorEmail: org.email, actorRole: 'owner', type: 'auth.email_verify_failed', ok: false, meta: { reason: result.code } });
    return res.status(400).json({ error: result.error, code: result.code });
  }

  logEvent({ req, orgId: org.id, actorId: org.id, actorEmail: org.email, actorRole: 'owner', type: 'auth.email_verified', meta: { held: result.held, reason: result.reason } });

  // Welcome mail and the admin signup alert wait until a new signup has
  // proved its inbox, so bot signups that never verify cost one email.
  if (result.reason === 'signup' && !org.welcome_email_sent) {
    const fresh = db.prepare('SELECT * FROM organizations WHERE id = ?').get(org.id) as any;
    sendOrgWelcome(fresh).catch(console.error);
    sendAdminSignupAlert(fresh).catch(console.error);
  }

  const updated = db.prepare('SELECT * FROM organizations WHERE id = ?').get(org.id) as any;
  res.json({ success: true, held: result.held, org: publicOrg(updated) });
});

// Signs this login out on every device, including this one, by bumping its
// session version (middleware/auth.ts). Works for owners and team members;
// each signs out only their own login.
router.post('/logout-all', (req: Request, res: Response) => {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? checkSession(token) : null;
  if (!payload) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  bumpSessionVersion(payload.orgId, payload.userId);
  logEvent({ req, orgId: payload.orgId, actorId: payload.userId, actorEmail: payload.email, actorRole: payload.role, type: 'auth.logout_all' });
  res.json({ success: true });
});

export default router;
