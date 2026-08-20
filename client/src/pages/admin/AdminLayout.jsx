import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Beef,
  FolderOpen,
  Plus,
  Tag,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../../components/Logo.jsx';
import { useStore } from '../../context/StoreContext.jsx';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/produtos', label: 'Produtos', icon: Beef },
  { to: '/admin/categorias', label: 'Categorias', icon: FolderOpen },
  { to: '/admin/adicionais', label: 'Adicionais', icon: Plus },
  { to: '/admin/promocoes', label: 'Promoções', icon: Tag },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const { config } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-sidebar-head">
          <Logo logo={config.logo} name={config.name || 'Kintal Lanches'} />
          <button className="icon-btn close-sidebar" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <l.icon size={19} />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <NavLink
            to="/admin/perfil"
            className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            <UserRound size={19} /> {admin?.name || 'Administrador'}
          </NavLink>
          <a href="/" className="admin-nav-link" target="_blank" rel="noopener noreferrer">
            <Home size={19} /> Ver site
          </a>
          <button className="admin-nav-link logout" onClick={() => { logout(); navigate('/admin/login'); }}>
            <LogOut size={19} /> Sair
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="menu-toggle" onClick={() => setOpen(true)}>
            <Menu size={24} />
          </button>
          <h2 className="admin-topbar-title">Painel administrativo</h2>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
