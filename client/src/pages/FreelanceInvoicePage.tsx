import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, Zap, Clock } from 'lucide-react';
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

export default function FreelanceInvoicePage() {
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
                <span className="text-white">Freelance Invoice Generator: </span>
                <span style={{ color: '#a5b4fc' }}>
                  Look Pro,<br />Get Paid Faster.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 leading-relaxed animate-hero" style={{ animationDelay: '160ms' }}>
                Freelancers who send professional invoices get paid faster. KraaFo builds a branded invoice in under a minute. No accounting software, no subscription, no watermarks.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-hero" style={{ animationDelay: '240ms' }}>
                <Link to="/generator"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                  Create your first invoice, free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/setup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-slate-300 transition-all hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Sign up to save &amp; send
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 animate-hero" style={{ animationDelay: '320ms' }}>
                {['No accounting software needed','Multi-currency support','No watermarks on free PDFs'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#c084fc' }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 3D freelance invoice card */}
            <div className="hidden lg:flex items-center justify-center pt-6 animate-hero" style={{ animationDelay: '200ms' }}>
              <div className="relative">
<div ref={tilt.ref} style={tilt.style} className="relative z-10 cursor-default">
                  <div className="bg-white rounded-2xl overflow-hidden w-80"
                    style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)' }}>
                    <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#8b5cf6,#d946ef)' }} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
                            style={{ background: 'linear-gradient(135deg,#8b5cf6,#d946ef)' }}>S</div>
                          <div>
                            <div className="font-black text-slate-800 text-sm">Sana Designs</div>
                            <div className="text-xs text-slate-400">Lagos, Nigeria</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice</div>
                          <div className="font-black text-sm" style={{ color: '#8b5cf6' }}>#INV-0056</div>
                        </div>
                      </div>
                      <div className="rounded-xl p-3 mb-3" style={{ background: '#fdf4ff' }}>
                        <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Bill to</div>
                        <div className="font-black text-slate-800 text-sm">Kojo Digital Ltd</div>
                        <div className="text-xs text-slate-500">kojo@digitalgh.com</div>
                      </div>
                      <div className="space-y-1.5 mb-4">
                        {[['UI/UX design – 12 screens','$900'],['Prototype & handoff','$600'],['Design system components','$400']].map(([d,a]) => (
                          <div key={d} className="flex justify-between text-xs py-1 border-b border-slate-50">
                            <span className="text-slate-600">{d}</span>
                            <span className="font-bold text-slate-800 tabular-nums">{a}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl px-4 py-2.5 flex justify-between items-center mb-3"
                        style={{ background: 'linear-gradient(135deg,#8b5cf6,#d946ef)' }}>
                        <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>Total Due</span>
                        <span className="font-black tabular-nums text-white text-lg">$1,900</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Due 30 Jul 2026</span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          Awaiting payment
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 right-2 z-20 flex items-center gap-1.5 text-white text-[10px] font-black px-3 py-1.5 rounded-full"
                  style={{ background: '#059669' }}>
                  <CheckCircle className="w-3 h-3" /> Sent via WhatsApp
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Wave ── */}
{/* ── Social proof ── */}
      <section className="py-7 px-6 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.14em] mb-5">
            Trusted by freelancers in 30+ countries
          </p>
          <div className="flex flex-wrap items-center justify-center gap-7">
            {PORTRAITS.map(({ src, name, city, role }) => (
              <div key={name} className="flex items-center gap-3">
                <img src={src} alt={`${name}, ${role}, uses KraaFo`}
                  className="w-11 h-11 rounded-full object-cover shadow-md"
                  style={{ border: '2.5px solid #e9d5ff' }} loading="lazy" />
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
            <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#8b5cf6' }}>What you get</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Everything a freelancer needs<br className="hidden md:block" /> to get paid on time</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm">Professional invoices in any currency, sent in under 60 seconds. No accounting background required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { Icon: FileText, bg: '#fdf4ff', ic: '#8b5cf6', title: 'Branded PDF, no watermark',     desc: 'Your logo, your colors. A polished invoice that positions you as a professional, even on your first project.'},
              { Icon: Clock,    bg: '#f5f3ff', ic: '#7c3aed', title: 'Net terms, milestones, deposits', desc: 'Set Net 7, 14, or 30 terms. Add a deposit amount or split payment milestones. Works for any project structure.' },
              { Icon: Zap,      bg: '#fdf2f8', ic: '#d946ef', title: 'Send by WhatsApp, email, or SMS', desc: 'Chase your payment where your client is. WhatsApp, SMS, and email in one tap. No email threads to manage.' },
            ].map(({ Icon, bg, ic, title, desc }, i) => (
              <div key={title}
                className={`p-7 rounded-2xl border border-slate-100 group cursor-default transition-all duration-300 ${feat.on ? 'animate-fade-up opacity-100' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 110}ms` }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e9d5ff'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 48px rgba(139,92,246,0.12)'; }}
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
              <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#8b5cf6' }}>Your invoice in 3 steps</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Stop chasing payment.<br />Start getting it.</h2>
              <p className="text-slate-500 leading-relaxed mb-6 text-sm">
                Freelancers who invoice professionally get paid 2× faster. KraaFo takes the admin so you can focus on the work.
              </p>
              <ul className="space-y-3">
                {['No accounting degree needed','Multi-currency: USD, GBP, EUR, GHS, NGN and more','Net terms, deposit, and milestone support','Download free or sign up to send and track'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-slate-600 text-sm">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] text-white font-black"
                      style={{ background: 'linear-gradient(135deg,#8b5cf6,#d946ef)' }}>✓</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`bg-white rounded-2xl border border-slate-100 p-7 shadow-sm ${steps.on ? 'animate-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: '130ms' }}>
              {[
                { n:'1', t:'Fill in your project details', d:"Client name, services rendered, currency, and net terms. KraaFo pre-fills freelance line items so you don't start from scratch." },
                { n:'2', t:'Preview your branded invoice', d:'Your logo and colors appear instantly. Adjust rates, add a deposit, or set milestone amounts.' },
                { n:'3', t:'Send and track', d:'Download free. Sign up free to send by WhatsApp, SMS, or email and see when the client opens your invoice.' },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex gap-4 mb-6 last:mb-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#d946ef)' }}>{n}</div>
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
            { '@type':'Question',name:'Is this free for freelancers?',acceptedAnswer:{'@type':'Answer',text:'Yes. Create and download invoices as PDF completely free, no account needed and no watermarks. Sign up free to save invoices and send them directly to clients.'} },
            { '@type':'Question',name:'Can I invoice in USD, GBP, or other currencies?',acceptedAnswer:{'@type':'Answer',text:'Yes. KraaFo supports 30+ currencies including USD, GBP, EUR, GHS, NGN, KES, BRL, and more. Set your currency per invoice.'} },
            { '@type':'Question',name:'Can I set payment terms like Net 30?',acceptedAnswer:{'@type':'Answer',text:'Yes. Set Net 7, 14, or 30 terms, or a custom due date. You can also add a deposit amount or milestone payments for larger projects.'} },
            { '@type':'Question',name:'Do I need accounting software?',acceptedAnswer:{'@type':'Answer',text:'No. KraaFo handles invoicing without accounting knowledge. Create a professional invoice, download or send, and get paid. No setup, no subscriptions.'} },
          ],
        }) }} />
        <div ref={faq.ref} className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-3" style={{ color: '#8b5cf6' }}>FAQ</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q:'Is this free for freelancers?', a:'Yes. Create and download invoices as PDF completely free, no account needed and no watermarks. Sign up free to save invoices and send them directly to clients.' },
              { q:'Can I invoice in USD, GBP, or other currencies?', a:'Yes. KraaFo supports 30+ currencies including USD, GBP, EUR, GHS, NGN, KES, BRL, and more. Set your currency per invoice.' },
              { q:'Can I set payment terms like Net 30?', a:'Yes. Set Net 7, 14, or 30 terms, or a custom due date. You can also add a deposit amount or milestone payments for larger projects.' },
              { q:'Do I need accounting software?', a:'No. KraaFo handles invoicing without accounting knowledge. Create a professional invoice, download or send, and get paid. No setup, no subscriptions.' },
            ].map(({ q, a }, i) => (
              <details key={q}
                className={`group rounded-2xl border border-slate-100 px-6 py-4 cursor-pointer bg-slate-50 hover:border-purple-200 hover:bg-white transition-all ${faq.on ? 'animate-fade-up' : 'opacity-0'}`}
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
          style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 50%,rgba(139,92,246,0.2) 0%,transparent 70%)' }} />
<div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-black tracking-tight mb-3 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg,white 0%,#f0abfc 100%)' }}>
            Send your first freelance invoice
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">Professional, branded invoice in under 60 seconds. Free, no credit card needed.</p>
          <Link to="/generator"
            className="inline-flex items-center gap-2.5 text-white bg-indigo-600 hover:bg-indigo-700 px-10 py-4 rounded-xl font-bold text-base transition-colors">
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
            <Link to="/invoice-generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Invoice Generator</Link>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <Link to="/quote-generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Quote Generator</Link>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <Link to="/generator" className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Start Free</Link>
          </div>
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} KraaFo</p>
        </div>
      </footer>

    </div>
  );
}
