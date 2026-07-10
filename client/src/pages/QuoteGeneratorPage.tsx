import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, Zap, MessageSquare, Receipt } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function QuoteGeneratorPage() {
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

      <section className="bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/20 pt-16 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-600 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" /> Free · No account needed to download
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.08] mb-5">
            Free Quote Generator — Professional Quotes That Win Jobs
          </h1>
          <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto">
            Send a professional quote that stands out. When the client says yes, convert it to an invoice in one tap — no re-entering data. Record payment and send a receipt. The complete job lifecycle, in one tool.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/generator" className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-200">
              Create your first quote — free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/setup" className="inline-flex items-center justify-center gap-2 text-slate-600 px-8 py-3.5 rounded-xl font-bold text-base border border-slate-200 bg-white/80 hover:bg-white hover:border-slate-300 transition-all">
              Sign up to save &amp; send
            </Link>
          </div>
        </div>
      </section>

      {/* Lifecycle story — the core differentiator for this page */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-3">The complete job lifecycle</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Quote → Invoice → Receipt — no re-entering data</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Most tools make you start from scratch at each stage. KraaFo connects the whole job.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: FileText,
                step: '01',
                title: 'Send a professional quote',
                desc: 'Smart Fill pre-populates services and pricing for your industry. Your client receives a branded PDF quote by WhatsApp, SMS, or email — not a screenshot of a spreadsheet.',
              },
              {
                Icon: Zap,
                step: '02',
                title: 'Convert to invoice in one tap',
                desc: "Client says yes? Tap 'Convert to Invoice' — KraaFo copies every line item, service, and price across. No re-entering data. The quote is marked as accepted; the invoice is ready to send.",
              },
              {
                Icon: Receipt,
                step: '03',
                title: 'Record payment, send a receipt',
                desc: "Record the payment and KraaFo generates a branded 'PAYMENT RECEIVED' receipt. The client has proof the job is done and the money changed hands.",
              },
            ].map(({ Icon, step, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all relative">
                <div className="text-xs font-black text-violet-400 tracking-widest mb-3">{step}</div>
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-violet-600" />
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
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Why quotes matter</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">A quote that looks like a contract wins the job</h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                Clients compare quotes. A professional branded PDF with itemized services, clear pricing, and your logo reads as serious. A WhatsApp message with numbers does not. KraaFo makes you look like the obvious choice.
              </p>
              <ul className="space-y-3">
                {[
                  'Branded PDF with your logo and colors',
                  'Smart Fill pre-populates for your industry',
                  'Convert to invoice in one tap when accepted',
                  'Send by WhatsApp, SMS, or email',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Send the way your client exists</p>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
                  <div className="text-indigo-600 font-black text-sm mb-1">Send via all channels</div>
                  <p className="text-slate-500 text-xs leading-relaxed">One tap opens WhatsApp and SMS pre-filled for your confirmation, and fires the email automatically — all three channels at once.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="text-slate-700 font-black text-sm mb-1">or send individually</div>
                  <p className="text-slate-500 text-xs leading-relaxed">Pick exactly one channel — the corporate client who wants email only, or the WhatsApp-native who ignores email. SMS reaches clients without smartphones or mobile data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-50">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'Can I convert a quote to an invoice?', acceptedAnswer: { '@type': 'Answer', text: "Yes. When a client accepts your quote, tap 'Convert to Invoice' in KraaFo — every line item, service, and price copies across automatically. No re-entering data. The quote is marked as accepted and a new invoice is ready to send." } },
            { '@type': 'Question', name: "What's the difference between a quote and an invoice?", acceptedAnswer: { '@type': 'Answer', text: 'A quote is sent before the job to agree on price and scope. An invoice is sent after the job (or as a payment request) with the amount due. KraaFo handles both and connects them — so you never re-enter the same data.' } },
            { '@type': 'Question', name: 'How do I send a quote to a client?', acceptedAnswer: { '@type': 'Answer', text: 'Create your quote in KraaFo, then tap Send. Choose "Send via all channels" to open WhatsApp and SMS pre-filled and fire the email automatically — or pick a single channel. Your client receives a professional PDF quote.' } },
            { '@type': 'Question', name: 'Can I create a receipt after the client pays?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Once the invoice is paid, record the payment in KraaFo and it generates a branded "PAYMENT RECEIVED" receipt. The full lifecycle — quote, invoice, receipt — happens in one tool.' } },
          ],
        }) }} />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Can I convert a quote to an invoice?', a: "Yes. When a client accepts your quote, tap 'Convert to Invoice' in KraaFo — every line item, service, and price copies across automatically. No re-entering data. The quote is marked as accepted and a new invoice is ready to send." },
              { q: "What's the difference between a quote and an invoice?", a: 'A quote is sent before the job to agree on price and scope. An invoice is sent after the job (or as a payment request) with the amount due. KraaFo handles both and connects them — so you never re-enter the same data.' },
              { q: 'How do I send a quote to a client?', a: 'Create your quote in KraaFo, then tap Send. Choose "Send via all channels" to open WhatsApp and SMS pre-filled and fire the email automatically — or pick a single channel. Your client receives a professional PDF quote.' },
              { q: 'Can I create a receipt after the client pays?', a: 'Yes. Once the invoice is paid, record the payment in KraaFo and it generates a branded "PAYMENT RECEIVED" receipt. The full lifecycle — quote, invoice, receipt — happens in one tool.' },
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Win the job. Send the invoice. Close with a receipt.</h2>
          <p className="text-slate-500 mb-7 leading-relaxed">The whole job lifecycle in one tool. Free, no credit card needed.</p>
          <Link to="/generator" className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-xl font-bold text-base transition-all shadow-2xl shadow-indigo-200">
            Create your first quote — free <ArrowRight className="w-4 h-4" />
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
              <Link to="/generator" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors font-medium">Quote Tool</Link>
            </div>
            <p className="text-xs text-slate-300 font-medium">© {new Date().getFullYear()} KraaFo</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
