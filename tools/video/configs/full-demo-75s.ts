/**
 * Flagship social video: full product walkthrough.
 * Landing → Setup → Invoice creation → Send → Dashboard.
 *
 * Trim values calibrated to 06-full-demo.webm (~55s, captured with waitUntil:'load').
 * Section boundaries:
 *   0–8.6s   Landing hero + How it works scroll
 *   8.6–15.6s Setup page: company info + branding steps
 *  15.6–32.9s Invoice generator: load invoice, Smart Fill, scroll items
 *  32.9–44.7s Send modal: email + phone + Send via All Channels
 *  44.7–52.7s Dashboard: revenue summary + invoice list
 *
 * Re-run the capture and re-render if content pacing changes.
 */
import { VideoConfig } from './types';

const config: VideoConfig = {
  id: 'full-demo-75s',
  title: 'KraaFo: Full Product Demo',
  width: 1080,
  height: 1920,
  fps: 30,
  segments: [
    {
      // Landing hero crossfade + How it works stepper
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 0,
      durationSec: 9,
      caption: 'Professional invoicing for your business',
      phoneFrame: true,
    },
    {
      // Setup page: company info + branding (pre-filled, looks polished)
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 9,
      durationSec: 7,
      caption: 'Set up in under 2 minutes',
      phoneFrame: true,
    },
    {
      // Generator: load saved invoice via menu → line items appear → Smart Fill tap
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 16,
      durationSec: 10,
      caption: 'Load your invoice. Smart Fill is one tap away.',
      phoneFrame: true,
    },
    {
      // Smart Fill: AI rewrites all line items + scroll to see result
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 26,
      durationSec: 7,
      caption: 'Smart Fill rewrites every line item in seconds.',
      phoneFrame: true,
    },
    {
      // Send modal: fill email + phone → all three pills go green → Send All
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 33,
      durationSec: 11,
      caption: 'Email · WhatsApp · SMS: one tap',
      phoneFrame: true,
    },
    {
      // Dashboard: revenue summary cards + invoice list
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 44,
      durationSec: 9,
      caption: 'Track every payment in real time',
      phoneFrame: true,
    },
    {
      type: 'end-card',
      headline: 'Free to create your invoices, receipts, and quotes for any business.',
      durationSec: 5,
    },
  ],
};

export default config;
