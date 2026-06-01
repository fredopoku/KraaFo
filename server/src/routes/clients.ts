import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { org_id, q } = req.query;
  if (!org_id) return res.status(400).json({ error: 'org_id required' });
  const search = q ? `%${q}%` : '%';
  const clients = db.prepare(`
    SELECT * FROM clients WHERE org_id = ? AND (name LIKE ? OR company LIKE ? OR email LIKE ?)
    ORDER BY name ASC LIMIT 50
  `).all(org_id, search, search, search);
  res.json(clients);
});

router.get('/:id', (req: Request, res: Response) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

router.post('/', (req: Request, res: Response) => {
  const { org_id, name, email, phone, address, city, state, zip, country, company, notes } = req.body;
  if (!org_id || !name) return res.status(400).json({ error: 'org_id and name required' });
  const id = uuidv4();
  db.prepare(`
    INSERT INTO clients (id, org_id, name, email, phone, address, city, state, zip, country, company, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, org_id, name, email, phone, address, city, state, zip, country, company, notes);
  res.status(201).json(db.prepare('SELECT * FROM clients WHERE id = ?').get(id));
});

router.put('/:id', (req: Request, res: Response) => {
  const fields = ['name','email','phone','address','city','state','zip','country','company','notes'];
  const updates = fields.filter(f => req.body[f] !== undefined);
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  const set = updates.map(f => `${f} = ?`).join(', ');
  db.prepare(`UPDATE clients SET ${set} WHERE id = ?`).run(...updates.map(f => req.body[f]), req.params.id);
  res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req: Request, res: Response) => {
  // Detach invoices first — invoices.client_id FK would block the delete otherwise
  db.prepare('UPDATE invoices SET client_id = NULL WHERE client_id = ?').run(req.params.id);
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
