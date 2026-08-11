import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { LogoMark } from '../components/Logo';
import { api } from '../utils/api';

type Status = 'checking' | 'success' | 'held' | 'error';

export default function EmailVerify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<Status>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('This verification link is missing its token.');
      return;
    }
    api.auth.verifyEmail(token)
      .then(res => setStatus(res.held ? 'held' : 'success'))
      .catch(err => {
        setStatus('error');
        setError((err as Error).message || 'This verification link is invalid or has expired.');
      });
  }, [token]);

  const content = {
    checking: {
      icon: <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />,
      title: 'Verifying your email...',
      body: 'Hang tight, this only takes a second.',
    },
    success: {
      icon: <CheckCircle2 className="w-10 h-10 text-emerald-500" />,
      title: 'Email verified!',
      body: 'Your account is now active. Sign in to start invoicing.',
    },
    held: {
      icon: <Clock className="w-10 h-10 text-amber-500" />,
      title: 'Email confirmed',
      body: "Thanks - your email is confirmed. Your account is still under a quick manual review, and we'll email you as soon as it's cleared.",
    },
    error: {
      icon: <XCircle className="w-10 h-10 text-red-500" />,
      title: 'Verification failed',
      body: error || 'This verification link is invalid or has expired.',
    },
  }[status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center">
        <div className="bg-indigo-600 px-8 py-6 flex flex-col items-center">
          <LogoMark size={52} />
          <h1 className="text-white text-xl font-black mt-3 tracking-tight">KraaFo</h1>
        </div>
        <div className="px-8 py-8 space-y-4">
          <div className="flex justify-center">{content.icon}</div>
          <h2 className="text-lg font-bold text-slate-900">{content.title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{content.body}</p>
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all mt-2"
          >
            {status === 'error' ? 'Go to sign in' : 'Continue to sign in'}
          </Link>
        </div>
      </div>
    </div>
  );
}
