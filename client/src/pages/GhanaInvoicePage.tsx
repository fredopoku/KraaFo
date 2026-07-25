import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Globe, MessageSquare } from 'lucide-react';
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

export default function GhanaInvoicePage() {
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
                <span className="text-white">Invoice Generator for Ghana: </span>
                <span style={{ color: '#a5b4fc' }}>
                  GHS Invoices,<br />MoMo-Ready.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 leading-relaxed animate-hero" style={{ animationDelay: '160ms' }}>
                Create professional GHS invoices for Ghanaian clients in under a minute. Include MTN MoMo and Vodafone Cash payment details. Send by WhatsApp or SMS, the way Ghana does business.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-hero" style={{ animationDelay: '240ms' }}>
                <Link to="/generator"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                  Create your GHS invoice, free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/setup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-slate-300 transition-all hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Sign up to save &amp; send
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 animate-hero" style={{ animationDelay: '320ms' }}>
                {['GHS currency support','MTN MoMo & Vodafone Cash','WhatsApp & SMS delivery'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#818cf8' }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 3D GHS invoice card */}
            <div className="hidden lg:flex items-center justify-center pt-6 animate-hero" style={{ animationDelay: '200ms' }}>
              <div className="relative">
                <div className="absolute -inset-16 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center,rgba(99,102,241,0.28) 0%,transparent 65%)' }} />
                <div ref={tilt.ref} style={tilt.style} className="relative z-10 cursor-default">
                  <div className="bg-white rounded-2xl overflow-hidden w-80"
                    style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)' }}>
                    <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#6366f1,#f59e0b)' }} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>A</div>
                          <div>
                            <div className="font-black text-slate-800 text-sm">Ama Services</div>
                            <div className="text-xs text-slate-400">Kumasi, Ghana</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice</div>
                          <div className="font-black text-sm" style={{ color: '#6366f1' }}>#INV-0088</div>
                        </div>
                      </div>
                      <div className="rounded-xl p-3 mb-3" style={{ background: '#eef2ff' }}>
                        <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Bill to</div>
                        <div className="font-black text-slate-800 text-sm">Kofi Asante</div>
                        <div className="text-xs text-slate-500">Adum, Kumasi</div>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {[['Office cleaning – 2 weeks','GHS 800'],['Laundry service × 8','GHS 240'],['Deep clean – conference room','GHS 350']].map(([d,a]) => (
                          <div key={d} className="flex justify-between text-xs py-1 border-b border-slate-50">
                            <span className="text-slate-600">{d}</span>
                            <span className="font-bold text-slate-800 tabular-nums">{a}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl px-4 py-2.5 flex justify-between items-center mb-2"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                        <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>Total Due</span>
                        <span className="font-black tabular-nums text-white text-lg">GHS 1,390</span>
                      </div>
                      {/* MoMo payment bar */}
                      <div className="rounded-lg px-3 py-2 flex items-center gap-2"
                        style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                        <span className="text-[9px] font-black" style={{ color: '#f59e0b' }}>Pay via MTN MoMo</span>
                        <span className="text-[9px] text-slate-500 ml-auto tabular-nums">0244 ··· ···</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 right-2 z-20 flex items-center gap-1.5 text-white text-[10px] font-black px-3 py-1.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 8px 24px rgba(37,211,102,0.55)' }}>
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
            Trusted by Ghanaian small businesses across every sector
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Built for the way<br className="hidden md:block" /> Ghana does business</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm">GHS invoices with MoMo payment details, sent by WhatsApp in under a minute.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { Icon: Globe,        bg: '#eef2ff', ic: '#6366f1', title: 'GHS invoices with MoMo details', desc: 'Include your MTN MoMo or Vodafone Cash number on every invoice. Clients know exactly how to pay without calling you.' },
              { Icon: MessageSquare,bg: '#f0fdf4', ic: '#22c55e', title: 'WhatsApp & SMS delivery',          desc: "Send invoices directly to clients via WhatsApp or SMS. No email, no downloading apps. It arrives where they'll see it." },
              { Icon: Zap,          bg: '#fef3c7', ic: '#f59e0b', title: 'Works offline, sends when ready',  desc: 'Create your invoice on any device, even without internet. When you connect, send with one tap.' },
            ].map(({ Icon, bg, ic, title, desc }, i) => (
              <div key={title}
                className={`p-7 rounded-2xl border border-slate-100 group cursor-default transition-all duration-300 ${feat.on ? 'animate-fade-up opacity-100' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 110}ms` }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#c7d2fe'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 48px rgba(99,102,241,0.12)'; }}
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
              <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#6366f1' }}>GHS invoice in 3 steps</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Professional invoice,<br />under 60 seconds</h2>
              <p className="text-slate-500 leading-relaxed mb-6 text-sm">
                Stop sending WhatsApp voice notes as invoices. KraaFo gives you a branded PDF with GHS amounts and MoMo details that clients respect and pay.
              </p>
              <ul className="space-y-3">
                {['GHS currency with accurate formatting','MTN MoMo / Vodafone Cash payment fields','Send by WhatsApp with no email needed','No account required to download PDF'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-slate-600 text-sm">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] text-white font-black"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>✓</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`bg-white rounded-2xl border border-slate-100 p-7 shadow-sm ${steps.on ? 'animate-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: '130ms' }}>
              {[
                { n:'1', t:'Enter your client and services', d:'Fill in the client name, services rendered, and GHS amounts. Add your MoMo number in the payment section.' },
                { n:'2', t:'Preview your branded invoice', d:'Your logo and colors appear instantly. The invoice shows GHS totals and your payment details.' },
                { n:'3', t:'Send by WhatsApp or download', d:'Tap "Send via WhatsApp" and it opens pre-filled. Or download the PDF free, no account needed.' },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex gap-4 mb-6 last:mb-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>{n}</div>
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
            { '@type':'Question',name:'Can I create a GHS invoice for free?',acceptedAnswer:{'@type':'Answer',text:'Yes. Create and download a GHS invoice as PDF completely free, no account needed. Sign up free to save invoices and send them by WhatsApp or SMS.'} },
            { '@type':'Question',name:'Can I include my MoMo number on the invoice?',acceptedAnswer:{'@type':'Answer',text:'Yes. KraaFo lets you add your MTN MoMo or Vodafone Cash number in the payment details section. Clients see exactly where to pay without needing to call you.'} },
            { '@type':'Question',name:'How do I send a GHS invoice by WhatsApp?',acceptedAnswer:{'@type':'Answer',text:'Create your invoice in KraaFo, then tap "Send via WhatsApp." KraaFo opens WhatsApp with your message pre-filled and the PDF ready. Confirm and tap Send.'} },
            { '@type':'Question',name:'Does KraaFo support Ghanaian tax (VAT)?',acceptedAnswer:{'@type':'Answer',text:'Yes. You can add VAT (or any percentage tax) to your invoice. KraaFo calculates the total automatically and displays it clearly on the PDF.'} },
          ],
        }) }} />
        <div ref={faq.ref} className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#6366f1' }}>FAQ</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q:'Can I create a GHS invoice for free?', a:'Yes. Create and download a GHS invoice as PDF completely free, no account needed. Sign up free to save invoices and send them by WhatsApp or SMS.' },
              { q:'Can I include my MoMo number on the invoice?', a:'Yes. KraaFo lets you add your MTN MoMo or Vodafone Cash number in the payment details section. Clients see exactly where to pay without needing to call you.' },
              { q:'How do I send a GHS invoice by WhatsApp?', a:'Create your invoice in KraaFo, then tap "Send via WhatsApp." KraaFo opens WhatsApp with your message pre-filled and the PDF ready. Confirm and tap Send.' },
              { q:'Does KraaFo support Ghanaian tax (VAT)?', a:'Yes. You can add VAT (or any percentage tax) to your invoice. KraaFo calculates the total automatically and displays it clearly on the PDF.' },
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
            style={{ backgroundImage: 'linear-gradient(135deg,white 0%,#fcd34d 100%)' }}>
            Send your first GHS invoice today
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">Professional GHS invoice in under 60 seconds. Free, no credit card needed.</p>
          <Link to="/generator"
            className="inline-flex items-center gap-2.5 text-white bg-indigo-600 hover:bg-indigo-700 px-10 py-4 rounded-xl font-bold text-base transition-colors">
            Create your GHS invoice, free <ArrowRight className="w-4 h-4" />
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
            <Link to="/whatsapp-invoice-generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">WhatsApp Invoice</Link>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <Link to="/generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Start Free</Link>
          </div>
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} KraaFo</p>
        </div>
      </footer>

    </div>
  );
}
