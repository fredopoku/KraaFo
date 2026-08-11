import { Router, Request, Response } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { suggestLineItems, smartDescriptionEnhance, parseReceiptFromImage } from '../services/aiService';
import db from '../db/schema';
import { JWT_SECRET, AuthPayload } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const router = Router();

const GUEST_TRIAL_LIMIT = 3;
const GUEST_IP_DAILY_LIMIT = 30; // backstop against fingerprint rotation from one network

function getIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '';
}

interface AiAccessResult {
  allowed: boolean;
  error?: string;
  code?: string;
  isGuest: boolean; // true if this call should count toward the guest trial limit
}

// Gate for the two AI endpoints reachable without a login (Smart Fill /
// Smart Import on the public generator - see routes/organizations.ts's
// isPublic list and client/src/pages/Generator.tsx). Logged-in-but-
// unverified accounts are blocked outright - they already have an account,
// so the fix is verifying it, not more trial usage. Guests get a small
// number of free tries, tracked primarily by device fingerprint (one
// signal, spoofable by clearing browser data - same caveat as the signup
// fingerprint check) with a looser per-IP daily ceiling as a backstop
// against someone rotating fingerprints from the same network to bypass it.
function checkAiAccess(req: Request): AiAccessResult {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
      const org = db.prepare('SELECT verification_status FROM organizations WHERE id = ?').get(payload.orgId) as { verification_status?: string } | undefined;
      const status = org?.verification_status || 'verified';
      if (status !== 'verified') {
        return {
          allowed: false,
          isGuest: false,
          error: 'Please verify your email to use this feature. Check your inbox for the verification link.',
          code: 'verification_required',
        };
      }
      return { allowed: true, isGuest: false };
    } catch {
      // invalid/expired token - treat exactly like no token at all
    }
  }

  const fingerprintHash = req.headers['x-fingerprint-hash'] as string | undefined;
  const ip = getIp(req);

  const fpCount = fingerprintHash
    ? (db.prepare('SELECT COUNT(*) as c FROM ai_guest_usage WHERE fingerprint_hash = ?').get(fingerprintHash) as { c: number }).c
    : 0;
  const ipCount = ip
    ? (db.prepare("SELECT COUNT(*) as c FROM ai_guest_usage WHERE ip = ? AND created_at > datetime('now', '-1 day')").get(ip) as { c: number }).c
    : 0;

  if (fpCount >= GUEST_TRIAL_LIMIT || ipCount >= GUEST_IP_DAILY_LIMIT) {
    return {
      allowed: false,
      isGuest: true,
      error: `You've used your ${GUEST_TRIAL_LIMIT} free tries. Sign up free to keep using Smart Fill.`,
      code: 'guest_trial_exhausted',
    };
  }

  return { allowed: true, isGuest: true };
}

function recordGuestUsage(req: Request): void {
  const fingerprintHash = req.headers['x-fingerprint-hash'] as string | undefined;
  db.prepare('INSERT INTO ai_guest_usage (id, fingerprint_hash, ip) VALUES (?, ?, ?)')
    .run(uuidv4(), fingerprintHash || null, getIp(req) || null);
}

router.get('/status', (_req: Request, res: Response) => {
  const key = process.env.ANTHROPIC_API_KEY;
  const hasKey = !!(key && key !== 'your_anthropic_api_key_here');
  res.json({ ai_enabled: hasKey });
});

router.post('/suggest', async (req: Request, res: Response) => {
  const access = checkAiAccess(req);
  if (!access.allowed) return res.status(403).json({ error: access.error, code: access.code });

  const { industry = 'cleaning', existing_items = [], client_type = 'residential', notes = '' } = req.body;

  try {
    const suggestions = await suggestLineItems(industry, existing_items, client_type, notes);
    if (access.isGuest) recordGuestUsage(req);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate suggestions', details: (err as Error).message });
  }
});

router.post('/enhance', async (req: Request, res: Response) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: 'description is required' });

  try {
    const enhanced = await smartDescriptionEnhance(description);
    res.json({ enhanced });
  } catch {
    res.json({ enhanced: description });
  }
});

router.post('/parse-receipt', upload.single('image'), async (req: Request, res: Response) => {
  const access = checkAiAccess(req);
  if (!access.allowed) return res.status(403).json({ error: access.error, code: access.code });

  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const { mimetype, buffer } = req.file;
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (!allowed.includes(mimetype)) {
    return res.status(400).json({ error: 'Only JPG, PNG, WebP, GIF, or PDF files are supported' });
  }

  try {
    const base64 = buffer.toString('base64');

    const parsed = await parseReceiptFromImage(base64, mimetype);

    // Brand colors only extracted for image imports - the vision model reads the actual
    // document colours. PDFs go through a text model so there's no visual to read from,
    // and screenshotting the PDF viewer captures browser chrome (grey) not document colours.
    let brand_colors: { primary: string; secondary: string; accent: string } | null = null;
    if (mimetype !== 'application/pdf') {
      const p = parsed.brand_primary_color as string;
      const s = parsed.brand_secondary_color as string;
      const a = parsed.brand_accent_color as string;
      if (p || s || a) {
        brand_colors = { primary: p || '', secondary: s || '', accent: a || '' };
      }
    }

    const { brand_primary_color, brand_secondary_color, brand_accent_color, ...invoiceData } = parsed as Record<string, unknown>;
    if (access.isGuest) recordGuestUsage(req);
    res.json({ ...invoiceData, brand_colors });
  } catch (err) {
    console.error('Receipt parse error:', err);
    res.status(500).json({ error: 'Failed to parse receipt', details: (err as Error).message });
  }
});

export default router;
