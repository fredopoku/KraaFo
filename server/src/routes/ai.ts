import { Router, Request, Response } from 'express';
import multer from 'multer';
import { suggestLineItems, smartDescriptionEnhance, parseReceiptFromImage } from '../services/aiService';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  const key = process.env.ANTHROPIC_API_KEY;
  const hasKey = !!(key && key !== 'your_anthropic_api_key_here');
  res.json({ ai_enabled: hasKey });
});

router.post('/suggest', async (req: Request, res: Response) => {
  const { industry = 'cleaning', existing_items = [], client_type = 'residential', notes = '' } = req.body;

  try {
    const suggestions = await suggestLineItems(industry, existing_items, client_type, notes);
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
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const { mimetype, buffer } = req.file;
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (!allowed.includes(mimetype)) {
    return res.status(400).json({ error: 'Only JPG, PNG, WebP, GIF, or PDF files are supported' });
  }

  try {
    const base64 = buffer.toString('base64');

    const parsed = await parseReceiptFromImage(base64, mimetype);

    // Brand colors only extracted for image imports — the vision model reads the actual
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
    res.json({ ...invoiceData, brand_colors });
  } catch (err) {
    console.error('Receipt parse error:', err);
    res.status(500).json({ error: 'Failed to parse receipt', details: (err as Error).message });
  }
});

export default router;
