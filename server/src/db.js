import { isMainThread, workerData, Worker } from 'worker_threads';
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

if (!isMainThread) {
  const run = async () => {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: workerData.connectionString, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      const result = await client.query(workerData.sql, workerData.params);
      const encoded = new TextEncoder().encode(JSON.stringify({ rows: result.rows, rowCount: result.rowCount }));
      new Uint8Array(workerData.buffer, 4, encoded.length).set(encoded);
      new Int32Array(workerData.buffer)[0] = encoded.length;
    } catch (error) {
      const encoded = new TextEncoder().encode(JSON.stringify({ error: error.message, code: error.code }));
      new Uint8Array(workerData.buffer, 4, encoded.length).set(encoded);
      new Int32Array(workerData.buffer)[0] = -encoded.length;
    } finally {
      Atomics.notify(new Int32Array(workerData.buffer), 0);
      await client.end().catch(() => {});
    }
  };
  await run();
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const usePostgres = Boolean(process.env.DATABASE_URL);
if (usePostgres && !isMainThread) process.exit(0);
if (process.env.VERCEL && !usePostgres) throw new Error('DATABASE_URL não configurada na Vercel');

export const uploadsDir = process.env.VERCEL ? join(tmpdir(), 'hamburgueria-uploads') : join(__dirname, '..', 'uploads');
mkdirSync(uploadsDir, { recursive: true });

function replacePlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function postgresQuery(sql, params) {
  const buffer = new SharedArrayBuffer(4 + 8 * 1024 * 1024);
  const state = new Int32Array(buffer);
  const worker = new Worker(new URL('./db.js', import.meta.url), {
    workerData: { connectionString: process.env.DATABASE_URL, sql: replacePlaceholders(sql), params, buffer },
  });
  Atomics.wait(state, 0, 0);
  const size = Math.abs(state[0]);
  const result = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 4, size)));
  worker.terminate();
  if (state[0] < 0 || result.error) {
    const error = new Error(result.error || 'Erro no PostgreSQL');
    error.code = result.code;
    throw error;
  }
  return result;
}

function createPostgresDb() {
  return {
    prepare(sql) {
      return {
        get: (...params) => postgresQuery(sql, params).rows[0],
        all: (...params) => postgresQuery(sql, params).rows,
        run: (...params) => {
          let statement = sql.replace(/INSERT OR IGNORE/gi, 'INSERT');
          if (/^\s*INSERT\s+INTO/i.test(statement) && !/\bRETURNING\b/i.test(statement) && !/product_addons|settings|business_hours/i.test(statement)) statement += ' RETURNING id';
          const result = postgresQuery(statement, params);
          return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id };
        },
      };
    },
    transaction(callback) {
      return (...args) => callback(...args);
    },
  };
}

function createSqliteDb() {
  const dbPath = process.env.DB_PATH || join(__dirname, '..', 'data', 'hamburgueria.db');
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL DEFAULT 'Administrador', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, icon TEXT DEFAULT 'burger', sort_order INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT DEFAULT '', image TEXT DEFAULT '', price REAL NOT NULL DEFAULT 0, promo_price REAL, category_id INTEGER, active INTEGER DEFAULT 1, featured INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS addons (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price REAL NOT NULL DEFAULT 0, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS product_addons (product_id INTEGER NOT NULL, addon_id INTEGER NOT NULL, PRIMARY KEY (product_id, addon_id));
CREATE TABLE IF NOT EXISTS promotions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT DEFAULT '', image TEXT DEFAULT '', promo_price REAL, start_date DATETIME, end_date DATETIME, active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL, order_type TEXT NOT NULL DEFAULT 'delivery', address_street TEXT DEFAULT '', address_number TEXT DEFAULT '', address_complement TEXT DEFAULT '', address_neighborhood TEXT DEFAULT '', address_reference TEXT DEFAULT '', payment_method TEXT NOT NULL DEFAULT 'pix', change_for REAL, delivery_fee REAL NOT NULL DEFAULT 0, subtotal REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0, notes TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'new', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, product_id INTEGER, product_name TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, unit_price REAL NOT NULL DEFAULT 0, addons_json TEXT DEFAULT '[]', notes TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS business_hours (id INTEGER PRIMARY KEY AUTOINCREMENT, day_of_week INTEGER NOT NULL UNIQUE, open_time TEXT DEFAULT '18:00', close_time TEXT DEFAULT '23:30', closed INTEGER DEFAULT 0);`);
  return db;
}

export const db = usePostgres ? createPostgresDb() : createSqliteDb();
export function now() { return new Date().toISOString(); }
export default db;
