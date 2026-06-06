import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import { Logo } from '../components/Logo';
import { api } from '../utils/api';
import { cn } from '../utils/cn';

const TAG_STYLE: Record<string, string> = {
  New:      'bg-indigo-100 text-indigo-700',
  Improved: 'bg-amber-100  text-amber-700',
  Fixed:    'bg-emerald-100 text-emerald-700',
};

const TAG_DOT: Record<string, string> = {
  New:      'bg-indigo-500',
  Improved: 'bg-amber-500',
  Fixed:    'bg-emerald-500',
};

export default function Changelog() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.changelog.list()
      .then(d => { setEntries(d.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-40">
        <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
          <Logo size="sm" />
        </button>
        <button
          onClick={() => navigate('/generator')}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
        >
          Open App <span className="text-slate-400">→</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Product Updates</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">What's New in KraaFo</h1>
          <p className="text-slate-500">Every update, improvement, and fix — newest first.</p>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse pl-6 border-l-2 border-slate-100">
                <div className="h-4 bg-slate-100 rounded w-24 mb-2" />
                <div className="h-5 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mt-1" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-24">
            <Zap className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Updates coming soon — we're actively building.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {entries.map((e) => (
              <div key={e.id} className="relative pl-7 border-l-2 border-slate-100">
                <div className={cn('absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white', TAG_DOT[e.tag] || 'bg-indigo-500')} />
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full', TAG_STYLE[e.tag] || 'bg-slate-100 text-slate-600')}>
                    {e.tag}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(e.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <h2 className="text-base font-black text-slate-900 mb-1.5">{e.title}</h2>
                <p className="text-sm text-slate-500 leading-relaxed">{e.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400 mt-16">
        <button onClick={() => navigate('/')} className="hover:text-indigo-600 transition-colors font-semibold">KraaFo</button>
        {' · '}Built for service professionals worldwide
      </footer>
    </div>
  );
}
