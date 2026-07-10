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
  // Per-route prerender: each public route gets its own metadata + correct h1.
  // The build step (scripts/prerender.cjs) renders each route with Puppeteer and
  // writes the result to client/dist/<route>/index.html. Here we read those files
  // and patch the head metadata, since Puppeteer only fixes the canonical link.
  // For /generator (which has no h1 in the React UI), we inject a hidden h1 for crawlers.

  type RouteConfig = {
    srcFile: string;          // path relative to clientDist
    title: string;
    description: string;
    canonical: string;
    ogTitle: string;
    ogDescription: string;
    twitterTitle: string;
    twitterDescription: string;
    injectH1?: string;        // hidden h1 text for routes whose React UI has no <h1>
  };

  const patchMeta = (html: string, nameOrProp: string, value: string): string =>
    html.replace(
      new RegExp(`(<meta[^>]+(name|property)="${nameOrProp}"[^>]+content=")[^"]*"`),
      `$1${value}"`
    );

  const buildPageHtml = (shell: string, cfg: RouteConfig): string => {
    let h = shell;
    h = h.replace(/<title>[^<]*<\/title>/, `<title>${cfg.title}</title>`);
    h = patchMeta(h, 'description', cfg.description);
    h = patchMeta(h, 'og:url', cfg.canonical);
    h = patchMeta(h, 'og:title', cfg.ogTitle);
    h = patchMeta(h, 'og:description', cfg.ogDescription);
    h = patchMeta(h, 'twitter:title', cfg.twitterTitle);
    h = patchMeta(h, 'twitter:description', cfg.twitterDescription);
    h = h.replace(/(<link\s+rel="canonical"\s+href=")[^"]*"/, `$1${cfg.canonical}"`);
    if (cfg.injectH1) {
      // Inject right after <body> — invisible to sighted users, readable by crawlers
      const hiddenStyle = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0';
      h = h.replace('<body>', `<body><h1 style="${hiddenStyle}">${cfg.injectH1}</h1>`);
    }
    return h;
  };

  const routeConfigs: Record<string, RouteConfig> = {
    '/': {
      srcFile: 'index.html',
      title: 'KraaFo — Free Invoicing & Receipt Software for Service Businesses',
      description: 'Create and download professional invoices, receipts and quotes free — no account needed. Branded PDFs delivered by email & WhatsApp. Sign up to save and send.',
      canonical: 'https://kraafo.com/',
      ogTitle: 'KraaFo — Professional Invoices & Receipts in Under a Minute',
      ogDescription: 'Professional invoices in under a minute — delivered straight to WhatsApp or email. Branded PDFs, Smart Fill, free to create. Sign up to send and save.',
      twitterTitle: 'KraaFo — Free Invoice & Receipt Generator',
      twitterDescription: 'Professional invoices in under a minute. Branded PDFs delivered by WhatsApp or email. Free to create — sign up to send.',
    },
    '/generator': {
      srcFile: 'generator/index.html',
      title: 'Free Invoice Generator — Create & Download in 60 Seconds | KraaFo',
      description: 'Create a professional invoice in under 60 seconds. Download free as PDF — no account needed. Add your logo, set your rates, and send by WhatsApp, SMS, or email.',
      canonical: 'https://kraafo.com/generator',
      ogTitle: 'Free Invoice Generator — Create & Download in 60 Seconds | KraaFo',
      ogDescription: 'Create a professional invoice in under 60 seconds. Download free as PDF — no account needed. Add your logo and send by WhatsApp, SMS, or email.',
      twitterTitle: 'Free Invoice Generator | KraaFo',
      twitterDescription: 'Create a professional invoice in under 60 seconds. Download free — no sign-up needed.',
      injectH1: 'Free Invoice Generator — Create &amp; Download in 60 Seconds',
    },
    '/changelog': {
      srcFile: 'changelog/index.html',
      title: "What's New in KraaFo — Latest Updates & Features",
      description: "See the latest updates, new features, and improvements to KraaFo. Invoicing, receipts, WhatsApp delivery and more — always improving.",
      canonical: 'https://kraafo.com/changelog',
      ogTitle: "What's New in KraaFo — Changelog",
      ogDescription: "The latest updates and new features in KraaFo — your free invoice and receipt generator.",
      twitterTitle: "What's New in KraaFo",
      twitterDescription: "Latest updates and new features in KraaFo — free invoice and receipt generator.",
    },
  };

  // Build all route HTML variants at startup.
  // Each route reads its own Puppeteer-prerendered file; falls back to index.html if missing.
  const routeHtmlMap: Record<string, string> = {};
  const fallbackShell = (() => {
    try { return fs.readFileSync(path.join(clientDist, 'index.html'), 'utf8'); } catch { return ''; }
  })();

  for (const [routePath, cfg] of Object.entries(routeConfigs)) {
    try {
      const filePath = path.join(clientDist, cfg.srcFile);
      const shell = fs.existsSync(filePath)
        ? fs.readFileSync(filePath, 'utf8')
        : fallbackShell;
      routeHtmlMap[routePath] = buildPageHtml(shell, cfg);
    } catch (err) {
      console.warn(`[prerender] Failed to build HTML for ${routePath}:`, err);
    }
  }

  // Register per-route handlers before express.static so they win for direct GET requests
  for (const [routePath, html] of Object.entries(routeHtmlMap)) {
    app.get(routePath, (_req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    });
  }

  app.use(express.static(clientDist));
  // SPA fallback — serve plain index.html for all other client-side routes
  app.get('*', (req, res) => {
    const safePath = path.normalize(req.path);
    const routeHtml = path.join(clientDist, safePath, 'index.html');
    if (routeHtml.startsWith(clientDist) && fs.existsSync(routeHtml)) {
      return res.sendFile(routeHtml);
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
