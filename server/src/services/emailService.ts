import { Resend } from 'resend';
import path from 'path';
import db from '../db/schema';
import { generatePDF } from './pdfService';
import { getLogoBase64 } from './imageService';
import QRCode from 'qrcode';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const FROM_ADDRESS = process.env.RESEND_FROM || 'invoices@kraafo.com';

export async function sendInvoiceEmail(
  invoiceId: string,
  recipientEmail: string,
  customMessage?: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Email not configured — RESEND_API_KEY missing');

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
    `Amount Due: ${sym}${invoice.total?.toFixed(2)}`,
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
    `This ${docType.toLowerCase()} was generated via KraaFo — Professional Invoicing`,
  ].join('\n');

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${org.name} <${FROM_ADDRESS}>`,
    reply_to: org.email || FROM_ADDRESS,
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
                      <td align="right" style="color:${color};font-size:20px;font-weight:900">${sym}${invoice.total?.toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;text-align:center">
              The full ${docType.toLowerCase()} PDF is attached to this email for your records.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center">
            <p style="margin:0;color:#6b7280;font-size:12px">${docType} generated &amp; delivered via <strong style="color:#111827">KraaFo</strong> &mdash; Professional Invoicing Platform</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
