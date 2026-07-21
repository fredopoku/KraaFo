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
  const startFrom = seg.startTrimSec ? Math.round(seg.startTrimSec * 30) : 0;

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
  return (
    <AbsoluteFill>
      {config.segments.map((seg, i) => {
        const durationInFrames = Math.round(seg.durationSec * fps);
        const from = frameOffset;
        frameOffset += durationInFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={durationInFrames}>
            <SegmentView seg={seg} width={config.width} height={config.height} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
