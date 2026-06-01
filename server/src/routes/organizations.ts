import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';

const router = Router();

router.get('/:id', (req: Request, res: Response) => {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  res.json(org);
});

router.post('/', (req: Request, res: Response) => {
  const id = uuidv4();
  const {
    name, email, phone, address, city, state, zip, country, website,
    logo_url, primary_color, secondary_color, accent_color,
    tax_name, tax_rate, currency, currency_symbol,
    invoice_prefix, receipt_prefix, quote_prefix, payment_terms, notes,
    bank_name, bank_account, bank_routing, signature_url,
    smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
    whatsapp_number, mpesa_number, mtn_number, airtel_number, telecel_number, paypal_email,
    dkim_domain, dkim_selector, dkim_private_key,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Organization name is required' });

  db.prepare(`
    INSERT INTO organizations (id, name, email, phone, address, city, state, zip, country, website,
      logo_url, primary_color, secondary_color, accent_color, tax_name, tax_rate, currency,
      currency_symbol, invoice_prefix, receipt_prefix, quote_prefix, payment_terms, notes,
      bank_name, bank_account, bank_routing, signature_url,
      smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
      whatsapp_number, mpesa_number, mtn_number, airtel_number, telecel_number, paypal_email)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, name, email, phone, address, city, state, zip, country || 'US', website,
    logo_url, primary_color || '#2563EB', secondary_color || '#1E40AF', accent_color || '#DBEAFE',
    tax_name || 'Tax', tax_rate || 0, currency || 'USD', currency_symbol || '$',
    invoice_prefix || 'INV', receipt_prefix || 'REC', quote_prefix || 'QUO',
    payment_terms || 'Net 30', notes,
    bank_name, bank_account, bank_routing, signature_url || null,
    smtp_host || null, smtp_port || 587, smtp_user || null, smtp_pass || null, smtp_from || null,
    whatsapp_number || null, mpesa_number || null, mtn_number || null, airtel_number || null, telecel_number || null, paypal_email || null);

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
  res.status(201).json(org);
});

router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT id FROM organizations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Organization not found' });

  const fields = [
    'name','email','phone','address','city','state','zip','country','website',
    'logo_url','primary_color','secondary_color','accent_color','tax_name','tax_rate',
    'currency','currency_symbol','invoice_prefix','receipt_prefix','quote_prefix','payment_terms',
    'notes','bank_name','bank_account','bank_routing','signature_url',
    'smtp_host','smtp_port','smtp_user','smtp_pass','smtp_from',
    'whatsapp_number','mpesa_number','mtn_number','airtel_number','telecel_number','paypal_email',
    'dkim_domain','dkim_selector','dkim_private_key',
  ];

  const updates = fields.filter(f => req.body[f] !== undefined);
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const setClauses = [...updates.map(f => `${f} = ?`), "updated_at = datetime('now')"].join(', ');
  const values = [...updates.map(f => req.body[f]), req.params.id];

  db.prepare(`UPDATE organizations SET ${setClauses} WHERE id = ?`).run(...values);
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  res.json(org);
});

export default router;
