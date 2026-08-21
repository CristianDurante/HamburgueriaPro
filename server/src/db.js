import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH =
  process.env.DB_PATH ||
  (process.env.VERCEL
    ? join(process.env.TMPDIR || '/tmp', 'hamburgueria.db')
    : join(__dirname, '..', 'data', 'hamburgueria.db'));

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Administrador',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT 'burger',
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  promo_price REAL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  active INTEGER DEFAULT 1,
  featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_addons (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_id INTEGER NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, addon_id)
);

CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  promo_price REAL,
  start_date DATETIME,
  end_date DATETIME,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'delivery',
  address_street TEXT DEFAULT '',
  address_number TEXT DEFAULT '',
  address_complement TEXT DEFAULT '',
  address_neighborhood TEXT DEFAULT '',
  address_reference TEXT DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'pix',
  change_for REAL,
  delivery_fee REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  addons_json TEXT DEFAULT '[]',
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS business_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_of_week INTEGER NOT NULL,
  open_time TEXT DEFAULT '18:00',
  close_time TEXT DEFAULT '23:30',
  closed INTEGER DEFAULT 0,
  UNIQUE(day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`;

db.exec(SCHEMA);

export function now() {
  return new Date().toISOString();
}

export default db;
