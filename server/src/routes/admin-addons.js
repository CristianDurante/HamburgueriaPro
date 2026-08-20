import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

function sanitize(body) {
  return {
    name: String(body.name || '').trim(),
    price: Number(body.price) || 0,
    active: body.active ? 1 : 0,
    sort_order: Number(body.sort_order) || 0,
  };
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM addons ORDER BY sort_order, name').all());
});

router.post('/', (req, res) => {
  const f = sanitize(req.body);
  if (!f.name) return res.status(400).json({ error: 'Nome do adicional é obrigatório' });
  const r = db
    .prepare('INSERT INTO addons (name, price, active, sort_order) VALUES (?, ?, ?, ?)')
    .run(f.name, f.price, f.active, f.sort_order);
  res.json(db.prepare('SELECT * FROM addons WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const f = sanitize(req.body);
  if (!f.name) return res.status(400).json({ error: 'Nome do adicional é obrigatório' });
  db.prepare('UPDATE addons SET name = ?, price = ?, active = ?, sort_order = ? WHERE id = ?').run(
    f.name,
    f.price,
    f.active,
    f.sort_order,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM addons WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Adicional não encontrado' });
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM addons WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Adicional não encontrado' });
  res.json({ ok: true });
});

export default router;
