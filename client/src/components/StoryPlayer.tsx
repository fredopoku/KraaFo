import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CAPTIONS = [
  'Friday. Job done. Now the hard part — the paperwork.',
  'Or… 60 seconds in KraaFo.',
  'One tap. All channels — or just the one your client uses.',
  'Delivered. No "did you get my invoice?"',
  'Paid. That\'s the whole story.',
];

const FRAME_MS = 5000;
const TICK_MS = 50;

/* ── Frame 3: Send modal — rendered from real UI ─────────── */
function SendModalFrame() {
  return (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(160deg,#f1f5f9 0%,#e2e8f0 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800">Send Invoice</h3>
          <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-base leading-none">✕</div>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Email address</div>
            <div className="border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700">abena.mensah@example.com</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Phone — WhatsApp &amp; SMS</div>
            <div className="border-2 border-violet-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]">+233 55 794 4637</div>
          </div>
          <div className="flex gap-1.5">
            {['Email ready', 'WhatsApp ready', 'SMS ready'].map(s => (
              <div key={s} className="flex items-center gap-1 flex-1 px-1.5 py-1.5 rounded-lg min-w-0 bg-emerald-50">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[9px] font-semibold text-emerald-700 truncate">{s}</span>
              </div>
            ))}
          </div>
          {/* Primary CTA — gradient matches real UI */}
          <div className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            Send via All Channels
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[9px] text-slate-400 font-medium shrink-0">or send individually</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold text-indigo-600 bg-indigo-50">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              Email
            </div>
            <div className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold text-emerald-600 bg-emerald-50">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              WhatsApp
            </div>
            <div className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold text-sky-600 bg-sky-50">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              SMS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Frame 4: WhatsApp chat — verbatim server message format ─ */
function WhatsAppChatFrame() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#e5ddd5' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 shrink-0" style={{ background: '#075E54' }}>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">A</div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-semibold">Abena Mensah</div>
          <div className="text-green-200 text-[10px]">online</div>
        </div>
        <div className="text-white/50 text-[10px] shrink-0">9:42</div>
      </div>
      {/* Date stamp */}
      <div className="flex justify-center my-3 shrink-0">
        <span className="bg-white/70 text-slate-500 text-[10px] font-medium px-3 py-0.5 rounded-full">Today</span>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end px-3 pb-2 space-y-2">
        {/* Outgoing — matches server verbatim */}
        <div className="flex justify-end">
          <div className="rounded-xl rounded-tr-sm px-3 py-2.5 max-w-[90%] shadow-sm" style={{ background: '#d9fdd3' }}>
            <div className="text-[10.5px] text-slate-800 leading-[1.6]">
              Hi Abena,<br/><br/>
              Please find your invoice from{' '}
              <strong>Sparkle &amp; Shine Cleaning Services</strong>.<br/><br/>
              <strong>Invoice:</strong> INV-0089<br/>
              <strong>Total:</strong> GHS 250.00<br/>
              <strong>Due:</strong> 15 Jul 2026<br/><br/>
              <span className="text-blue-500 underline underline-offset-1">View &amp; download: kraafo.com/view/…</span><br/><br/>
              Thank you for your business,<br/>
              <strong>Sparkle &amp; Shine Cleaning Services</strong><br/><br/>
              <em className="text-slate-400 text-[9px]">Sent with KraaFo (kraafo.com?ref=msg)</em>
            </div>
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <span className="text-[8.5px] text-slate-400">9:42</span>
              {/* Double blue ticks — delivered */}
              <span className="font-bold leading-none" style={{ color: '#53bdeb', fontSize: 13 }}>✓✓</span>
            </div>
          </div>
        </div>
        {/* Incoming reply */}
        <div className="flex justify-start">
          <div className="rounded-xl rounded-tl-sm px-3 py-2.5 bg-white shadow-sm max-w-[55%]">
            <div className="text-[10.5px] text-slate-800">Got it! Paying now 💸</div>
            <div className="text-right mt-0.5">
              <span className="text-[8.5px] text-slate-400">9:44</span>
            </div>
          </div>
        </div>
      </div>
      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ background: 'rgba(0,0,0,0.06)' }}>
        <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[10px] text-slate-400">Message</div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#25D366' }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="white">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

type Frame =
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'node'; content: JSX.Element };

const FRAMES: Frame[] = [
  { kind: 'image', src: '/phase3/story-1.jpg',       alt: 'A cleaning business owner looks frustrated at a pile of handwritten receipts beside her van' },
  { kind: 'image', src: '/phase3/story-2.jpg',       alt: 'The same cleaning business owner types a new invoice into KraaFo on her phone' },
  { kind: 'node',  content: <SendModalFrame /> },
  { kind: 'node',  content: <WhatsAppChatFrame /> },
  { kind: 'image', src: '/phase3/portrait-accra.jpg', alt: 'A cleaning business owner smiles at a payment received notification on her phone' },
];

export default function StoryPlayer() {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const tapStartRef = useRef(0);
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  /* IntersectionObserver — start auto-advance when section is visible */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Auto-advance timer */
  useEffect(() => {
    if (done || paused || !inView || reducedMotion.current) return;
    const t0 = Date.now();
    const tick = setInterval(() => setProgress(Math.min(((Date.now() - t0) / FRAME_MS) * 100, 100)), TICK_MS);
    const adv = setTimeout(() => {
      clearInterval(tick);
      if (current >= FRAMES.length - 1) { setProgress(100); setDone(true); }
      else { setCurrent(c => c + 1); setProgress(0); }
    }, FRAME_MS);
    return () => { clearInterval(tick); clearTimeout(adv); };
  }, [current, paused, inView, done]);

  const goTo = useCallback((i: number) => {
    if (i < 0) return;
    if (i >= FRAMES.length) { setDone(true); return; }
    setDone(false); setCurrent(i); setProgress(0);
  }, []);

  const goNext = useCallback(() => {
    if (current >= FRAMES.length - 1) setDone(true);
    else { setDone(false); setCurrent(c => c + 1); setProgress(0); }
  }, [current]);

  const goPrev = useCallback(() => {
    setDone(false); setCurrent(c => Math.max(0, c - 1)); setProgress(0);
  }, []);

  /* Keyboard */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [goNext, goPrev]);

  /* Touch: hold-to-pause + tap-to-navigate */
  const handleTouchStart = () => { tapStartRef.current = Date.now(); setPaused(true); };
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const held = Date.now() - tapStartRef.current;
    setPaused(false);
    if (held < 250) {
      const t = e.changedTouches[0];
      const { left, width } = e.currentTarget.getBoundingClientRect();
      if (t.clientX - left < width / 3) goPrev(); else goNext();
    }
  };

  /* Mouse: hover-to-pause + click-to-navigate */
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    if (e.clientX - left < width / 3) goPrev(); else goNext();
  };

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">30-second story</p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Watch a business get paid
          </h2>
          <p className="text-slate-500 leading-relaxed">
            From scribbled receipts to money in. This is the whole journey.
          </p>
        </div>

        {/* Screenreader text summary */}
        <p className="sr-only">
          A 5-frame visual story: a cleaning business owner frustrated with handwritten receipts,
          then creating an invoice in KraaFo in 60 seconds, sending it via all channels at once,
          the client receiving it on WhatsApp with double blue ticks, and the final payment received moment.
        </p>

        <div ref={sectionRef} className="flex flex-col items-center">
          {/* Phone frame */}
          <div
            className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-300/60 cursor-pointer select-none"
            style={{ width: 'min(340px, 88vw)', aspectRatio: '9/16', maxHeight: '70vh' }}
            role="region"
            aria-label={`Story player, frame ${current + 1} of ${FRAMES.length}`}
            tabIndex={0}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onClick={handleClick}
          >
            {/* All frames stacked — DOM order = z order */}
            {FRAMES.map((frame, i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={{
                  opacity: i === current ? 1 : 0,
                  transition: 'opacity 0.4s ease-in-out',
                  zIndex: i === current ? 2 : 1,
                }}
                aria-hidden={i !== current}
              >
                {frame.kind === 'image' ? (
                  <img
                    src={frame.src}
                    alt={frame.alt}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center top' }}
                    loading="lazy"
                  />
                ) : (
                  frame.content
                )}
              </div>
            ))}

            {/* Progress bars */}
            <div className="absolute top-3 inset-x-3 flex gap-1 z-20 pointer-events-none">
              {FRAMES.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-0.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.35)' }}
                >
                  <div
                    className="h-full bg-white rounded-full"
                    style={{
                      width: i < current || (done && i <= current)
                        ? '100%'
                        : i === current
                        ? (reducedMotion.current ? '100%' : `${progress}%`)
                        : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Caption */}
            {!done && (
              <div
                className="absolute bottom-0 inset-x-0 z-20 px-4 pt-12 pb-5 pointer-events-none"
                style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 100%)' }}
              >
                <p className="text-white text-sm font-semibold leading-snug drop-shadow-sm">
                  {CAPTIONS[current]}
                </p>
              </div>
            )}

            {/* End-state overlay — the conversion moment */}
            {done && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/65 backdrop-blur-sm p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mb-5 mx-auto">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-white text-xl font-black mb-2 leading-tight">Your story next?</h3>
                <p className="text-white/70 text-sm mb-6 leading-relaxed">Less than 2 minutes to set up.<br/>No credit card needed.</p>
                <Link
                  to="/setup"
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all btn-glow shadow-xl"
                >
                  Create your first invoice — free <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={e => { e.stopPropagation(); goTo(0); }}
                  className="mt-3 text-white/50 hover:text-white/80 text-xs font-medium transition-colors"
                >
                  Watch again
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Tap to advance · Hold to pause
            <span className="hidden [@media(pointer:fine)]:inline"> · ← → keys</span>
          </p>
        </div>
      </div>
    </section>
  );
}
