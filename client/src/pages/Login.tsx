import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Logo } from '../components/Logo';
import { api } from '../utils/api';
import { useOrg } from '../hooks/useOrg';

type Mode = 'login' | 'forgot' | 'reset';

export default function Login() {
  const navigate = useNavigate();
  const { setOrg } = useOrg();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true); setError('');
    try {
      const { org, token } = await api.auth.login(email.trim(), password);
      setOrg(org, token);
      navigate('/generator');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    try {
      await api.auth.forgot(email.trim());
      setSuccess(`A 6-digit reset code has been sent to ${email.trim()}. Check your inbox.`);
      setMode('reset');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !resetCode.trim() || !newPassword) return;
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const { org, token } = await api.auth.reset(email.trim(), resetCode.trim(), newPassword);
      setOrg(org, token);
      navigate('/generator');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
            <Logo size="lg" />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <div className="p-8">

            {mode === 'login' ? (
              <>
                <h1 className="text-xl font-black text-slate-900 mb-1">Welcome back</h1>
                <p className="text-sm text-slate-500 mb-6">Sign in to access your invoices, clients and documents.</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                        placeholder="you@example.com" autoFocus required autoComplete="email"
                        className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type={showPass ? 'text' : 'password'} value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="••••••••" required autoComplete="current-password"
                        className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button type="submit" disabled={loading || !email.trim() || !password}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-all">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>

                <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  className="w-full text-center text-xs text-slate-400 hover:text-indigo-600 mt-4 transition-colors">
                  Forgot your password?
                </button>
              </>

            ) : mode === 'forgot' ? (
              <>
                <h1 className="text-xl font-black text-slate-900 mb-1">Reset your password</h1>
                <p className="text-sm text-slate-500 mb-6">Enter your business email and we'll send you a 6-digit reset code.</p>

                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Business email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                        placeholder="you@example.com" autoFocus required autoComplete="email"
                        className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button type="submit" disabled={loading || !email.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-all">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {loading ? 'Sending…' : 'Send reset code'}
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-between">
                  <button onClick={() => { setMode('login'); setError(''); }}
                    className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">
                    Back to sign in
                  </button>
                  <button onClick={() => { setMode('reset'); setError(''); setSuccess('I already have a code'); }}
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors font-medium">
                    I already have a code →
                  </button>
                </div>
              </>

            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound className="w-5 h-5 text-indigo-500" />
                  <h1 className="text-xl font-black text-slate-900">Enter your code</h1>
                </div>
                <p className="text-sm text-slate-500 mb-6">Check your email for the 6-digit code, then set a new password.</p>

                {success && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 mb-4">
                    {success}
                  </div>
                )}

                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                        placeholder="you@example.com" required autoComplete="email"
                        className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">6-digit reset code</label>
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                      value={resetCode} onChange={e => { setResetCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                      placeholder="123456" autoFocus required autoComplete="one-time-code"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-center font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">New password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input type={showPass ? 'text' : 'password'} value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setError(''); }}
                        placeholder="At least 8 characters" required autoComplete="new-password"
                        className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button type="submit" disabled={loading || !email.trim() || resetCode.length !== 6 || !newPassword}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-all">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {loading ? 'Saving…' : 'Set new password'}
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-between">
                  <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                    className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">
                    Back to sign in
                  </button>
                  <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors font-medium">
                    Resend code
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          New to KraaFo?{' '}
          <Link to="/setup" className="text-indigo-600 font-bold hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
