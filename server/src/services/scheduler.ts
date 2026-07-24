import db from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { sendDay2Email, sendDay4Email, sendDay7Email, sendPaymentReminder, sendInvoiceEmail } from './emailService';

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

  // Mark sent/draft quotes as expired when expiry_date has passed
  db.prepare(`
    UPDATE quotes
    SET status = 'expired', updated_at = datetime('now')
    WHERE status IN ('sent', 'draft')
      AND expiry_date IS NOT NULL
      AND expiry_date < date('now')
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

function nextDateAfter(baseDate: string, interval: string): string {
  const d = new Date(baseDate);
  switch (interval) {
    case 'weekly':    d.setDate(d.getDate() + 7); break;
    case 'monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split('T')[0];
}

function daysOffset(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

async function runRecurringInvoices(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Find recurring template invoices due today or overdue
  const due = db.prepare(`
    SELECT i.*, o.invoice_prefix, o.next_invoice_number
    FROM invoices i
    JOIN organizations o ON o.id = i.org_id
    WHERE i.is_recurring = 1
      AND i.type = 'invoice'
      AND i.recurring_next_date IS NOT NULL
      AND i.recurring_next_date <= ?
      AND (i.recurring_end_date IS NULL OR i.recurring_end_date >= ?)
  `).all(today, today) as any[];

  for (const tmpl of due) {
    // Clone the template invoice as a new sent invoice
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(tmpl.id) as any[];

    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(tmpl.org_id) as any;
    const num = `${org.invoice_prefix || 'INV'}-${new Date().getFullYear()}-${String((org.next_invoice_number || 1)).padStart(4, '0')}`;

    const newId = uuidv4();
    const issueDate = tmpl.recurring_next_date;
    // Calculate due date from original gap (issue_date → due_date)
    let dueDays = 30;
    if (tmpl.issue_date && tmpl.due_date) {
      dueDays = Math.round((new Date(tmpl.due_date).getTime() - new Date(tmpl.issue_date).getTime()) / 86400000);
    }
    const dueDate = daysOffset(issueDate, dueDays);

    db.prepare(`
      INSERT INTO invoices (id, org_id, type, number, status, issue_date, due_date,
        client_id, client_name, client_email, client_phone, client_address, client_city,
        client_state, client_zip, client_company,
        subtotal, discount_type, discount_value, discount_amount, tax_rate, tax_amount, total,
        amount_paid, balance_due, notes, terms, footer_text, currency_symbol,
        is_recurring, recurring_parent_id, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,0,?,datetime('now'),datetime('now'))
    `).run(
      newId, tmpl.org_id, 'invoice', num, 'sent', issueDate, dueDate,
      tmpl.client_id, tmpl.client_name, tmpl.client_email, tmpl.client_phone, tmpl.client_address,
      tmpl.client_city, tmpl.client_state, tmpl.client_zip, tmpl.client_company,
      tmpl.subtotal, tmpl.discount_type, tmpl.discount_value, tmpl.discount_amount,
      tmpl.tax_rate, tmpl.tax_amount, tmpl.total,
      tmpl.total,
      tmpl.notes, tmpl.terms, tmpl.footer_text, tmpl.currency_symbol, tmpl.id,
    );

    // Copy line items
    for (const item of items) {
      db.prepare(`INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount, sort_order)
        VALUES (?,?,?,?,?,?,?)`).run(uuidv4(), newId, item.description, item.quantity, item.unit_price, item.amount, item.sort_order);
    }

    // Bump org invoice counter
    db.prepare('UPDATE organizations SET next_invoice_number = COALESCE(next_invoice_number, 1) + 1 WHERE id = ?').run(tmpl.org_id);

    // Auto-send email to client if they have an address
    if (tmpl.client_email) {
      sendInvoiceEmail(newId, tmpl.client_email).catch(console.error);
    }

    // Advance recurring_next_date on the template
    const nextDate = nextDateAfter(tmpl.recurring_next_date, tmpl.recurring_interval);
    const stillActive = !tmpl.recurring_end_date || nextDate <= tmpl.recurring_end_date;
    db.prepare('UPDATE invoices SET recurring_next_date = ?, is_recurring = ? WHERE id = ?')
      .run(stillActive ? nextDate : null, stillActive ? 1 : 0, tmpl.id);
  }
}

export function startScheduler(): void {
  runOnboardingSequence().catch(console.error);
  runOverdueAndReminders().catch(console.error);
  runRecurringInvoices().catch(console.error);
  setInterval(() => {
    runOnboardingSequence().catch(console.error);
    runOverdueAndReminders().catch(console.error);
    runRecurringInvoices().catch(console.error);
  }, 60 * 60 * 1000);
}
