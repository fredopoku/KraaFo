import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Receipt, Zap, MessageSquare } from 'lucide-react';
import { Logo } from '../components/Logo';

const PORTRAITS = [
  { src: '/phase3/portrait-accra.jpg',      name: 'Abena K.',  city: 'Accra, Ghana',        role: 'Cleaning services' },
  { src: '/phase3/portrait-lagos.jpg',      name: 'Chidi O.',  city: 'Lagos, Nigeria',       role: 'Tailoring' },
  { src: '/phase3/portrait-manchester.jpg', name: 'Tom H.',    city: 'Manchester, UK',       role: 'Plumbing' },
  { src: '/phase3/portrait-saopaulo.jpg',   name: 'Ana M.',    city: 'São Paulo, Brazil',    role: 'Food & catering' },
];

export default function ReceiptGeneratorPage() {
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
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 pt-16 pb-20 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #d1fae5 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.5 }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
                <Zap className="w-3.5 h-3.5" /> Free · No account needed to download
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.08] mb-5">
                Free Receipt Maker: Instant Payment Receipts
              </h1>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                The moment a client pays, generate a professional "PAYMENT RECEIVED" receipt in seconds. No templates, no re-entering data. Download free as a branded PDF, or send it by WhatsApp, SMS, or email.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-7">
                <Link to="/generator" className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-emerald-200">
                  Create your first receipt, free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/setup" className="inline-flex items-center justify-center gap-2 text-slate-600 px-8 py-3.5 rounded-xl font-bold text-base border border-slate-200 bg-white/80 hover:bg-white hover:border-slate-300 transition-all">
                  Sign up to save &amp; send
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {['Works in 30+ countries', 'No credit card needed', 'Branded with your logo'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: receipt mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-6 bg-emerald-100/60 rounded-3xl blur-2xl" />
                <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden w-72">
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <div className="p-6">
                    {/* Header */}
                    <div className="text-center mb-5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm mx-auto mb-2">T</div>
                      <div className="font-black text-slate-800 text-sm">Tom's Plumbing Co.</div>
                      <div className="text-xs text-slate-400">Manchester, UK</div>
                    </div>
                    {/* PAYMENT RECEIVED stamp */}
                    <div className="border-2 border-emerald-500 rounded-xl p-3 text-center mb-4">
                      <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Payment Received</div>
                      <div className="font-black text-emerald-700 text-2xl tabular-nums">£485.00</div>
                    </div>
                    {/* Details */}
                    {[
                      { label: 'Receipt', value: 'REC-0021' },
                      { label: 'Invoice', value: 'INV-0047' },
                      { label: 'Client', value: 'Sarah Williams' },
                      { label: 'Date paid', value: '18 Jul 2026' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-xs py-1.5 border-b border-slate-50">
                        <span className="text-slate-400">{label}</span>
                        <span className="font-bold text-slate-800">{value}</span>
                      </div>
                    ))}
                    <div className="mt-3 text-center text-[10px] text-slate-400">Thank you for your business</div>
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
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

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">A receipt your client actually trusts</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Professional proof of payment, delivered instantly and branded with your business.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: Receipt,
                color: 'bg-emerald-50 text-emerald-600',
                title: 'PAYMENT RECEIVED stamp',
                desc: 'KraaFo receipts carry a bold "PAYMENT RECEIVED" header so there is no ambiguity: the job is done, the money is in.',
              },
              {
                Icon: Zap,
                color: 'bg-teal-50 text-teal-600',
                title: 'No re-entering data',
                desc: 'Record a payment against an existing invoice and the receipt pulls in everything automatically: client name, services, total, and dates.',
              },
              {
                Icon: MessageSquare,
                color: 'bg-indigo-50 text-indigo-600',
                title: 'Send in seconds',
                desc: 'Broadcast to WhatsApp, SMS, and email at once, or pick a single channel. SMS reaches clients without smartphones or mobile data.',
              },
            ].map(({ Icon, color, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all">
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

      {/* Why receipts matter */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Why receipts matter</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Close the loop on every job</h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                A receipt is proof the job is done and the money changed hands. Without one, disputed payments become "I never confirmed that" conversations. KraaFo sends one the moment you record payment, so both sides have a record.
              </p>
              <ul className="space-y-3">
                {[
                  'Branded PDF with your logo and colors',
                  '"PAYMENT RECEIVED" header, no ambiguity',
                  'Automatically pulls from your invoice data',
                  'Delivered by WhatsApp, SMS, or email',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              {[
                { n: '1', t: 'Record the payment', d: 'Mark an invoice as paid in KraaFo, or create a standalone receipt directly from the Receipt tab.' },
                { n: '2', t: 'Review the receipt', d: 'KraaFo generates a professional branded PDF. Preview it before sending, or download immediately.' },
                { n: '3', t: 'Send to your client', d: 'Tap "Send via all channels" for WhatsApp + SMS + email at once, or pick the channel your client prefers.' },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex gap-4 mb-5 last:mb-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center shrink-0">{n}</div>
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

      {/* FAQ */}
      <section className="py-16 px-6 bg-slate-50">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: "What's the difference between an invoice and a receipt?", acceptedAnswer: { '@type': 'Answer', text: 'An invoice is a payment request sent before the client pays. A receipt is proof of payment sent after the client pays. KraaFo handles both, in the same tool, with the same branding.' } },
            { '@type': 'Question', name: 'Can I create a receipt without an invoice?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Use the Receipt tab in KraaFo to create a standalone "PAYMENT RECEIVED" receipt at any time, no invoice required.' } },
            { '@type': 'Question', name: 'Can I send receipts by WhatsApp or SMS?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. KraaFo can broadcast receipts to WhatsApp, SMS, and email all at once, or you can pick a single channel. SMS reaches clients without smartphones or mobile data.' } },
            { '@type': 'Question', name: 'Is the receipt PDF professional-looking?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. KraaFo receipts use your logo and brand colors automatically, include a "PAYMENT RECEIVED" header, and list the services paid, using the same professional layout as your invoices.' } },
          ],
        }) }} />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "What's the difference between an invoice and a receipt?", a: 'An invoice is a payment request sent before the client pays. A receipt is proof of payment sent after the client pays. KraaFo handles both, in the same tool, with the same branding.' },
              { q: 'Can I create a receipt without an invoice?', a: 'Yes. Use the Receipt tab in KraaFo to create a standalone "PAYMENT RECEIVED" receipt at any time, no invoice required.' },
              { q: 'Can I send receipts by WhatsApp or SMS?', a: 'Yes. KraaFo can broadcast receipts to WhatsApp, SMS, and email all at once, or you can pick a single channel. SMS reaches clients without smartphones or mobile data.' },
              { q: 'Is the receipt PDF professional-looking?', a: 'Yes. KraaFo receipts use your logo and brand colors automatically, include a "PAYMENT RECEIVED" header, and list the services paid, using the same professional layout as your invoices.' },
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

      {/* Final CTA */}
      <section className="py-16 px-6 text-center bg-white">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Close the loop on your next job.</h2>
          <p className="text-slate-500 mb-7 leading-relaxed">Create a professional receipt in seconds. Free, no credit card needed.</p>
          <Link to="/generator" className="inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3.5 rounded-xl font-bold text-base transition-all shadow-2xl shadow-emerald-200">
            Create your first receipt, free <ArrowRight className="w-4 h-4" />
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
              <Link to="/quote-generator" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">Quote Generator</Link>
              <span className="text-slate-200 hidden sm:inline">·</span>
              <Link to="/generator" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">Receipt Tool</Link>
            </div>
            <p className="text-xs text-slate-300 font-medium">© {new Date().getFullYear()} KraaFo</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
