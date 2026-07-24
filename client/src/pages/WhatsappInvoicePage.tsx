import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, MessageSquare, Zap, Globe } from 'lucide-react';
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

export default function WhatsappInvoicePage() {
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
              style={{ background: 'linear-gradient(135deg,#22c55e 0%,#16a34a 100%)', boxShadow: '0 4px 20px rgba(34,197,94,0.45)' }}>
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-0 px-6" style={{ background: '#020617' }}>
        <div className="absolute -top-20 left-1/2 -translate-x-1/3 w-[900px] h-[700px] rounded-full pointer-events-none animate-blob"
          style={{ background: 'radial-gradient(ellipse at center,rgba(37,211,102,0.2) 0%,transparent 65%)' }} />
        <div className="absolute top-10 -right-24 w-[550px] h-[550px] rounded-full pointer-events-none animate-blob-slow"
          style={{ background: 'radial-gradient(ellipse at center,rgba(18,140,126,0.18) 0%,transparent 65%)' }} />
        <div className="absolute bottom-0 -left-16 w-[380px] h-[380px] rounded-full pointer-events-none animate-blob-slower"
          style={{ background: 'radial-gradient(ellipse at center,rgba(99,102,241,0.08) 0%,transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start pt-4 pb-28">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2.5 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-8 animate-hero"
                style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#86efac' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#4ade80' }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#4ade80' }} />
                </span>
                Send invoices direct from WhatsApp
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[58px] font-black tracking-tight leading-[1.05] mb-6 animate-hero" style={{ animationDelay: '80ms' }}>
                <span className="text-white">WhatsApp Invoice: </span>
                <span className="animate-grad-text"
                  style={{ backgroundImage: 'linear-gradient(135deg,#86efac 0%,#bbf7d0 45%,#4ade80 100%)' }}>
                  Send, Get Paid,<br />Move On.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 leading-relaxed animate-hero" style={{ animationDelay: '160ms' }}>
                Your clients are on WhatsApp. Meet them there. KraaFo sends a professional invoice with one tap: message pre-filled, PDF attached, ready to read on any phone.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-hero" style={{ animationDelay: '240ms' }}>
                <Link to="/generator"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#25D366 0%,#128C7E 100%)', boxShadow: '0 8px 32px rgba(37,211,102,0.45)' }}>
                  Send your first invoice, free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/setup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-slate-300 transition-all hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Sign up to save &amp; send
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 animate-hero" style={{ animationDelay: '320ms' }}>
                {['Works on any phone','No credit card needed','30+ countries supported'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#4ade80' }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: phone frame mockup with WhatsApp chat */}
            <div className="hidden lg:flex items-center justify-center pt-6 animate-hero" style={{ animationDelay: '200ms' }}>
              <div className="relative">
                <div className="absolute -inset-16 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center,rgba(37,211,102,0.28) 0%,transparent 65%)' }} />
                <div ref={tilt.ref} style={tilt.style} className="relative z-10 cursor-default">
                  {/* Phone frame */}
                  <div className="relative w-64 rounded-[40px] overflow-hidden"
                    style={{ background: '#111b21', boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 2px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.04)' }}>
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-5 pt-3 pb-1" style={{ background: '#111b21' }}>
                      <span className="text-[10px] text-white font-bold">9:41</span>
                      <div className="w-20 h-4 rounded-full" style={{ background: '#1a1a2e' }} />
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-2.5 rounded-sm border border-white/40 flex items-center pr-[1px] justify-end"><div className="w-2.5 h-1.5 rounded-sm bg-white/80" /></div>
                      </div>
                    </div>
                    {/* WhatsApp header */}
                    <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: '#202c33' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs"
                        style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>K</div>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold text-white">KraaFo Invoices</div>
                        <div className="text-[9px]" style={{ color: '#8696a0' }}>online</div>
                      </div>
                      <MessageSquare className="w-4 h-4" style={{ color: '#8696a0' }} />
                    </div>
                    {/* Chat messages */}
                    <div className="px-2 py-3 space-y-2 min-h-[260px]" style={{ background: '#0b141a', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3C/svg%3E")' }}>
                      {/* Received */}
                      <div className="flex justify-start">
                        <div className="rounded-2xl rounded-tl-none px-3 py-2 max-w-[80%]" style={{ background: '#202c33' }}>
                          <p className="text-[10px] text-white leading-tight">Hi! Can you send me the invoice for the plumbing job?</p>
                          <p className="text-[8px] mt-1 text-right" style={{ color: '#8696a0' }}>9:30</p>
                        </div>
                      </div>
                      {/* Sent */}
                      <div className="flex justify-end">
                        <div className="rounded-2xl rounded-tr-none px-3 py-2 max-w-[85%]" style={{ background: '#005c4b' }}>
                          <div className="flex items-center gap-2 mb-1.5 p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="w-7 h-8 rounded flex items-center justify-center shrink-0" style={{ background: '#128C7E' }}>
                              <span className="text-[8px] font-black text-white">PDF</span>
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-white">Invoice #0042</div>
                              <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.55)' }}>KraaFo · 54 KB</div>
                            </div>
                          </div>
                          <p className="text-[10px] text-white leading-tight">Hi James, here's your invoice for the kitchen fix. Total: £340. Due 25 Jul.</p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <p className="text-[8px]" style={{ color: 'rgba(255,255,255,0.55)' }}>9:41</p>
                            <svg width="14" height="8" viewBox="0 0 14 8" fill="none"><path d="M1 4L4 7L9 1" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 4L8 7L13 1" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                      </div>
                      {/* Received reply */}
                      <div className="flex justify-start">
                        <div className="rounded-2xl rounded-tl-none px-3 py-2 max-w-[70%]" style={{ background: '#202c33' }}>
                          <p className="text-[10px] text-white leading-tight">Thanks! Paying now 👍</p>
                          <p className="text-[8px] mt-1 text-right" style={{ color: '#8696a0' }}>9:43</p>
                        </div>
                      </div>
                    </div>
                    {/* Input bar */}
                    <div className="flex items-center gap-2 px-2 py-2" style={{ background: '#111b21' }}>
                      <div className="flex-1 rounded-full px-3 py-1.5 text-[9px]" style={{ background: '#2a3942', color: '#8696a0' }}>Message</div>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#00a884' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 right-2 z-20 animate-float flex items-center gap-1.5 text-white text-[10px] font-black px-3 py-1.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 8px 24px rgba(37,211,102,0.55)' }}>
                  <CheckCircle className="w-3 h-3" /> Delivered &amp; read
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
                  style={{ border: '2.5px solid #bbf7d0' }} loading="lazy" />
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
            <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#22c55e' }}>What you get</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Invoice by WhatsApp:<br className="hidden md:block" /> the way business works</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm">Your clients live on WhatsApp. Send your invoice where they already are, and get paid faster.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { Icon: MessageSquare, bg: '#f0fdf4', ic: '#22c55e', title: 'Message pre-filled for you', desc: 'KraaFo writes the WhatsApp message and attaches the PDF. You confirm and tap Send. No composing, no copying.' },
              { Icon: Globe,         bg: '#ecfdf5', ic: '#16a34a', title: 'Works in 30+ countries',     desc: 'Multi-currency support for GHS, NGN, KES, GBP, USD, BRL and more. Send invoices in the currency your client expects.' },
              { Icon: Zap,           bg: '#eef2ff', ic: '#6366f1', title: 'SMS and email too',           desc: 'Use "Send via all channels" and KraaFo fires WhatsApp, SMS, and email simultaneously. Maximum reach, one tap.' },
            ].map(({ Icon, bg, ic, title, desc }, i) => (
              <div key={title}
                className={`p-7 rounded-2xl border border-slate-100 group cursor-default transition-all duration-300 ${feat.on ? 'animate-fade-up opacity-100' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 110}ms` }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#bbf7d0'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 48px rgba(34,197,94,0.12)'; }}
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
              <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#22c55e' }}>Invoice by WhatsApp in 3 steps</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Send a professional invoice<br />in under a minute</h2>
              <p className="text-slate-500 leading-relaxed mb-6 text-sm">
                Most businesses send invoices by email and wait. KraaFo puts your invoice in the app your client checks 50 times a day.
              </p>
              <ul className="space-y-3">
                {['Pre-filled WhatsApp message, you just tap Send','PDF attached automatically','Works with any WhatsApp number, no API needed','Track open status and payment'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-slate-600 text-sm">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] text-white font-black"
                      style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>✓</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`bg-white rounded-2xl border border-slate-100 p-7 shadow-sm ${steps.on ? 'animate-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: '130ms' }}>
              {[
                { n:'1', t:'Create your invoice', d:'Fill in client details and services. KraaFo pre-fills line items for your industry and builds the branded PDF.' },
                { n:'2', t:'Tap "Send via WhatsApp"', d:'KraaFo opens WhatsApp with your message pre-filled and the PDF ready to attach. You tap Send.' },
                { n:'3', t:'Get paid', d:'Your client sees your invoice in their WhatsApp. No email spam filters, no missed attachments. Just a clear message in an app they use all day.' },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex gap-4 mb-6 last:mb-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>{n}</div>
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
            { '@type':'Question',name:'How do I send an invoice by WhatsApp?',acceptedAnswer:{'@type':'Answer',text:'Create your invoice in KraaFo, then tap "Send via WhatsApp." KraaFo opens WhatsApp with your message pre-filled and the PDF ready. You confirm and tap Send.'} },
            { '@type':'Question',name:'Do I need a WhatsApp Business account?',acceptedAnswer:{'@type':'Answer',text:'No. KraaFo works with any WhatsApp account, personal or Business. No API access or special setup required.'} },
            { '@type':'Question',name:'Can I send the invoice by SMS and email too?',acceptedAnswer:{'@type':'Answer',text:'Yes. Use "Send via all channels" and KraaFo sends WhatsApp, SMS, and email in one action. Or send each channel separately.'} },
            { '@type':'Question',name:'What countries does WhatsApp invoicing work in?',acceptedAnswer:{'@type':'Answer',text:'Anywhere WhatsApp is used. KraaFo supports 30+ currencies including GHS, NGN, KES, GBP, USD, EUR, BRL, and more.'} },
          ],
        }) }} />
        <div ref={faq.ref} className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#22c55e' }}>FAQ</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q:'How do I send an invoice by WhatsApp?', a:'Create your invoice in KraaFo, then tap "Send via WhatsApp." KraaFo opens WhatsApp with your message pre-filled and the PDF ready. You confirm and tap Send.' },
              { q:'Do I need a WhatsApp Business account?', a:'No. KraaFo works with any WhatsApp account, personal or Business. No API access or special setup required.' },
              { q:'Can I send the invoice by SMS and email too?', a:'Yes. Use "Send via all channels" and KraaFo sends WhatsApp, SMS, and email in one action. Or send each channel separately.' },
              { q:'What countries does WhatsApp invoicing work in?', a:'Anywhere WhatsApp is used. KraaFo supports 30+ currencies including GHS, NGN, KES, GBP, USD, EUR, BRL, and more.' },
            ].map(({ q, a }, i) => (
              <details key={q}
                className={`group rounded-2xl border border-slate-100 px-6 py-4 cursor-pointer bg-slate-50 hover:border-green-200 hover:bg-white transition-all ${faq.on ? 'animate-fade-up' : 'opacity-0'}`}
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
          style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 50%,rgba(37,211,102,0.18) 0%,transparent 70%)' }} />
        <div className="absolute top-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none" style={{ height: 70, transform: 'rotate(180deg)' }}>
            <path d="M0,0 C360,70 1080,0 1440,50 L1440,70 L0,70 Z" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 max-w-lg mx-auto pt-8">
          <h2 className="text-3xl font-black tracking-tight mb-3 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg,white 0%,#86efac 100%)' }}>
            Send your first invoice by WhatsApp
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">Create an invoice, send by WhatsApp. Free, no credit card needed.</p>
          <Link to="/generator"
            className="inline-flex items-center gap-2.5 text-white px-10 py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#25D366 0%,#128C7E 100%)', boxShadow: '0 8px 40px rgba(37,211,102,0.5)' }}>
            Send your first invoice, free <ArrowRight className="w-4 h-4" />
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
            <Link to="/invoice-generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Invoice Generator</Link>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <Link to="/receipt-generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Receipt Maker</Link>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <Link to="/generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Start Free</Link>
          </div>
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} KraaFo</p>
        </div>
      </footer>

    </div>
  );
}
