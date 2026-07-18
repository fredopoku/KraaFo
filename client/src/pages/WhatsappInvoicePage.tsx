import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, MessageSquare, Zap, Globe } from 'lucide-react';
import { Logo } from '../components/Logo';

const PORTRAITS = [
  { src: '/phase3/portrait-accra.jpg',      name: 'Abena K.',  city: 'Accra, Ghana',        role: 'Cleaning services' },
  { src: '/phase3/portrait-lagos.jpg',      name: 'Chidi O.',  city: 'Lagos, Nigeria',       role: 'Tailoring' },
  { src: '/phase3/portrait-manchester.jpg', name: 'Tom H.',    city: 'Manchester, UK',       role: 'Plumbing' },
  { src: '/phase3/portrait-saopaulo.jpg',   name: 'Ana M.',    city: 'São Paulo, Brazil',    role: 'Food & catering' },
];

const faqs = [
  {
    q: 'How do I send an invoice on WhatsApp?',
    a: 'Create your invoice in KraaFo, then tap "Send via WhatsApp". WhatsApp opens on your phone with the invoice message pre-filled, including a link your client can tap to view and download the PDF. You just confirm and press Send.',
  },
  {
    q: 'Does my client need WhatsApp to receive the invoice?',
    a: "Yes, your client needs WhatsApp to receive the message. If they don't use WhatsApp, KraaFo also sends by SMS (works on any phone, no app needed) and email, all from the same screen.",
  },
  {
    q: 'Is the WhatsApp invoice free to send?',
    a: 'Yes. Creating and sending invoices by WhatsApp is free. Sign up free, no credit card needed.',
  },
  {
    q: 'Can I send a receipt by WhatsApp too?',
    a: 'Yes. KraaFo generates professional "PAYMENT RECEIVED" receipts that you can send the same way: WhatsApp, SMS, or email.',
  },
];

export default function WhatsappInvoicePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/"><Logo size="lg" /></Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">Sign in</Link>
            <Link to="/setup" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/40 to-indigo-50/30 pt-16 pb-20 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #d1fae5 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.5 }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
                <MessageSquare className="w-3.5 h-3.5" /> Free · No account needed to download
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.08] mb-5">
                WhatsApp Invoice Generator: Send Invoices Directly on WhatsApp
              </h1>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Create a professional invoice in under 60 seconds and send it straight to your client on WhatsApp, SMS, or email. All three at once, or just the one they use. Your client taps a link to view and download the PDF. No back-and-forth.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-7">
                <Link to="/generator" className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-200">
                  Create your first invoice, free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/setup" className="inline-flex items-center justify-center gap-2 text-slate-600 px-8 py-3.5 rounded-xl font-bold text-base border border-slate-200 bg-white/80 hover:bg-white hover:border-slate-300 transition-all">
                  Sign up free
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {['Works in 30+ countries', 'No credit card needed', 'SMS + email too'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: WhatsApp phone mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-6 bg-emerald-100/60 rounded-3xl blur-2xl" />
                <div className="relative w-64 bg-white rounded-3xl shadow-2xl shadow-slate-200 border-4 border-slate-800 overflow-hidden">
                  {/* Phone status bar */}
                  <div className="bg-slate-800 px-4 pt-2 pb-1 flex justify-between items-center">
                    <span className="text-white text-[10px] font-bold">9:41</span>
                    <div className="flex gap-1 items-center">
                      <div className="w-3.5 h-2 rounded-sm border border-white/60 relative"><div className="absolute inset-[1px] right-1 bg-white/80 rounded-sm" /></div>
                    </div>
                  </div>
                  {/* WhatsApp header */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: '#075E54' }}>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">K</div>
                    <div>
                      <div className="text-white text-xs font-semibold">Your Business</div>
                      <div className="text-green-200 text-[10px]">online</div>
                    </div>
                  </div>
                  {/* Chat area */}
                  <div className="px-3 py-3 space-y-2" style={{ background: '#e5ddd5', minHeight: '220px' }}>
                    <div className="rounded-xl rounded-tl-sm px-3 py-2.5 shadow-sm" style={{ background: '#fff', maxWidth: '92%' }}>
                      <p className="text-[11px] text-slate-800 leading-relaxed">
                        Hi Kofi,<br /><br />
                        Please find your invoice from <strong>Your Business</strong>.<br /><br />
                        <strong>Invoice:</strong> INV-0042<br />
                        <strong>Total:</strong> GHS 850.00<br />
                        <strong>Due:</strong> 25 Jul 2026<br /><br />
                        <span className="text-blue-500 underline">View &amp; download: kraafo.com/view/…</span>
                      </p>
                      <div className="text-right text-[9px] text-slate-400 mt-1">9:41 AM ✓✓</div>
                    </div>
                  </div>
                  {/* Message input bar */}
                  <div className="px-2 py-2 flex items-center gap-2 bg-slate-100 border-t border-slate-200">
                    <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-slate-400">Message</div>
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-3 right-2 bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Delivered
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-6 px-6 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Used by small businesses in 30+ countries</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {PORTRAITS.map(({ src, name, city, role }) => (
              <div key={name} className="flex items-center gap-2.5">
                <img src={src} alt={`${name}, ${role}, uses KraaFo`} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" loading="lazy" />
                <div>
                  <div className="text-xs font-bold text-slate-700">{name}</div>
                  <div className="text-[10px] text-slate-400">{city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">How it works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From blank to WhatsApp in under 60 seconds.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Create your invoice',
                desc: 'Fill in your client name, services, and price. Smart Fill pre-populates line items for your trade. Logo upload extracts your brand colors automatically.',
              },
              {
                step: '2',
                title: 'Preview and confirm',
                desc: 'See the branded PDF update in real time as you type. Adjust rates, add a discount, toggle tax, all in one screen.',
              },
              {
                step: '3',
                title: 'Send on WhatsApp',
                desc: 'Tap "Send via WhatsApp". WhatsApp opens pre-filled with your invoice message and PDF link. Your client sees it immediately.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-black flex items-center justify-center shrink-0 mt-0.5">{step}</div>
                <div>
                  <div className="font-bold text-slate-800 mb-1">{title}</div>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Why WhatsApp?</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Your client already lives on WhatsApp</h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                Email gets ignored. WhatsApp messages get opened. When you send an invoice by WhatsApp, your client sees it the moment it arrives. They tap the link, view the PDF, and can pay, all without leaving WhatsApp.
              </p>
              <ul className="space-y-3">
                {[
                  'WhatsApp message opens pre-filled. You confirm and send.',
                  'Client gets a direct link to view and download the branded PDF',
                  'Send SMS and email at the same time if you want',
                  'Works in any country: GHS, NGN, USD, GBP, EUR and more',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">What your client receives</div>
              <div className="rounded-xl overflow-hidden border border-slate-100" style={{ background: '#e5ddd5' }}>
                <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: '#075E54' }}>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">K</div>
                  <div>
                    <div className="text-white text-xs font-semibold">Your Business</div>
                    <div className="text-green-200 text-[10px]">WhatsApp message</div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="rounded-xl rounded-tl-sm px-3 py-2.5 shadow-sm max-w-[90%]" style={{ background: '#fff' }}>
                    <p className="text-[11px] text-slate-800 leading-relaxed">
                      Hi Kofi,<br /><br />
                      Please find your invoice from <strong>Your Business</strong>.<br /><br />
                      <strong>Invoice:</strong> INV-0042<br />
                      <strong>Total:</strong> GHS 850.00<br />
                      <strong>Due:</strong> 25 Jul 2026<br /><br />
                      <span className="text-blue-500 underline">View &amp; download: kraafo.com/view/…</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Works everywhere your clients are</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { Icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50', title: 'WhatsApp', desc: 'Opens pre-filled. Client taps a link to view and download the PDF.' },
              { Icon: Zap, color: 'text-sky-600 bg-sky-50', title: 'SMS', desc: 'Works on any phone, no app. Reaches clients without smartphones.' },
              { Icon: Globe, color: 'text-indigo-600 bg-indigo-50', title: 'Email', desc: 'Sends automatically with the PDF attached. Arrives in seconds.' },
            ].map(({ Icon, color, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-50">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map(({ q, a }) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            }),
          }}
        />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
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

      <section className="py-16 px-6 text-center bg-white">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Ready to send your first WhatsApp invoice?</h2>
          <p className="text-slate-500 mb-6">Free to create and download. Sign up free to send.</p>
          <Link to="/generator" className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-200">
            Create your first invoice, free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/"><Logo size="lg" /></Link>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link to="/" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">Home</Link>
              <span className="text-slate-200 hidden sm:inline">·</span>
              <Link to="/invoice-generator" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">Invoice Generator</Link>
              <span className="text-slate-200 hidden sm:inline">·</span>
              <Link to="/receipt-generator" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">Receipt Maker</Link>
              <span className="text-slate-200 hidden sm:inline">·</span>
              <Link to="/quote-generator" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">Quote Generator</Link>
            </div>
            <p className="text-xs text-slate-300 font-medium">© {new Date().getFullYear()} KraaFo</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
