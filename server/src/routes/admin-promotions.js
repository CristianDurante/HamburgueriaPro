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
    cb(null, `promo-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
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
  return {
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    image: imagePath || String(body.image || '').trim(),
    promo_price: body.promo_price === '' || body.promo_price == null ? null : Number(body.promo_price),
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    active: body.active === false || body.active === 'false' ? 0 : 1,
  };
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM promotions ORDER BY created_at DESC').all());
});

router.post('/', upload.single('image'), (req, res) => {
  const f = sanitize(req.body, req.file ? `/uploads/${req.file.filename}` : null);
  if (!f.name) return res.status(400).json({ error: 'Nome da promoção é obrigatório' });
  const r = db
    .prepare(
      `INSERT INTO promotions (name, description, image, promo_price, start_date, end_date, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(f.name, f.description, f.image, f.promo_price, f.start_date, f.end_date, f.active);
  res.json(db.prepare('SELECT * FROM promotions WHERE id = ?').get(r.lastInsertRowid));
});

router.put('/:id', upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM promotions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Promoção não encontrada' });
  const f = sanitize(req.body, req.file ? `/uploads/${req.file.filename}` : null);
  if (!f.name) return res.status(400).json({ error: 'Nome da promoção é obrigatório' });
  db.prepare(
    `UPDATE promotions SET name = ?, description = ?, image = ?, promo_price = ?,
     start_date = ?, end_date = ?, active = ? WHERE id = ?`
  ).run(
    f.name,
    f.description,
    f.image,
    f.promo_price,
    f.start_date,
    f.end_date,
    f.active,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM promotions WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM promotions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Promoção não encontrada' });
  res.json({ ok: true });
});

export default router;
