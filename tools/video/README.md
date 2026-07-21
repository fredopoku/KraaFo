# KraaFo Video Pipeline

Generates professional 1080×1920 MP4s for TikTok, Reels, and Shorts from real product UI footage.  
Output is silent — add audio natively in the platform.

## Stack decision: Remotion over raw ffmpeg

The app is React + TypeScript. Remotion compiles real React components into video frames, so brand tokens, the indigo/violet palette, and component logic (spring animations, interpolation) work exactly as they do in the app — no ffmpeg filter graph sorcery. Raw ffmpeg `drawtext` overlays are brittle string templates; Remotion `<CaptionBar>` is a JSX component.

---

## Quick start

### 1. Install

```bash
cd tools/video
npm install
npx playwright install chromium
```

### 2. Start the dev server

Open a new terminal at the project root:

```bash
npm run dev
```

Keep it running. The capture scripts drive the live app at `http://localhost:5173`.

### 3. Run all captures

```bash
cd tools/video
npm run capture
```

This runs all 5 Playwright scripts sequentially. Footage lands in `public/footage/` as `.webm` files.

### 4. Render a video

```bash
npm run render -- invoice-60s
npm run render -- send-all-channels
npm run render -- send-modal-closeup
```

Output MP4s land in `out/`. Target size: <10 MB per video at CRF 20.

---

## Directory layout

```
tools/video/
├── src/
│   ├── index.tsx              Remotion entry point
│   ├── Root.tsx               Registers all compositions
│   ├── VideoComposition.tsx   Main composition — renders segments
│   └── components/
│       ├── CaptionBar.tsx     White bold lower-third, fade in/out
│       ├── EndCard.tsx        #4F46E5 branded end card + kraafo.com
│       ├── PhoneFrame.tsx     iPhone 15 Pro bezel wrapper
│       └── KenBurns.tsx       Ken Burns / zoom-in for still images
│
├── configs/
│   ├── types.ts               VideoConfig + Segment types
│   ├── invoice-60s.ts         60-second invoice creation flow
│   ├── send-all-channels.ts   Full triple-channel send demo
│   └── send-modal-closeup.ts  12-second modal close-up
│
├── captures/
│   ├── _setup.ts              Demo org/client/invoice seeding helpers
│   ├── 01-create-invoice.ts   Invoice creation + Smart Fill
│   ├── 02-send-modal.ts       Send modal — all channels
│   ├── 03-single-channel.ts   Email-only send
│   ├── 04-paid-dashboard.ts   Dashboard with paid invoices
│   └── 05-landing-story.ts    Landing hero crossfade + story player
│
├── scripts/
│   ├── capture-all.ts         Run all 5 captures
│   └── render.ts              Render a config to MP4
│
├── public/
│   └── footage/               Playwright WebM output (git-ignored)
└── out/                       Rendered MP4s (git-ignored)
```

---

## Adding a new video

### 1. Create a config

```typescript
// configs/my-video.ts
import { VideoConfig } from './types';

const config: VideoConfig = {
  id: 'my-video',
  title: 'My New Video',
  width: 1080,
  height: 1920,
  fps: 30,
  segments: [
    {
      type: 'footage',
      src: '01-create-invoice.webm',  // existing footage
      durationSec: 8,
      caption: 'Create in seconds.',
    },
    {
      type: 'end-card',
      headline: 'Try KraaFo free.',
      durationSec: 4,
    },
  ],
};

export default config;
```

### 2. Register it in Root.tsx

```typescript
import myVideo from '../configs/my-video';
const allConfigs = [...existing, myVideo];
```

### 3. Render

```bash
npm run render -- my-video
```

---

## Capture a new UI flow

1. Create `captures/06-my-flow.ts` following the pattern of existing scripts.
2. Use `createDemoOrg()` + seeding helpers from `_setup.ts`.
3. All demo data must use the fictional "Sparkle & Shine" org and "Abena Mensah" client — never real customer data.
4. End-card must carry `kraafo.com`.
5. Never caption AI-generated imagery as real customers.
6. Never show fabricated metrics in dashboard footage — seed realistic fictional numbers or use the real demo dataset.

Run the new capture:

```bash
npx tsx captures/06-my-flow.ts
```

---

## Segment types reference

| Type | Fields | Notes |
|---|---|---|
| `footage` | `src`, `durationSec`, `startTrimSec?`, `caption?`, `phoneFrame?` | WebM from Playwright. `phoneFrame: false` for full-bleed. |
| `image` | `src`, `motion`, `durationSec`, `caption?` | File in `public/assets/`. Motion: `ken-burns`, `zoom-in`, `still`. |
| `end-card` | `headline`, `durationSec` | Always includes `kraafo.com`. |

---

## Rules (baked in, non-negotiable)

- **Demo data only.** All Playwright captures use fictional org "Sparkle & Shine" + fictional client "Abena Mensah". The `createDemoOrg()` helper creates a fresh throw-away org per run.
- **No fake metrics.** Dashboard footage uses seeded numbers from `seedDashboard()`. Never manually fabricate income figures.
- **Every end card carries `kraafo.com`.** The `EndCard` component hardcodes this — do not override.
- **AI imagery never captioned as real customers.** If a still image is AI-generated, its caption must not imply it is a real user or testimonial.
