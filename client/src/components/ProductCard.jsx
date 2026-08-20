import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import SmartImage from './SmartImage.jsx';
import { formatMoney } from '../utils/format.js';

export default function ProductCard({ product, onQuickAdd }) {
  const hasPromo = product.promo_price != null && product.promo_price < product.price;
  const price = hasPromo ? product.promo_price : product.price;

  return (
    <div className="product-card">
      <Link to={`/produto/${product.id}`} className="product-card-media">
        <SmartImage src={product.image} alt={product.name} />
        {product.featured ? (
          <span className="badge badge-featured">
            <Star size={12} fill="currentColor" /> Destaque
          </span>
        ) : null}
        {hasPromo && (
          <span className="badge badge-promo">
            <span className="old-price">R$ {formatMoney(product.price)}</span>
            {' '}R$ {formatMoney(product.promo_price)}
          </span>
        )}
      </Link>
      <div className="product-card-body">
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>
        <div className="product-card-footer">
          <div className="product-card-price">
            {hasPromo && <span className="price-old">R$ {formatMoney(product.price)}</span>}
            <span className="price-now">R$ {formatMoney(price)}</span>
          </div>
          <button
            className="btn btn-primary btn-icon"
            onClick={() => onQuickAdd?.(product)}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
