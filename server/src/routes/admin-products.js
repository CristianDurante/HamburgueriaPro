import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Apenas imagens JPG, PNG, WEBP ou GIF são permitidas'));
  },
});

const router = Router();
router.use(requireAdmin);

function sanitize(body, imagePath) {
  const addons = Array.isArray(body.addonIds)
    ? body.addonIds.map(Number).filter((n) => !Number.isNaN(n))
    : [];

  return {
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    image: imagePath || String(body.image || '').trim(),
    price: Number(body.price) || 0,
    promo_price: body.promo_price === '' || body.promo_price == null ? null : Number(body.promo_price),
    category_id: Number(body.category_id) || null,
    active: body.active === false || body.active === 'false' ? 0 : 1,
    featured: body.featured === true || body.featured === 'true' ? 1 : 0,
    sort_order: Number(body.sort_order) || 0,
    addonIds: addons,
  };
}

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.sort_order, p.name`
    )
    .all();
  const addonStmt = db.prepare(
    'SELECT addon_id AS id FROM product_addons WHERE product_id = ?'
  );
  res.json(rows.map((p) => ({ ...p, addonIds: addonStmt.all(p.id).map((a) => a.id) })));
});

router.get('/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
  const addonIds = db
    .prepare('SELECT addon_id AS id FROM product_addons WHERE product_id = ?')
    .all(p.id)
    .map((a) => a.id);
  res.json({ ...p, addonIds });
});

router.post('/', upload.single('image'), (req, res) => {
  const f = sanitize(req.body, req.file ? `/uploads/${req.file.filename}` : null);
  if (!f.name) return res.status(400).json({ error: 'Nome do produto é obrigatório' });
  if (!f.category_id) return res.status(400).json({ error: 'Selecione uma categoria' });

  const tx = db.transaction(() => {
    const r = db
      .prepare(
        `INSERT INTO products (name, description, image, price, promo_price, category_id, active, featured, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        f.name,
        f.description,
        f.image,
        f.price,
        f.promo_price,
        f.category_id,
        f.active,
        f.featured,
        f.sort_order
      );
    const id = Number(r.lastInsertRowid);
    const link = db.prepare('INSERT OR IGNORE INTO product_addons (product_id, addon_id) VALUES (?, ?)');
    for (const aid of f.addonIds) link.run(id, aid);
    return id;
  });
  const id = tx();
  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
});

router.put('/:id', upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Produto não encontrado' });
  const f = sanitize(req.body, req.file ? `/uploads/${req.file.filename}` : null);
  if (!f.name) return res.status(400).json({ error: 'Nome do produto é obrigatório' });

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE products SET name = ?, description = ?, image = ?, price = ?, promo_price = ?,
       category_id = ?, active = ?, featured = ?, sort_order = ? WHERE id = ?`
    ).run(
      f.name,
      f.description,
      f.image,
      f.price,
      f.promo_price,
      f.category_id,
      f.active,
      f.featured,
      f.sort_order,
      req.params.id
    );
    db.prepare('DELETE FROM product_addons WHERE product_id = ?').run(req.params.id);
    const link = db.prepare('INSERT OR IGNORE INTO product_addons (product_id, addon_id) VALUES (?, ?)');
    for (const aid of f.addonIds) link.run(req.params.id, aid);
  });
  tx();
  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json({ ok: true });
});

export default router;
