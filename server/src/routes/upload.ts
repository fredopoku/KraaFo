import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { extractBrandColors, processLogo } from '../services/imageService';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo_${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed (png, jpg, jpeg, gif, webp, svg)'));
  },
});

const router = Router();

router.post('/logo', upload.single('logo'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const logoUrl = `/uploads/${req.file.filename}`;
    let colors = { primary: '#2563EB', secondary: '#1E40AF', accent: '#DBEAFE', text: '#1F2937' };

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.svg') {
      try {
        await processLogo(req.file.path, UPLOAD_DIR, req.file.filename);
        colors = await extractBrandColors(req.file.path);
      } catch {
        // Keep defaults if color extraction fails
      }
    }

    res.json({ logo_url: logoUrl, colors });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process logo' });
  }
});

export default router;
