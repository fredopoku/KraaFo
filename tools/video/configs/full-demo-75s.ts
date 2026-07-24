/**
 * Flagship social video — full product walkthrough.
 * Landing → Setup → Invoice creation → Send → Dashboard.
 * ~58s content + 5s end card = 63s total, 1080×1920, 30fps.
 *
 * startTrimSec values calibrated to 06-full-demo.webm capture (~54s recording).
 * Re-run the capture and re-render if content pacing changes.
 */
import { VideoConfig } from './types';

const config: VideoConfig = {
  id: 'full-demo-75s',
  title: 'KraaFo — Full Product Demo',
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
      // Setup page: company info + branding steps (pre-filled, looks polished)
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 9,
      durationSec: 8,
      caption: 'Set up in under 2 minutes',
      phoneFrame: true,
    },
    {
      // Generator: load invoice → Smart Fill AI writes items → scroll preview
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 17,
      durationSec: 17,
      caption: 'Smart Fill writes your invoice — instantly',
      phoneFrame: true,
    },
    {
      // Send modal: fill email + phone → all three pills go green → Send
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 34,
      durationSec: 12,
      caption: 'Email · WhatsApp · SMS — one tap',
      phoneFrame: true,
    },
    {
      // Dashboard: revenue summary cards + invoice list
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 46,
      durationSec: 7,
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
