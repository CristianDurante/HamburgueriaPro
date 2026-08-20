import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Menu from './pages/Menu.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import CartPage from './pages/CartPage.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import ProductForm from './pages/admin/ProductForm.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminAddons from './pages/admin/AdminAddons.jsx';
import AdminPromotions from './pages/admin/AdminPromotions.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminProfile from './pages/admin/AdminProfile.jsx';

function RequireAuth({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="cardapio" element={<Menu />} />
        <Route path="produto/:id" element={<ProductDetail />} />
        <Route path="carrinho" element={<CartPage />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="pedido/:id" element={<OrderSuccess />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="produtos" element={<AdminProducts />} />
        <Route path="produtos/novo" element={<ProductForm />} />
        <Route path="produtos/:id" element={<ProductForm />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="adicionais" element={<AdminAddons />} />
        <Route path="promocoes" element={<AdminPromotions />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="configuracoes" element={<AdminSettings />} />
        <Route path="perfil" element={<AdminProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
