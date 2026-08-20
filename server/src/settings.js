import { db } from './db.js';

export function getSetting(key, fallback = '') {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

export function getSettingJson(key, fallback = null) {
  const val = getSetting(key);
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function setSetting(key, value) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

export function getStoreConfig() {
  return {
    name: getSetting('store_name', 'Kintal Lanches'),
    logo: getSetting('store_logo', ''),
    phone: getSetting('store_phone', ''),
    whatsapp: getSetting('store_whatsapp', ''),
    address: getSetting('store_address', ''),
    deliveryFee: Number(getSetting('delivery_fee', '5')) || 0,
    neighborhoods: getSettingJson('delivery_neighborhoods', []),
    minOrder: Number(getSetting('min_order', '0')) || 0,
    avgDeliveryTime: getSetting('avg_delivery_time', '30 - 50 min'),
    blockWhenClosed: getSetting('block_when_closed', 'true') === 'true',
    whatsappProvider: getSetting('whatsapp_provider', process.env.WHATSAPP_PROVIDER || 'wa.me'),
    whatsappApiUrl: getSetting('whatsapp_api_url', ''),
    whatsappApiToken: getSetting('whatsapp_api_token', ''),
    whatsappNumber: getSetting('whatsapp_number', ''),
    pixKey: getSetting('pix_key', ''),
    acceptDelivery: getSetting('accept_delivery', 'true') === 'true',
    acceptPickup: getSetting('accept_pickup', 'true') === 'true',
  };
}

const DAY_NAMES = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

export function getBusinessHours() {
  const rows = db
    .prepare('SELECT * FROM business_hours ORDER BY day_of_week')
    .all();
  const map = Array.from({ length: 7 }, (_, day) => ({
    dayOfWeek: day,
    name: DAY_NAMES[day],
    openTime: '18:00',
    closeTime: '23:30',
    closed: true,
  }));
  for (const r of rows) {
    map[r.day_of_week] = {
      dayOfWeek: r.day_of_week,
      name: DAY_NAMES[r.day_of_week],
      openTime: r.open_time,
      closeTime: r.close_time,
      closed: !!r.closed,
    };
  }
  return map;
}

export function setBusinessHours(hours) {
  const upsert = db.prepare(
    `INSERT INTO business_hours (day_of_week, open_time, close_time, closed)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(day_of_week) DO UPDATE SET
       open_time = excluded.open_time,
       close_time = excluded.close_time,
       closed = excluded.closed`
  );
  const tx = db.transaction((items) => {
    for (const h of items) {
      upsert.run(
        Number(h.dayOfWeek),
        h.openTime || '18:00',
        h.closeTime || '23:30',
        h.closed ? 1 : 0
      );
    }
  });
  tx(hours);
}

export function isStoreOpenAt(date = new Date()) {
  const day = date.getDay();
  const row = db
    .prepare(
      'SELECT open_time, close_time, closed FROM business_hours WHERE day_of_week = ?'
    )
    .get(day);
  if (!row || row.closed) return { open: false };
  const nowMin = date.getHours() * 60 + date.getMinutes();
  const [oh, om] = (row.open_time || '18:00').split(':').map(Number);
  const [ch, cm] = (row.close_time || '23:30').split(':').map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  if (closeMin < openMin) {
    return { open: nowMin >= openMin || nowMin < closeMin };
  }
  return { open: nowMin >= openMin && nowMin < closeMin };
}
