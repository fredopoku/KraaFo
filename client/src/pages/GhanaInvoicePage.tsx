import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Globe, MessageSquare } from 'lucide-react';
import { Logo } from '../components/Logo';

const PORTRAITS = [
  { src: '/phase3/portrait-accra.jpg',      name: 'Abena K.',  city: 'Accra, Ghana',        role: 'Cleaning services' },
  { src: '/phase3/portrait-lagos.jpg',      name: 'Chidi O.',  city: 'Lagos, Nigeria',       role: 'Tailoring' },
  { src: '/phase3/portrait-manchester.jpg', name: 'Tom H.',    city: 'Manchester, UK',       role: 'Plumbing' },
  { src: '/phase3/portrait-saopaulo.jpg',   name: 'Ana M.',    city: 'São Paulo, Brazil',    role: 'Food & catering' },
];

const faqs = [
  {
    q: 'Can I create invoices in Ghana Cedis (GHS)?',
    a: 'Yes. KraaFo supports GHS and dozens of other currencies. Set your currency once during setup and every invoice, receipt, and quote uses it automatically.',
  },
  {
    q: 'Does KraaFo support MTN Mobile Money?',
    a: 'Yes. You can add MTN MoMo, Telecel Cash, Airtel Money, and bank transfer details to your invoices so clients know exactly how to pay.',
  },
  {
    q: 'Can I send invoices by WhatsApp in Ghana?',
    a: "Yes, this is one of KraaFo's most popular features in Ghana. WhatsApp is the primary messaging platform. KraaFo opens WhatsApp pre-filled with your invoice message and a link to the PDF.",
  },
  {
    q: 'Is KraaFo free for Ghanaian businesses?',
    a: 'Yes. Creating and downloading invoices as PDF is completely free, no account needed. Sign up free to save your history and send by WhatsApp, SMS, or email.',
  },
];

export default function GhanaInvoicePage() {
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
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/40 to-amber-50/20 pt-16 pb-20 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #e0e7ff 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.5 }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
                <Zap className="w-3.5 h-3.5" /> Free · GHS · MTN MoMo · WhatsApp delivery
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.08] mb-5">
                Free Invoice Generator for Ghana: GHS, MTN MoMo &amp; WhatsApp
              </h1>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Built for Ghanaian businesses. Create professional invoices in Ghana Cedis, include your MTN MoMo or bank details, and send directly to clients on WhatsApp, SMS, or email. No account needed to download. Free forever.
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
                {['GHS currency', 'MTN MoMo payment details', 'WhatsApp delivery'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: GHS invoice mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-6 bg-amber-100/50 rounded-3xl blur-2xl" />
                <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden w-80">
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-amber-400" />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">K</div>
                        <div>
                          <div className="font-black text-slate-800 text-sm">Kofi Mensah Services</div>
                          <div className="text-xs text-slate-400">Accra, Ghana</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INVOICE</div>
                        <div className="font-black text-indigo-600 text-sm">#INV-0031</div>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 mb-3">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Bill to</div>
                      <div className="font-bold text-slate-800 text-sm">Ama Darko</div>
                      <div className="text-xs text-slate-500">East Legon, Accra</div>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {[
                        ['Cleaning: 3-bedroom home', 'GHS 250'],
                        ['Window cleaning (inside + out)', 'GHS 80'],
                        ['Carpet steam clean', 'GHS 120'],
                      ].map(([d, a]) => (
                        <div key={d} className="flex justify-between text-xs py-1 border-b border-slate-50">
                          <span className="text-slate-600">{d}</span>
                          <span className="font-bold text-slate-800 tabular-nums">{a}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl bg-indigo-600 px-4 py-2.5 flex justify-between items-center mb-3">
                      <span className="text-white/80 text-xs font-bold">Total Due</span>
                      <span className="text-white font-black tabular-nums">GHS 450</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[10px] text-amber-700 font-bold">
                      MTN MoMo · 0244 XXX XXX
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

      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Built for how Ghanaians do business</h2>
            <p className="text-slate-500 max-w-xl mx-auto">WhatsApp for messaging. Mobile money for payments. Professional documents that reflect your brand.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: Globe,
                color: 'text-indigo-600 bg-indigo-50',
                title: 'Ghana Cedis (GHS)',
                desc: 'Full GHS support. Set your currency once and every invoice, receipt, and quote shows the right symbol and formatting.',
              },
              {
                Icon: Zap,
                color: 'text-amber-600 bg-amber-50',
                title: 'Mobile Money details',
                desc: 'Add your MTN MoMo, Telecel Cash, Airtel Money, or bank account to every invoice so clients know exactly how to pay.',
              },
              {
                Icon: MessageSquare,
                color: 'text-emerald-600 bg-emerald-50',
                title: 'WhatsApp delivery',
                desc: 'Send the invoice directly on WhatsApp with one tap. Client receives a message with a link to view and download the PDF.',
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

      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Works for any Ghanaian trade</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Smart Fill for Ghana's most common businesses</h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                KraaFo's Smart Fill knows the services, rates, and terms for Ghanaian trades. Pick your industry and KraaFo pre-fills your invoice. No templates, no guessing.
              </p>
              <ul className="space-y-3">
                {[
                  'Cleaning & housekeeping services',
                  'Construction & renovation',
                  'Graphic design & printing',
                  'Catering & event services',
                  'Electrical & plumbing',
                  'Salon & beauty services',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sample invoice</div>
              <div className="text-lg font-black text-slate-800">Kofi Mensah Services</div>
              <div className="space-y-2">
                {[
                  { label: 'Cleaning: 3 bedroom home', amount: 'GHS 250.00' },
                  { label: 'Window cleaning (inside & out)', amount: 'GHS 80.00' },
                  { label: 'Carpet steam clean', amount: 'GHS 120.00' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-bold text-slate-800 tabular-nums">{row.amount}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-1">
                  <span>Total</span>
                  <span className="tabular-nums">GHS 450.00</span>
                </div>
              </div>
              <div className="text-xs text-slate-400">Payment: MTN MoMo · 0244 XXX XXX</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
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
              <details key={q} className="group bg-slate-50 rounded-2xl border border-slate-100 px-5 py-4 cursor-pointer">
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

      <section className="py-16 px-6 text-center bg-slate-50">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Start invoicing in Ghana today</h2>
          <p className="text-slate-500 mb-6">Free to create and download. Sign up free to save and send.</p>
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
              <Link to="/whatsapp-invoice-generator" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">WhatsApp Invoicing</Link>
            </div>
            <p className="text-xs text-slate-300 font-medium">© {new Date().getFullYear()} KraaFo</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
