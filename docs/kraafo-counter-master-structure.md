# KraaFo Counter — Master Structure (Universal Product)
**Supersedes:** kraafo-counter-discovery-brief.md. Same core idea, restructured to be explicitly global — not a market-specific build. Ghana/West Africa remains the founder's beachhead for go-to-market and in-person onboarding; the product itself must carry zero region-specific assumptions.

---

## 1. The one-line vision

**One fast action — something changes hands, a document is produced instantly, sent digitally, and optionally printed — that works identically for a tailor in Accra, a café in Lisbon, a delivery rider in Lagos, and a market stall in Nairobi.**

Not four products. One primitive, wearing different clothes depending on who's using it.

## 2. The spectrum this serves (one continuum, not separate products)

| Segment | Example | What "Quick Transaction" looks like for them |
|---|---|---|
| Service business (existing KraaFo) | Cleaner, freelancer, contractor | Invoice/quote/receipt, sent remotely — already built |
| Shop counter | Boutique, pharmacy, hardware store, anywhere in the world | Item(s) + payment method → Receipt |
| Small food & restaurant counter | Café, food truck, takeaway, small restaurant | Menu item(s) + payment → Receipt (kitchen tickets are a later extension, see §6) |
| Delivery / courier | Rider, last-mile courier, any country | Sender/recipient + parcel + fee → Waybill |
| Market / street trader | Open-air stall, roadside seller | Same as shop counter, leanest possible version — paper-first, works with patchy connectivity |

All five are the same underlying record — `type: 'invoice' | 'receipt' | 'waybill'`, same document engine, same delivery engine, same account. The only thing that changes per segment is which fields are shown and which output (digital vs. print) is emphasized by default.

## 3. What "universal" actually requires (be deliberate about this — don't let regional habits leak into the product)

- **Currency & language:** already true of KraaFo (multi-currency, any symbol). Keep it that way — no hardcoded currency, no hardcoded language strings in Counter.
- **Payment methods:** the existing list (mobile money providers, PayPal, card, bank transfer, cash) already spans regions. Don't narrow it for Counter; if anything, confirm card/POS-terminal reconciliation is representable for markets where mobile money isn't dominant (Europe, US).
- **Hardware & printing standards:** WebUSB, Web Serial, and WebBluetooth are global web standards, not region-specific — the same thermal printer protocol (ESC/POS) is used by shops in London and market stalls in Accra. No region-specific hardware assumptions needed.
- **Connectivity assumptions:** design for "sometimes offline, sometimes on a slow connection" as a spectrum every segment can hit (a London café's WiFi drops too), not as an "Africa problem." If offline handling gets built, it benefits everyone equally.
- **Onboarding defaults, not hardcoded behavior:** the "does this business default to print-first or send-first?" question from our last conversation gets resolved as a **user-configurable setting**, not a geography-based assumption. A market trader with patchy data and a café in a city with perfect WiFi might both want print-first, or both want digital-first — let the business choose during setup, don't guess based on where they are.

## 4. The core primitive — "Quick Transaction" (detailed spec)

**Entry:** one prominent action from the main app — "New Transaction."

**Step 1 — What's the type?** Sale (shop/restaurant/market) or Delivery (courier/waybill). Remembers the last choice as default for repeat use.

**Step 2 — Build it, fast:**
- Tap from a saved "quick items" list (name + price, no stock/variant tracking in v1), OR
- **Scan a barcode** with the phone camera to look up and add a saved item instantly (this is a lookup/add action, not an inventory decrement — no stock system required), OR
- Free-type a custom line (for one-off items, or delivery details: recipient, parcel, fee)
- Adjust quantity/price inline, add more lines

**Step 3 — Payment / status:**
- Sale: payment method (cash / mobile money / card / bank transfer)
- Delivery: status (Picked up → Delivered), optional confirmation capture (photo or simple signature — evaluate for v1 vs. v1.1)

**Step 4 — One tap: Send & Print** (or Send only, or Print only)
- Send: fires through the existing WhatsApp/SMS/email delivery engine, exactly as invoices do today
- Print: if a supported printer is connected (Android/desktop Chrome/Edge via WebUSB/WebBluetooth/Web Serial), fires the narrow-format ESC/POS receipt. iOS/Safari: clearly messaged as digital-only in v1, never a silent failure.

**Always visible on the same screen:** a running log of today's transactions — this is the notebook-replacement moment, the same emotional core as the original KraaFo pitch, now happening at counter speed.

## 5. Non-goals for this phase (universal now, not Africa-specific — same discipline, bigger reason)

Still explicitly out of scope, because they're where mature, funded incumbents already live (Loyverse, Square, Toast, etc.), globally, not just in one region:
- Real-time stock/inventory tracking (scan-to-add is in scope; scan-to-decrement-stock is not)
- Multi-location/multi-store management
- Staff shift and cash-drawer reconciliation
- Table maps, kitchen display systems, tab/bill-splitting for restaurants
- Offline-first local sync engine (revisit only if usage data demands it)
- Any marketplace, discovery, or directory layer — that idea from our last conversation is real but is a *year-two* conversation, built on top of real usage data, not built now

## 6. Natural future extensions (not now — listed so we don't lose the thread, not so we build them yet)

- Kitchen ticket printing for small food counters (print a duplicate slip to a second printer) — a light addition to the existing print pipeline, not a new system
- Simple recurring "quick items" templates per business type (a coffee shop's list looks different from a hardware store's) — a convenience layer over what's already in §4
- Network/WiFi ESC/POS printers as a stretch goal — would also close the iOS printing gap since it doesn't depend on WebUSB/WebBluetooth
- Paid tier for higher-volume users (multi-staff access, reporting) — natural home for the "early access, early pricing" promise already made in onboarding email, but only once real usage exists

## 7. Naming & entry point

Working name stays **"Counter"** as a mode inside the existing KraaFo app and account — no separate login, no separate brand yet. Reasoning unchanged from before: reuse everything valuable (auth, branding engine, document engine, delivery engine), build only what's genuinely new (the fast tap-through UI, the quick-items list, the barcode scan, the print pipeline).

## 8. Priority segments — who we build and go for first, and why

The spectrum in §2 is real and all of it is servable by the same product. But "everyone can use it" is not a go-to-market plan — it's a reason to be disciplined about order. Ranked by pain severity, transaction frequency, and — critically — whether Frederick can reach them the same way the first ten KraaFo users were reached (in person, WhatsApp, short demo video):

**Tier 1 — build and onboard first: shops and delivery/courier riders.**
Both are high-frequency (many transactions a day, so the tool earns its keep fast), both have a real and current pain (notebook/memory for shops, "did you actually deliver it" disputes for riders), both are reachable through the exact playbook already proven to work, and neither requires a new document type — Receipt covers shops and small food counters, a light Waybill variant covers delivery. Printing genuinely matters to both as a trust artifact. Start here.

**Tier 2 — same product, harder distribution: market and street traders.**
The pain is real and the market is enormous, but this segment is the most price-sensitive, most physically dispersed, and hardest to reach with the current playbook. This is a distribution problem, not a product problem — the same build serves them once Tier 1 has proven the core flow and there's a repeatable way to reach them (possibly through Tier 1 users themselves, who often know traders directly).

**Tier 3 — a genuinely different sales motion: transport companies, larger retail chains.**
A bus company needs the Ticket document type (net new build, not a template) and is a B2B sale — a relationship, a contract, possibly custom integration — not a self-serve signup. This is a real, larger opportunity, but it runs on a different clock with different effort than the bottom-up growth that's gotten KraaFo here. Worth keeping on the roadmap, wrong place to start.

## 9. Monetization — how this makes money

**The core stays free**, same as KraaFo today, for two reasons: it protects the trust the brand has already earned, and it keeps the product working as a growth engine, not just a product. That second point matters more here than in the invoice product — **a printed receipt is a physical object that travels.** It sits in a customer's bag or wallet, gets seen by other people, in a way a digital PDF never does. The same discreet "Sent with KraaFo" credit and `?ref=` link from the existing viral loop should have a printed equivalent (a small footer line, ideally with a scannable QR code back to kraafo.com) — this could end up being the strongest version of the referral loop across the whole product, not an afterthought.

**Real, provable ways to charge, once there's usage to charge against:**
- **Volume-based tier** — free up to a generous daily/monthly transaction count, paid beyond. Ties price directly to value delivered: a shop doing 5 transactions a day gets full value for free; one doing 200 a day is clearly running a business on the tool and can support paying for it.
- **Multi-staff seats** — a shop with several cashiers needs multiple people using Counter under one business account at once. Real, standard, provable value.
- **Reporting beyond the raw daily log** — best-sellers, weekly/monthly summaries. Small build on top of data that already exists once transactions are flowing.
- **Hardware bundle/referral** — not selling printers or paper directly (wrong business, thin margins), but a referral or bundle deal with a thermal printer supplier for new sign-ups, removing the "which printer do I even buy" friction while earning a small margin.
- **Transport/larger retail (Tier 3)** — a separate B2B pricing conversation entirely: monthly licensing, custom branding, possibly a booking-system integration. Not part of the self-serve pricing model above.

**One placeholder, stated plainly rather than guessed:** where the free/paid line actually sits (what "high volume" means in real transactions/day) gets set from real usage data once Tier 1 users are live, not decided now. Everything above is the menu of honest options; the exact numbers are a later decision informed by evidence.

---

## Part 0 — Codebase audit (do this first, before any building)

Same audit as before, now confirmed relevant regardless of target region — report back before Part where UI/schema work begins:

1. **Auth & account model** — can a logged-in user access Counter without a separate login?
2. **Branding engine** — reusable for a new narrow-format document layout?
3. **PDF generation engine** — can it output narrow thermal widths (58mm/80mm), not just A4/letter? This is the biggest open technical question.
4. **Delivery engine** — fully reusable as-is for Counter-generated documents?
5. **Document schema** — does the current receipt schema map cleanly onto a walk-in sale (no client required), or does Counter need a leaner schema?
6. **Dashboard/revenue tracking** — can Counter transactions feed the existing dashboard, or do they need a parallel view?
7. **Client/recipient model** — reusable for delivery's sender/recipient fields, or does that need its own lightweight model?
8. **Barcode scanning feasibility** — confirm a browser-based barcode detection approach (native `BarcodeDetector` API where supported, fallback library like ZXing/QuaggaJS elsewhere) and note browser/device support gaps to plan around.

Report findings before any UI or schema decisions are locked.

## Acceptance checklist (build phase, after Part 0 review)

- [ ] Part 0 audit complete and reviewed first
- [ ] Quick Transaction flow works for Sale and Delivery types, sharing one underlying data model
- [ ] Barcode scan-to-add works via phone camera, no special hardware required
- [ ] Narrow-format PDF renders correctly at 58mm and 80mm
- [ ] Digital send confirmed working identically to existing KraaFo delivery
- [ ] WebUSB and WebBluetooth printing functional on real Android + desktop Chrome, tested against a real printer
- [ ] iOS/Safari shows an honest "printing unavailable on this device" message; digital send still fully works
- [ ] Print-first vs. send-first is a per-business setting, not a hardcoded regional assumption
- [ ] Today's transaction log visible, feeding the existing dashboard
- [ ] No currency, language, payment-method, or connectivity assumption is hardcoded to one region
- [ ] Non-goals from §5 confirmed absent from the build
