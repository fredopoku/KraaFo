import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, AlertCircle, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';

function fmt(n: number, sym: string) {
  return `${sym}${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:    { label: 'Draft',     color: '#6b7280' },
  sent:     { label: 'Sent',      color: '#2563eb' },
  paid:     { label: 'Paid',      color: '#059669' },
  overdue:  { label: 'Overdue',   color: '#dc2626' },
  cancelled:{ label: 'Cancelled', color: '#6b7280' },
  accepted: { label: 'Accepted',  color: '#059669' },
  declined: { label: 'Declined',  color: '#dc2626' },
  expired:  { label: 'Expired',   color: '#d97706' },
  invoiced: { label: 'Invoiced',  color: '#7c3aed' },
};

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/invoices/${id}/public`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(setData)
      .catch(() => setError('This document could not be found.'));
  }, [id]);

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="text-sm text-indigo-600 font-bold hover:underline">Go to KraaFo</button>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
    </div>
  );

  const { org, items = [], ...inv } = data;
  const primary = org?.primary_color || '#4f46e5';
  const sym = org?.currency_symbol || inv.currency_symbol || '$';
  const docType = inv.type === 'receipt' ? 'Receipt' : inv.type === 'quote' ? 'Quote' : 'Invoice';
  const statusMeta = STATUS_LABEL[inv.status] ?? STATUS_LABEL.draft;

  const subtotal = items.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
  const taxRate = Number(inv.tax_rate) || 0;
  const discount = Number(inv.discount) || 0;
  const taxAmt = subtotal * (taxRate / 100);
  const total = subtotal + taxAmt - discount;

  const hasPayment = org?.paypal_email || org?.mpesa_number || org?.mtn_number || org?.airtel_number || org?.telecel_number || org?.bank_name;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Action bar — hidden when printing */}
      <div className="print:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="text-xs text-slate-400 hover:text-slate-600 font-medium">kraafo.com</button>
          <span className="text-slate-200 text-xs">·</span>
          <span className="text-xs text-slate-400">{docType} #{inv.number}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <a
            href={inv.type === 'quote' ? `${API}/pdf/quote/${id}` : `${API}/pdf/${id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
            style={{ background: primary }}
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </a>
        </div>
      </div>

      {/* Document */}
      <div className="max-w-2xl mx-auto my-6 print:my-0 bg-white print:shadow-none shadow-xl shadow-slate-200/60 rounded-2xl print:rounded-none overflow-hidden">

        {/* Header stripe */}
        <div className="h-1.5 print:h-1" style={{ background: primary }} />

        <div className="p-8 print:p-10">

          {/* Top row — branding + doc title */}
          <div className="flex items-start justify-between gap-6 mb-8">
            <div className="flex items-center gap-3 min-w-0">
              {org?.logo_url && (
                <img src={org.logo_url} alt="" className="w-12 h-12 rounded-xl object-contain shrink-0 border border-slate-100" />
              )}
              <div className="min-w-0">
                <div className="font-black text-slate-900 text-lg leading-tight truncate">{org?.name || 'Business'}</div>
                {org?.email && <div className="text-xs text-slate-500 mt-0.5 truncate">{org.email}</div>}
                {org?.phone && <div className="text-xs text-slate-500 truncate">{org.phone}</div>}
                {(org?.address || org?.city) && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    {[org?.address, org?.city, org?.state, org?.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-2xl font-black uppercase tracking-tight" style={{ color: primary }}>{docType}</div>
              <div className="text-sm font-bold text-slate-700 mt-1">#{inv.number}</div>
              <div className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: statusMeta.color }}>
                {statusMeta.label}
              </div>
            </div>
          </div>

          {/* Dates + Bill To */}
          <div className="flex gap-8 mb-8 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bill To</div>
              <div className="font-bold text-slate-800 text-sm">{inv.client_name || '—'}</div>
              {inv.client_email && <div className="text-xs text-slate-500 mt-0.5">{inv.client_email}</div>}
              {inv.client_phone && <div className="text-xs text-slate-500">{inv.client_phone}</div>}
              {inv.client_address && <div className="text-xs text-slate-400 mt-1">{inv.client_address}</div>}
            </div>
            <div className="shrink-0 space-y-1.5">
              <div className="flex gap-6 text-xs">
                <span className="font-bold text-slate-400 w-20">Issue Date</span>
                <span className="text-slate-700 font-medium">{inv.issue_date}</span>
              </div>
              {inv.due_date && (
                <div className="flex gap-6 text-xs">
                  <span className="font-bold text-slate-400 w-20">Due Date</span>
                  <span className="text-slate-700 font-medium">{inv.due_date}</span>
                </div>
              )}
              {inv.paid_date && (
                <div className="flex gap-6 text-xs">
                  <span className="font-bold text-slate-400 w-20">Paid Date</span>
                  <span className="text-emerald-600 font-bold">{inv.paid_date}</span>
                </div>
              )}
              {inv.currency && (
                <div className="flex gap-6 text-xs">
                  <span className="font-bold text-slate-400 w-20">Currency</span>
                  <span className="text-slate-700 font-medium">{inv.currency}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="mb-6 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: primary + '15' }}>
                  <th className="text-left py-2.5 px-3 text-xs font-black uppercase tracking-wide text-slate-600 rounded-tl-lg">Description</th>
                  <th className="text-right py-2.5 px-3 text-xs font-black uppercase tracking-wide text-slate-600">Qty</th>
                  <th className="text-right py-2.5 px-3 text-xs font-black uppercase tracking-wide text-slate-600 hidden sm:table-cell">Unit Price</th>
                  <th className="text-right py-2.5 px-3 text-xs font-black uppercase tracking-wide text-slate-600 rounded-tr-lg">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 px-3 text-slate-800">
                      <div className="font-medium">{item.description}</div>
                      {item.unit && <div className="text-xs text-slate-400">{item.unit}</div>}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 font-medium">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-slate-600 font-medium hidden sm:table-cell">{fmt(Number(item.unit_price), sym)}</td>
                    <td className="py-3 px-3 text-right text-slate-800 font-bold">{fmt(Number(item.amount), sym)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-52 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span><span className="font-medium">{fmt(subtotal, sym)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>{org?.tax_name || 'Tax'} ({taxRate}%)</span><span className="font-medium">{fmt(taxAmt, sym)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span><span className="font-medium">−{fmt(discount, sym)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-base text-slate-900">
                <span>Total</span><span style={{ color: primary }}>{fmt(total, sym)}</span>
              </div>
            </div>
          </div>

          {/* Notes / Terms */}
          {(inv.notes || inv.terms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {inv.notes && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Notes</div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{inv.notes}</p>
                </div>
              )}
              {inv.terms && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Terms</div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{inv.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Payment methods */}
          {hasPayment && (
            <div className="border border-slate-100 rounded-2xl p-5 mb-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">How to Pay</div>
              <div className="space-y-2">
                {org?.paypal_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-center">💳</span>
                    <span className="text-slate-600">PayPal: <span className="font-bold text-slate-800">{org.paypal_email}</span></span>
                  </div>
                )}
                {org?.mpesa_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-center">📱</span>
                    <span className="text-slate-600">M-Pesa: <span className="font-bold text-slate-800">{org.mpesa_number}</span></span>
                  </div>
                )}
                {org?.mtn_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-center">📱</span>
                    <span className="text-slate-600">MTN Mobile Money: <span className="font-bold text-slate-800">{org.mtn_number}</span></span>
                  </div>
                )}
                {org?.airtel_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-center">📱</span>
                    <span className="text-slate-600">Airtel Money: <span className="font-bold text-slate-800">{org.airtel_number}</span></span>
                  </div>
                )}
                {org?.telecel_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-center">📱</span>
                    <span className="text-slate-600">Telecel Cash: <span className="font-bold text-slate-800">{org.telecel_number}</span></span>
                  </div>
                )}
                {org?.bank_name && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="w-6 text-center mt-0.5">🏦</span>
                    <div className="text-slate-600">
                      <div>Bank: <span className="font-bold text-slate-800">{org.bank_name}</span></div>
                      {org.bank_account && <div className="text-xs text-slate-500">Account: {org.bank_account}</div>}
                      {org.bank_routing && <div className="text-xs text-slate-500">Routing: {org.bank_routing}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signature */}
          {inv.signature_url && (
            <div className="mb-6">
              <img src={inv.signature_url} alt="Signature" className="h-12 object-contain" />
              <div className="text-xs text-slate-400 mt-1">Authorised signature</div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-8 py-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">Thank you for your business.</span>
          <a
            href="https://kraafo.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition-colors print:no-underline"
          >
            Powered by <span className="font-black text-indigo-500">KraaFo</span>
          </a>
        </div>
      </div>
    </div>
  );
}
