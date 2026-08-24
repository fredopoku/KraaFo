import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/krafo.db';
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT DEFAULT 'US',
    website TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#2563EB',
    secondary_color TEXT DEFAULT '#1E40AF',
    accent_color TEXT DEFAULT '#DBEAFE',
    tax_name TEXT DEFAULT 'Tax',
    tax_rate REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    currency_symbol TEXT DEFAULT '$',
    invoice_prefix TEXT DEFAULT 'INV',
    receipt_prefix TEXT DEFAULT 'REC',
    payment_terms TEXT DEFAULT 'Net 30',
    notes TEXT,
    bank_name TEXT,
    bank_account TEXT,
    bank_routing TEXT,
    signature_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT,
    company TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id TEXT REFERENCES clients(id),
    type TEXT NOT NULL CHECK(type IN ('invoice','receipt')),
    number TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','overdue','cancelled','none')),
    issue_date TEXT NOT NULL,
    due_date TEXT,
    paid_date TEXT,
    subtotal REAL DEFAULT 0,
    discount_type TEXT DEFAULT 'none' CHECK(discount_type IN ('none','percent','fixed')),
    discount_value REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total REAL DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    balance_due REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    currency_symbol TEXT DEFAULT '$',
    notes TEXT,
    terms TEXT,
    footer_text TEXT,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    client_city TEXT,
    client_state TEXT,
    client_zip TEXT,
    client_company TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit TEXT DEFAULT 'unit',
    unit_price REAL DEFAULT 0,
    amount REAL DEFAULT 0,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','sent','accepted','declined','expired','invoiced')),
    issue_date TEXT NOT NULL,
    expiry_date TEXT,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    client_city TEXT,
    client_state TEXT,
    client_zip TEXT,
    client_company TEXT,
    subtotal REAL DEFAULT 0,
    discount_type TEXT DEFAULT 'none',
    discount_value REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total REAL DEFAULT 0,
    notes TEXT,
    terms TEXT,
    footer_text TEXT,
    converted_invoice_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quote_items (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit TEXT DEFAULT 'unit',
    unit_price REAL DEFAULT 0,
    amount REAL DEFAULT 0,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS recurring_invoices (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_invoice_id TEXT REFERENCES invoices(id),
    frequency TEXT NOT NULL CHECK(frequency IN ('weekly','monthly','quarterly','yearly')),
    next_date TEXT NOT NULL,
    end_date TEXT,
    active INTEGER DEFAULT 1,
    client_name TEXT,
    client_email TEXT,
    last_generated TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'email' CHECK(type IN ('email','whatsapp')),
    sent_at TEXT,
    status TEXT DEFAULT 'pending'
  );

  CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(org_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
  CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
  CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(org_id);
  CREATE INDEX IF NOT EXISTS idx_quotes_org ON quotes(org_id);

  CREATE TABLE IF NOT EXISTS subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    token TEXT NOT NULL UNIQUE,
    subscribed_at TEXT DEFAULT (datetime('now')),
    unsubscribed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    message TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS broadcasts (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TEXT DEFAULT (datetime('now')),
    recipient_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS changelog (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'New',
    published_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS page_views (
    id TEXT PRIMARY KEY,
    page TEXT NOT NULL,
    referrer TEXT,
    country TEXT,
    country_code TEXT,
    region TEXT,
    city TEXT,
    device TEXT DEFAULT 'Desktop',
    browser TEXT DEFAULT 'Other',
    session_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_pv_created  ON page_views(created_at);
  CREATE INDEX IF NOT EXISTS idx_pv_country  ON page_views(country);
  CREATE INDEX IF NOT EXISTS idx_pv_session  ON page_views(session_id);
`);

// Safe column additions for existing databases
const addCol = (table: string, col: string, def: string) => {
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch {}
};

addCol('organizations', 'smtp_host', 'TEXT');
addCol('organizations', 'smtp_port', 'INTEGER DEFAULT 587');
addCol('organizations', 'smtp_user', 'TEXT');
addCol('organizations', 'smtp_pass', 'TEXT');
addCol('organizations', 'smtp_from', 'TEXT');
addCol('organizations', 'whatsapp_number', 'TEXT');
addCol('organizations', 'mpesa_number', 'TEXT');
addCol('organizations', 'mtn_number', 'TEXT');
addCol('organizations', 'airtel_number', 'TEXT');
addCol('organizations', 'telecel_number', 'TEXT');
addCol('organizations', 'paypal_email', 'TEXT');
addCol('organizations', 'quote_prefix', 'TEXT DEFAULT "QUO"');
addCol('organizations', 'dkim_domain', 'TEXT');
addCol('organizations', 'dkim_selector', 'TEXT');
addCol('organizations', 'dkim_private_key', 'TEXT');
addCol('invoices', 'quote_id', 'TEXT');
addCol('feedback', 'approved', 'INTEGER DEFAULT 0');
addCol('organizations', 'welcome_email_sent', 'INTEGER DEFAULT 0');
addCol('organizations', 'day2_email_sent', 'INTEGER DEFAULT 0');
addCol('organizations', 'day4_email_sent', 'INTEGER DEFAULT 0');
addCol('organizations', 'day7_email_sent', 'INTEGER DEFAULT 0');
addCol('organizations', 'email_unsubscribed', 'INTEGER DEFAULT 0');
addCol('organizations', 'password_hash', 'TEXT');
addCol('organizations', 'last_active_at', 'TEXT');
addCol('organizations', 'account_type', "TEXT DEFAULT 'solo'");
addCol('invoices', 'reminder_1_sent', 'INTEGER DEFAULT 0');
addCol('invoices', 'reminder_7_sent', 'INTEGER DEFAULT 0');
addCol('invoices', 'reminder_14_sent', 'INTEGER DEFAULT 0');
addCol('organizations', 'reset_token', 'TEXT');
addCol('organizations', 'reset_token_expires', 'TEXT');
addCol('organizations', 'next_invoice_number', 'INTEGER DEFAULT 1');
addCol('organizations', 'activation_email_sent', 'INTEGER DEFAULT 0');
addCol('organizations', 'day14_email_sent', 'INTEGER DEFAULT 0');
addCol('organizations', 'last_seen', 'TEXT');
addCol('organizations', 'current_page', 'TEXT');
addCol('organizations', 'total_logins', 'INTEGER DEFAULT 0');

// Signup fraud hardening: verification state, risk signals logged at signup,
// and the email-verification token lifecycle. See routes/organizations.ts,
// services/riskScoring.ts, and routes/auth.ts (verify/resend).
//
// Default is 'verified', not 'pending_verification' - SQLite's ADD COLUMN
// backfills this default into every EXISTING row, not just new ones. New
// signups always set the real value explicitly in their INSERT (see
// routes/organizations.ts), so this default only matters for legacy rows,
// and 'pending_verification' there would lock out every existing customer
// with no verification email ever sent to them (that only fires at signup).
addCol('organizations', 'verification_status', "TEXT DEFAULT 'verified'"); // pending_verification | verified | held_for_review | rejected
addCol('organizations', 'risk_score', 'INTEGER DEFAULT 0');
addCol('organizations', 'risk_action', "TEXT DEFAULT 'allow'"); // allow | friction | hold
addCol('organizations', 'signup_ip', 'TEXT');
addCol('organizations', 'signup_asn', 'TEXT');
addCol('organizations', 'signup_country', 'TEXT');
addCol('organizations', 'signup_is_proxy', 'INTEGER DEFAULT 0');
addCol('organizations', 'signup_is_hosting', 'INTEGER DEFAULT 0');
addCol('organizations', 'fingerprint_hash', 'TEXT');
addCol('organizations', 'email_verify_token_hash', 'TEXT');
addCol('organizations', 'email_verify_expires', 'TEXT');
addCol('organizations', 'email_verified_at', 'TEXT');
addCol('organizations', 'email_verify_sent_at', 'TEXT');
addCol('organizations', 'email_verify_resend_count', 'INTEGER DEFAULT 0');
// Gmail dot/plus-alias normalized form of the signup email (see
// utils/emailValidation.ts's normalizeEmailForAbuseCheck) - lets a repeat
// signup from the same real inbox be recognized as a repeat even when each
// address looks unique. Indexed the same way as fingerprint_hash below.
addCol('organizations', 'signup_email_normalized', 'TEXT');

db.exec(`CREATE INDEX IF NOT EXISTS idx_orgs_signup_email_normalized ON organizations(signup_email_normalized);`);

db.exec(`
  CREATE TABLE IF NOT EXISTS signup_fingerprints (
    id TEXT PRIMARY KEY,
    fingerprint_hash TEXT NOT NULL,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ip TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_signup_fp_hash ON signup_fingerprints(fingerprint_hash);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS org_sessions (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    started_at TEXT DEFAULT (datetime('now')),
    last_seen TEXT DEFAULT (datetime('now')),
    duration_seconds INTEGER DEFAULT 0,
    pages TEXT DEFAULT '[]'
  );
  CREATE INDEX IF NOT EXISTS idx_org_sessions_org     ON org_sessions(org_id);
  CREATE INDEX IF NOT EXISTS idx_org_sessions_started ON org_sessions(started_at);
`);

// Team members table
db.exec(`
  CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'staff',
    invite_token TEXT UNIQUE,
    invite_accepted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_email_org ON team_members(email, org_id);
`);

// Recurring invoices
addCol('invoices', 'is_recurring', 'INTEGER DEFAULT 0');
addCol('invoices', 'recurring_interval', 'TEXT'); // 'weekly' | 'monthly' | 'quarterly' | 'yearly'
addCol('invoices', 'recurring_next_date', 'TEXT');
addCol('invoices', 'recurring_end_date', 'TEXT');
addCol('invoices', 'recurring_parent_id', 'TEXT'); // points to original template invoice
// Index depends on columns added just above - must be created after they
// exist, not in the initial CREATE TABLE block (fails on a fresh database
// otherwise, since is_recurring/recurring_next_date don't exist yet there).
db.exec('CREATE INDEX IF NOT EXISTS idx_invoices_recurring ON invoices(is_recurring, recurring_next_date);');

// Recycle bin / soft delete
addCol('invoices', 'deleted_at', 'TEXT');
addCol('invoices', 'deleted_by', 'TEXT');
addCol('quotes', 'deleted_at', 'TEXT');
addCol('quotes', 'deleted_by', 'TEXT');
addCol('clients', 'deleted_at', 'TEXT');
addCol('clients', 'deleted_by', 'TEXT');

// Seed initial changelog entries (INSERT OR IGNORE - safe to run on every boot)
db.exec(`
  INSERT OR IGNORE INTO changelog (id, title, description, tag, published_at) VALUES
  (
    'cl-team-accounts-2026',
    'Team Accounts & Multi-User Access',
    'Invite your whole team to KraaFo. Choose between a Solo or Business Team account at setup, then add colleagues by email with role-based permissions: Owner, Admin, Staff, or Accountant. Pending invites get a branded email with a one-click join link.',
    'New',
    '2026-03-01 00:00:00'
  ),
  (
    'cl-payment-tracking-2026',
    'Payment Tracking Across All Documents',
    'Record payments directly on invoices, quotes, and receipts. Mark an invoice fully or partially paid, log the payment method, and watch the confetti fly on full payment. Quotes can be accepted, declined, or converted to an invoice in one click.',
    'New',
    '2026-04-01 00:00:00'
  ),
  (
    'cl-overdue-reminders-2026',
    'Automatic Overdue Detection & Payment Reminders',
    'Invoices flip to Overdue automatically once the due date passes. Clients receive escalating reminder emails at 1, 7, and 14 days overdue (gentle first, firm second, urgent third), sent from your own email address so replies come straight to you.',
    'New',
    '2026-04-15 00:00:00'
  ),
  (
    'cl-open-generator-2026',
    'Try Before You Sign Up',
    'The invoice generator is now open to everyone. No account needed. Create, preview, and download documents in full demo mode. Sign up only when you want to save, send, or access documents across devices.',
    'Improved',
    '2026-05-01 00:00:00'
  ),
  (
    'cl-revenue-dashboard-2026',
    'Revenue Dashboard Upgrade',
    'Your dashboard now shows what actually matters: money collected (not just fully paid invoices), your collection rate %, overdue invoices at a glance with one-click access, plus receipt revenue and quote conversion rate side-by-side.',
    'Improved',
    '2026-05-15 00:00:00'
  ),
  (
    'cl-recurring-invoices-2026',
    'Recurring Invoices',
    'Set any invoice to repeat automatically: weekly, monthly, quarterly, or yearly. The system generates a fresh invoice on schedule, copies all line items, and marks the original as your billing template. Set an optional end date or let it run indefinitely.',
    'New',
    '2026-06-01 00:00:00'
  ),
  (
    'cl-statement-of-account-2026',
    'Client Statement of Account',
    'Download a full Statement of Account for any client in one click. The PDF shows every invoice, receipt, and quote in chronological order, showing amounts invoiced, collected, and the outstanding balance at a glance.',
    'New',
    '2026-06-15 00:00:00'
  ),
  (
    'cl-bot-protection-2025',
    'Bot Protection with Cloudflare Turnstile',
    'Added Cloudflare Turnstile (Managed mode) bot-protection challenges to the Feedback form, Newsletter signup, and the new-user Setup page. Real users pass invisibly; bots are blocked before they can touch the server.',
    'New',
    '2025-11-01 00:00:00'
  ),
  (
    'cl-analytics-dashboard-2025',
    'Upgraded Website Analytics Dashboard',
    'The admin analytics panel now works like a real analytics product: choose a date range (7d / 30d / 90d / all-time), see trend arrows comparing the current period to the previous one, a live-visitor badge, session quality metrics (avg pages per session, avg duration, bounce rate), a 24-hour traffic heatmap, entry and exit pages, and all existing breakdowns (countries, cities, devices, browsers, top pages, and referrers) filtered to the selected period.',
    'Improved',
    '2025-12-01 00:00:00'
  ),
  (
    'cl-triple-channel-delivery-2026',
    'Send on WhatsApp, SMS & Email: All at Once',
    'One tap now delivers your invoice or receipt across three channels simultaneously: WhatsApp opens a pre-composed message to your client, SMS fires a summary to their phone, and a branded PDF lands in their inbox, all in under 30 seconds. No other invoicing app does this.',
    'New',
    '2026-06-20 00:00:00'
  ),
  (
    'cl-navigation-2026',
    'Clearer Navigation Across Every Page',
    'Every page in the app now has a visible back arrow in the header so you always know how to get back. The Dashboard, Generator, Clients, Quotes, and Team pages all follow the same consistent navigation pattern. No more hunting for how to return to where you were.',
    'Improved',
    '2026-06-27 00:00:00'
  ),
  (
    'cl-security-hardening-2026',
    'Security Hardening',
    'Full security audit applied before this release. Every API endpoint now derives the organisation ID from the verified login token (not from request parameters), so one account cannot access another''s data. HTTP security headers (X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy) now ship on every response. CORS origin matching switched to exact-match only.',
    'Improved',
    '2026-06-27 00:00:00'
  );
`);

// Remove admin-only entries that should never be in the user changelog
db.exec(`DELETE FROM changelog WHERE id = 'cl-analytics-dashboard-2025';`);

// New user-facing entries (INSERT OR IGNORE — safe to run on every boot)
db.exec(`
  INSERT OR IGNORE INTO changelog (id, title, description, tag, published_at) VALUES
  (
    'cl-revenue-granularity-2026',
    'Revenue Chart: Daily, Monthly & Yearly — All Time',
    'Your revenue chart now shows your full business history, not just the last 6 months. Switch between Daily (last 90 days), Monthly (all time), and Yearly (all time) views with one tap. The chart scrolls automatically when there are many periods, so nothing gets squeezed.',
    'Improved',
    '2026-07-29 00:00:00'
  ),
  (
    'cl-onboarding-checklist-2026',
    'Getting Started Checklist',
    'New accounts now see a three-step checklist on the dashboard: add your logo and brand colours, create your first document, and save your first client. Each step links directly to where you need to go. The checklist disappears once all three are done — no clutter after you are set up.',
    'New',
    '2026-07-29 00:00:00'
  )
`);

// Fix em dashes in existing rows (UPDATE runs every boot, safe to repeat)
db.exec(`
  UPDATE changelog SET
    description = 'Invite your whole team to KraaFo. Choose between a Solo or Business Team account at setup, then add colleagues by email with role-based permissions: Owner, Admin, Staff, or Accountant. Pending invites get a branded email with a one-click join link.'
  WHERE id = 'cl-team-accounts-2026';

  UPDATE changelog SET
    description = 'Invoices flip to Overdue automatically once the due date passes. Clients receive escalating reminder emails at 1, 7, and 14 days overdue (gentle first, firm second, urgent third), sent from your own email address so replies come straight to you.'
  WHERE id = 'cl-overdue-reminders-2026';

  UPDATE changelog SET
    description = 'The invoice generator is now open to everyone. No account needed. Create, preview, and download documents in full demo mode. Sign up only when you want to save, send, or access documents across devices.'
  WHERE id = 'cl-open-generator-2026';

  UPDATE changelog SET
    description = 'Set any invoice to repeat automatically: weekly, monthly, quarterly, or yearly. The system generates a fresh invoice on schedule, copies all line items, and marks the original as your billing template. Set an optional end date or let it run indefinitely.'
  WHERE id = 'cl-recurring-invoices-2026';

  UPDATE changelog SET
    description = 'Download a full Statement of Account for any client in one click. The PDF shows every invoice, receipt, and quote in chronological order, showing amounts invoiced, collected, and the outstanding balance at a glance.'
  WHERE id = 'cl-statement-of-account-2026';

  UPDATE changelog SET
    description = 'The admin analytics panel now works like a real analytics product: choose a date range (7d / 30d / 90d / all-time), see trend arrows comparing the current period to the previous one, a live-visitor badge, session quality metrics (avg pages per session, avg duration, bounce rate), a 24-hour traffic heatmap, entry and exit pages, and all existing breakdowns (countries, cities, devices, browsers, top pages, and referrers) filtered to the selected period.'
  WHERE id = 'cl-analytics-dashboard-2025';

  UPDATE changelog SET
    title = 'Send on WhatsApp, SMS & Email: All at Once',
    description = 'One tap now delivers your invoice or receipt across three channels simultaneously: WhatsApp opens a pre-composed message to your client, SMS fires a summary to their phone, and a branded PDF lands in their inbox, all in under 30 seconds. No other invoicing app does this.'
  WHERE id = 'cl-triple-channel-delivery-2026';

  UPDATE changelog SET
    description = 'Every page in the app now has a visible back arrow in the header so you always know how to get back. The Dashboard, Generator, Clients, Quotes, and Team pages all follow the same consistent navigation pattern. No more hunting for how to return to where you were.'
  WHERE id = 'cl-navigation-2026';

  UPDATE changelog SET
    description = 'Full security audit applied before this release. Every API endpoint now derives the organisation ID from the verified login token (not from request parameters), so one account cannot access another''s data. HTTP security headers (X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy) now ship on every response. CORS origin matching switched to exact-match only.'
  WHERE id = 'cl-security-hardening-2026';

  UPDATE changelog SET
    description = 'The admin panel now tracks every visitor in real time: page views, sessions, city-level location with country flags, device type, browser, and traffic sources. Data updates live as visitors arrive.'
  WHERE title = 'Website Analytics Dashboard';
`);

export default db;
