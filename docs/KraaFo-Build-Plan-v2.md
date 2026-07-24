# KraaFo - Build Plan v2 (Post-Audit, Consolidated)
**Audience:** Claude Code, working in the KraaFo repo.
**Supersedes:** the work-plan section (§4) of `KraaFo-Handoff-Brief.md`. The SRS (`KraaFo-SRS.md`) remains the requirements source of truth; the brief's sections 1–2 and 5–6 (context, findings, decisions, open questions) still apply.
**Inputs merged here:** Section-3 codebase audit results (completed) + external reviewer amendments + landing-page story rewrite.
**Date:** July 2026

---

## 1. Confirmed reality (from the audit - treat as fact)

| Area | Confirmed state |
|---|---|
| Rendering | React 18 + Vite CSR SPA served by Express. Production serves empty `<div id="root">` shell. |
| Root cause of invisibility | `scripts/prerender.cjs` (Puppeteer) finds no Chrome on Render build and **exits 0 silently** → prerendered HTML never generated → empty shell deployed. **Not** a bot blocker. |
| Bot protection | None site-wide. Turnstile on 3 forms only. No crawler allow/blocklist in code. (Cloudflare dashboard must be checked by human - see §7.) |
| robots/sitemap | Both exist and are sane. GSC ownership verified (`googlefa4579cb375f8f3d.html`). Sitemap wrongly includes `/setup`; lastmod hardcoded. |
| Signup gate | At **Save AND PDF download** (`Generator.tsx` ~lines 250, 290, 581) - contradicts agreed decision #2 and makes the meta description false. WhatsApp "send" is a client-side `wa.me` link (works for guests); email send requires saved invoice → account. |
| Email | Resend, from `invoices@kraafo.com`. Reply-To correctly = org email. Marketing/welcome mail uses the SAME identity (risk). User-SMTP path exists and bypasses Resend. SPF/DKIM/DMARC state unknown from code (human task). |
| Templates | 3 surfaces, 3 disconnected templates. TWO competing WhatsApp templates: server `deliver.ts:43` (shorter) and client `Generator.tsx:440 buildMobileMessage()` (long formal letter - the one users actually send, and the F5 dead-end). No hosted links anywhere (pages don't exist). |
| SMS | Not a channel - device handoff via `sms:` protocol. No gateway integrated. |
| PDF | Puppeteer-core (`pdfService.ts`) rendering HTML → PDF. **Note: PDFs work in production, so Chrome IS resolvable at runtime** (see T2 amendment). |
| Defaults | Org stores ONE `notes` + ONE `payment_terms` shared across all doc types → root cause of receipt-language-on-invoice. |
| Due date | Hardcoded `addDays(today(), 30)`; ignores `payment_terms`; no recalculation, no mismatch warning. |
| Money formatting | Fragmented: server surfaces use bare `toFixed(2)` (no thousands separator); client `formatCurrency()` (api.ts:238) used only in UI. |
| Data model | No `Send` table, no `Event` table, no `hosted_token` column. `reminders` table exists (1/7/14-day overdue emails only). `page_views` = marketing analytics only. |
| Analytics | GA4 loaded, **zero custom events fired**. Pageviews only. |
| Abuse controls | **`/api/deliver/email` has NO rate limit** - unlimited sends per account. `express-rate-limit` installed but applied to auth routes only. |

---

## 2. Deploy 1 - "Become visible + stop the bleeding" (this week)

### T2′. Fix the prerender (the critical fix) - amended approach
The audit proposed Option A (apt-get Chrome) / Option B (static HTML). **Do this first instead:**

- **T2.1 - Trace how `pdfService.ts` successfully resolves Chrome in production** (PDFs demonstrably work, so a working mechanism already exists at runtime - puppeteer-core executable path, bundled Chromium package, or Render env). Make `prerender.cjs` use the **exact same resolution mechanism**. This is likely a smaller change than either audit option. Investigate whether the prerender runs at a build phase where that mechanism isn't yet available, and if so move it (e.g., run prerender as a post-deploy/start-time step writing to disk, or same phase as whatever provisions Chrome).
- **T2.2 - If (and only if) T2.1 dead-ends:** Option A via `npx puppeteer browsers install chrome` in `buildCommand` (no root required - plain `apt-get` typically fails on Render's Node runtime), with `PUPPETEER_EXECUTABLE_PATH` pointed at the installed binary. Option B (build-time static landing HTML with no Chrome dependency) remains the final fallback and is acceptable for `/` alone.
- **T2.3 - Make silent failure impossible (mandatory, whichever path):**
  - `prerender.cjs` exits **1** (fails the build) when Chrome is missing or output is not written.
  - Post-build assertion step: build fails unless `dist/index.html` contains the landing H1 and ≥300 words of body text.
- **AC:** plain `curl https://kraafo.com` returns full landing HTML (H1 + ≥300 words). Same for `/generator` and `/changelog`.

### T3′. Sitemap/robots/canonicals
- Remove `/setup` from sitemap.xml. Add canonical tags to `/generator` and `/changelog`. (Dynamic lastmod: nice-to-have, not blocking.)
- Note for P2: hosted document routes (`/i/`, `/q/`, `/r/`) must be `Disallow`ed in robots.txt and excluded from sitemap when built.

### T4′. Truthful meta + OG (interim wording)
- Until T5 ships, meta description = **"Create professional invoices free - sign up to send and save your history."** (Current "try without signing up" is false while the gate sits at download.)
- og:description: mention WhatsApp delivery. Keep existing og:image, Twitter card, SoftwareApplication JSON-LD (all confirmed fine; they surface once T2′ lands).
- **When Deploy 2's T5 ships, restore the no-signup claim** - see §3.

### T-SEC-0. EMERGENCY: rate-limit delivery (ship in Deploy 1, non-negotiable)
- `/api/deliver/email` currently allows unlimited sends → one abuser poisons the shared `invoices@kraafo.com` Resend reputation and every customer's invoices go to spam.
- Apply `express-rate-limit` per authenticated account (keyed on user/org id, not IP): suggested 20 sends/hour, 100/day, HTTP 429 with clear message. Log limit hits for admin visibility. Content screening is P3; the cap cannot wait.

### Deploy-1 exit checks
1. `curl https://kraafo.com | grep -c "<h1"` ≥ 1 and body word count ≥ 300.
2. Build fails locally if Chrome is removed (guardrail proven).
3. A test account hitting deliver 21× in an hour receives 429.

---

## 3. Deploy 2 - "Conversion, trust, and the story" (week 1–2)

### T5′. Move signup gate to send-only
- Remove `isDemo` guards on PDF download and (if gated) preview; keep on save/history and on `api.deliver.email` (JWT already required).
- New guest-PDF path: generate PDF from posted form state directly (no saved invoice ID required).
- **Protect the new endpoint** (Puppeteer rendering is expensive; unauthenticated = DoS magnet): IP rate limit (e.g., 10 PDFs/hour/IP) + Turnstile token on the guest download action (Turnstile integration already exists in the codebase - reuse the pattern).
- Signup prompt at send, benefit-framed: "Create a free account to send - your details and invoice history are saved."
- Restore meta description: "Free - create and download invoices with no signup. Sign up to send by email & WhatsApp."
- **AC:** SRS AC-2 passes; meta claims match behavior.

### T6′. Document correctness (root-cause fixes)
- **Due date derived from terms:** parse `payment_terms` (Net N) → `due_date = issue_date + N`; `useEffect` recalculates on terms change; manual override allowed with a visible mismatch warning when terms ≠ implied due date. Kill the hardcoded `addDays(today(), 30)`.
- **Type-aware defaults at the data-model level:** replace the single org `notes`/`payment_terms` with per-type defaults (e.g., `invoice_notes`, `receipt_notes`, `quote_notes` columns or a JSON defaults object) + sane built-in fallbacks per type. Invoices must never render receipt language. Migrate existing org.notes → invoice_notes. Proofread all built-in default strings (fix "recieved").
- **Pluralization** of unit labels (1 session / 4 sessions).

### T7′. One shared money formatter
- Single module (e.g., `shared/formatMoney.ts`) using `Intl.NumberFormat` with org currency; consumed by PDF HTML template, email HTML + plain text, WhatsApp template, and React UI (replace bare `toFixed(2)` everywhere and reconcile with client `formatCurrency`). **AC:** `$6,200.00` identical across all surfaces (SRS AC-5).

### T8′. Consolidate WhatsApp template + message rewrite
- Delete one of the two competing templates; single shared template module used by both server `deliver.ts` and client `buildMobileMessage()`.
- New copy (≤4 lines, conversational): business name + doc type/number, amount + due date, link line, reply/contact line. Until hosted pages exist (P2), the link line points to kraafo.com; swap to `kraafo.com/i/{token}` when T9 lands. No "check your email" phrasing anywhere.
- Same brevity pass for the SMS handoff text (must fit 1 SMS segment, 160 chars).

### T-DEL-2′. Split marketing email identity (cheap now, expensive later)
- Welcome/newsletter/broadcast mail moves to a second verified Resend domain or subdomain (e.g., `hello@news.kraafo.com`). Transactional invoice mail stays on `invoices@kraafo.com`. Config + template from-address change only.

### T-LP. Landing page rewrite - story-driven (ship with or immediately after T2′ so Google indexes the story version)

**Principle:** customer is the hero, the payment-chasing indignity is the villain, KraaFo is the guide. Sell the transformation ("look like a real company, get paid without begging"), prove it with specifics (60 seconds, free, WhatsApp). Short sentences, WhatsApp-group vocabulary ("get paid", "your client"), never SaaS-speak ("streamline billing workflows").

**Page structure (implement as prerendered sections on `/`):**
1. **Hero:** H1 *"Send invoices your clients take seriously - and get paid without chasing."* Sub: *"Branded invoices delivered straight to WhatsApp or email. Free, in under a minute."* CTA button: *"Create your first invoice - free"* (append "no signup needed" only after T5′ ships). Generator or live preview visible immediately below.
2. **Villain (pain) section** - three short pain lines, e.g.: *"The Word-doc invoice that looks nothing like your work." / "The 'did you see my invoice?' message you hate sending." / "The client who swears it never arrived."* (Placeholder copy - refine from VoC mining, §7.)
3. **The turn (after-state):** side-by-side visual - branded PDF next to a WhatsApp delivery on a phone. Caption: *"Your brand on the invoice. Your invoice in their WhatsApp. You, looking like a company twice your size."*
4. **How it works - 3 steps:** *Create in 60 seconds → Send to WhatsApp, email & SMS at once → Download free.* (Add "Know when it's viewed" as step 4 when P2 ships.)
5. **Proof strip:** live counter or static count of invoices created, 2–3 real user quotes when available, "Free for the essentials. No card required."
6. **FAQ** (mirrors FAQPage JSON-LD - add that schema here, pulling T14 forward since the page is being rebuilt anyway): Is it really free? / Do I need an account? / Can I send on WhatsApp? / Can I add my logo? / Does it work in my country/currency?
7. Footer: links, changelog, socials.

**Copy status:** the lines above are v1 draft - good enough to ship. A voice-of-customer mining pass (§7, human task) will refine them; do not block Deploy 2 on it.

---

## 4. Deploy 3 / P2 - "Close the loop" (weeks 2–4) - unchanged from brief, with audit-informed notes
- **Data model first:** add `hosted_token` (≥128-bit random) to documents; create `sends` (id, document_id, channel, status, provider_message_id, timestamps) and `document_events` (sent/delivered/viewed/downloaded/reminded/paid) tables. Distinct from the existing `page_views` marketing table - do not conflate.
- **T9 hosted pages** `/i/{token}`, `/q/`, `/r/`: mobile HTML doc view, Download PDF, contact-sender actions, OG tags, footer growth CTA with UTM; robots-excluded. **Extra weight:** because WhatsApp sends are client-side `wa.me` (no delivery status possible), the hosted-page view event is the ONLY "did they see it" signal for the flagship channel.
- **T11 view events + sender notifications** ("<Client> viewed <doc> ✓" email; WhatsApp opt-in later). Status chips Draft/Sent/Viewed/Overdue/Paid (extend existing `reminders` overdue logic).
- **T12 GA4 funnel events:** `invoice_started`, `invoice_completed`, `pdf_downloaded`, `sent`, `returned_7d` via `gtag('event', ...)` (SDK already loaded, zero events currently). Also investigate the 87-minute avg-session artifact in the `page_views` heartbeat/session logic.
- **T13 mark-paid → one-tap auto-receipt** (per-type defaults from T6′ make receipt wording correct by construction).
- **SMS gateway: deliberately deferred.** Device handoff stays (free, global, fine for v1). Revisit only when server-side SMS (reminders/notifications) is wanted; then FR-DEL-5 quotas apply to it.

---

## 5. P3 - growth engine (unchanged): programmatic SEO template + content sheet (beachhead countries TBD by owner), lifecycle emails on the marketing identity, send content-screening, Bing/GSC ongoing.

## 6. Standing decisions (unchanged, do not relitigate)
Global product / WhatsApp-first-market GTM; free create+download, account to send; bundle send default; monetize via payments in Phase 2; linked "Created with KraaFo" footer stays on free tier; no cold email to end users; funnel metrics over vanity metrics.

## 7. Human-only tasks (owner, not Claude Code)
1. Cloudflare dashboard: confirm no WAF/challenge rule affects non-browser page loads (5 min).
2. After Deploy 1: GSC → submit sitemap + request indexing for `/`; register Bing Webmaster Tools (import from GSC) + submit sitemap.
3. Resend/DNS: verify SPF, DKIM, DMARC records for kraafo.com; add + verify the marketing subdomain for T-DEL-2′.
4. **VoC mining (feeds T-LP copy v2):** harvest exact customer language - 100+ reviews of Invoice Simple/Wave/Zoho on Trustpilot/G2/app stores (1-star = pains, 5-star = desired outcomes), r/freelance + r/smallbusiness threads on "client won't pay" / invoicing, phrasing used in SME WhatsApp/Facebook groups, and 10 personal messages to existing signups ("What were you using before? What almost stopped you?"). Keep a swipe file bucketed: pains / outcomes / objections / vocabulary.
5. Decide the 2–3 beachhead countries for the first programmatic-SEO batch.

## 8. Definition of done - first milestone
- `curl https://kraafo.com` returns the story-driven landing page content.
- Google shows kraafo.com for a "kraafo" search.
- Guest: create → preview → download PDF with no account; Send prompts signup; verified user completes send without rebuilding.
- Delivery endpoint returns 429 past the cap; guest-PDF endpoint is rate-limited + Turnstile-protected.
- No document can render wrong-type default copy, the typo, or an unwarned terms/due-date contradiction; money formatted identically everywhere.
- WhatsApp message ≤4 lines with a working link; single shared template in code.
- Marketing mail leaves the transactional identity.
