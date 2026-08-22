import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { uploadsDir } from './db.js';
import './seed.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import orderRoutes from './routes/orders.js';
import adminProducts from './routes/admin-products.js';
import adminCategories from './routes/admin-categories.js';
import adminAddons from './routes/admin-addons.js';
import adminPromotions from './routes/admin-promotions.js';
import adminOrders from './routes/admin-orders.js';
import adminSettings from './routes/admin-settings.js';
import adminStats from './routes/admin-stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', publicRoutes);
app.use('/api/orders', orderRoutes);

app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/products', adminProducts);
app.use('/api/admin/categories', adminCategories);
app.use('/api/admin/addons', adminAddons);
app.use('/api/admin/promotions', adminPromotions);
app.use('/api/admin/orders', adminOrders);
app.use('/api/admin/settings', adminSettings);
app.use('/api/admin/stats', adminStats);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large' || err?.status === 413 || err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Dados enviados são muito grandes' });
  }
  if (err && err.message && err.message.includes('Apenas imagens')) {
    return res.status(400).json({ error: err.message });
  }
  if (err?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({ error: 'Referência inválida nos dados enviados' });
  }
  if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Já existe um registro com esses dados' });
  }
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

export default app;

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3001;
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}
