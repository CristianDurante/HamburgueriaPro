import jwt from 'jsonwebtoken';
import 'dotenv/config';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(admin) {
  return jwt.sign({ id: admin.id, username: admin.username }, SECRET, {
    expiresIn: EXPIRES,
  });
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  try {
    const payload = jwt.verify(token, SECRET);
    req.admin = { id: payload.id, username: payload.username };
    return next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada ou inválida' });
  }
}
