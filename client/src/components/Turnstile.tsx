import { useEffect, useRef } from 'react';

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

interface Props {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  resetKey?: string | number;
}

export function TurnstileWidget({ onVerify, onExpire, resetKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>('');

  useEffect(() => {
    if (!SITEKEY || !containerRef.current) return;

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
    } else {
      const id = setInterval(() => {
        if (window.turnstile) { clearInterval(id); render(); }
      }, 100);
      return () => clearInterval(id);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = '';
      }
    };
  }, [resetKey]);

  if (!SITEKEY) return null;
  return <div ref={containerRef} className="flex justify-center mt-2" />;
}

export const TURNSTILE_ENABLED = Boolean(SITEKEY);
