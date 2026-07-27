/**
 * Ported to 06-full-demo.webm — original footage (02-send-modal.webm,
 * 04-paid-dashboard.webm) no longer exists. Focused on the send flow.
 */
import { VideoConfig } from './types';

const config: VideoConfig = {
  id: 'send-all-channels',
  title: 'KraaFo: Send via All Channels',
  width: 1080,
  height: 1920,
  fps: 30,
  segments: [
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 0,
      durationSec: 5,
      caption: 'Invoice ready. Now send it.',
      phoneFrame: true,
    },
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 16,
      durationSec: 5,
      caption: 'Your invoice, loaded.',
      phoneFrame: true,
    },
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 33,
      durationSec: 11,
      caption: 'Email · WhatsApp · SMS: fill in once, send to all three.',
      phoneFrame: true,
    },
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 44,
      durationSec: 5,
      caption: 'Every channel confirmed. Invoice delivered.',
      phoneFrame: true,
    },
    {
      type: 'end-card',
      headline: 'Triple-channel delivery. One tap.',
      durationSec: 4,
    },
  ],
};

export default config;
