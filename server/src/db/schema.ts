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

export default db;
