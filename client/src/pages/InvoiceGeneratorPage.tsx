import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, Zap, MessageSquare } from 'lucide-react';
import { Logo } from '../components/Logo';

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

      <section className="bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/30 pt-16 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" /> Free · No account needed to download
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.08] mb-5">
            Free Invoice Generator: Branded PDF Invoices in 60 Seconds
          </h1>
          <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto">
            No design skills needed. Fill in your client details and services. KraaFo builds a professional, branded invoice in under a minute. Download the PDF free, or sign up free to send it by WhatsApp, SMS, or email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/generator" className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-200">
              Create your first invoice, free <ArrowRight className="w-4 h-4" />
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Everything your invoice needs, nothing it doesn't</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Professional invoices in under 60 seconds, from blank to branded PDF.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: Zap,
                title: 'Smart Fill for any industry',
                desc: 'Pick your trade and KraaFo pre-fills line items, pricing, and terms. Review, adjust, done. Works for cleaning, construction, creative services, and 12+ more industries.',
              },
              {
                Icon: FileText,
                title: 'Branded PDF every time',
                desc: 'Upload your logo once and KraaFo automatically extracts your brand colors. Every invoice carries your brand: itemized breakdown, due date, tax, and discounts included.',
              },
              {
                Icon: MessageSquare,
                title: 'Send via WhatsApp, SMS or email',
                desc: 'Broadcast to all three channels at once, or pick just the one your client uses. WhatsApp and SMS open pre-filled for your confirmation; email delivers automatically with the PDF attached.',
              },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-600" />
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

      <section className="py-16 px-6 text-center bg-white">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Ready to send your first invoice?</h2>
          <p className="text-slate-500 mb-7 leading-relaxed">Under 60 seconds to your first professional invoice. Free, no credit card needed.</p>
          <Link to="/generator" className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-xl font-bold text-base transition-all shadow-2xl shadow-indigo-200">
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
