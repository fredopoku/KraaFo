import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import db from '../db/schema';
import { generatePDF } from '../services/pdfService';
import { getLogoBase64 } from '../services/imageService';
import { InvoiceTemplateData } from '../templates/invoiceTemplate';
import { verifyTurnstile } from '../utils/turnstile';
import path from 'path';
import QRCode from 'qrcode';

// Rate limit for the unauthenticated guest PDF endpoint.
// Puppeteer rendering is expensive - cap per IP to prevent DoS.
const guestPdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many PDF requests - please wait before trying again.' },
});

const router = Router();

async function buildPaymentQR(org: any, invoiceTotal: number, currencySymbol: string): Promise<string | undefined> {
  const payUrl = org.paypal_email
    ? `https://paypal.me/${org.paypal_email.replace('@', '').split('@')[0]}/${invoiceTotal.toFixed(2)}`
    : org.mpesa_number
    ? `tel:${org.mpesa_number}`
    : null;
  if (!payUrl) return undefined;
  try {
    return await QRCode.toString(payUrl, { type: 'svg', width: 80, margin: 1 });
  } catch {
    return undefined;
  }
}

router.get('/:invoiceId', async (req: Request, res: Response) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.invoiceId) as any;
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(invoice.org_id) as any;
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(req.params.invoiceId) as any[];

  const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  const logoBase64 = (() => {
    if (!org.logo_url) return undefined;
    const filename = path.basename(org.logo_url);
    const thumbPath = path.resolve(UPLOAD_DIR, `thumb_${filename}`);
    const origPath = path.resolve(UPLOAD_DIR, filename);
    return getLogoBase64(thumbPath) || getLogoBase64(origPath) || undefined;
  })();

  const paymentQrSvg = invoice.type !== 'receipt'
    ? await buildPaymentQR(org, invoice.total || 0, org.currency_symbol || '$')
    : undefined;

  const templateData: InvoiceTemplateData = {
    type: invoice.type,
    number: invoice.number,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    paid_date: invoice.paid_date,
    status: invoice.status,
    payment_qr_svg: paymentQrSvg,
    org: {
      name: org.name,
      email: org.email,
      phone: org.phone,
      address: org.address,
      city: org.city,
      state: org.state,
      zip: org.zip,
      country: org.country,
      website: org.website,
      logo_base64: logoBase64,
      primary_color: org.primary_color || '#2563EB',
      secondary_color: org.secondary_color || '#1E40AF',
      accent_color: org.accent_color || '#DBEAFE',
      tax_name: org.tax_name || 'Tax',
      currency_symbol: org.currency_symbol || '$',
      bank_name: org.bank_name,
      bank_account: org.bank_account,
      bank_routing: org.bank_routing,
      signature_url: org.signature_url,
      paypal_email: org.paypal_email,
      mpesa_number: org.mpesa_number,
      mtn_number: org.mtn_number,
      airtel_number: org.airtel_number,
      telecel_number: org.telecel_number,
      whatsapp_number: org.whatsapp_number,
    },
    client: {
      name: invoice.client_name || 'Client',
      email: invoice.client_email,
      phone: invoice.client_phone,
      address: invoice.client_address,
      city: invoice.client_city,
      state: invoice.client_state,
      zip: invoice.client_zip,
      company: invoice.client_company,
    },
    items: items.map(i => ({
      description: i.description,
      quantity: i.quantity,
      unit: i.unit,
      unit_price: i.unit_price,
      amount: i.amount,
    })),
    subtotal: invoice.subtotal,
    discount_type: invoice.discount_type,
    discount_value: invoice.discount_value,
    discount_amount: invoice.discount_amount,
    tax_rate: invoice.tax_rate,
    tax_amount: invoice.tax_amount,
    total: invoice.total,
    amount_paid: invoice.amount_paid,
    balance_due: invoice.balance_due,
    notes: invoice.notes,
    terms: invoice.terms,
    footer_text: invoice.footer_text,
  };

  try {
    const pdfBuffer = await generatePDF(templateData);
    const filename = `${invoice.type}-${invoice.number}.pdf`;
    const inline = req.query.inline === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Quote PDF
router.get('/quote/:quoteId', async (req: Request, res: Response) => {
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.quoteId) as any;
  if (!quote) return res.status(404).json({ error: 'Quote not found' });

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(quote.org_id) as any;
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order').all(req.params.quoteId) as any[];

  const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  const logoBase64 = (() => {
    if (!org.logo_url) return undefined;
    const filename = path.basename(org.logo_url);
    const thumbPath = path.resolve(UPLOAD_DIR, `thumb_${filename}`);
    const origPath = path.resolve(UPLOAD_DIR, filename);
    return getLogoBase64(thumbPath) || getLogoBase64(origPath) || undefined;
  })();

  const templateData: InvoiceTemplateData = {
    type: 'quote',
    number: quote.number,
    issue_date: quote.issue_date,
    due_date: quote.expiry_date,
    status: quote.status,
    org: {
      name: org.name, email: org.email, phone: org.phone,
      address: org.address, city: org.city, state: org.state, zip: org.zip, country: org.country,
      website: org.website, logo_base64: logoBase64,
      primary_color: org.primary_color || '#2563EB',
      secondary_color: org.secondary_color || '#1E40AF',
      accent_color: org.accent_color || '#DBEAFE',
      tax_name: org.tax_name || 'Tax',
      currency_symbol: org.currency_symbol || '$',
      bank_name: org.bank_name, bank_account: org.bank_account,
      bank_routing: org.bank_routing, signature_url: org.signature_url,
    },
    client: {
      name: quote.client_name || 'Client',
      email: quote.client_email, phone: quote.client_phone,
      address: quote.client_address, city: quote.client_city,
      state: quote.client_state, zip: quote.client_zip, company: quote.client_company,
    },
    items: items.map(i => ({ description: i.description, quantity: i.quantity, unit: i.unit, unit_price: i.unit_price, amount: i.amount })),
    subtotal: quote.subtotal, discount_type: quote.discount_type, discount_value: quote.discount_value,
    discount_amount: quote.discount_amount, tax_rate: quote.tax_rate, tax_amount: quote.tax_amount,
    total: quote.total, amount_paid: 0, balance_due: quote.total,
    notes: quote.notes, terms: quote.terms, footer_text: quote.footer_text,
  };

  try {
    const pdfBuffer = await generatePDF(templateData);
    const inline = req.query.inline === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="quote-${quote.number}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Quote PDF error:', err);
    res.status(500).json({ error: 'Failed to generate quote PDF' });
  }
});

router.get('/statement/:clientId', async (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).json({ error: 'Authentication required' });
  const org_id = req.auth.orgId;

  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND org_id = ?').get(req.params.clientId, org_id) as any;
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(org_id) as any;
  const logoBase64 = org?.logo_url ? getLogoBase64(org.logo_url) ?? undefined : undefined;

  const invoices = db.prepare(`
    SELECT id, number, type, status, issue_date, due_date, total, amount_paid, paid_date
    FROM invoices
    WHERE org_id = ? AND (client_id = ? OR (client_name = ? AND client_id IS NULL))
    ORDER BY issue_date ASC
  `).all(org_id, req.params.clientId, client.name) as any[];

  const quotes = db.prepare(`
    SELECT id, number, status, issue_date, total
    FROM quotes
    WHERE org_id = ? AND (client_id = ? OR (client_name = ? AND client_id IS NULL))
    ORDER BY issue_date ASC
  `).all(org_id, req.params.clientId, client.name) as any[];

  const sym = org?.currency_symbol || '$';
  const primary = org?.primary_color || '#6366f1';

  const totalInvoiced = invoices.filter(i => i.type === 'invoice').reduce((s, i) => s + (i.total || 0), 0);
  const totalCollected = invoices.filter(i => i.type === 'invoice').reduce((s, i) => s + (i.amount_paid || 0), 0);
  const totalOutstanding = totalInvoiced - totalCollected;
  const totalReceipts = invoices.filter(i => i.type === 'receipt').reduce((s, i) => s + (i.total || 0), 0);

  const fmt = (n: number) => `${sym}${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const statusBadge = (s: string) => {
    const map: Record<string, string> = { paid: '#10b981', overdue: '#ef4444', sent: '#3b82f6', draft: '#94a3b8', accepted: '#10b981', declined: '#ef4444' };
    return `<span style="background:${map[s] || '#94a3b8'}22;color:${map[s] || '#94a3b8'};padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;text-transform:capitalize">${s}</span>`;
  };

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" style="height:48px;object-fit:contain;border-radius:6px" />`
    : `<div style="width:40px;height:40px;background:${primary};border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:18px">${(org?.name || 'K')[0]}</div>`;

  const invoiceRows = invoices.map(inv => `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:10px 12px;font-weight:700;color:#1e293b">${inv.number}</td>
      <td style="padding:10px 12px;color:#64748b;text-transform:capitalize">${inv.type}</td>
      <td style="padding:10px 12px;color:#64748b">${inv.issue_date}</td>
      <td style="padding:10px 12px;color:#64748b">${inv.due_date || '—'}</td>
      <td style="padding:10px 12px;text-align:right;font-weight:700;color:#1e293b">${fmt(inv.total)}</td>
      <td style="padding:10px 12px;text-align:right;color:#10b981;font-weight:700">${fmt(inv.amount_paid || 0)}</td>
      <td style="padding:10px 12px;text-align:right;color:${(inv.total - (inv.amount_paid || 0)) > 0 ? '#ef4444' : '#10b981'};font-weight:700">${fmt(inv.total - (inv.amount_paid || 0))}</td>
      <td style="padding:10px 12px;text-align:center">${statusBadge(inv.status)}</td>
    </tr>
  `).join('');

  const quoteRows = quotes.length > 0 ? `
    <h3 style="font-size:14px;font-weight:800;color:#1e293b;margin:28px 0 12px">Quotes</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Quote #</th>
          <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Date</th>
          <th style="padding:8px 12px;text-align:right;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Value</th>
          <th style="padding:8px 12px;text-align:center;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Status</th>
        </tr>
      </thead>
      <tbody>
        ${quotes.map(q => `
          <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:10px 12px;font-weight:700;color:#1e293b">${q.number}</td>
            <td style="padding:10px 12px;color:#64748b">${q.issue_date}</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;color:#1e293b">${fmt(q.total)}</td>
            <td style="padding:10px 12px;text-align:center">${statusBadge(q.status)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;color:#1e293b}*{box-sizing:border-box}</style>
  </head><body style="padding:40px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
      ${logoHtml}
      <div style="text-align:right">
        <div style="font-size:22px;font-weight:900;color:#1e293b">Statement of Account</div>
        <div style="color:#64748b;font-size:12px;margin-top:4px">Generated ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-bottom:28px">
      <div>
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Prepared by</div>
        <div style="font-weight:800;color:#1e293b">${org?.name || ''}</div>
        ${org?.email ? `<div style="color:#64748b;font-size:12px">${org.email}</div>` : ''}
        ${org?.phone ? `<div style="color:#64748b;font-size:12px">${org.phone}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Prepared for</div>
        <div style="font-weight:800;color:#1e293b">${client.name}</div>
        ${client.company ? `<div style="color:#64748b;font-size:12px">${client.company}</div>` : ''}
        ${client.email ? `<div style="color:#64748b;font-size:12px">${client.email}</div>` : ''}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px">
      ${[
        { label: 'Total Invoiced', value: fmt(totalInvoiced), color: '#1e293b' },
        { label: 'Amount Collected', value: fmt(totalCollected), color: '#10b981' },
        { label: 'Balance Due', value: fmt(totalOutstanding), color: totalOutstanding > 0 ? '#ef4444' : '#10b981' },
        { label: 'Receipts Issued', value: fmt(totalReceipts), color: '#6366f1' },
      ].map(s => `
        <div style="background:#f8fafc;border-radius:10px;padding:14px">
          <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${s.label}</div>
          <div style="font-size:18px;font-weight:900;color:${s.color}">${s.value}</div>
        </div>
      `).join('')}
    </div>

    <h3 style="font-size:14px;font-weight:800;color:#1e293b;margin:0 0 12px">Invoices & Receipts</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Number</th>
          <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Type</th>
          <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Date</th>
          <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Due</th>
          <th style="padding:8px 12px;text-align:right;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Amount</th>
          <th style="padding:8px 12px;text-align:right;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Paid</th>
          <th style="padding:8px 12px;text-align:right;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Balance</th>
          <th style="padding:8px 12px;text-align:center;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Status</th>
        </tr>
      </thead>
      <tbody>${invoiceRows || '<tr><td colspan="8" style="padding:20px;text-align:center;color:#94a3b8">No documents</td></tr>'}</tbody>
    </table>

    ${quoteRows}

    <div style="margin-top:40px;padding-top:20px;border-top:2px solid ${primary};display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:11px;color:#94a3b8">Generated by KraaFo · kraafo.com</div>
      <div style="font-size:16px;font-weight:900;color:${totalOutstanding > 0 ? '#ef4444' : '#10b981'}">
        Balance Due: ${fmt(totalOutstanding)}
      </div>
    </div>
  </body></html>`;

  try {
    const { generatePDFFromHTML } = await import('../services/pdfService');
    const pdfBuffer = await generatePDFFromHTML(html);
    const inline = req.query.inline === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="statement-${client.name.replace(/\s+/g, '-')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Statement PDF error:', err);
    res.status(500).json({ error: 'Failed to generate statement PDF' });
  }
});

// Guest PDF download - no account required.
// Protected by Turnstile (when configured) + IP rate limit.
router.post('/guest', guestPdfLimiter, async (req: Request, res: Response) => {
  const { cf_turnstile_response, type, number, issue_date, due_date, paid_date, status,
          org: orgData, client: clientData, items: itemsData,
          subtotal, discount_type, discount_value, discount_amount,
          tax_rate, tax_amount, total, amount_paid, balance_due,
          notes, terms, footer_text } = req.body;

  if (!type || !['invoice', 'receipt', 'quote'].includes(type)) {
    return res.status(400).json({ error: 'Invalid document type' });
  }

  // Verify Turnstile when configured; skip in dev (no secret set)
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
  const human = await verifyTurnstile(cf_turnstile_response, ip);
  if (!human) return res.status(403).json({ error: 'Bot check failed - please try again.' });

  try {
    const safeItems = Array.isArray(itemsData)
      ? itemsData.slice(0, 50).map((it: any) => ({
          description: String(it.description || '').slice(0, 500),
          quantity: Number(it.quantity) || 1,
          unit: String(it.unit || 'unit').slice(0, 50),
          unit_price: Number(it.unit_price) || 0,
          amount: Number(it.amount) || 0,
        }))
      : [];

    const templateData: InvoiceTemplateData = {
      type: type as 'invoice' | 'receipt' | 'quote',
      number: String(number || 'DRAFT').slice(0, 50),
      issue_date: String(issue_date || ''),
      due_date: due_date ? String(due_date) : undefined,
      paid_date: paid_date ? String(paid_date) : undefined,
      status: String(status || 'draft'),
      org: {
        name: String(orgData?.name || 'Your Business').slice(0, 200),
        email: orgData?.email ? String(orgData.email).slice(0, 200) : undefined,
        phone: orgData?.phone ? String(orgData.phone).slice(0, 50) : undefined,
        address: orgData?.address ? String(orgData.address).slice(0, 300) : undefined,
        city: orgData?.city ? String(orgData.city).slice(0, 100) : undefined,
        state: orgData?.state ? String(orgData.state).slice(0, 100) : undefined,
        zip: orgData?.zip ? String(orgData.zip).slice(0, 20) : undefined,
        country: orgData?.country ? String(orgData.country).slice(0, 100) : undefined,
        website: orgData?.website ? String(orgData.website).slice(0, 200) : undefined,
        primary_color: /^#[0-9a-fA-F]{6}$/.test(orgData?.primary_color) ? orgData.primary_color : '#2563EB',
        secondary_color: /^#[0-9a-fA-F]{6}$/.test(orgData?.secondary_color) ? orgData.secondary_color : '#1E40AF',
        accent_color: /^#[0-9a-fA-F]{6}$/.test(orgData?.accent_color) ? orgData.accent_color : '#DBEAFE',
        tax_name: String(orgData?.tax_name || 'Tax').slice(0, 50),
        currency_symbol: String(orgData?.currency_symbol || '$').slice(0, 5),
      },
      client: {
        name: String(clientData?.name || '').slice(0, 200),
        email: clientData?.email ? String(clientData.email).slice(0, 200) : undefined,
        phone: clientData?.phone ? String(clientData.phone).slice(0, 50) : undefined,
        address: clientData?.address ? String(clientData.address).slice(0, 300) : undefined,
        city: clientData?.city ? String(clientData.city).slice(0, 100) : undefined,
        state: clientData?.state ? String(clientData.state).slice(0, 100) : undefined,
        zip: clientData?.zip ? String(clientData.zip).slice(0, 20) : undefined,
        company: clientData?.company ? String(clientData.company).slice(0, 200) : undefined,
      },
      items: safeItems,
      subtotal: Number(subtotal) || 0,
      discount_type: String(discount_type || 'none'),
      discount_value: Number(discount_value) || 0,
      discount_amount: Number(discount_amount) || 0,
      tax_rate: Number(tax_rate) || 0,
      tax_amount: Number(tax_amount) || 0,
      total: Number(total) || 0,
      amount_paid: Number(amount_paid) || 0,
      balance_due: Number(balance_due) || 0,
      notes: notes ? String(notes).slice(0, 2000) : undefined,
      terms: terms ? String(terms).slice(0, 2000) : undefined,
      footer_text: footer_text ? String(footer_text).slice(0, 500) : undefined,
    };

    const pdfBuffer = await generatePDF(templateData);
    const docLabel = type === 'receipt' ? 'receipt' : type === 'quote' ? 'quote' : 'invoice';
    const filename = `${docLabel}-${(number || 'draft').toString().replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Guest PDF error:', err);
    res.status(500).json({ error: 'Failed to generate PDF - please try again.' });
  }
});

router.post('/preview', async (req: Request, res: Response) => {
  const { invoiceData } = req.body;
  if (!invoiceData) return res.status(400).json({ error: 'invoiceData required' });

  try {
    const pdfBuffer = await generatePDF(invoiceData as InvoiceTemplateData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate preview PDF' });
  }
});

export default router;
