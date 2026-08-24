import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Star, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';
import { LogoMark } from '../components/Logo';
import { TurnstileWidget, TURNSTILE_ENABLED } from '../components/Turnstile';

export default function FeedbackPage() {
  const [params] = useSearchParams();
  const [name, setName] = useState(params.get('name') || '');
  const [email, setEmail] = useState(params.get('email') || '');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !rating) { setError('Please add your name and a rating.'); return; }
    if (TURNSTILE_ENABLED && !turnstileToken) { setError('Please complete the security check.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.feedback.submit({
        name: name.trim(),
        email: email.trim() || undefined,
        rating,
        message: message.trim() || undefined,
        cf_turnstile_response: turnstileToken,
      });
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
      setTurnstileKey(k => k + 1);
      setTurnstileToken(undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
        <LogoMark size={56} className="mx-auto mb-6" />

        {done ? (
          <>
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-black text-slate-900 mb-2">Thank you!</h1>
            <p className="text-slate-500 text-sm mb-6">Your feedback means a lot to us and helps shape what we build next.</p>
            <Link to="/" className="text-sm text-indigo-600 font-bold hover:text-indigo-800 transition-colors">← Back to KraaFo</Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-black text-slate-900 mb-2">How are we doing?</h1>
            <p className="text-slate-500 text-sm mb-6">Rate your experience with KraaFo and let us know what's on your mind - a question, a feature request, anything.</p>

            <div className="flex justify-center gap-1.5 mb-6">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star className={`w-8 h-8 transition-colors ${n <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>

            <div className="space-y-3 text-left">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
              <textarea
                placeholder="Any questions, requests, or feedback? (optional)"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>

            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

            <TurnstileWidget
              onVerify={tok => setTurnstileToken(tok)}
              onExpire={() => setTurnstileToken(undefined)}
              resetKey={turnstileKey}
            />

            <button
              onClick={handleSubmit}
              disabled={submitting || (TURNSTILE_ENABLED && !turnstileToken)}
              className="w-full h-11 mt-5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-40"
            >
              {submitting ? 'Sending…' : 'Submit feedback'}
            </button>

            <Link to="/" className="block mt-5 text-xs text-slate-400 hover:text-slate-600 transition-colors">← Back to KraaFo</Link>
          </>
        )}
      </div>
    </div>
  );
}
