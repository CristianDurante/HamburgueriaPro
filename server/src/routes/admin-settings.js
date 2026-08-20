import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  getStoreConfig,
  setSetting,
  getBusinessHours,
  setBusinessHours,
} from '../settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `logo-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024 } });

const router = Router();
router.use(requireAdmin);

const ALLOWED_KEYS = new Set([
  'store_name',
  'store_phone',
  'store_whatsapp',
  'store_address',
  'delivery_fee',
  'delivery_neighborhoods',
  'min_order',
  'avg_delivery_time',
  'block_when_closed',
  'accept_delivery',
  'accept_pickup',
  'whatsapp_provider',
  'whatsapp_api_url',
  'whatsapp_api_token',
  'whatsapp_number',
  'pix_key',
]);

router.get('/', (req, res) => {
  res.json({
    ...getStoreConfig(),
    _private: {
      hasWhatsappToken: !!(getStoreConfig().whatsappApiToken || process.env.EVOLUTION_TOKEN),
    },
  });
});

router.put('/', (req, res) => {
  const body = req.body || {};
  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (key === 'delivery_neighborhoods') {
      setSetting(key, JSON.stringify(Array.isArray(value) ? value.filter(Boolean) : []));
    } else if (typeof value === 'boolean') {
      setSetting(key, value ? 'true' : 'false');
    } else {
      setSetting(key, String(value ?? ''));
    }
  }
  res.json(getStoreConfig());
});

router.post('/logo', upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envie uma imagem' });
  setSetting('store_logo', `/uploads/${req.file.filename}`);
  res.json({ logo: `/uploads/${req.file.filename}` });
});

router.get('/hours', (req, res) => {
  res.json(getBusinessHours());
});

router.put('/hours', (req, res) => {
  const hours = Array.isArray(req.body) ? req.body : [];
  if (hours.length !== 7) return res.status(400).json({ error: 'Envie os 7 dias da semana' });
  setBusinessHours(hours);
  res.json(getBusinessHours());
});

export default router;
