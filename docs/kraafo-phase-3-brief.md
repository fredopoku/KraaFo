# KraaFo - Phase 3 Brief: Living Hero, Story Player & Image Integration

**Context:** Phases 1–2 are live (prerendering, per-route metadata, honest copy, two-mode delivery messaging, ref-tagged attribution links, three SEO landing pages). Phase 3 upgrades the landing page's visual storytelling using a set of supplied images. The founder is sharing these images alongside this brief.

**Design philosophy (why these patterns and not a carousel):** Conversion research is unambiguous that classic hero carousels fail - ~1% interaction, 84%+ of clicks on slide one, Nielsen Norman confirms auto-rotation annoys users, and removing sliders has lifted conversions ~23% in A/B tests. But story-driven heroes and authentic user imagery are 2026's strongest patterns. So this phase builds two things that capture the benefits without the carousel penalties:
1. A **living-portrait hero** - static headline/CTA, slow ambient crossfade of imagery behind it. One message, rotating faces. NOT a carousel: no arrows, no dots, no user controls, no competing messages.
2. A **WhatsApp-Status-style story player** - a tappable 5-frame story in the visual format the audience already uses daily. This is the differentiator section; no competitor has it.

---

## Part 0: Image inventory & mapping

The founder is supplying these files (names may differ - identify them by content as described):

**Crossfade portrait set (4 images, vertical, "payment received" moment):**
- `portrait-accra` - REAL PHOTO: female cleaner, yellow "Sparkle & Shine Cleaning Services" polo, braided bun, white van, holding phone showing Payment received GHS 250.00. This is the anchor image and the LCP image.
- `portrait-lagos` - AI: male tailor, "Adeyemi Stitches" apron and shop sign, sewing machine, phone showing Payment received NGN 48,500.00.
- `portrait-saopaulo` - AI: female food-truck owner, "Sabor da Rosa" apron and truck, phone showing "Pagamento recebido R$ 125,00 via Pix".
- `portrait-manchester` - AI: male plumber, navy "Whitfield Plumbing & Heating" polo and van, red-brick terraced street, phone showing Payment received £285.00.

**Story player set (5 frames, 9:16 vertical):**
- `story-1` - AI: the Accra cleaner (white van, braided bun) looking frustrated at a crumpled handwritten receipt book.
- `story-2` - AI: same character typing an invoice on her phone (screen shows a line-items form).
- `story-3` - **TO BE BUILT BY YOU (Claude Code):** full-frame 9:16 rendering of the REAL send modal - "Send Invoice" with email/phone fields, the "Send via All Channels" primary button, "or send individually" divider, Email / WhatsApp / SMS buttons. Render the actual component (or a pixel-faithful static export of it) on a clean background at story-frame dimensions. Do not screenshot AI imagery - use the real UI.
- `story-4` - **TO BE BUILT BY YOU:** full-frame 9:16 mock of a WhatsApp chat showing the delivered invoice message exactly as the server sends it (from Phase 2 verbatim: "Hi [name], Please find your invoice from Sparkle & Shine Cleaning Services… Invoice / Total GHS… / Due… / View & download link / Thank you…") with double ticks. Style it faithfully to WhatsApp's chat UI without using WhatsApp's logo as the frame's focus (chat bubble aesthetic is fine; we are depicting our own message).
- `story-5` - reuse `portrait-accra` (the real photo). It is both the crossfade anchor and the story's payoff frame. This repetition is intentional: the story ends on the same real human moment the hero opens with.

**Features section (1 image, may arrive slightly later):**
- `desktop-tailor` - AI: the Lagos tailor at a laptop in a warm evening workshop. Slot into the features/document-history area to show desktop usage. If not supplied yet, leave a properly sized placeholder slot wired for it.

**Do NOT use:** any supplied images featuring a yellow-and-blue van with a young woman holding the phone up to camera (a mismatched character set). If present in the upload, set them aside unused.

**Hard content rules (carried over from Phase 1):**
- Never attach a real-sounding customer name, quote, testimonial, or "verified" label to any AI-generated face. AI imagery is illustrative only. Real reviews pair only with real people or neutral initial-avatars.
- Alt text for AI images describes the scene generically ("A tailor checks a payment confirmation on his phone") - never implies a real named customer.

## Part 1: Living-portrait hero

Replace the current single hero image with an ambient crossfade of the 4 portraits.

**Behavior:**
- Headline, subcopy, checkmarks, and both CTAs are completely static. Only the image region changes.
- Crossfade order: accra → lagos → saopaulo → manchester → loop. 7–8 seconds per image, 1–1.2s opacity crossfade (CSS transitions, no slider library, no JS animation loop beyond a lightweight interval or CSS animation).
- No arrows, no dots, no swipe, no pause button - this is ambient scenery, not navigable content.
- `prefers-reduced-motion: reduce` → no crossfade; show only the real Accra photo, static.
- Optional caption: a small, unobtrusive location/currency tag that updates with each image ("Accra · GHS", "Lagos · NGN", "São Paulo · BRL", "Manchester · GBP") to make the works-worldwide story explicit. Keep it subtle; skip if it clutters mobile.

**Performance (non-negotiable):**
- The Accra image is the LCP element: `<link rel="preload">` it, serve responsive sizes (`srcset` with mobile-first widths), modern format (AVIF/WebP with fallback), explicit width/height to prevent CLS.
- The other 3 portraits load lazily AFTER page load completes (e.g., on `load` event or first idle), so the crossfade begins only once its images are ready. Never block first paint on images 2–4.
- Compress hard: target ≤120KB per portrait at mobile display size. Total added weight for the hero feature ≤ ~400KB deferred.
- If images 2–4 haven't loaded (slow connection), the hero simply stays on the real photo - graceful degradation, no blank flashes.

## Part 2: WhatsApp-Status-style story player

New section, placed between the "Sound familiar?" pain section and the dark comparison section (or where flow reads best - use judgment, but it must appear in the first half of the page). Section heading suggestion: "Watch a business get paid - 30 seconds" with a one-line subhead ("From scribbled receipts to money in. This is the whole journey.").

**Format & interaction (mirror Status/Stories conventions exactly - the audience's muscle memory is the feature):**
- A 9:16 vertical frame, centered, phone-like proportions with rounded corners; on desktop it sits at a comfortable fixed height (~70vh max) rather than full-bleed.
- Segmented progress bars across the top, one segment per frame (5), filling left-to-right on a timer.
- Auto-advance ~5s per frame once the section enters the viewport (IntersectionObserver); do NOT start timers off-screen.
- Tap/click right two-thirds = next frame; left third = previous. Press-and-hold pauses (touch) / hover pauses (desktop). Swipe optional, not required.
- Each frame carries one short caption line, positioned like a Status caption:
  1. "Friday. Job done. Now the hard part - the paperwork." 
  2. "Or… 60 seconds in KraaFo."
  3. "One tap. All channels - or just the one your client uses."
  4. "Delivered. No 'did you get my invoice?'"
  5. "Paid. That's the whole story."
- After frame 5, show a final overlay state (not a 6th story frame): "Your story next?" + the primary CTA button (Create your first invoice - free). The story's end IS the conversion moment.
- `prefers-reduced-motion` → no auto-advance; frames advance on tap only, progress bars static.
- Accessibility: the player is keyboard-operable (arrow keys), frames have alt text, captions are real text (not baked into images), and the section is preceded by a text summary so the content isn't image-only for screen readers.

**Performance:**
- Lazy-load all story frames (they're below the fold). Load frame 1 when the section approaches the viewport; prefetch subsequent frames as the player starts.
- Frames 3 and 4 (the UI frames you build) should be rendered as optimized static images for the player (not live components) to keep it light - build them from the real UI, export, compress.

## Part 3: Supporting placements

1. `desktop-tailor` goes beside the document-history / "all your documents" feature content (or the features grid), with copy tying it in: works on any device - phone on the job, laptop in the evening.
2. The dark comparison section's existing mock cards stay as-is - they already carry that section.
3. Review section: unchanged - one real review, initial avatar. No AI faces near it (hard rule above).
4. OG image: consider regenerating the social share image (og:image) to feature the real Accra photo with the headline - shared links are a distribution surface. Keep 1200×630, under 300KB.

## Part 4: Verification & acceptance

- [ ] Hero: static copy/CTAs; 4-image crossfade; correct order; reduced-motion fallback; no slider library added
- [ ] LCP: Accra image preloaded; mobile Lighthouse performance ≥ 85 AFTER this feature ships; CLS unchanged (explicit dimensions everywhere)
- [ ] Portraits 2–4 verified to load post-load/idle (network tab check), total deferred weight ≤ ~400KB
- [ ] Story player: 5 frames in order (AI, AI, real send-modal UI, real WhatsApp-style delivery mock, real Accra photo); Status-style progress bars; tap zones; hold-to-pause; viewport-triggered start; end-state CTA overlay; keyboard + reduced-motion + alt-text accessibility
- [ ] Frame 4's message text matches the real server-sent WhatsApp message format and says Sparkle & Shine (never any other business name)
- [ ] No AI face anywhere carries a customer name, quote, or verified label; alt text follows the rule
- [ ] Yellow-van image set: not used anywhere
- [ ] Re-run Phase 1/2 curl checks (prerendered h1s, canonicals, sitemap) to confirm no regressions
- [ ] Report: list of image files used and where, final compressed sizes, and Lighthouse mobile score before/after
