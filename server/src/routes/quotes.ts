import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { org_id } = req.query;
  if (!org_id) return res.status(400).json({ error: 'org_id required' });
  const quotes = db.prepare('SELECT * FROM quotes WHERE org_id = ? ORDER BY created_at DESC').all(org_id);
  res.json(quotes);
});

router.get('/:id', (req: Request, res: Response) => {
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id) as any;
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order').all(req.params.id);
  res.json({ ...quote, items });
});

const VALID_QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'declined', 'expired', 'invoiced'];

router.post('/', (req: Request, res: Response) => {
  const { org_id, items = [], ...data } = req.body;
  if (!org_id) return res.status(400).json({ error: 'org_id required' });
  if (data.status && !VALID_QUOTE_STATUSES.includes(data.status)) data.status = 'draft';

  const id = uuidv4();
  const subtotal = items.reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const discountAmt = data.discount_type === 'percent' ? subtotal * (data.discount_value / 100) :
    data.discount_type === 'fixed' ? Math.min(data.discount_value, subtotal) : 0;
  const taxable = subtotal - discountAmt;
  const taxAmt = taxable * ((data.tax_rate || 0) / 100);
  const total = taxable + taxAmt;

  db.prepare(`
    INSERT INTO quotes (id, org_id, number, status, issue_date, expiry_date,
      client_name, client_email, client_phone, client_address, client_city,
      client_state, client_zip, client_company, subtotal, discount_type,
      discount_value, discount_amount, tax_rate, tax_amount, total, notes, terms, footer_text)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, org_id, data.number || `QUO-${Date.now()}`, data.status || 'draft',
    data.issue_date, data.expiry_date, data.client_name, data.client_email, data.client_phone,
    data.client_address, data.client_city, data.client_state, data.client_zip, data.client_company,
    subtotal, data.discount_type || 'none', data.discount_value || 0, discountAmt,
    data.tax_rate || 0, taxAmt, total, data.notes, data.terms, data.footer_text);

  items.forEach((item: any, idx: number) => {
    db.prepare(`INSERT INTO quote_items (id, quote_id, description, quantity, unit, unit_price, amount, sort_order)
      VALUES (?,?,?,?,?,?,?,?)`).run(uuidv4(), id, item.description, item.quantity, item.unit, item.unit_price, item.amount, idx);
  });

  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id) as any;
  const savedItems = db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order').all(id);
  res.status(201).json({ ...quote, items: savedItems });
});

router.put('/:id', (req: Request, res: Response) => {
  const { items, ...data } = req.body;
  const existing = db.prepare('SELECT id, org_id FROM quotes WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Quote not found' });
  if (data.status && !VALID_QUOTE_STATUSES.includes(data.status)) data.status = 'draft';

  if (items !== undefined) {
    const subtotal = items.reduce((s: number, i: any) => s + (i.amount || 0), 0);
    const discountAmt = data.discount_type === 'percent' ? subtotal * (data.discount_value / 100) :
      data.discount_type === 'fixed' ? Math.min(data.discount_value, subtotal) : 0;
    const taxable = subtotal - discountAmt;
    const taxAmt = taxable * ((data.tax_rate || 0) / 100);
    data.total = taxable + taxAmt;
    data.subtotal = subtotal;
    data.discount_amount = discountAmt;
    data.tax_amount = taxAmt;

    db.prepare('DELETE FROM quote_items WHERE quote_id = ?').run(req.params.id);
    items.forEach((item: any, idx: number) => {
      db.prepare(`INSERT INTO quote_items (id, quote_id, description, quantity, unit, unit_price, amount, sort_order)
        VALUES (?,?,?,?,?,?,?,?)`).run(uuidv4(), req.params.id, item.description, item.quantity, item.unit, item.unit_price, item.amount, idx);
    });
  }

  const fields = ['number','status','issue_date','expiry_date','client_name','client_email','client_phone',
    'client_address','client_city','client_state','client_zip','client_company','subtotal','discount_type',
    'discount_value','discount_amount','tax_rate','tax_amount','total','notes','terms','footer_text'];
  const updates = fields.filter(f => data[f] !== undefined);
  if (updates.length) {
    const set = [...updates.map(f => `${f} = ?`), "updated_at = datetime('now')"].join(', ');
    db.prepare(`UPDATE quotes SET ${set} WHERE id = ?`).run(...updates.map(f => data[f]), req.params.id);
  }

  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id) as any;
  const savedItems = db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order').all(req.params.id);
  res.json({ ...quote, items: savedItems });
});

// Convert quote to invoice
router.post('/:id/convert', (req: Request, res: Response) => {
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id) as any;
  if (!quote) return res.status(404).json({ error: 'Quote not found' });

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(quote.org_id) as any;
  const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order').all(req.params.id) as any[];

  const invoiceCount = (db.prepare('SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND type = ?').get(quote.org_id, 'invoice') as any).c;
  const prefix = org.invoice_prefix || 'INV';
  const year = new Date().getFullYear();
  const number = `${prefix}-${year}-${String(invoiceCount + 1).padStart(4, '0')}`;

  const invoiceId = uuidv4();
  db.prepare(`
    INSERT INTO invoices (id, org_id, type, number, status, issue_date, due_date,
      client_name, client_email, client_phone, client_address, client_city,
      client_state, client_zip, client_company, subtotal, discount_type,
      discount_value, discount_amount, tax_rate, tax_amount, total, amount_paid,
      balance_due, notes, terms, footer_text, quote_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(invoiceId, quote.org_id, 'invoice', number, 'draft', quote.issue_date,
    quote.expiry_date, quote.client_name, quote.client_email, quote.client_phone,
    quote.client_address, quote.client_city, quote.client_state, quote.client_zip,
    quote.client_company, quote.subtotal, quote.discount_type, quote.discount_value,
    quote.discount_amount, quote.tax_rate, quote.tax_amount, quote.total, 0,
    quote.total, quote.notes, quote.terms, quote.footer_text, quote.id);

  items.forEach((item, idx) => {
    db.prepare(`INSERT INTO invoice_items (id, invoice_id, description, quantity, unit, unit_price, amount, sort_order)
      VALUES (?,?,?,?,?,?,?,?)`).run(uuidv4(), invoiceId, item.description, item.quantity, item.unit, item.unit_price, item.amount, idx);
  });

  db.prepare("UPDATE quotes SET status = 'invoiced', converted_invoice_id = ?, updated_at = datetime('now') WHERE id = ?")
    .run(invoiceId, req.params.id);

  res.json({ invoice_id: invoiceId, number });
});

router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
