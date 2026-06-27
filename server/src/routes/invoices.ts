import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { type, status, client_id, limit = 50, offset = 0 } = req.query;
  const org_id = req.auth!.orgId;

  let query = 'SELECT * FROM invoices WHERE org_id = ?';
  const params: unknown[] = [org_id];

  if (type) { query += ' AND type = ?'; params.push(type); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (client_id) { query += ' AND client_id = ?'; params.push(client_id); }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const invoices = db.prepare(query).all(...params);
  res.json(invoices);
});

// Public — no auth, safe org fields only
router.get('/:id/public', (req: Request, res: Response) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any;
  if (!invoice) return res.status(404).json({ error: 'Not found' });

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(req.params.id);
  const org = db.prepare(`
    SELECT name, logo_url, email, phone, address, city, state, zip, country, website,
           primary_color, secondary_color, accent_color, currency, currency_symbol,
           tax_name, bank_name, bank_account, bank_routing,
           mpesa_number, mtn_number, airtel_number, telecel_number, paypal_email, whatsapp_number
    FROM organizations WHERE id = ?
  `).get(invoice.org_id) as any;

  res.json({ ...invoice, items, org: org || {} });
});

router.get('/:id', (req: Request, res: Response) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND org_id = ?').get(req.params.id, req.auth!.orgId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(req.params.id);
  res.json({ ...(invoice as object), items });
});

router.post('/', (req: Request, res: Response) => {
  const id = uuidv4();
  const org_id = req.auth!.orgId;
  const {
    client_id, type, number, status, issue_date, due_date, paid_date,
    discount_type, discount_value, tax_rate, amount_paid, notes, terms, footer_text,
    client_name, client_email, client_phone, client_address, client_city,
    client_state, client_zip, client_company, items = [],
    is_recurring, recurring_interval, recurring_end_date,
  } = req.body;

  if (!type || !issue_date) {
    return res.status(400).json({ error: 'type and issue_date are required' });
  }
  const VALID_INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'none'];
  const safeStatus = VALID_INVOICE_STATUSES.includes(status) ? status : 'draft';

  const org = db.prepare('SELECT currency, currency_symbol, tax_name, tax_rate as default_tax FROM organizations WHERE id = ?').get(org_id) as any;
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  const effectiveTaxRate = tax_rate ?? org.default_tax ?? 0;
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);

  let discountAmount = 0;
  if (discount_type === 'percent' && discount_value > 0) {
    discountAmount = subtotal * (discount_value / 100);
  } else if (discount_type === 'fixed' && discount_value > 0) {
    discountAmount = Math.min(discount_value, subtotal);
  }

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (effectiveTaxRate / 100);
  const total = taxableAmount + taxAmount;
  const balanceDue = Math.max(0, total - (amount_paid || 0));

  // Compute first recurrence date (= issue_date + interval)
  let recurringNextDate: string | null = null;
  if (is_recurring && type === 'invoice' && recurring_interval && issue_date) {
    const d = new Date(issue_date);
    if (recurring_interval === 'weekly')    d.setDate(d.getDate() + 7);
    else if (recurring_interval === 'monthly')   d.setMonth(d.getMonth() + 1);
    else if (recurring_interval === 'quarterly') d.setMonth(d.getMonth() + 3);
    else if (recurring_interval === 'yearly')    d.setFullYear(d.getFullYear() + 1);
    recurringNextDate = d.toISOString().split('T')[0];
  }

  db.prepare(`
    INSERT INTO invoices (
      id, org_id, client_id, type, number, status, issue_date, due_date, paid_date,
      subtotal, discount_type, discount_value, discount_amount, tax_rate, tax_amount,
      total, amount_paid, balance_due, currency, currency_symbol, notes, terms, footer_text,
      client_name, client_email, client_phone, client_address, client_city, client_state, client_zip, client_company,
      is_recurring, recurring_interval, recurring_next_date, recurring_end_date
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, org_id, client_id || null, type, number, safeStatus || 'draft', issue_date,
    due_date || null, paid_date || null, subtotal, discount_type || 'none',
    discount_value || 0, discountAmount, effectiveTaxRate, taxAmount, total,
    amount_paid || 0, balanceDue, org.currency, org.currency_symbol, notes, terms,
    footer_text, client_name, client_email, client_phone, client_address,
    client_city, client_state, client_zip, client_company,
    is_recurring ? 1 : 0, recurring_interval || null, recurringNextDate, recurring_end_date || null,
  );

  const insertItem = db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit, unit_price, amount, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  items.forEach((item: any, i: number) => {
    insertItem.run(uuidv4(), id, item.description, item.quantity, item.unit || 'unit',
      item.unit_price, item.quantity * item.unit_price, i);
  });

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  const savedItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(id);
  res.status(201).json({ ...(invoice as object), items: savedItems });
});

router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ? AND org_id = ?').get(req.params.id, req.auth!.orgId) as any;
  if (!existing) return res.status(404).json({ error: 'Invoice not found' });

  const { items, ...updateFields } = req.body;
  if (updateFields.status && !['draft','sent','paid','overdue','cancelled','none'].includes(updateFields.status)) {
    updateFields.status = 'draft';
  }

  if (items !== undefined) {
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (id, invoice_id, description, quantity, unit, unit_price, amount, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    items.forEach((item: any, i: number) => {
      insertItem.run(uuidv4(), req.params.id, item.description, item.quantity,
        item.unit || 'unit', item.unit_price, item.quantity * item.unit_price, i);
    });

    const subtotal = items.reduce((s: number, item: any) => s + item.quantity * item.unit_price, 0);
    const discountType = updateFields.discount_type || existing.discount_type;
    const discountValue = updateFields.discount_value ?? existing.discount_value;
    let discountAmount = 0;
    if (discountType === 'percent') discountAmount = subtotal * (discountValue / 100);
    else if (discountType === 'fixed') discountAmount = Math.min(discountValue, subtotal);
    const taxRate = updateFields.tax_rate ?? existing.tax_rate;
    const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
    const total = subtotal - discountAmount + taxAmount;
    const amtPaid = updateFields.amount_paid ?? existing.amount_paid;
    const balanceDue = Math.max(0, total - amtPaid);

    Object.assign(updateFields, { subtotal, discount_amount: discountAmount, tax_amount: taxAmount, total, balance_due: balanceDue });
  }

  // Recompute recurring_next_date if is_recurring or recurring_interval changed
  if (updateFields.is_recurring !== undefined || updateFields.recurring_interval !== undefined) {
    const isRec = updateFields.is_recurring !== undefined ? !!updateFields.is_recurring : !!existing.is_recurring;
    const interval = updateFields.recurring_interval || existing.recurring_interval || 'monthly';
    const baseDate = updateFields.issue_date || existing.issue_date;
    if (isRec && baseDate) {
      const d = new Date(baseDate);
      if (interval === 'weekly')    d.setDate(d.getDate() + 7);
      else if (interval === 'monthly')   d.setMonth(d.getMonth() + 1);
      else if (interval === 'quarterly') d.setMonth(d.getMonth() + 3);
      else if (interval === 'yearly')    d.setFullYear(d.getFullYear() + 1);
      updateFields.recurring_next_date = d.toISOString().split('T')[0];
    } else {
      updateFields.recurring_next_date = null;
    }
    updateFields.is_recurring = isRec ? 1 : 0;
  }

  const fields = Object.keys(updateFields).filter(k => ['status','due_date','paid_date','notes','terms',
    'footer_text','discount_type','discount_value','discount_amount','tax_rate','tax_amount',
    'total','subtotal','amount_paid','balance_due','client_name','client_email','client_phone',
    'client_address','client_city','client_state','client_zip','client_company',
    'is_recurring','recurring_interval','recurring_next_date','recurring_end_date'].includes(k));

  if (fields.length > 0) {
    const setClauses = [...fields.map(f => `${f} = ?`), "updated_at = datetime('now')"].join(', ');
    const values = [...fields.map(f => updateFields[f]), req.params.id];
    db.prepare(`UPDATE invoices SET ${setClauses} WHERE id = ?`).run(...values);
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  const savedItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(req.params.id);
  res.json({ ...(invoice as object), items: savedItems });
});

router.delete('/:id', (req: Request, res: Response) => {
  const r = db.prepare('DELETE FROM invoices WHERE id = ? AND org_id = ?').run(req.params.id, req.auth!.orgId);
  if (r.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ success: true });
});

// Record a payment against an invoice (full or partial)
router.patch('/:id/payment', (req: Request, res: Response) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND org_id = ?').get(req.params.id, req.auth!.orgId) as any;
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const { amount_paid, paid_date, payment_method } = req.body;
  if (typeof amount_paid !== 'number' || amount_paid < 0) {
    return res.status(400).json({ error: 'Valid amount_paid required' });
  }

  const newStatus = amount_paid >= invoice.total ? 'paid' : amount_paid > 0 ? 'sent' : invoice.status;
  const newPaidDate = amount_paid >= invoice.total ? (paid_date || new Date().toISOString().slice(0, 10)) : null;

  db.prepare(`
    UPDATE invoices SET amount_paid = ?, status = ?, paid_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(amount_paid, newStatus, newPaidDate, invoice.id);

  if (payment_method) {
    db.prepare("UPDATE invoices SET footer_text = ? WHERE id = ?").run(payment_method, invoice.id);
  }

  const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice.id);
  res.json(updated);
});

export default router;
