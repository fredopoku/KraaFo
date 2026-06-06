import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const isProd = process.env.NODE_ENV === 'production';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// CORS — allow configured frontend URL + localhost for dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://kraafo.com',
  'https://www.kraafo.com',
  'https://kraafo.onrender.com',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin requests (no origin header) and configured origins
    if (!origin || allowedOrigins.some(o => origin === o || origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Serve built React frontend in production
// client/dist is at ../../client/dist relative to server/dist/index.js
const clientDist = path.resolve(__dirname, '../../client/dist');
if (isProd && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else if (isProd) {
  console.warn('Warning: client/dist not found. Run `npm run build` from the project root first.');
}

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\nKraaFo server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
  if (isProd) console.log(`  Serving frontend from ${clientDist}`);
});

export default app;
