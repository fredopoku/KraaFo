import { VideoConfig } from './types';

const config: VideoConfig = {
  id: 'ad-20s',
  title: 'KraaFo: 20s Social Ad',
  width: 1080,
  height: 1920,
  fps: 30,
  ctaBadge: true,
  segments: [
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 1,
      durationSec: 3,
      phoneFrame: true,
    },
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 22,
      durationSec: 9,
      caption: 'Smart Fill: invoice in seconds',
      phoneFrame: true,
    },
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 37,
      durationSec: 5,
      caption: 'Email · WhatsApp · SMS: one tap',
      phoneFrame: true,
    },
    {
      type: 'end-card',
      headline: 'Free to create your invoices, receipts, and quotes for any business.',
      durationSec: 4,
    },
  ],
};

export default config;
