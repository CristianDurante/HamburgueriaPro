import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { formatMoney } from '../utils/format.js';

export default function CartBar() {
  const { items, subtotal, count, updateQty, removeItem } = useCart();
  const { config } = useStore();
  const location = useLocation();

  if (count === 0 || location.pathname === '/carrinho') return null;

  const fee = Number(config.deliveryFee) || 0;
  const total = subtotal + fee;

  return (
    <div className="cart-bar">
      <div className="container cart-bar-inner">
        <div className="cart-bar-items">
          {items.slice(0, 2).map((it) => (
            <div className="cart-bar-item" key={it.key}>
              <img src={it.image} alt="" />
              <span>{it.quantity}x {it.name}</span>
            </div>
          ))}
          {items.length > 2 && <span className="cart-bar-more">+{items.length - 2}</span>}
        </div>
        <div className="cart-bar-total">
          <div>
            <small>{count} {count === 1 ? 'item' : 'itens'}</small>
            <strong>R$ {formatMoney(total)}</strong>
          </div>
          <Link to="/carrinho" className="btn btn-primary">
            Ver carrinho <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
