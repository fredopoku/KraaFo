/**
 * Ported to 06-full-demo.webm — original footage (01-create-invoice.webm,
 * 02-send-modal.webm) no longer exists. Trim values match full-demo-75s
 * calibration. Setup section omitted to keep this under 50s.
 */
import { VideoConfig } from './types';

const config: VideoConfig = {
  id: 'invoice-60s',
  title: 'KraaFo: Invoice Creation Walkthrough',
  width: 1080,
  height: 1920,
  fps: 30,
  segments: [
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 0,
      durationSec: 8,
      caption: 'Professional invoicing for your business',
      phoneFrame: true,
    },
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 16,
      durationSec: 10,
      caption: 'Load your invoice. Smart Fill is one tap away.',
      phoneFrame: true,
    },
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 26,
      durationSec: 7,
      caption: 'Smart Fill rewrites every line item in seconds.',
      phoneFrame: true,
    },
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 33,
      durationSec: 11,
      caption: 'Email · WhatsApp · SMS: one tap.',
      phoneFrame: true,
    },
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 44,
      durationSec: 8,
      caption: 'Track every payment in real time.',
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
