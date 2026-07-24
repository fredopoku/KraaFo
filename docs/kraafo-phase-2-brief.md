# KraaFo - Phase 2 Brief: Delivery Story, Growth Loops & SEO Expansion

**Context:** Phase 1 (prerendering, per-route metadata, sitemap/robots, honest copy, page restructure) is complete and verified in production. This brief covers the next layer: correcting how the product's delivery capability is communicated, building growth mechanics into the product itself, and expanding search surface area.

**Founder's core clarification driving this brief:** KraaFo's sending is NOT "WhatsApp invoicing." It has TWO distinct send modes:
1. **Broadcast mode** - one tap sends the document to all three channels simultaneously: Email + WhatsApp + SMS, PDF attached/linked. Value: delivery certainty - the client cannot claim they didn't receive it.
2. **Single-channel mode** - sender chooses exactly one channel (only email, only SMS, or only WhatsApp). Value: fit and respect - corporate clients who want email only; clients without smartphones/data reachable by SMS; WhatsApp-native clients.

The positioning this unlocks: **"Your invoice reaches your client - whichever way they exist."** Certainty when you need it, precision when you know your client. No competitor owns this framing; the market is email-first with share buttons bolted on.

---

## Part 0: Codebase audit FIRST (do before implementing anything)

I (Claude in chat) can only see the rendered site. You have the code. Verify each of these and adjust the tasks below to match reality - where the code contradicts this brief, the code wins, and note the discrepancy in your summary:

- [ ] Confirm the two send modes exist as described (broadcast to all 3 + individual channel selection). Note the exact UI/UX flow and naming used in-app.
- [ ] Confirm what `/i/`, `/q/`, `/r/` routes are (hypothesis: public shareable short links for invoices, quotes, receipts). Note what a recipient sees when opening one.
- [ ] Confirm the free vs paid tier structure (what's gated, if anything). The viral footer task below depends on this.
- [ ] Confirm whether generated PDFs currently carry any KraaFo branding/footer.
- [ ] Confirm whether quote → invoice conversion exists (turn an accepted quote into an invoice in one tap), and invoice → receipt on payment.
- [ ] Confirm what the delivery messages (WhatsApp/SMS/email body) currently say, verbatim.

Report findings, then proceed.

## Part 1: Two-mode delivery story in the copy (P0 - messaging correction)

The site currently tells only the broadcast half. Fix:

1. **Dark section ("Your client can't say they didn't get it")** - after the one-tap-three-ways beat, add a second beat for single-channel mode. Suggested copy (adjust to house voice):
   > **Or send it exactly one way.** You know your clients. The corporate office that wants email only. The client without a smartphone who lives on SMS. Pick the channel - KraaFo delivers there, PDF included.
   Keep the section's existing structure; this is an addition, not a rewrite.
2. **Hero subcopy** - ensure it names all three channels and hints at choice, e.g. "…send by WhatsApp, SMS, or email - all three at once, or just the one your client uses."
3. **Feature card ("WhatsApp, SMS & Email")** - rewrite body to cover both modes explicitly in one or two sentences.
4. **FAQ** - update "Can I send invoices on WhatsApp?" answer to describe both modes, and add one question: "Can I send to just one channel?" with a short answer. Keep FAQPage JSON-LD in sync with the visible FAQ.
5. **SMS-without-smartphone angle** - somewhere once (feature card or FAQ), state plainly that SMS reaches clients who don't have smartphones or data. This is a differentiator in emerging markets; currently unsaid.

## Part 2: Metadata corrections (P0 - quick)

1. Homepage meta description currently says "delivered by email & WhatsApp" - **SMS is missing from the site's own metadata.** Rewrite homepage (and OG/Twitter) descriptions to name all three channels, e.g.: "…Branded PDFs delivered by WhatsApp, SMS & email - all at once or one at a time. Free, no account needed."
2. Sweep /generator and /changelog descriptions for the same omission.
3. Add "send invoice by SMS", "send invoice by WhatsApp", "invoice SMS delivery" style phrases naturally into on-page copy (NOT keyword-stuffed meta tags - in real sentences users read).

## Part 3: Viral distribution loop in the product (P1 - highest-leverage growth item)

Every document sent lands with a recipient who is often also a small-business owner. Turn delivery into distribution:

1. **PDF footer credit (free tier):** one discreet line at the bottom of free-tier PDFs: "Made free with KraaFo · kraafo.com" - small, grey, professional; must NOT compete with the sender's branding (their brand is the product's promise; the credit is a whisper, not a banner). If a paid tier exists per the Part 0 audit, removing the credit is a paid perk. If no paid tier exists yet, ship the credit on all PDFs and note it as a future upgrade lever.
2. **Delivery message credit:** append a short line to WhatsApp/SMS/email delivery messages where format allows, e.g. "Sent with KraaFo (kraafo.com)". For SMS mind message length/segments - if it would push into a second billable segment, skip it on SMS.
3. **Recipient landing (`/r/`-style short links, if the audit confirms them):** the public document view a recipient opens should include one quiet conversion element: "Like this invoice? Create yours free - KraaFo" linking to the homepage. The recipient IS the next customer; this page is the highest-intent surface KraaFo owns.
4. **Measurement:** all credit links carry a ref parameter (e.g. `kraafo.com?ref=pdf`, `?ref=msg`, `?ref=docview`) so sign-up attribution is visible in analytics. Confirm analytics can read the param; if not, add minimal capture.
5. **Good taste constraints:** never inject credit into the client-facing invoice CONTENT (line items, totals area); footer margin only. Never add credit to paid-tier documents if tier gating exists. No popups on the recipient view.

## Part 4: SEO expansion pages (P1 - triples search surface)

The product covers three document types; the site currently competes for only one keyword family. Create three dedicated, prerendered landing pages:

- `/invoice-generator` - h1 "Free Invoice Generator - Branded PDF Invoices in 60 Seconds"
- `/receipt-generator` - h1 around instant "PAYMENT RECEIVED" receipts (target "receipt maker", "receipt generator")
- `/quote-generator` - h1 around professional quotes, AND (if the Part 0 audit confirms quote→invoice conversion exists) lead its body with the lifecycle story: quote wins the job → one tap converts it to an invoice → receipt fires on payment. That lifecycle is the "all-in-one" claim made concrete.

Each page requires: unique title/meta/canonical/og:url, one h1, real body copy (not homepage clones - write for that document type's searcher), its own small FAQ (3–4 questions) with FAQPage JSON-LD, primary CTA "Create your first [invoice/receipt/quote] - free", and full prerendering verified by curl exactly like Phase 1. Add all three to sitemap.xml. Cross-link the three pages and the homepage in the footer. Decide and note how these relate to the existing /generator route (either /generator becomes the tool and these are marketing pages funneling to it, or redirect strategy - do not create duplicate-content competition between them).

## Part 5: Backlog (P2 - note in code comments / TODO, do not build now)

- Per-industry landing pages (hairdressers, tailors, caterers, mechanics…) leveraging Smart Fill's industry list - one template, N pages, each "invoice template for X".
- Local keyword pages ("invoice generator Ghana" etc.) once the core three pages are indexed.
- Testimonial capture flow: after a user's Nth sent document, in-app prompt asking for a short review (feeds the real-reviews section; the site currently has exactly one genuine review by design).

## Acceptance checklist

- [ ] Part 0 audit findings reported before implementation
- [ ] Both send modes described in: dark section, hero subcopy, feature card, FAQ (+ JSON-LD sync)
- [ ] SMS-without-smartphone benefit stated once on the homepage
- [ ] No meta/OG description anywhere omits any of the three channels
- [ ] Free-tier PDFs and delivery messages carry the discreet credit with ref-tagged links; SMS segment rule respected; paid docs clean (if tiering exists)
- [ ] Recipient document view has the single quiet sign-up element
- [ ] Three landing pages live, prerendered (curl-verified: own h1 + own canonical each), in sitemap, cross-linked, no duplicate-content conflict with /generator
- [ ] Everything mobile-first; no regressions to Phase 1 checks (re-run the Phase 1 curl checks at the end)
