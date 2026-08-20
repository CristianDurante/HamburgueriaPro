import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { getStoreConfig } from '../settings.js';
import { buildOrderMessage } from '../services/order-message.js';
import { sendWhatsAppOrder } from '../services/whatsapp.js';

const router = Router();
router.use(requireAdmin);

const STATUS = ['new', 'preparing', 'out_for_delivery', 'ready', 'finished', 'cancelled'];
const STATUS_LABELS = {
  new: 'Novo',
  preparing: 'Em preparação',
  out_for_delivery: 'Saiu para entrega',
  ready: 'Pronto para retirada',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

router.get('/', (req, res) => {
  const { status, date } = req.query;
  let sql = `SELECT o.* FROM orders o`;
  const params = [];
  const clauses = [];
  if (status && status !== 'all') {
    clauses.push('o.status = ?');
    params.push(status);
  }
  if (date) {
    clauses.push('date(o.created_at) = date(?)');
    params.push(String(date));
  }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY o.created_at DESC LIMIT 200';

  const orders = db.prepare(sql).all(...params);
  const itemStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  res.json(orders.map((o) => ({ ...o, items: itemStmt.all(o.id) })));
});

router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!STATUS.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Pedido não encontrado' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id));
});

router.post('/:id/notify', async (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const message = buildOrderMessage(order, items);
  const store = getStoreConfig();
  const target = store.whatsappNumber || store.whatsapp;
  try {
    const result = await sendWhatsAppOrder(target, message);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
