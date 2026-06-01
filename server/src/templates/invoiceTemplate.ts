export interface InvoiceTemplateData {
  type: 'invoice' | 'receipt' | 'quote';
  number: string;
  issue_date: string;
  due_date?: string;
  paid_date?: string;
  status: string;
  org: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    website?: string;
    logo_base64?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    tax_name: string;
    currency_symbol: string;
    bank_name?: string;
    bank_account?: string;
    bank_routing?: string;
    signature_url?: string;
    paypal_email?: string;
    mpesa_number?: string;
    mtn_number?: string;
    airtel_number?: string;
    telecel_number?: string;
    whatsapp_number?: string;
  };
  payment_qr_svg?: string;
  client: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    company?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    amount: number;
  }>;
  subtotal: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  notes?: string;
  terms?: string;
  footer_text?: string;
}

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getStatusBadge(status: string, primary: string): string {
  const colors: Record<string, string> = {
    paid: '#059669', draft: '#6B7280', sent: '#2563EB', overdue: '#DC2626', cancelled: '#9CA3AF',
  };
  const color = colors[status] || primary;
  return `<span style="background:${color}20;color:${color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${status}</span>`;
}

export function generateInvoiceHTML(data: InvoiceTemplateData): string {
  const { org, client, items } = data;
  const sym = org.currency_symbol;
  const isReceipt = data.type === 'receipt';
  const isQuote = data.type === 'quote';
  const docLabel = isReceipt ? 'RECEIPT' : isQuote ? 'QUOTE' : 'INVOICE';

  const docColor = org.primary_color;
  const docColorDark = org.secondary_color;
  const docColorLight = org.accent_color;

  const itemRows = items.map((item, i) => `
    <tr style="border-bottom:1px solid #F3F4F6;${i % 2 !== 0 ? `background:${docColorLight}40;` : ''}">
      <td style="padding:12px 16px;font-size:13px;color:#374151;">${item.description}</td>
      <td style="padding:12px 16px;text-align:center;font-size:13px;color:#6B7280;">${item.quantity} ${item.unit}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;color:#6B7280;">${formatCurrency(item.unit_price, sym)}</td>
      <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:600;color:#111827;">${formatCurrency(item.amount, sym)}</td>
    </tr>`).join('');

  const logoHTML = org.logo_base64
    ? `<img src="${org.logo_base64}" alt="${org.name}" style="max-height:70px;max-width:220px;object-fit:contain;" />`
    : `<div style="font-size:26px;font-weight:800;color:${docColor};">${org.name}</div>`;

  // Receipt: diagonal "PAYMENT RECEIVED" watermark stamp
  const paidStamp = isReceipt ? `
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);pointer-events:none;z-index:0;opacity:0.07;">
      <div style="border:8px solid ${docColor};border-radius:12px;padding:10px 30px;white-space:nowrap;">
        <div style="font-size:52px;font-weight:900;color:${docColor};letter-spacing:0.08em;line-height:1;">PAID</div>
      </div>
    </div>` : '';

  const paymentBanner = isReceipt ? `
    <div style="background:linear-gradient(135deg,${docColor},${docColorDark});border-radius:12px;padding:20px 24px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;">✓</div>
        <div>
          <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:0.06em;">Payment Received</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px;">${data.paid_date ? `Paid on ${formatDate(data.paid_date)}` : 'Payment confirmed'}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:0.05em;">Amount Received</div>
        <div style="font-size:26px;font-weight:900;color:#fff;margin-top:2px;">${formatCurrency(data.amount_paid > 0 ? data.amount_paid : data.total, sym)}</div>
      </div>
    </div>` : '';

  // Bank info shown on receipts in notes section
  const bankInfo = (org.bank_name && isReceipt) ? `
    <div style="margin-top:16px;padding:14px 16px;background:${docColorLight};border-radius:8px;border-left:3px solid ${docColor};">
      <div style="font-size:10px;font-weight:700;color:${docColor};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Payment Details</div>
      ${org.bank_name ? `<div style="font-size:12px;color:#6B7280;">Bank: <span style="color:#111827;font-weight:500;">${org.bank_name}</span></div>` : ''}
      ${org.bank_account ? `<div style="font-size:12px;color:#6B7280;">Account: <span style="color:#111827;font-weight:500;">${org.bank_account}</span></div>` : ''}
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${docLabel} ${data.number}</title>
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#111827;font-size:14px; }
  @media print { body { -webkit-print-color-adjust:exact;print-color-adjust:exact; } }
</style>
</head>
<body>
<div style="max-width:800px;margin:0 auto;padding:0;position:relative;">

  <!-- Top colour bar — thicker on receipts to make them visually distinct -->
  <div style="background:${docColor};height:${isReceipt ? '10px' : '8px'};"></div>
  ${isReceipt ? `<div style="background:${docColorDark};height:3px;"></div>` : ''}

  <!-- Main Content -->
  <div style="padding:40px 50px;position:relative;">
    ${paidStamp}

    <!-- Top Row: Logo + Doc Type -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:${isReceipt ? '24px' : '40px'};">
      <div>${logoHTML}</div>
      <div style="text-align:right;">
        <div style="font-size:36px;font-weight:900;color:${docColor};letter-spacing:-0.02em;">${docLabel}</div>
        <div style="font-size:16px;color:#6B7280;margin-top:4px;">#${data.number}</div>
        ${data.status !== 'none' ? `<div style="margin-top:8px;">${getStatusBadge(isReceipt ? 'paid' : data.status, docColor)}</div>` : ''}
      </div>
    </div>

    <!-- Receipt: Payment Confirmed Banner -->
    ${paymentBanner}

    <!-- From / To / Details Row -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;margin-bottom:36px;padding:24px;background:#F9FAFB;border-radius:12px;">

      <!-- From -->
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${docColor};margin-bottom:10px;">From</div>
        <div style="font-weight:700;font-size:14px;color:#111827;">${org.name}</div>
        ${org.address ? `<div style="font-size:12px;color:#6B7280;margin-top:3px;">${org.address}</div>` : ''}
        ${(org.city || org.state) ? `<div style="font-size:12px;color:#6B7280;">${[org.city, org.state, org.zip].filter(Boolean).join(', ')}</div>` : ''}
        ${org.email ? `<div style="font-size:12px;color:#6B7280;margin-top:4px;">${org.email}</div>` : ''}
        ${org.phone ? `<div style="font-size:12px;color:#6B7280;">${org.phone}</div>` : ''}
        ${org.website ? `<div style="font-size:12px;color:${docColor};">${org.website}</div>` : ''}
      </div>

      <!-- Received From / Bill To -->
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${docColor};margin-bottom:10px;">${isReceipt ? 'Received From' : isQuote ? 'Prepared For' : 'Bill To'}</div>
        <div style="font-weight:700;font-size:14px;color:#111827;">${client.name}</div>
        ${client.company ? `<div style="font-size:12px;color:#6B7280;">${client.company}</div>` : ''}
        ${client.address ? `<div style="font-size:12px;color:#6B7280;margin-top:3px;">${client.address}</div>` : ''}
        ${(client.city || client.state) ? `<div style="font-size:12px;color:#6B7280;">${[client.city, client.state, client.zip].filter(Boolean).join(', ')}</div>` : ''}
        ${client.email ? `<div style="font-size:12px;color:#6B7280;margin-top:4px;">${client.email}</div>` : ''}
        ${client.phone ? `<div style="font-size:12px;color:#6B7280;">${client.phone}</div>` : ''}
      </div>

      <!-- Dates -->
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${docColor};margin-bottom:10px;">Details</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div>
            <span style="font-size:11px;color:#9CA3AF;">${isReceipt ? 'Receipt Date' : isQuote ? 'Quote Date' : 'Issue Date'}</span><br>
            <span style="font-size:13px;font-weight:600;color:#111827;">${formatDate(data.issue_date)}</span>
          </div>
          ${!isReceipt && data.due_date ? `
          <div>
            <span style="font-size:11px;color:#9CA3AF;">${isQuote ? 'Valid Until' : 'Due Date'}</span><br>
            <span style="font-size:13px;font-weight:600;color:#111827;">${formatDate(data.due_date)}</span>
          </div>` : ''}
          ${isReceipt && data.paid_date ? `
          <div>
            <span style="font-size:11px;color:#9CA3AF;">Payment Date</span><br>
            <span style="font-size:13px;font-weight:600;color:${docColor};">${formatDate(data.paid_date)}</span>
          </div>` : ''}
          <div>
            <span style="font-size:11px;color:#9CA3AF;">${isReceipt ? 'Receipt No.' : isQuote ? 'Quote No.' : 'Invoice No.'}</span><br>
            <span style="font-size:13px;font-weight:600;color:#111827;font-family:monospace;">${data.number}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Line Items Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:${docColor};">
          <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#fff;">Description</th>
          <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#fff;">Qty</th>
          <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#fff;">Unit Price</th>
          <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#fff;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- Totals + Notes -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:32px;">

      <!-- Notes / Terms -->
      <div>
        ${data.notes ? `
          <div style="margin-bottom:16px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${docColor};margin-bottom:6px;">Notes</div>
            <div style="font-size:12px;color:#6B7280;line-height:1.6;">${data.notes}</div>
          </div>` : ''}
        ${data.terms && !isReceipt ? `
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${docColor};margin-bottom:6px;">Terms</div>
            <div style="font-size:12px;color:#6B7280;line-height:1.6;">${data.terms}</div>
          </div>` : ''}
        ${bankInfo}
      </div>

      <!-- Totals -->
      <div style="background:#F9FAFB;border-radius:12px;padding:20px;">
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #E5E7EB;">
          <span style="font-size:13px;color:#6B7280;">Subtotal</span>
          <span style="font-size:13px;font-weight:500;">${formatCurrency(data.subtotal, sym)}</span>
        </div>
        ${data.discount_amount > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #E5E7EB;">
          <span style="font-size:13px;color:#6B7280;">Discount${data.discount_type === 'percent' ? ` (${data.discount_value}%)` : ''}</span>
          <span style="font-size:13px;color:#DC2626;">-${formatCurrency(data.discount_amount, sym)}</span>
        </div>` : ''}
        ${data.tax_rate > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #E5E7EB;">
          <span style="font-size:13px;color:#6B7280;">${org.tax_name} (${data.tax_rate}%)</span>
          <span style="font-size:13px;">${formatCurrency(data.tax_amount, sym)}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:12px 0 6px;border-top:2px solid ${docColor};">
          <span style="font-size:15px;font-weight:700;color:#111827;">Total</span>
          <span style="font-size:18px;font-weight:800;color:${docColor};">${formatCurrency(data.total, sym)}</span>
        </div>
        ${isReceipt ? `
        <div style="display:flex;justify-content:space-between;padding:8px 12px;background:${docColor};border-radius:8px;margin-top:8px;">
          <span style="font-size:13px;font-weight:700;color:#fff;">✓ Amount Paid</span>
          <span style="font-size:15px;font-weight:800;color:#fff;">${formatCurrency(data.amount_paid > 0 ? data.amount_paid : data.total, sym)}</span>
        </div>` : ''}
        ${!isReceipt && data.amount_paid > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:4px 0;">
          <span style="font-size:13px;color:#059669;">Amount Paid</span>
          <span style="font-size:13px;color:#059669;">-${formatCurrency(data.amount_paid, sym)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0 0;border-top:1px solid #E5E7EB;margin-top:4px;">
          <span style="font-size:14px;font-weight:700;">Balance Due</span>
          <span style="font-size:16px;font-weight:800;color:${data.balance_due > 0 ? '#DC2626' : '#059669'};">${formatCurrency(data.balance_due, sym)}</span>
        </div>` : ''}
      </div>
    </div>

    <!-- Payment Options (invoices only) -->
    ${!isReceipt && (org.paypal_email || org.mpesa_number || org.mtn_number || org.airtel_number || org.telecel_number || org.bank_name || data.payment_qr_svg) ? `
    <div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:24px;padding:20px;background:#F9FAFB;border-radius:12px;border-left:4px solid ${docColor};">
      <div style="flex:1;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${docColor};margin-bottom:12px;">How to Pay</div>
        ${org.paypal_email ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px;color:#374151;"><span style="font-weight:700;color:#003087;">PayPal:</span> <span style="color:#2563EB;">${org.paypal_email}</span></div>` : ''}
        ${org.mpesa_number ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px;color:#374151;"><span style="font-weight:700;color:#00A651;">M-Pesa:</span> ${org.mpesa_number}</div>` : ''}
        ${org.mtn_number ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px;color:#374151;"><span style="font-weight:700;color:#FFC107;">MTN MoMo:</span> ${org.mtn_number}</div>` : ''}
        ${org.airtel_number ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px;color:#374151;"><span style="font-weight:700;color:#E40000;">Airtel Money:</span> ${org.airtel_number}</div>` : ''}
        ${org.telecel_number ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px;color:#374151;"><span style="font-weight:700;color:#CC0000;">Telecel Cash:</span> ${org.telecel_number}</div>` : ''}
        ${org.bank_name ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px;color:#374151;"><span style="font-weight:700;color:#374151;">Bank:</span> ${org.bank_name}${org.bank_account ? ` · Acc: ${org.bank_account}` : ''}</div>` : ''}
      </div>
      ${data.payment_qr_svg ? `
      <div style="text-align:center;flex-shrink:0;">
        ${data.payment_qr_svg}
        <div style="font-size:9px;color:#9CA3AF;margin-top:4px;">Scan to Pay</div>
      </div>` : ''}
    </div>` : ''}

    <!-- Signature -->
    ${org.signature_url ? `
    <div style="display:flex;justify-content:flex-end;margin-top:32px;margin-bottom:8px;">
      <div style="text-align:center;min-width:220px;">
        <img src="${org.signature_url}" alt="Signature" style="max-height:64px;max-width:220px;object-fit:contain;display:block;margin:0 auto 8px;" />
        <div style="border-top:1.5px solid #374151;padding-top:6px;font-size:11px;color:#6B7280;letter-spacing:0.04em;">Authorized Signature</div>
      </div>
    </div>` : ''}

    <!-- Footer text -->
    ${data.footer_text ? `
    <div style="text-align:center;padding:16px;font-size:12px;color:#9CA3AF;">${data.footer_text}</div>` : ''}

    <!-- Quote: validity notice -->
    ${isQuote ? `
    <div style="text-align:center;padding:20px;background:${docColorLight};border-radius:12px;margin-top:8px;border:1px solid ${docColor}40;">
      <div style="font-size:13px;font-weight:700;color:${docColor};margin-bottom:4px;">This is a Quote, not an Invoice</div>
      <div style="font-size:12px;color:#6B7280;">This quote is valid${data.due_date ? ` until ${formatDate(data.due_date)}` : ' for 30 days from the date above'}. Prices are subject to change after expiry.</div>
      ${org.email ? `<div style="font-size:12px;color:#6B7280;margin-top:4px;">To accept, reply to <span style="color:${docColor};">${org.email}</span></div>` : ''}
    </div>` : ''}

    <!-- Receipt: thank-you footer strip -->
    ${isReceipt ? `
    <div style="text-align:center;padding:20px;background:${docColorLight};border-radius:12px;margin-top:8px;">
      <div style="font-size:15px;font-weight:700;color:${docColor};margin-bottom:4px;">Thank you for your payment!</div>
      <div style="font-size:12px;color:#6B7280;">This receipt confirms that payment has been received in full.</div>
      ${org.email ? `<div style="font-size:12px;color:#6B7280;margin-top:4px;">Questions? Contact us at <span style="color:${docColor};">${org.email}</span></div>` : ''}
    </div>` : ''}
  </div>

  <!-- KraaFo branding -->
  <div style="text-align:center;padding:8px 0 10px;font-size:9px;color:#D1D5DB;letter-spacing:0.02em;">
    Created with <a href="https://krafo.app" style="color:#9CA3AF;text-decoration:none;font-weight:600;">KraaFo</a> &mdash; Free Professional Invoicing
  </div>

  <!-- Bottom colour bars -->
  <div style="background:${docColor};height:4px;"></div>
  <div style="background:${docColorDark};height:2px;"></div>
</div>
</body>
</html>`;
}
