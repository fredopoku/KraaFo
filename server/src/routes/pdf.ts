import { Router, Request, Response } from 'express';
import db from '../db/schema';
import { generatePDF } from '../services/pdfService';
import { getLogoBase64 } from '../services/imageService';
import { InvoiceTemplateData } from '../templates/invoiceTemplate';
import path from 'path';
import QRCode from 'qrcode';

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
