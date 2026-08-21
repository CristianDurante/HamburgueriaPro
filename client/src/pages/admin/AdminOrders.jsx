import { useEffect, useState } from 'react';
import { ChevronDown, MessageCircle, MapPin, RefreshCw } from 'lucide-react';
import { api } from '../../api.js';
import { formatMoney, formatDate, ORDER_STATUS } from '../../utils/format.js';

const STATUS_KEYS = ['all', ...Object.keys(ORDER_STATUS)];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get(`/admin/orders${status !== 'all' ? `?status=${status}` : ''}`);
      setOrders(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  async function changeStatus(orderId, nextStatus) {
    await api.put(`/admin/orders/${orderId}/status`, { status: nextStatus });
    await load();
  }

  async function resend(orderId) {
    if (!confirm('Reenviar os dados do pedido pelo WhatsApp?')) return;
    try {
      const r = await api.post(`/admin/orders/${orderId}/notify`, {});
      alert(r.sent ? 'Mensagem enviada!' : `Falha no envio: ${r.error || 'verifique a configuração'}`);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Pedidos</h1>
          <p>{orders.length} pedidos</p>
        </div>
        <button className="btn btn-outline" onClick={load}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      <div className="filter-row status-filters">
        {STATUS_KEYS.map((s) => (
          <button
            key={s}
            className={`status-filter ${status === s ? 'active' : ''}`}
            onClick={() => { setStatus(s); setExpanded(null); }}
          >
            {s === 'all' ? 'Todos' : ORDER_STATUS[s].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : orders.length === 0 ? (
        <p className="muted-text">Nenhum pedido encontrado.</p>
      ) : (
        <div className="orders-list">
          {orders.map((o) => {
            const isOpen = expanded === o.id;
            const addons = (it) => JSON.parse(it.addons_json || '[]');
            return (
              <div className={`order-card ${isOpen ? 'open' : ''}`} key={o.id}>
                <button className="order-card-head" onClick={() => setExpanded(isOpen ? null : o.id)}>
                  <div className="order-id">
                    <strong>#{o.id}</strong>
                    <span className={`status-chip`} style={{ background: `${ORDER_STATUS[o.status]?.color}22`, color: ORDER_STATUS[o.status]?.color }}>
                      {ORDER_STATUS[o.status]?.label || o.status}
                    </span>
                  </div>
                  <div className="order-meta">
                    <strong>{o.customer_name}</strong>
                    <small>
                      {o.order_type === 'delivery' ? 'Entrega' : 'Retirada'} · {formatDate(o.created_at)}
                    </small>
                  </div>
                  <div className="order-total">
                    <strong>R$ {formatMoney(o.total)}</strong>
                    <ChevronDown size={18} className={`chev ${isOpen ? 'rot' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="order-card-body">
                    <div className="order-details-grid">
                      <div className="order-items">
                        {(Array.isArray(o.items) ? o.items : []).map((it) => {
                          const adds = addons(it);
                          return (
                            <div className="summary-item" key={it.id}>
                              <span className="summary-qty">{it.quantity}x</span>
                              <div>
                                <strong>{it.product_name}</strong>
                                {adds.length > 0 && <small>{adds.map((a) => a.name).join(', ')}</small>}
                                {it.notes && <small className="muted">Obs: {it.notes}</small>}
                              </div>
                              <b>
                                R$ {formatMoney(
                                  (Number(it.unit_price) + adds.reduce((s, a) => s + Number(a.price || 0), 0)) * it.quantity
                                )}
                              </b>
                            </div>
                          );
                        })}
                        <div className="summary-row"><span>Subtotal</span><strong>R$ {formatMoney(o.subtotal)}</strong></div>
                        <div className="summary-row"><span>Taxa de entrega</span><strong>R$ {formatMoney(o.delivery_fee)}</strong></div>
                        <div className="summary-row total"><span>Total</span><strong>R$ {formatMoney(o.total)}</strong></div>
                      </div>

                      <div className="order-customer-info">
                        <p><strong>Cliente:</strong> {o.customer_name}</p>
                        <p><strong>Telefone:</strong> {o.customer_phone}</p>
                        <p><strong>Pagamento:</strong> {{
                          pix: 'Pix', cash: 'Dinheiro', credit: 'Cartão de crédito', debit: 'Cartão de débito',
                        }[o.payment_method] || o.payment_method}
                          {o.payment_method === 'cash' && o.change_for ? ` · Troco para R$ ${formatMoney(o.change_for)}` : ''}
                        </p>
                        {o.order_type === 'delivery' && (
                          <p className="order-address">
                            <MapPin size={15} />
                            {[
                              o.address_street,
                              o.address_number && `nº ${o.address_number}`,
                              o.address_complement,
                              o.address_neighborhood && ` - ${o.address_neighborhood}`,
                              o.address_reference && ` (${o.address_reference})`,
                            ].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {o.notes && <p className="muted"><strong>Observações:</strong> {o.notes}</p>}
                      </div>
                    </div>

                    <div className="order-actions">
                      <select
                        className="select-status"
                        value={o.status}
                        onChange={(e) => changeStatus(o.id, e.target.value)}
                      >
                        {Object.entries(ORDER_STATUS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <button className="btn btn-outline btn-sm" onClick={() => resend(o.id)}>
                        <MessageCircle size={16} /> Reenviar WhatsApp
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
