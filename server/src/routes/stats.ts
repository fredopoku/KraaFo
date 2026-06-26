import { Router, Request, Response } from 'express';
import db from '../db/schema';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const { invoices } = db.prepare('SELECT COUNT(*) as invoices FROM invoices').get() as any;
  const { quotes } = db.prepare('SELECT COUNT(*) as quotes FROM quotes').get() as any;
  const { countries } = db.prepare(
    "SELECT COUNT(DISTINCT country) as countries FROM page_views WHERE country IS NOT NULL AND country NOT IN ('Unknown','Local','')"
  ).get() as any;
  const { avg } = db.prepare(
    'SELECT ROUND(AVG(rating),1) as avg FROM feedback WHERE approved = 1'
  ).get() as any;
  const { total } = db.prepare('SELECT COUNT(*) as total FROM feedback WHERE approved = 1').get() as any;

  res.json({
    documents: (invoices || 0) + (quotes || 0),
    countries: countries || 0,
    avgRating: avg || null,
    ratingCount: total || 0,
  });
});

export default router;
