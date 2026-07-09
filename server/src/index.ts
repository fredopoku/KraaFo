import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import organizationsRouter from './routes/organizations';
import invoicesRouter from './routes/invoices';
import uploadRouter from './routes/upload';
import aiRouter from './routes/ai';
import pdfRouter from './routes/pdf';
import clientsRouter from './routes/clients';
import quotesRouter from './routes/quotes';
import deliverRouter from './routes/deliver';
import analyticsRouter from './routes/analytics';
import feedbackRouter from './routes/feedback';
import subscribersRouter from './routes/subscribers';
import broadcastsRouter from './routes/broadcasts';
import adminRouter from './routes/admin';
import changelogRouter from './routes/changelog';
import trackRouter from './routes/track';
import statsRouter from './routes/stats';
import authRouter from './routes/auth';
import teamRouter from './routes/team';
import { requireAuth } from './middleware/auth';
import { startScheduler } from './services/scheduler';

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const isProd = process.env.NODE_ENV === 'production';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// CORS — allow configured frontend URL + localhost for dev only
const allowedOrigins = [
  'https://kraafo.com',
  'https://www.kraafo.com',
  'https://kraafo.onrender.com',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(!isProd ? ['http://localhost:5173', 'http://localhost:3000'] : []),
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(helmet({
  crossOriginEmbedderPolicy: false, // allow PDF/image embeds
  contentSecurityPolicy: false,     // handled by Cloudflare; inline styles in React would break with strict CSP
}));

// Rate limiting — protect auth endpoints from brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                      // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  skip: () => !isProd,          // disabled in dev
});
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 5,                       // 5 reset requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again in 1 hour.' },
  skip: () => !isProd,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// Global auth — public routes are whitelisted inside requireAuth
app.use(requireAuth);

// API routes
app.use('/api/organizations', organizationsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/ai', aiRouter);
app.use('/api/pdf', pdfRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/deliver', deliverRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/subscribers', subscribersRouter);
app.use('/api/broadcasts', broadcastsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/changelog', changelogRouter);
app.use('/api/track', trackRouter);
app.use('/api/stats', statsRouter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot', forgotLimiter);
app.use('/api/auth/reset', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/team', teamRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Serve built React frontend in production
// client/dist is at ../../client/dist relative to server/dist/index.js
const clientDist = path.resolve(__dirname, '../../client/dist');
if (isProd && fs.existsSync(clientDist)) {
  // Build the prerendered homepage HTML once at startup.
  // React replaces this on mount; crawlers see the full content before JS runs.
  let homepageHtml: string;
  try {
    const shell = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf8');
    const staticContent = `<main>
<h1>Send invoices your clients take seriously. Get paid without chasing.</h1>
<p>Create professional invoices in under a minute. Download free — no account needed. Sign up free to save your work and send by WhatsApp, SMS, or email.</p>
<p>Free to use · No credit card · Sends via WhatsApp, SMS &amp; email</p>
<h2>Your client can't say they didn't get it</h2>
<p>One tap sends your invoice three ways — WhatsApp, SMS, and email — all with the PDF attached. Every other invoicing app sends an email and waits. KraaFo sends all three at once.</p>
<h2>Features</h2>
<ul>
<li><strong>Smart Fill</strong> — Pick your industry and job type. KraaFo fills in your line items, pricing, notes, and terms. Review, adjust, send.</li>
<li><strong>Auto Branding</strong> — Upload your logo and KraaFo pulls your brand colors. Every document matches your business, automatically.</li>
<li><strong>Professional Invoices</strong> — Branded payment requests with due dates, tax, discounts, and a full itemized breakdown.</li>
<li><strong>Instant Receipts</strong> — Generate a receipt the moment a client pays. No templates, no fiddling.</li>
<li><strong>Tax &amp; Discounts</strong> — GST, VAT, Sales Tax, and both percentage and fixed-amount discounts on every document.</li>
<li><strong>Print-Ready PDFs</strong> — Sharp, clean PDFs ready to print, email, or share on the spot. Generated in seconds.</li>
<li><strong>WhatsApp, SMS &amp; Email</strong> — Send from inside KraaFo. Your client gets the PDF via WhatsApp, SMS, or email.</li>
<li><strong>Works Worldwide</strong> — Multi-currency. M-Pesa, MTN, Airtel, Telecel, PayPal, and bank transfer. Works in any country.</li>
</ul>
<h2>How it works — from zero to paid in minutes</h2>
<ol>
<li><strong>Create in 60 seconds</strong> — Fill in your client and add your services. Smart Fill pre-populates everything for your industry.</li>
<li><strong>Send by WhatsApp, email or SMS</strong> — One tap sends your invoice three ways. Your client has it before you pack up your tools.</li>
<li><strong>Download free, no sign-up</strong> — Download the PDF right away with no account needed. Sign up free to save history and send to clients.</li>
</ol>
<h2>Common questions</h2>
<dl>
<dt>Is KraaFo really free?</dt>
<dd>Yes. Creating and downloading invoices, receipts and quotes is completely free. No credit card needed. You need a free account to send documents by email or WhatsApp and to save your history.</dd>
<dt>Do I need an account to download a PDF?</dt>
<dd>No. Fill in your invoice and download the PDF without signing up. Create an account (also free) to save your documents and send them to clients.</dd>
<dt>Can I send invoices on WhatsApp?</dt>
<dd>Yes. One tap sends your invoice through WhatsApp, SMS, and email — all from the same screen. Your client gets a professional message with the PDF.</dd>
<dt>Can I add my logo and brand colors?</dt>
<dd>Yes. Upload your logo and KraaFo automatically extracts your brand colors. Every document reflects your brand without any manual setup.</dd>
<dt>Does it work in my country and currency?</dt>
<dd>KraaFo works worldwide. Set any currency symbol and accept mobile money (M-Pesa, MTN, Airtel, Telecel), PayPal, or bank transfer.</dd>
</dl>
</main>`;
    homepageHtml = shell.replace('<div id="root"></div>', `<div id="root">${staticContent}</div>`);
  } catch {
    homepageHtml = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf8');
  }

  // Serve prerendered homepage — must come before express.static so it wins for GET /
  app.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(homepageHtml);
  });

  app.use(express.static(clientDist));
  // SPA fallback — serve index.html for all client-side routes
  app.get('*', (req, res) => {
    const safePath = path.normalize(req.path);
    if (safePath !== '/') {
      const routeHtml = path.join(clientDist, safePath, 'index.html');
      if (routeHtml.startsWith(clientDist) && fs.existsSync(routeHtml)) {
        return res.sendFile(routeHtml);
      }
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else if (isProd) {
  console.warn('Warning: client/dist not found. Run `npm run build` from the project root first.');
}

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (!isProd) console.error(err.stack);
  else console.error(`[error] ${err.message}`);
  res.status(500).json({ error: isProd ? 'Internal server error' : (err.message || 'Internal server error') });
});

app.listen(PORT, () => {
  console.log(`\nKraaFo server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
  if (isProd) console.log(`  Serving frontend from ${clientDist}`);
  startScheduler();
});

export default app;
