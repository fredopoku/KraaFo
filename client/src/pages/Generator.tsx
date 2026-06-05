import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Sparkles, Download, Eye, Save, FileText, Receipt, Loader2, Settings, ChevronDown, X, CheckCircle, PenLine, ScanLine, Send, MessageCircle, CreditCard, BarChart2, Users, Lock, Share2, Link, Copy, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrg } from '../hooks/useOrg';
import { api, formatCurrency, generateInvoiceNumber, today, addDays } from '../utils/api';
import { InvoiceItem, Invoice, Client } from '../types';
import { cn } from '../utils/cn';
import { INDUSTRIES, getClientTypes } from '../utils/industryData';
import { LogoMark, Logo } from '../components/Logo';
import SignaturePad from '../components/SignaturePad';

interface FormState {
  type: 'invoice' | 'receipt' | 'quote';
  number: string;
  status: 'none' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'accepted' | 'declined' | 'expired';
  issue_date: string;
  due_date: string;
  paid_date: string;
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  client_city: string;
  client_state: string;
  client_zip: string;
  client_company: string;
  discount_type: 'none' | 'percent' | 'fixed';
  discount_value: number;
  tax_rate: number;
  amount_paid: number;
  notes: string;
  terms: string;
  footer_text: string;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  none:      { label: '—',         cls: 'bg-slate-100 text-slate-400' },
  draft:     { label: 'Draft',     cls: 'bg-slate-100 text-slate-600' },
  sent:      { label: 'Sent',      cls: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' },
  paid:      { label: 'Paid',      cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  overdue:   { label: 'Overdue',   cls: 'bg-red-50 text-red-600 ring-1 ring-red-100' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-400' },
  accepted:  { label: 'Accepted',  cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  declined:  { label: 'Declined',  cls: 'bg-red-50 text-red-600 ring-1 ring-red-100' },
  expired:   { label: 'Expired',   cls: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' },
  invoiced:  { label: 'Invoiced',  cls: 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100' },
};

const INPUT = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-150 placeholder:text-slate-300 hover:border-slate-300';
const LABEL = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';

const DEMO_ORG = {
  id: 'demo', name: 'Your Company Name', email: '', phone: '', address: '', city: '', state: '', zip: '', country: '', website: '',
  logo_url: undefined as string | undefined,
  primary_color: '#4F46E5', secondary_color: '#4338CA', accent_color: '#EEF2FF',
  tax_name: 'Tax', tax_rate: 0, currency: 'USD', currency_symbol: '$',
  invoice_prefix: 'INV', receipt_prefix: 'REC', quote_prefix: 'QUO', payment_terms: 'Net 30', notes: '',
  bank_name: '', bank_account: '', bank_routing: '', signature_url: undefined as string | undefined,
  smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', smtp_from: '',
  created_at: '', updated_at: '',
};

export default function Generator() {
  const navigate = useNavigate();
  const { org, setOrg, loading: orgLoading } = useOrg();
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unit: 'session', unit_price: 0, amount: 0 }]);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [invoiceList, setInvoiceList] = useState<Invoice[]>([]);
  const [showList, setShowList] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info'; key: number } | null>(null);
  const [industry, setIndustry] = useState('cleaning');
  const [clientType, setClientType] = useState('residential');
  const [freshItems, setFreshItems] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const [showSend, setShowSend] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendPhone, setSendPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<any>(null);
  const [showShareNudge, setShowShareNudge] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [converting, setConverting] = useState(false);
  const location = useLocation();
  const isDemo = new URLSearchParams(location.search).get('demo') === 'true';
  const effectiveOrg = isDemo ? DEMO_ORG : org;

  const [form, setForm] = useState<FormState>({
    type: 'invoice', number: '', status: 'draft',
    issue_date: today(), due_date: addDays(today(), 30), paid_date: '',
    client_id: '', client_name: '', client_email: '', client_phone: '',
    client_address: '', client_city: '', client_state: '', client_zip: '', client_company: '',
    discount_type: 'none', discount_value: 0, tax_rate: 0,
    amount_paid: 0, notes: '', terms: '', footer_text: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type, key: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!showList) return;
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-history-dropdown]') && !t.closest('[data-history-btn]')) setShowList(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showList]);

  useEffect(() => {
    if (isDemo && !org) {
      setForm(f => ({ ...f, number: generateInvoiceNumber('INV', 0) }));
    }
  }, [isDemo]);

  useEffect(() => {
    if (!org || isDemo) return;
    setForm(f => ({
      ...f,
      tax_rate: org.tax_rate,
      notes: org.notes || '',
      terms: org.payment_terms || '',
      number: generateInvoiceNumber(org.invoice_prefix, 0),
    }));
    if (org.signature_url) setSignature(org.signature_url);
    loadInvoices();
  }, [org]);

  const loadInvoices = async () => {
    if (!org) return;
    try {
      const [invoices, quotes] = await Promise.all([
        api.invoices.list(org.id),
        api.quotes.list(org.id).catch(() => [] as any[]),
      ]);
      const quotesAsInvoices = quotes.map((q: any) => ({ ...q, type: 'quote' as const }));
      const list = [...invoices, ...quotesAsInvoices].sort((a, b) =>
        (b.issue_date || '').localeCompare(a.issue_date || '')
      );
      setInvoiceList(list);
      setForm(f => {
        const prefix = f.type === 'quote' ? ((org as any).quote_prefix || 'QUO') : f.type === 'invoice' ? org.invoice_prefix : org.receipt_prefix;
        return { ...f, number: generateInvoiceNumber(prefix, list.filter(i => i.type === f.type).length) };
      });
    } catch {}
  };

  const setField = (key: keyof FormState, val: string | number) => setForm(f => ({ ...f, [key]: val }));

  const updateItem = (idx: number, key: keyof InvoiceItem, val: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [key]: val };
      updated.amount = updated.quantity * updated.unit_price;
      return updated;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, unit: 'session', unit_price: 0, amount: 0 }]);
  };
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const discountAmount = form.discount_type === 'percent' ? subtotal * (form.discount_value / 100)
    : form.discount_type === 'fixed' ? Math.min(form.discount_value, subtotal) : 0;
  const taxable = subtotal - discountAmount;
  const taxAmount = taxable * (form.tax_rate / 100);
  const total = taxable + taxAmount;
  const balanceDue = Math.max(0, total - form.amount_paid);

  const handleSmartFill = async () => {
    setAiLoading(true);
    try {
      const result = await api.ai.suggest({
        industry,
        existing_items: items.filter(i => i.description).map(i => i.description),
        client_type: clientType,
        notes: form.notes,
      });
      if (result.items.length > 0) {
        setFreshItems(true);
        setItems(result.items.map(item => ({ ...item, amount: item.quantity * item.unit_price })));
        setTimeout(() => setFreshItems(false), 600);
      }
      if (result.notes) setField('notes', result.notes);
      if (result.terms) setField('terms', result.terms);
      const industryLabel = INDUSTRIES.find(i => i.value === industry)?.label ?? industry;
      const clientLabel = getClientTypes(industry).find(c => c.value === clientType)?.label ?? clientType;
      showToast(`Smart filled — ${industryLabel} · ${clientLabel}`, 'success');
    } catch {
      showToast('Could not load suggestions. Try again.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (): Promise<Invoice | null> => {
    if (isDemo) { showToast('Create your free account to save documents', 'info'); setTimeout(() => navigate('/setup'), 1200); return null; }
    if (!org || !form.client_name) return null;
    setSaving(true);
    try {
      const isQuote = form.type === 'quote';
      const payload = { ...form, org_id: org.id, items,
        ...(isQuote ? { expiry_date: form.due_date } : {}) };
      let saved: any;
      if (isQuote) {
        saved = savedInvoice
          ? await api.quotes.update(savedInvoice.id, payload)
          : await api.quotes.create(payload);
        // quotes table has no type column — tag it so buildMobileMessage/email uses correct label
        saved = { ...saved, type: 'quote' as const };
      } else {
        saved = savedInvoice
          ? await api.invoices.update(savedInvoice.id, payload)
          : await api.invoices.create(payload as any);
      }
      const isFirstSave = !savedInvoice;
      setSavedInvoice(saved);
      loadInvoices();
      const label = form.type === 'invoice' ? 'Invoice' : form.type === 'receipt' ? 'Receipt' : 'Quote';
      showToast(`${label} ${saved.number} saved`, 'success');
      if (isFirstSave) setShowShareNudge(true);
      return saved;
    } catch (err) {
      showToast((err as Error).message || 'Save failed — check required fields', 'error');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (isDemo) { showToast('Create your free account to download PDFs', 'info'); setTimeout(() => navigate('/setup'), 1200); return; }
    let invoice = savedInvoice;
    if (!invoice) {
      invoice = await handleSave();
      if (!invoice) return;
    }
    setDownloading(true);
    try {
      await (form.type === 'quote' ? api.pdf.downloadQuote(invoice.id) : api.pdf.download(invoice.id));
    } catch {
      showToast('Download failed', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleConvertQuote = async () => {
    if (!savedInvoice) return;
    setConverting(true);
    try {
      const result = await api.quotes.convert(savedInvoice.id);
      showToast(`Converted to invoice ${result.number}`, 'success');
      await loadInvoices();
      const fullInvoice = await api.invoices.get(result.invoice_id);
      loadInvoice(fullInvoice);
    } catch {
      showToast('Conversion failed', 'error');
    } finally {
      setConverting(false);
    }
  };

  const loadInvoice = async (inv: Invoice) => {
    try {
      const isQuote = (inv as any).type === 'quote';
      const raw = isQuote ? await api.quotes.get(inv.id) : await api.invoices.get(inv.id);
      const full = isQuote ? { ...raw, type: 'quote' as const, due_date: (raw as any).expiry_date || '' } : raw;
      setForm({
        type: full.type as any, number: full.number, status: full.status,
        issue_date: full.issue_date, due_date: (full as any).due_date || '', paid_date: (full as any).paid_date || '',
        client_id: (full as any).client_id || '',
        client_name: full.client_name, client_email: full.client_email || '', client_phone: full.client_phone || '',
        client_address: full.client_address || '', client_city: full.client_city || '',
        client_state: full.client_state || '', client_zip: full.client_zip || '',
        client_company: full.client_company || '',
        discount_type: full.discount_type, discount_value: full.discount_value,
        tax_rate: full.tax_rate, amount_paid: (full as any).amount_paid || 0,
        notes: full.notes || '', terms: full.terms || '', footer_text: (full as any).footer_text || '',
      });
      setItems((full as any).items?.length ? (full as any).items : [{ description: '', quantity: 1, unit: 'session', unit_price: 0, amount: 0 }]);
      setSavedInvoice(full as any);
    } catch {
      showToast('Failed to load document', 'error');
    }
    setShowList(false);
  };

  const saveSignature = async (dataUrl: string) => {
    setSignature(dataUrl);
    setShowSignaturePad(false);
    if (org) {
      try {
        await api.organizations.update(org.id, { signature_url: dataUrl } as any);
        showToast('Signature saved to your account', 'success');
      } catch {
        showToast('Signature set for this session', 'info');
      }
    }
  };

  const removeSignature = async () => {
    setSignature(null);
    if (org) {
      try {
        await api.organizations.update(org.id, { signature_url: null } as any);
      } catch {}
    }
  };

  // Set quote mode from navigation
  useEffect(() => {
    if (location.state?.mode === 'quote' && org) {
      const prefix = (org as any).quote_prefix || 'QUO';
      setForm(f => ({ ...f, type: 'quote', status: 'draft', number: generateInvoiceNumber(prefix, 0) }));
    }
  }, [org]);

  // Load client from Clients page navigation
  useEffect(() => {
    if (location.state?.client) {
      const c = location.state.client as Client;
      setForm(f => ({
        ...f,
        client_id: c.id || '',
        client_name: c.name || '',
        client_email: c.email || '',
        client_phone: c.phone || '',
        client_address: c.address || '',
        client_city: c.city || '',
        client_state: c.state || '',
        client_zip: c.zip || '',
        client_company: c.company || '',
      }));
    }
    if (location.state?.loadId) {
      api.invoices.get(location.state.loadId).then(inv => loadInvoice(inv)).catch(() => {});
    }
    if (location.state?.loadQuoteId) {
      api.quotes.get(location.state.loadQuoteId).then(q => loadInvoice({ ...q, type: 'quote' } as any)).catch(() => {});
    }
  }, [location.state]);

  const searchClients = async (q: string) => {
    if (!org || q.length < 2) { setClientSuggestions([]); return; }
    try {
      const results = await api.clients.list(org.id, q);
      setClientSuggestions(results);
      setShowClientSuggestions(results.length > 0);
    } catch {}
  };

  const selectClient = (c: Client) => {
    setForm(f => ({
      ...f,
      client_id: c.id, client_name: c.name, client_email: c.email || '', client_phone: c.phone || '',
      client_address: c.address || '', client_city: c.city || '',
      client_state: c.state || '', client_zip: c.zip || '', client_company: c.company || '',
    }));
    setShowClientSuggestions(false);
    setClientSuggestions([]);
  };

  const handleSendEmail = async () => {
    if (!savedInvoice || !sendEmail) return;
    setSending(true);
    try {
      await api.deliver.email(savedInvoice.id, sendEmail, sendMessage || undefined);
      showToast('Invoice sent by email!', 'success');
      setShowSend(false);
      setSendEmail(''); setSendMessage('');
    } catch (err) {
      showToast((err as Error).message || 'Email failed', 'error');
    }
    setSending(false);
  };

  const buildMobileMessage = () => {
    if (!savedInvoice || !org) return '';
    const sym = org.currency_symbol || '$';
    const docType = savedInvoice.type === 'receipt' ? 'Receipt' : savedInvoice.type === 'quote' ? 'Quote' : 'Invoice';
    const lines = [
      `Dear ${savedInvoice.client_name || 'Valued Client'},`,
      ``,
      `We are writing to inform you that ${docType} No. ${savedInvoice.number} from ${org.name} has been prepared and sent to your email.`,
      ``,
      `Please check your email inbox for the full ${docType.toLowerCase()} with the PDF attachment and complete payment details.`,
      ``,
      `${docType} Summary:`,
      `Reference: ${savedInvoice.number}`,
      `Amount: ${sym}${savedInvoice.total?.toFixed(2)}`,
      ...(savedInvoice.due_date ? [`Due Date: ${savedInvoice.due_date}`] : []),
      ``,
      `For any enquiries, please do not hesitate to contact us.`,
      ...(org.email ? [org.email] : []),
      ...(org.phone ? [org.phone] : []),
      ``,
      `Kind regards,`,
      org.name,
      ``,
      `--`,
      `This message was sent via KraaFo — Professional Invoicing`,
    ];
    return lines.join('\n');
  };

  const handleWhatsApp = () => {
    if (!savedInvoice) { showToast('Save first, then send via WhatsApp', 'info'); return; }
    const phone = sendPhone.replace(/\D/g, '');
    const msg = encodeURIComponent(buildMobileMessage());
    window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank');
  };

  const openSMS = (phone: string) => {
    const body = encodeURIComponent(buildMobileMessage());
    // Use a temporary <a> click — more reliable for protocol handlers than window.open
    const a = document.createElement('a');
    a.href = `sms:${phone}?body=${body}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSMS = () => {
    if (!savedInvoice) { showToast('Save first, then send via SMS', 'info'); return; }
    if (!sendPhone) { showToast('Enter a phone number first', 'info'); return; }
    openSMS(sendPhone);
  };

  const handleSendAll = async () => {
    if (!savedInvoice) { showToast('Save first, then send', 'info'); return; }
    if (!sendEmail && !sendPhone) { showToast('Enter an email or phone number', 'info'); return; }

    const phone = sendPhone.replace(/\D/g, '');
    const msg = encodeURIComponent(buildMobileMessage());

    // Open WhatsApp synchronously (must happen within the click event before any await)
    if (sendPhone) {
      window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank');
    }

    // SMS via <a> click — avoids browser popup blocker that blocks a second window.open
    if (sendPhone) openSMS(sendPhone);

    if (sendEmail) {
      setSending(true);
      try {
        await api.deliver.email(savedInvoice.id, sendEmail, sendMessage || undefined);
        const channels = [sendEmail && 'Email', sendPhone && 'WhatsApp', sendPhone && 'SMS'].filter(Boolean).join(', ');
        showToast(`Sent via ${channels}`, 'success');
        setShowSend(false);
      } catch (err) {
        showToast('WhatsApp & SMS opened — email failed: ' + (err as Error).message, 'error');
      }
      setSending(false);
    } else {
      showToast('WhatsApp and SMS opened', 'success');
      setShowSend(false);
    }
  };

  const loadPaymentLinks = async () => {
    if (!savedInvoice) return;
    try { setPaymentLinks(await api.deliver.paymentLinks(savedInvoice.id)); } catch {}
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isDemo) { showToast('Create your free account to use Import', 'info'); setTimeout(() => navigate('/setup'), 1200); return; }
    if (!org) return;
    e.target.value = '';
    setImporting(true);
    showToast('Reading your document…', 'info');
    try {
      const parsed = await api.ai.parseReceipt(file);
      const str = (k: string) => (typeof parsed[k] === 'string' ? (parsed[k] as string) : '');
      const num = (k: string) => (typeof parsed[k] === 'number' ? (parsed[k] as number) : 0);
      const docType = str('type') === 'receipt' ? 'receipt' : 'invoice';
      const prefix = docType === 'invoice' ? org.invoice_prefix : org.receipt_prefix;
      setForm(f => ({
        ...f,
        type: docType,
        number: str('number') || generateInvoiceNumber(prefix, invoiceList.filter(i => i.type === docType).length),
        issue_date: str('issue_date') || f.issue_date,
        due_date: str('due_date') || f.due_date,
        paid_date: str('paid_date'),
        client_name: str('client_name'),
        client_email: str('client_email'),
        client_phone: str('client_phone'),
        client_address: str('client_address'),
        client_city: str('client_city'),
        client_state: str('client_state'),
        client_zip: str('client_zip'),
        client_company: str('client_company'),
        tax_rate: num('tax_rate'),
        discount_type: (str('discount_type') as 'none' | 'percent' | 'fixed') || 'none',
        discount_value: num('discount_value'),
        amount_paid: num('amount_paid'),
        notes: str('notes'),
        terms: str('terms'),
        footer_text: str('footer_text'),
      }));
      const rawItems = Array.isArray(parsed['items']) ? (parsed['items'] as Record<string, unknown>[]) : [];
      if (rawItems.length > 0) {
        setFreshItems(true);
        setItems(rawItems.map(it => ({
          description: typeof it.description === 'string' ? it.description : '',
          quantity: typeof it.quantity === 'number' ? it.quantity : 1,
          unit: typeof it.unit === 'string' ? it.unit : 'unit',
          unit_price: typeof it.unit_price === 'number' ? it.unit_price : 0,
          amount: typeof it.amount === 'number' ? it.amount : 0,
        })));
        setTimeout(() => setFreshItems(false), 600);
      }
      setSavedInvoice(null);

      // Apply extracted brand colors if the AI found them in the document
      const colors = parsed['brand_colors'] as { primary: string; secondary: string; accent: string } | null;
      const hasColors = colors && (colors.primary || colors.secondary || colors.accent);
      if (hasColors && org) {
        const brandUpdate: Record<string, string> = {};
        if (colors.primary) brandUpdate.primary_color = colors.primary;
        if (colors.secondary) brandUpdate.secondary_color = colors.secondary;
        if (colors.accent) brandUpdate.accent_color = colors.accent;
        const updated = await api.organizations.update(org.id, brandUpdate as any);
        setOrg(updated);
        showToast('Document imported — brand colors updated', 'success');
      } else {
        showToast('Document imported — review and adjust before saving', 'success');
      }
    } catch (err) {
      showToast((err as Error).message || 'Could not read document', 'error');
    } finally {
      setImporting(false);
    }
  };

  const newDocument = () => {
    setSavedInvoice(null);
    setItems([{ description: '', quantity: 1, unit: 'session', unit_price: 0, amount: 0 }]);
    setForm(f => {
      const eo = effectiveOrg!;
      const prefix = f.type === 'quote' ? ((eo as any).quote_prefix || 'QUO') : f.type === 'invoice' ? eo.invoice_prefix : eo.receipt_prefix;
      return {
        ...f,
        number: generateInvoiceNumber(prefix, invoiceList.filter(i => i.type === f.type).length),
        client_id: '', client_name: '', client_email: '', client_phone: '',
        client_address: '', client_city: '', client_state: '', client_zip: '', client_company: '',
        status: 'draft' as const, amount_paid: 0,
      };
    });
  };

  if (orgLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={72} className="animate-float" />
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!effectiveOrg) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-sm animate-fade-up">
        <LogoMark size={96} className="mx-auto mb-6 animate-float" />
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Welcome to KraaFo</h2>
        <p className="text-slate-400 mb-8 text-sm leading-relaxed">Set up your organization to start creating professional invoices and receipts.</p>
        <button
          onClick={() => navigate('/setup')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all btn-glow"
        >
          Get Started
        </button>
      </div>
    </div>
  );

  const primary = effectiveOrg.primary_color;
  const sym = effectiveOrg.currency_symbol;

  return (
    <div className="min-h-screen bg-slate-50/70">

      {/* Top Bar */}
      <header className="bg-white/90 glass border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-2" style={{ height: '68px' }}>

          {/* Brand */}
          <button onClick={() => navigate('/')} className="shrink-0 hover:opacity-80 transition-opacity">
            <Logo size="sm" className="sm:hidden" />
            <Logo size="md" className="hidden sm:flex" />
          </button>

          {/* Type toggle — icons only on mobile, icons+labels on desktop */}
          <div className="flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
            {(['invoice', 'receipt', 'quote'] as const).map(t => {
              const prefix = t === 'invoice' ? effectiveOrg.invoice_prefix : t === 'receipt' ? effectiveOrg.receipt_prefix : (effectiveOrg as any).quote_prefix || 'QUO';
              return (
              <button key={t} onClick={() => {
                setField('type', t);
                setField('number', generateInvoiceNumber(prefix, invoiceList.filter(i => i.type === t).length));
                const quoteOnlyStatuses = ['accepted', 'declined', 'expired', 'invoiced'];
                const invoiceOnlyStatuses = ['paid', 'overdue', 'cancelled'];
                const currentStatus = form.status;
                if (t === 'quote' && invoiceOnlyStatuses.includes(currentStatus)) setField('status', 'draft');
                if (t !== 'quote' && quoteOnlyStatuses.includes(currentStatus)) setField('status', 'draft');
                setSavedInvoice(null);
              }} className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                form.type === t
                  ? t === 'quote' ? 'bg-violet-600 shadow-sm text-white' : 'bg-white shadow-sm text-slate-800'
                  : 'text-slate-400 hover:text-slate-600'
              )}>
                {t === 'invoice' ? <FileText className="w-3 h-3 shrink-0" /> : t === 'receipt' ? <Receipt className="w-3 h-3 shrink-0" /> : <Sparkles className="w-3 h-3 shrink-0" />}
                <span className="hidden sm:inline">{t === 'invoice' ? 'Invoice' : t === 'receipt' ? 'Receipt' : 'Quote'}</span>
              </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop-only: Documents, nav icons, New, Import, Save, Send, Download */}
            {!isDemo && (
              <button data-history-btn onClick={() => setShowList(v => !v)}
                className="relative hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all">
                Documents
                <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', showList && 'rotate-180')} />
                {invoiceList.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold shadow-sm" style={{ background: primary }}>
                    {invoiceList.length}
                  </span>
                )}
              </button>
            )}

            {!isDemo && <button onClick={() => navigate('/dashboard')} className="hidden md:block p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all" title="Dashboard"><BarChart2 className="w-4 h-4" /></button>}
            {!isDemo && <button onClick={() => navigate('/clients')} className="hidden md:block p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all" title="Clients"><Users className="w-4 h-4" /></button>}

            {/* Hamburger — mobile only, gives access to all nav */}
            {!isDemo && (
              <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all" title="Menu">
                <Menu className="w-4 h-4" />
              </button>
            )}

            <button onClick={() => navigate('/setup')} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all" title="Settings">
              <Settings className="w-4 h-4" />
            </button>

            <button onClick={newDocument} className="hidden md:block px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
              + New
            </button>

            {/* Import from image */}
            <input ref={importRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" className="hidden" onChange={handleImport} />

            {isDemo ? (
              <button onClick={() => navigate('/setup')} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all btn-glow" style={{ background: primary }}>
                <Lock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Get Started Free</span><span className="sm:hidden">Start</span>
              </button>
            ) : (
              /* Desktop action buttons — hidden on mobile (mobile uses bottom bar) */
              <div className="hidden lg:flex items-center gap-1.5">
                <button onClick={() => importRef.current?.click()} disabled={importing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all disabled:opacity-50">
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
                  {importing ? 'Reading…' : 'Import'}
                </button>
                <button onClick={handleSave} disabled={saving || !form.client_name} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40 btn-glow" style={{ background: primary }}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {savedInvoice ? 'Update' : 'Save'}
                </button>
                <button onClick={() => { if (!savedInvoice) { showToast('Save first, then send', 'info'); return; } setSendEmail(savedInvoice.client_email || form.client_email); setSendPhone(savedInvoice.client_phone || form.client_phone || ''); setShowSend(true); loadPaymentLinks(); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 transition-all btn-glow">
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
                <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-40 btn-glow-green">
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom action bar */}
      {!isDemo && (
        <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/98 backdrop-blur-sm border-t border-slate-100 px-4 pt-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.client_name} className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl text-sm font-bold text-white disabled:opacity-40 btn-glow" style={{ background: primary }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savedInvoice ? 'Update' : 'Save'}
            </button>
            <button onClick={() => { if (!savedInvoice) { showToast('Save first, then send', 'info'); return; } setSendEmail(savedInvoice.client_email || form.client_email); setSendPhone(savedInvoice.client_phone || form.client_phone || ''); setShowSend(true); loadPaymentLinks(); }} className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 transition-all btn-glow">
              <Send className="w-4 h-4" /> Send
            </button>
            <button onClick={handleDownload} disabled={downloading} className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-40 btn-glow-green">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF
            </button>
          </div>
        </div>
      )}

      {/* Mobile slide-over menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-slide-in-right"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <LogoMark size={24} />
                <span className="font-black text-slate-900 text-sm tracking-tight">KraaFo</span>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-2">
              <button
                onClick={() => { newDocument(); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                New Document
              </button>

              <button
                onClick={() => { setShowList(v => !v); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <span className="flex-1 text-left">Documents</span>
                {invoiceList.length > 0 && (
                  <span className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold shrink-0" style={{ background: primary }}>
                    {invoiceList.length > 9 ? '9+' : invoiceList.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { navigate('/dashboard'); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  <BarChart2 className="w-4 h-4 text-slate-500" />
                </div>
                Dashboard
              </button>

              <button
                onClick={() => { navigate('/clients'); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
                Clients
              </button>

              <button
                onClick={() => { importRef.current?.click(); setShowMobileMenu(false); }}
                disabled={importing}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  {importing ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin" /> : <ScanLine className="w-4 h-4 text-slate-500" />}
                </div>
                {importing ? 'Importing…' : 'Import Document'}
              </button>

              {form.type === 'quote' && savedInvoice && (
                <button
                  onClick={() => { handleConvertQuote(); setShowMobileMenu(false); }}
                  disabled={converting}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-50"
                >
                  <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                    {converting ? <Loader2 className="w-4 h-4 text-violet-500 animate-spin" /> : <FileText className="w-4 h-4 text-violet-500" />}
                  </div>
                  Convert to Invoice
                </button>
              )}

              <div className="h-px bg-slate-100 my-2 mx-5" />

              <button
                onClick={() => { navigate('/setup'); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4 text-slate-500" />
                </div>
                Settings
              </button>
            </nav>

            <div className="px-5 py-4 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-300 font-semibold tracking-wide">KraaFo — Free Professional Invoicing</p>
            </div>
          </div>
        </div>
      )}

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-indigo-600 text-white px-5 py-2.5 flex items-center justify-center gap-4 text-sm">
          <span className="font-medium">Demo Mode — Smart Fill, line items, and discounts are fully live. Save, Send &amp; Download unlock after setup.</span>
          <button
            onClick={() => navigate('/setup')}
            className="shrink-0 bg-white text-indigo-600 px-4 py-1 rounded-lg text-xs font-black hover:bg-indigo-50 transition-colors"
          >
            Get Started Free →
          </button>
        </div>
      )}

      {/* Documents Dropdown */}
      {showList && (
        <div
          data-history-dropdown
          className="fixed top-[58px] right-5 z-50 bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-100 w-[330px] max-h-[380px] overflow-y-auto animate-slide-down"
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
            <span className="text-sm font-bold text-slate-700">Recent Documents</span>
            <button onClick={() => setShowList(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {invoiceList.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">No documents yet</div>
          ) : invoiceList.map((inv, idx) => {
            const meta = STATUS_META[inv.status] ?? STATUS_META.draft;
            return (
              <div
                key={inv.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors animate-fade-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <button onClick={() => loadInvoice(inv)} className="w-full text-left px-4 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-800 truncate">{inv.number}</div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">{inv.client_name} · {inv.issue_date}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {inv.status !== 'none' && (
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold', meta.cls)}>{meta.label}</span>
                    )}
                    <span className="text-sm font-black text-slate-700">{formatCurrency(inv.total, sym)}</span>
                  </div>
                </button>
                <div className="flex gap-2 px-4 pb-3">
                  <button
                    onClick={() => loadInvoice(inv)}
                    className="flex-1 text-xs py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setShowList(false); (inv.type === 'quote' ? api.pdf.previewQuote(inv.id) : api.pdf.preview(inv.id)).catch(() => {}); }}
                    className="flex-1 text-xs py-1.5 rounded-xl text-white font-bold transition-all bg-emerald-600 hover:bg-emerald-700 btn-glow-green"
                  >
                    Preview PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share modal */}
      {showShareNudge && (() => {
        const SHARE_MSG = "I've been using KraaFo to create professional invoices and receipts - it's completely free!";
        const SHARE_URL = 'https://krafo.app';
        const SHARE_FULL = `${SHARE_MSG} Try it at ${SHARE_URL}`;
        const enc = encodeURIComponent;
        const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;
        const platforms = [
          {
            label: 'Twitter / X',
            bg: '#000', fg: '#fff',
            icon: (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            ),
            href: `https://twitter.com/intent/tweet?text=${enc(SHARE_MSG)}&url=${enc(SHARE_URL)}`,
          },
          {
            label: 'LinkedIn',
            bg: '#0A66C2', fg: '#fff',
            icon: (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            ),
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(SHARE_URL)}`,
          },
          {
            label: 'Facebook',
            bg: '#1877F2', fg: '#fff',
            icon: (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            ),
            href: `https://www.facebook.com/sharer/sharer.php?u=${enc(SHARE_URL)}`,
          },
          {
            label: 'Telegram',
            bg: '#26A5E4', fg: '#fff',
            icon: (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            ),
            href: `https://t.me/share/url?url=${enc(SHARE_URL)}&text=${enc(SHARE_MSG)}`,
          },
          {
            label: 'Email',
            bg: '#6B7280', fg: '#fff',
            icon: <Send className="w-5 h-5" />,
            href: `mailto:?subject=${enc('Free professional invoicing tool')}&body=${enc(SHARE_FULL)}`,
          },
        ];

        const handleNativeShare = async () => {
          try {
            // Pass text and url as separate fields — WhatsApp and all apps combine them correctly
            await navigator.share({ title: 'KraaFo — Free Professional Invoicing', text: SHARE_MSG, url: SHARE_URL });
          } catch {}
        };

        const handleCopy = () => {
          navigator.clipboard.writeText(SHARE_FULL).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
          });
        };

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowShareNudge(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-indigo-600 px-6 pt-6 pb-5 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold">Love KraaFo? Share it! 🎉</p>
                    <p className="text-xs text-indigo-200 mt-1">Help a fellow business owner — it's free</p>
                  </div>
                  <button onClick={() => setShowShareNudge(false)} className="opacity-60 hover:opacity-100 transition-opacity mt-0.5">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-3">
                {/* Primary action — native share sheet handles WhatsApp, iMessage, every app correctly */}
                <button
                  onClick={canNativeShare ? handleNativeShare : handleCopy}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  {canNativeShare ? 'Share — WhatsApp, iMessage & more' : 'Copy message to share'}
                </button>

                {/* Platform web fallbacks */}
                <div className="grid grid-cols-4 gap-2">
                  {platforms.map(p => (
                    <a
                      key={p.label}
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                      style={{ background: p.bg, color: p.fg }}
                    >
                      {p.icon}
                      <span className="text-[10px] leading-tight text-center">{p.label}</span>
                    </a>
                  ))}
                </div>

                {/* Copy full message */}
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
                >
                  {linkCopied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {linkCopied ? 'Copied!' : 'Copy message'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div key={toast.key} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
          <div className={cn(
            'flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-auto',
            toast.type === 'success' ? 'bg-slate-900 text-white' :
            toast.type === 'error'   ? 'bg-red-600 text-white' :
                                       'bg-slate-800 text-white'
          )}>
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-28 lg:pb-7">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Document Header */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 hover-lift animate-fade-up delay-75">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>{form.type === 'invoice' ? 'Invoice' : 'Receipt'} Number</label>
                <input value={form.number} onChange={e => setField('number', e.target.value)} className={INPUT + ' font-mono'} />
              </div>
              <div>
                <label className={LABEL}>Status</label>
                <select value={form.status} onChange={e => setField('status', e.target.value)} className={INPUT}>
                  {form.type !== 'quote' && <option value="none">No Status (Hidden)</option>}
                  {(form.type === 'quote'
                    ? ['draft', 'sent', 'accepted', 'declined', 'expired']
                    : ['draft', 'sent', 'paid', 'overdue', 'cancelled']
                  ).map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Issue Date</label>
                <input value={form.issue_date} onChange={e => setField('issue_date', e.target.value)} type="date" className={INPUT} />
              </div>
              {form.type === 'invoice' ? (
                <div>
                  <label className={LABEL}>Due Date</label>
                  <input value={form.due_date} onChange={e => setField('due_date', e.target.value)} type="date" className={INPUT} />
                </div>
              ) : form.type === 'quote' ? (
                <div>
                  <label className={LABEL}>Expiry Date</label>
                  <input value={form.due_date} onChange={e => setField('due_date', e.target.value)} type="date" className={INPUT} />
                </div>
              ) : (
                <div>
                  <label className={LABEL}>Paid Date</label>
                  <input value={form.paid_date} onChange={e => setField('paid_date', e.target.value)} type="date" className={INPUT} />
                </div>
              )}
            </div>
          </div>

          {/* Client Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 hover-lift animate-fade-up delay-150">
            <h3 className="text-sm font-black text-slate-700 mb-5 tracking-tight">Client Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className={LABEL}>Full Name <span className="text-indigo-400 normal-case text-xs font-semibold">*</span></label>
                <input
                  value={form.client_name}
                  onChange={e => { setField('client_name', e.target.value); setField('client_id', ''); searchClients(e.target.value); }}
                  onBlur={() => setTimeout(() => setShowClientSuggestions(false), 150)}
                  placeholder="John Smith"
                  className={INPUT}
                />
                {showClientSuggestions && clientSuggestions.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    {clientSuggestions.map(c => (
                      <button key={c.id} onMouseDown={() => selectClient(c)}
                        className="w-full px-3 py-2 text-left hover:bg-indigo-50 transition-colors">
                        <div className="text-xs font-bold text-slate-800">{c.name}</div>
                        {c.company && <div className="text-[10px] text-slate-400">{c.company}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={LABEL}>Company</label>
                <input value={form.client_company} onChange={e => setField('client_company', e.target.value)} placeholder="Company Name" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input value={form.client_email} onChange={e => setField('client_email', e.target.value)} type="email" placeholder="client@email.com" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Phone</label>
                <input value={form.client_phone} onChange={e => setField('client_phone', e.target.value)} placeholder="+1 (555) 000-0000" className={INPUT} />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className={LABEL}>Address</label>
                <input value={form.client_address} onChange={e => setField('client_address', e.target.value)} placeholder="123 Client Street" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>City</label>
                <input value={form.client_city} onChange={e => setField('client_city', e.target.value)} placeholder="Los Angeles" className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>State</label>
                  <input value={form.client_state} onChange={e => setField('client_state', e.target.value)} placeholder="CA" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>ZIP</label>
                  <input value={form.client_zip} onChange={e => setField('client_zip', e.target.value)} placeholder="90001" className={INPUT} />
                </div>
              </div>
            </div>
          </div>

          {/* Services / Line Items */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 hover-lift animate-fade-up delay-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h3 className="text-sm font-black text-slate-700 tracking-tight">Services & Line Items</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={industry}
                  onChange={e => {
                    const next = e.target.value;
                    setIndustry(next);
                    setClientType(getClientTypes(next)[0].value);
                  }}
                  className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-600 font-semibold hover:border-slate-300 transition-colors cursor-pointer"
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                  ))}
                </select>
                <select
                  value={clientType}
                  onChange={e => setClientType(e.target.value)}
                  className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-600 font-semibold hover:border-slate-300 transition-colors cursor-pointer"
                >
                  {getClientTypes(industry).map(ct => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleSmartFill}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all text-white disabled:opacity-40 btn-glow shadow-sm"
                  style={{ background: primary }}
                >
                  <Sparkles className={cn('w-3 h-3', aiLoading && 'animate-spin-spark')} />
                  {aiLoading ? 'Filling…' : 'Smart Fill'}
                </button>
              </div>
            </div>

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-1 mb-3 pb-2 border-b border-slate-100">
              <div className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</div>
              <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Qty</div>
              <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Unit</div>
              <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Price</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={cn('grid grid-cols-12 gap-2 items-start group', freshItems && 'animate-fade-in')}
                  style={freshItems ? { animationDelay: `${idx * 50}ms` } : {}}
                >
                  <div className="col-span-11 sm:col-span-5">
                    <input
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      placeholder="Service description"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all hover:border-slate-300 placeholder:text-slate-300"
                    />
                  </div>
                  <div className="col-span-1 flex sm:hidden justify-end pt-2">
                    <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      type="number" min="0" step="0.5"
                      className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all hover:border-slate-300"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <select value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white transition-all hover:border-slate-300">
                      {['session', 'hour', 'room', 'sqft', 'unit', 'visit', 'day'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      value={item.unit_price}
                      onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      type="number" min="0" step="0.01"
                      className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all hover:border-slate-300"
                    />
                  </div>
                  <div className="hidden sm:flex col-span-1 justify-end">
                    <button
                      onClick={() => removeItem(idx)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all p-1.5 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {item.amount > 0 && (
                    <div className="col-span-12 text-right text-xs text-slate-400 -mt-1 pr-9 font-semibold">
                      = {formatCurrency(item.amount, sym)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addItem}
              className="mt-4 flex items-center gap-1.5 text-sm font-bold text-indigo-500 hover:text-indigo-700 transition-colors group"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Add Line Item
            </button>
          </div>

          {/* Notes, Terms & Footer */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 hover-lift animate-fade-up delay-250">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={LABEL}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setField('notes', e.target.value)}
                  rows={4}
                  placeholder="A note for your client..."
                  className={INPUT + ' resize-none'}
                />
              </div>
              <div>
                <label className={LABEL}>Terms & Conditions</label>
                <textarea
                  value={form.terms}
                  onChange={e => setField('terms', e.target.value)}
                  rows={4}
                  placeholder="Payment terms, cancellation policy..."
                  className={INPUT + ' resize-none'}
                />
              </div>
            </div>
            <div>
              <label className={LABEL}>Footer Text <span className="normal-case text-slate-300 font-normal tracking-normal">— appears at the very bottom of the PDF</span></label>
              <input
                value={form.footer_text}
                onChange={e => setField('footer_text', e.target.value)}
                placeholder="e.g. Thank you for choosing us! · www.yoursite.com"
                className={INPUT}
              />
            </div>
          </div>
          {/* Signature */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 hover-lift animate-fade-up delay-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-700 tracking-tight">Signature</h3>
              {signature && (
                <button
                  onClick={removeSignature}
                  className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>

            {signature ? (
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-center min-h-[72px]">
                    <img src={signature} alt="Signature" className="max-h-14 max-w-[200px] object-contain" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 text-center">This signature will appear on your documents</p>
                </div>
                <button
                  onClick={() => setShowSignaturePad(true)}
                  className="shrink-0 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Change
                </button>
              </div>
            ) : (
              <div
                onClick={() => setShowSignaturePad(true)}
                className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
              >
                <PenLine className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                <p className="text-sm font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">Draw or upload a signature</p>
                <p className="text-xs text-slate-300 mt-1">Appears on invoices &amp; receipts as "Authorized Signature"</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">

          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm lg:sticky lg:top-[70px] overflow-hidden animate-fade-up delay-100">
            {/* Color accent bar */}
            <div className="h-1" style={{ background: `linear-gradient(90deg, ${primary}, ${effectiveOrg.secondary_color})` }} />

            <div className="p-4 sm:p-5">
              <h3 className="text-sm font-black text-slate-700 mb-5 tracking-tight">Summary</h3>

              {/* Discount */}
              <div className="mb-4 space-y-2">
                <label className={LABEL}>Discount</label>
                <select value={form.discount_type} onChange={e => setField('discount_type', e.target.value)} className={INPUT}>
                  <option value="none">No Discount</option>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                {form.discount_type !== 'none' && (
                  <input
                    value={form.discount_value}
                    onChange={e => setField('discount_value', parseFloat(e.target.value) || 0)}
                    type="number" min="0" step="0.01"
                    placeholder={form.discount_type === 'percent' ? 'e.g. 10' : 'e.g. 25.00'}
                    className={INPUT + ' animate-fade-in'}
                  />
                )}
              </div>

              {/* Tax */}
              <div className="mb-5">
                <label className={LABEL}>{effectiveOrg.tax_name} Rate (%)</label>
                <input value={form.tax_rate} onChange={e => setField('tax_rate', parseFloat(e.target.value) || 0)} type="number" min="0" max="100" step="0.1" className={INPUT} />
              </div>

              {/* Amounts */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(subtotal, sym)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Discount</span>
                    <span className="text-red-500 font-semibold">−{formatCurrency(discountAmount, sym)}</span>
                  </div>
                )}
                {form.tax_rate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{effectiveOrg.tax_name} ({form.tax_rate}%)</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(taxAmount, sym)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100">
                  <span className="font-black text-slate-800 text-sm">Total</span>
                  <span className="text-2xl font-black tracking-tight" style={{ color: primary }}>
                    {formatCurrency(total, sym)}
                  </span>
                </div>
              </div>

              {/* Amount Paid */}
              {(form.type === 'receipt' || form.amount_paid > 0) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label className={LABEL}>Amount Paid</label>
                  <input value={form.amount_paid} onChange={e => setField('amount_paid', parseFloat(e.target.value) || 0)} type="number" min="0" step="0.01" className={INPUT} />
                  <div className="flex justify-between text-sm mt-3 font-black">
                    <span className="text-slate-600">Balance Due</span>
                    <span className="text-base" style={{ color: balanceDue > 0 ? '#DC2626' : '#059669' }}>
                      {formatCurrency(balanceDue, sym)}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions — desktop only; mobile uses the fixed bottom bar */}
              <div className="mt-5 space-y-2.5 hidden lg:block">
                {isDemo ? (
                  <button
                    onClick={() => navigate('/setup')}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all btn-glow"
                    style={{ background: primary }}
                  >
                    <Lock className="w-4 h-4" /> Get Started to Save & Download
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving || !form.client_name}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 btn-glow"
                      style={{ background: primary }}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {savedInvoice ? 'Update' : 'Save'} {form.type === 'invoice' ? 'Invoice' : form.type === 'receipt' ? 'Receipt' : 'Quote'}
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-40 btn-glow-green"
                    >
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Download PDF
                    </button>
                  </>
                )}
                {form.type === 'quote' && savedInvoice && (
                  <button
                    onClick={handleConvertQuote}
                    disabled={converting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-40"
                  >
                    {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Convert to Invoice
                  </button>
                )}
              </div>

              {savedInvoice && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-bold animate-fade-in">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Saved as {savedInvoice.number}
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover-lift animate-fade-up delay-200">
            <div className="h-1" style={{ background: `linear-gradient(90deg, ${primary}, ${effectiveOrg.secondary_color})` }} />
            <div className="p-5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Eye className="w-3 h-3" /> Live Preview
              </div>
              {isDemo
                ? (
                  <div className="mb-3 border-2 border-dashed border-indigo-200 rounded-lg px-3 py-2 flex items-center gap-2 text-indigo-400">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span className="text-[10px] font-bold">Your logo appears here after setup</span>
                  </div>
                )
                : org?.logo_url
                  ? <img src={org.logo_url} alt="logo" className="max-h-8 max-w-28 object-contain mb-3" />
                  : <div className="text-sm font-black mb-3 tracking-tight" style={{ color: primary }}>{org?.name}</div>
              }
              <div className="flex justify-between items-start mb-4">
                <div>
                  {form.client_name && <div className="text-xs font-bold text-slate-800">{form.client_name}</div>}
                  {form.client_company && <div className="text-xs text-slate-400 mt-0.5">{form.client_company}</div>}
                </div>
                <div className="text-right">
                  <div className="text-sm font-black uppercase tracking-wider" style={{ color: primary }}>{form.type}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{form.number}</div>
                </div>
              </div>

              {items.filter(i => i.description).length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-300 italic">Add services to preview</div>
              ) : (
                <>
                  {items.filter(i => i.description).slice(0, 4).map((item, i) => (
                    <div key={i} className="flex justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-slate-500 truncate mr-2">{item.description}</span>
                      <span className="font-semibold text-slate-700 shrink-0">{formatCurrency(item.amount, sym)}</span>
                    </div>
                  ))}
                  {items.filter(i => i.description).length > 4 && (
                    <div className="text-xs text-slate-300 pt-1.5">+{items.filter(i => i.description).length - 4} more</div>
                  )}
                </>
              )}

              <div className="flex justify-between items-center text-sm font-black mt-4 pt-3 border-t-2" style={{ borderColor: primary }}>
                <span className="text-slate-700">Total</span>
                <span style={{ color: primary }}>{formatCurrency(total, sym)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showSignaturePad && (
        <SignaturePad
          existing={signature || undefined}
          onSave={saveSignature}
          onClose={() => setShowSignaturePad(false)}
        />
      )}

      {/* Send modal */}
      {showSend && savedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-bounce-in overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-800">Send {savedInvoice.type === 'receipt' ? 'Receipt' : 'Invoice'}</h2>
              <button onClick={() => setShowSend(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Inputs */}
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Email address</label>
                  <input
                    type="email"
                    value={sendEmail}
                    onChange={e => setSendEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Phone — WhatsApp &amp; SMS</label>
                  <input
                    type="tel"
                    value={sendPhone}
                    onChange={e => setSendPhone(e.target.value)}
                    placeholder="+233 20 000 0000"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Add a note <span className="font-normal normal-case">(optional — email only)</span></label>
                  <textarea
                    value={sendMessage}
                    onChange={e => setSendMessage(e.target.value)}
                    placeholder="Any additional information for the client…"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none h-14 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>

              {/* Channel status indicators */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Email ready
                </div>
                <div className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  WhatsApp ready
                </div>
                <div className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  SMS ready
                </div>
              </div>

              {/* Send All — primary action */}
              <button
                onClick={handleSendAll}
                disabled={sending || (!sendEmail && !sendPhone)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all btn-glow"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send via All Channels'}
              </button>

              {/* Individual channel buttons */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400 font-medium">or send individually</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleSendEmail}
                  disabled={sending || !sendEmail}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> Email
                </button>
                <button
                  onClick={handleWhatsApp}
                  disabled={!sendPhone}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button
                  onClick={handleSMS}
                  disabled={!sendPhone}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 disabled:opacity-40 transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> SMS
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center">SMS works best on mobile. On desktop it opens your Messages app if Handoff is enabled.</p>

              {/* Payment links */}
              {paymentLinks && Object.keys(paymentLinks.links || {}).length > 0 && (
                <div className="border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center"><CreditCard className="w-3.5 h-3.5 text-amber-600" /></div>
                    <span className="text-sm font-black text-slate-700">Payment Options</span>
                  </div>
                  <div className="space-y-2">
                    {paymentLinks.links.paypal && (
                      <a href={paymentLinks.links.paypal} target="_blank" rel="noreferrer"
                        className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors">
                        <span>💳 Pay with PayPal</span>
                        <span>{paymentLinks.currency_symbol}{paymentLinks.amount?.toFixed(2)}</span>
                      </a>
                    )}
                    {paymentLinks.links.mpesa && (
                      <div className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs">
                        <div className="font-bold mb-0.5">📱 M-Pesa</div>
                        <div className="text-emerald-600">{paymentLinks.links.mpesa.instructions}</div>
                      </div>
                    )}
                    {paymentLinks.links.mtn && (
                      <div className="px-3 py-2 rounded-xl bg-yellow-50 text-yellow-800 text-xs">
                        <div className="font-bold mb-0.5">📱 MTN Mobile Money</div>
                        <div className="text-yellow-600">{paymentLinks.links.mtn.instructions}</div>
                      </div>
                    )}
                    {paymentLinks.links.airtel && (
                      <div className="px-3 py-2 rounded-xl bg-red-50 text-red-800 text-xs">
                        <div className="font-bold mb-0.5">📱 Airtel Money</div>
                        <div className="text-red-600">{paymentLinks.links.airtel.instructions}</div>
                      </div>
                    )}
                    {paymentLinks.links.telecel && (
                      <div className="px-3 py-2 rounded-xl bg-red-50 text-red-800 text-xs">
                        <div className="font-bold mb-0.5">📱 Telecel Cash</div>
                        <div className="text-red-600">{paymentLinks.links.telecel.instructions}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {paymentLinks && Object.keys(paymentLinks.links || {}).length === 0 && (
                <p className="text-[10px] text-slate-400 text-center">Add payment details (PayPal, M-Pesa, MTN, Airtel, Telecel) in <button onClick={() => { setShowSend(false); navigate('/setup'); }} className="underline font-bold">Settings</button></p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
