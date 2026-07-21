import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

interface Props {
  headline: string;
}

export function EndCard({ headline }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 120, mass: 0.8 } });
  const textOpacity = interpolate(frame, [10, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const urlOpacity  = interpolate(frame, [20, 34], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(160deg, #4338ca 0%, #4F46E5 45%, #6d28d9 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: '0 80px',
      }}
    >
      {/* Soft ambient circle */}
      <div style={{
        position: 'absolute',
        width: 700,
        height: 700,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* Logo mark (K) */}
      <div style={{ transform: `scale(${logoScale})` }}>
        <div style={{
          width: 120,
          height: 120,
          borderRadius: 32,
          background: 'rgba(255,255,255,0.15)',
          border: '2px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 64,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: -2,
          }}>K</span>
        </div>
      </div>

      {/* Headline */}
      <p style={{
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 56,
        fontWeight: 800,
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 1.15,
        opacity: textOpacity,
        letterSpacing: '-0.5px',
      }}>
        {headline}
      </p>

      {/* URL */}
      <p style={{
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 40,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.75)',
        opacity: urlOpacity,
        letterSpacing: 0.5,
      }}>
        kraafo.com
      </p>
    </div>
  );
}
