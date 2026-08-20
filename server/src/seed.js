import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { setSetting } from './settings.js';

const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

const IMAGES = {
  smash: U('photo-1568901346375-23c9450c58cd'),
  duplo: U('photo-1553979459-d2229ba7433b'),
  cheddar: U('photo-1571091718767-18b5b1457add'),
  frango: U('photo-1607013251379-e6eecfffe234'),
  veggie: U('photo-1551782450-a2132b4ba21d'),
  xtudo: U('photo-1603064752734-4c48eff53d05'),
  combo1: U('photo-1572802419224-296b0aeee0d9'),
  combo2: U('photo-1594212699903-ec8a3eca50f5'),
  combo3: U('photo-1561758033-d89a9ad46330'),
  batataP: U('photo-1573080496219-bb080dd4f877'),
  batataG: U('photo-1630384060421-cb20d0e0649d'),
  onion: U('photo-1639024471283-03518883512d'),
  nuggets: U('photo-1562967914-608f82629710'),
  coca: U('photo-1554866585-cd94860890b7'),
  guaraná: U('photo-1544145945-f90425340c7e'),
  fanta: U('photo-1622483767028-3f66f32aef97'),
  agua: U('photo-1546173159-315724a31696'),
  suco: U('photo-1613478223719-2ab802602423'),
  milkshake: U('photo-1579954115545-a95591f28bfc'),
  petit: U('photo-1563805042-7684c019e1cb'),
  sundae: U('photo-1560008581-09826d1de69e'),
  promo1: U('photo-1568901346375-23c9450c58cd'),
  promo2: U('photo-1553979459-d2229ba7433b'),
};

function seed() {
  const adminExists = db.prepare('SELECT id FROM admins LIMIT 1').get();
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admins (username, password_hash, name) VALUES (?, ?, ?)').run(
      'admin',
      hash,
      'Administrador'
    );
    console.log('Admin padrão criado -> usuário: admin | senha: admin123');
  }

  if (db.prepare('SELECT COUNT(*) c FROM categories').get().c === 0) {
    const insCat = db.prepare('INSERT INTO categories (name, slug, icon, sort_order, active) VALUES (?, ?, ?, ?, 1)');
    const cats = [
      ['Hambúrgueres', 'hamburgueres', 'burger', 1],
      ['Combos', 'combos', 'package', 2],
      ['Acompanhamentos', 'acompanhamentos', 'fries', 3],
      ['Refrigerantes', 'refrigerantes', 'cup-soda', 4],
      ['Bebidas', 'bebidas', 'glass-water', 5],
      ['Sobremesas', 'sobremesas', 'ice-cream', 6],
      ['Promoções', 'promocoes', 'tag', 7],
    ];
    for (const c of cats) insCat.run(...c);
    console.log('Categorias criadas.');
  }

  if (db.prepare('SELECT COUNT(*) c FROM products').get().c === 0) {
    const catId = (slug) => db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug).id;
    const ins = db.prepare(
      `INSERT INTO products (name, description, image, price, promo_price, category_id, active, featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
    );
    const h = catId('hamburgueres');
    const c = catId('combos');
    const a = catId('acompanhamentos');
    const r = catId('refrigerantes');
    const b = catId('bebidas');
    const s = catId('sobremesas');

    const products = [
      ['Smash Burger Clássico', 'Pão brioche, burger smash 160g, queijo prato, alface americana, tomate e molho especial da casa.', IMAGES.smash, 24.9, null, h, 1, 1],
      ['Duplo Bacon Burger', 'Dois smashes 160g, queijo cheddar, fatias crocantes de bacon e cebola caramelizada no pão brioche.', IMAGES.duplo, 32.9, null, h, 1, 1],
      ['Cheddar Supreme', 'Burger 180g, cheddar cremoso em abundância, bacon, molho barbecue e cebola crispy.', IMAGES.cheddar, 34.9, null, h, 1, 0],
      ['Frango Crocante', 'Filé de frango empanado crocante, maionese da casa, queijo prato e salada no pão brioche.', IMAGES.frango, 28.9, null, h, 1, 0],
      ['Veggie Burger', 'Burger de grão-de-bico, queijo vegano, guacamole e mix de folhas no pão brioche.', IMAGES.veggie, 26.9, null, h, 1, 0],
      ['X-Tudo da Casa', 'O clássico completo: 2 burgers 160g, queijo, bacon, ovo, salsicha, presunto, alface, tomate e molho.', IMAGES.xtudo, 39.9, null, h, 1, 1],
      ['Combo Smash + Batata + Refri', 'Smash Burger Clássico + batata frita média + refrigerante lata.', IMAGES.combo1, 44.9, null, c, 1, 1],
      ['Combo Duplo Bacon', 'Duplo Bacon Burger + batata frita grande + refrigerante lata.', IMAGES.combo2, 52.9, null, c, 1, 0],
      ['Combo Família', '2 Smash Burger Clássico + batata grande + 2 refrigerantes lata. Ideal para dividir.', IMAGES.combo3, 79.9, null, c, 1, 1],
      ['Batata Frita Pequena', 'Batata frita crocante com sal a gosto. Acompanha catchup e mostarda.', IMAGES.batataP, 12.9, null, a, 1, 0],
      ['Batata Frita Grande', 'Porção generosa de batata frita crocante. Acompanha catchup e mostarda.', IMAGES.batataG, 17.9, null, a, 1, 1],
      ['Onion Rings', 'Anéis de cebola empanados e fritos, servidos com molho ranch.', IMAGES.onion, 15.9, null, a, 1, 0],
      ['Nuggets (8 unidades)', 'Nuggets de frango crocantes servidos com molho barbecue.', IMAGES.nuggets, 18.9, null, a, 1, 0],
      ['Coca-Cola Lata', 'Coca-Cola 350ml gelada.', IMAGES.coca, 6.0, null, r, 1, 0],
      ['Coca-Cola 600ml', 'Coca-Cola 600ml gelada.', IMAGES.coca, 8.0, null, r, 1, 0],
      ['Guaraná Antarctica Lata', 'Guaraná Antarctica 350ml gelada.', IMAGES.guaraná, 5.5, null, r, 1, 0],
      ['Fanta Laranja Lata', 'Fanta Laranja 350ml gelada.', IMAGES.fanta, 5.5, null, r, 1, 0],
      ['Água Mineral 500ml', 'Água mineral sem gás 500ml.', IMAGES.agua, 4.0, null, b, 1, 0],
      ['Suco de Laranja Natural', 'Suco de laranja natural 400ml.', IMAGES.suco, 8.0, null, b, 1, 0],
      ['Milkshake de Chocolate', 'Milkshake cremoso de chocolate 400ml com chantilly.', IMAGES.milkshake, 18.9, null, s, 1, 1],
      ['Milkshake de Morango', 'Milkshake cremoso de morango 400ml com chantilly.', IMAGES.milkshake, 18.9, null, s, 1, 0],
      ['Petit Gâteau', 'Bolo quente de chocolate com recheio cremoso e bola de sorvete.', IMAGES.petit, 19.9, null, s, 1, 0],
      ['Sundae de Caramelo', 'Sorvete de creme com calda de caramelo e castanhas.', IMAGES.sundae, 14.9, null, s, 1, 0],
    ];
    for (const p of products) ins.run(...p);
    console.log(`${products.length} produtos criados.`);
  }

  if (db.prepare('SELECT COUNT(*) c FROM addons').get().c === 0) {
    const ins = db.prepare('INSERT INTO addons (name, price, active, sort_order) VALUES (?, ?, 1, ?)');
    const addons = [
      ['Bacon extra', 4.9, 1],
      ['Queijo cheddar', 3.9, 2],
      ['Queijo prato', 3.0, 3],
      ['Hambúrguer extra', 6.9, 4],
      ['Ovo', 2.5, 5],
      ['Cebola caramelizada', 3.0, 6],
      ['Cebola crispy', 3.5, 7],
      ['Molho da casa', 2.0, 8],
      ['Batata extra', 5.0, 9],
    ];
    for (const a of addons) ins.run(...a);
    console.log(`${addons.length} adicionais criados.`);
  }

  if (db.prepare('SELECT COUNT(*) c FROM product_addons').get().c === 0) {
    const link = db.prepare('INSERT OR IGNORE INTO product_addons (product_id, addon_id) VALUES (?, ?)');
    const burgers = db.prepare(
      `SELECT p.id FROM products p JOIN categories c ON c.id = p.category_id
       WHERE c.slug = 'hamburgueres'`
    ).all();
    const addonIds = db.prepare('SELECT id FROM addons').all().map((a) => a.id);
    for (const b of burgers) {
      for (const aid of addonIds) link.run(b.id, aid);
    }
    console.log('Adicionais vinculados aos hambúrgueres.');
  }

  if (db.prepare('SELECT COUNT(*) c FROM promotions').get().c === 0) {
    const ins = db.prepare(
      `INSERT INTO promotions (name, description, image, promo_price, start_date, end_date, active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    );
    const start = new Date();
    const end = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    ins.run(
      'Smash Burger do Dia',
      'Todo dia o Smash Burger Clássico por um preço especial. Aproveite!',
      IMAGES.promo1,
      19.9,
      start.toISOString(),
      end.toISOString()
    );
    ins.run(
      'Combo Happy Hour',
      'Combo Smash + Batata + Refri com desconto especial no happy hour.',
      IMAGES.promo2,
      39.9,
      start.toISOString(),
      end.toISOString()
    );
    console.log('Promoções criadas.');
  }

  const hoursStmt = db.prepare(
    'INSERT INTO business_hours (day_of_week, open_time, close_time, closed) VALUES (?, ?, ?, ?)'
  );
  const hoursCount = db.prepare('SELECT COUNT(*) c FROM business_hours').get().c;
  for (let d = 0; d < 7; d++) {
    if (hoursCount === 0) {
      hoursStmt.run(d, '00:00', '23:59', 0);
    }
  }
  if (hoursCount === 0) console.log('Horários de funcionamento criados.');

  const defaults = {
    store_name: 'Kintal Lanches',
    store_logo: '',
    store_phone: '(11) 99999-9999',
    store_whatsapp: '5511999999999',
    store_address: 'Av. das Palmeiras, 1234 - Centro',
    delivery_fee: '5',
    delivery_neighborhoods: JSON.stringify([
      'Centro',
      'Jardins',
      'Vila Nova',
      'Santa Cecília',
      'Barra Funda',
    ]),
    min_order: '15',
    avg_delivery_time: '30 - 50 min',
    block_when_closed: 'true',
    whatsapp_provider: 'wa.me',
    accept_delivery: 'true',
    accept_pickup: 'true',
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (!db.prepare('SELECT 1 FROM settings WHERE key = ?').get(k)) {
      setSetting(k, v);
    }
  }
  console.log('Configurações padrão aplicadas.');
  console.log('Seed concluído com sucesso!');
}

seed();
