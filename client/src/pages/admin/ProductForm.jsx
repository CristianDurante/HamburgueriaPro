import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Upload, X } from 'lucide-react';
import { api } from '../../api.js';
import SmartImage from '../../components/SmartImage.jsx';

const EMPTY = {
  name: '',
  description: '',
  price: '',
  promo_price: '',
  category_id: '',
  active: true,
  featured: false,
  sort_order: 0,
  addonIds: [],
  image: '',
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [addons, setAddons] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/admin/categories'), api.get('/admin/addons')])
      .then(([c, a]) => {
        setCategories(Array.isArray(c) ? c : []);
        setAddons(Array.isArray(a) ? a : []);
      })
      .catch(() => {});
    if (isEdit) {
      api.get(`/admin/products/${id}`).then((p) => {
        setForm({
          name: p.name,
          description: p.description,
          price: String(p.price),
          promo_price: p.promo_price != null ? String(p.promo_price) : '',
          category_id: String(p.category_id || ''),
          active: !!p.active,
          featured: !!p.featured,
          sort_order: p.sort_order || 0,
          addonIds: p.addonIds || [],
        });
        setPreview(p.image);
        setForm((f) => ({ ...f, image: p.image }));
      });
    }
  }, [id, isEdit]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleAddon(addonId) {
    setForm((f) => ({
      ...f,
      addonIds: f.addonIds.includes(addonId)
        ? f.addonIds.filter((a) => a !== addonId)
        : [...f.addonIds, addonId],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Informe o nome do produto'); return; }
    if (!form.category_id) { setError('Selecione a categoria'); return; }
    if (!Number(form.price)) { setError('Informe um preço válido'); return; }

    const data = new FormData();
    data.append('name', form.name);
    data.append('description', form.description);
    data.append('price', form.price);
    data.append('promo_price', form.promo_price || '');
    data.append('category_id', form.category_id);
    data.append('active', form.active);
    data.append('featured', form.featured);
    data.append('sort_order', form.sort_order);
    form.addonIds.forEach((a) => data.append('addonIds', a));
    data.append('image', imageFile ? '' : preview);
    if (imageFile) data.append('image', imageFile);

    setSaving(true);
    try {
      if (isEdit) {
        await api.upload(`/admin/products/${id}`, data);
      } else {
        await api.upload('/admin/products', data);
      }
      navigate('/admin/produtos');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  function onImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <Link to="/admin/produtos" className="back-link">
            <ArrowLeft size={16} /> Produtos
          </Link>
          <h1>{isEdit ? 'Editar produto' : 'Novo produto'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {error && <div className="alert-error">{error}</div>}

        <div className="admin-form-grid">
          <div className="panel form-section">
            <h3>Informações</h3>
            <div className="form-field">
              <label htmlFor="name">Nome*</label>
              <input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Smash Burger Clássico" />
            </div>
            <div className="form-field">
              <label htmlFor="desc">Descrição</label>
              <textarea id="desc" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Descrição do produto..." />
            </div>
            <div className="form-grid two">
              <div className="form-field">
                <label htmlFor="price">Preço (R$)*</label>
                <input id="price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="promo">Preço promocional (R$)</label>
                <input id="promo" type="number" step="0.01" min="0" value={form.promo_price} onChange={(e) => set('promo_price', e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <div className="form-grid two">
              <div className="form-field">
                <label htmlFor="cat">Categoria*</label>
                <select id="cat" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                  <option value="">Selecione...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="sort">Ordem</label>
                <input id="sort" type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
              </div>
            </div>
            <div className="form-switches">
              <label className="switch">
                <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
                <span className="switch-track"></span>
                Ativo no cardápio
              </label>
              <label className="switch">
                <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
                <span className="switch-track"></span>
                Destaque na página inicial
              </label>
            </div>
          </div>

          <div className="form-side">
            <div className="panel form-section">
              <h3>Imagem</h3>
              <div className="image-uploader">
                {preview ? (
                  <div className="image-preview">
                    <SmartImage src={preview} alt="" />
                    <button type="button" className="icon-btn danger remove-img" onClick={() => { setPreview(''); setImageFile(null); }} aria-label="Remover imagem">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="upload-placeholder">
                    <Upload size={28} />
                    <span>Clique para enviar imagem</span>
                  </label>
                )}
                <input type="file" accept="image/*" onChange={onImageChange} className="hidden-file" />
              </div>
              {!preview && !imageFile && (
                <div className="form-field">
                  <label htmlFor="imageUrl">Ou cole uma URL</label>
                  <input id="imageUrl" value={form.imageUrl || ''} onChange={(e) => { set('imageUrl', e.target.value); setPreview(e.target.value); }} placeholder="https://..." />
                </div>
              )}
            </div>

            <div className="panel form-section">
              <h3>Adicionais disponíveis</h3>
              {addons.length === 0 ? (
                <p className="muted-text">Cadastre adicionais primeiro.</p>
              ) : (
                <div className="addon-check-list">
                  {addons.map((a) => (
                    <label key={a.id} className={`check-option ${form.addonIds.includes(a.id) ? 'active' : ''}`}>
                      <input type="checkbox" checked={form.addonIds.includes(a.id)} onChange={() => toggleAddon(a.id)} />
                      <span>{a.name}</span>
                      <small>+ R$ {Number(a.price).toFixed(2)}</small>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/produtos')}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
            {isEdit ? 'Salvar alterações' : 'Criar produto'}
          </button>
        </div>
      </form>
    </div>
  );
}
