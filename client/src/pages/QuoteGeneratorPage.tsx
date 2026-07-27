import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, Zap, RefreshCw } from 'lucide-react';
import { Logo } from '../components/Logo';
import { use3DTilt } from '../hooks/use3DTilt';


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

export default function QuoteGeneratorPage() {
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
            <Link to="/setup" className="flex items-center gap-2 text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-0 px-6" style={{ background: '#020617' }}>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start pt-4 pb-28">

            {/* Left */}
            <div>
<h1 className="text-4xl md:text-5xl lg:text-[58px] font-black tracking-tight leading-[1.05] mb-6 animate-hero" style={{ animationDelay: '80ms' }}>
                <span className="text-white">Free Quote Generator: </span>
                <span style={{ color: '#a5b4fc' }}>
                  Win More Jobs,<br />Faster.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 leading-relaxed animate-hero" style={{ animationDelay: '160ms' }}>
                Send professional quotes clients take seriously. When they approve, convert to a paid invoice in one tap. No double entry, no friction.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-hero" style={{ animationDelay: '240ms' }}>
                <Link to="/generator"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                  Create your first quote, free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/setup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-slate-300 transition-all hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Sign up to save &amp; send
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 animate-hero" style={{ animationDelay: '320ms' }}>
                {['Works worldwide','No credit card needed','Convert quote → invoice instantly'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#a78bfa' }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 3D quote card */}
            <div className="hidden lg:flex items-center justify-center pt-6 animate-hero" style={{ animationDelay: '200ms' }}>
              <div className="relative">
<div ref={tilt.ref} style={tilt.style} className="relative z-10 cursor-default">
                  <div className="bg-white rounded-2xl overflow-hidden w-80"
                    style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)' }}>
                    <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#8b5cf6,#7c3aed)' }} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
                            style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>A</div>
                          <div>
                            <div className="font-black text-slate-800 text-sm">Ade Builders</div>
                            <div className="text-xs text-slate-400">Lagos, Nigeria</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quote</div>
                          <div className="font-black text-sm" style={{ color: '#8b5cf6' }}>#QTE-0031</div>
                        </div>
                      </div>
                      <div className="rounded-xl p-3 mb-3" style={{ background: '#faf5ff' }}>
                        <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Quoted to</div>
                        <div className="font-black text-slate-800 text-sm">Kemi & Tunde Afolabi</div>
                        <div className="text-xs text-slate-500">Lekki Phase 1, Lagos</div>
                      </div>
                      <div className="space-y-1.5 mb-4">
                        {[['Foundation & structural work','₦550,000'],['Brickwork & plastering','₦420,000'],['Roofing & finishing','₦380,000']].map(([d,a]) => (
                          <div key={d} className="flex justify-between text-xs py-1 border-b border-slate-50">
                            <span className="text-slate-600">{d}</span>
                            <span className="font-bold text-slate-800 tabular-nums">{a}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl px-4 py-2.5 flex justify-between items-center mb-3"
                        style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                        <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>Estimated Total</span>
                        <span className="font-black tabular-nums text-white text-lg">₦1,350,000</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Valid until 1 Aug 2026</span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          Awaiting approval
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 right-2 z-20 flex items-center gap-1.5 text-white text-[10px] font-black px-3 py-1.5 rounded-full"
                  style={{ background: '#059669' }}>
                  <RefreshCw className="w-3 h-3" /> Convert to invoice
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-white">
        <div ref={feat.ref} className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#8b5cf6' }}>What you get</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Quote, approve, invoice:<br className="hidden md:block" /> zero friction</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm">Professional quotes that win jobs, and convert to invoices the moment the client says yes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { Icon: FileText,  bg: '#f5f3ff', ic: '#8b5cf6', title: 'Branded PDF quotes',             desc: 'Upload your logo and KraaFo extracts your brand colors. Every quote looks like it came from a larger firm.' },
              { Icon: RefreshCw, bg: '#faf5ff', ic: '#7c3aed', title: 'Convert to invoice in 1 tap',    desc: 'When the client approves, tap Convert. All line items, amounts, and client details carry over with no retyping.' },
              { Icon: Zap,       bg: '#ecfdf5', ic: '#10b981', title: 'Send by WhatsApp, SMS or email', desc: 'Send your quote the way your client communicates. WhatsApp, SMS, and email all in one action.' },
            ].map(({ Icon, bg, ic, title, desc }, i) => (
              <div key={title}
                className={`p-7 rounded-2xl border border-slate-100 group cursor-default transition-all duration-300 ${feat.on ? 'animate-fade-up opacity-100' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 110}ms` }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#ddd6fe'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 48px rgba(139,92,246,0.12)'; }}
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
              <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#8b5cf6' }}>From quote to paid in 3 steps</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Quote, win, invoice.<br />It's that simple</h2>
              <p className="text-slate-500 leading-relaxed mb-6 text-sm">
                Stop sending quotes that look like text messages. KraaFo produces a document that makes clients say yes.
              </p>
              <ul className="space-y-3">
                {['Auto-fills line items for your industry','Expiry date, tax, discounts built in','1-tap conversion to invoice on approval','Works in any currency'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-slate-600 text-sm">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] text-white font-black"
                      style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>✓</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`bg-white rounded-2xl border border-slate-100 p-7 shadow-sm ${steps.on ? 'animate-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: '130ms' }}>
              {[
                { n:'1', t:'Fill in your quote', d:"Client name, services, prices, expiry. KraaFo's Smart Fill pre-loads line items for your trade." },
                { n:'2', t:'Send and await approval', d:'Send by WhatsApp, SMS, or email. Your client reviews the branded PDF and responds.' },
                { n:'3', t:'Convert to invoice in 1 tap', d:'When approved, tap Convert. Everything carries over: no retyping, no double entry.' },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex gap-4 mb-6 last:mb-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>{n}</div>
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
            { '@type':'Question',name:'Is the quote generator free?',acceptedAnswer:{'@type':'Answer',text:'Yes. Create and download quotes as PDF completely free, no account needed. Sign up free to save and send quotes and convert them to invoices.'} },
            { '@type':'Question',name:'What should a quote include?',acceptedAnswer:{'@type':'Answer',text:'A quote should include your business name, client name, a list of services with prices, an expiry date, and payment terms. KraaFo handles layout, numbering, and VAT automatically.'} },
            { '@type':'Question',name:'Can I convert a quote to an invoice?',acceptedAnswer:{'@type':'Answer',text:'Yes. When a client approves, tap Convert in KraaFo. All line items, prices, and client details carry over automatically, with no retyping.'} },
            { '@type':'Question',name:'Can I send a quote by WhatsApp?',acceptedAnswer:{'@type':'Answer',text:'Yes. Sign up free and KraaFo opens WhatsApp with your quote ready to send. You can also send SMS and email in the same action.'} },
          ],
        }) }} />
        <div ref={faq.ref} className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#8b5cf6' }}>FAQ</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q:'Is the quote generator free?', a:'Yes. Create and download quotes as PDF completely free, no account needed. Sign up free to save and send quotes and convert them to invoices.' },
              { q:'What should a quote include?', a:'A quote should include your business name, client name, a list of services with prices, an expiry date, and payment terms. KraaFo handles layout, numbering, and VAT automatically.' },
              { q:'Can I convert a quote to an invoice?', a:'Yes. When a client approves, tap Convert in KraaFo. All line items, prices, and client details carry over automatically, with no retyping.' },
              { q:'Can I send a quote by WhatsApp?', a:'Yes. Sign up free and KraaFo opens WhatsApp with your quote ready to send. You can also send SMS and email in the same action.' },
            ].map(({ q, a }, i) => (
              <details key={q}
                className={`group rounded-2xl border border-slate-100 px-6 py-4 cursor-pointer bg-slate-50 hover:border-violet-200 hover:bg-white transition-all ${faq.on ? 'animate-fade-up' : 'opacity-0'}`}
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
      <section className="py-24 px-6 text-center" style={{ background: '#020617' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 50%,rgba(139,92,246,0.22) 0%,transparent 70%)' }} />
<div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-black tracking-tight mb-3 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg,white 0%,#c4b5fd 100%)' }}>
            Ready to win more jobs?
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">Create a quote in under 60 seconds. Free, no credit card needed.</p>
          <Link to="/generator"
            className="inline-flex items-center gap-2.5 text-white bg-indigo-600 hover:bg-indigo-700 px-10 py-4 rounded-xl font-bold text-base transition-colors">
            Create your first quote, free <ArrowRight className="w-4 h-4" />
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
