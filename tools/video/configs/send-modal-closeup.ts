import { VideoConfig } from './types';

// 12s close-up of the send modal: satisfying UI moment
const config: VideoConfig = {
  id: 'send-modal-closeup',
  title: 'The Send Modal Close-Up (12s)',
  width: 1080,
  height: 1920,
  fps: 30,
  segments: [
    {
      type: 'footage',
      src: '02-send-modal.webm',
      durationSec: 8,
      phoneFrame: false, // full-bleed for close-up impact
      caption: 'Fill in. Tap Send via All Channels.',
    },
    {
      type: 'footage',
      src: '02-send-modal.webm',
      startTrimSec: 8,
      durationSec: 4,
      phoneFrame: false,
      caption: 'Done.',
    },
  ],
};

export default config;
