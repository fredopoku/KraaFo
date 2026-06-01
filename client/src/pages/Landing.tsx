import { Link } from 'react-router-dom';
import { Sparkles, Palette, Download, Shield, CheckCircle, ArrowRight, FileText, Receipt, Send, Globe, Star, TrendingUp, Clock, AlertCircle, Plus, Settings, Users, ScanLine, X } from 'lucide-react';
import { Logo, LogoMark } from '../components/Logo';

const features = [
  { icon: Sparkles, title: 'Smart Fill',            desc: 'Pick your industry and job type — KraaFo auto-populates line items, pricing, notes, and payment terms instantly.' },
  { icon: Palette,  title: 'Brand-Perfect',         desc: 'Upload your logo and KraaFo extracts your brand colors for documents that look exactly like you.' },
  { icon: FileText, title: 'Professional Invoices', desc: 'Send branded payment requests with due dates, tax, discounts, and a full itemized breakdown.' },
  { icon: Receipt,  title: 'Instant Receipts',      desc: 'Generate a polished "PAYMENT RECEIVED" receipt the moment a client pays. No template fiddling.' },
  { icon: Shield,   title: 'Tax & Discounts',       desc: 'Full support for GST, VAT, Sales Tax, and both percentage and fixed-amount discounts on every document.' },
  { icon: Download, title: 'Print-Ready PDFs',      desc: 'Pixel-perfect PDFs that look stunning in print or on screen. Share by email or print on the spot.' },
  { icon: Send,     title: 'Email & WhatsApp',      desc: 'Send invoices directly from KraaFo via email or WhatsApp — with PDF attached and a professional message.' },
  { icon: Globe,    title: 'Works Worldwide',       desc: 'Multi-currency, mobile money (M-Pesa, MTN, Airtel, Telecel), PayPal, and bank transfer — for any market.' },
];

const steps = [
  { n: '01', title: 'Set up in 2 minutes',      desc: 'Enter your business name, upload your logo, and KraaFo auto-extracts your brand colors. Done.' },
  { n: '02', title: 'Smart Fill your services', desc: 'Pick your industry, click Smart Fill — line items, pricing, and payment terms pre-populated instantly.' },
  { n: '03', title: 'Send it professionally',   desc: 'Download a pixel-perfect PDF, send via email or WhatsApp, and get paid — all from one screen.' },
];

const testimonials = [
  { name: 'Sarah M.', role: 'Owner, Sparkle Clean Co. · UK',    text: "I send a receipt the moment I'm paid and clients love how professional it looks. Total game changer." },
  { name: 'James T.', role: 'Manager, FreshSpace Services · US', text: 'Switched from Word templates. My invoices now look like a real business — in under a minute.' },
  { name: 'Ana R.',   role: 'Director, Crystal Clear LLC · CA',  text: 'Brand colors auto-extract from our logo — every document looks exactly on-brand without any effort.' },
];

const industries = ['Cleaning', 'Plumbing', 'Electrical', 'Landscaping', 'Fitness', 'Tutoring', 'IT Support', 'Photography', 'Pet Services', 'Carpentry', 'Catering', 'Consulting'];

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

function PhoneShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  /* iPhone 17 Pro — Natural Titanium finish */
  const titanium = 'linear-gradient(160deg,#AEAEB2 0%,#8E8E93 20%,#636366 45%,#48484A 58%,#636366 74%,#8E8E93 88%,#AEAEB2 100%)';
  const btn      = 'linear-gradient(180deg,#AEAEB2 0%,#8E8E93 50%,#636366 100%)';
  return (
    <div className={`relative select-none ${className}`} style={{
      background: titanium,
      borderRadius: 50,
      padding: '4px 3.5px',
      boxShadow:
        'inset 0 0 0 0.5px rgba(255,255,255,0.45),' +
        'inset 0 1px 0 rgba(255,255,255,0.3),' +
        '0 0 0 0.5px rgba(0,0,0,0.3),' +
        '0 32px 64px rgba(0,0,0,0.30),' +
        '0 8px 20px rgba(0,0,0,0.18)',
    }}>
      {/* Power / side button — right */}
      <div style={{ position:'absolute', right:-2.5, top:'22%', width:3, height:56, background:btn, borderRadius:'0 3px 3px 0', boxShadow:'inset -1px 0 0 rgba(255,255,255,0.18)' }} />
      {/* Action button — left top */}
      <div style={{ position:'absolute', left:-2.5, top:'14%', width:3, height:28, background:btn, borderRadius:'3px 0 0 3px', boxShadow:'inset 1px 0 0 rgba(255,255,255,0.18)' }} />
      {/* Volume up — left */}
      <div style={{ position:'absolute', left:-2.5, top:'calc(14% + 40px)', width:3, height:44, background:btn, borderRadius:'3px 0 0 3px', boxShadow:'inset 1px 0 0 rgba(255,255,255,0.18)' }} />
      {/* Volume down — left */}
      <div style={{ position:'absolute', left:-2.5, top:'calc(14% + 96px)', width:3, height:44, background:btn, borderRadius:'3px 0 0 3px', boxShadow:'inset 1px 0 0 rgba(255,255,255,0.18)' }} />

      {/* Screen glass */}
      <div style={{ borderRadius:47, overflow:'hidden', background:'#000' }}>
        {/* Dynamic Island */}
        <div style={{ background:'#000', display:'flex', justifyContent:'center', paddingTop:8 }}>
          <div style={{ width:92, height:24, background:'#000', borderRadius:16, boxShadow:'0 0 0 1px rgba(255,255,255,0.06)' }} />
        </div>

        {/* Status bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'3px 18px 3px', background:'#fff' }}>
          <span style={{ fontSize:10, fontWeight:700, color:'#0d0d10', fontFamily:'system-ui', letterSpacing:'-0.2px' }}>9:41</span>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            {/* Signal */}
            <div style={{ display:'flex', alignItems:'flex-end', gap:1 }}>
              {[4,6,9,12].map((h,i) => (
                <div key={i} style={{ width:3, height:h, background:i < 3 ? '#0d0d10' : '#c7c7cc', borderRadius:1.5 }} />
              ))}
            </div>
            {/* WiFi */}
            <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
              <path d="M6.5 7.5a1 1 0 110 2 1 1 0 010-2z" fill="#0d0d10"/>
              <path d="M3.8 5.3a3.8 3.8 0 015 0" stroke="#0d0d10" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              <path d="M1.5 3a6.5 6.5 0 0110 0" stroke="#0d0d10" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            </svg>
            {/* Battery */}
            <div style={{ display:'flex', alignItems:'center', gap:1 }}>
              <div style={{ width:22, height:11, borderRadius:3, border:'1.5px solid #0d0d10', padding:'1.5px 2px' }}>
                <div style={{ width:'76%', height:'100%', background:'#0d0d10', borderRadius:1 }} />
              </div>
              <div style={{ width:2, height:5, background:'#0d0d10', borderRadius:'0 1px 1px 0', marginLeft:-1 }} />
            </div>
          </div>
        </div>

        <div style={{ background:'#fff' }}>{children}</div>

        {/* Home indicator */}
        <div style={{ display:'flex', justifyContent:'center', padding:'6px 0 14px', background:'#fff' }}>
          <div style={{ width:100, height:5, borderRadius:3, background:'rgba(0,0,0,0.16)' }} />
        </div>
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
      {/* App header */}
      <div className="bg-white border-b border-slate-100 px-3 py-1.5 flex items-center gap-2">
        <LogoMark size={16} className="shrink-0" />
        <span className="text-[9px] font-black text-slate-900 tracking-tight">KraaFo</span>
        <div className="flex gap-0.5 ml-1 bg-slate-100 rounded-lg p-0.5">
          {['Invoice', 'Receipt', 'Quote'].map((t, i) => (
            <div key={t} className={`px-2 py-0.5 rounded-md text-[7px] font-bold transition-all ${i === 0 ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>{t}</div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="text-[7px] text-slate-500 border border-slate-200 rounded-lg px-1.5 py-0.5 hidden sm:block">Documents ↓</div>
          <div className="text-[7px] text-slate-400 border border-slate-200 rounded-lg px-1.5 py-0.5 hidden md:block">+ New</div>
          <div className="text-[7px] bg-indigo-600 text-white rounded-lg px-1.5 py-0.5 font-bold">Save</div>
          <div className="text-[7px] bg-violet-600 text-white rounded-lg px-1.5 py-0.5 font-bold">Send</div>
          <div className="text-[7px] bg-emerald-600 text-white rounded-lg px-1.5 py-0.5 font-bold hidden sm:block">PDF</div>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-2.5 p-2.5">
        {/* Left column */}
        <div className="flex-1 space-y-2 min-w-0">
          {/* Doc header */}
          <div className="bg-white rounded-xl border border-slate-100 p-2.5">
            <div className="grid grid-cols-2 gap-2">
              {[['Invoice Number', 'INV-2026-0042'], ['Status', 'Sent']].map(([label, val]) => (
                <div key={label}>
                  <div className={col}>{label}</div>
                  <div className={inp}>{val}</div>
                </div>
              ))}
              {[['Issue Date', '27/05/2026'], ['Due Date', '26/06/2026']].map(([label, val]) => (
                <div key={label}>
                  <div className={col}>{label}</div>
                  <div className={inp}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Client */}
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

          {/* Services */}
          <div className="bg-white rounded-xl border border-slate-100 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[8px] font-black text-slate-700">Services &amp; Line Items</div>
              <div className="bg-indigo-600 text-white text-[7px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                <span>✦</span> Smart Fill
              </div>
            </div>
            <div className="grid grid-cols-12 gap-1 mb-1 px-0.5">
              {['DESCRIPTION', 'QTY', 'UNIT', 'PRICE'].map(h => (
                <div key={h} className={`${h === 'DESCRIPTION' ? 'col-span-5' : 'col-span-2'} text-[6px] font-bold text-slate-400 uppercase tracking-widest ${h !== 'DESCRIPTION' ? 'text-center' : ''}`}>{h}</div>
              ))}
              <div className="col-span-1" />
            </div>
            {[['Deep House Cleaning', '1', 'session', '$250.00'], ['Carpet Cleaning', '3', 'room', '$135.00'], ['Window Cleaning', '8', 'unit', '$64.00']].map(([d, q, u, p]) => (
              <div key={d} className="grid grid-cols-12 gap-1 mb-1">
                <div className="col-span-5 border border-slate-100 rounded-lg px-1.5 py-1 text-[7px] text-slate-600">{d}</div>
                <div className="col-span-2 border border-slate-100 rounded-lg px-1.5 py-1 text-[7px] text-slate-600 text-center">{q}</div>
                <div className="col-span-2 border border-slate-100 rounded-lg px-1.5 py-1 text-[7px] text-slate-500 text-center">{u}</div>
                <div className="col-span-2 border border-slate-100 rounded-lg px-1.5 py-1 text-[7px] text-slate-700 font-semibold text-right">{p}</div>
                <div className="col-span-1 flex items-center justify-center">
                  <div className="w-2 h-2 rounded text-red-300 text-[6px] flex items-center justify-center">✕</div>
                </div>
              </div>
            ))}
            <div className="text-[7px] text-indigo-500 font-bold mt-1.5">+ Add Line Item</div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-28 shrink-0 space-y-2">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-indigo-600 to-violet-600" />
            <div className="p-2.5">
              <div className="text-[8px] font-black text-slate-700 mb-2">Summary</div>
              <div className="space-y-1">
                <div className="flex justify-between text-[7px]"><span className="text-slate-500">Subtotal</span><span className="text-slate-700">$449.00</span></div>
                <div className="flex justify-between text-[7px]"><span className="text-slate-500">Tax (7.5%)</span><span className="text-slate-700">$33.68</span></div>
                <div className="border-t border-slate-100 pt-1.5 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[7px] font-black text-slate-800">Total</span>
                    <span className="text-[10px] font-black text-indigo-600">$482.58</span>
                  </div>
                </div>
              </div>
              <div className="mt-2.5 space-y-1.5">
                <div className="bg-indigo-600 text-white text-[7px] font-bold text-center py-1.5 rounded-lg flex items-center justify-center gap-0.5">
                  <span>⬛</span> Save Invoice
                </div>
                <div className="bg-emerald-600 text-white text-[7px] font-bold text-center py-1.5 rounded-lg flex items-center justify-center gap-0.5">
                  <span>↓</span> Download PDF
                </div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-1 text-emerald-600">
                <span className="text-[7px]">✓</span>
                <span className="text-[7px] font-bold">Saved · INV-2026-0042</span>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-indigo-600 to-violet-600" />
            <div className="p-2.5">
              <div className="text-[6px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">👁 Live Preview</div>
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

/* ─── Dashboard Mobile Mockup ──────────────────────────────── */

function DashboardMobileContent() {
  const stats = [
    { icon: TrendingUp, val: '$12,840', label: 'Total Revenue', sub: '18 paid', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Clock,      val: '$3,200',  label: 'Outstanding',   sub: 'Awaiting',color: 'text-amber-600',  bg: 'bg-amber-50'   },
    { icon: AlertCircle,val: '$0',      label: 'Overdue',       sub: 'All clear',color:'text-red-500',    bg: 'bg-red-50'     },
    { icon: FileText,   val: '24',      label: 'Total Invoices',sub: '4 receipts',color:'text-indigo-600',bg: 'bg-indigo-50'  },
  ];
  return (
    <div className="bg-slate-50 flex-1">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-3 py-2 flex items-center justify-between">
        <LogoMark size={18} />
        <div className="flex gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Plus className="w-3 h-3 text-white" />
          </div>
          <div className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center">
            <Settings className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>
      {/* Greeting */}
      <div className="px-3 pt-3 pb-2">
        <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Good Morning</div>
        <div className="text-[9px] font-black text-slate-900 leading-tight mt-0.5">Acme Services 👋</div>
        <div className="text-[7px] text-slate-400 mt-0.5">Here's your business overview</div>
      </div>
      {/* Stat cards */}
      <div className="px-3 grid grid-cols-2 gap-1.5">
        {stats.map(({ icon: Icon, val, label, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-2">
            <div className={`w-5 h-5 rounded-lg ${bg} flex items-center justify-center mb-1.5`}>
              <Icon className={`w-2.5 h-2.5 ${color}`} />
            </div>
            <div className="text-[9px] font-black text-slate-900 leading-none">{val}</div>
            <div className="text-[6px] text-slate-400 font-medium mt-0.5">{label}</div>
            <div className="text-[6px] text-slate-300 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="px-3 mt-2">
        <div className="bg-white rounded-xl border border-slate-100 p-2">
          <div className="text-[7px] font-black text-slate-700 mb-2">Revenue (Last 6 Months)</div>
          <div className="flex items-end gap-1 h-10">
            {[30, 55, 40, 75, 60, 90].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-indigo-600 opacity-80" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex gap-1 mt-1">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
              <div key={m} className="flex-1 text-center text-[5px] text-slate-300">{m}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Recent Documents Mobile Mockup ──────────────────────── */

function RecentDocsMobileContent() {
  const docs = [
    { num: 'INV-2026-0013', name: 'James Mensah', status: 'Draft',  statusCls: 'bg-slate-100 text-slate-500', amt: 'GH¢1,551' },
    { num: 'REC-2026-0003', name: 'Aisha Boateng', status: 'Sent',  statusCls: 'bg-blue-50 text-blue-600',   amt: 'GH¢1,188' },
    { num: 'INV-2026-0012', name: 'James Mensah', status: 'Sent',   statusCls: 'bg-blue-50 text-blue-600',   amt: 'GH¢1,188' },
  ];
  return (
    <div className="bg-white flex-1 relative overflow-hidden">
      {/* App header (blurred behind) */}
      <div className="bg-white border-b border-slate-100 px-3 py-2 flex items-center justify-between opacity-40">
        <LogoMark size={18} />
        <div className="flex gap-1"><div className="w-6 h-6 rounded-lg border border-slate-200" /><div className="w-6 h-6 rounded-lg border border-slate-200" /></div>
      </div>
      {/* Modal overlay */}
      <div className="absolute inset-x-0 top-0 bottom-0 bg-black/20" />
      <div className="absolute inset-x-2 top-2 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-800">Recent Documents</span>
          <X className="w-3 h-3 text-slate-400" />
        </div>
        {docs.map((d, i) => (
          <div key={i} className="border-b border-slate-50 px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-[8px] font-bold text-slate-800">{d.num}</div>
                <div className="text-[6px] text-slate-400">{d.name}</div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[6px] font-bold px-1.5 py-0.5 rounded-full ${d.statusCls}`}>{d.status}</span>
                <span className="text-[8px] font-black text-slate-700">{d.amt}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <div className="flex-1 border border-slate-200 rounded-lg text-center text-[6px] py-0.5 font-bold text-slate-600">Edit</div>
              <div className="flex-1 bg-emerald-600 rounded-lg text-center text-[6px] py-0.5 font-bold text-white">Preview PDF</div>
            </div>
          </div>
        ))}
      </div>
      {/* Bottom bar */}
      <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-100 px-2 py-1.5 flex gap-1.5">
        <div className="flex-1 bg-indigo-500 rounded-xl py-1.5 text-center text-[7px] font-bold text-white">Save</div>
        <div className="flex-1 bg-violet-600 rounded-xl py-1.5 text-center text-[7px] font-bold text-white">Send</div>
        <div className="flex-1 bg-emerald-600 rounded-xl py-1.5 text-center text-[7px] font-bold text-white">PDF</div>
      </div>
    </div>
  );
}

/* ─── Mobile Menu Mockup ───────────────────────────────────── */

function MobileMenuContent() {
  const items = [
    { icon: Plus,      label: 'New Document', cls: 'text-indigo-600', bg: 'bg-indigo-100', badge: null },
    { icon: FileText,  label: 'Documents',    cls: 'text-slate-600',  bg: 'bg-slate-100',  badge: '9+' },
    { icon: () => <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, label: 'Dashboard', cls: 'text-slate-600', bg: 'bg-slate-100', badge: null },
    { icon: Users,     label: 'Clients',      cls: 'text-slate-600',  bg: 'bg-slate-100',  badge: null },
    { icon: ScanLine,  label: 'Import Document',cls:'text-slate-600', bg: 'bg-slate-100',  badge: null },
    { icon: Settings,  label: 'Settings',     cls: 'text-slate-600',  bg: 'bg-slate-100',  badge: null },
  ];
  return (
    <div className="bg-white flex-1">
      {/* Drawer header */}
      <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <LogoMark size={18} />
          <span className="text-[9px] font-black text-slate-900">KraaFo</span>
        </div>
        <X className="w-3.5 h-3.5 text-slate-400" />
      </div>
      {/* Nav items */}
      <div className="py-1">
        {items.map(({ icon: Icon, label, cls, bg, badge }, i) => (
          <div key={label}>
            {i === 5 && <div className="h-px bg-slate-100 my-1 mx-3" />}
            <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50">
              <div className={`w-7 h-7 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-3 h-3 ${cls}`} />
              </div>
              <span className={`text-[9px] font-bold flex-1 ${cls}`}>{label}</span>
              {badge && (
                <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[7px] flex items-center justify-center font-bold">{badge}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="px-3 pt-2 text-center">
        <p className="text-[6px] text-slate-300 font-semibold tracking-wide">KraaFo — Free Professional Invoicing</p>
      </div>
    </div>
  );
}

/* ─── Branding Setup Mockup ────────────────────────────────── */

function BrandingSetupMockup() {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-200/60">
      {/* Wizard header */}
      <div className="bg-indigo-700 px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <LogoMark size={20} className="brightness-0 invert" />
            <span className="text-xs font-black text-white">Set Up KraaFo</span>
          </div>
          <span className="text-xs text-indigo-300 font-semibold">Step 2 of 4</span>
        </div>
        {/* Progress */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= 2 ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          {['Company Info', 'Branding', 'Invoice Settings', 'Banking & Payments'].map((s, i) => (
            <span key={s} className={`text-[9px] font-semibold ${i === 1 ? 'text-white' : 'text-indigo-300'}`}>{s}</span>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="bg-white px-5 py-4">
        <h3 className="text-sm font-black text-slate-900 mb-4">Brand your documents</h3>

        {/* Logo upload */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-600 mb-1.5 block">Company Logo</label>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-indigo-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-black">K</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Logo uploaded! Brand colors auto-extracted.</span>
            </div>
          </div>
        </div>

        {/* Brand colors */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-600 mb-2 block">Brand Colors</label>
          <div className="flex justify-around">
            {[
              { label: 'Primary', hex: '#4338CA', color: 'bg-indigo-700' },
              { label: 'Secondary', hex: '#1E1B5E', color: 'bg-indigo-950' },
              { label: 'Accent / Background', hex: '#EEF2FF', color: 'bg-indigo-50 border border-indigo-100' },
            ].map(({ label, hex, color }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-xl ${color}`} />
                <span className="text-[10px] font-semibold text-slate-600">{label}</span>
                <span className="text-[9px] text-slate-400 font-mono">{hex}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice preview */}
        <div className="rounded-xl overflow-hidden border border-slate-200">
          <div className="bg-indigo-700 h-1.5" />
          <div className="bg-white px-3 py-2 flex items-center justify-between">
            <div className="text-[10px] font-bold text-indigo-700">Your Company Name</div>
            <div className="text-[11px] font-black text-indigo-700 tracking-wider">INVOICE</div>
          </div>
          <div className="bg-indigo-700 mx-3 mb-3 rounded-lg h-6 opacity-20" />
        </div>
      </div>
      {/* Footer */}
      <div className="bg-white border-t border-slate-100 px-5 py-3 flex justify-between items-center">
        <button className="text-xs font-semibold text-slate-500">← Back</button>
        <div className="bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl">Continue →</div>
      </div>
    </div>
  );
}

/* ─── Main Landing Component ───────────────────────────────── */

export default function Landing() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes chipFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes phoneFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .marquee-track { animation: marquee 32s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        .chip-float { animation: chipFloat 3.5s ease-in-out infinite; }
        .phone-float { animation: phoneFloat 5s ease-in-out infinite; }
        /* Hero image float */
        @keyframes heroFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .hero-float { animation: heroFloat 7s ease-in-out infinite; }
        /* Shine sweep on hover */
        @keyframes shine { 0%{left:-80%} 100%{left:130%} }
        .hero-img-wrap { position:relative; overflow:hidden; border-radius:20px; }
        @media(min-width:640px){ .hero-img-wrap { border-radius:28px; } }
        .hero-img-wrap::after {
          content:''; position:absolute; top:0; left:-80%; width:55%; height:100%;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.18) 50%,transparent 60%);
          pointer-events:none;
        }
        .hero-img-wrap:hover::after { animation: shine 0.8s ease forwards; }
      `}</style>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="lg" />
          <div className="flex items-center gap-3">
            <Link to="/generator?demo=true" className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors hidden sm:block">Demo</Link>
            <Link to="/setup" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all btn-glow shadow-sm">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/50 to-violet-50/40 pt-16 pb-0 px-6">
        {/* Subtle dot-grid background */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.35 }} />

        {/* Text content */}
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-5">
            <LogoMark size={120} className="animate-float drop-shadow-xl" />
          </div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-1.5 rounded-full text-sm font-semibold mb-5 animate-hero delay-75">
            <Sparkles className="w-3.5 h-3.5" /> Smart templates for 12+ service industries
          </div>
          <h1 className="text-5xl md:text-[62px] font-black text-slate-900 tracking-tight leading-[1.06] mb-5 animate-hero delay-150">
            Invoices &amp; Receipts<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>Built for Professionals</span>
          </h1>
          <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed animate-hero delay-200">
            Upload your logo, pick your industry, and generate stunning invoices and receipts in under a minute. KraaFo handles the details.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-hero delay-300">
            <Link to="/setup" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-200 btn-glow">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/generator?demo=true" className="flex items-center justify-center gap-2 text-slate-600 px-8 py-3.5 rounded-xl font-bold text-base border border-slate-200 bg-white/80 hover:bg-white hover:border-slate-300 transition-all shadow-sm">
              View Demo
            </Link>
          </div>
          <div className="mt-7 flex items-center justify-center gap-5 flex-wrap animate-hero delay-400">
            {['No account needed', 'Works worldwide', '12+ industries'].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-slate-500 text-sm">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {t}
              </div>
            ))}
          </div>
        </div>

        {/* ── Hero image ───────────────────────────────────────── */}
        <div className="relative mt-10 animate-hero delay-500">

          {/* Diffuse glow behind image */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none" style={{ transform:'translateY(20%)' }}>
            <div style={{
              width:'72%', height:160,
              background:'radial-gradient(ellipse, rgba(99,102,241,0.28) 0%, rgba(124,58,237,0.12) 50%, transparent 72%)',
              filter:'blur(56px)',
            }} />
          </div>

          {/* Floating image wrapper */}
          <div className="hero-float relative max-w-6xl mx-auto px-3 sm:px-6">
            <div className="hero-img-wrap" style={{
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.7),' +
                '0 50px 120px rgba(99,102,241,0.24),' +
                '0 24px 48px rgba(0,0,0,0.14),' +
                '0 4px 16px rgba(0,0,0,0.08)',
            }}>
              <img
                src="/hero-preview.png"
                alt="KraaFo — invoice, receipt and client management"
                className="w-full h-auto block"
                loading="eager"
              />
              {/* Bottom fade blends into section background */}
              <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none" style={{
                background:'linear-gradient(to bottom, transparent, rgba(237,233,254,0.25))',
              }} />
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="mt-12 overflow-hidden pb-0">
          <div className="marquee-track flex gap-3 w-max">
            {[...industries, ...industries].map((ind, i) => (
              <span key={i} className="px-4 py-1.5 rounded-full text-xs font-semibold border border-slate-200 text-slate-500 bg-white shadow-sm shrink-0">{ind}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Phone Showcase ───────────────────────────────────── */}
      <section className="bg-slate-950 py-20 px-0 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Mobile-first</p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">Your entire business, in your pocket</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Create invoices, track clients, and get paid — all from your phone. Every feature works beautifully on mobile.</p>
          </div>

        </div>

        {/* Full-bleed image — edge fades blend into dark background */}
        <div className="relative mt-4">
          {/* Left fade */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 z-10 pointer-events-none"
            style={{ background:'linear-gradient(to right, #020617, transparent)' }} />
          {/* Right fade */}
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 z-10 pointer-events-none"
            style={{ background:'linear-gradient(to left, #020617, transparent)' }} />
          {/* Top fade */}
          <div className="absolute inset-x-0 top-0 h-10 z-10 pointer-events-none"
            style={{ background:'linear-gradient(to bottom, #020617, transparent)' }} />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-20 z-10 pointer-events-none"
            style={{ background:'linear-gradient(to top, #020617, transparent)' }} />

          <img
            src="/phones-showcase.png"
            alt="KraaFo mobile app — dashboard, clients and recent activity"
            className="w-full h-auto block"
            loading="lazy"
          />
        </div>

        {/* Feature chips */}
        <div className="max-w-5xl mx-auto px-6 pb-6">
          <div className="flex flex-wrap justify-center gap-3">
            {['Save, Send & PDF in one tap', 'Full document history', 'Client management', 'Smart navigation', 'Works offline-ready'].map(f => (
              <div key={f} className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                <CheckCircle className="w-3 h-3 text-indigo-400 shrink-0" /> {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Documents Showcase ─────────────────────────── */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Document history</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">All your documents,<br />always at your fingertips.</h2>
              <p className="text-slate-500 leading-relaxed mb-6">Every invoice, receipt, and quote is saved and searchable. Switch between documents in seconds — edit, preview, or re-send with one tap.</p>
              <div className="space-y-3">
                {['Invoices, receipts & quotes in one place', 'Instant PDF preview on any device', 'One-tap re-send to any client'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                    <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" /> {f}
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/generator?demo=true" className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors">
                  <Sparkles className="w-4 h-4" /> Try it live — no sign-up required <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <PhoneShell className="w-56 shadow-2xl shadow-slate-300/60">
                <RecentDocsMobileContent />
              </PhoneShell>
            </div>
          </div>
        </div>
      </section>

      {/* ── Branding Section ─────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Auto-branding</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Upload your logo.<br />We handle the rest.</h2>
            <p className="text-slate-500 leading-relaxed mb-6">KraaFo reads your logo and automatically extracts your brand colors — primary, secondary, and accent. Every invoice, receipt, and quote looks perfectly on-brand without touching a color picker.</p>
            <div className="space-y-3 mb-8">
              {['Brand colors auto-extracted from your logo', 'Applied to every document instantly', 'Change your logo — colors update everywhere'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                </div>
              ))}
            </div>
            <Link to="/setup" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all btn-glow shadow-sm">
              Set up your brand <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div>
            <BrandingSetupMockup />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {steps.map((s, i) => (
              <div key={s.n} className="relative animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                {i < steps.length - 1 && <div className="hidden md:block absolute top-7 left-full h-px bg-gradient-to-r from-indigo-200 to-transparent z-0" style={{ width: 'calc(100% - 2rem)' }} />}
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base mb-4 shadow-lg shadow-indigo-200">{s.n}</div>
                  <h3 className="font-black text-slate-800 text-base mb-1.5">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mb-12">
            <Link to="/generator?demo=true" className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors">
              <Sparkles className="w-4 h-4" /> Try it live — no sign-up required <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
      <section className="py-14 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex justify-center gap-1 mb-3">
              {[0,1,2,3,4].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Loved by service professionals worldwide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div key={t.name} className="rounded-2xl p-5 hover-lift animate-fade-up" style={{ animationDelay: `${i * 100}ms`, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex mb-3">{[0,1,2,3,4].map(s => <span key={s} className="text-amber-400 text-xs">★</span>)}</div>
                <p className="text-slate-300 mb-4 leading-relaxed text-sm">"{t.text}"</p>
                <div>
                  <div className="font-bold text-white text-sm">{t.name}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-16 px-6 text-center bg-white">
        <div className="max-w-lg mx-auto">
          <LogoMark size={96} className="mx-auto mb-6 animate-float" />
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Ready to send your first document?</h2>
          <p className="text-slate-500 mb-7 leading-relaxed">Takes under 2 minutes to set up. No account, no credit card.</p>
          <Link to="/setup" className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-xl font-bold text-base transition-all shadow-2xl shadow-indigo-200 btn-glow">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-6 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo size="lg" />
          <p className="text-sm text-slate-400">Professional invoices &amp; receipts for every service business.</p>
        </div>
      </footer>
    </div>
  );
}
