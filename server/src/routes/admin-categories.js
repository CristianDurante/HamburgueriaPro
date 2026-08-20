import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

const fields = (b) => ({
  name: String(b.name || '').trim(),
  slug: String(b.slug || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || null,
  icon: String(b.icon || 'burger').trim(),
  sort_order: Number(b.sort_order) || 0,
  active: b.active ? 1 : 0,
});

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all());
});

router.post('/', (req, res) => {
  const f = fields(req.body);
  if (!f.name) return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
  if (!f.slug) return res.status(400).json({ error: 'Slug inválido' });
  try {
    const r = db
      .prepare(
        'INSERT INTO categories (name, slug, icon, sort_order, active) VALUES (?, ?, ?, ?, ?)'
      )
      .run(f.name, f.slug, f.icon, f.sort_order, f.active);
    res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(400).json({ error: 'Já existe uma categoria com esse slug' });
    }
    throw e;
  }
});

router.put('/:id', (req, res) => {
  const f = fields(req.body);
  if (!f.name) return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
  try {
    db.prepare(
      'UPDATE categories SET name = ?, slug = ?, icon = ?, sort_order = ?, active = ? WHERE id = ?'
    ).run(f.name, f.slug, f.icon, f.sort_order, f.active, req.params.id);
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(row);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(400).json({ error: 'Já existe uma categoria com esse slug' });
    }
    throw e;
  }
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Categoria não encontrada' });
  res.json({ ok: true });
});

export default router;
