import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { api } from '../../api.js';
import SmartImage from '../../components/SmartImage.jsx';
import { formatMoney, formatDate } from '../../utils/format.js';

export default function AdminPromotions() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setRows(await api.get('/admin/promotions'));
  }
  useEffect(() => {
    load().catch(() => {});
  }, []);

  function openEdit(p) {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description,
      promo_price: p.promo_price != null ? String(p.promo_price) : '',
      start_date: p.start_date ? p.start_date.slice(0, 16) : '',
      end_date: p.end_date ? p.end_date.slice(0, 16) : '',
      active: !!p.active,
    });
    setPreview(p.image);
    setImageFile(null);
  }

  function openNew() {
    const start = new Date();
    const end = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    setForm({
      id: null,
      name: '',
      description: '',
      promo_price: '',
      start_date: start.toISOString().slice(0, 16),
      end_date: end.toISOString().slice(0, 16),
      active: true,
    });
    setPreview('');
    setImageFile(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) { alert('Informe o nome da promoção'); return; }
    const data = new FormData();
    data.append('name', form.name);
    data.append('description', form.description);
    data.append('promo_price', form.promo_price || '');
    data.append('start_date', form.start_date ? new Date(form.start_date).toISOString() : '');
    data.append('end_date', form.end_date ? new Date(form.end_date).toISOString() : '');
    data.append('active', form.active);
    data.append('image', imageFile ? '' : preview);
    if (imageFile) data.append('image', imageFile);

    try {
      if (form.id) {
        await api.upload(`/admin/promotions/${form.id}`, data);
      } else {
        await api.upload('/admin/promotions', data);
      }
      setForm(null);
      setMessage('Promoção salva');
      setTimeout(() => setMessage(''), 2500);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Excluir esta promoção?')) return;
    await api.delete(`/admin/promotions/${id}`);
    await load();
  }

  async function toggleActive(p) {
    await api.put(`/admin/promotions/${p.id}`, { ...p, active: !p.active });
    await load();
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Promoções</h1>
          <p>Exibidas automaticamente no site enquanto ativas</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Nova promoção
        </button>
      </div>
      {message && <div className="alert-success">{message}</div>}

      {form && (
        <div className="modal-backdrop" onClick={() => setForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{form.id ? 'Editar promoção' : 'Nova promoção'}</h2>
              <button className="icon-btn" onClick={() => setForm(null)}><X size={20} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="admin-form-grid">
                <div className="form-field">
                  <label>Nome da promoção*</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Smash do Dia" />
                </div>
                <div className="form-field">
                  <label>Preço promocional (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.promo_price} onChange={(e) => setForm({ ...form, promo_price: e.target.value })} />
                </div>
                <div className="form-field full">
                  <label>Descrição</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Data inicial</label>
                  <input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Data final</label>
                  <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Imagem</label>
                  <div className="image-uploader small">
                    {preview ? (
                      <div className="image-preview">
                        <SmartImage src={preview} alt="" />
                      </div>
                    ) : (
                      <label className="upload-placeholder">
                        <span>Enviar imagem</span>
                      </label>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setImageFile(f); setPreview(URL.createObjectURL(f)); }
                    }} className="hidden-file" />
                  </div>
                </div>
                <div className="form-field">
                  <label>Ativa</label>
                  <select value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
                    <option value="1">Sim</option>
                    <option value="0">Não</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {form.id ? <><Save size={16} /> Salvar</> : <><Loader2 size={16} /> Criar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="panel table-wrap">
        <table className="data-table">
          <thead>
            <tr><th></th><th>Promoção</th><th>Preço</th><th>Período</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td><SmartImage src={p.image} alt="" className="table-thumb" /></td>
                <td>
                  <strong>{p.name}</strong>
                  <small className="block muted">{p.description}</small>
                </td>
                <td className="text-promo">R$ {formatMoney(p.promo_price)}</td>
                <td>
                  <small>
                    {p.start_date ? formatDate(p.start_date) : '—'}
                    {' até '}
                    {p.end_date ? formatDate(p.end_date) : '—'}
                  </small>
                </td>
                <td>
                  <button className={`toggle ${p.active ? 'on' : ''}`} onClick={() => toggleActive(p)}>
                    {p.active ? 'Ativa' : 'Inativa'}
                  </button>
                </td>
                <td className="actions-cell">
                  <button className="icon-btn" onClick={() => openEdit(p)} aria-label="Editar"><Pencil size={17} /></button>
                  <button className="icon-btn danger" onClick={() => remove(p.id)} aria-label="Excluir"><Trash2 size={17} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
