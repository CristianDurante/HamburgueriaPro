import { Router } from 'express';
import { db } from '../db.js';
import { getStoreConfig, isStoreOpenAt } from '../settings.js';
import { buildOrderMessage } from '../services/order-message.js';
import { sendWhatsAppOrder } from '../services/whatsapp.js';

const router = Router();

const PAYMENT_METHODS = ['pix', 'cash', 'credit', 'debit'];
const ORDER_TYPES = ['delivery', 'pickup'];

function validateOrder(body) {
  const errors = [];
  const name = String(body.customerName || '').trim();
  const phone = String(body.customerPhone || '').trim().replace(/\D/g, '');
  const orderType = body.orderType;
  const paymentMethod = body.paymentMethod;
  const items = Array.isArray(body.items) ? body.items : [];

  if (!name) errors.push('Informe o seu nome');
  if (phone.length < 10) errors.push('Informe um telefone válido');
  if (!ORDER_TYPES.includes(orderType)) errors.push('Tipo de pedido inválido');
  if (!PAYMENT_METHODS.includes(paymentMethod)) errors.push('Forma de pagamento inválida');
  if (items.length === 0) errors.push('O pedido está vazio');

  for (const it of items) {
    if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 99) {
      errors.push('Quantidade inválida');
      break;
    }
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(it.productId));
    if (!product || !product.active) {
      errors.push('Produto não disponível');
      break;
    }
  }

  if (orderType === 'delivery') {
    if (!String(body.addressStreet || '').trim()) errors.push('Informe a rua do endereço');
    if (!String(body.addressNeighborhood || '').trim()) errors.push('Informe o bairro');
  }

  return errors;
}

function computeOrder(body) {
  const store = getStoreConfig();
  const items = body.items.map((it) => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(it.productId));
    const addons = (Array.isArray(it.addons) ? it.addons : []).map((a) => ({
      id: Number(a.id),
      name: String(a.name || ''),
      price: Number(a.price) || 0,
    }));
    const unitPrice = product.promo_price != null ? Number(product.promo_price) : Number(product.price);
    const subtotal =
      (unitPrice + addons.reduce((s, a) => s + a.price, 0)) * Number(it.quantity);
    return {
      product_id: product.id,
      product_name: product.name,
      quantity: Number(it.quantity),
      unit_price: unitPrice,
      addons_json: JSON.stringify(addons),
      notes: String(it.notes || '').trim(),
      subtotal,
    };
  });

  const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
  const isDelivery = body.orderType === 'delivery';
  const deliveryFee = isDelivery ? Number(store.deliveryFee) || 0 : 0;

  const changeFor =
    body.paymentMethod === 'cash' && body.changeFor ? Number(body.changeFor) || null : null;
  if (body.paymentMethod === 'cash' && changeFor != null && changeFor < subtotal + deliveryFee) {
    return { error: 'O valor informado para troco deve ser maior que o total do pedido' };
  }

  const minOrder = Number(store.minOrder) || 0;
  if (subtotal + deliveryFee < minOrder) {
    return { error: `O pedido mínimo é de R$ ${minOrder.toFixed(2)}` };
  }

  return {
    items,
    subtotal: Number(subtotal.toFixed(2)),
    deliveryFee: Number(deliveryFee.toFixed(2)),
    total: Number((subtotal + deliveryFee).toFixed(2)),
    changeFor,
  };
}

router.post('/', (req, res) => {
  const body = req.body || {};
  const errors = validateOrder(body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  const store = getStoreConfig();
  if (store.blockWhenClosed) {
    const openInfo = isStoreOpenAt();
    if (!openInfo.open) {
      return res.status(400).json({ error: 'A hamburgueria está fechada no momento' });
    }
  }

  const calc = computeOrder(body);
  if (calc.error) return res.status(400).json({ error: calc.error });

  const orderId = db.transaction(() => {
    const customer = db
      .prepare('SELECT id FROM customers WHERE phone = ?')
      .get(body.customerPhone);
    let customerId = customer ? customer.id : null;
    if (!customerId) {
      const r = db
        .prepare('INSERT INTO customers (name, phone) VALUES (?, ?)')
        .run(body.customerName, body.customerPhone);
      customerId = Number(r.lastInsertRowid);
    } else {
      db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(
        body.customerName,
        customerId
      );
    }

    const r = db
      .prepare(
        `INSERT INTO orders (
           customer_name, customer_phone, order_type,
           address_street, address_number, address_complement,
           address_neighborhood, address_reference,
           payment_method, change_for, delivery_fee, subtotal, total, notes, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
      )
      .run(
        body.customerName,
        body.customerPhone,
        body.orderType,
        body.addressStreet || '',
        body.addressNumber || '',
        body.addressComplement || '',
        body.addressNeighborhood || '',
        body.addressReference || '',
        body.paymentMethod,
        calc.changeFor,
        calc.deliveryFee,
        calc.subtotal,
        calc.total,
        body.notes || ''
      );
    const id = Number(r.lastInsertRowid);

    const insItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, addons_json, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const it of calc.items) {
      insItem.run(
        id,
        it.product_id,
        it.product_name,
        it.quantity,
        it.unit_price,
        it.addons_json,
        it.notes
      );
    }
    return id;
  })();

  const order = db
    .prepare('SELECT * FROM orders WHERE id = ?')
    .get(orderId);
  const orderItems = db
    .prepare('SELECT * FROM order_items WHERE order_id = ?')
    .all(orderId);

  const message = buildOrderMessage(order, orderItems);
  const number = body.customerPhone.replace(/\D/g, '');
  const target = order.order_type === 'pickup' ? store.whatsappNumber || store.whatsapp : store.whatsappNumber || store.whatsapp;

  sendWhatsAppOrder(target, message)
    .then((result) => res.json({ order, items: orderItems, message, whatsapp: result }))
    .catch((err) =>
      res.json({
        order,
        items: orderItems,
        message,
        whatsapp: { sent: false, link: null, error: err.message },
      })
    );
});

router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ order, items });
});

export default router;
