/**
 * Ported to 06-full-demo.webm — original footage (02-send-modal.webm)
 * no longer exists. Close-up of the send modal only — no phone frame
 * for full-bleed impact. No end card (brief vignette).
 */
import { VideoConfig } from './types';

const config: VideoConfig = {
  id: 'send-modal-closeup',
  title: 'KraaFo: Send Modal Close-Up',
  width: 1080,
  height: 1920,
  fps: 30,
  segments: [
    {
      type: 'footage',
      src: '06-full-demo.webm',
      startTrimSec: 33,
      durationSec: 11,
      phoneFrame: false,
      caption: 'Email · WhatsApp · SMS: fill in once, send to all three.',
    },
  ],
};

export default config;
