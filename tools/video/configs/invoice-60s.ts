import { VideoConfig } from './types';

const config: VideoConfig = {
  id: 'invoice-60s',
  title: '60-Second Invoice — Full Creation Flow',
  width: 1080,
  height: 1920,
  fps: 30,
  segments: [
    {
      type: 'footage',
      src: '01-create-invoice.webm',
      durationSec: 6,
      caption: 'Open KraaFo. Tap Invoice.',
    },
    {
      type: 'footage',
      src: '01-create-invoice.webm',
      startTrimSec: 6,
      durationSec: 8,
      caption: 'Type your client\'s name. KraaFo finds the rest.',
    },
    {
      type: 'footage',
      src: '01-create-invoice.webm',
      startTrimSec: 14,
      durationSec: 10,
      caption: 'Tap Smart Fill — AI suggests your services in seconds.',
    },
    {
      type: 'footage',
      src: '01-create-invoice.webm',
      startTrimSec: 24,
      durationSec: 8,
      caption: 'Live preview updates as you type.',
    },
    {
      type: 'footage',
      src: '01-create-invoice.webm',
      startTrimSec: 32,
      durationSec: 10,
      caption: 'Hit Save. Your invoice is ready.',
    },
    {
      type: 'footage',
      src: '02-send-modal.webm',
      durationSec: 14,
      caption: 'Send via WhatsApp, SMS, and Email — one tap.',
    },
    {
      type: 'end-card',
      headline: 'Professional invoices in under a minute.',
      durationSec: 4,
    },
  ],
};

export default config;
