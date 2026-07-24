import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useVideoConfig,
} from 'remotion';
import { VideoConfig, Segment } from '../configs/types';
import { CaptionBar } from './components/CaptionBar';
import { CTABadge } from './components/CTABadge';
import { EndCard } from './components/EndCard';
import { KenBurns } from './components/KenBurns';
import { PhoneFrame } from './components/PhoneFrame';

function SegmentView({ seg, width, height }: { seg: Segment; width: number; height: number }) {
  if (seg.type === 'end-card') {
    return (
      <AbsoluteFill>
        <EndCard headline={seg.headline} />
      </AbsoluteFill>
    );
  }

  if (seg.type === 'image') {
    return (
      <AbsoluteFill style={{ background: '#020617' }}>
        <KenBurns src={seg.src} motion={seg.motion} />
        {seg.caption && <CaptionBar text={seg.caption} />}
      </AbsoluteFill>
    );
  }

  // footage segment
  const useFrame = seg.phoneFrame !== false;
  const { fps } = useVideoConfig();
  const startFrom = seg.startTrimSec ? Math.round(seg.startTrimSec * fps) : 0;

  const videoEl = (
    <OffthreadVideo
      src={staticFile(`footage/${seg.src}`)}
      startFrom={startFrom}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );

  return (
    <AbsoluteFill style={{ background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {useFrame ? (
        <PhoneFrame screenWidth={390} screenHeight={844}>
          {videoEl}
        </PhoneFrame>
      ) : (
        <div style={{ position: 'absolute', inset: 0 }}>{videoEl}</div>
      )}
      {seg.caption && <CaptionBar text={seg.caption} />}
    </AbsoluteFill>
  );
}

export function VideoComposition({ config }: { config: VideoConfig }) {
  const { fps } = useVideoConfig();

  let frameOffset = 0;
  const sequenceData = config.segments.map((seg) => {
    const durationInFrames = Math.round(seg.durationSec * fps);
    const from = frameOffset;
    frameOffset += durationInFrames;
    return { seg, from, durationInFrames };
  });

  // CTABadge spans all non-end-card segments as a single continuous sequence
  const footageDuration = sequenceData
    .filter(({ seg }) => seg.type !== 'end-card')
    .reduce((sum, { durationInFrames }) => sum + durationInFrames, 0);

  return (
    <AbsoluteFill>
      {sequenceData.map(({ seg, from, durationInFrames }, i) => (
        <Sequence key={i} from={from} durationInFrames={durationInFrames}>
          <SegmentView seg={seg} width={config.width} height={config.height} />
        </Sequence>
      ))}
      {config.ctaBadge && (
        <Sequence from={0} durationInFrames={footageDuration}>
          <CTABadge />
        </Sequence>
      )}
    </AbsoluteFill>
  );
}
