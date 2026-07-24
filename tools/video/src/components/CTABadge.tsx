import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export function CTABadge() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, config: { damping: 22, stiffness: 90 } });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 96,
        left: '50%',
        transform: `translateX(-50%) translateY(${translateY}px)`,
        opacity,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        background: 'rgba(12,12,18,0.70)',
        border: '1px solid rgba(255,255,255,0.13)',
        borderRadius: 100,
        padding: '18px 24px 18px 18px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Mini K logomark */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: '#4F46E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <line x1="8" y1="3" x2="8" y2="25" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="8" y1="14" x2="21" y2="3" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="8" y1="14" x2="21" y2="25" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Text block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span
          style={{
            color: 'white',
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: '-0.8px',
            lineHeight: 1,
          }}
        >
          kraafo.com
        </span>
        <span
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: '0.1px',
          }}
        >
          Free · No card needed
        </span>
      </div>

      {/* CTA pill */}
      <div
        style={{
          background: '#4F46E5',
          color: 'white',
          fontSize: 28,
          fontWeight: 700,
          padding: '14px 30px',
          borderRadius: 100,
          letterSpacing: '-0.3px',
          flexShrink: 0,
        }}
      >
        Try Free →
      </div>
    </div>
  );
}
