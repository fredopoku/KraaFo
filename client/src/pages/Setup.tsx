import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Check, ChevronRight, ChevronLeft, Loader2, Building2, Palette, CreditCard, FileText, ShieldCheck } from 'lucide-react';
import { LogoMark } from '../components/Logo';
import { api } from '../utils/api';
import { Organization, BrandColors } from '../types';
import { cn } from '../utils/cn';
import { useOrg } from '../hooks/useOrg';
import { TurnstileWidget, TURNSTILE_ENABLED } from '../components/Turnstile';

const STEPS = [
  { id: 1, label: 'Company Info', icon: Building2 },
  { id: 2, label: 'Branding', icon: Palette },
  { id: 3, label: 'Invoice Settings', icon: FileText },
  { id: 4, label: 'Banking & Payments', icon: CreditCard },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

export default function Setup() {
  const navigate = useNavigate();
  const { org, setOrg } = useOrg();
  const [humanVerified, setHumanVerified] = useState(false);
  const [cfToken, setCfToken] = useState('');
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [generatingDkim, setGeneratingDkim] = useState(false);
  const [dkimResult, setDkimResult] = useState<{ dnsName: string; dnsRecord: string } | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', country: 'US', website: '',
    logo_url: '', primary_color: '#2563EB', secondary_color: '#1E40AF', accent_color: '#DBEAFE',
    tax_name: 'Tax', tax_rate: 0, currency: 'USD', currency_symbol: '$',
    invoice_prefix: 'INV', receipt_prefix: 'REC', quote_prefix: 'QUO', payment_terms: 'Net 30', notes: '',
    bank_name: '', bank_account: '', bank_routing: '',
    paypal_email: '', mpesa_number: '', mtn_number: '', airtel_number: '', telecel_number: '',
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', smtp_from: '',
    dkim_domain: '', dkim_selector: 'krafo', dkim_private_key: '',
  });

  const set = (key: string, val: string | number) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    if (!org) return;
    setForm(f => ({
      ...f,
      name: org.name || '',
      email: org.email || '',
      phone: org.phone || '',
      address: org.address || '',
      city: org.city || '',
      state: org.state || '',
      zip: org.zip || '',
      country: org.country || 'US',
      website: org.website || '',
      logo_url: org.logo_url || '',
      primary_color: org.primary_color || '#2563EB',
      secondary_color: org.secondary_color || '#1E40AF',
      accent_color: org.accent_color || '#DBEAFE',
      tax_name: org.tax_name || 'Tax',
      tax_rate: org.tax_rate ?? 0,
      currency: org.currency || 'USD',
      currency_symbol: org.currency_symbol || '$',
      invoice_prefix: org.invoice_prefix || 'INV',
      receipt_prefix: org.receipt_prefix || 'REC',
      quote_prefix: org.quote_prefix || 'QUO',
      payment_terms: org.payment_terms || 'Net 30',
      notes: org.notes || '',
      bank_name: org.bank_name || '',
      bank_account: org.bank_account || '',
      bank_routing: org.bank_routing || '',
      paypal_email: org.paypal_email || '',
      mpesa_number: org.mpesa_number || '',
      mtn_number: org.mtn_number || '',
      airtel_number: org.airtel_number || '',
      telecel_number: org.telecel_number || '',
      smtp_host: org.smtp_host || '',
      smtp_port: org.smtp_port || 587,
      smtp_user: org.smtp_user || '',
      smtp_pass: org.smtp_pass || '',
      smtp_from: org.smtp_from || '',
      dkim_domain: org.dkim_domain || '',
      dkim_selector: org.dkim_selector || 'krafo',
      dkim_private_key: org.dkim_private_key || '',
    }));
    if (org.logo_url) setLogoPreview(org.logo_url);
  }, [org?.id]);

  const handleGenerateDkim = async () => {
    if (!form.dkim_domain) return;
    setGeneratingDkim(true);
    try {
      const result = await api.deliver.generateDKIM(form.dkim_domain, form.dkim_selector || 'krafo');
      set('dkim_private_key', result.privateKey);
      setDkimResult({ dnsName: result.dnsName, dnsRecord: result.dnsRecord });
    } catch (err) {
      setSaveError('Failed to generate DKIM keys: ' + (err as Error).message);
    } finally {
      setGeneratingDkim(false);
    }
  };

  const handleTestEmail = async () => {
    if (!org) return;
    setTestingEmail(true);
    setTestEmailResult('');
    try {
      await api.deliver.testEmail(org.id, org.email || org.smtp_user || '');
      setTestEmailResult('success');
    } catch (err) {
      setTestEmailResult('error:' + (err as Error).message);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    setLogoPreview(URL.createObjectURL(file));
    try {
      const result = await api.upload.logo(file);
      set('logo_url', result.logo_url);
      set('primary_color', result.colors.primary);
      set('secondary_color', result.colors.secondary);
      set('accent_color', result.colors.accent);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const saved = org
        ? await api.organizations.update(org.id, form)
        : await api.organizations.create(form);
      setOrg(saved);
      navigate('/generator');
    } catch (err) {
      console.error('Setup failed:', err);
      setSaveError('Could not connect to server. Make sure the backend is running on port 3001.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Verification gate — only for brand-new users ──────────── */
  if (!org && !humanVerified && TURNSTILE_ENABLED) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center">
          <div className="bg-indigo-600 px-8 py-6 flex flex-col items-center">
            <LogoMark size={52} />
            <h1 className="text-white text-xl font-black mt-3 tracking-tight">Welcome to KraaFo</h1>
            <p className="text-indigo-200 text-sm mt-1">Free professional invoicing for your business</p>
          </div>
          <div className="px-8 py-8 space-y-5">
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Quick security check before you get started</span>
            </div>
            <TurnstileWidget
              onVerify={token => { setCfToken(token); }}
              onExpire={() => setCfToken('')}
            />
            <button
              onClick={() => setHumanVerified(true)}
              disabled={!cfToken}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue to Setup <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-slate-300">Protected by Cloudflare Turnstile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div style={{ background: form.primary_color }} className="px-8 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <LogoMark size={52} />
              <h1 className="text-2xl font-black tracking-tight">Set Up KraaFo</h1>
            </div>
            <span className="text-white/70 text-sm">Step {step} of {STEPS.length}</span>
          </div>
          <div className="flex gap-2">
            {STEPS.map(s => (
              <div key={s.id} className={cn('h-1.5 flex-1 rounded-full transition-all', step >= s.id ? 'bg-white' : 'bg-white/30')} />
            ))}
          </div>
          <div className="flex gap-4 mt-4">
            {STEPS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => id < step && setStep(id)} className={cn('flex items-center gap-1.5 text-xs transition-all', step === id ? 'text-white font-semibold' : step > id ? 'text-white/80 cursor-pointer hover:text-white' : 'text-white/40')}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Tell us about your company</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Sparkle Clean Co." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="info@example.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main Street" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="New York" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="NY" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                  <input value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="10001" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yourcompany.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          {/* Step 2: Branding */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Brand your documents</h2>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <p className="text-sm text-gray-500">Uploading & extracting brand colors...</p>
                    </div>
                  ) : logoPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={logoPreview} alt="Logo" className="max-h-16 max-w-48 object-contain" />
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Logo uploaded! Brand colors auto-extracted.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <p className="text-sm text-gray-600 font-medium">Click to upload logo</p>
                      <p className="text-xs text-gray-400">PNG, JPG, SVG up to 5MB. Colors auto-extracted.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Color Pickers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Brand Colors</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'primary_color', label: 'Primary' },
                    { key: 'secondary_color', label: 'Secondary' },
                    { key: 'accent_color', label: 'Accent / Background' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <input type="color" value={(form as any)[key]} onChange={e => set(key, e.target.value)} className="w-14 h-14 cursor-pointer rounded-lg border-2 border-gray-200 p-0.5" />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{label}</span>
                      <span className="text-xs text-gray-400 font-mono">{(form as any)[key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <div style={{ background: form.primary_color }} className="h-2" />
                <div className="p-4 bg-white">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-bold" style={{ color: form.primary_color }}>{form.name || 'Your Company'}</div>
                    <div className="text-xl font-black" style={{ color: form.primary_color }}>INVOICE</div>
                  </div>
                  <div className="mt-3 p-2 rounded" style={{ background: form.accent_color }}>
                    <div className="h-2 rounded w-3/4 mb-1" style={{ background: form.primary_color, opacity: 0.3 }} />
                    <div className="h-2 rounded w-1/2" style={{ background: form.primary_color, opacity: 0.2 }} />
                  </div>
                </div>
                <div style={{ background: form.secondary_color }} className="h-1" />
              </div>
            </div>
          )}

          {/* Step 3: Invoice Settings */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Invoice & Tax Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                  <input value={form.invoice_prefix} onChange={e => set('invoice_prefix', e.target.value)} placeholder="INV" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-gray-400 mt-1">e.g. INV-2025-0001</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Prefix</label>
                  <input value={form.receipt_prefix} onChange={e => set('receipt_prefix', e.target.value)} placeholder="REC" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-gray-400 mt-1">e.g. REC-2025-0001</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={form.currency} onChange={e => {
                  const c = CURRENCIES.find(x => x.code === e.target.value);
                  set('currency', e.target.value);
                  if (c) set('currency_symbol', c.symbol);
                }} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Label</label>
                  <input value={form.tax_name} onChange={e => set('tax_name', e.target.value)} placeholder="Tax / GST / VAT" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
                  <input value={form.tax_rate} onChange={e => set('tax_rate', parseFloat(e.target.value) || 0)} type="number" min="0" max="100" step="0.1" placeholder="8.5" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Payment Terms</label>
                <select value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['Due on Receipt','Net 7','Net 14','Net 30','Net 45','Net 60'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Notes / Footer</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Thank you for your business! Payment accepted via bank transfer, cash, or card." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          )}

          {/* Step 4: Banking */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Banking Details <span className="text-gray-400 text-sm font-normal">(optional)</span></h2>
              <p className="text-sm text-gray-500">These appear on your invoices to guide clients on how to pay you.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="Chase Bank" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input value={form.bank_account} onChange={e => set('bank_account', e.target.value)} placeholder="XXXX XXXX XXXX 1234" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Routing / Sort Code</label>
                <input value={form.bank_routing} onChange={e => set('bank_routing', e.target.value)} placeholder="021000021" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Mobile Money */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Mobile Money (Africa)</h3>
                <div className="space-y-3">
                  {[
                    { key: 'mpesa_number', label: 'M-Pesa Number', placeholder: '+254 700 000 000' },
                    { key: 'mtn_number', label: 'MTN Mobile Money', placeholder: '+233 24 000 0000' },
                    { key: 'airtel_number', label: 'Airtel Money', placeholder: '+256 75 000 0000' },
                    { key: 'telecel_number', label: 'Telecel Cash', placeholder: '+233 50 000 0000' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                      <input value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* PayPal */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-3">PayPal</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PayPal Email</label>
                  <input value={form.paypal_email} onChange={e => set('paypal_email', e.target.value)} placeholder="you@paypal.com" type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>


              {saveError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{saveError}</div>
              )}
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-2"><Check className="w-4 h-4" /> {org ? 'Update your settings' : "You're all set!"}</div>
                <p className="text-blue-600 text-sm">{org ? 'Click "Save Settings" to apply your changes and return to the dashboard.' : 'Click "Launch KraaFo" to start generating professional invoices and receipts for your business.'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            {step > 1 ? 'Back' : 'Home'}
          </button>
          {step < STEPS.length ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !form.name.trim()}
              className="flex items-center gap-1.5 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
              style={{ background: form.primary_color }}
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-2 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
              style={{ background: form.primary_color }}
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> {org ? 'Save Settings' : 'Launch KraaFo'}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
