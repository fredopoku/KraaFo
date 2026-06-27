import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { api } from '../utils/api';
import { useOrg } from '../hooks/useOrg';

export default function Login() {
  const navigate = useNavigate();
  const { setOrg } = useOrg();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const org = await api.auth.login(email.trim());
      setOrg(org);
      navigate('/generator');
    } catch (err) {
      setError((err as Error).message || 'No account found with that email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
            <Logo size="lg" />
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <div className="p-8">
            <h1 className="text-xl font-black text-slate-900 mb-1">Welcome back</h1>
            <p className="text-sm text-slate-500 mb-6">Enter the email you registered with and we'll pull up your account.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Business email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@yourbusiness.com"
                    autoFocus
                    required
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p>{error}</p>
                    <p className="text-xs mt-1 text-red-500">
                      Don't have an account?{' '}
                      <Link to="/setup" className="font-bold underline">Set one up here</Link>
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Finding your account…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          New to KraaFo?{' '}
          <Link to="/setup" className="text-indigo-600 font-bold hover:underline">Create a free account</Link>
        </p>

      </div>
    </div>
  );
}
