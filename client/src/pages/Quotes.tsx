import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, FileText, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { useOrg } from '../hooks/useOrg';
import { api, formatCurrency } from '../utils/api';
import { Quote } from '../types';
import { LogoMark } from '../components/Logo';
import { cn } from '../utils/cn';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:    { label: 'Draft',    cls: 'bg-slate-100 text-slate-500' },
  sent:     { label: 'Sent',     cls: 'bg-blue-50 text-blue-600' },
  accepted: { label: 'Accepted', cls: 'bg-emerald-50 text-emerald-700' },
  declined: { label: 'Declined', cls: 'bg-red-50 text-red-600' },
  expired:  { label: 'Expired',  cls: 'bg-amber-50 text-amber-600' },
  invoiced: { label: 'Invoiced', cls: 'bg-indigo-50 text-indigo-600' },
};

export default function Quotes() {
  const navigate = useNavigate();
  const { org } = useOrg();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [converting, setConverting] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => { if (org) load(); }, [org]);

  const load = async () => {
    if (!org) return;
    try { setQuotes(await api.quotes.list(org.id)); } catch {}
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const convertToInvoice = async (quoteId: string) => {
    setConverting(quoteId);
    try {
      const result = await api.quotes.convert(quoteId);
      showToast(`Invoice ${result.number} created!`);
      load();
      setTimeout(() => navigate('/generator', { state: { loadId: result.invoice_id } }), 1200);
    } catch { showToast('Conversion failed'); }
    setConverting(null);
  };

  const primary = org?.primary_color || '#2563EB';
  const sym = org?.currency_symbol || '$';

  return (
    <div className="min-h-screen bg-slate-50/70">
      <header className="bg-white/90 glass border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between" style={{ height: '58px' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
              <LogoMark size={32} className="sm:hidden" />
              <LogoMark size={44} className="hidden sm:block" />
            </button>
            <h1 className="font-black text-slate-900 tracking-tight">Quotes</h1>
          </div>
          <button
            onClick={() => navigate('/generator', { state: { mode: 'quote' } })}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white btn-glow"
            style={{ background: primary }}
          >
            <Plus className="w-3.5 h-3.5" /> New Quote
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        {quotes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-24 text-center animate-fade-up">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium text-sm">No quotes yet</p>
            <p className="text-slate-300 text-xs mt-1">Create a quote, send it to your client, and convert it to an invoice when accepted</p>
            <button
              onClick={() => navigate('/generator', { state: { mode: 'quote' } })}
              className="mt-5 px-5 py-2 rounded-xl text-xs font-bold text-white btn-glow"
              style={{ background: primary }}
            >
              Create First Quote
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-up">
            <div className="px-6 py-4 border-b border-slate-50">
              <h2 className="text-sm font-black text-slate-700">{quotes.length} Quote{quotes.length !== 1 ? 's' : ''}</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {quotes.map((q, i) => {
                const meta = STATUS_META[q.status] || STATUS_META.draft;
                return (
                  <div key={q.id} onClick={() => navigate('/generator', { state: { loadQuoteId: q.id } })} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors animate-fade-in cursor-pointer" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-black text-slate-800">{q.number}</span>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', meta.cls)}>{meta.label}</span>
                      </div>
                      <div className="text-xs text-slate-400">{q.client_name || 'No client'} · {q.issue_date}</div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className="text-sm font-black text-slate-700">{formatCurrency(q.total, sym)}</span>
                      {q.status !== 'invoiced' && (
                        <button
                          onClick={e => { e.stopPropagation(); convertToInvoice(q.id); }}
                          disabled={converting === q.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-50"
                        >
                          {converting === q.id ? <Clock className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                          Convert to Invoice
                        </button>
                      )}
                      {q.status === 'invoiced' && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Invoiced
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg animate-fade-up z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
