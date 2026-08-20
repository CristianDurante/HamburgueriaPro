import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, User, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <span className="brand-mark"><Flame size={26} fill="currentColor" /></span>
          <h1>Kintal Lanches</h1>
          <p>Painel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <div className="alert-error">{error}</div>}
          <div className="form-field">
            <label htmlFor="username">Usuário</label>
            <div className="input-icon">
              <User size={18} />
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="password">Senha</label>
            <div className="input-icon">
              <Lock size={18} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? <Loader2 size={20} className="spin" /> : 'Entrar'}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate('/')}>
            Voltar ao site
          </button>
        </form>
      </div>
    </div>
  );
}
