import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, Zap, MessageSquare } from 'lucide-react';
import { Logo } from '../components/Logo';

const PORTRAITS = [
  { src: '/phase3/portrait-accra.jpg',      name: 'Abena K.',  city: 'Accra, Ghana',        role: 'Cleaning services' },
  { src: '/phase3/portrait-lagos.jpg',      name: 'Chidi O.',  city: 'Lagos, Nigeria',       role: 'Tailoring' },
  { src: '/phase3/portrait-manchester.jpg', name: 'Tom H.',    city: 'Manchester, UK',       role: 'Plumbing' },
  { src: '/phase3/portrait-saopaulo.jpg',   name: 'Ana M.',    city: 'São Paulo, Brazil',    role: 'Food & catering' },
];

export default function InvoiceGeneratorPage() {
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
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/30 pt-16 pb-20 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.45 }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
                <Zap className="w-3.5 h-3.5" /> Free · No account needed to download
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.08] mb-5">
                Free Invoice Generator: Branded PDF Invoices in 60 Seconds
              </h1>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                No design skills needed. Fill in your client details and services. KraaFo builds a professional, branded invoice in under a minute. Download free, or sign up free to send by WhatsApp, SMS, or email.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-7">
                <Link to="/generator" className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-200">
                  Create your first invoice, free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/setup" className="inline-flex items-center justify-center gap-2 text-slate-600 px-8 py-3.5 rounded-xl font-bold text-base border border-slate-200 bg-white/80 hover:bg-white hover:border-slate-300 transition-all">
                  Sign up to save &amp; send
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {['Works in 30+ countries', 'No credit card needed', '12+ industries'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: invoice mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-6 bg-indigo-100/60 rounded-3xl blur-2xl" />
                <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden w-80">
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">B</div>
                        <div>
                          <div className="font-black text-slate-800 text-sm">Bright Edge Studio</div>
                          <div className="text-xs text-slate-400">Manchester, UK</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INVOICE</div>
                        <div className="font-black text-indigo-600 text-sm">#INV-0042</div>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 mb-3">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Bill to</div>
                      <div className="font-bold text-slate-800 text-sm">James Okonkwo</div>
                      <div className="text-xs text-slate-500">james@techco.io</div>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {[
                        ['Brand identity design', '£1,200'],
                        ['Social media templates ×10', '£400'],
                        ['Brand guidelines PDF', '£300'],
                      ].map(([d, a]) => (
                        <div key={d} className="flex justify-between text-xs py-1 border-b border-slate-50">
                          <span className="text-slate-600">{d}</span>
                          <span className="font-bold text-slate-800 tabular-nums">{a}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl bg-indigo-600 px-4 py-2.5 flex justify-between items-center mb-3">
                      <span className="text-white/80 text-xs font-bold">Total Due</span>
                      <span className="text-white font-black tabular-nums">£1,900</span>
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
                <div className="absolute -bottom-3 right-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Sent via WhatsApp
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

      {/* Features grid */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Everything your invoice needs, nothing it doesn't</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Professional invoices in under 60 seconds, from blank to branded PDF.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: Zap,
                color: 'bg-indigo-50 text-indigo-600',
                title: 'Smart Fill for any industry',
                desc: 'Pick your trade and KraaFo pre-fills line items, pricing, and terms. Review, adjust, done. Works for cleaning, construction, creative services, and 12+ more industries.',
              },
              {
                Icon: FileText,
                color: 'bg-violet-50 text-violet-600',
                title: 'Branded PDF every time',
                desc: 'Upload your logo once and KraaFo automatically extracts your brand colors. Every invoice carries your brand: itemized breakdown, due date, tax, and discounts included.',
              },
              {
                Icon: MessageSquare,
                color: 'bg-emerald-50 text-emerald-600',
                title: 'Send via WhatsApp, SMS or email',
                desc: 'Broadcast to all three channels at once, or pick just the one your client uses. WhatsApp and SMS open pre-filled; email delivers automatically with the PDF attached.',
              },
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

      {/* Steps + side visual */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Your invoice in 3 steps</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">From blank to paid in under a minute</h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                Most free invoice generators produce generic PDFs with watermarks. KraaFo produces a document that looks like it came from a company twice your size, because your brand is on the invoice, not ours.
              </p>
              <ul className="space-y-3">
                {[
                  'Auto-extracts brand colors from your logo',
                  'Professional layout with due dates, tax, and discounts',
                  'Send by WhatsApp, SMS, or email from the same screen',
                  'Multi-currency, works in any country',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              {[
                { n: '1', t: 'Fill in your client and services', d: "Smart Fill pre-populates line items for your industry. Edit what you need, skip what you don't." },
                { n: '2', t: 'Preview and adjust', d: 'Live preview updates as you type. Change rates, add items, toggle tax, all in real time.' },
                { n: '3', t: 'Download or send', d: 'Download free as PDF, no account needed. Sign up free to send by WhatsApp, SMS, or email and save your history.' },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex gap-4 mb-5 last:mb-0">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">{n}</div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm mb-0.5">{t}</div>
                    <div className="text-slate-500 text-xs leading-relaxed">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Send modes */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Send the way your client exists</h2>
          <p className="text-slate-500 max-w-xl mx-auto mb-10">
            Other invoicing apps send an email and hope for the best. KraaFo gives you two modes.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/40">
              <div className="text-indigo-600 font-black mb-2">Send via all channels</div>
              <p className="text-slate-600 text-sm leading-relaxed">
                One tap opens WhatsApp and SMS pre-filled for your confirmation, and fires the email automatically. Your client gets the same message three ways. They cannot claim they didn't receive it.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50">
              <div className="text-slate-700 font-black mb-2">or send individually</div>
              <p className="text-slate-600 text-sm leading-relaxed">
                The corporate client who wants email only. The client without a smartphone reachable by SMS. The WhatsApp-native who ignores email. Pick the one channel that fits. KraaFo delivers there.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-slate-50">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'Is it really free to create an invoice?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Creating and downloading invoices as PDF is completely free, no account needed. Sign up free to save your invoices and send them by WhatsApp, SMS, or email.' } },
            { '@type': 'Question', name: 'Do I need an account to download the PDF?', acceptedAnswer: { '@type': 'Answer', text: 'No. Fill in your invoice and download the PDF without signing up. A free account lets you save your history and send invoices directly to clients.' } },
            { '@type': 'Question', name: 'Can I send an invoice by WhatsApp?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. KraaFo opens WhatsApp with your invoice message pre-filled. You confirm and tap Send. Or use "Send via all channels" to trigger WhatsApp, SMS, and email in one action.' } },
            { '@type': 'Question', name: 'What information does an invoice need?', acceptedAnswer: { '@type': 'Answer', text: 'At minimum: your business name, client name, a list of services with prices, and a due date. KraaFo handles layout, numbering, tax calculations, and currency formatting automatically.' } },
          ],
        }) }} />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Is it really free to create an invoice?', a: 'Yes. Creating and downloading invoices as PDF is completely free, no account needed. Sign up free to save your invoices and send them by WhatsApp, SMS, or email.' },
              { q: 'Do I need an account to download the PDF?', a: 'No. Fill in your invoice and download the PDF without signing up. A free account lets you save your history and send invoices directly to clients.' },
              { q: 'Can I send an invoice by WhatsApp?', a: 'Yes. KraaFo opens WhatsApp with your invoice message pre-filled. You confirm and tap Send. Or use "Send via all channels" to trigger WhatsApp, SMS, and email in one action.' },
              { q: 'What information does an invoice need?', a: 'At minimum: your business name, client name, a list of services with prices, and a due date. KraaFo handles layout, numbering, tax calculations, and currency formatting automatically.' },
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

      {/* Final CTA with app preview */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Ready to send your first invoice?</h2>
              <p className="text-slate-500 mb-7 leading-relaxed">Under 60 seconds to your first professional invoice. Free, no credit card needed.</p>
              <Link to="/generator" className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-xl font-bold text-base transition-all shadow-2xl shadow-indigo-200">
                Create your first invoice, free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="hidden lg:block">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
                <div className="bg-slate-100 px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="ml-2 bg-white rounded px-3 py-0.5 text-[11px] text-slate-400 flex-1 text-center">app.kraafo.com/generator</div>
                </div>
                <img src="/hero-preview.png" alt="KraaFo invoice generator interface" className="w-full" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/"><Logo size="lg" /></Link>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link to="/" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">Home</Link>
              <span className="text-slate-200 hidden sm:inline">·</span>
              <Link to="/receipt-generator" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">Receipt Maker</Link>
              <span className="text-slate-200 hidden sm:inline">·</span>
              <Link to="/quote-generator" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">Quote Generator</Link>
              <span className="text-slate-200 hidden sm:inline">·</span>
              <Link to="/generator" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">Invoice Tool</Link>
            </div>
            <p className="text-xs text-slate-300 font-medium">© {new Date().getFullYear()} KraaFo</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
