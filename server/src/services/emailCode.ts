import crypto from 'crypto';
import db from '../db/schema';
import { JWT_SECRET } from '../middleware/auth';
import { sendVerificationCodeEmail } from './emailService';

// One-time email codes that prove a person controls their account's inbox.
// Every account goes through this: new signups before they can use the app,
// every pre-existing account once (the reverify migration in db/schema.ts),
// and anyone who changes their account email.
//
// The code itself is never stored - only an HMAC keyed with the server
// secret. A plain sha256 of a 6-digit code could be reversed in
// milliseconds by trying all million values, so a leaked row (or a field
// accidentally left in an API response) would hand the code out.

export const CODE_TTL_MS = 10 * 60 * 1000;     // NIST 800-63B ceiling for OOB codes
export const MAX_ATTEMPTS = 5;                  // wrong guesses before the code is burned
export const RESEND_COOLDOWN_S = 60;
export const MAX_SENDS_PER_DAY = 5;             // per account, on top of the per-IP limiter

export type VerifyReason = 'signup' | 'reverify' | 'email_change';

function hashCode(orgId: string, code: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(`${orgId}:${code}`).digest('hex');
}

export type IssueResult =
  | { sent: true; cooldownSeconds: number }
  | { sent: false; reason: 'cooldown'; cooldownSeconds: number }
  | { sent: false; reason: 'daily_limit' }
  | { sent: false; reason: 'already_verified' };

export async function issueEmailCode(orgId: string): Promise<IssueResult> {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId) as any;
  if (!org || org.verification_status === 'verified') return { sent: false, reason: 'already_verified' };

  const now = Date.now();
  if (org.email_code_sent_at) {
    const since = (now - new Date(org.email_code_sent_at).getTime()) / 1000;
    if (since < RESEND_COOLDOWN_S) {
      return { sent: false, reason: 'cooldown', cooldownSeconds: Math.ceil(RESEND_COOLDOWN_S - since) };
    }
  }

  // Rolling 24h window, reset once the window has passed.
  const windowStart = org.email_code_window_start ? new Date(org.email_code_window_start).getTime() : 0;
  const inWindow = now - windowStart < 24 * 60 * 60 * 1000;
  const sendsInWindow = inWindow ? (org.email_code_send_count || 0) : 0;
  if (sendsInWindow >= MAX_SENDS_PER_DAY) return { sent: false, reason: 'daily_limit' };

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const nowIso = new Date(now).toISOString();
  // A fresh code replaces the previous one; the attempt counter is per code
  // but the daily send cap keeps "resend to reset attempts" from adding up
  // to more than MAX_SENDS_PER_DAY * MAX_ATTEMPTS guesses a day.
  db.prepare(`
    UPDATE organizations
    SET email_code_hash = ?, email_code_expires = ?, email_code_attempts = 0, email_code_sent_at = ?,
        email_code_send_count = ?, email_code_window_start = ?
    WHERE id = ?
  `).run(hashCode(org.id, code), new Date(now + CODE_TTL_MS).toISOString(), nowIso,
    sendsInWindow + 1, inWindow ? org.email_code_window_start : nowIso, org.id);

  await sendVerificationCodeEmail(org, code, org.verify_reason || 'signup');
  return { sent: true, cooldownSeconds: RESEND_COOLDOWN_S };
}

export type CheckResult =
  | { ok: true; held: boolean; reason: VerifyReason }
  | { ok: false; error: string; code: 'no_code' | 'expired' | 'too_many_attempts' | 'wrong_code' };

export function checkEmailCode(orgId: string, rawCode: string): CheckResult {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId) as any;
  if (!org || !org.email_code_hash || !org.email_code_expires) {
    return { ok: false, code: 'no_code', error: 'No active code. Tap "Send a new code".' };
  }
  if (new Date(org.email_code_expires).getTime() < Date.now()) {
    return { ok: false, code: 'expired', error: 'This code has expired. Tap "Send a new code".' };
  }
  if ((org.email_code_attempts || 0) >= MAX_ATTEMPTS) {
    return { ok: false, code: 'too_many_attempts', error: 'Too many wrong attempts. Tap "Send a new code".' };
  }

  const code = String(rawCode || '').replace(/\D/g, '');
  const expected = Buffer.from(org.email_code_hash, 'hex');
  const actual = Buffer.from(hashCode(org.id, code), 'hex');
  const match = code.length === 6 && expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

  if (!match) {
    const attempts = (org.email_code_attempts || 0) + 1;
    db.prepare('UPDATE organizations SET email_code_attempts = ? WHERE id = ?').run(attempts, org.id);
    const left = MAX_ATTEMPTS - attempts;
    return left > 0
      ? { ok: false, code: 'wrong_code', error: `That code isn't right. ${left} ${left === 1 ? 'try' : 'tries'} left.` }
      : { ok: false, code: 'too_many_attempts', error: 'Too many wrong attempts. Tap "Send a new code".' };
  }

  // Confirming the inbox doesn't clear a manual review - only promote
  // accounts that were simply waiting on this code.
  const held = org.verification_status === 'held_for_review' || org.verification_status === 'rejected';
  db.prepare(`
    UPDATE organizations
    SET verification_status = CASE WHEN verification_status = 'pending_verification' THEN 'verified' ELSE verification_status END,
        email_verified_at = datetime('now'), automation_grace_until = NULL,
        email_code_hash = NULL, email_code_expires = NULL, email_code_attempts = 0,
        email_verify_token_hash = NULL, email_verify_expires = NULL
    WHERE id = ?
  `).run(org.id);

  return { ok: true, held, reason: (org.verify_reason || 'signup') as VerifyReason };
}

// Puts an account back behind the code screen (used when the email changes).
// Held/rejected accounts keep their status - the code alone never clears review.
export function requireReverification(orgId: string, reason: VerifyReason): void {
  db.prepare(`
    UPDATE organizations
    SET verification_status = CASE WHEN verification_status IN ('held_for_review', 'rejected') THEN verification_status ELSE 'pending_verification' END,
        verify_reason = ?, verify_required_since = datetime('now'),
        email_code_hash = NULL, email_code_expires = NULL, email_code_attempts = 0, email_code_sent_at = NULL,
        email_verify_token_hash = NULL, email_verify_expires = NULL
    WHERE id = ?
  `).run(reason, orgId);
}

// Fields that must never leave the server in an org payload.
export const ORG_SECRET_FIELDS = [
  'password_hash', 'smtp_pass', 'dkim_private_key',
  'reset_token', 'reset_token_expires',
  'email_verify_token_hash', 'email_code_hash',
] as const;

export function publicOrg(org: any): any {
  const safe = { ...org };
  ORG_SECRET_FIELDS.forEach(k => delete safe[k]);
  return safe;
}
