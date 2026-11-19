import fs from 'fs';
import path from 'path';
import db from '../db/schema';
import { logEvent } from './activityLog';

const DB_PATH = process.env.DB_PATH || './data/krafo.db';
export const BACKUP_DIR = process.env.BACKUP_DIR || path.join(path.dirname(DB_PATH), 'backups');
const KEEP_DAILY_BACKUPS = Math.max(1, Number(process.env.BACKUP_KEEP_DAYS) || 7);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Writes a consistent copy of the live database to `dest` (VACUUM INTO is
// safe while the app is running and produces a compact file).
export function writeDatabaseCopy(dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  db.prepare('VACUUM INTO ?').run(dest);
}

// One backup per day on the data disk, keeping the newest N. Skipped if the
// disk doesn't have room for three more copies, so backups can never be the
// thing that fills the disk and takes the site down. These protect against
// bad data changes and mistakes; they are on the same disk as the database,
// so off-site copies come from the admin download (GET /api/admin/backup).
export function runDailyBackup(): { file?: string; skipped?: string } {
  const file = path.join(BACKUP_DIR, `krafo-${today()}.db`);
  if (fs.existsSync(file)) return { skipped: 'already done today' };

  const dbSize = fs.statSync(DB_PATH).size;
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const st = fs.statfsSync(BACKUP_DIR);
    const free = st.bavail * st.bsize;
    if (free < dbSize * 3) {
      console.error(`[backup] skipped: ${free} bytes free, database is ${dbSize} bytes`);
      return { skipped: 'low disk space' };
    }
  } catch { /* statfs unavailable - continue */ }

  writeDatabaseCopy(file);
  const old = fs.readdirSync(BACKUP_DIR)
    .filter(f => /^krafo-\d{4}-\d{2}-\d{2}\.db$/.test(f))
    .sort()
    .reverse()
    .slice(KEEP_DAILY_BACKUPS);
  for (const f of old) fs.unlinkSync(path.join(BACKUP_DIR, f));
  return { file };
}

// Removes signups that never entered their email code within 30 days and
// never created anything. They can't use the app, so they're almost always
// bots; 30 days matches the window the signup risk checks look back over
// (repeat fingerprint / repeat inbox), so those signals aren't lost early.
// Only brand-new signups qualify - existing customers waiting to re-verify
// are never deleted.
export function purgeAbandonedSignups(): number {
  const rows = db.prepare(`
    SELECT o.id, o.email FROM organizations o
    WHERE o.verification_status = 'pending_verification'
      AND o.verify_reason = 'signup'
      AND o.created_at < datetime('now', '-30 days')
      AND NOT EXISTS (SELECT 1 FROM invoices WHERE org_id = o.id)
      AND NOT EXISTS (SELECT 1 FROM quotes WHERE org_id = o.id)
      AND NOT EXISTS (SELECT 1 FROM clients WHERE org_id = o.id)
      AND NOT EXISTS (SELECT 1 FROM team_members WHERE org_id = o.id)
  `).all() as { id: string; email: string }[];
  const del = db.prepare('DELETE FROM organizations WHERE id = ?');
  for (const r of rows) {
    del.run(r.id);
    logEvent({ orgId: r.id, actorRole: 'system', actorEmail: 'system', type: 'system.purge_unverified_signup', meta: { email_domain: r.email?.split('@')[1] } });
  }
  return rows.length;
}

export function runHousekeeping(): void {
  try {
    const b = runDailyBackup();
    if (b.file) console.log(`[backup] wrote ${b.file}`);
  } catch (err) {
    console.error('[backup] failed:', err);
  }
  try {
    const n = purgeAbandonedSignups();
    if (n) console.log(`[housekeeping] removed ${n} abandoned unverified signup(s)`);
  } catch (err) {
    console.error('[housekeeping] purge failed:', err);
  }
}
