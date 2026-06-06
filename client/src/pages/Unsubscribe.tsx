import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { LogoMark } from '../components/Logo';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>('loading');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.subscribers.unsubscribe(token)
      .then(r => { setEmail(r.email); setStatus(r.already ? 'already' : 'success'); })
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
        <LogoMark size={56} className="mx-auto mb-6" />

        {status === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Processing your request…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-black text-slate-900 mb-2">Unsubscribed</h1>
            <p className="text-slate-500 text-sm mb-6">
              <span className="font-semibold text-slate-700">{email}</span> has been removed from KraaFo updates. You won't hear from us again.
            </p>
            <Link to="/" className="text-sm text-indigo-600 font-bold hover:text-indigo-800 transition-colors">← Back to KraaFo</Link>
          </>
        )}

        {status === 'already' && (
          <>
            <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h1 className="text-xl font-black text-slate-900 mb-2">Already unsubscribed</h1>
            <p className="text-slate-500 text-sm mb-6"><span className="font-semibold text-slate-700">{email}</span> was already removed from our list.</p>
            <Link to="/" className="text-sm text-indigo-600 font-bold hover:text-indigo-800 transition-colors">← Back to KraaFo</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-black text-slate-900 mb-2">Invalid link</h1>
            <p className="text-slate-500 text-sm mb-6">This unsubscribe link is invalid or has expired. Contact us if you need help.</p>
            <Link to="/" className="text-sm text-indigo-600 font-bold hover:text-indigo-800 transition-colors">← Back to KraaFo</Link>
          </>
        )}
      </div>
    </div>
  );
}
