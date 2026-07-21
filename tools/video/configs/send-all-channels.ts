import { VideoConfig } from './types';

const config: VideoConfig = {
  id: 'send-all-channels',
  title: 'Send via All Channels — Full Real-UI Demo',
  width: 1080,
  height: 1920,
  fps: 30,
  segments: [
    {
      type: 'footage',
      src: '02-send-modal.webm',
      durationSec: 5,
      caption: 'Invoice saved. Now send it.',
    },
    {
      type: 'footage',
      src: '02-send-modal.webm',
      startTrimSec: 5,
      durationSec: 8,
      caption: 'Enter email and phone. Fields fill from your address book.',
    },
    {
      type: 'footage',
      src: '02-send-modal.webm',
      startTrimSec: 13,
      durationSec: 10,
      caption: 'One tap. WhatsApp, SMS, and Email sent simultaneously.',
    },
    {
      type: 'footage',
      src: '04-paid-dashboard.webm',
      durationSec: 8,
      caption: 'Client gets it on every channel. No excuses.',
    },
    {
      type: 'end-card',
      headline: 'Triple-channel delivery. One tap.',
      durationSec: 4,
    },
  ],
};

export default config;
