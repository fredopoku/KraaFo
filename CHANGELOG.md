# Changelog

All notable changes to KraaFo are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## [2026-07-19]

### Changed
- Replaced all em dashes in marketing copy with context-appropriate punctuation (colons, commas, parentheses) for cleaner typographic tone across all landing pages

---

## [2026-07-18] — Premium Redesign

### Added
- **6 SEO long-tail landing pages** — dedicated pages for invoice generator, receipt generator, quote generator, WhatsApp invoice, Ghana invoice (GHS + MTN MoMo), and freelance invoice; each page has its own colour theme and live invoice mockup
- **Dark hero** — `#020617` background with animated gradient blob drift, white dot grid overlay, and SVG wave transition to the white body across all landing pages
- **3D tilt invoice mockups** — mouse-driven `perspective()` tilt on all landing page invoice cards via the `use3DTilt` hook
- **Scroll-triggered section reveals** — `IntersectionObserver` + staggered `animatedeup` animations on features, steps, and FAQ sections
- **Animated gradient headline** — `gradShift` keyframe on a multi-stop gradient applied via `-webkit-background-clip: text` on all hero headings
- **Social proof avatars** — coloured-ring portrait clusters with name, city, and role on all SEO pages
- `use3DTilt` hook — reusable `mousemove` / `mouseleave` 3D tilt hook returning `ref` and `style` for any element
- `animate-blob`, `animate-blob-slow`, `animate-blob-slower` Tailwind animation classes — 14/20/26s `blobDrift` keyframe
- `animate-grad-text` CSS utility — `gradShift` keyframe on clipped background text
- Dark unified nav across all SEO pages — `rgba(2,6,23,0.88)` glass nav with `backdrop-filter: blur(20px)`
- Dark CTA and dark footer sections on the main landing page — unified with SEO page styling

### Fixed
- Logo (KraaFo icon) invisible on dark backgrounds — `LogoMark` now accepts a `dark` prop that applies `filter: brightness(0) invert(1)` to the PNG image
- `LogoMark` in dark CTA and dark footer missing the `dark` prop
- Broken footer route `/whatsapp-invoice` corrected to `/whatsapp-invoice-generator`
- Duplicate `style` prop TypeScript error on `HeroCrossfade` div — merged into a single style object

---

## [2026-07-18] — SEO Landing Pages (two-column hero)

### Added
- Two-column hero layouts on all 6 SEO landing pages — headline and CTA on the left, live document mockup on the right
- Schema markup (`application/ld+json`) on all landing pages for rich search results
- Long-tail `<title>`, `<meta description>`, and `<h1>` tags on each SEO page

---

## [2026-07-11] — Performance and Accessibility

### Changed
- SEO prerender moved from build step to server start — fixes missing prerendered HTML on Render deploys where the build host has no Chrome
- Hero portrait images reduced in size; Google Analytics script deferred — improves LCP and TBT scores
- Hero crossfade timing tuned: 2.8s display / 0.7s transition (was 4.5s / 0.5s)
- How-it-works stepper auto-advance slowed to 2.5s (was 3s) for readability

### Fixed
- React hooks violations (hooks called conditionally) in Generator
- Missing `key` props and stale closure issues causing console warnings
- Accessibility: missing `aria-label` attributes on icon-only buttons

---

## [2026-07-10] — Phase 3: Living Hero, Story Player, Recycle Bin

### Added
- **Crossfade hero portraits** — rotating portrait gallery in the landing page hero using `IntersectionObserver`-driven fade transitions; real user photos with smooth 4.5s crossfade
- **WhatsApp-Status story player** (`StoryPlayer.tsx`) — swipeable story cards on the landing page showing a realistic user flow from job completion to invoice delivery, styled after the WhatsApp Status interface
- **Recycle bin / soft delete** — deleted invoices, receipts, quotes, and clients move to a trash bin with restore capability; permanent delete from trash
- **One-tap invoice to receipt** — mark an invoice as fully paid and it converts to a receipt in a single click
- **Hosted invoice preview** (`InvoiceView.tsx`) — shareable `/view/:id` URL that clients open directly from a WhatsApp or SMS link; no sign-in required

### Fixed
- Admin dashboard soft-delete blind spots — trash entries now correctly visible and restorable across all document types

---

## [2026-07-09] — Landing Page Restructure

### Added
- Interactive how-it-works stepper with auto-advance and manual navigation
- Per-route static HTML prerender — unique metadata and `<h1>` for all sitemap routes so every page has crawlable content without JavaScript

### Changed
- Landing page restructured to 7 clear sections; removed placeholder slots and unnecessary desktop mockup
- Hero replaced browser/laptop frame mockup with authentic portrait photography
- Route code-splitting for all pages — each route is a separate lazy-loaded chunk

### Fixed
- Landing page credibility issues — removed fabricated testimonial quote; fixed inconsistent stat claims

---

## [2026-07-06] — Admin Dashboard Redesign and SMS

### Added
- **SMS delivery** — opens the native Messages app with a pre-filled message containing the document summary; shown alongside WhatsApp and Email throughout the landing page and generator
- **Hosted invoice preview link** — WhatsApp and SMS messages include a `/view/:id` link so clients can open the invoice in any browser without needing the app
- Tabbed admin dashboard navigation — users, analytics, feedback, subscribers, changelog in separate tabs
- Conversion funnel and growth trend charts in the admin analytics view
- Country, city, device, browser, and referrer breakdowns in site analytics
- Page drill-down — click any page row in admin analytics to see every individual visit with timestamp, location, device, and browser
- Mobile-responsive admin dashboard

---

## [2026-07-05] — Copy and Mobile Polish

### Changed
- Rewrote landing page copy — sharper human tone, removed AI filler phrases and em dashes throughout
- Mobile hero `h1` size reduced; section padding and feature row gaps tightened for small screens

---

## [2026-06-06] — Community Features

### Added
- **Star rating and feedback** — visitors rate KraaFo (1–5 stars) and leave a comment directly on the landing page; ratings visible in the admin dashboard with average score
- **Newsletter subscription** — email capture on the landing page with a branded welcome email sent on sign-up; one-click unsubscribe via a unique token in every email
- **Broadcast composer** — write a subject and message in the admin panel and send to all active subscribers in one click; send history shown below the composer
- Mobile PDF sharing — on iOS and Android, the native share sheet opens so users can save to Files, share via WhatsApp, AirDrop, etc. using the Web Share API

---

## [2026-06-02] — Email Switch and Analytics

### Changed
- Email delivery switched from Gmail SMTP to Resend API — more reliable delivery and better logging
- Google Analytics added to track site traffic

---

## [2026-06-01] — Initial Launch

### Added
- Invoice, Receipt, and Quote builder with live PDF preview
- Line items with quantities, units, discounts (flat or %), tax rate, due dates, notes, and payment terms
- Branded PDF generation via headless Chromium (Puppeteer / `@sparticuz/chromium` for containerised environments)
- Client address book with search
- Quote status tracking (Draft → Sent → Accepted → Declined) and one-click quote-to-invoice conversion
- AI Smart Fill — suggests line items, service descriptions, and payment terms using Claude (primary), Groq (fallback), and built-in templates (offline fallback)
- Document import — upload an existing invoice or receipt (image or PDF) and the AI populates the form; falls back to local Tesseract OCR
- Custom branding — company colours, logo upload, and auto brand-colour extraction; logo appears on all generated PDFs
- Signature support — draw on screen or upload an image; embedded in PDFs
- Triple-channel delivery — send a document to a client on WhatsApp, SMS, and Email simultaneously in one tap
- Client address book with save-and-reuse across documents
- Payment details — bank account, PayPal, M-Pesa, MTN Mobile Money, Airtel Money, Telecel Cash; auto-generated QR code on invoices
- Multi-currency support — USD, GBP, EUR, GHS, NGN, ZAR, and more
- Multi-device access — data stored on the server; sign in from any browser or device
- Web App Manifest — install KraaFo to the home screen on iOS and Android
- Privacy-first website analytics — page views tracked server-side via `navigator.sendBeacon` with no cookies or personal data; geo-resolved via ip-api.com; bot-filtered
- HTTP security headers via Helmet — `X-Frame-Options`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`
- Org isolation — every API endpoint derives the organisation ID from the verified JWT; cross-org data access is impossible
- CORS exact-match allowlist — no wildcard or prefix patterns
- Cloudflare Turnstile bot protection on setup, feedback, and newsletter signup forms
- In-app What's New changelog — admin-managed entries visible to all users without redeployment
- Admin dashboard — all organisations with usage stats, site-wide analytics, feedback management, subscriber list, broadcast history, changelog editor
- SEO pre-rendering — landing page, generator, and changelog pages served as static HTML at startup so search crawlers see full content

---

[Unreleased]: https://github.com/fredopoku/KraaFo/compare/HEAD...HEAD
