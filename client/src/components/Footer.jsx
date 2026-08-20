import { Link } from 'react-router-dom';
import { Clock, MapPin, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext.jsx';
import Logo from './Logo.jsx';

export default function Footer() {
  const { config, hours } = useStore();

  const today = new Date().getDay();
  const todayHours = hours.find((h) => h.dayOfWeek === today);

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo logo={config.logo} name={config.name || 'Kintal Lanches'} />
          <p className="footer-text">
            Hambúrgueres preparados na hora, com sabor e preço que cabem no bolso.
          </p>
        </div>

        <div className="footer-col">
          <h4>Contato</h4>
          <p className="footer-line">
            <Phone size={16} /> {config.phone || '—'}
          </p>
          <p className="footer-line">
            <MapPin size={16} /> {config.address || '—'}
          </p>
        </div>

        <div className="footer-col">
          <h4>Horário</h4>
          {todayHours ? (
            <>
              <p className="footer-line">
                <Clock size={16} />
                {todayHours.closed
                  ? 'Fechado hoje'
                  : `${todayHours.openTime} - ${todayHours.closeTime}`}
              </p>
              <p className="footer-text">Entrega média: {config.avgDeliveryTime || '—'}</p>
            </>
          ) : (
            <p className="footer-text">Confira os horários no cardápio</p>
          )}
        </div>

        <div className="footer-col">
          <h4>Navegação</h4>
          <Link to="/" className="footer-link">Início</Link>
          <Link to="/cardapio" className="footer-link">Cardápio</Link>
          <Link to="/carrinho" className="footer-link">Meu pedido</Link>
          <Link to="/admin" className="footer-link">Área do administrador</Link>
        </div>
      </div>
      <div className="footer-bottom container">
        <span>
          © {new Date().getFullYear()} {config.name || 'Kintal Lanches'}. Todos os direitos
          reservados.
        </span>
      </div>
    </footer>
  );
}
