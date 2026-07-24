# KraaFo - Engineering Brief for Claude Code

**Project:** kraafo.com - free invoicing SaaS. Create branded invoices/receipts in under a minute, delivered via WhatsApp, SMS, or email. Target users: small service businesses (salons, cleaners, plumbers, freelancers), mobile-first audience.

**Context:** The site launched, got an initial traffic spike from direct sharing, then dropped to near zero. An audit found two root causes: (1) the site ships an empty HTML shell rendered entirely client-side, so crawlers see no content and the site is effectively invisible to search; (2) the landing page has credibility contradictions and is roughly twice as long as it should be. This brief fixes both, in priority order.

**Before starting:** Detect the stack (check package.json, framework config files). The SEO fixes in P0 have different implementations depending on whether this is Vite+React SPA, CRA, Next.js already, or plain HTML+JS. Adapt accordingly and state which path you took.

---

## P0-1: Fix credibility contradictions (do this first - it is copy changes only, ship immediately)

The page currently makes three mutually contradictory claims that a visitor sees in one scroll:

- Hero: "Loved by 2,000+ businesses worldwide" with five avatar photos
- Stats bar: "33+ documents generated"
- Testimonials: "5 out of 5 · 1 verified review" - while showing THREE testimonial cards, two with stock-photo headshots

**Changes:**

1. **Remove** "Loved by 2,000+ businesses worldwide" and the five avatar photos from the hero. Replace the social-proof line with true claims only, e.g.: `Free to use · No credit card · Sends via WhatsApp, SMS & email`
2. **Remove** the "33+ documents generated" counter and "Used in 26+ countries" from the stats bar. Keep only verifiable/true items: "Free to use · No credit card needed" and "Sends via WhatsApp, SMS & Email". (Reinstate a live counter later only once the number is impressive.)
3. **Testimonials:** keep only the genuinely real review (Theresa, Jun 2026 - plain initial avatar, reads authentic). Delete "Sarah M." and "James T." cards (stock headshots + unverifiable companies). Change the section header from "Trusted by businesses worldwide" to something honest at this stage, e.g. "What early users say". Keep "5 out of 5 · 1 verified review" only if it sits next to exactly one review - one honest review is stronger than three doubtful ones.
4. Sweep the whole page (and meta descriptions / OG tags) for any other invented numbers and remove them.

**Acceptance:** no claim on the page contradicts another; every number shown is real.

## P0-2: Make the site crawlable (server-rendered / static HTML content)

`curl https://kraafo.com` currently returns meta tags and an empty body. All content is painted client-side. This must change so that the full landing content (h1, section copy, FAQ) exists in the HTML response.

**Implementation by stack:**

- **Vite + React (most likely):** either migrate the marketing page to a static-generation setup, or add a prerender step (`vite-plugin-ssr` / `vike`, or `react-snap`-style postbuild prerender) that outputs fully rendered HTML for `/` and any marketing routes. The app itself (invoice editor) can stay client-side; only marketing pages need real HTML.
- **Next.js:** ensure the landing page is statically generated (no `use client` wrapping the whole page content; content in server components; `next build` output contains the copy).
- **Plain HTML + JS injection:** move the landing copy directly into `index.html` markup; keep JS for interactivity only.
- **Minimum fallback if none of the above is feasible right now:** hard-code the h1, subheadline, section headings, feature copy, and full FAQ text into the static `index.html` so crawlers get real text before hydration.

**Also add:**

1. `robots.txt` at the site root - allow all, reference the sitemap:
   ```
   User-agent: *
   Allow: /
   Sitemap: https://kraafo.com/sitemap.xml
   ```
2. `sitemap.xml` listing the homepage and any other public routes (e.g. /setup landing, /whats-new).
3. `<link rel="canonical" href="https://kraafo.com/">` on the homepage.
4. JSON-LD structured data in the head:
   - `SoftwareApplication` schema: name KraaFo, applicationCategory BusinessApplication, operatingSystem Web, offers price 0 / priceCurrency USD, description matching the meta description.
   - `FAQPage` schema mirroring the on-page FAQ questions and answers exactly (Is KraaFo really free? / Do I need an account to download a PDF? / Can I send invoices on WhatsApp? / Can I add my logo and brand colors? / Does it work in my country and currency?).
5. Ensure the page has exactly one `<h1>` (the hero headline) and a logical h2/h3 hierarchy for section headings.

**Acceptance:** `curl -s https://kraafo.com | grep -i "chasing"` returns the hero headline; view-source shows full section copy and FAQ text; robots.txt and sitemap.xml resolve; structured data validates (test with Google Rich Results test logic - well-formed JSON-LD, required fields present).

## P1-1: Restructure the landing page (cut from ~13 sections to 7)

**New section order - remove everything not listed:**

1. **Hero** - keep headline "Send invoices your clients take seriously. Get paid without chasing." Keep the subcopy about creating invoices in under a minute + download free with no account. Remove the stock photo of the woman + "2 min" badge; replace with a product visual (see P1-3). Two buttons only (see P1-2).
2. **"Sound familiar?" pain quotes** - keep as is, plus the "Your brand on the invoice / Your invoice in their WhatsApp / You, looking like a company twice your size" card. This section is strong.
3. **Dark comparison section ("Your client can't say they didn't get it")** - keep. This is the strongest section on the page: the WhatsApp/SMS/Email mock cards and the "Every other invoicing app: email only VS KraaFo: WhatsApp + SMS + Email + PDF" comparison. Keep the "Start sending smarter" area but relabel the button per P1-2.
4. **How it works ("From zero to paid in minutes")** - rebuild as the interactive stepper described in P1-3.
5. **Features grid** - trim from 8 cards to 6. Keep: Smart Fill, Auto Branding, Professional Invoices, Instant Receipts, WhatsApp SMS & Email, Works Worldwide. Fold Tax & Discounts and Print-Ready PDFs into FAQ answers or feature card body copy.
6. **Review + FAQ** - Theresa's single review, then the FAQ accordion (keep all 5 questions; ensure the content is in the HTML, not lazy-injected).
7. **Final CTA** - "Ready to send your first document?" block. Keep.

**Delete entirely:**

- The standalone "Invoice from wherever you work" section (plumber photo) - its Smart Fill point is already covered in step 1 of How It Works and the Smart Fill feature card.
- The standalone "Clients get it on WhatsApp in seconds" section (painter photo) - fully redundant with the dark comparison section. WhatsApp sending is currently explained 5+ times on the page; after this restructure it appears in the hero subcopy, the dark section, one feature card, and one FAQ. That is enough.
- The standalone "See your money. Know your business." section - fold the dashboard mock card into the How It Works step 3 visual ("get paid / track it").
- The "All your documents, always at your fingertips" section - fold "documents saved & searchable, one-tap re-send" into a feature card or FAQ line.
- The "Upload your logo. We handle the rest." section - the Auto Branding feature card already covers it; optionally reuse its nice setup-wizard mock as that card's visual.
- **The newsletter popup ("Stay ahead with KraaFo")** - delete the popup completely. It fires mid-scroll and competes with the sign-up goal.
- **The full-width purple "Stay in the loop" newsletter section** - delete. Replace with a single quiet line in the footer: "Get product updates" + email field, nothing more. One conversion goal per page: creating an invoice.

## P1-2: One CTA voice

The page currently uses seven different CTA labels (Get Started / Create your first invoice - free / Try without signing up / Start free today / Try it free / Get started free / Start sending smarter). Consolidate:

- **Primary CTA (identical everywhere, same style):** `Create your first invoice - free`
- **Secondary CTA (hero + how-it-works only):** `Try without signing up`
- Nav button: primary label, or short form `Get started` is acceptable in the nav only.
- Every primary button routes to the same destination (signup/setup flow); the secondary routes to the no-account editor.

## P1-3: Interactive "How it works" stepper (replaces static 3 steps and the animation idea)

Build the three steps as an interactive product-state walkthrough, NOT an auto-rotating image carousel and NOT stock photos. Each step shows the actual product state:

- **Step 1 - Create in 60 seconds:** mini mock of the invoice form (client name, service, amount, "Generate invoice" button). Reuse/adapt the existing invoice card visual.
- **Step 2 - Send by WhatsApp, email or SMS:** mock WhatsApp chat bubble with the PDF attachment + "Delivered ✓✓" state (the asset from the dark section works).
- **Step 3 - Get paid, stay in control:** the "Invoice #0042 paid" confirmation + the mini dashboard stats card (Revenue / Outstanding / Overdue) salvaged from the deleted dashboard section.

**Behavior:**

- Tappable/clickable step tabs (01 / 02 / 03) with an animated transition between panels (simple fade/slide, CSS transitions, ~300ms).
- Auto-advance every 4–5 seconds, with a visible progress indicator on the active tab; pause permanently on first user interaction.
- Always show which step is active so a visitor arriving mid-cycle isn't lost.
- On mobile (majority audience): the same component full-width; if implementing scroll-triggered advancement instead of timed, use IntersectionObserver - but the tabbed auto-advance version is the accepted default.
- Place the primary CTA button directly beneath step 3's panel - the "get paid" moment is the conversion moment.
- Implementation: plain CSS/JS or the site's existing framework. No video files, no Lottie unless already in the bundle, no autoplay media. All step content must exist in the HTML (visible or toggled via classes), never lazy-injected, so crawlers index it.

## P2: Performance & assets

1. Remove the deleted sections' stock photos from the bundle. For any images kept, serve compressed WebP/AVIF with explicit width/height, `loading="lazy"` below the fold.
2. Target: mobile Lighthouse performance ≥ 85, LCP < 2.5s on simulated 4G. The audience is mobile-first on variable connections - treat mobile perf as the primary budget.
3. Preload the hero's critical image/font; defer non-critical JS.
4. Keep total page weight reasonable (< ~1.5MB on first load is a good target after cutting the photos).

## Copy rules (apply throughout)

- Keep the existing voice - it's good. Especially keep: the hero headline, the "Sound familiar?" quotes, and "Every other invoicing app sends an email and waits."
- No invented numbers, ever. If a stat isn't real, the claim doesn't ship.
- One idea per section; if a section repeats something already said above it, cut the repeat.

## Final acceptance checklist

- [ ] No contradictory or fabricated claims anywhere on the page or in meta/OG tags
- [ ] `curl` of the homepage returns the full landing copy (h1, sections, FAQ) without JS execution
- [ ] robots.txt + sitemap.xml live; canonical tag present; JSON-LD (SoftwareApplication + FAQPage) valid
- [ ] Exactly one h1; logical heading hierarchy
- [ ] Page is 7 sections in the specified order; deleted sections and both newsletter surfaces are gone
- [ ] Exactly two CTA labels used site-wide, consistently
- [ ] How-it-works stepper: tappable, auto-advancing with pause-on-interaction, product-state visuals, CTA under step 3
- [ ] Mobile Lighthouse ≥ 85; no layout shift from images
- [ ] WhatsApp sending is mentioned at most 4 times on the page (hero subcopy, dark section, one feature card, one FAQ)

## Out of scope for this brief (founder to-dos, not code)

- Set up Google Search Console, verify the domain, submit sitemap.xml, request indexing of the homepage
- Create brand profiles (LinkedIn, X, Instagram, Google Business Profile) linking to kraafo.com - the "kraafo" name collides with krafo.com, kreafo.com, and kraaft.com in search, so owning the brand SERP matters
- Verify the analytics snippet survived the last deploy (open the site in incognito and confirm the visit registers)
- Future content: pages targeting winnable keywords ("invoice generator Ghana", "send invoice by WhatsApp", "receipt maker for small business") rather than the global "invoice generator" head term
