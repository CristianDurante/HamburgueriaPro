import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import SmartImage from '../components/SmartImage.jsx';
import { formatMoney } from '../utils/format.js';

export default function CartPage() {
  const { items, subtotal, updateQty, removeItem } = useCart();
  const { config, open: isOpen } = useStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container empty-state">
        <div className="empty-icon"><ShoppingBag size={40} /></div>
        <h2>Seu carrinho está vazio</h2>
        <p>Explore o cardápio e adicione seus favoritos.</p>
        <Link to="/cardapio" className="btn btn-primary">
          Ver cardápio <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  const fee = Number(config.deliveryFee) || 0;
  const total = subtotal + fee;

  return (
    <div className="container cart-page">
      <h1 className="page-title">Seu pedido</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((it) => {
            const addonsTotal = (it.addons || []).reduce((s, a) => s + Number(a.price || 0), 0);
            return (
              <div className="cart-item" key={it.key}>
                <SmartImage src={it.image} alt={it.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <h3>{it.name}</h3>
                  {it.addons?.length > 0 && (
                    <p className="cart-item-addons">
                      {it.addons.map((a) => a.name).join(', ')}
                    </p>
                  )}
                  {it.notes && <p className="cart-item-notes">Obs: {it.notes}</p>}
                  <div className="cart-item-bottom">
                    <div className="qty-control sm">
                      <button onClick={() => updateQty(it.key, it.quantity - 1)} aria-label="Diminuir">
                        <Minus size={14} />
                      </button>
                      <span>{it.quantity}</span>
                      <button onClick={() => updateQty(it.key, it.quantity + 1)} aria-label="Aumentar">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      className="icon-btn danger"
                      onClick={() => removeItem(it.key)}
                      aria-label="Remover item"
                    >
                      <Trash2 size={18} />
                    </button>
                    <strong>R$ {formatMoney((Number(it.basePrice) + addonsTotal) * it.quantity)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="cart-summary">
          <h3>Resumo</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>R$ {formatMoney(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Taxa de entrega</span>
            <strong>R$ {formatMoney(fee)}</strong>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>R$ {formatMoney(total)}</strong>
          </div>
          {!isOpen && (
            <p className="warning-text">
              A hamburgueria está fechada no momento. Você pode preparar seu pedido,
              mas a confirmação ocorrerá quando abrirmos.
            </p>
          )}
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={() => navigate('/checkout')}
          >
            Finalizar pedido <ArrowRight size={18} />
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => navigate('/cardapio')}>
            <ArrowLeft size={16} /> Continuar comprando
          </button>
        </aside>
      </div>
    </div>
  );
}
