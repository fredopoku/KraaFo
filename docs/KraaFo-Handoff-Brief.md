# KraaFo - Engineering & Growth Handoff Brief
**Purpose:** Context document for Claude Code working inside the KraaFo codebase.
**Companion file:** `KraaFo-SRS.md` (full requirements spec - treat it as the source of truth for WHAT to build; this brief explains WHY and in what ORDER).
**Date:** July 2026

---

## 1. What KraaFo is

A web app that lets small businesses create professional invoices, quotes, and receipts with automatic logo + brand-color extraction onto the PDF, then deliver them via **email + WhatsApp + SMS** (as a bundle, or per-channel). Email includes a branded summary card + attached PDF. Sending requires an email-verified account. Domain: kraafo.com.

**Strategic direction agreed:** KraaFo is a **global** product, positioned as *"invoice your clients where they actually are - WhatsApp, SMS, and email."* Go-to-market beachhead is WhatsApp-first business markets (e.g., Nigeria, India, Brazil, Ghana, Kenya, Indonesia, Mexico), expanding to head terms later. The product must never hardcode Africa-only assumptions: any currency, any locale.

**Product thesis:** Today KraaFo is a feature (make PDF + send). It must become a product that owns the full job-to-be-done:
**Create → Deliver → Track → Remind → Get Paid → Record (receipt) → Repeat.**
Every task below serves that loop. North-star metric: **documents sent per week by repeat senders.**

---

## 2. Externally verified findings (from outside the codebase)

These were observed from the live site/product on ~July 5, 2026. Claude Code should verify root causes internally.

| # | Finding | Evidence | Severity |
|---|---|---|---|
| F1 | **Site body invisible to non-browser clients.** HTTP fetches of kraafo.com return ONLY meta tags (title/description), zero body content. Cause is either full client-side rendering, or the bot-protection layer (deployed ~Nov 1, 2025: "bots are blocked before they can touch the server") blocking all non-browser agents including search crawlers. | Repeated fetches returned title + meta only | CRITICAL - blocks all SEO |
| F2 | **Zero search presence.** Web searches for "kraafo" and "kraafo.com invoice" return no results about the product - not even the homepage for the brand name. | Search performed July 2026 | CRITICAL |
| F3 | **Meta description contradicts product.** Meta says "Free - try without signing up" but the app requires email signup. | Meta tag vs. owner confirmation | HIGH - conversion + trust |
| F4 | **Analytics anomalies.** All-time: 651 views, 258 sessions; sessions −84% vs prev (bot filter removed fake traffic - real baseline ≈ 6–13 sessions/day); avg session duration 87m43s (tracking artifact - investigate timer/heartbeat logic); bounce 73%. Dashboard tracks vanity metrics, no funnel events. | Admin dashboard screenshot | HIGH |
| F5 | **WhatsApp/SMS messages are dead ends.** Long formal message telling the recipient to "check your email" - no link to view the invoice. The "sent via KraaFo" footer has no hyperlink. | Delivery screenshots | HIGH - UX + growth loop |
| F6 | **PDF copy bugs.** Default Notes on an INVOICE read "This receipt serves as confirmation of services rendered and payment recieved" (wrong doc type + typo "recieved"). Terms say "Net 7" while issue June 1 → due July 1 (Net 30) - no validation. Quantity shows "4 session" (no pluralization). | PDF screenshot | HIGH - trust |
| F7 | **Inconsistent money formatting.** WhatsApp/email show `$6200.00`; PDF shows `$6,200.00`. | Screenshots | MEDIUM |
| F8 | **No hosted document pages, no view tracking, no reminders, no auto-receipts, no reason to return.** Product ends at send. | Product walkthrough | STRATEGIC |

---

## 3. Codebase audit checklist (do this first)

Claude Code: before changing anything, answer these against the actual code and report back:

1. **Rendering:** Is the marketing site CSR (React/Vue SPA), SSR, or static? What framework? Does the server response contain body HTML?
2. **Bot protection:** What is it (Cloudflare rule, custom middleware, third-party)? Does it allowlist verified crawlers (Googlebot, Bingbot) and link-preview bots (WhatsApp `WhatsApp/`, Facebook `facebookexternalhit`, Twitterbot)? How does it verify (UA string only, or reverse-DNS/IP verification)?
3. **robots.txt / sitemap.xml:** Do they exist? What do they allow?
4. **Signup gate placement:** Where exactly does auth block the flow - before the builder, or at send? What would moving it to send-only require?
5. **Email sending:** Which provider? Is SPF/DKIM/DMARC configured on the sending domain? Is Reply-To set to the user's email? Same domain used for anything marketing-like?
6. **Message templates:** Where do WhatsApp/SMS/email bodies live? Are they per-channel templates or one shared string?
7. **PDF generation:** What library/service? Where do default Notes/Terms strings live? Is there a single currency/number formatter or ad-hoc formatting per surface?
8. **Data model:** Do Document/Send/Event entities exist? Is there any event tracking (sent/delivered/viewed)? Any analytics SDK installed?
9. **Doc numbering & terms:** Is due date derived from terms or free-typed? Per-business number sequences?
10. **Quota/abuse controls:** Any rate limiting on sends? Any content screening?

---

## 4. Work plan (strict priority order)

### P0 - Unblock search (target: this week)
- **T1. Crawler allowlist.** Configure bot protection to pass verified search + preview crawlers. Prefer provider "verified bots" category over raw UA matching. *(AC: `curl -A "Googlebot" ...` and plain `curl` both receive full HTML; WhatsApp link preview renders.)*
- **T2. Server-render/prerender public pages** (landing, future template/guide pages). If SPA migration is heavy, interim: prerendering service or static HTML for marketing routes; app itself may stay CSR. *(AC: `curl https://kraafo.com` returns H1 + ≥300 words body copy.)*
- **T3. robots.txt + sitemap.xml + canonical tags.** Register Google Search Console AND Bing Webmaster Tools; submit sitemap; request indexing. *(AC: homepage indexed; "kraafo" ranks #1 within ~2 weeks.)*
- **T4. Truthful meta + OG tags.** Align meta description with actual product behavior (see T5); add Open Graph tags for WhatsApp/Facebook previews.

### P1 - Conversion & trust (week 1–2)
- **T5. Move signup gate to send step.** Guest can create, preview, download PDF with no account; verified email required only to deliver. Signup framed as benefit ("save your details & history"). Restore truth of "try without signing up." *(SRS FR-AUTH-1..4; AC-2 in SRS.)*
- **T6. Fix document copy bugs:** type-aware default Notes/Terms (invoice never says "receipt"); fix "recieved" typo; due date auto-calculated from terms with mismatch warning; pluralize unit labels. *(SRS FR-DOC-3/4/6; AC-5.)*
- **T7. Single money formatter** used by PDF, email, WhatsApp, SMS, and future hosted page. *(SRS FR-DOC-5.)*
- **T8. Email deliverability:** verify SPF/DKIM/DMARC; set Reply-To = sender's email; plan a separate subdomain for any future marketing mail. *(SRS NFR-DEL.)*

### P2 - Close the loop (week 2–4) - the feature→product transformation
- **T9. Hosted document pages** `kraafo.com/i/{token}` (and /q/, /r/): mobile HTML view of the document, Download PDF, contact-sender actions, unguessable ≥128-bit token, OG tags, footer CTA "Send professional invoices like this - free" with UTM. *(SRS module HOST - the centerpiece.)*
- **T10. Rewrite delivery messages.** WhatsApp/SMS ≤4 lines: business name, doc number, amount, due date, hosted link. Every "via KraaFo" footer (email, PDF, page) becomes a hyperlink with UTM. SMS must fit 1 segment. *(SRS FR-DEL-3/4; AC-3.)*
- **T11. Event tracking + view notifications.** Events: sent, delivered, viewed, downloaded, paid. On first view, notify sender ("<Client> viewed <doc> ✓") via email + opt-in WhatsApp. Status chips in history: Draft/Sent/Viewed/Overdue/Paid. *(SRS module TRACK; AC-4.)*
- **T12. Funnel analytics.** Instrument: invoice_started, invoice_completed, pdf_downloaded, sent, returned_7d. Replace admin vanity dashboard with funnel + repeat-senders. Investigate/fix the 87-minute session-duration artifact. *(SRS FR-ADMIN-1.)*
- **T13. Mark-paid + auto-receipt.** Manual mark paid (full/partial) → one-tap receipt generated referencing the invoice, sendable via same channels. Overdue flagging + one-tap polite reminder resend. *(SRS FR-PAY-1/2, FR-REM-1/3.)*

### P3 - Growth engine (week 3+, parallel where possible)
- **T14. Structured data:** Organization, WebApplication (price 0), FAQPage JSON-LD on public pages.
- **T15. Programmatic SEO system:** one page template + content sheet → long-tail pages ("send invoice on WhatsApp", "invoice generator <country>", "<trade> invoice template"). 3–5 pages/week. Beachhead keyword countries to confirm with owner (candidates: Nigeria, India, Brazil, Ghana, Kenya).
- **T16. Lifecycle emails** (activation nudge: signed up but never sent; weekly outstanding digest) - on a separate sending identity from transactional.
- **T17. Abuse controls before scale:** rate limits per account, content screening on sends (invoice tools are phishing vectors; protects the whole domain's deliverability).

### Phase 2 (specified in SRS, do NOT build yet)
Payment collection on hosted page (mobile money/bank/card via PSP; webhook → auto-paid → auto-receipt), KraaFo fee per collected payment, paid tier (remove footer branding, recurring invoices, multi-business/accountant mode).

**Sequencing rule:** nothing from P2/P3 ships before T1–T3 are verified done. Search unblocking is the bottleneck for everything.

---

## 5. Explicit decisions already made (don't relitigate)
1. Global product, WhatsApp-first-market beachhead GTM. No Africa-only hardcoding.
2. Free creation/download without account; verified account required to send.
3. Bundle send stays the default; per-channel stays available.
4. Monetization = payments (Phase 2), not gating basics. Free tier keeps a linked "Created with KraaFo" footer.
5. No cold email marketing to end users. Partner outreach (accountants/associations) and lifecycle email only; any outbound uses a separate domain.
6. Vanity metrics (views, bounce, session duration) demoted; funnel + repeat senders are the dashboard.

## 6. Open questions for the owner (Claude Code: surface these if code makes them decidable)
- Q1. Confirm the 2–3 beachhead countries for the first keyword/page batch.
- Q2. Which WhatsApp BSP and SMS gateway are in use, and their per-message costs → sets free-tier quotas (SRS FR-DEL-5).
- Q3. Current stack + hosting (determines SSR approach: Next.js migration vs prerender service vs static marketing pages).
- Q4. Is there an existing Event/analytics table to extend, or greenfield?
- Q5. Preferred PSP(s) for Phase 2 per beachhead market.

## 7. Definition of done for this engagement's first milestone
- Plain `curl https://kraafo.com` returns real page content.
- "kraafo" search on Google shows the site.
- Guest can download a PDF without an account; send prompts signup.
- No document can render mismatched type copy, the typo, or a terms/due-date contradiction.
- A delivered WhatsApp message contains a working hosted-page link, and the sender gets a "viewed" notification when it's opened.
