import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Receipt, Zap, MessageSquare } from 'lucide-react';
import { Logo } from '../components/Logo';

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

      <section className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 pt-16 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" /> Free · No account needed to download
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.08] mb-5">
            Free Receipt Maker — Instant Payment Receipts
          </h1>
          <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto">
            The moment a client pays, generate a professional "PAYMENT RECEIVED" receipt in seconds. No templates, no re-entering data. Download free as a branded PDF, or send it by WhatsApp, SMS, or email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/generator" className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-200">
              Create your first receipt — free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/setup" className="inline-flex items-center justify-center gap-2 text-slate-600 px-8 py-3.5 rounded-xl font-bold text-base border border-slate-200 bg-white/80 hover:bg-white hover:border-slate-300 transition-all">
              Sign up to save &amp; send
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">A receipt your client actually trusts</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Professional proof of payment — delivered instantly, branded with your business.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: Receipt,
                title: 'PAYMENT RECEIVED stamp',
                desc: 'KraaFo receipts carry a bold "PAYMENT RECEIVED" header so there is no ambiguity — the job is done, the money is in.',
              },
              {
                Icon: Zap,
                title: 'No re-entering data',
                desc: 'Record a payment against an existing invoice and the receipt pulls everything across — client name, services, total, dates — in one tap.',
              },
              {
                Icon: MessageSquare,
                title: 'Send in seconds',
                desc: 'Broadcast to WhatsApp, SMS, and email at once, or pick a single channel. SMS reaches clients without smartphones or mobile data.',
              },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-emerald-600" />
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
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Why receipts matter</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Close the loop on every job</h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                A receipt is proof the job is done and the money changed hands. Without one, disputed payments become "I never confirmed that" conversations. KraaFo sends one the moment you record payment — so both sides have a record.
              </p>
              <ul className="space-y-3">
                {[
                  'Branded PDF with your logo and colors',
                  '"PAYMENT RECEIVED" header — no ambiguity',
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
                { n: '1', t: 'Record the payment', d: 'Mark an invoice as paid in KraaFo — or create a standalone receipt directly from the Receipt tab.' },
                { n: '2', t: 'Review the receipt', d: 'KraaFo generates a professional branded PDF. Preview it before sending — or download immediately.' },
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

      <section className="py-16 px-6 bg-slate-50">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: "What's the difference between an invoice and a receipt?", acceptedAnswer: { '@type': 'Answer', text: 'An invoice is a payment request sent before the client pays. A receipt is proof of payment sent after the client pays. KraaFo handles both — in the same tool, with the same branding.' } },
            { '@type': 'Question', name: 'Can I create a receipt without an invoice?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Use the Receipt tab in KraaFo to create a standalone "PAYMENT RECEIVED" receipt at any time — no invoice required.' } },
            { '@type': 'Question', name: 'Can I send receipts by WhatsApp or SMS?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. KraaFo can broadcast receipts to WhatsApp, SMS, and email all at once, or you can pick a single channel. SMS reaches clients without smartphones or mobile data.' } },
            { '@type': 'Question', name: 'Is the receipt PDF professional-looking?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. KraaFo receipts use your logo and brand colors automatically, include a "PAYMENT RECEIVED" header, and list the services paid — the same professional layout as your invoices.' } },
          ],
        }) }} />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "What's the difference between an invoice and a receipt?", a: 'An invoice is a payment request sent before the client pays. A receipt is proof of payment sent after the client pays. KraaFo handles both — in the same tool, with the same branding.' },
              { q: 'Can I create a receipt without an invoice?', a: 'Yes. Use the Receipt tab in KraaFo to create a standalone "PAYMENT RECEIVED" receipt at any time — no invoice required.' },
              { q: 'Can I send receipts by WhatsApp or SMS?', a: 'Yes. KraaFo can broadcast receipts to WhatsApp, SMS, and email all at once, or you can pick a single channel. SMS reaches clients without smartphones or mobile data.' },
              { q: 'Is the receipt PDF professional-looking?', a: 'Yes. KraaFo receipts use your logo and brand colors automatically, include a "PAYMENT RECEIVED" header, and list the services paid — the same professional layout as your invoices.' },
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

      <section className="py-16 px-6 text-center bg-white">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Close the loop on your next job.</h2>
          <p className="text-slate-500 mb-7 leading-relaxed">Create a professional receipt in seconds. Free, no credit card needed.</p>
          <Link to="/generator" className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-xl font-bold text-base transition-all shadow-2xl shadow-indigo-200">
            Create your first receipt — free <ArrowRight className="w-4 h-4" />
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
