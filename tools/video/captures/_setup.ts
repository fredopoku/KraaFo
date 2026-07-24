/**
 * Shared helpers for Playwright capture scripts.
 * Creates a fresh "Sparkle & Shine" demo org for each capture session.
 * All data is fictional: never uses real customer information.
 */

export const APP_URL    = 'http://localhost:5174';
export const SERVER_URL = 'http://localhost:3001';
export const DEMO_PASS  = 'Demo1234!';

export const DEMO_ORG = {
  name: 'Sparkle & Shine Cleaning',
  business_type: 'Cleaning',
  currency: 'GHS',
  currency_symbol: 'GHS',
  country: 'Ghana',
  city: 'Accra',
  industry: 'Cleaning',
  primary_color: '#4F46E5',
  secondary_color: '#7C3AED',
  accent_color: '#C7D2FE',
};

export const DEMO_CLIENT = {
  name: 'Abena Mensah',
  email: 'abena.mensah@example.com',
  phone: '+233241234567',
  address: '12 Ring Road, Accra',
};

export interface DemoContext {
  orgId: string;
  token: string;
  clientId?: string;
  invoiceId?: string;
}

/** Create a fresh demo org + set password. Returns orgId + JWT token. */
export async function createDemoOrg(): Promise<DemoContext> {
  const email = `demo+${Date.now()}@sparkleshine.co`;

  const org = await fetch(`${SERVER_URL}/api/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...DEMO_ORG, email }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(`Create org failed: ${await r.text()}`);
    return r.json();
  });

  const { token } = await fetch(`${SERVER_URL}/api/auth/set-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId: org.id, password: DEMO_PASS }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(`Set password failed: ${await r.text()}`);
    return r.json();
  });

  return { orgId: org.id, token };
}

/** Seed a demo client into the org. */
export async function seedClient(ctx: DemoContext): Promise<DemoContext> {
  const client = await fetch(`${SERVER_URL}/api/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.token}` },
    body: JSON.stringify({ ...DEMO_CLIENT, org_id: ctx.orgId }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(`Create client failed: ${await r.text()}`);
    return r.json();
  });
  return { ...ctx, clientId: client.id };
}

/** Seed a saved invoice so the Send flow has something to work with. */
export async function seedInvoice(ctx: DemoContext): Promise<DemoContext> {
  const invoice = await fetch(`${SERVER_URL}/api/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.token}` },
    body: JSON.stringify({
      type: 'invoice',
      number: 'INV-2026-0001',
      client_id: ctx.clientId ?? null,
      client_name: DEMO_CLIENT.name,
      client_email: DEMO_CLIENT.email,
      client_phone: DEMO_CLIENT.phone,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10),
      status: 'draft',
      notes: 'Thank you for your business.',
      items: [
        { description: 'Deep Cleaning: 3-bedroom', quantity: 1, unit: 'session', unit_price: 750 },
        { description: 'Carpet Steam Clean', quantity: 2, unit: 'room', unit_price: 150 },
        { description: 'Post-construction cleanup', quantity: 1, unit: 'job', unit_price: 350 },
      ],
    }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(`Create invoice failed: ${await r.text()}`);
    return r.json();
  });
  return { ...ctx, invoiceId: invoice.id };
}

/** Seed multiple invoices in various states for the dashboard view. */
export async function seedDashboard(ctx: DemoContext): Promise<DemoContext> {
  const today = new Date().toISOString().slice(0, 10);
  const seeds = [
    {
      type: 'invoice', number: 'INV-2026-0001', status: 'paid',
      client_name: DEMO_CLIENT.name, client_email: DEMO_CLIENT.email,
      issue_date: today, due_date: new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10),
      amount_paid: 800,
      items: [{ description: 'Weekly Office Clean', quantity: 4, unit: 'visit', unit_price: 200 }],
    },
    {
      type: 'invoice', number: 'INV-2026-0002', status: 'sent',
      client_name: 'Kofi Agyemang', client_email: 'kofi@example.com',
      issue_date: today, due_date: new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10),
      items: [{ description: 'Post-Event Cleanup', quantity: 1, unit: 'job', unit_price: 600 }],
    },
    {
      type: 'invoice', number: 'INV-2026-0003', status: 'paid',
      client_name: 'Ama Owusu', client_email: 'ama@example.com',
      issue_date: today, due_date: new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10),
      amount_paid: 1200,
      items: [{ description: 'Monthly Cleaning Package', quantity: 1, unit: 'month', unit_price: 1200 }],
    },
    {
      type: 'invoice', number: 'INV-2026-0004', status: 'draft',
      client_name: DEMO_CLIENT.name, client_email: DEMO_CLIENT.email,
      issue_date: today, due_date: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
      items: [{ description: 'Carpet & Upholstery Clean', quantity: 3, unit: 'room', unit_price: 180 }],
    },
  ];

  for (const inv of seeds) {
    await fetch(`${SERVER_URL}/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.token}` },
      body: JSON.stringify(inv),
    });
  }

  return ctx;
}

/** Inject the JWT into the page's localStorage before navigating. */
export function injectToken(token: string) {
  return (t: string) => localStorage.setItem('krafo_token', t);
}

/** Human-like pause: cinematic pacing, not test-suite speed. */
export function pause(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
