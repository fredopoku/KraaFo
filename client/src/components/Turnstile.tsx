import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY as string | undefined;
const LOAD_TIMEOUT_MS = 8000;

interface Props {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onUnavailable?: () => void;
  resetKey?: string | number;
}

export function TurnstileWidget({ onVerify, onExpire, onUnavailable, resetKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>('');
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!SITEKEY || !containerRef.current) return;
    setUnavailable(false);

    const render = () => {
      if (!containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = '';
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITEKEY,
        callback: onVerify,
        'expired-callback': () => { onExpire?.(); },
        'error-callback': () => { onExpire?.(); },
        theme: 'light',
        size: 'normal',
      });
    };

    if (window.turnstile) {
      render();
      return;
    }

    // Cloudflare's script can fail to load or initialize entirely - ad
    // blockers, privacy extensions (Brave Shields, uBlock, etc.), or
    // corporate network filters commonly strip or block it. Without a
    // timeout a blocked visitor sees a permanently empty box and can never
    // sign up. After LOAD_TIMEOUT_MS we give up and tell the parent, which
    // lets the signup proceed without a token - it still goes through the
    // risk score (see routes/organizations.ts), just without this signal.
    const start = Date.now();
    const pollId = setInterval(() => {
      if (window.turnstile) {
        clearInterval(pollId);
        render();
      } else if (Date.now() - start > LOAD_TIMEOUT_MS) {
        clearInterval(pollId);
        setUnavailable(true);
        onUnavailable?.();
      }
    }, 100);

    return () => clearInterval(pollId);
  }, [resetKey]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = '';
      }
    };
  }, []);

  if (!SITEKEY) return null;
  if (unavailable) {
    return (
      <p className="text-xs text-slate-400 text-center mt-2">
        Security check unavailable in this browser - you can continue without it.
      </p>
    );
  }
  return <div ref={containerRef} className="flex justify-center mt-2" />;
}

export const TURNSTILE_ENABLED = Boolean(SITEKEY);
