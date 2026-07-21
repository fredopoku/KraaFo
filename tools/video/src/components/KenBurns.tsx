import React from 'react';
import { Img, interpolate, useCurrentFrame, useVideoConfig, staticFile } from 'remotion';

interface Props {
  src: string;
  motion: 'ken-burns' | 'zoom-in' | 'still';
}

export function KenBurns({ src, motion }: Props) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;

  let scale = 1;
  let translateX = '0%';
  let translateY = '0%';

  if (motion === 'ken-burns') {
    scale = interpolate(progress, [0, 1], [1.0, 1.12]);
    const tx = interpolate(progress, [0, 1], [0, -3]);
    const ty = interpolate(progress, [0, 1], [0, -2]);
    translateX = `${tx}%`;
    translateY = `${ty}%`;
  } else if (motion === 'zoom-in') {
    scale = interpolate(progress, [0, 1], [1.0, 1.08]);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img
        src={staticFile(`assets/${src}`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${translateX}, ${translateY})`,
          transformOrigin: 'center center',
        }}
      />
    </div>
  );
}
