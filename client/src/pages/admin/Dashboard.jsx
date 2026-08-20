import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  DollarSign,
  TrendingUp,
  Clock,
  ReceiptText,
  Plus,
  Tag,
} from 'lucide-react';
import { api } from '../../api.js';
import { formatMoney, ORDER_STATUS } from '../../utils/format.js';

const EMPTY_STATS = {
  ordersToday: 0,
  revenueToday: 0,
  pending: 0,
  totalOrders: 0,
  topProducts: [],
  recentOrders: [],
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((data) => {
      setStats({ ...EMPTY_STATS, ...(data || {}) });
    }).catch(() => setStats(EMPTY_STATS));
  }, []);

  if (!stats) {
    return (
      <div className="spinner-wrap"><div className="spinner" /></div>
    );
  }

  const cards = [
    { label: 'Pedidos de hoje', value: stats.ordersToday, icon: ClipboardList, color: '#38bdf8' },
    { label: 'Faturamento do dia', value: `R$ ${formatMoney(stats.revenueToday)}`, icon: DollarSign, color: '#34d399' },
    { label: 'Pedidos pendentes', value: stats.pending, icon: Clock, color: '#fbbf24' },
    { label: 'Total de pedidos', value: stats.totalOrders, icon: ReceiptText, color: '#a78bfa' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-head">
        <div>
          <h1>Dashboard</h1>
          <p>Resumo de hoje · {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="dashboard-shortcuts">
          <Link to="/admin/produtos/novo" className="btn btn-primary btn-sm">
            <Plus size={16} /> Novo produto
          </Link>
          <Link to="/admin/promocoes" className="btn btn-outline btn-sm">
            <Tag size={16} /> Promoções
          </Link>
        </div>
      </div>

      <div className="stat-cards">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <span className="stat-icon" style={{ background: `${c.color}22`, color: c.color }}>
              <c.icon size={22} />
            </span>
            <div>
              <p>{c.label}</p>
              <strong>{c.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <h3>Mais vendidos hoje</h3>
          {stats.topProducts.length === 0 ? (
            <p className="muted-text">Nenhuma venda hoje ainda.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Receita</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <span className="trend-dot"><TrendingUp size={14} /></span>
                      {p.name}
                    </td>
                    <td>{p.qty}</td>
                    <td>R$ {formatMoney(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <h3>Pedidos recentes</h3>
          {stats.recentOrders.length === 0 ? (
            <p className="muted-text">Nenhum pedido ainda.</p>
          ) : (
            <div className="recent-orders">
              {stats.recentOrders.map((o) => (
                <Link to="/admin/pedidos" key={o.id} className="recent-order">
                  <div>
                    <strong>#{o.id} · {o.customer_name}</strong>
                    <small>
                      {o.order_type === 'delivery' ? 'Entrega' : 'Retirada'} ·{' '}
                      {new Date(o.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </div>
                  <div className="recent-order-right">
                    <span
                      className="status-chip"
                      style={{ background: `${ORDER_STATUS[o.status]?.color}22`, color: ORDER_STATUS[o.status]?.color }}
                    >
                      {ORDER_STATUS[o.status]?.label || o.status}
                    </span>
                    <b>R$ {formatMoney(o.total)}</b>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
