import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Palette, Download, CheckCircle, ArrowRight, FileText, Receipt, Send, Globe, Star, TrendingUp, Mail, MessageSquare, Zap } from 'lucide-react';
import { Logo, LogoMark } from '../components/Logo';
import { api } from '../utils/api';


const features = [
  { icon: Sparkles, title: 'Smart Fill',            desc: 'Pick your industry and job type. KraaFo fills in your line items, pricing, notes, and terms. Review, adjust, send.' },
  { icon: Palette,  title: 'Auto Branding',         desc: 'Upload your logo and KraaFo pulls your brand colors. Every document matches your business, automatically.' },
  { icon: FileText, title: 'Professional Invoices', desc: 'Branded payment requests with due dates, tax, discounts, and a full itemized breakdown.' },
  { icon: Receipt,  title: 'Instant Receipts',      desc: 'Generate a "PAYMENT RECEIVED" receipt the moment a client pays. No templates, no fiddling.' },
  { icon: Send,     title: 'WhatsApp, SMS & Email',  desc: 'Send from inside KraaFo. Your client gets the PDF with a clean message via WhatsApp, SMS, or email.' },
  { icon: Globe,    title: 'Works Worldwide',       desc: 'Multi-currency. M-Pesa, MTN, Airtel, Telecel, PayPal, and bank transfer. Works in any country.' },
];

type ReviewCard = { key: string; rating: number; text: string; name: string; sub: string; photo?: string };

/* ─── Device Frame Components ─────────────────────────────── */

function LaptopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative select-none" style={{
      /* Three-layer shadow: wide diffuse + mid-range + tight contact */
      filter:
        'drop-shadow(0 80px 120px rgba(0,0,0,0.28))' +
        ' drop-shadow(0 32px 48px rgba(0,0,0,0.18))' +
        ' drop-shadow(0 8px 16px rgba(0,0,0,0.12))',
    }}>

      {/* ══ SCREEN LID ══════════════════════════════════════════ */}
      <div style={{
        /* Outer silver/white aluminum shell — matches reference exactly */
        background: 'linear-gradient(158deg,#f8f8f8 0%,#ececec 22%,#e0e0e0 48%,#d6d6d6 72%,#cccccc 100%)',
        borderRadius: '20px 20px 4px 4px',
        padding: '8px 8px 0',
        boxShadow:
          'inset 0 0 0 0.5px rgba(255,255,255,1),' +
          'inset 0 2px 6px rgba(255,255,255,0.6),' +
          '0 0 0 0.5px rgba(0,0,0,0.16)',
      }}>
        {/* Ultra-thin black bezel — matches reference (almost bezel-less) */}
        <div style={{
          background: '#0e0e10',
          borderRadius: '13px 13px 2px 2px',
          padding: '4px 4px 0',
          position: 'relative',
        }}>
          {/* MacBook Pro–style notch — flat rectangle dropping from top */}
          <div style={{
            position: 'absolute', top: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: 72, height: 16,
            background: '#0e0e10',
            borderRadius: '0 0 10px 10px',
            zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Camera lens */}
            <div style={{
              width: 6, height: 6, borderRadius: '50%', marginTop: 4,
              background: 'radial-gradient(circle at 38% 38%, #2c2c32, #080808)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07), 0 0 0 1px rgba(0,0,0,0.6)',
            }} />
          </div>

          {/* Screen — fills almost the full lid (edge-to-edge feel) */}
          <div style={{
            overflow: 'hidden',
            borderRadius: '10px 10px 0 0',
            background: '#fff',
          }}>
            {children}
          </div>
        </div>
      </div>

      {/* ══ HINGE ════════════════════════════════════════════════ */}
      <div style={{
        height: 5,
        background:
          'linear-gradient(90deg,' +
          '#888 0%,#b0b0b8 10%,#d0d0d8 26%,#e4e4ec 44%,#ebebf2 50%,#e4e4ec 56%,#d0d0d8 74%,#b0b0b8 90%,#888 100%)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3)',
      }} />

      {/* ══ BASE ═════════════════════════════════════════════════ */}
      <div style={{
        /* Same silver as the lid outer shell */
        background: 'linear-gradient(174deg,#f4f4f4 0%,#e8e8e8 28%,#dcdcdc 58%,#d0d0d0 100%)',
        borderRadius: '0 0 18px 18px',
        padding: '14px 20px 18px',
        boxShadow:
          'inset 0 2px 0 rgba(255,255,255,0.7),' +
          'inset 0 -1px 0 rgba(0,0,0,0.06),' +
          '0 0 0 0.5px rgba(0,0,0,0.13)',
      }}>

        {/* Dark keyboard island — raised block like reference image */}
        <div style={{
          background: 'linear-gradient(180deg,#1e1e22 0%,#161618 100%)',
          borderRadius: 8,
          padding: '5px 10px 6px',
          marginBottom: 8,
          boxShadow:
            '0 3px 10px rgba(0,0,0,0.35),' +
            'inset 0 1px 0 rgba(255,255,255,0.04),' +
            'inset 0 -1px 0 rgba(0,0,0,0.2)',
        }}>
          {/* 5 key rows */}
          {[
            { count: 14, spaceAt: -1 },
            { count: 14, spaceAt: -1 },
            { count: 13, spaceAt: -1 },
            { count: 12, spaceAt: -1 },
            { count:  4, spaceAt:  1 },
          ].map(({ count, spaceAt }, row) => (
            <div key={row} style={{ display:'flex', gap: 2, marginBottom: row < 4 ? 2 : 0 }}>
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{
                  flex: i === spaceAt ? 7 : 1,
                  height: 5,
                  background: 'linear-gradient(180deg,#38383e 0%,#2a2a30 100%)',
                  borderRadius: 2,
                  boxShadow: '0 1px 0 rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
                }} />
              ))}
            </div>
          ))}
        </div>

        {/* Trackpad */}
        <div style={{
          width: '38%', height: 16, margin: '0 auto',
          background: 'rgba(0,0,0,0.04)', borderRadius: 7,
          border: '0.5px solid rgba(0,0,0,0.1)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
        }} />
      </div>
    </div>
  );
}

/* ─── Generator Desktop Mockup ─────────────────────────────── */

function GeneratorMockup() {
  const col = 'text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1';
  const inp = 'border border-slate-200 rounded-lg px-2 py-1.5 text-[8px] text-slate-700 w-full';
  return (
    <div className="bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-3 py-1.5 flex items-center gap-2">
        <LogoMark size={16} className="shrink-0" />
        <span className="text-[9px] font-black text-slate-900 tracking-tight">KraaFo</span>
        <div className="flex gap-0.5 ml-1 bg-slate-100 rounded-lg p-0.5">
          {['Invoice', 'Receipt', 'Quote'].map((t, i) => (
            <div key={t} className={`px-2 py-0.5 rounded-md text-[7px] font-bold transition-all ${i === 0 ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>{t}</div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="text-[7px] bg-indigo-600 text-white rounded-lg px-1.5 py-0.5 font-bold">Save</div>
          <div className="text-[7px] bg-violet-600 text-white rounded-lg px-1.5 py-0.5 font-bold">Send</div>
          <div className="text-[7px] bg-emerald-600 text-white rounded-lg px-1.5 py-0.5 font-bold hidden sm:block">PDF</div>
        </div>
      </div>
      <div className="flex gap-2.5 p-2.5">
        <div className="flex-1 space-y-2 min-w-0">
          <div className="bg-white rounded-xl border border-slate-100 p-2.5">
            <div className="grid grid-cols-2 gap-2">
              {[['Invoice Number', 'INV-2026-0042'], ['Status', 'Sent'], ['Issue Date', '27/05/2026'], ['Due Date', '26/06/2026']].map(([label, val]) => (
                <div key={label}>
                  <div className={col}>{label}</div>
                  <div className={inp}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-2.5">
            <div className="text-[8px] font-black text-slate-700 mb-2">Client Details</div>
            <div className="grid grid-cols-2 gap-2">
              {[['Full Name', 'Sarah Thompson'], ['Company', 'Thompson LLC'], ['Email', 'sarah@thompson.co'], ['Phone', '+1 310 000 0000']].map(([label, val]) => (
                <div key={label}>
                  <div className={col}>{label}</div>
                  <div className={inp}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[8px] font-black text-slate-700">Services &amp; Line Items</div>
              <div className="bg-indigo-600 text-white text-[7px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5"><span>✦</span> Smart Fill</div>
            </div>
            {[['Deep House Cleaning', '1', 'session', '$250.00'], ['Carpet Cleaning', '3', 'room', '$135.00'], ['Window Cleaning', '8', 'unit', '$64.00']].map(([d, q, u, p]) => (
              <div key={d} className="grid grid-cols-12 gap-1 mb-1">
                <div className="col-span-5 border border-slate-100 rounded-lg px-1.5 py-1 text-[7px] text-slate-600">{d}</div>
                <div className="col-span-2 border border-slate-100 rounded-lg px-1.5 py-1 text-[7px] text-center">{q}</div>
                <div className="col-span-2 border border-slate-100 rounded-lg px-1.5 py-1 text-[7px] text-slate-500 text-center">{u}</div>
                <div className="col-span-2 border border-slate-100 rounded-lg px-1.5 py-1 text-[7px] text-slate-700 font-semibold text-right">{p}</div>
                <div className="col-span-1 flex items-center justify-center text-red-300 text-[6px]">✕</div>
              </div>
            ))}
            <div className="text-[7px] text-indigo-500 font-bold mt-1.5">+ Add Line Item</div>
          </div>
        </div>
        <div className="w-28 shrink-0 space-y-2">
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-indigo-600 to-violet-600" />
            <div className="p-2.5">
              <div className="text-[8px] font-black text-slate-700 mb-2">Summary</div>
              <div className="space-y-1">
                <div className="flex justify-between text-[7px]"><span className="text-slate-500">Subtotal</span><span>$449.00</span></div>
                <div className="flex justify-between text-[7px]"><span className="text-slate-500">Tax (7.5%)</span><span>$33.68</span></div>
                <div className="border-t border-slate-100 pt-1.5 mt-1 flex justify-between items-center">
                  <span className="text-[7px] font-black text-slate-800">Total</span>
                  <span className="text-[10px] font-black text-indigo-600">$482.58</span>
                </div>
              </div>
              <div className="mt-2.5 space-y-1.5">
                <div className="bg-indigo-600 text-white text-[7px] font-bold text-center py-1.5 rounded-lg">Save Invoice</div>
                <div className="bg-emerald-600 text-white text-[7px] font-bold text-center py-1.5 rounded-lg">↓ Download PDF</div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-1 text-emerald-600 text-[7px]">
                <span>✓</span><span className="font-bold">Saved · INV-2026-0042</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-indigo-600 to-violet-600" />
            <div className="p-2.5">
              <div className="text-[6px] text-slate-400 font-bold uppercase tracking-widest mb-2">👁 Live Preview</div>
              <div className="text-[6px] text-slate-500 mb-0.5">Thompson LLC</div>
              <div className="flex justify-between items-center">
                <div className="text-[7px] font-black text-indigo-600">INVOICE</div>
                <div className="text-[6px] text-slate-400 font-mono">INV-0042</div>
              </div>
              <div className="mt-1.5 space-y-0.5">
                {['Deep House Cleaning · $250', 'Carpet Cleaning · $135', 'Window Cleaning · $64'].map(l => (
                  <div key={l} className="text-[6px] text-slate-500 border-b border-slate-50 pb-0.5">{l}</div>
                ))}
              </div>
              <div className="border-t-2 border-indigo-600 mt-1.5 pt-1 flex justify-between items-center">
                <span className="text-[6px] font-black text-slate-700">Total</span>
                <span className="text-[8px] font-black text-indigo-600">$482.58</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── How It Works — Interactive Stepper ──────────────────── */

function SendVisual() {
  return (
    <div className="max-w-[340px] mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#128C7E' }}>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">J</span>
        </div>
        <div>
          <div className="text-white text-sm font-bold">James Mensah</div>
          <div className="text-green-200 text-xs">WhatsApp</div>
        </div>
        <span className="ml-auto text-green-200 text-[10px]">09:42</span>
      </div>
      <div className="p-4 space-y-3" style={{ background: '#e5ddd5' }}>
        <div className="flex justify-end">
          <div className="rounded-2xl rounded-tr-sm px-3 py-2.5 max-w-[270px] shadow-sm" style={{ background: '#d9fdd3' }}>
            <p className="text-[11px] text-slate-700 leading-relaxed">Hi James! 👋 Your <strong>Invoice INV-0042</strong> from Acme Services is ready.<br /><br />📄 INV-0042 · 💰 $482.58 · 📅 Due 26 Jul 2026</p>
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <span className="text-[9px] text-slate-400">09:42</span>
              <span className="text-emerald-500 text-[11px] font-bold">✓✓</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-white rounded-2xl rounded-tr-sm p-3 max-w-[220px] shadow-sm flex items-center gap-2.5">
            <div className="w-9 h-11 bg-red-500/90 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0">PDF</div>
            <div>
              <div className="text-[11px] font-bold text-slate-800">Invoice_INV-0042.pdf</div>
              <div className="text-[10px] text-slate-400">284 KB · PDF</div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <span className="text-[9px] text-slate-500 bg-white/70 px-3 py-1 rounded-full">SMS &amp; email also sent ✓</span>
        </div>
      </div>
    </div>
  );
}

function GetPaidVisual() {
  return (
    <div className="max-w-[340px] mx-auto space-y-3">
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-lg shadow-emerald-50/60 p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <div className="font-black text-slate-900 text-sm">Invoice #0042 — Paid</div>
            <div className="text-xs text-slate-400 mt-0.5">Sarah Thompson · $482.58 received</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-5">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">This month</div>
        <div className="space-y-2.5">
          {([
            { label: 'Revenue',     val: '$12,840', dot: 'bg-emerald-400', text: 'text-emerald-600' },
            { label: 'Outstanding', val: '$3,200',  dot: 'bg-amber-400',   text: 'text-amber-500'  },
            { label: 'Overdue',     val: '$0',      dot: 'bg-red-300',     text: 'text-red-400'    },
          ] as const).map(({ label, val, dot, text }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className={`w-2 h-2 rounded-full ${dot}`} />
                {label}
              </div>
              <span className={`text-sm font-black ${text}`}>{val}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-50 text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
          <TrendingUp className="w-2.5 h-2.5" />
          +28% from last month
        </div>
      </div>
    </div>
  );
}

function HowItWorksStepper() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const STEP_MS = 4500;
  const TICK_MS = 60;

  useEffect(() => {
    if (paused) return;
    setProgress(0);
    const tick = setInterval(() => setProgress(p => Math.min(p + (TICK_MS / STEP_MS) * 100, 100)), TICK_MS);
    const timer = setTimeout(() => { setActive(a => (a + 1) % 3); setProgress(0); }, STEP_MS);
    return () => { clearInterval(tick); clearTimeout(timer); };
  }, [active, paused]);

  const goTo = (i: number) => { setActive(i); setProgress(0); setPaused(true); };

  const stepData = [
    {
      n: '01', title: 'Create in 60 seconds',
      desc: 'Fill in your client and add your services. Smart Fill pre-populates everything for your industry if you need it.',
      visual: <LaptopFrame><GeneratorMockup /></LaptopFrame>,
    },
    {
      n: '02', title: 'Send by WhatsApp, email or SMS',
      desc: 'One tap sends your invoice three ways. Your client has it before you pack up your tools.',
      visual: <SendVisual />,
    },
    {
      n: '03', title: 'Get paid, stay in control',
      desc: "See what you've earned, what's outstanding, and what's overdue. No spreadsheets — just the numbers you need, when you need them.",
      visual: <GetPaidVisual />,
    },
  ];

  return (
    <div>
      {/* Step tabs with progress */}
      <div className="flex border-b border-slate-100 mb-10">
        {stepData.map((s, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`flex-1 relative py-4 text-left px-1 sm:px-4 transition-colors ${
              i === active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`block text-xs font-black tracking-widest mb-1 ${i === active ? 'text-indigo-600' : 'text-slate-300'}`}>{s.n}</span>
            <span className="block font-bold text-sm leading-tight hidden sm:block">{s.title}</span>
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-slate-100">
              {i === active && (
                <div className="h-full bg-indigo-600" style={{ width: paused ? '100%' : `${progress}%`, transition: paused ? 'none' : `width ${TICK_MS}ms linear` }} />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="order-2 lg:order-1">
          <div className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Step {active + 1} of 3</div>
          <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mb-4">{stepData[active].title}</h3>
          <p className="text-slate-500 leading-relaxed mb-8">{stepData[active].desc}</p>
          {active === 2 && (
            <Link to="/setup" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-200 btn-glow">
              Create your first invoice — free <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="order-1 lg:order-2">
          {stepData[active].visual}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Landing Component ───────────────────────────────── */

export default function Landing() {
  const [liveReviews, setLiveReviews] = useState<ReviewCard[]>([]);

  useEffect(() => {
    api.feedback.highlights()
      .then(d => {
        const cards: ReviewCard[] = (d.highlights || []).map(r => ({
          key: r.id,
          rating: r.rating,
          text: r.message || '',
          name: r.name,
          sub: new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        }));
        if (cards.length > 0) setLiveReviews(cards);
      })
      .catch(() => {});
  }, []);

  const reviews = liveReviews;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="lg" />
          <div className="flex items-center gap-3">
            <Link to="/generator?demo=true" className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors hidden sm:block">Demo</Link>
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">Sign in</Link>
            <Link to="/setup" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all btn-glow shadow-sm">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/30 pt-12 pb-0 px-6">
        {/* Subtle dot-grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.5 }} />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center lg:min-h-[88vh] pb-16 lg:pb-20">

            {/* ── Left: Text ───────────────────────────────── */}
            <div className="relative z-10 pt-6 lg:pt-0">

              {/* Trust bullets */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 mb-7 animate-hero">
                {['Free to use', 'No credit card', 'Sends via WhatsApp, SMS & email'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>

              <h1 className="text-[2.5rem] sm:text-5xl md:text-[58px] lg:text-[64px] font-black text-slate-900 tracking-tight leading-[1.08] lg:leading-[1.03] mb-6 animate-hero delay-100">
                Send invoices your clients take seriously.{' '}
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                  Get paid without chasing.
                </span>
              </h1>

              <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-lg animate-hero delay-200">
                Create professional invoices in under a minute. <strong className="text-slate-700 font-semibold">Download free — no account needed.</strong> Sign up free to save your work and send by WhatsApp, SMS, or email.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-hero delay-300">
                <Link to="/setup" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-200 btn-glow">
                  Create your first invoice — free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/generator?demo=true" className="flex items-center justify-center gap-2 text-slate-600 px-8 py-3.5 rounded-xl font-bold text-base border border-slate-200 bg-white/80 hover:bg-white hover:border-slate-300 transition-all">
                  Try without signing up
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm animate-hero delay-400">
                {['Download free, no sign-up', 'Sign up free to send', '12+ industries', 'Works worldwide'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Product visual ── */}
            <div className="animate-hero delay-200 mt-6 lg:mt-0">
              <LaptopFrame>
                <GeneratorMockup />
              </LaptopFrame>
              {/* Floating review card */}
              <div className="mt-4 bg-white rounded-2xl p-4 shadow-lg border border-slate-100 max-w-sm mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border-2 border-indigo-50">
                    <span className="text-indigo-600 font-bold">T</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex gap-0.5 mb-1">
                      {[0,1,2,3,4].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-slate-700 text-sm font-medium leading-snug">"My clients think I have a whole accounts department."</p>
                    <p className="text-slate-400 text-xs mt-1">Theresa · KraaFo user</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ── Pain section ─────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-6">Sound familiar?</p>
          <div className="space-y-5">
            {[
              'The Word-doc invoice that looks nothing like your work.',
              'The "did you see my invoice?" message you hate sending.',
              'The client who swears it never arrived.',
            ].map((line, i) => (
              <p key={i} className="text-xl md:text-2xl font-semibold text-slate-600 leading-snug">
                "{line}"
              </p>
            ))}
          </div>
          <div className="mt-10 inline-block bg-indigo-50 border border-indigo-100 rounded-2xl px-8 py-5">
            <p className="text-lg font-black text-slate-900 leading-snug">
              Your brand on the invoice.<br />
              Your invoice in their WhatsApp.<br />
              <span className="text-indigo-600">You, looking like a company twice your size.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Triple Channel Delivery ───────────────────────────── */}
      <section className="bg-slate-950 py-16 md:py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5" /> Only on KraaFo
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.05] mb-5">
              Your client can't say<br />they didn't get it.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              One tap sends your invoice three ways. WhatsApp, SMS, and email — all with the PDF attached. Every other invoicing app sends an email and waits.
            </p>
          </div>

          {/* Three delivery cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">

            {/* WhatsApp */}
            <div className="rounded-2xl overflow-hidden animate-fade-up" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#128C7E' }}>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-xs font-bold">WhatsApp</div>
                  <div className="text-green-200 text-[10px]">Message delivered instantly</div>
                </div>
                <span className="ml-auto text-green-200 text-[10px] shrink-0">just now</span>
              </div>
              <div className="p-4">
                <div className="rounded-xl rounded-tl-none p-3" style={{ background: 'rgba(18,140,126,0.15)', border: '1px solid rgba(18,140,126,0.2)' }}>
                  <p className="text-slate-200 text-xs leading-loose">
                    Hi James! 👋<br />
                    Your <strong className="text-white">Invoice INV-0042</strong> from <strong className="text-white">Acme Services</strong> is ready.<br /><br />
                    📄 <strong className="text-white">INV-0042</strong><br />
                    💰 Total: <strong className="text-white">$482.58</strong><br />
                    📅 Due: <strong className="text-white">26 Jul 2026</strong><br /><br />
                    Check your email for the PDF attachment. Thank you! 🙏
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-2 text-[9px] text-emerald-400">
                    <span>✓✓</span><span>Delivered</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SMS */}
            <div className="rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '100ms', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="bg-slate-700 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-xs font-bold">SMS</div>
                  <div className="text-slate-400 text-[10px]">+1 310 000 0042</div>
                </div>
                <span className="ml-auto text-slate-400 text-[10px] shrink-0">just now</span>
              </div>
              <div className="p-4">
                <div className="bg-slate-700/50 rounded-xl rounded-tl-none p-3" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    Hi James! Your Invoice from Acme Services is ready.<br /><br />
                    📄 INV-0042 · 💰 $482.58 · 📅 Due 26 Jul 2026<br /><br />
                    Your PDF invoice has been sent to your email. Please check your inbox. — Acme Services
                  </p>
                  <div className="text-right text-[9px] text-slate-500 mt-2">Delivered</div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '200ms', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="bg-indigo-700 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-xs font-bold">Email</div>
                  <div className="text-indigo-300 text-[10px] truncate">james@acmeservices.com</div>
                </div>
                <span className="ml-auto text-indigo-300 text-[10px] shrink-0">just now</span>
              </div>
              <div className="p-4">
                <div className="text-white text-xs font-bold mb-0.5">Invoice INV-0042 from Acme Services</div>
                <div className="text-slate-400 text-[10px] mb-4 leading-relaxed">
                  Please find your invoice attached to this email. You can download the PDF for your records.
                </div>
                {/* PDF attachment */}
                <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="w-9 h-9 bg-red-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-[10px] font-bold truncate">Invoice_INV-0042.pdf</div>
                    <div className="text-slate-500 text-[9px]">284 KB · PDF Document</div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-500 ml-auto shrink-0" />
                </div>
              </div>
            </div>

          </div>

          {/* KraaFo vs everyone else */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 mb-14 py-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-center">
              <div className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-2">Every other invoicing app</div>
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-semibold">Email only</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 text-3xl font-black hidden sm:block">vs</div>
            <div className="text-slate-600 text-sm font-bold sm:hidden">vs</div>
            <div className="text-center">
              <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">KraaFo</div>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-bold">WhatsApp</span>
                </div>
                <span className="text-slate-700">+</span>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Send className="w-4 h-4" />
                  <span className="text-sm font-bold">SMS</span>
                </div>
                <span className="text-slate-700">+</span>
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-bold">Email + PDF</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/setup" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-900/50 btn-glow">
              Create your first invoice — free <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-slate-600 text-xs mt-3 font-semibold">Free to use · No credit card · 2-minute setup</p>
          </div>

        </div>
      </section>

      {/* ── How it Works + Features ─────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">From zero to paid in minutes</h2>
            <p className="text-slate-500">No learning curve. No complicated setup. Just results.</p>
          </div>
          <HowItWorksStepper />
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px bg-slate-200" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">Everything you get</p>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="p-5 rounded-2xl bg-white hover:bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all group cursor-default hover-lift animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-all group-hover:shadow-md bg-slate-50 group-hover:bg-indigo-600 border border-slate-100 group-hover:border-indigo-600">
                  <Icon className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1 text-sm">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="py-16 px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="flex justify-center gap-1 mb-3">
                {[0,1,2,3,4].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">What early users say</h2>
              {reviews.length === 1 ? (
                <p className="text-slate-500 text-sm mt-2 font-semibold">5 out of 5 · 1 verified review</p>
              ) : reviews.length > 1 ? (
                <p className="text-slate-500 text-sm mt-2 font-semibold">{reviews.length} verified reviews from real users</p>
              ) : null}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reviews.map((t, i) => (
                <div key={t.key} className="bg-white rounded-2xl p-5 hover-lift animate-fade-up flex flex-col border border-slate-100 shadow-sm hover:shadow-md transition-shadow" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{t.sub}</div>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-sm ${s <= t.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-slate-600 leading-relaxed text-sm flex-1">"{t.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'Is KraaFo really free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Creating and downloading invoices, receipts and quotes is completely free. No credit card needed. You need a free account to send documents by email or WhatsApp and to save your history.' } },
            { '@type': 'Question', name: 'Do I need an account to download a PDF?', acceptedAnswer: { '@type': 'Answer', text: 'No. You can fill in your invoice and download the PDF without signing up. Create an account (also free) to save your documents and send them to clients.' } },
            { '@type': 'Question', name: 'Can I send invoices on WhatsApp?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. KraaFo lets you send a professional message with your invoice directly through WhatsApp, SMS, and email — all from the same screen.' } },
            { '@type': 'Question', name: 'Can I add my logo and brand colors?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Upload your logo and KraaFo automatically extracts your brand colors. Every invoice, receipt and quote reflects your brand without any manual setup.' } },
            { '@type': 'Question', name: 'Does it work in my country and currency?', acceptedAnswer: { '@type': 'Answer', text: 'KraaFo works worldwide. You can set any currency symbol and accept mobile money (M-Pesa, MTN, Airtel, Telecel), PayPal, and bank transfer.' } },
          ],
        }) }} />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Common questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Is KraaFo really free?', a: 'Yes. Creating and downloading invoices, receipts and quotes is completely free. No credit card needed. You need a free account to send documents by email or WhatsApp and to save your history.' },
              { q: 'Do I need an account to download a PDF?', a: 'No. Fill in your invoice and download the PDF without signing up. Create an account (also free) to save your documents and send them to clients.' },
              { q: 'Can I send invoices on WhatsApp?', a: 'Yes. One tap sends your invoice through WhatsApp, SMS, and email — all from the same screen. Your client gets a professional message with the PDF.' },
              { q: 'Can I add my logo and brand colors?', a: 'Yes. Upload your logo and KraaFo automatically extracts your brand colors. Every document reflects your brand without any manual setup.' },
              { q: 'Does it work in my country and currency?', a: 'KraaFo works worldwide. Set any currency symbol and accept mobile money (M-Pesa, MTN, Airtel, Telecel), PayPal, or bank transfer.' },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white rounded-2xl border border-slate-100 px-5 py-4 cursor-pointer">
                <summary className="flex items-center justify-between font-bold text-slate-800 text-sm list-none select-none">
                  {q}
                  <span className="ml-3 text-slate-400 group-open:rotate-45 transition-transform duration-200 shrink-0 text-lg leading-none">+</span>
                </summary>
                <p className="mt-3 text-slate-500 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-16 px-6 text-center bg-white">
        <div className="max-w-lg mx-auto">
          <LogoMark size={96} className="mx-auto mb-6 animate-float" />
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Ready to send your first document?</h2>
          <p className="text-slate-500 mb-7 leading-relaxed">Takes under 2 minutes to set up. Free to use — no credit card needed.</p>
          <Link to="/setup" className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-xl font-bold text-base transition-all shadow-2xl shadow-indigo-200 btn-glow">
            Create your first invoice — free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="lg" />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/changelog" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">What's New</Link>
            <span className="text-slate-200 hidden sm:inline">·</span>
            <a href="mailto:kraafo.invoice.receipt@gmail.com" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">
              Questions? kraafo.invoice.receipt@gmail.com
            </a>
          </div>
          <p className="text-xs text-slate-300 font-medium">© {new Date().getFullYear()} KraaFo</p>
        </div>
      </footer>
    </div>
  );
}
