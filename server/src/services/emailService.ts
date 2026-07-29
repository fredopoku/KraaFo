import { Resend } from 'resend';
import path from 'path';
import db from '../db/schema';
import { generatePDF } from './pdfService';
import { getLogoBase64 } from './imageService';
import QRCode from 'qrcode';
import { formatMoney } from '../utils/formatMoney';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const FROM_ADDRESS = process.env.RESEND_FROM || 'invoices@kraafo.com';
// Marketing identity (welcome, newsletter, lifecycle) - separate Resend domain so inbox placement
// for transactional invoice mail is not contaminated by marketing reputation.
const MARKETING_FROM = process.env.RESEND_MARKETING_FROM || FROM_ADDRESS;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kraafo.com';

export async function sendInvoiceEmail(
  invoiceId: string,
  recipientEmail: string,
  customMessage?: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Email not configured - RESEND_API_KEY missing');

  let invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;
  let isQuote = false;

  if (!invoice) {
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(invoiceId) as any;
    if (!quote) throw new Error('Document not found');
    invoice = { ...quote, type: 'quote', due_date: quote.expiry_date };
    isQuote = true;
  }

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(invoice.org_id) as any;
  if (!org) throw new Error('Organization not found');

  const items = isQuote
    ? db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order').all(invoiceId) as any[]
    : db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order').all(invoiceId) as any[];
  const docType = isQuote ? 'Quote' : invoice.type === 'receipt' ? 'Receipt' : 'Invoice';
  const sym = org.currency_symbol || '$';

  const logoBase64 = (() => {
    if (!org.logo_url) return undefined;
    const filename = path.basename(org.logo_url);
    const thumbPath = path.resolve(UPLOAD_DIR, `thumb_${filename}`);
    const origPath = path.resolve(UPLOAD_DIR, filename);
    return getLogoBase64(thumbPath) || getLogoBase64(origPath) || undefined;
  })();

  let paymentQrSvg: string | undefined;
  if (invoice.type !== 'receipt') {
    const payUrl = org.paypal_email
      ? `https://paypal.me/${org.paypal_email.split('@')[0]}/${(invoice.total || 0).toFixed(2)}`
      : org.mpesa_number ? `tel:${org.mpesa_number}` : null;
    if (payUrl) {
      paymentQrSvg = await QRCode.toString(payUrl, { type: 'svg', width: 80, margin: 1 }).catch(() => undefined);
    }
  }

  const pdfBuffer = await generatePDF({
    type: invoice.type,
    number: invoice.number,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    paid_date: invoice.paid_date,
    status: invoice.status,
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
      currency_symbol: sym,
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
    payment_qr_svg: paymentQrSvg,
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
    items: items.map(i => ({ description: i.description, quantity: i.quantity, unit: i.unit, unit_price: i.unit_price, amount: i.amount })),
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
  } as any);

  const defaultMsg = [
    `Dear ${invoice.client_name || 'Valued Client'},`,
    ``,
    `Please find attached ${docType} No. ${invoice.number} from ${org.name}.`,
    ``,
    `Kindly review the attached PDF for the complete breakdown of services and payment details.`,
    ``,
    `Amount Due: ${formatMoney(invoice.total ?? 0, sym)}`,
    ...(invoice.due_date ? [`Payment Due By: ${invoice.due_date}`] : []),
    ``,
    `Should you have any questions or require clarification, please do not hesitate to contact us.`,
    ``,
    `Thank you for your business.`,
    ``,
    `Kind regards,`,
    org.name,
    ...(org.email ? [org.email] : []),
    ...(org.phone ? [org.phone] : []),
    ``,
    `--`,
    `This ${docType.toLowerCase()} was generated via KraaFo - Professional Invoicing`,
  ].join('\n');

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${org.name} <${FROM_ADDRESS}>`,
    replyTo: org.email || FROM_ADDRESS,
    to: [recipientEmail],
    subject: `${docType} ${invoice.number} from ${org.name}`,
    text: customMessage || defaultMsg,
    html: buildEmailHtml(invoice, org, customMessage || defaultMsg, docType, sym),
    attachments: [{
      filename: `${invoice.type}-${invoice.number}.pdf`,
      content: pdfBuffer.toString('base64'),
    }],
  });

  if (error) throw new Error(error.message);
}

export async function sendSubscriberWelcome(email: string, name?: string, token?: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const greeting = name ? `, ${name}` : '';
  await resend.emails.send({
    from: `KraaFo <${MARKETING_FROM}>`,
    to: [email],
    subject: "You're subscribed to KraaFo updates!",
    text: `Welcome${greeting}!\n\nYou're now subscribed to KraaFo updates. We'll keep you in the loop whenever we ship new features, improvements, and tips.\n\nBest,\nThe KraaFo Team`,
    html: buildWelcomeHtml(email, name, token),
  });
}

export async function sendBroadcast(subject: string, body: string): Promise<{ sent: number; failed: number }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Email not configured - RESEND_API_KEY missing');
  const subscribers = db.prepare("SELECT * FROM subscribers WHERE unsubscribed_at IS NULL").all() as any[];
  if (!subscribers.length) throw new Error('No active subscribers');
  const resend = new Resend(apiKey);
  let sent = 0;
  let failed = 0;
  for (const sub of subscribers) {
    try {
      await resend.emails.send({
        from: `KraaFo <${MARKETING_FROM}>`,
        to: [sub.email],
        subject,
        html: buildBroadcastHtml(body, sub.token),
        text: body,
      });
      sent++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}

function emailShell(headerBg: string, headerText: string, headerSub: string, body: string, footer: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr><td style="background:#ffffff;padding:18px 40px;text-align:center;border-bottom:1px solid #f3f4f6">
          <img src="https://kraafo.com/krafo-logo.png" alt="KraaFo" width="28" height="28" style="display:inline-block;height:28px;width:auto;vertical-align:middle;margin-right:8px">
          <span style="vertical-align:middle;font-size:19px;font-weight:900;color:#111827;letter-spacing:-0.5px">Kraa<span style="color:#4f46e5">Fo</span></span>
        </td></tr>
        <tr><td style="background:${headerBg};padding:28px 40px;text-align:center">
          <p style="margin:0;color:#fff;font-size:21px;font-weight:800;letter-spacing:-0.5px">${headerText}</p>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px">${headerSub}</p>
        </td></tr>
        <tr><td style="padding:36px 40px">${body}</td></tr>
        <tr><td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #f3f4f6">
          <p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.6">The KraaFo Team<br>
            <a href="${FRONTEND_URL}" style="color:#4f46e5;text-decoration:none;font-weight:600">kraafo.com</a>
          </p>
          <p style="margin:0;color:#9ca3af;font-size:11px">${footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function cta(href: string, label: string): string {
  return `<div style="text-align:center;margin:28px 0 8px"><a href="${href}" style="display:inline-block;background:#4f46e5;color:#fff;padding:13px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;letter-spacing:-0.2px">${label}</a></div>`;
}

function step(n: string, title: string, desc: string): string {
  return `<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px">
    <div style="background:#4f46e5;color:#fff;font-size:11px;font-weight:800;padding:4px 8px;border-radius:6px;shrink:0;min-width:24px;text-align:center">${n}</div>
    <div><p style="margin:0;font-size:14px;font-weight:700;color:#111827">${title}</p><p style="margin:2px 0 0;font-size:13px;color:#6b7280">${desc}</p></div>
  </div>`;
}

function buildWelcomeHtml(email: string, name?: string, token?: string): string {
  const display = name || 'there';
  const unsubUrl = token ? `${FRONTEND_URL}/unsubscribe?token=${token}` : `${FRONTEND_URL}/unsubscribe`;
  const body = `
    <p style="margin:0 0 6px;font-size:22px">👋</p>
    <h2 style="margin:0 0 12px;color:#111827;font-size:19px;font-weight:800">Welcome, ${display}!</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.7">You're now on the KraaFo list. Here's what we do - and what you can start doing right now.</p>
    <p style="margin:0 0 8px;color:#374151;font-size:15px;font-weight:700">KraaFo lets you:</p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#6b7280;font-size:14px;line-height:2">
      <li>Create professional invoices, receipts &amp; quotes in under 2 minutes</li>
      <li>Send them by <strong style="color:#374151">WhatsApp, email or SMS</strong> - directly from the app</li>
      <li>Support mobile money: M-Pesa, MTN, Airtel, Telecel</li>
      <li>Work in any currency, in any country</li>
    </ul>
    <p style="margin:0 0 4px;color:#374151;font-size:14px;font-weight:700">Ready to try it?</p>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Takes 2 minutes to set up. Free to use - no card, no catch.</p>
    ${cta(`${FRONTEND_URL}/setup`, 'Create my first invoice →')}
    <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;text-align:center">Or <a href="${FRONTEND_URL}/generator?demo=true" style="color:#6b7280">try the live demo first</a> - no account needed.</p>
  `;
  return emailShell('#4f46e5', 'You\'re in - let\'s get you paid. 🎉', 'KraaFo · Professional Invoicing', body,
    `You subscribed with ${email}. &nbsp;·&nbsp; <a href="${unsubUrl}" style="color:#6b7280">Unsubscribe</a>`);
}

// ── Org onboarding emails ────────────────────────────────────────

export async function sendOrgWelcome(org: any): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !org.email || org.email_unsubscribed) return;
  const resend = new Resend(apiKey);
  const name = org.name || 'there';
  const body = `
    <p style="margin:0 0 6px;font-size:22px">🚀</p>
    <h2 style="margin:0 0 12px;color:#111827;font-size:19px;font-weight:800">Your KraaFo account is live, ${name}!</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.7">You're set up and ready to go. Here's how to send your first invoice in the next 2 minutes:</p>
    ${step('1', 'Open the Generator', 'Click the button below - you\'re already logged in.')}
    ${step('2', 'Build your invoice your way', 'Type in your own services and prices, or hit Smart Fill to auto-fill line items for your industry. Either way works.')}
    ${step('3', 'Send it', 'Download the PDF, or send directly by WhatsApp or email - right from the app.')}
    ${cta(`${FRONTEND_URL}/generator`, 'Create my first invoice →')}
    <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;text-align:center">Free to use. No card required.</p>
  `;
  await resend.emails.send({
    from: `KraaFo <${FROM_ADDRESS}>`,
    to: [org.email],
    subject: `Welcome to KraaFo, ${name} - your first invoice awaits`,
    html: emailShell('#4f46e5', `You\'re all set, ${name} 🎉`, 'KraaFo · Professional Invoicing', body,
      `This email was sent to ${org.email} because you created a KraaFo account. &nbsp;·&nbsp; <a href="${FRONTEND_URL}" style="color:#6b7280">kraafo.com</a>`),
  });
  db.prepare('UPDATE organizations SET welcome_email_sent = 1 WHERE id = ?').run(org.id);
}

export async function sendDay2Email(org: any): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !org.email || org.email_unsubscribed) return;
  const resend = new Resend(apiKey);
  const name = org.name || 'there';
  const body = `
    <p style="margin:0 0 12px;color:#6b7280;font-size:15px;line-height:1.7">Hey ${name},</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7">You signed up for KraaFo but haven't sent your first invoice yet - no worries, it happens. Here's the fastest way to get started:</p>
    ${step('1', 'Go to the Generator', 'One click and you\'re on the invoice screen.')}
    ${step('2', 'Click Smart Fill', 'Pick your industry - cleaning, plumbing, consulting, whatever you do - and your invoice fills itself.')}
    ${step('3', 'Send by WhatsApp', 'Tap Send, choose WhatsApp. Your client gets a professional PDF in their chat. Done.')}
    <p style="margin:24px 0 8px;color:#374151;font-size:15px;font-weight:700">That's it. No complicated setup.</p>
    ${cta(`${FRONTEND_URL}/generator`, 'Send my first invoice now →')}
    <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;text-align:center">Still free. Still takes 2 minutes.</p>
  `;
  await resend.emails.send({
    from: `KraaFo <${FROM_ADDRESS}>`,
    to: [org.email],
    subject: 'Your first invoice is 2 minutes away',
    html: emailShell('#1e1b4b', 'Still with us? 👀', 'Let\'s get your first invoice out', body,
      `Sent to ${org.email} · <a href="${FRONTEND_URL}" style="color:#6b7280">kraafo.com</a>`),
  });
  db.prepare('UPDATE organizations SET day2_email_sent = 1 WHERE id = ?').run(org.id);
}

export async function sendDay4Email(org: any): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !org.email || org.email_unsubscribed) return;
  const resend = new Resend(apiKey);
  const name = org.name || 'there';
  const body = `
    <p style="margin:0 0 12px;color:#6b7280;font-size:15px;line-height:1.7">Hey ${name},</p>
    <p style="margin:0 0 8px;color:#374151;font-size:17px;font-weight:800;line-height:1.4">We know what you might be thinking - what's the catch with KraaFo being free?</p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.7">There isn't one.</p>
    <p style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:700">Here's what's free to use:</p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#6b7280;font-size:14px;line-height:2.2">
      <li>Unlimited invoices, receipts &amp; quotes</li>
      <li>WhatsApp, email &amp; SMS delivery</li>
      <li>PDF generation &amp; download</li>
      <li>Your logo, brand colors, custom prefix</li>
      <li>Multi-currency &amp; mobile money support</li>
      <li>Client management</li>
      <li>Document history</li>
    </ul>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.7">We're building our user base first. When premium features arrive later, you'll get early access and early pricing - because you were here first.</p>
    ${cta(`${FRONTEND_URL}/generator`, 'Start invoicing - it\'s free →')}
  `;
  await resend.emails.send({
    from: `KraaFo <${MARKETING_FROM}>`,
    to: [org.email],
    subject: "The catch? There isn't one.",
    html: emailShell('#059669', 'No catch - here\'s what you get 💚', 'KraaFo · Free to use', body,
      `Sent to ${org.email} · <a href="${FRONTEND_URL}" style="color:#6b7280">kraafo.com</a>`),
  });
  db.prepare('UPDATE organizations SET day4_email_sent = 1 WHERE id = ?').run(org.id);
}

export async function sendDay7Email(org: any): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !org.email || org.email_unsubscribed) return;
  const resend = new Resend(apiKey);
  const name = org.name || 'there';
  const body = `
    <p style="margin:0 0 12px;color:#6b7280;font-size:15px;line-height:1.7">Hey ${name},</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7">It's been a week since you joined KraaFo. Life gets busy - we get it. That's exactly why KraaFo exists.</p>
    <p style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:700">Businesses using KraaFo are:</p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#6b7280;font-size:14px;line-height:2.2">
      <li>Sending invoices by <strong style="color:#374151">WhatsApp in under 60 seconds</strong></li>
      <li>Getting paid faster - clients open WhatsApp, they don't open email</li>
      <li>Looking completely professional without expensive software</li>
      <li>Tracking every invoice, receipt and quote in one place</li>
    </ul>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.7">Give it one try. If it doesn't work for you, no hard feelings - but it takes 2 minutes to find out.</p>
    ${cta(`${FRONTEND_URL}/generator`, 'Give it one try →')}
    <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;text-align:center">Free to use. Nothing to lose.</p>
  `;
  await resend.emails.send({
    from: `KraaFo <${MARKETING_FROM}>`,
    to: [org.email],
    subject: 'Quick question about your invoicing',
    html: emailShell('#7c3aed', 'One week in 👋', 'A quick note from KraaFo', body,
      `Sent to ${org.email} · <a href="${FRONTEND_URL}" style="color:#6b7280">kraafo.com</a>`),
  });
  db.prepare('UPDATE organizations SET day7_email_sent = 1 WHERE id = ?').run(org.id);
}

export async function sendPaymentReminder(invoice: any, org: any, daysOverdue: number): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !invoice.client_email) return;

  const resend = new Resend(apiKey);
  const sym = org.currency_symbol || '$';
  const outstanding = formatMoney(invoice.total - (invoice.amount_paid || 0), sym);
  const viewUrl = `${FRONTEND_URL}/view/${invoice.id}`;

  const urgency = daysOverdue <= 1
    ? { subject: `Friendly reminder: Invoice ${invoice.number} is due`, tone: 'gentle' }
    : daysOverdue <= 7
    ? { subject: `Invoice ${invoice.number} is overdue - ${outstanding} outstanding`, tone: 'firm' }
    : { subject: `Final reminder: Invoice ${invoice.number} - ${outstanding} unpaid`, tone: 'urgent' };

  const body = daysOverdue <= 1 ? `
    <p style="margin:0 0 16px;color:#374151;font-size:15px">Hi ${invoice.client_name || 'there'},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px">
      This is a friendly reminder that invoice <strong>${invoice.number}</strong> from <strong>${org.name}</strong>
      for <strong>${outstanding}</strong> was due today.
    </p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px">If you've already sent payment, please ignore this message. Otherwise, you can view your invoice below.</p>
    ${cta(viewUrl, 'View Invoice')}
  ` : daysOverdue <= 7 ? `
    <p style="margin:0 0 16px;color:#374151;font-size:15px">Hi ${invoice.client_name || 'there'},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px">
      Invoice <strong>${invoice.number}</strong> from <strong>${org.name}</strong> is now <strong>${daysOverdue} days overdue</strong>.
      The outstanding balance is <strong>${outstanding}</strong>.
    </p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px">Please arrange payment at your earliest convenience.</p>
    ${cta(viewUrl, 'View & Pay Invoice')}
  ` : `
    <p style="margin:0 0 16px;color:#374151;font-size:15px">Hi ${invoice.client_name || 'there'},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px">
      This is a final reminder for invoice <strong>${invoice.number}</strong> from <strong>${org.name}</strong>.
      This invoice is <strong>${daysOverdue} days overdue</strong> with <strong>${outstanding}</strong> unpaid.
    </p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px">Please contact ${org.name} immediately to resolve this.</p>
    ${cta(viewUrl, 'View Invoice')}
  `;

  await resend.emails.send({
    from: org.email ? `${org.name} via KraaFo <${FROM_ADDRESS}>` : `${org.name} <${FROM_ADDRESS}>`,
    to: [invoice.client_email],
    replyTo: org.email || undefined,
    subject: urgency.subject,
    html: emailShell(
      daysOverdue > 7 ? '#dc2626' : daysOverdue > 1 ? '#d97706' : '#4f46e5',
      urgency.subject,
      `From ${org.name}`,
      body,
      `Sent on behalf of ${org.name} via KraaFo &mdash; Professional Invoicing`
    ),
  });
}

function buildBroadcastHtml(body: string, unsubToken: string): string {
  const unsubUrl = `${FRONTEND_URL}/unsubscribe?token=${unsubToken}`;
  const formatted = body.replace(/\n\n/g, '</p><p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.8">').replace(/\n/g, '<br>');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr><td style="background:#ffffff;padding:20px 40px;text-align:center;border-bottom:1px solid #f3f4f6">
          <img src="https://kraafo.com/krafo-logo.png" alt="KraaFo" width="28" height="28" style="display:inline-block;height:28px;width:auto;vertical-align:middle;margin-right:8px">
          <span style="vertical-align:middle;font-size:19px;font-weight:900;color:#111827;letter-spacing:-0.5px">Kraa<span style="color:#4f46e5">Fo</span></span>
        </td></tr>
        <tr><td style="background:#4f46e5;padding:24px 40px">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px">Platform Update</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;text-transform:uppercase;letter-spacing:1px">From the KraaFo team</p>
        </td></tr>
        <tr><td style="padding:36px 40px">
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.8">${formatted}</p>
        </td></tr>
        <tr><td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center">
          <p style="margin:0;color:#9ca3af;font-size:12px">KraaFo - Professional Invoicing Platform &nbsp;·&nbsp; <a href="${unsubUrl}" style="color:#6b7280">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildEmailHtml(invoice: any, org: any, message: string, docType: string, sym: string): string {
  const color = org.primary_color || '#2563EB';
  const formatDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${docType} ${invoice.number}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- KraaFo brand strip -->
        <tr>
          <td style="background:#ffffff;padding:14px 40px;text-align:center;border-bottom:1px solid #f3f4f6">
            <img src="https://kraafo.com/krafo-logo.png" alt="KraaFo" width="22" height="22" style="display:inline-block;height:22px;width:auto;vertical-align:middle;margin-right:6px">
            <span style="vertical-align:middle;font-size:15px;font-weight:900;color:#111827;letter-spacing:-0.3px">Kraa<span style="color:#4f46e5">Fo</span></span>
            <span style="vertical-align:middle;color:#d1d5db;margin:0 8px">·</span>
            <span style="vertical-align:middle;color:#9ca3af;font-size:12px">Professional Invoicing</span>
          </td>
        </tr>

        <!-- Header -->
        <tr>
          <td style="background:${color};padding:32px 40px">
            <p style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px">${org.name}</p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px">${docType} · ${invoice.number}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px">
            <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.7;white-space:pre-line">${message}</p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="color:#6b7280;font-size:13px">${docType} Number:</td>
                      <td align="right" style="color:#111827;font-size:13px;font-weight:700">${invoice.number}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              ${invoice.issue_date ? `
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="color:#6b7280;font-size:13px">Date:</td>
                      <td align="right" style="color:#111827;font-size:13px">${formatDate(invoice.issue_date)}</td>
                    </tr>
                  </table>
                </td>
              </tr>` : ''}

              ${invoice.due_date ? `
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="color:#6b7280;font-size:13px">Due Date:</td>
                      <td align="right" style="color:#dc2626;font-size:13px;font-weight:700">${formatDate(invoice.due_date)}</td>
                    </tr>
                  </table>
                </td>
              </tr>` : ''}

              <tr>
                <td style="padding:18px 20px;background:#fafafa">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="color:#111827;font-size:15px;font-weight:800">Total Due:</td>
                      <td align="right" style="color:${color};font-size:20px;font-weight:900">${formatMoney(invoice.total ?? 0, sym)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <div style="margin:24px 0 0;text-align:center">
              <a href="${FRONTEND_URL}/view/${invoice.id}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:11px 24px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:-0.1px">View ${docType} Online →</a>
            </div>
            <p style="margin:12px 0 0;color:#9ca3af;font-size:12px;text-align:center">
              The full PDF is also attached for your records.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center">
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 10px">
              <tr>
                <td style="padding-right:8px;vertical-align:middle">
                  <img src="https://kraafo.com/krafo-logo.png" alt="KraaFo" width="22" height="22" style="display:block;width:22px;height:22px;border-radius:4px">
                </td>
                <td style="vertical-align:middle">
                  <span style="font-size:14px;font-weight:900;color:#374151;letter-spacing:-0.3px">Kraa<span style="color:#4f46e5">Fo</span></span>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.6">Professional Invoicing &mdash; <a href="${FRONTEND_URL}" style="color:#6b7280;text-decoration:none">kraafo.com</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordReset(org: any, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px">Hi ${org.name || 'there'},</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7">
      We received a request to reset your KraaFo password. Use the code below - it expires in <strong>1 hour</strong>.
    </p>
    <div style="text-align:center;margin:28px 0">
      <div style="display:inline-block;background:#f3f4f6;border:2px dashed #d1d5db;border-radius:12px;padding:20px 36px">
        <p style="margin:0 0 4px;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Your reset code</p>
        <p style="margin:0;color:#111827;font-size:36px;font-weight:900;letter-spacing:8px">${code}</p>
      </div>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-align:center">Enter this code on the KraaFo sign-in page along with your new password.</p>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;text-align:center">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
  `;
  await resend.emails.send({
    from: `KraaFo <${FROM_ADDRESS}>`,
    to: [org.email],
    subject: `Your KraaFo reset code: ${code}`,
    html: emailShell('#111827', 'Password reset requested', 'KraaFo · Account Security', body,
      `This email was sent to ${org.email} because a password reset was requested.`),
  });
}

export async function sendTeamInvite(member: any, org: any, inviteToken: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if email not configured

  const resend = new Resend(apiKey);
  const inviteUrl = `${FRONTEND_URL}/join/${inviteToken}`;
  const roleLabels: Record<string, string> = { admin: 'Admin', staff: 'Staff', accountant: 'Accountant' };
  const roleLabel = roleLabels[member.role] || member.role;

  const html = emailShell(
    '#4f46e5',
    `You've been invited to join ${org.name} on KraaFo`,
    `You've been added as a ${roleLabel}`,
    `
    <p style="margin:0 0 16px;color:#374151;font-size:15px">Hi${member.name ? ` ${member.name}` : ''},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px">
      <strong>${org.name}</strong> has invited you to collaborate on their KraaFo account as a <strong>${roleLabel}</strong>.
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px">
      Click below to set up your password and get started. This invite link expires after you use it.
    </p>
    ${cta(inviteUrl, 'Accept Invite & Set Up Account')}
    <p style="margin:24px 0 0;color:#6b7280;font-size:13px">
      If you weren't expecting this invite, you can safely ignore this email.
    </p>
    `,
    `This invite was sent by ${org.name} via KraaFo &mdash; Professional Invoicing for businesses worldwide.`
  );

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: member.email,
    subject: `You've been invited to join ${org.name} on KraaFo`,
    html,
  });
}

// ── Admin signup alert ───────────────────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'opokufred32@gmail.com';

export async function sendAdminSignupAlert(org: any): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const now = new Date().toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' });
  await resend.emails.send({
    from: `KraaFo Alerts <${FROM_ADDRESS}>`,
    to: [ADMIN_EMAIL],
    subject: `New signup: ${org.name || org.email}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px">
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em">KraaFo · New Signup</p>
        <h2 style="margin:0 0 20px;font-size:22px;color:#111827">${org.name || '(no name)'}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151">
          <tr><td style="padding:6px 0;color:#6b7280;width:90px">Email</td><td style="padding:6px 0">${org.email || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Phone</td><td style="padding:6px 0">${org.phone || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Country</td><td style="padding:6px 0">${org.country || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Currency</td><td style="padding:6px 0">${org.currency || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Time</td><td style="padding:6px 0">${now} UTC</td></tr>
        </table>
        <a href="${FRONTEND_URL}/admin" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none">View in Admin →</a>
      </div>
    `,
  });
}
