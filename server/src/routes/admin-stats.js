import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

router.get('/', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const ordersToday = db
    .prepare("SELECT COUNT(*) c FROM orders WHERE date(created_at) = date('now')")
    .get().c;

  const revenueToday = db
    .prepare(
      "SELECT COALESCE(SUM(total), 0) s FROM orders WHERE date(created_at) = date('now') AND status != 'cancelled'"
    )
    .get().s;

  const pending = db
    .prepare("SELECT COUNT(*) c FROM orders WHERE status IN ('new', 'preparing', 'out_for_delivery', 'ready')")
    .get().c;

  const totalOrders = db.prepare('SELECT COUNT(*) c FROM orders').get().c;

  const topProducts = db
    .prepare(
      `SELECT oi.product_name AS name, SUM(oi.quantity) AS qty,
              SUM(oi.quantity * oi.unit_price) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE date(o.created_at) = date('now') AND o.status != 'cancelled'
       GROUP BY oi.product_name
       ORDER BY qty DESC
       LIMIT 5`
    )
    .all();

  const recentOrders = db
    .prepare('SELECT id, customer_name, order_type, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 8')
    .all();

  const statusCounts = {
    new: db.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'new'").get().c,
    preparing: db.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'preparing'").get().c,
    out_for_delivery: db.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'out_for_delivery'").get().c,
    ready: db.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'ready'").get().c,
    finished: db.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'finished'").get().c,
    cancelled: db.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'cancelled'").get().c,
  };

  res.json({
    today,
    ordersToday,
    revenueToday: Number(revenueToday),
    pending,
    totalOrders,
    topProducts,
    recentOrders,
    statusCounts,
  });
});

export default router;
