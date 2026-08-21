import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, Check } from 'lucide-react';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import SmartImage from '../components/SmartImage.jsx';
import { formatMoney } from '../utils/format.js';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get(`/products/${id}`)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container spinner-wrap">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container empty-state">
        <p>{error || 'Produto não encontrado'}</p>
        <Link to="/cardapio" className="btn btn-primary">Voltar ao cardápio</Link>
      </div>
    );
  }

  const hasPromo = product.promo_price != null && product.promo_price < product.price;
  const basePrice = hasPromo ? product.promo_price : product.price;
  const addons = Array.isArray(product.addons) ? product.addons : [];
  const addonsTotal = Object.values(selected).reduce((s, a) => s + Number(a.price || 0), 0);
  const unitTotal = basePrice + addonsTotal;
  const total = unitTotal * quantity;

  function toggleAddon(addon) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[addon.id]) delete next[addon.id];
      else next[addon.id] = addon;
      return next;
    });
  }

  function handleAdd() {
    addItem({
      product,
      addons: Object.values(selected),
      notes,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="container product-detail">
      <Link to="/cardapio" className="back-link">
        <ArrowLeft size={16} /> Voltar ao cardápio
      </Link>

      <div className="product-detail-grid">
        <div className="product-detail-media">
          <SmartImage src={product.image} alt={product.name} />
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="product-detail-desc">{product.description}</p>

          <div className="product-detail-price">
            {hasPromo && <span className="price-old">R$ {formatMoney(product.price)}</span>}
            <span className="price-now big">R$ {formatMoney(basePrice)}</span>
            {hasPromo && <span className="badge badge-promo">Oferta</span>}
          </div>

          {addons.length > 0 && (
            <div className="addons-section">
              <h3>Adicionais</h3>
              <div className="addons-grid">
                {addons.map((addon) => {
                  const active = !!selected[addon.id];
                  return (
                    <button
                      key={addon.id}
                      className={`addon-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleAddon(addon)}
                    >
                      <span>{active ? <Check size={14} /> : <Plus size={14} />}</span>
                      <span>{addon.name}</span>
                      {addon.price > 0 && (
                        <strong>+ R$ {formatMoney(addon.price)}</strong>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="notes-section">
            <label htmlFor="notes">Observações do item (opcional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: sem alface, ponto da carne, etc."
              rows={3}
            />
          </div>

          <div className="qty-row">
            <div className="qty-control">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Diminuir">
                <Minus size={18} />
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Aumentar">
                <Plus size={18} />
              </button>
            </div>

            <button className="btn btn-primary btn-lg add-to-cart-btn" onClick={handleAdd}>
              <ShoppingBag size={20} />
              Adicionar · R$ {formatMoney(total)}
            </button>
          </div>

          {added && (
            <div className="added-note">
              <Check size={18} /> Adicionado ao carrinho!
            </div>
          )}

          <div className="detail-actions">
            <button className="btn btn-outline" onClick={() => navigate('/carrinho')}>
              Ir para o carrinho
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/cardapio')}>
              Continuar comprando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
