import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Informe usuário e senha' });
  }
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(String(username).trim());
  if (!admin || !bcrypt.compareSync(String(password), admin.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const token = signToken(admin);
  res.json({
    token,
    admin: { id: admin.id, username: admin.username, name: admin.name },
  });
});

router.get('/me', requireAdmin, (req, res) => {
  const admin = db
    .prepare('SELECT id, username, name, created_at FROM admins WHERE id = ?')
    .get(req.admin.id);
  if (!admin) return res.status(404).json({ error: 'Não encontrado' });
  res.json(admin);
});

router.put('/password', requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter ao menos 6 caracteres' });
  }
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(String(currentPassword || ''), admin.password_hash)) {
    return res.status(400).json({ error: 'Senha atual incorreta' });
  }
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(String(newPassword), 10),
    admin.id
  );
  res.json({ ok: true });
});

export default router;
