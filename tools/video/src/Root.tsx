import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';
import { VideoConfig } from '../configs/types';
import invoiceSixty from '../configs/invoice-60s';
import sendAllChannels from '../configs/send-all-channels';
import sendModalCloseup from '../configs/send-modal-closeup';
import fullDemo from '../configs/full-demo-75s';
import ad20s from '../configs/ad-20s';

const allConfigs: VideoConfig[] = [invoiceSixty, sendAllChannels, sendModalCloseup, fullDemo, ad20s];

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
