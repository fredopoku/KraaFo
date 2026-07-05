import { Router, Request, Response } from 'express';
import { generateKeyPairSync } from 'crypto';
import rateLimit from 'express-rate-limit';
import db from '../db/schema';
import { sendInvoiceEmail } from '../services/emailService';
import { formatMoney } from '../utils/formatMoney';

const router = Router();

// Per-account rate limiters for email delivery — protect shared Resend reputation.
// Keyed on org ID so limits are per sender, not per IP (shared offices / VPNs).
const emailHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req: Request) => (req.auth?.orgId ?? req.ip) as string,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Send limit reached — you can send up to 20 emails per hour. Please wait before sending again.' },
  skipSuccessfulRequests: false,
});

const emailDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 100,
  keyGenerator: (req: Request) => `day:${req.auth?.orgId ?? req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Daily send limit reached — you can send up to 100 emails per day.' },
  skipSuccessfulRequests: false,
});

// Send invoice/receipt by email
router.post('/email/:invoiceId', emailHourlyLimiter, emailDailyLimiter, async (req: Request, res: Response) => {
  const { to, message } = req.body;
  if (!to) return res.status(400).json({ error: 'Recipient email required' });

  const doc = (db.prepare('SELECT org_id FROM invoices WHERE id = ?').get(req.params.invoiceId)
    ?? db.prepare('SELECT org_id FROM quotes WHERE id = ?').get(req.params.invoiceId)) as any;
  if (!doc || doc.org_id !== req.auth!.orgId) return res.status(404).json({ error: 'Document not found' });

  try {
    await sendInvoiceEmail(req.params.invoiceId, to, message);
    // Update whichever table owns this document
    const inv = db.prepare("UPDATE invoices SET status = 'sent', updated_at = datetime('now') WHERE id = ? AND status = 'draft'")
      .run(req.params.invoiceId);
    if (inv.changes === 0) {
      db.prepare("UPDATE quotes SET status = 'sent', updated_at = datetime('now') WHERE id = ? AND status = 'draft'")
        .run(req.params.invoiceId);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Generate WhatsApp link for invoice
router.get('/whatsapp/:invoiceId', (req: Request, res: Response) => {
  const invoice = (db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.invoiceId)
    ?? db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.invoiceId)) as any;
  if (!invoice || invoice.org_id !== req.auth!.orgId) return res.status(404).json({ error: 'Document not found' });

  const isQuote = !invoice.type || invoice.type === 'quote';
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(invoice.org_id) as any;
  const sym = org.currency_symbol || '$';
  const docType = isQuote ? 'Quote' : invoice.type === 'receipt' ? 'Receipt' : 'Invoice';
  const orgName = (org.name as string).trim();

  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kraafo.com';
  const pdfUrl = isQuote
    ? `${FRONTEND_URL}/api/pdf/quote/${invoice.id}`
    : `${FRONTEND_URL}/api/pdf/${invoice.id}`;

  const message = encodeURIComponent(
    `Hi${invoice.client_name ? ' ' + invoice.client_name.trim() : ''},\n\n` +
    `Please find your ${docType.toLowerCase()} from ${orgName}.\n\n` +
    `📄 ${docType}: *${invoice.number}*\n` +
    `💰 Total: *${formatMoney(invoice.total ?? 0, sym)}*\n` +
    (invoice.due_date ? `📅 Due: *${invoice.due_date}*\n` : '') +
    `\n👉 View & download: ${pdfUrl}\n\n` +
    `Thank you for your business!\n` +
    `— ${orgName}`
  );

  // If org has a WhatsApp number, use it as recipient
  const phone = invoice.client_phone?.replace(/\D/g, '') || '';
  const url = phone
    ? `https://wa.me/${phone}?text=${message}`
    : `https://wa.me/?text=${message}`;

  res.json({ url, message: decodeURIComponent(message) });
});

// Get mobile money payment details for an invoice or quote
router.get('/payment-links/:invoiceId', (req: Request, res: Response) => {
  const invoice = (db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.invoiceId)
    ?? db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.invoiceId)) as any;
  if (!invoice || invoice.org_id !== req.auth!.orgId) return res.status(404).json({ error: 'Document not found' });

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(invoice.org_id) as any;
  const sym = org.currency_symbol || '$';
  const amount = invoice.balance_due || invoice.total || 0;
  const ref = invoice.number;

  const links: Record<string, unknown> = {};

  if (org.paypal_email) {
    links.paypal = `https://www.paypal.com/paypalme/${org.paypal_email.split('@')[0]}/${amount}`;
  }
  if (org.mpesa_number) {
    links.mpesa = { number: org.mpesa_number, amount, reference: ref, instructions: `Send ${formatMoney(amount, sym)} to M-Pesa number ${org.mpesa_number}. Use reference: ${ref}` };
  }
  if (org.mtn_number) {
    links.mtn = { number: org.mtn_number, amount, reference: ref, instructions: `Send ${formatMoney(amount, sym)} to MTN Mobile Money ${org.mtn_number}. Reference: ${ref}` };
  }
  if (org.airtel_number) {
    links.airtel = { number: org.airtel_number, amount, reference: ref, instructions: `Send ${formatMoney(amount, sym)} to Airtel Money ${org.airtel_number}. Reference: ${ref}` };
  }
  if (org.telecel_number) {
    links.telecel = { number: org.telecel_number, amount, reference: ref, instructions: `Send ${formatMoney(amount, sym)} to Telecel Cash ${org.telecel_number}. Reference: ${ref}` };
  }

  res.json({ amount, currency_symbol: sym, reference: ref, links });
});

// Generate a DKIM key pair for an org
router.post('/generate-dkim', (req: Request, res: Response) => {
  const { selector = 'krafo', domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'domain is required' });

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // Strip PEM headers to get the raw base64 public key for the DNS TXT record
  const pubKeyBase64 = publicKey
    .replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '');

  const dnsRecord = `v=DKIM1; k=rsa; p=${pubKeyBase64}`;
  const dnsName = `${selector}._domainkey.${domain}`;

  res.json({ privateKey, publicKey, dnsRecord, dnsName, selector, domain });
});

// Send a test email to verify SMTP + DKIM config
router.post('/test-email', async (req: Request, res: Response) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'to is required' });

  const org_id = req.auth!.orgId;
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(org_id) as any;
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  if (!org.smtp_host || !org.smtp_user) return res.status(400).json({ error: 'SMTP not configured' });

  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: org.smtp_host,
      port: org.smtp_port || 587,
      secure: org.smtp_port === 465,
      auth: { user: org.smtp_user, pass: org.smtp_pass },
    });

    const mailOptions: any = {
      from: `"${org.name}" <${org.smtp_from || org.smtp_user}>`,
      to,
      subject: `Test email from ${org.name} via KraaFo`,
      text: `This is a test email confirming your email delivery is working correctly.\n\nSent from ${org.name} via KraaFo — Professional Invoicing.`,
      headers: { 'X-Mailer': 'KraaFo Professional Invoicing' },
    };

    if (org.dkim_private_key && org.dkim_selector && org.dkim_domain) {
      mailOptions.dkim = {
        domainName: org.dkim_domain,
        keySelector: org.dkim_selector,
        privateKey: org.dkim_private_key,
      };
    }

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
