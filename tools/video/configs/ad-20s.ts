/**
 * Trim values calibrated to 06-full-demo.webm (~55s, captured with waitUntil:'load').
 */
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
      // Landing hero — visual hook
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 1,
      durationSec: 3,
      phoneFrame: true,
    },
    {
      // Smart Fill: line items appear instantly
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 25,
      durationSec: 9,
      caption: 'Smart Fill: invoice in seconds',
      phoneFrame: true,
    },
    {
      // Send modal: pills go green + Send via All Channels tap
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 38,
      durationSec: 6,
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
