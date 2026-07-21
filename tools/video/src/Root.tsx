import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';
import { VideoConfig } from '../configs/types';
import invoiceSixty from '../configs/invoice-60s';
import sendAllChannels from '../configs/send-all-channels';
import sendModalCloseup from '../configs/send-modal-closeup';

const allConfigs: VideoConfig[] = [invoiceSixty, sendAllChannels, sendModalCloseup];

function totalFrames(cfg: VideoConfig) {
  return cfg.segments.reduce((sum, s) => sum + Math.round(s.durationSec * cfg.fps), 0);
}

export function Root() {
  return (
    <>
      {allConfigs.map((cfg) => (
        <Composition
          key={cfg.id}
          id={cfg.id}
          component={VideoComposition}
          width={cfg.width}
          height={cfg.height}
          fps={cfg.fps}
          durationInFrames={totalFrames(cfg)}
          defaultProps={{ config: cfg }}
        />
      ))}
    </>
  );
}
