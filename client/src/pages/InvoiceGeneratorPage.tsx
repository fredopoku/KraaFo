import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, Zap, MessageSquare } from 'lucide-react';
import { Logo } from '../components/Logo';
import { use3DTilt } from '../hooks/use3DTilt';

const PORTRAITS = [
  { src: '/phase3/portrait-accra.jpg',      name: 'Abena K.',  city: 'Accra, Ghana',     role: 'Cleaning services' },
  { src: '/phase3/portrait-lagos.jpg',      name: 'Chidi O.',  city: 'Lagos, Nigeria',    role: 'Tailoring' },
  { src: '/phase3/portrait-manchester.jpg', name: 'Tom H.',    city: 'Manchester, UK',    role: 'Plumbing' },
  { src: '/phase3/portrait-saopaulo.jpg',   name: 'Ana M.',    city: 'São Paulo, Brazil', role: 'Food & catering' },
];

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, on };
}

export default function InvoiceGeneratorPage() {
  const tilt = use3DTilt();
  const feat = useReveal();
  const steps = useReveal();
  const faq = useReveal();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/"><Logo size="lg" dark /></Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors hidden sm:block">Sign in</Link>
            <Link to="/setup" className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.45)' }}>
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-0 px-6" style={{ background: '#020617' }}>
        {/* Animated blobs */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/3 w-[900px] h-[700px] rounded-full pointer-events-none animate-blob"
          style={{ background: 'radial-gradient(ellipse at center,rgba(99,102,241,0.22) 0%,transparent 65%)' }} />
        <div className="absolute top-10 -right-24 w-[550px] h-[550px] rounded-full pointer-events-none animate-blob-slow"
          style={{ background: 'radial-gradient(ellipse at center,rgba(139,92,246,0.18) 0%,transparent 65%)' }} />
        <div className="absolute bottom-0 -left-16 w-[380px] h-[380px] rounded-full pointer-events-none animate-blob-slower"
          style={{ background: 'radial-gradient(ellipse at center,rgba(16,185,129,0.09) 0%,transparent 70%)' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start pt-4 pb-28">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2.5 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-8 animate-hero"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.28)', color: '#a5b4fc' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#818cf8' }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#818cf8' }} />
                </span>
                Free · No account needed to download
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[58px] font-black tracking-tight leading-[1.05] mb-6 animate-hero" style={{ animationDelay: '80ms' }}>
                <span className="text-white">Free Invoice Generator: </span>
                <span className="animate-grad-text"
                  style={{ backgroundImage: 'linear-gradient(135deg,#a5b4fc 0%,#c4b5fd 45%,#93c5fd 100%)' }}>
                  Branded PDFs in 60&nbsp;Seconds.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 leading-relaxed animate-hero" style={{ animationDelay: '160ms' }}>
                No design skills needed. Fill in your client details and services. KraaFo builds a professional, branded invoice in under a minute.{' '}
                <span className="text-slate-300 font-semibold">Download free</span>, or sign up free to send by WhatsApp, SMS, or email.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-hero" style={{ animationDelay: '240ms' }}>
                <Link to="/generator"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.45)' }}>
                  Create your first invoice, free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/setup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-slate-300 transition-all hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Sign up to save &amp; send
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 animate-hero" style={{ animationDelay: '320ms' }}>
                {['Works in 30+ countries', 'No credit card needed', '12+ industries'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#818cf8' }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 3D invoice card */}
            <div className="hidden lg:flex items-center justify-center pt-6 animate-hero" style={{ animationDelay: '200ms' }}>
              <div className="relative">
                {/* Ambient glow */}
                <div className="absolute -inset-16 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center,rgba(99,102,241,0.3) 0%,transparent 65%)' }} />
                {/* 3D tilt wrapper */}
                <div ref={tilt.ref} style={tilt.style} className="relative z-10 cursor-default">
                  <div className="bg-white rounded-2xl overflow-hidden w-80"
                    style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)' }}>
                    <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>B</div>
                          <div>
                            <div className="font-black text-slate-800 text-sm">Bright Edge Studio</div>
                            <div className="text-xs text-slate-400">Manchester, UK</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice</div>
                          <div className="font-black text-sm" style={{ color: '#6366f1' }}>#INV-0042</div>
                        </div>
                      </div>
                      <div className="rounded-xl p-3 mb-3" style={{ background: '#f8fafc' }}>
                        <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Bill to</div>
                        <div className="font-black text-slate-800 text-sm">James Okonkwo</div>
                        <div className="text-xs text-slate-500">james@techco.io</div>
                      </div>
                      <div className="space-y-1.5 mb-4">
                        {[['Brand identity design','£1,200'],['Social media templates ×10','£400'],['Brand guidelines PDF','£300']].map(([d,a]) => (
                          <div key={d} className="flex justify-between text-xs py-1 border-b border-slate-50">
                            <span className="text-slate-600">{d}</span>
                            <span className="font-bold text-slate-800 tabular-nums">{a}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl px-4 py-2.5 flex justify-between items-center mb-3"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>
                        <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>Total Due</span>
                        <span className="font-black tabular-nums text-white text-lg">£1,900</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Due 25 Jul 2026</span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          Awaiting payment
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 right-2 z-20 animate-float flex items-center gap-1.5 text-white text-[10px] font-black px-3 py-1.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.55)' }}>
                  <CheckCircle className="w-3 h-3" /> Sent via WhatsApp
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Wave ── */}
      <div style={{ background: '#020617', marginBottom: '-2px' }}>
        <svg viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none" style={{ height: 70 }}>
          <path d="M0,0 C360,70 1080,0 1440,50 L1440,70 L0,70 Z" fill="white" />
        </svg>
      </div>

      {/* ── Social proof ── */}
      <section className="py-7 px-6 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.14em] mb-5">
            Used by small businesses in 30+ countries
          </p>
          <div className="flex flex-wrap items-center justify-center gap-7">
            {PORTRAITS.map(({ src, name, city, role }) => (
              <div key={name} className="flex items-center gap-3">
                <img src={src} alt={`${name}, ${role}, uses KraaFo`}
                  className="w-11 h-11 rounded-full object-cover shadow-md"
                  style={{ border: '2.5px solid #c7d2fe' }} loading="lazy" />
                <div>
                  <div className="text-xs font-bold text-slate-700">{name}</div>
                  <div className="text-[10px] text-slate-400">{city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-white">
        <div ref={feat.ref} className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#6366f1' }}>What you get</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Everything your invoice needs,<br className="hidden md:block" /> nothing it doesn't</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm">Professional invoices in under 60 seconds, from blank to branded PDF.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { Icon: Zap,          bg: '#eef2ff', ic: '#6366f1', title: 'Smart Fill for any industry', desc: 'Pick your trade and KraaFo pre-fills line items, pricing, and terms. Works for cleaning, construction, creative services, and 12+ more.' },
              { Icon: FileText,     bg: '#f5f3ff', ic: '#8b5cf6', title: 'Branded PDF every time',      desc: 'Upload your logo once and KraaFo automatically extracts your brand colors. Every invoice carries your brand with a full itemized layout.' },
              { Icon: MessageSquare,bg: '#ecfdf5', ic: '#10b981', title: 'Send via WhatsApp, SMS or email', desc: 'Broadcast to all three at once, or pick the one your client uses. WhatsApp and SMS open pre-filled; email delivers automatically.' },
            ].map(({ Icon, bg, ic, title, desc }, i) => (
              <div key={title}
                className={`p-7 rounded-2xl border border-slate-100 group cursor-default transition-all duration-300 ${feat.on ? 'animate-fade-up opacity-100' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 110}ms` }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#a5b4fc'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 48px rgba(99,102,241,0.12)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = ''; el.style.transform = ''; el.style.boxShadow = ''; }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color: ic }} />
                </div>
                <h3 className="font-bold text-slate-800 mb-2 text-sm">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div ref={steps.ref} className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={steps.on ? 'animate-fade-up' : 'opacity-0'}>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#6366f1' }}>Your invoice in 3 steps</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">From blank to paid<br />in under a minute</h2>
              <p className="text-slate-500 leading-relaxed mb-6 text-sm">
                Most free invoice generators produce generic PDFs with watermarks. KraaFo produces a document that looks like it came from a company twice your size.
              </p>
              <ul className="space-y-3">
                {['Auto-extracts brand colors from your logo','Professional layout: due dates, tax, discounts','Send by WhatsApp, SMS, or email in one tap','Multi-currency, works in any country'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-slate-600 text-sm">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] text-white font-black"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>✓</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`bg-white rounded-2xl border border-slate-100 p-7 shadow-sm ${steps.on ? 'animate-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: '130ms' }}>
              {[
                { n:'1', t:'Fill in your client and services', d:"Smart Fill pre-populates line items for your industry. Edit what you need, skip what you don't." },
                { n:'2', t:'Preview and adjust in real time', d:'Live preview updates as you type. Change rates, add items, toggle tax.' },
                { n:'3', t:'Download or send', d:'Download free as PDF, no account needed. Sign up free to send by WhatsApp, SMS, or email and save your history.' },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex gap-4 mb-6 last:mb-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>{n}</div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm mb-1">{t}</div>
                    <div className="text-slate-500 text-xs leading-relaxed">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6 bg-white">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context':'https://schema.org','@type':'FAQPage',
          mainEntity:[
            {  '@type':'Question',name:'Is it really free to create an invoice?',acceptedAnswer:{'@type':'Answer',text:'Yes. Creating and downloading invoices as PDF is completely free, no account needed. Sign up free to save your invoices and send them by WhatsApp, SMS, or email.'} },
            {  '@type':'Question',name:'Do I need an account to download the PDF?',acceptedAnswer:{'@type':'Answer',text:'No. Fill in your invoice and download the PDF without signing up. A free account lets you save your history and send invoices directly to clients.'} },
            {  '@type':'Question',name:'Can I send an invoice by WhatsApp?',acceptedAnswer:{'@type':'Answer',text:'Yes. KraaFo opens WhatsApp with your invoice message pre-filled. You confirm and tap Send. Or use "Send via all channels" to trigger WhatsApp, SMS, and email in one action.'} },
            {  '@type':'Question',name:'What information does an invoice need?',acceptedAnswer:{'@type':'Answer',text:'At minimum: your business name, client name, a list of services with prices, and a due date. KraaFo handles layout, numbering, tax calculations, and currency formatting automatically.'} },
          ],
        }) }} />
        <div ref={faq.ref} className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#6366f1' }}>FAQ</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q:'Is it really free to create an invoice?', a:'Yes. Creating and downloading invoices as PDF is completely free, no account needed. Sign up free to save your invoices and send them by WhatsApp, SMS, or email.' },
              { q:'Do I need an account to download the PDF?', a:'No. Fill in your invoice and download the PDF without signing up. A free account lets you save your history and send invoices directly to clients.' },
              { q:'Can I send an invoice by WhatsApp?', a:'Yes. KraaFo opens WhatsApp with your invoice message pre-filled. You confirm and tap Send. Or use "Send via all channels" to trigger WhatsApp, SMS, and email in one action.' },
              { q:'What information does an invoice need?', a:'At minimum: your business name, client name, a list of services with prices, and a due date. KraaFo handles layout, numbering, tax calculations, and currency formatting automatically.' },
            ].map(({ q, a }, i) => (
              <details key={q}
                className={`group rounded-2xl border border-slate-100 px-6 py-4 cursor-pointer bg-slate-50 hover:border-indigo-200 hover:bg-white transition-all ${faq.on ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 80}ms` }}>
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

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden" style={{ background: '#020617' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 50%,rgba(99,102,241,0.22) 0%,transparent 70%)' }} />
        <div className="absolute top-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none" style={{ height: 70, transform: 'rotate(180deg)' }}>
            <path d="M0,0 C360,70 1080,0 1440,50 L1440,70 L0,70 Z" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 max-w-lg mx-auto pt-8">
          <h2 className="text-3xl font-black tracking-tight mb-3 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg,white 0%,#c4b5fd 100%)' }}>
            Ready to send your first invoice?
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">Under 60 seconds to your first professional invoice. Free, no credit card needed.</p>
          <Link to="/generator"
            className="inline-flex items-center gap-2.5 text-white px-10 py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)', boxShadow: '0 8px 40px rgba(99,102,241,0.5)' }}>
            Create your first invoice, free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-8 border-t" style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/"><Logo size="lg" dark /></Link>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Home</Link>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <Link to="/receipt-generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Receipt Maker</Link>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <Link to="/quote-generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Quote Generator</Link>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <Link to="/generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Invoice Tool</Link>
          </div>
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} KraaFo</p>
        </div>
      </footer>

    </div>
  );
}
