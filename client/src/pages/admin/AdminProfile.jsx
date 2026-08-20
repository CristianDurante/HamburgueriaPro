import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminProfile() {
  const { admin } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    if (form.newPassword !== form.confirm) {
      setMessage('A confirmação não confere com a nova senha');
      return;
    }
    if (form.newPassword.length < 6) {
      setMessage('A nova senha deve ter ao menos 6 caracteres');
      return;
    }
    setSaving(true);
    try {
      await api.put('/admin/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage('Senha alterada com sucesso!');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Meu perfil</h1>
          <p>Usuário: <strong>{admin?.username}</strong></p>
        </div>
      </div>

      <div className="panel form-section admin-form">
        {message && <div className={message.includes('sucesso') ? 'alert-success' : 'alert-error'}>{message}</div>}
        <form onSubmit={handleSubmit} className="admin-form-grid">
          <div className="form-field">
            <label>Senha atual</label>
            <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Nova senha</label>
            <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Confirmar nova senha</label>
            <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              Alterar senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
