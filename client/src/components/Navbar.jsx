import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import Logo from './Logo.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { config, open: isOpen } = useStore();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'Início' },
    { to: '/cardapio', label: 'Cardápio' },
    { to: '/cardapio', label: 'Promoções', anchor: 'promocoes' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          <Logo logo={config.logo} name={config.name || 'Kintal Lanches'} />
        </Link>

        <nav className={`navbar-links ${open ? 'open' : ''}`}>
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            Início
          </NavLink>
          <NavLink
            to="/cardapio"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            Cardápio
          </NavLink>
          <a
            href="/#promocoes"
            className="nav-link"
            onClick={() => setOpen(false)}
          >
            Promoções
          </a>
          {!isOpen && <span className="nav-status closed">Fechado</span>}
        </nav>

        <div className="navbar-actions">
          <button
            className="cart-button"
            onClick={() => navigate('/carrinho')}
            aria-label="Abrir carrinho"
          >
            <ShoppingBag size={20} />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>
          <button
            className="menu-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
