import { Router } from 'express';
import { db } from '../db.js';
import {
  getStoreConfig,
  getBusinessHours,
  isStoreOpenAt,
} from '../settings.js';

const router = Router();

router.get('/store', (req, res) => {
  const config = { ...getStoreConfig() };
  delete config.whatsappApiToken;
  delete config.whatsappApiUrl;
  const hours = getBusinessHours();
  const openInfo = isStoreOpenAt();
  res.json({
    config,
    hours,
    open: openInfo.open,
    openStatus: openInfo.open ? 'open' : 'closed',
  });
});

router.get('/categories', (req, res) => {
  const rows = db
    .prepare(
      'SELECT id, name, slug, icon, sort_order FROM categories WHERE active = 1 ORDER BY sort_order, name'
    )
    .all();
  res.json(rows);
});

router.get('/products', (req, res) => {
  const { category } = req.query;
  let rows;
  if (category) {
    rows = db
      .prepare(
        `SELECT p.* FROM products p
         JOIN categories c ON c.id = p.category_id
         WHERE p.active = 1 AND c.slug = ?
         ORDER BY p.sort_order, p.name`
      )
      .all(String(category));
  } else {
    rows = db
      .prepare('SELECT * FROM products WHERE active = 1 ORDER BY sort_order, name')
      .all();
  }
  const addonStmt = db.prepare(
    `SELECT a.id, a.name, a.price, a.sort_order FROM addons a
     JOIN product_addons pa ON pa.addon_id = a.id
     WHERE pa.product_id = ? AND a.active = 1 ORDER BY a.sort_order`
  );
  res.json(rows.map((p) => ({ ...p, addons: addonStmt.all(p.id) })));
});

router.get('/products/featured', (req, res) => {
  const rows = db
    .prepare(
      'SELECT * FROM products WHERE active = 1 AND featured = 1 ORDER BY sort_order, name'
    )
    .all();
  const addonStmt = db.prepare(
    `SELECT a.id, a.name, a.price, a.sort_order FROM addons a
     JOIN product_addons pa ON pa.addon_id = a.id
     WHERE pa.product_id = ? AND a.active = 1 ORDER BY a.sort_order`
  );
  res.json(rows.map((p) => ({ ...p, addons: addonStmt.all(p.id) })));
});

router.get('/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  const addons = db
    .prepare(
      `SELECT a.id, a.name, a.price, a.sort_order FROM addons a
       JOIN product_addons pa ON pa.addon_id = a.id
       WHERE pa.product_id = ? AND a.active = 1 ORDER BY a.sort_order`
    )
    .all(product.id);
  res.json({ ...product, addons });
});

router.get('/addons', (req, res) => {
  res.json(db.prepare('SELECT * FROM addons WHERE active = 1 ORDER BY sort_order, name').all());
});

router.get('/promotions', (req, res) => {
  const now = new Date().toISOString();
  const rows = db
    .prepare(
      `SELECT * FROM promotions
       WHERE active = 1
         AND (start_date IS NULL OR start_date <= ?)
         AND (end_date IS NULL OR end_date >= ?)
       ORDER BY created_at DESC`
    )
    .all(now, now);
  res.json(rows);
});

export default router;
