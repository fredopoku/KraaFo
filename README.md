<p align="center">
  <img src="client/public/krafo-logo.png" alt="KraaFo Logo" width="90" />
</p>

<h1 align="center">KraaFo — Professional Invoices & Receipts</h1>

<p align="center">
  Create, brand, and deliver professional invoices, receipts, and quotes in under a minute.<br/>
  Built for freelancers and service businesses worldwide. No account required.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat-square&logo=sqlite" />
  <img src="https://img.shields.io/badge/PDF-Puppeteer-40B5A4?style=flat-square" />
  <img src="https://img.shields.io/badge/AI-Claude%20%2B%20Groq-FF6B35?style=flat-square" />
  <img src="https://img.shields.io/badge/Email-Resend-000000?style=flat-square" />
  <img src="https://img.shields.io/badge/Bot%20Protection-Cloudflare%20Turnstile-F38020?style=flat-square&logo=cloudflare" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
</p>

---

## Screenshots

### Landing Page
![KraaFo Landing Page](docs/screenshots/landing.png)

### Invoice / Receipt Generator
![KraaFo Generator](docs/screenshots/generator.png)

### Business Dashboard
![KraaFo Dashboard](docs/screenshots/dashboard.png)

### Organisation Setup
![KraaFo Setup](docs/screenshots/setup.png)

---

## Features

### Documents
- **Invoice, Receipt & Quote Builder** — line items, quantities, units, discounts (flat or %), tax rate, payment tracking, due dates, notes, and terms
- **Live Preview** — see the branded PDF update in real time as you type
- **PDF Export** — pixel-perfect branded PDFs via headless Chromium (Puppeteer)
- **Mobile PDF Sharing** — on iOS and Android, download/preview triggers the native share sheet (Save to Files, WhatsApp, AirDrop, etc.) using the Web Share API
- **Document History** — all saved documents stored and searchable from the toolbar

### AI & Automation
- **Smart Fill** — picks your industry and client type, then suggests relevant service descriptions, line items, notes, and payment terms automatically (Claude → Groq → built-in templates fallback chain)
- **Import from Document** — upload an existing invoice or receipt (image or PDF) and the AI reads it and populates the form; falls back to local OCR (Tesseract.js) if no API key is set
- **Auto Quote→Invoice** — convert a saved quote into a full invoice in one click

### Branding
- **Custom Colours** — set primary, secondary, and accent colours; every document reflects your brand
- **Logo Upload** — upload your company logo; brand colours are auto-extracted from it
- **Signature Support** — draw on screen or upload an image; appears on all generated PDFs
- **Web App Manifest** — add KraaFo to your home screen (iOS & Android) and get a full-screen experience with the KraaFo icon

### Clients & Delivery
- **Client Address Book** — save and reuse client details across documents
- **Email Delivery** — send branded PDF invoices directly to clients via Resend (or custom SMTP); works for invoices, receipts, and quotes
- **WhatsApp & SMS** — one-tap share to WhatsApp or open in Messages (mobile-ready); message text adapts based on whether email was also sent
- **Quotes Management** — dedicated quotes list, status tracking (Draft → Sent → Accepted → Declined)

### Payments
- **Payment Details** — add bank account, PayPal, M-Pesa, MTN Mobile Money, Airtel Money, Telecel Cash
- **QR Code** — auto-generated payment QR on invoices linking to PayPal or mobile money

### Security & Bot Protection
- **Cloudflare Turnstile** — invisible/managed bot protection on the Setup page (new users), feedback form, and newsletter signup — no CAPTCHA friction for real users
- **Graceful degradation** — if Turnstile keys are not configured the forms work normally; the verification gate is skipped in development

### Website Analytics
- **Privacy-first page tracking** — every page view is recorded server-side via `navigator.sendBeacon`; no cookies, no third-party scripts, no personal data stored
- **Geo data** — country, region, and city resolved from IP via ip-api.com with an in-memory cache; Local/unknown IPs are filtered out
- **Bot filtering** — known crawler and bot user-agents are excluded before any data is stored
- **Session tracking** — lightweight `sessionStorage` session ID groups views from the same visit without identifying users

### Admin Dashboard (`/admin`)
- **User overview** — all registered organisations with invoice/receipt/quote counts and last-active date
- **Website analytics** — total views, unique sessions, daily bar chart (30 days), top pages, countries with flag emojis, cities, devices, browsers, referrers
- **Page drill-down** — click any page row to see every individual visit with timestamp, location, device, and browser
- **Feedback management** — all submitted ratings and comments with average score
- **Subscribers** — full subscriber list and broadcast history
- **Changelog editor** — publish and remove What's New entries visible to all users
- **Protected by `ADMIN_TOKEN`** — all admin endpoints require `x-admin-token` header; the frontend stores the token in `sessionStorage`

### Ratings & Feedback
- **Star Rating Widget** — visitors rate KraaFo (1–5 stars) and leave a comment directly on the landing page
- **Feedback Dashboard** — the owner sees all submitted reviews with average rating, individual comments, names, and dates
- **Expandable Review List** — show/collapse all reviews in the dashboard panel

### Newsletter & Broadcasts
- **Subscriber Sign-up** — email capture form on the landing page; sends a branded welcome email on subscription
- **One-click Unsubscribe** — every broadcast email contains a unique unsubscribe link (`/unsubscribe?token=...`) that opts the user out instantly
- **Broadcast Composer** — in the dashboard, write a subject and message body and send to all active subscribers in one click; supports multi-paragraph plain-text formatting
- **Send History** — recent broadcasts shown below the composer with subject line and recipient count

### What's New / Changelog
- **In-app changelog** — users see recent feature releases on the landing page and dashboard
- **Admin-managed** — publish and remove entries from the admin panel; no redeployment needed

### Internationalisation
- **Multi-currency** — USD, GBP, EUR, CAD, AUD, GHS, NGN, ZAR and more
- **12+ Industries** — Cleaning, Plumbing, Electrical, Landscaping, Personal Training, Tutoring, IT Support, Photography, Pet Services, Hair & Beauty, Catering, and more

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, ts-node-dev |
| Database | SQLite via better-sqlite3 |
| PDF Generation | Puppeteer (headless Chromium) |
| AI — Smart Fill | Anthropic Claude (primary) → Groq (Llama 3) → built-in templates |
| AI — Document Import | Groq vision models + pdf-parse + Tesseract.js OCR fallback |
| Image Processing | Sharp, node-vibrant (brand colour extraction) |
| Email — Invoices | Resend API (primary) or Nodemailer (custom SMTP) |
| Email — Broadcasts | Resend API (subscriber welcome + update emails) |
| Mobile PDF | Web Share API (navigator.share) with blob-URL anchor fallback |
| Bot Protection | Cloudflare Turnstile (Managed mode — server-side verification) |
| Analytics | Custom — `navigator.sendBeacon` + ip-api.com geo + SQLite |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/fredopoku/KraaFo.git
cd KraaFo

# Install all dependencies (frontend + backend)
npm run install:all
```

### Environment Setup

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in your values:

```env
PORT=3001
NODE_ENV=development
UPLOAD_DIR=./uploads
DB_PATH=./data/krafo.db

# Frontend URL (used in unsubscribe links inside broadcast emails)
FRONTEND_URL=https://kraafo.com

# Admin dashboard password — set a long random string
ADMIN_TOKEN=your_secret_admin_token_here

# AI — Smart Fill (optional, falls back to built-in templates)
# Primary: get a key at console.anthropic.com
ANTHROPIC_API_KEY=your_anthropic_key_here

# AI — Smart Fill fallback (optional)
# Get a free key at console.groq.com
GROQ_API_KEY=your_groq_key_here

# AI — Document Import vision fallback (optional)
GEMINI_API_KEY=your_gemini_key_here

# Email — Resend (recommended — used for invoice delivery, welcome emails, broadcasts)
# Get a free key at resend.com
RESEND_API_KEY=your_resend_key_here
RESEND_FROM=invoices@kraafo.com

# Email — Custom SMTP (alternative to Resend, per-org configuration)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=your@gmail.com

# Bot Protection — Cloudflare Turnstile (optional — forms work without it)
# Get free keys at dash.cloudflare.com → Turnstile
TURNSTILE_SECRET=your_turnstile_secret_key_here
```

For the frontend, create `client/.env`:

```env
# Cloudflare Turnstile site key (optional — widget is hidden if not set)
VITE_TURNSTILE_SITEKEY=your_turnstile_site_key_here
```

> The app runs fully without any API keys — Smart Fill uses built-in templates, document import falls back to local OCR, email features require at minimum a Resend key, and Turnstile bot protection is skipped if keys are not configured.

### Run in Development

```bash
# Start both frontend and backend together
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |

Or run separately:

```bash
npm run dev:server   # backend only
npm run dev:client   # frontend only
```

---

## Project Structure

```
KraaFo/
├── client/                          # React frontend (Vite)
│   ├── public/
│   │   ├── krafo-logo.png
│   │   └── manifest.json            # Web App Manifest (home screen icon)
│   └── src/
│       ├── components/
│       │   ├── Logo.tsx             # KraaFo logo component
│       │   ├── SignaturePad.tsx     # Draw / upload signature modal
│       │   └── Turnstile.tsx        # Cloudflare Turnstile widget (reusable)
│       ├── pages/
│       │   ├── Landing.tsx          # Marketing page + feedback widget + newsletter signup
│       │   ├── Setup.tsx            # Organisation setup wizard (Turnstile gate for new users)
│       │   ├── Dashboard.tsx        # Business overview + feedback panel + broadcast composer
│       │   ├── Generator.tsx        # Invoice / receipt / quote builder
│       │   ├── Admin.tsx            # Admin dashboard — users, analytics, feedback, subscribers
│       │   ├── Clients.tsx          # Client address book
│       │   ├── Quotes.tsx           # Quotes list + status management
│       │   ├── Changelog.tsx        # What's New page
│       │   └── Unsubscribe.tsx      # Email unsubscribe confirmation page
│       ├── hooks/
│       │   └── useOrg.ts            # Organisation data hook
│       └── utils/
│           ├── api.ts               # Typed API client (incl. mobile PDF + community APIs)
│           ├── cn.ts                # Tailwind class helper
│           ├── industryData.ts      # Industry → line item map
│           └── tracker.ts           # Privacy-first page view tracker (sendBeacon)
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── db/
│   │   │   └── schema.ts            # SQLite schema (organizations, invoices, clients,
│   │   │                            #   quotes, subscribers, feedback, broadcasts,
│   │   │                            #   page_views, changelog_entries, …)
│   │   ├── middleware/
│   │   │   └── adminAuth.ts         # x-admin-token header guard for admin routes
│   │   ├── routes/
│   │   │   ├── organizations.ts
│   │   │   ├── invoices.ts
│   │   │   ├── quotes.ts
│   │   │   ├── clients.ts
│   │   │   ├── deliver.ts           # Invoice/quote email, WhatsApp delivery, payment links
│   │   │   ├── ai.ts                # Smart Fill + document import
│   │   │   ├── pdf.ts               # PDF generation + serving
│   │   │   ├── analytics.ts         # Dashboard KPI metrics (per-org)
│   │   │   ├── track.ts             # Privacy-first website page view tracking
│   │   │   ├── admin.ts             # Admin endpoints — users, site analytics, views drill-down
│   │   │   ├── upload.ts            # Logo upload + colour extraction
│   │   │   ├── feedback.ts          # Star ratings + feedback submission (Turnstile protected)
│   │   │   ├── subscribers.ts       # Newsletter subscribe / unsubscribe (Turnstile protected)
│   │   │   ├── broadcasts.ts        # Send update emails to all subscribers
│   │   │   └── changelog.ts         # What's New entries (admin create/delete, public read)
│   │   ├── services/
│   │   │   ├── emailService.ts      # Invoice emails + welcome + broadcast via Resend
│   │   │   ├── aiService.ts         # Claude / Groq / Gemini / OCR logic
│   │   │   ├── pdfService.ts        # Puppeteer PDF rendering
│   │   │   └── imageService.ts      # Logo processing + colour extraction
│   │   ├── utils/
│   │   │   └── turnstile.ts         # Cloudflare Turnstile server-side verification helper
│   │   └── templates/
│   │       └── invoiceTemplate.ts   # HTML invoice / receipt / quote template
│   └── uploads/                     # Uploaded logos & signatures (git-ignored)
│
└── docs/
    └── screenshots/                 # README screenshots
```

---

## API Reference

### Core

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/organizations/:id` | Get organisation by ID |
| POST | `/api/organizations` | Create organisation |
| PUT | `/api/organizations/:id` | Update organisation |
| GET | `/api/invoices` | List invoices / receipts (filterable by type, status, client) |
| POST | `/api/invoices` | Create invoice / receipt |
| PUT | `/api/invoices/:id` | Update invoice / receipt |
| DELETE | `/api/invoices/:id` | Delete invoice / receipt |
| GET | `/api/quotes` | List quotes |
| POST | `/api/quotes` | Create quote |
| PUT | `/api/quotes/:id` | Update quote |
| POST | `/api/quotes/:id/convert` | Convert quote to invoice |
| DELETE | `/api/quotes/:id` | Delete quote |
| GET | `/api/clients` | List clients (supports search) |
| POST | `/api/clients` | Create client |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |

### Delivery & PDF

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/deliver/email/:invoiceId` | Send document PDF via email (invoices, receipts, and quotes) |
| GET | `/api/deliver/whatsapp/:invoiceId` | Get WhatsApp share link |
| GET | `/api/deliver/payment-links/:invoiceId` | Get payment method details |
| POST | `/api/deliver/generate-dkim` | Generate DKIM key pair |
| POST | `/api/deliver/test-email` | Send a test email |
| GET | `/api/pdf/:invoiceId` | Download or preview invoice PDF |
| GET | `/api/pdf/quote/:quoteId` | Download or preview quote PDF |

### AI & Upload

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ai/status` | Check if AI is enabled |
| POST | `/api/ai/suggest` | Smart Fill — suggest line items and terms |
| POST | `/api/ai/enhance` | Improve a line item description |
| POST | `/api/ai/parse-receipt` | Import document via AI / OCR |
| POST | `/api/upload/logo` | Upload company logo + extract brand colours |
| GET | `/api/analytics` | Dashboard KPI metrics (per-org) |

### Tracking & Analytics

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/track` | Record a page view (bot-filtered, geo-resolved) |

### Admin (requires `x-admin-token` header)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | All organisations with usage stats |
| GET | `/api/admin/analytics` | Site-wide analytics — overview, countries, cities, daily chart, pages, devices, browsers, referrers |
| GET | `/api/admin/analytics/views` | Individual page view records (filterable by page, paginated) |

### Community

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/feedback` | Submit a star rating + message (Turnstile protected) |
| GET | `/api/feedback` | List all feedback with average rating |
| GET | `/api/feedback/highlights` | Top-rated feedback highlights for the landing page |
| POST | `/api/subscribers` | Subscribe an email to updates (Turnstile protected) |
| GET | `/api/subscribers` | List all active subscribers |
| GET | `/api/subscribers/unsubscribe/:token` | Unsubscribe via token from email link |
| POST | `/api/broadcasts` | Send a broadcast email to all subscribers |
| GET | `/api/broadcasts` | List recent broadcast history |
| GET | `/api/changelog` | List published What's New entries |
| POST | `/api/changelog` | Publish a new changelog entry (admin only) |
| DELETE | `/api/changelog/:id` | Remove a changelog entry (admin only) |

---

## Document Import

The Import feature accepts:

- **Images** — JPG, PNG, WebP (Groq vision AI or Tesseract local OCR)
- **PDFs** — text-based or scanned (Groq + pdf-parse or local OCR fallback)

With an Anthropic or Groq API key, the AI extracts client info, line items, dates, totals, notes, and payment terms in seconds. Without a key the app falls back to local OCR and pattern matching — no data leaves your machine.

---

## Bot Protection

KraaFo uses [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) for bot protection — a privacy-friendly alternative to CAPTCHA that is invisible to real users.

Protected surfaces:
- **Setup page** — new users see a one-time verification before the setup wizard loads
- **Feedback form** — prevents spam ratings
- **Newsletter signup** — prevents fake subscriptions

Server-side verification uses the `TURNSTILE_SECRET` environment variable. If the secret is not set the check is skipped (development mode). If Cloudflare is unreachable the request is allowed through (fail-open).

---

## Roadmap

- [x] Invoice, Receipt & Quote builder
- [x] AI Smart Fill & document import
- [x] Email & WhatsApp delivery
- [x] Mobile PDF sharing (Web Share API)
- [x] Client ratings & feedback system
- [x] Newsletter subscription & broadcast emails
- [x] Changelog / What's New page
- [x] Bot protection (Cloudflare Turnstile)
- [x] Privacy-first website analytics
- [x] Admin dashboard (users, analytics, feedback, subscribers, changelog)
- [ ] Recurring invoice schedules
- [ ] Cloud sync / multi-device
- [ ] Stripe / PayPal payment link integration
- [ ] Client portal (view & pay invoices online)
- [ ] Multi-user / team accounts
- [ ] Feature request voting board

---

## License

MIT © Frederick Opoku Afriyie
