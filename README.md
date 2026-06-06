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

### Clients & Delivery
- **Client Address Book** — save and reuse client details across documents
- **Email Delivery** — send branded PDF invoices directly to clients via Resend (or custom SMTP)
- **WhatsApp & SMS** — one-tap share to WhatsApp or open in Messages (mobile-ready)
- **Quotes Management** — dedicated quotes list, status tracking (Draft → Sent → Accepted → Declined)

### Payments
- **Payment Details** — add bank account, PayPal, M-Pesa, MTN Mobile Money, Airtel Money, Telecel Cash
- **QR Code** — auto-generated payment QR on invoices linking to PayPal or mobile money

### Ratings & Feedback
- **Star Rating Widget** — visitors rate KraaFo (1–5 stars) and leave a comment directly on the landing page
- **Feedback Dashboard** — the owner sees all submitted reviews with average rating, individual comments, names, and dates
- **Expandable Review List** — show/collapse all reviews in the dashboard panel

### Newsletter & Broadcasts
- **Subscriber Sign-up** — email capture form on the landing page; sends a branded welcome email on subscription
- **One-click Unsubscribe** — every broadcast email contains a unique unsubscribe link (`/unsubscribe?token=...`) that opts the user out instantly
- **Broadcast Composer** — in the dashboard, write a subject and message body and send to all active subscribers in one click; supports multi-paragraph plain-text formatting
- **Send History** — recent broadcasts shown below the composer with subject line and recipient count

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
```

> The app runs fully without any API keys — Smart Fill uses built-in templates, document import falls back to local OCR, and email features require at minimum a Resend key.

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
│   ├── src/
│   │   ├── components/
│   │   │   ├── Logo.tsx             # KraaFo logo component
│   │   │   └── SignaturePad.tsx     # Draw / upload signature modal
│   │   ├── pages/
│   │   │   ├── Landing.tsx          # Marketing page + feedback widget + newsletter signup
│   │   │   ├── Setup.tsx            # Organisation setup wizard (4 steps)
│   │   │   ├── Dashboard.tsx        # Business overview + feedback panel + broadcast composer
│   │   │   ├── Generator.tsx        # Invoice / receipt / quote builder
│   │   │   ├── Clients.tsx          # Client address book
│   │   │   ├── Quotes.tsx           # Quotes list + status management
│   │   │   └── Unsubscribe.tsx      # Email unsubscribe confirmation page
│   │   ├── hooks/
│   │   │   └── useOrg.ts            # Organisation data hook
│   │   └── utils/
│   │       ├── api.ts               # Typed API client (incl. mobile PDF + community APIs)
│   │       ├── cn.ts                # Tailwind class helper
│   │       └── industryData.ts      # Industry → line item map
│   └── public/
│       └── krafo-logo.png
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── db/
│   │   │   └── schema.ts            # SQLite schema (organizations, invoices, clients,
│   │   │                            #   quotes, subscribers, feedback, broadcasts, …)
│   │   ├── routes/
│   │   │   ├── organizations.ts
│   │   │   ├── invoices.ts
│   │   │   ├── quotes.ts
│   │   │   ├── clients.ts
│   │   │   ├── deliver.ts           # Invoice email / WhatsApp delivery
│   │   │   ├── ai.ts                # Smart Fill + document import
│   │   │   ├── pdf.ts               # PDF generation + serving
│   │   │   ├── analytics.ts         # Dashboard KPI metrics
│   │   │   ├── upload.ts            # Logo upload + colour extraction
│   │   │   ├── feedback.ts          # Star ratings + feedback submission
│   │   │   ├── subscribers.ts       # Newsletter subscribe / unsubscribe
│   │   │   └── broadcasts.ts        # Send update emails to all subscribers
│   │   ├── services/
│   │   │   ├── emailService.ts      # Invoice emails + welcome + broadcast via Resend
│   │   │   ├── aiService.ts         # Claude / Groq / Gemini / OCR logic
│   │   │   ├── pdfService.ts        # Puppeteer PDF rendering
│   │   │   └── imageService.ts      # Logo processing + colour extraction
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
| POST | `/api/deliver/email/:invoiceId` | Send document PDF via email |
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
| GET | `/api/analytics` | Dashboard KPI metrics |

### Community

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/feedback` | Submit a star rating + message |
| GET | `/api/feedback` | List all feedback with average rating |
| POST | `/api/subscribers` | Subscribe an email to updates |
| GET | `/api/subscribers` | List all active subscribers |
| GET | `/api/subscribers/unsubscribe/:token` | Unsubscribe via token from email link |
| POST | `/api/broadcasts` | Send a broadcast email to all subscribers |
| GET | `/api/broadcasts` | List recent broadcast history |

---

## Document Import

The Import feature accepts:

- **Images** — JPG, PNG, WebP (Groq vision AI or Tesseract local OCR)
- **PDFs** — text-based or scanned (Groq + pdf-parse or local OCR fallback)

With an Anthropic or Groq API key, the AI extracts client info, line items, dates, totals, notes, and payment terms in seconds. Without a key the app falls back to local OCR and pattern matching — no data leaves your machine.

---

## Roadmap

- [x] Invoice, Receipt & Quote builder
- [x] AI Smart Fill & document import
- [x] Email & WhatsApp delivery
- [x] Mobile PDF sharing (Web Share API)
- [x] Client ratings & feedback system
- [x] Newsletter subscription & broadcast emails
- [ ] Recurring invoice schedules
- [ ] Cloud sync / multi-device
- [ ] Stripe / PayPal payment link integration
- [ ] Client portal (view & pay invoices online)
- [ ] Multi-user / team accounts
- [ ] Changelog / What's New page
- [ ] Feature request voting board

---

## License

MIT © Frederick Opoku Afriyie
