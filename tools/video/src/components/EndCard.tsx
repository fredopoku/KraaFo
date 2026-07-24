import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

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
      <Img
        src={staticFile('assets/krafo-logo.png')}
        style={{
          width: 420,
          height: 'auto',
          objectFit: 'contain',
          transform: `scale(${logoScale})`,
          filter: 'drop-shadow(0 0 60px rgba(255,255,255,0.35))',
        }}
      />

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
