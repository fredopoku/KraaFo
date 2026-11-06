import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MailCheck, Clock, AlertCircle, Users } from 'lucide-react';
import { LogoMark } from '../components/Logo';
import { api } from '../utils/api';
import { useOrg, getToken, AFTER_VERIFY_KEY } from '../hooks/useOrg';

const SUPPORT_EMAIL = 'kraafo.invoice.receipt@gmail.com';

// Every account confirms its email with a 6-digit code before it can use
// the app: new signups, every existing account once, and after an email
// change. The server enforces this (middleware/auth.ts); this page is the
// only screen a pending account can reach.
export default function VerifyCode() {
  const navigate = useNavigate();
  const { org, loading, role, clearOrg } = useOrg();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const sentOnce = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const status = org?.verification_status;
  const isOwner = role === 'owner';
  const isHeld = status === 'held_for_review' || status === 'rejected';
  const reason = (org as any)?.verify_reason as 'signup' | 'reverify' | 'email_change' | undefined;

  useEffect(() => {
    if (loading) return;
    if (!getToken() || !org) { navigate('/login'); return; }
    if (status === 'verified') { finish(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, org, status]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async (manual: boolean) => {
    setSending(true);
    setError('');
    if (manual) setNotice('');
    try {
      const res = await api.auth.sendCode();
      if (res.alreadyVerified) { finish(); return; }
      if (res.email) setEmail(res.email);
      if (res.cooldownSeconds) setCooldown(res.cooldownSeconds);
      if (res.sent && manual) setNotice('A new code is on its way. The previous one no longer works.');
      if (res.sent) setCode('');
    } catch (err) {
      setError((err as Error).message || "We couldn't send the code. Please try again.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Send the first code automatically. If one was sent moments ago (e.g.
  // straight after signup) the server just reports the cooldown instead.
  useEffect(() => {
    if (loading || !org || status !== 'pending_verification' || !isOwner || sentOnce.current) return;
    sentOnce.current = true;
    setEmail(org.email || '');
    void send(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, org, status, isOwner]);

  function finish() {
    let next = '/dashboard';
    try {
      next = localStorage.getItem(AFTER_VERIFY_KEY) || next;
      localStorage.removeItem(AFTER_VERIFY_KEY);
    } catch {}
    // Full reload so every useOrg() instance picks up the verified status.
    window.location.assign(next);
  }

  const submit = async (value = code) => {
    if (value.length !== 6 || verifying) return;
    setVerifying(true);
    setError('');
    setNotice('');
    try {
      const res = await api.auth.verifyCode(value);
      if (res.held) { window.location.reload(); return; }
      finish();
    } catch (err) {
      setError((err as Error).message);
      // Empty the box so the next attempt can just be typed in.
      setCode('');
      setVerifying(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const signOut = () => { clearOrg(); navigate('/login'); };

  const title = reason === 'reverify' ? "We've updated KraaFo's security"
    : reason === 'email_change' ? 'Confirm your new email'
    : 'Confirm your email';

  const intro = reason === 'reverify'
    ? "To keep fake accounts off KraaFo, we're asking everyone to confirm their email once. Your invoices, clients and settings are all safe and exactly where you left them."
    : reason === 'email_change'
      ? 'You changed your account email. Confirm the new address to keep using KraaFo.'
      : 'One last step to activate your account.';

  let content;
  if (loading || !org) {
    content = <div className="flex justify-center py-6"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  } else if (isHeld) {
    content = (
      <>
        <div className="flex justify-center"><Clock className="w-10 h-10 text-amber-500" /></div>
        <h2 className="text-lg font-bold text-slate-900">Your account is under review</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          We're doing a quick manual check before this account can be used. We'll email you as soon as it's cleared.
        </p>
      </>
    );
  } else if (!isOwner) {
    content = (
      <>
        <div className="flex justify-center"><Users className="w-10 h-10 text-indigo-500" /></div>
        <h2 className="text-lg font-bold text-slate-900">Waiting for the account owner</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          {org.name || 'This account'} needs its owner to confirm the account email before the team can continue.
          Ask them to sign in to KraaFo - it only takes a minute.
        </p>
      </>
    );
  } else {
    content = (
      <>
        <div className="flex justify-center"><MailCheck className="w-10 h-10 text-indigo-500" /></div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 leading-relaxed">{intro}</p>
        <p className="text-sm text-slate-700">
          Enter the 6-digit code we sent to <strong className="break-all">{email || org.email}</strong>.
        </p>

        <form onSubmit={e => { e.preventDefault(); void submit(); }} className="space-y-3 text-left">
          <input
            ref={inputRef}
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            aria-label="6-digit verification code"
            placeholder="000000"
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(v);
              if (v.length === 6) void submit(v);
            }}
            className="w-full text-center text-3xl font-black tracking-[0.5em] py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-slate-900 placeholder:text-slate-300"
          />
          {error && (
            <p className="flex items-start gap-1.5 text-sm text-red-600"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</p>
          )}
          {notice && !error && <p className="text-sm text-emerald-600">{notice}</p>}
          <button
            type="submit"
            disabled={code.length !== 6 || verifying}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm transition-all"
          >
            {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm email
          </button>
        </form>

        <button
          type="button"
          onClick={() => void send(true)}
          disabled={sending || cooldown > 0}
          className="text-sm font-semibold text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline"
        >
          {sending ? 'Sending...' : cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </button>
        <p className="text-xs text-slate-400 leading-relaxed">
          Can't find it? Check spam or promotions. The code expires in 10 minutes.
          No longer have access to this inbox?{' '}
          <a className="text-indigo-600 hover:underline" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('KraaFo email verification help')}`}>Contact support</a>.
        </p>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center">
        <div className="bg-indigo-600 px-8 py-6 flex flex-col items-center">
          <LogoMark size={52} />
          <h1 className="text-white text-xl font-black mt-3 tracking-tight">KraaFo</h1>
        </div>
        <div className="px-6 sm:px-8 py-8 space-y-4">
          {content}
          <button type="button" onClick={signOut} className="block w-full text-xs text-slate-400 hover:text-slate-600 pt-2">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
