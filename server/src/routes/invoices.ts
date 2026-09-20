import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';
import { sendActivationEmail, sendAdminEventAlert } from '../services/emailService';

const router = Router();

// A receipt created from an invoice records money received against it. When
// that invoice is un-paid or deleted the receipt no longer reflects reality
// (and would keep inflating the receipt totals), so it goes to the Trash with
// it - recoverable, and restored together if the invoice is restored.
function trashLinkedReceipts(invoiceId: string, orgId: string, byEmail: string, at?: string): string[] {
  const rows = db.prepare(
    "SELECT number FROM invoices WHERE source_invoice_id = ? AND org_id = ? AND type = 'receipt' AND deleted_at IS NULL"
  ).all(invoiceId, orgId) as { number: string }[];
  if (rows.length) {
    // `at` lets a delete cascade share the invoice's exact timestamp, so restoring the
    // invoice can bring back only those receipts (not ones voided earlier by un-paying).
    db.prepare(
      "UPDATE invoices SET deleted_at = COALESCE(?, datetime('now')), deleted_by = ? WHERE source_invoice_id = ? AND org_id = ? AND type = 'receipt' AND deleted_at IS NULL"
    ).run(at ?? null, byEmail, invoiceId, orgId);
  }
  return rows.map(r => r.number);
}

router.get('/', (req: Request, res: Response) => {
  const { type, status, client_id, limit = 50, offset = 0 } = req.query;
  const org_id = req.auth!.orgId;

  let query = 'SELECT * FROM invoices WHERE org_id = ? AND deleted_at IS NULL';
  const params: unknown[] = [org_id];

  if (type) { query += ' AND type = ?'; params.push(type); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (client_id) { query += ' AND client_id = ?'; params.push(client_id); }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const invoices = db.prepare(query).all(...params);
  res.json(invoices);
});

// Public - no auth, safe org fields only
router.get('/:id/public', (req: Request, res: Response) => {
  let doc = db.prepare('SELECT * FROM invoices WHERE id = ? AND deleted_at IS NULL').get(req.params.id) as any;
  let isQuote = false;
  if (!doc) {
    doc = db.prepare('SELECT * FROM quotes WHERE id = ? AND deleted_at IS NULL').get(req.params.id) as any;
    isQuote = true;
  }
  if (!doc) return res.status(404).json({ error: 'Not found' });

  const items = isQuote
    ? db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order').all(req.params.id)
    : db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(req.params.id);

  const org = db.prepare(`
    SELECT name, logo_url, email, phone, address, city, state, zip, country, website,
           primary_color, secondary_color, accent_color, currency, currency_symbol,
           tax_name, bank_name, bank_account, bank_routing,
           mpesa_number, mtn_number, airtel_number, telecel_number, paypal_email, whatsapp_number
    FROM organizations WHERE id = ?
  `).get(doc.org_id) as any;

  const type = isQuote ? 'quote' : (doc.type || 'invoice');
  res.json({ ...doc, type, items, org: org || {} });
});

router.get('/:id', (req: Request, res: Response) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND org_id = ? AND deleted_at IS NULL').get(req.params.id, req.auth!.orgId);
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

  // Fire activation emails on first-ever invoice for this org (non-blocking)
  const invoiceCount = (db.prepare('SELECT COUNT(*) as c FROM invoices WHERE org_id = ?').get(org_id) as any).c;
  if (invoiceCount === 1) {
    const fullOrg = db.prepare('SELECT * FROM organizations WHERE id = ?').get(org_id) as any;
    if (fullOrg && !fullOrg.activation_email_sent) {
      sendActivationEmail(fullOrg).catch(console.error);
      sendAdminEventAlert(fullOrg, 'First invoice').catch(console.error);
    }
  }
});

router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ? AND org_id = ? AND deleted_at IS NULL').get(req.params.id, req.auth!.orgId) as any;
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

  // Status and money must agree, otherwise the dashboard totals drift: flipping
  // Paid -> Sent used to leave the full amount "collected", and choosing Paid
  // without an amount never counted it. Invoices only - a receipt's amount is
  // whatever the user entered. If the status is changed it decides; if only the
  // amount is edited, the amount decides (paying in full = Paid, less = not Paid).
  let unpaid = false;
  if (existing.type === 'invoice') {
    const newTotal = updateFields.total ?? existing.total ?? 0;
    const wasPaid = existing.status === 'paid';
    const sentAmount: number | undefined = updateFields.amount_paid;
    const amountEdited = sentAmount !== undefined && sentAmount !== (existing.amount_paid ?? 0);
    let nextStatus: string | undefined = updateFields.status;

    if ((nextStatus === undefined || nextStatus === existing.status) && amountEdited) {
      if (sentAmount! >= newTotal && newTotal > 0) nextStatus = 'paid';
      else if (wasPaid) nextStatus = 'sent';
    }

    if (nextStatus === 'paid') {
      const paidSoFar = sentAmount ?? existing.amount_paid ?? 0;
      updateFields.status = 'paid';
      updateFields.amount_paid = paidSoFar < newTotal ? newTotal : paidSoFar;
      updateFields.paid_date = updateFields.paid_date || existing.paid_date || new Date().toISOString().slice(0, 10);
      updateFields.balance_due = Math.max(0, newTotal - updateFields.amount_paid);
    } else if (wasPaid && nextStatus !== undefined && ['draft', 'sent', 'overdue'].includes(nextStatus)) {
      const partial = amountEdited && sentAmount! > 0 && sentAmount! < newTotal;
      updateFields.status = nextStatus;
      updateFields.amount_paid = partial ? sentAmount : 0;
      updateFields.paid_date = null;
      updateFields.balance_due = Math.max(0, newTotal - updateFields.amount_paid);
      unpaid = true;
    } else if (sentAmount !== undefined && updateFields.balance_due === undefined) {
      // An edited amount must move the stored balance with it
      updateFields.balance_due = Math.max(0, newTotal - sentAmount);
    }
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

  const receiptsTrashed = unpaid ? trashLinkedReceipts(req.params.id, req.auth!.orgId, req.auth!.email) : [];

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  const savedItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(req.params.id);
  res.json({ ...(invoice as object), items: savedItems, ...(receiptsTrashed.length ? { receiptsTrashed } : {}) });
});

router.delete('/:id', (req: Request, res: Response) => {
  const at = (db.prepare("SELECT datetime('now') as t").get() as { t: string }).t;
  const r = db.prepare(
    "UPDATE invoices SET deleted_at = ?, deleted_by = ? WHERE id = ? AND org_id = ? AND deleted_at IS NULL"
  ).run(at, req.auth!.email, req.params.id, req.auth!.orgId);
  if (r.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
  const receiptsTrashed = trashLinkedReceipts(req.params.id, req.auth!.orgId, req.auth!.email, at);
  res.json({ success: true, receiptsTrashed });
});

// Create a receipt from a fully-paid invoice - copies all client/item data
router.post('/:id/receipt', (req: Request, res: Response) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND org_id = ? AND deleted_at IS NULL').get(req.params.id, req.auth!.orgId) as any;
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (invoice.type !== 'invoice') return res.status(400).json({ error: 'Can only create a receipt from an invoice' });

  // Recording the same payment twice must not issue a second receipt
  const already = db.prepare(
    "SELECT * FROM invoices WHERE source_invoice_id = ? AND org_id = ? AND type = 'receipt' AND deleted_at IS NULL LIMIT 1"
  ).get(invoice.id, invoice.org_id) as any;
  if (already) {
    const alreadyItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(already.id);
    return res.json({ ...already, items: alreadyItems });
  }

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(invoice.org_id) as any;
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(invoice.id) as any[];

  const receiptCount = (db.prepare("SELECT COUNT(*) as c FROM invoices WHERE org_id = ? AND type = 'receipt'").get(invoice.org_id) as any).c;
  const prefix = org.receipt_prefix || 'REC';
  const year = new Date().getFullYear();
  const number = `${prefix}-${year}-${String(receiptCount + 1).padStart(4, '0')}`;
  const todayStr = new Date().toISOString().slice(0, 10);
  const paidDate = invoice.paid_date || todayStr;

  const receiptId = uuidv4();
  db.prepare(`
    INSERT INTO invoices (
      id, org_id, client_id, type, number, status, issue_date, paid_date,
      client_name, client_email, client_phone, client_address, client_city,
      client_state, client_zip, client_company,
      subtotal, discount_type, discount_value, discount_amount,
      tax_rate, tax_amount, total, amount_paid, balance_due,
      currency, currency_symbol, notes, terms, footer_text, source_invoice_id
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    receiptId, invoice.org_id, invoice.client_id || null, 'receipt', number, 'paid', todayStr, paidDate,
    invoice.client_name, invoice.client_email, invoice.client_phone, invoice.client_address,
    invoice.client_city, invoice.client_state, invoice.client_zip, invoice.client_company,
    invoice.subtotal, invoice.discount_type || 'none', invoice.discount_value || 0, invoice.discount_amount || 0,
    invoice.tax_rate || 0, invoice.tax_amount || 0, invoice.total, invoice.total, 0,
    invoice.currency, invoice.currency_symbol, invoice.notes, invoice.terms, invoice.footer_text, invoice.id
  );

  items.forEach((item: any, idx: number) => {
    db.prepare(`INSERT INTO invoice_items (id, invoice_id, description, quantity, unit, unit_price, amount, sort_order)
      VALUES (?,?,?,?,?,?,?,?)`).run(uuidv4(), receiptId, item.description, item.quantity, item.unit || 'unit', item.unit_price, item.amount, idx);
  });

  const receipt = db.prepare('SELECT * FROM invoices WHERE id = ?').get(receiptId) as any;
  const receiptItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(receiptId);
  res.status(201).json({ ...receipt, items: receiptItems });
});

// Record a payment against an invoice (full or partial)
router.patch('/:id/payment', (req: Request, res: Response) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND org_id = ? AND deleted_at IS NULL').get(req.params.id, req.auth!.orgId) as any;
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const { amount_paid, paid_date, payment_method } = req.body;
  if (typeof amount_paid !== 'number' || amount_paid < 0) {
    return res.status(400).json({ error: 'Valid amount_paid required' });
  }

  // Lowering the amount on a paid invoice (even to 0) makes it unpaid again
  const newStatus = amount_paid >= invoice.total ? 'paid'
    : amount_paid > 0 ? 'sent'
    : (invoice.status === 'paid' ? 'sent' : invoice.status);
  const newPaidDate = amount_paid >= invoice.total ? (paid_date || new Date().toISOString().slice(0, 10)) : null;
  const newBalance = Math.max(0, invoice.total - amount_paid);

  db.prepare(`
    UPDATE invoices SET amount_paid = ?, status = ?, paid_date = ?, balance_due = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(amount_paid, newStatus, newPaidDate, newBalance, invoice.id);

  const receiptsTrashed = invoice.status === 'paid' && newStatus !== 'paid'
    ? trashLinkedReceipts(invoice.id, req.auth!.orgId, req.auth!.email) : [];

  if (payment_method) {
    db.prepare("UPDATE invoices SET footer_text = ? WHERE id = ?").run(payment_method, invoice.id);
  }

  const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice.id);
  res.json({ ...(updated as object), ...(receiptsTrashed.length ? { receiptsTrashed } : {}) });
});

export default router;
