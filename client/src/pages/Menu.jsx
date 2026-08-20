import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Clock, MapPin } from 'lucide-react';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { formatMoney } from '../utils/format.js';

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const activeSlug = params.get('categoria') || 'todos';
  const { addItem } = useCart();
  const { config, hours, open: isOpen, openStatus } = useStore();

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/products'), api.get('/promotions')])
      .then(([c, p, pr]) => {
        setCategories(c);
        setProducts(p);
        setPromos(pr);
      })
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const result = [];
    const cats = categories.filter((c) => c.slug !== 'promocoes');
    for (const cat of cats) {
      result.push({ ...cat, products: products.filter((p) => p.category_id === cat.id) });
    }
    return result;
  }, [categories, products]);

  const shown = activeSlug === 'todos' ? grouped : grouped.filter((g) => g.slug === activeSlug);

  const promoProducts = products.filter(
    (p) => p.promo_price != null && p.promo_price < p.price
  );

  function quickAdd(product) {
    addItem({ product });
  }

  const todayHours = hours.find((h) => h.dayOfWeek === new Date().getDay());

  return (
    <div className="menu-page container">
      <div className="menu-head">
        <span className="section-eyebrow">Cardápio completo</span>
        <h1 className="page-title">Escolha seu favorito</h1>
        <div className="menu-info">
          <span className={`open-chip ${isOpen ? 'open' : 'closed'}`}>
            {isOpen ? 'Aberto agora' : 'Fechado agora'}
          </span>
          <span className="menu-info-item">
            <Clock size={15} />
            {todayHours?.closed
              ? 'Fechado hoje'
              : `${todayHours?.openTime || '18:00'} - ${todayHours?.closeTime || '23:30'}`}
          </span>
          <span className="menu-info-item">
            <MapPin size={15} /> Entrega: R$ {formatMoney(config.deliveryFee)} · Pedido mínimo R${' '}
            {formatMoney(config.minOrder)}
          </span>
        </div>
      </div>

      <div className="menu-tabs">
        <button
          className={`menu-tab ${activeSlug === 'todos' ? 'active' : ''}`}
          onClick={() => setParams({})}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`menu-tab ${activeSlug === c.slug ? 'active' : ''}`}
            onClick={() => setParams({ categoria: c.slug })}
          >
            {c.name}
          </button>
        ))}
      </div>

      {promos.length > 0 && activeSlug === 'todos' && (
        <section className="menu-promos">
          <span className="section-eyebrow">Ofertas</span>
          <h2 className="section-title">Promoções ativas</h2>
          <div className="menu-promo-grid">
            {promos.map((promo) => (
              <div className="menu-promo-card" key={promo.id}>
                <img src={promo.image} alt={promo.name} />
                <div>
                  <span className="badge badge-promo">
                    R$ {formatMoney(promo.promo_price)}
                  </span>
                  <h3>{promo.name}</h3>
                  <p>{promo.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : shown.length === 0 ? (
        <p className="muted-text">Nenhum produto nesta categoria.</p>
      ) : (
        shown.map((group) =>
          group.products.length > 0 ? (
            <section className="menu-group" key={group.id} id={group.slug}>
              <h2 className="menu-group-title">{group.name}</h2>
              <div className="products-grid">
                {group.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickAdd={quickAdd}
                  />
                ))}
              </div>
            </section>
          ) : null
        )
      )}
    </div>
  );
}
