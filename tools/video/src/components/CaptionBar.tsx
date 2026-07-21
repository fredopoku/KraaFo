import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  text: string;
}

export function CaptionBar({ text }: Props) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '28px 36px 40px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)',
        opacity,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 48,
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1.2,
          letterSpacing: '-0.5px',
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          maxWidth: '88%',
        }}
      >
        {text}
      </p>
    </div>
  );
}
