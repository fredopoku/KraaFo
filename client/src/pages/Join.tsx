import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/Logo';
import { api } from '../utils/api';
import { useOrg } from '../hooks/useOrg';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  staff: 'Staff',
  accountant: 'Accountant',
};

export default function Join() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setOrg } = useOrg();

  const [invite, setInvite] = useState<{ email: string; orgName: string; role: string } | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.auth.getInvite(token)
      .then(setInvite)
      .catch(err => setInviteError((err as Error).message));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password || !token) return;
    if (password.length < 8) { setFormError('Password must be at least 8 characters'); return; }
    setLoading(true); setFormError('');
    try {
      const { org, token: jwt } = await api.auth.acceptInvite(token, name.trim(), password);
      setOrg(org, jwt);
      navigate('/generator');
    } catch (err) {
      setFormError((err as Error).message);
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

            {inviteError ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h1 className="text-lg font-black text-slate-900 mb-2">Invite not found</h1>
                <p className="text-sm text-slate-500 mb-5">{inviteError}</p>
                <button onClick={() => navigate('/login')} className="text-sm text-indigo-600 font-bold hover:underline">
                  Sign in instead
                </button>
              </div>
            ) : !invite ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Invite accepted</span>
                </div>
                <h1 className="text-xl font-black text-slate-900 mb-1">Join {invite.orgName}</h1>
                <p className="text-sm text-slate-500 mb-6">
                  You've been invited as <strong>{ROLE_LABELS[invite.role] || invite.role}</strong>. Set up your account to get started.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Your name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text" value={name} onChange={e => { setName(e.target.value); setFormError(''); }}
                        placeholder="Your full name" autoFocus required
                        className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Email</label>
                    <input
                      type="email" value={invite.email} disabled
                      className="w-full px-4 py-3 border border-slate-100 rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Set a password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type={showPass ? 'text' : 'password'} value={password}
                        onChange={e => { setPassword(e.target.value); setFormError(''); }}
                        placeholder="At least 8 characters" required
                        className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {formError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <button type="submit" disabled={loading || !name.trim() || !password}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-all">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {loading ? 'Setting up…' : 'Join team & get started'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
