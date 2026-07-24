import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export function EndCard({ headline }: { headline: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const headlineOpacity = interpolate(frame, [20, 34], [0, 1], { extrapolateRight: 'clamp' });
  const headlineY = interpolate(frame, [20, 34], [24, 0], { extrapolateRight: 'clamp' });
  const urlOpacity = interpolate(frame, [30, 44], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #3730A3 0%, #4F46E5 55%, #6366F1 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 52,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Logo block: logomark + wordmark, spring animated together */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}
      >
        {/* Logomark — white rounded square with indigo K */}
        <div
          style={{
            width: 168,
            height: 168,
            borderRadius: 40,
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 40px 100px rgba(0,0,0,0.35)',
          }}
        >
          <svg width="92" height="92" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Vertical stem */}
            <line x1="26" y1="12" x2="26" y2="80" stroke="#4F46E5" strokeWidth="11" strokeLinecap="round" />
            {/* Upper diagonal */}
            <line x1="26" y1="46" x2="68" y2="12" stroke="#4F46E5" strokeWidth="11" strokeLinecap="round" />
            {/* Lower diagonal */}
            <line x1="26" y1="46" x2="68" y2="80" stroke="#4F46E5" strokeWidth="11" strokeLinecap="round" />
          </svg>
        </div>

        {/* Wordmark */}
        <p
          style={{
            color: 'white',
            fontSize: 80,
            fontWeight: 900,
            letterSpacing: '-3px',
            margin: 0,
            lineHeight: 1,
          }}
        >
          KraaFo
        </p>
      </div>

      {/* Headline — fades + slides in */}
      <div
        style={{
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          textAlign: 'center',
          padding: '0 88px',
        }}
      >
        <p
          style={{
            color: 'rgba(255,255,255,0.90)',
            fontSize: 50,
            fontWeight: 700,
            lineHeight: 1.35,
            margin: 0,
          }}
        >
          {headline}
        </p>
      </div>

      {/* URL */}
      <p
        style={{
          opacity: urlOpacity,
          color: 'rgba(255,255,255,0.60)',
          fontSize: 36,
          fontWeight: 500,
          margin: 0,
          letterSpacing: '1.5px',
        }}
      >
        kraafo.com
      </p>
    </AbsoluteFill>
  );
}
