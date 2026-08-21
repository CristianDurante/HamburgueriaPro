import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Flame,
  Clock,
  Bike,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import SmartImage from '../components/SmartImage.jsx';
import { formatMoney } from '../utils/format.js';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1400&q=75';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [promos, setPromos] = useState([]);
  const [categories, setCategories] = useState([]);
  const { addItem } = useCart();
  const { config } = useStore();

  useEffect(() => {
    Promise.all([
      api.get('/products/featured'),
      api.get('/promotions'),
      api.get('/categories'),
    ])
      .then(([f, p, c]) => {
        setFeatured(Array.isArray(f) ? f : []);
        setPromos(Array.isArray(p) ? p : []);
        setCategories(Array.isArray(c) ? c : []);
      })
      .catch(() => {});
  }, []);

  function quickAdd(product) {
    addItem({ product });
  }

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content container">
          <span className="hero-eyebrow">
            <Flame size={16} /> Hambúrguer feito na hora
          </span>
          <h1 className="hero-title">
            O verdadeiro sabor de <span>hambúrguer</span> <br />
            <em>com o dobro de</em> <span className="accent">ousadia.</span>
          </h1>
          <p className="hero-sub">
            Monte seu pedido em segundos e receba no conforto da sua casa ou retire
            na loja. Pagamento no Pix, dinheiro ou cartão.
          </p>
          <div className="hero-actions">
            <Link to="/cardapio" className="btn btn-primary btn-lg">
              Ver Cardápio <ArrowRight size={20} />
            </Link>
            <Link to="/#promocoes" className="btn btn-outline btn-lg">
              Promoções da semana
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <Bike size={20} />
              <span>Entrega média {config.avgDeliveryTime || '30-50 min'}</span>
            </div>
            <div className="hero-stat">
              <Clock size={20} />
              <span>Pedido via WhatsApp</span>
            </div>
            <div className="hero-stat">
              <ShieldCheck size={20} />
              <span>Pagamento na entrega ou Pix</span>
            </div>
          </div>
        </div>
        <div className="hero-media">
          <img src={HERO_IMAGE} alt="Hambúrguer" />
          <div className="hero-blob" />
        </div>
      </section>

      <section className="section promo-section" id="promocoes">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-eyebrow">Ofertas imperdíveis</span>
              <h2 className="section-title">Promoções da semana</h2>
            </div>
            <Link to="/cardapio" className="link-more">
              Ver tudo <ChevronRight size={16} />
            </Link>
          </div>

          {promos.length > 0 ? (
            <div className="promo-grid">
              {promos.slice(0, 4).map((promo) => (
                <div className="promo-card" key={promo.id}>
                  <SmartImage src={promo.image} alt={promo.name} />
                  <div className="promo-card-overlay">
                    <span className="badge badge-promo">
                      R$ {formatMoney(promo.promo_price)}
                    </span>
                    <h3>{promo.name}</h3>
                    <p>{promo.description}</p>
                    <Link to="/cardapio" className="btn btn-primary btn-sm">
                      Pedir agora <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">Em breve novas promoções.</p>
          )}
        </div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-eyebrow">Os favoritos</span>
              <h2 className="section-title">Mais pedidos</h2>
            </div>
            <Link to="/cardapio" className="link-more">
              Ver cardápio completo <ChevronRight size={16} />
            </Link>
          </div>
          <div className="products-grid">
            {featured.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} onQuickAdd={quickAdd} />
            ))}
          </div>
        </div>
      </section>

      <section className="section categories-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-eyebrow">Explore</span>
              <h2 className="section-title">Categorias</h2>
            </div>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <Link to={`/cardapio?categoria=${cat.slug}`} className="category-card" key={cat.id}>
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
                <ChevronRight size={18} className="category-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-inner">
          <h2>Com fome? Seu pedido está a poucos cliques.</h2>
          <p>Escolha seus favoritos, personalize com adicionais e finalize pelo WhatsApp.</p>
          <div className="cta-actions">
            <Link to="/cardapio" className="btn btn-primary btn-lg">
              Fazer pedido <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
