import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { api } from '../../api.js';

const ICONS = ['burger', 'package', 'fries', 'cup-soda', 'glass-water', 'ice-cream', 'tag', 'pizza', 'wine', 'coffee'];

export default function AdminCategories() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');

  async function load() {
    setRows(await api.get('/admin/categories'));
  }
  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      if (form.id) {
        await api.put(`/admin/categories/${form.id}`, form);
      } else {
        await api.post('/admin/categories', form);
      }
      setForm(null);
      setMessage('Categoria salva');
      setTimeout(() => setMessage(''), 2500);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Excluir esta categoria? Os produtos serão mantidos sem categoria.')) return;
    await api.delete(`/admin/categories/${id}`);
    await load();
  }

  async function toggleActive(c) {
    await api.put(`/admin/categories/${c.id}`, { ...c, active: !c.active });
    await load();
  }

  const empty = { id: null, name: '', slug: '', icon: 'burger', sort_order: 0, active: true };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Categorias</h1>
          <p>Organize os produtos do cardápio</p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({ ...empty })}>
          <Plus size={18} /> Nova categoria
        </button>
      </div>
      {message && <div className="alert-success">{message}</div>}

      {form && (
        <div className="panel form-section inline-form">
          <form onSubmit={submit} className="admin-form-grid">
            <div className="form-field">
              <label>Nome*</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Hambúrgueres" />
            </div>
            <div className="form-field">
              <label>Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="hamburgueres" />
            </div>
            <div className="form-field">
              <label>Ícone</label>
              <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Ordem</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Ativa</label>
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
            <tr><th>Ícone</th><th>Nome</th><th>Slug</th><th>Produtos</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td><span className="cat-icon-chip">{c.icon}</span></td>
                <td><strong>{c.name}</strong></td>
                <td>{c.slug}</td>
                <td>{c.product_count ?? ''}</td>
                <td>
                  <button className={`toggle ${c.active ? 'on' : ''}`} onClick={() => toggleActive(c)}>
                    {c.active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="actions-cell">
                  <button className="icon-btn" onClick={() => setForm({ ...c })} aria-label="Editar"><Pencil size={17} /></button>
                  <button className="icon-btn danger" onClick={() => remove(c.id)} aria-label="Excluir"><Trash2 size={17} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
