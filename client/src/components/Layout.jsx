import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import WhatsAppFloat from './WhatsAppFloat.jsx';
import CartBar from './CartBar.jsx';
import { useStore } from '../context/StoreContext.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function Layout() {
  const { open } = useStore();
  const [bannerClosed, setBannerClosed] = useState(false);
  const { pathname } = useLocation();
  const isCheckout = pathname === '/checkout' || pathname.startsWith('/pedido/');

  return (
    <div className="site">
      <ScrollToTop />
      {!open && !bannerClosed && (
        <div className="closed-banner">
          <span>
            Estamos fechados no momento. Confira nossos horários na página do cardápio.
          </span>
          <button onClick={() => setBannerClosed(true)} aria-label="Fechar aviso">
            ×
          </button>
        </div>
      )}
      <Navbar />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      {!isCheckout && <CartBar />}
    </div>
  );
}
