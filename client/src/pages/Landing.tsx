import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Palette, Download, CheckCircle, ArrowRight, FileText, Receipt, Send, Globe, Star, TrendingUp, Mail, MessageSquare, Zap } from 'lucide-react';
import { Logo, LogoMark } from '../components/Logo';
import { api } from '../utils/api';
import StoryPlayer from '../components/StoryPlayer';


const features = [
  { icon: Sparkles, title: 'Smart Fill',            desc: 'Pick your industry and job type. KraaFo fills in your line items, pricing, notes, and terms. Review, adjust, send.' },
  { icon: Palette,  title: 'Auto Branding',         desc: 'Upload your logo and KraaFo pulls your brand colors. Every document matches your business, automatically.' },
  { icon: FileText, title: 'Professional Invoices', desc: 'Branded payment requests with due dates, tax, discounts, and a full itemized breakdown.' },
  { icon: Receipt,  title: 'Instant Receipts',      desc: 'Generate a "PAYMENT RECEIVED" receipt the moment a client pays. No templates, no fiddling.' },
  { icon: Send,     title: 'WhatsApp, SMS & Email',  desc: 'Broadcast to all three channels at once, or pick just the one your client uses. WhatsApp and SMS open pre-filled; email sends automatically with the PDF attached. SMS reaches clients without smartphones or mobile data.' },
  { icon: Globe,    title: 'Works Worldwide',       desc: 'Multi-currency. M-Pesa, MTN, Airtel, Telecel, PayPal, and bank transfer. Works in any country.' },
];

type ReviewCard = { key: string; rating: number; text: string; name: string; sub: string; photo?: string };

/* ─── Device Frame Components ─────────────────────────────── */

function LaptopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="select-none rounded-xl overflow-hidden" style={{
      boxShadow:
        '0 0 0 1px rgba(0,0,0,0.06),' +
        '0 8px 24px rgba(0,0,0,0.08),' +
        '0 24px 56px rgba(0,0,0,0.12),' +
        '0 48px 96px rgba(0,0,0,0.08)',
    }}>
      {/* Browser chrome */}
      <div style={{
        background: '#f4f4f5',
        borderBottom: '1px solid #e4e4e7',
        padding: '9px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, boxShadow: '0 0 0 0.5px rgba(0,0,0,0.10)' }} />
          ))}
        </div>
        <div style={{
          flex: 1, background: '#fff', borderRadius: 6,
          border: '1px solid #e4e4e7', padding: '3px 0',
          textAlign: 'center', fontSize: 11, color: '#71717a',
          fontFamily: 'system-ui, sans-serif',
        }}>
          kraafo.com/generator
        </div>
      </div>
      {children}
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
            <div className="font-black text-slate-900 text-sm">Invoice #0042 · Paid</div>
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
  const STEP_MS = 2500;
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
      desc: 'Tap "Send via all channels" and KraaFo opens WhatsApp and SMS pre-filled for your confirmation, then fires the email automatically. Or pick a single channel. Your client has it in seconds.',
      visual: <SendVisual />,
    },
    {
      n: '03', title: 'Get paid, stay in control',
      desc: "See what you've earned, what's outstanding, and what's overdue. No spreadsheets. Just the numbers you need, when you need them.",
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

      {/* Step content — all panels in DOM, toggled via class so crawlers index all steps */}
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="order-2 lg:order-1">
          {stepData.map((step, i) => (
            <div key={i} className={i === active ? 'block' : 'hidden'}>
              <div className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Step {i + 1} of 3</div>
              <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mb-4">{step.title}</h3>
              <p className="text-slate-500 leading-relaxed mb-8">{step.desc}</p>
              {i === 2 && (
                <Link to="/setup" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-200 btn-glow">
                  Create your first invoice, free <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
        <div className="order-1 lg:order-2">
          {stepData[active].visual}
        </div>
      </div>
    </div>
  );
}

/* ─── Part 1: Living-portrait hero crossfade ───────────────── */

const PORTRAITS = [
  { src: '/phase3/portrait-accra.jpg',     alt: 'A cleaning business owner smiles at a payment received notification on her phone', label: 'Accra · GHS' },
  { src: '/phase3/portrait-lagos.jpg',     alt: 'A tailor checks a payment confirmation on his phone outside his shop',              label: 'Lagos · NGN' },
  { src: '/phase3/portrait-saopaulo.jpg',  alt: 'A food truck owner smiles at a payment received notification on her phone',         label: 'São Paulo · BRL' },
  { src: '/phase3/portrait-manchester.jpg',alt: 'A plumber smiles at a payment received notification on his phone',                  label: 'Manchester · GBP' },
];

function HeroCrossfade() {
  const [current, setCurrent] = useState(0);
  const loadedRef = useRef([true, false, false, false]);
  const [, tick] = useState(0);
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reducedMotion.current) return;

    const loadDeferred = () => {
      [1, 2, 3].forEach(i => {
        const img = new Image();
        img.src = PORTRAITS[i].src;
        img.onload = () => { loadedRef.current[i] = true; tick(n => n + 1); };
      });
    };
    if (document.readyState === 'complete') loadDeferred();
    else window.addEventListener('load', loadDeferred, { once: true });

    const interval = setInterval(() => {
      setCurrent(prev => {
        const next = (prev + 1) % 4;
        return loadedRef.current[next] ? next : prev;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{ maxHeight: '680px', aspectRatio: '3/4', boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}
    >
      {PORTRAITS.map((p, i) => (
        <div
          key={p.src}
          className="absolute inset-0"
          aria-hidden={i !== current}
          style={{
            opacity: i === current ? 1 : 0,
            transition: reducedMotion.current ? 'none' : 'opacity 0.7s ease-in-out',
            zIndex: i === current ? 2 : 1,
          }}
        >
          <img
            src={p.src}
            alt={p.alt}
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 12%' }}
            loading={i === 0 ? 'eager' : 'lazy'}
            width={1086}
            height={1448}
          />
        </div>
      ))}
      {/* Location/currency caption */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
        <span
          className="bg-black/40 backdrop-blur-sm text-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full transition-opacity duration-500"
          style={{ opacity: loadedRef.current[current] ? 1 : 0 }}
        >
          {PORTRAITS[current].label}
        </span>
      </div>
    </div>
  );
}

/* ─── Footer newsletter — quiet single line ─────────────────── */

function FooterUpdatesLine() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    try {
      await api.subscribers.subscribe({ email: email.trim() });
      setState('done');
    } catch {
      setState('idle');
    }
  };

  if (state === 'done') {
    return (
      <div className="pt-4 text-center text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
        <CheckCircle className="inline w-3.5 h-3.5 text-emerald-500 mr-1 -mt-0.5" />
        You're subscribed. We'll keep you posted.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <label htmlFor="footer-email" className="text-xs font-medium shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>Get product updates</label>
      <input
        id="footer-email" name="email"
        type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="text-xs px-3 py-1.5 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
      />
      <button type="submit" disabled={state === 'loading'} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-60"
        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
        {state === 'loading' ? 'Joining…' : 'Subscribe'}
      </button>
    </form>
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
      <nav className="sticky top-0 z-50 border-b" style={{ background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="lg" dark />
          <div className="flex items-center gap-3">
            <Link to="/generator?demo=true" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors hidden sm:block">Demo</Link>
            <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors hidden sm:block">Sign in</Link>
            <Link to="/setup" className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-0 px-6" style={{ background: '#020617' }}>
        {/* Soft ambient glow — behind the text column only */}
        <div className="absolute top-0 left-0 w-[700px] h-[700px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 20% 40%,rgba(99,102,241,0.18) 0%,transparent 65%)' }} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center,rgba(139,92,246,0.1) 0%,transparent 70%)' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center lg:min-h-[88vh] pb-16 lg:pb-20">

            {/* ── Left: Text ───────────────────────────────── */}
            <div className="relative z-10 pt-6 lg:pt-0">

              {/* Live badge */}
              <div className="inline-flex items-center gap-2.5 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-7 animate-hero"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#818cf8' }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#818cf8' }} />
                </span>
                Free · WhatsApp · SMS · Email
              </div>

              <h1 className="text-[2.5rem] sm:text-5xl md:text-[58px] lg:text-[62px] font-black tracking-tight leading-[1.06] mb-6 animate-hero" style={{ animationDelay: '80ms' }}>
                <span className="text-white">Free invoice generator &amp; receipt maker. </span>
                <span className="animate-grad-text" style={{ backgroundImage: 'linear-gradient(135deg,#a5b4fc 0%,#c4b5fd 50%,#93c5fd 100%)' }}>
                  Get paid without chasing.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 leading-relaxed max-w-lg animate-hero" style={{ animationDelay: '160ms' }}>
                Create professional invoices in under a minute.{' '}
                <span className="text-slate-200 font-semibold">Download free, no account needed.</span>{' '}
                Sign up free to send by WhatsApp, SMS, or email: all three at once, or just the one your client uses.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-hero" style={{ animationDelay: '240ms' }}>
                <Link to="/setup"
                  className="flex items-center justify-center gap-2 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.45)' }}>
                  Create your first invoice, free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/generator?demo=true"
                  className="flex items-center justify-center gap-2 text-slate-300 px-8 py-3.5 rounded-xl font-bold text-base transition-all hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Try without signing up
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm animate-hero" style={{ animationDelay: '320ms' }}>
                {['Download free, no sign-up', 'Sign up free to send', '12+ industries', 'Works worldwide'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#818cf8' }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Living portrait crossfade ── */}
            <div className="animate-hero mt-6 lg:mt-0" style={{ animationDelay: '120ms' }}>
              <HeroCrossfade />
            </div>

          </div>
        </div>

      </section>

      {/* ── Wave: dark → white ── */}
      <div style={{ background: '#020617', marginBottom: '-2px' }}>
        <svg viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none" style={{ height: 70 }}>
          <path d="M0,0 C360,70 1080,0 1440,50 L1440,70 L0,70 Z" fill="white" />
        </svg>
      </div>

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

      {/* ── Part 2: Story player ─────────────────────────────── */}
      <StoryPlayer />

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
              One tap in KraaFo opens WhatsApp and SMS pre-filled for your confirmation, and sends the email automatically. All three channels at once. Every other invoicing app sends an email and waits.
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
                    Your PDF invoice has been sent to your email. Please check your inbox.<br />Acme Services
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

          {/* Single-channel mode beat */}
          <div className="rounded-2xl p-6 mb-8 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white font-black text-xl mb-3">Or send it exactly one way.</p>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
              You know your clients. The corporate office that wants email only. The client without a smartphone who lives on SMS. Pick the channel. KraaFo opens WhatsApp or SMS pre-filled, or fires the email automatically.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4 text-xs font-semibold">
              <span className="text-indigo-400">Send via all channels</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-400">or send individually</span>
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
              Create your first invoice, free <ArrowRight className="w-4 h-4" />
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
            {reviews.length === 1 ? (
              <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                <div className="flex gap-0.5 mb-5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-lg ${s <= reviews[0].rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                  ))}
                </div>
                <p className="text-slate-700 text-lg leading-relaxed mb-6">"{reviews[0].text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                    {reviews[0].name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{reviews[0].name}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{reviews[0].sub}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`grid gap-4 ${reviews.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-1 md:grid-cols-3'}`}>
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
            )}
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
            { '@type': 'Question', name: 'Can I send invoices on WhatsApp?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Use "Send via all channels" to open WhatsApp and SMS pre-filled for your confirmation, and send the email automatically. One action, all three channels. Or use the individual send buttons to pick just WhatsApp, just SMS, or just email.' } },
            { '@type': 'Question', name: 'Can I send to just one channel?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Use the individual send buttons to choose exactly one channel: WhatsApp, SMS, or email. Great for corporate clients who want email only, or clients without smartphones who are best reached by SMS.' } },
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
              { q: 'Can I send invoices on WhatsApp?', a: 'Yes. Use "Send via all channels" to open WhatsApp and SMS pre-filled for your confirmation, and send the email automatically. One action, all three channels. Or use the individual send buttons to pick just WhatsApp, just SMS, or just email.' },
              { q: 'Can I send to just one channel?', a: 'Yes. Use the individual send buttons to choose exactly one: WhatsApp, SMS, or email. Great for corporate clients who want email only, or clients without smartphones who are best reached by SMS.' },
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
      <section className="py-24 px-6 text-center relative overflow-hidden" style={{ background: '#020617' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 50%,rgba(99,102,241,0.2) 0%,transparent 70%)' }} />
        <div className="absolute top-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none" style={{ height: 70, transform: 'rotate(180deg)' }}>
            <path d="M0,0 C360,70 1080,0 1440,50 L1440,70 L0,70 Z" fill="#f8fafc" />
          </svg>
        </div>
        <div className="relative z-10 max-w-lg mx-auto pt-8">
          <LogoMark size={72} className="mx-auto mb-6 animate-float opacity-90" dark />
          <h2 className="text-3xl font-black tracking-tight mb-3 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg,white 0%,#c4b5fd 100%)' }}>
            Ready to send your first document?
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">Takes under 2 minutes to set up. Free, no credit card needed.</p>
          <Link to="/setup"
            className="inline-flex items-center gap-2.5 text-white px-10 py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)', boxShadow: '0 8px 40px rgba(99,102,241,0.5)' }}>
            Create your first invoice, free <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-slate-600 text-xs mt-4 font-semibold">Free to use · No credit card · 2-minute setup</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t py-8 px-6" style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <Logo size="lg" dark />
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link to="/invoice-generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Invoice Generator</Link>
              <span className="text-slate-700 hidden sm:inline">·</span>
              <Link to="/receipt-generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Receipt Maker</Link>
              <span className="text-slate-700 hidden sm:inline">·</span>
              <Link to="/quote-generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Quote Generator</Link>
              <span className="text-slate-700 hidden sm:inline">·</span>
              <Link to="/changelog" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">What's New</Link>
              <span className="text-slate-700 hidden sm:inline">·</span>
              <a href="mailto:kraafo.invoice.receipt@gmail.com" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">
                kraafo.invoice.receipt@gmail.com
              </a>
            </div>
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} KraaFo</p>
          </div>
          <FooterUpdatesLine />
        </div>
      </footer>
    </div>
  );
}
