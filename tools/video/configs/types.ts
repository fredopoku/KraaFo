export type FootageSegment = {
  type: 'footage';
  /** filename inside public/footage/ e.g. "01-create-invoice.webm" */
  src: string;
  durationSec: number;
  /** trim the start of the footage (seconds) */
  startTrimSec?: number;
  caption?: string;
  /** wrap in phone frame bezel (default true) */
  phoneFrame?: boolean;
};

export type ImageSegment = {
  type: 'image';
  /** filename inside public/assets/ */
  src: string;
  motion: 'ken-burns' | 'zoom-in' | 'still';
  durationSec: number;
  caption?: string;
};

export type EndCardSegment = {
  type: 'end-card';
  headline: string;
  durationSec: number;
};

export type Segment = FootageSegment | ImageSegment | EndCardSegment;

export type VideoConfig = {
  /** Remotion composition ID: also used as output filename */
  id: string;
  title: string;
  width: number;
  height: number;
  fps: number;
  segments: Segment[];
  /** Render a persistent clickable-ad CTA badge over footage segments */
  ctaBadge?: boolean;
};
