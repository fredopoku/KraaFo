import { Request, Response, NextFunction } from 'express';
import db from '../db/schema';

// Central activity log. logEvent() must never throw or slow a request down:
// the user's action has already succeeded by the time it's called, so a logging
// failure is reported to the console and swallowed.

export interface LogInput {
  req?: Request;                 // supplies org / actor / role / IP when present
  orgId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  ip?: string | null;
  type: string;                  // e.g. 'auth.login', 'doc.create', 'ai.suggest'
  refType?: string;
  refId?: string;
  ok?: boolean;
  meta?: Record<string, unknown>;
}

export function requestIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '';
}

// Never record secrets or free-text bodies, even if a caller passes them by mistake
const SENSITIVE_KEY = /pass|token|secret|key|authorization|cookie|body|content/i;

function cleanMeta(meta?: Record<string, unknown>): string | null {
  if (!meta) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEY.test(k) || v === undefined) continue;
    out[k] = typeof v === 'string' ? v.slice(0, 200) : v;
  }
  const json = JSON.stringify(out);
  return json === '{}' ? null : json.slice(0, 2000);
}

import type { Statement } from 'better-sqlite3';
let insertStmt: Statement<unknown[]> | null = null;

export function logEvent(e: LogInput): void {
  try {
    const auth = e.req?.auth;
    insertStmt ??= db.prepare(`
      INSERT INTO activity_events (org_id, actor_id, actor_email, actor_role, type, ref_type, ref_id, ok, ip, meta)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `);
    insertStmt.run(
      e.orgId ?? auth?.orgId ?? null,
      e.actorId ?? auth?.userId ?? null,
      e.actorEmail ?? auth?.email ?? null,
      e.actorRole ?? auth?.role ?? null,
      e.type,
      e.refType ?? null,
      e.refId ?? null,
      e.ok === false ? 0 : 1,
      e.ip ?? (e.req ? requestIp(e.req) : null),
      cleanMeta(e.meta),
    );
  } catch (err) {
    console.error('[activity] could not log event:', (err as Error).message);
  }
}

// ── Retention ────────────────────────────────────────────────────────
export function pruneActivityEvents(): number {
  const days = Math.max(7, Number(process.env.ACTIVITY_RETENTION_DAYS) || 90);
  try {
    return db.prepare("DELETE FROM activity_events WHERE created_at < datetime('now', ?)").run(`-${days} days`).changes;
  } catch (err) {
    console.error('[activity] prune failed:', (err as Error).message);
    return 0;
  }
}

// ── AI usage cap ─────────────────────────────────────────────────────
// Smart Fill / import are paid API calls. The per-IP limiter in index.ts stops
// one machine; this stops one account (or a script rotating IPs) from burning the
// credits, and gives the admin panel per-account numbers.
const AI_TYPES = ['ai.suggest', 'ai.enhance', 'ai.parse_receipt'];

export function defaultAiLimit(): number {
  return Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 50);
}

export function aiLimitFor(orgId: string): number {
  const row = db.prepare('SELECT ai_daily_limit FROM organizations WHERE id = ?').get(orgId) as { ai_daily_limit: number | null } | undefined;
  return row?.ai_daily_limit ?? defaultAiLimit();
}

export function aiCallsToday(orgId: string): number {
  const marks = AI_TYPES.map(() => '?').join(',');
  return (db.prepare(
    `SELECT COUNT(*) c FROM activity_events WHERE org_id = ? AND type IN (${marks}) AND date(created_at) = date('now')`
  ).get(orgId, ...AI_TYPES) as { c: number }).c;
}

// Counts the call, or refuses it (and records the refusal) once the day's limit is used
export function aiQuota(kind: 'suggest' | 'enhance' | 'parse_receipt') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const orgId = req.auth?.orgId;
    if (!orgId) { res.status(401).json({ error: 'Authentication required' }); return; }
    const limit = aiLimitFor(orgId);
    const used = aiCallsToday(orgId);
    if (used >= limit) {
      logEvent({ req, type: 'ai.blocked', ok: false, meta: { kind, used, limit } });
      res.status(429).json({
        error: `You've used today's ${limit} AI requests. It resets at midnight UTC.`,
        code: 'ai_limit',
      });
      return;
    }
    logEvent({ req, type: `ai.${kind}`, meta: { used: used + 1, limit } });
    next();
  };
}
