import db from '../db/schema';
import { sendDay2Email, sendDay4Email, sendDay7Email } from './emailService';

async function runOnboardingSequence(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  // Day 2 — no invoice yet, welcome sent, day2 not sent, created 48–96h ago
  const day2Orgs = db.prepare(`
    SELECT o.* FROM organizations o
    WHERE o.email IS NOT NULL
      AND o.email_unsubscribed = 0
      AND o.welcome_email_sent = 1
      AND o.day2_email_sent = 0
      AND o.created_at <= datetime('now', '-2 days')
      AND o.created_at >= datetime('now', '-4 days')
      AND NOT EXISTS (SELECT 1 FROM invoices WHERE org_id = o.id)
      AND NOT EXISTS (SELECT 1 FROM quotes WHERE org_id = o.id)
  `).all() as any[];

  for (const org of day2Orgs) {
    await sendDay2Email(org).catch(console.error);
  }

  // Day 4 — day4 not sent, created 96–168h ago
  const day4Orgs = db.prepare(`
    SELECT o.* FROM organizations o
    WHERE o.email IS NOT NULL
      AND o.email_unsubscribed = 0
      AND o.welcome_email_sent = 1
      AND o.day4_email_sent = 0
      AND o.created_at <= datetime('now', '-4 days')
      AND o.created_at >= datetime('now', '-7 days')
  `).all() as any[];

  for (const org of day4Orgs) {
    await sendDay4Email(org).catch(console.error);
  }

  // Day 7 — day7 not sent, created 7+ days ago
  const day7Orgs = db.prepare(`
    SELECT o.* FROM organizations o
    WHERE o.email IS NOT NULL
      AND o.email_unsubscribed = 0
      AND o.welcome_email_sent = 1
      AND o.day7_email_sent = 0
      AND o.created_at <= datetime('now', '-7 days')
      AND o.created_at >= datetime('now', '-14 days')
  `).all() as any[];

  for (const org of day7Orgs) {
    await sendDay7Email(org).catch(console.error);
  }
}

export function startScheduler(): void {
  // Run once on startup (catches any missed emails after a restart)
  runOnboardingSequence().catch(console.error);
  // Then every hour
  setInterval(() => {
    runOnboardingSequence().catch(console.error);
  }, 60 * 60 * 1000);
}
