import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Star, Power } from 'lucide-react';
import { api } from '../../api.js';
import SmartImage from '../../components/SmartImage.jsx';
import { formatMoney } from '../../utils/format.js';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [confirmId, setConfirmId] = useState(null);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  async function load() {
    const [p, c] = await Promise.all([api.get('/admin/products'), api.get('/admin/categories')]);
    setProducts(Array.isArray(p) ? p : []);
    setCategories(Array.isArray(c) ? c : []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const catName = (id) => categories.find((c) => c.id === id)?.name || '—';

  async function toggleActive(p) {
    await api.put(`/admin/products/${p.id}`, { ...p, active: !p.active, addonIds: p.addonIds || [] });
    await load();
  }

  async function remove(id) {
    await api.delete(`/admin/products/${id}`);
    setConfirmId(null);
    setMessage('Produto excluído');
    setTimeout(() => setMessage(''), 2500);
    await load();
  }

  const filtered = filter === 'all' ? products : products.filter((p) => String(p.category_id) === filter);

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Produtos</h1>
          <p>{products.length} itens cadastrados</p>
        </div>
        <Link to="/admin/produtos/novo" className="btn btn-primary">
          <Plus size={18} /> Novo produto
        </Link>
      </div>

      {message && <div className="alert-success">{message}</div>}

      <div className="filter-row">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="panel table-wrap">
        <table className="data-table products-table">
          <thead>
            <tr>
              <th></th>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Promo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td><SmartImage src={p.image} alt="" className="table-thumb" /></td>
                <td>
                  <strong>{p.name}</strong>
                  {p.featured ? (
                    <span className="mini-badge"><Star size={12} fill="currentColor" /> Destaque</span>
                  ) : null}
                </td>
                <td>{catName(p.category_id)}</td>
                <td>R$ {formatMoney(p.price)}</td>
                <td>
                  {p.promo_price != null ? (
                    <span className="text-promo">R$ {formatMoney(p.promo_price)}</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <button
                    className={`toggle ${p.active ? 'on' : ''}`}
                    onClick={() => toggleActive(p)}
                    aria-label="Ativar/desativar"
                  >
                    <Power size={14} />
                    {p.active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="actions-cell">
                  <Link to={`/admin/produtos/${p.id}`} className="icon-btn" aria-label="Editar">
                    <Pencil size={17} />
                  </Link>
                  {confirmId === p.id ? (
                    <span className="confirm-inline">
                      <button className="btn btn-danger btn-xs" onClick={() => remove(p.id)}>Excluir</button>
                      <button className="btn btn-ghost btn-xs" onClick={() => setConfirmId(null)}>Cancelar</button>
                    </span>
                  ) : (
                    <button className="icon-btn danger" onClick={() => setConfirmId(p.id)} aria-label="Excluir">
                      <Trash2 size={17} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
