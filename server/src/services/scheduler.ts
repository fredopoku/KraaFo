import db from '../db/schema';
import { sendDay2Email, sendDay4Email, sendDay7Email, sendPaymentReminder } from './emailService';

async function runOnboardingSequence(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

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
  for (const org of day2Orgs) await sendDay2Email(org).catch(console.error);

  const day4Orgs = db.prepare(`
    SELECT o.* FROM organizations o
    WHERE o.email IS NOT NULL
      AND o.email_unsubscribed = 0
      AND o.welcome_email_sent = 1
      AND o.day4_email_sent = 0
      AND o.created_at <= datetime('now', '-4 days')
      AND o.created_at >= datetime('now', '-7 days')
  `).all() as any[];
  for (const org of day4Orgs) await sendDay4Email(org).catch(console.error);

  const day7Orgs = db.prepare(`
    SELECT o.* FROM organizations o
    WHERE o.email IS NOT NULL
      AND o.email_unsubscribed = 0
      AND o.welcome_email_sent = 1
      AND o.day7_email_sent = 0
      AND o.created_at <= datetime('now', '-7 days')
      AND o.created_at >= datetime('now', '-14 days')
  `).all() as any[];
  for (const org of day7Orgs) await sendDay7Email(org).catch(console.error);
}

async function runOverdueAndReminders(): Promise<void> {
  // Mark sent invoices as overdue when due_date has passed
  db.prepare(`
    UPDATE invoices
    SET status = 'overdue', updated_at = datetime('now')
    WHERE status = 'sent'
      AND due_date IS NOT NULL
      AND due_date < date('now')
      AND amount_paid < total
  `).run();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  // Day 1 overdue reminders
  const day1 = db.prepare(`
    SELECT i.*, o.name as org_name, o.email as org_email, o.currency_symbol,
           o.primary_color, o.logo_url
    FROM invoices i
    JOIN organizations o ON o.id = i.org_id
    WHERE i.status = 'overdue'
      AND i.client_email IS NOT NULL AND i.client_email != ''
      AND i.reminder_1_sent = 0
      AND date(i.due_date) = date('now', '-1 day')
  `).all() as any[];

  for (const inv of day1) {
    const org = { name: inv.org_name, email: inv.org_email, currency_symbol: inv.currency_symbol, primary_color: inv.primary_color, logo_url: inv.logo_url };
    await sendPaymentReminder(inv, org, 1).catch(console.error);
    db.prepare('UPDATE invoices SET reminder_1_sent = 1 WHERE id = ?').run(inv.id);
  }

  // Day 7 overdue reminders
  const day7 = db.prepare(`
    SELECT i.*, o.name as org_name, o.email as org_email, o.currency_symbol,
           o.primary_color, o.logo_url
    FROM invoices i
    JOIN organizations o ON o.id = i.org_id
    WHERE i.status = 'overdue'
      AND i.client_email IS NOT NULL AND i.client_email != ''
      AND i.reminder_1_sent = 1
      AND i.reminder_7_sent = 0
      AND date(i.due_date) <= date('now', '-7 days')
  `).all() as any[];

  for (const inv of day7) {
    const org = { name: inv.org_name, email: inv.org_email, currency_symbol: inv.currency_symbol, primary_color: inv.primary_color, logo_url: inv.logo_url };
    const days = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000);
    await sendPaymentReminder(inv, org, days).catch(console.error);
    db.prepare('UPDATE invoices SET reminder_7_sent = 1 WHERE id = ?').run(inv.id);
  }

  // Day 14 overdue reminders
  const day14 = db.prepare(`
    SELECT i.*, o.name as org_name, o.email as org_email, o.currency_symbol,
           o.primary_color, o.logo_url
    FROM invoices i
    JOIN organizations o ON o.id = i.org_id
    WHERE i.status = 'overdue'
      AND i.client_email IS NOT NULL AND i.client_email != ''
      AND i.reminder_7_sent = 1
      AND i.reminder_14_sent = 0
      AND date(i.due_date) <= date('now', '-14 days')
  `).all() as any[];

  for (const inv of day14) {
    const org = { name: inv.org_name, email: inv.org_email, currency_symbol: inv.currency_symbol, primary_color: inv.primary_color, logo_url: inv.logo_url };
    const days = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000);
    await sendPaymentReminder(inv, org, days).catch(console.error);
    db.prepare('UPDATE invoices SET reminder_14_sent = 1 WHERE id = ?').run(inv.id);
  }
}

export function startScheduler(): void {
  runOnboardingSequence().catch(console.error);
  runOverdueAndReminders().catch(console.error);
  setInterval(() => {
    runOnboardingSequence().catch(console.error);
    runOverdueAndReminders().catch(console.error);
  }, 60 * 60 * 1000);
}
