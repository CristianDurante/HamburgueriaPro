import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { api } from '../../api.js';

export default function AdminAddons() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');

  async function load() {
    setRows(await api.get('/admin/addons'));
  }
  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      if (form.id) {
        await api.put(`/admin/addons/${form.id}`, form);
      } else {
        await api.post('/admin/addons', form);
      }
      setForm(null);
      setMessage('Adicional salvo');
      setTimeout(() => setMessage(''), 2500);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Excluir este adicional? Ele será removido dos produtos.')) return;
    await api.delete(`/admin/addons/${id}`);
    await load();
  }

  async function toggleActive(a) {
    await api.put(`/admin/addons/${a.id}`, { ...a, active: !a.active });
    await load();
  }

  const empty = { id: null, name: '', price: '', active: true, sort_order: 0 };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Adicionais</h1>
          <p>Ingredientes extras que podem ser vinculados aos produtos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({ ...empty })}>
          <Plus size={18} /> Novo adicional
        </button>
      </div>
      {message && <div className="alert-success">{message}</div>}

      {form && (
        <div className="panel form-section inline-form">
          <form onSubmit={submit} className="admin-form-grid">
            <div className="form-field">
              <label>Nome*</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bacon extra" />
            </div>
            <div className="form-field">
              <label>Preço (R$)</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Ordem</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Ativo</label>
              <select value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
                <option value="1">Sim</option>
                <option value="0">Não</option>
              </select>
            </div>
            <div className="inline-form-actions">
              <button className="btn btn-primary" type="submit">
                {form.id ? <><Save size={16} /> Salvar</> : <><Loader2 size={16} /> Criar</>}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}><X size={16} /> Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="panel table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Nome</th><th>Preço</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.name}</strong></td>
                <td>R$ {Number(a.price).toFixed(2)}</td>
                <td>
                  <button className={`toggle ${a.active ? 'on' : ''}`} onClick={() => toggleActive(a)}>
                    {a.active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="actions-cell">
                  <button className="icon-btn" onClick={() => setForm({ ...a })} aria-label="Editar"><Pencil size={17} /></button>
                  <button className="icon-btn danger" onClick={() => remove(a.id)} aria-label="Excluir"><Trash2 size={17} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
