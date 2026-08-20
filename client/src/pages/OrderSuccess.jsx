import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, MessageCircle, AlertTriangle, Home } from 'lucide-react';
import { api } from '../api.js';
import { formatMoney, ORDER_STATUS } from '../utils/format.js';

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const whatsapp = location.state?.whatsapp || null;
  const message = location.state?.message || '';

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((data) => {
        setOrder(data.order);
        setItems(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container spinner-wrap"><div className="spinner" /></div>
    );
  }

  if (!order) {
    return (
      <div className="container empty-state">
        <h2>Pedido não encontrado</h2>
        <Link to="/cardapio" className="btn btn-primary">Ver cardápio</Link>
      </div>
    );
  }

  const isDelivery = order.order_type === 'delivery';
  const statusLabel = ORDER_STATUS[order.status]?.label || order.status;

  return (
    <div className="container success-page">
      <div className="success-card">
        <div className="success-icon"><CheckCircle2 size={56} /></div>
        <h1>Pedido confirmado!</h1>
        <p>
          Pedido <strong>#{order.id}</strong> · Status: <strong>{statusLabel}</strong>
        </p>

        {whatsapp?.link ? (
          <a
            className="btn btn-whatsapp btn-lg"
            href={whatsapp.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={22} fill="currentColor" />
            Abrir no WhatsApp
          </a>
        ) : null}

        {whatsapp && !whatsapp.sent && (
          <div className="alert-warning">
            <AlertTriangle size={18} />
            <span>
              Não foi possível enviar a mensagem automaticamente
              {whatsapp.error ? ` (${whatsapp.error})` : ''}. Toque no botão acima
              para enviar pelo próprio WhatsApp.
            </span>
          </div>
        )}

        <div className="success-details">
          <div>
            <strong>Cliente:</strong> {order.customer_name}
          </div>
          <div>
            <strong>Telefone:</strong> {order.customer_phone}
          </div>
          <div>
            <strong>Tipo:</strong> {isDelivery ? 'Entrega' : 'Retirada'}
          </div>
          {isDelivery && (
            <div>
              <strong>Endereço:</strong>{' '}
              {[
                order.address_street,
                order.address_number && `nº ${order.address_number}`,
                order.address_complement,
                order.address_neighborhood,
                order.address_reference && `ref: ${order.address_reference}`,
              ]
                .filter(Boolean)
                .join(', ')}
            </div>
          )}
          <div>
            <strong>Pagamento:</strong>{' '}
            {{
              pix: 'Pix',
              cash: 'Dinheiro',
              credit: 'Cartão de crédito',
              debit: 'Cartão de débito',
            }[order.payment_method] || order.payment_method}
            {order.payment_method === 'cash' && order.change_for
              ? ` · Troco para R$ ${formatMoney(order.change_for)}`
              : ''}
          </div>
        </div>

        <div className="success-items">
          {items.map((it) => {
            const addons = JSON.parse(it.addons_json || '[]');
            return (
              <div className="summary-item" key={it.id}>
                <span className="summary-qty">{it.quantity}x</span>
                <div>
                  <strong>{it.product_name}</strong>
                  {addons.length > 0 && <small>{addons.map((a) => a.name).join(', ')}</small>}
                </div>
                <b>
                  R${' '}
                  {formatMoney(
                    (Number(it.unit_price) +
                      addons.reduce((s, a) => s + Number(a.price || 0), 0)) *
                      it.quantity
                  )}
                </b>
              </div>
            );
          })}
          <div className="summary-row total">
            <span>Total</span>
            <strong>R$ {formatMoney(order.total)}</strong>
          </div>
        </div>

        <div className="success-actions">
          <Link to="/cardapio" className="btn btn-primary">
            <Home size={18} /> Voltar ao início
          </Link>
          <Link to="/" className="btn btn-ghost">Fazer novo pedido</Link>
        </div>
      </div>
    </div>
  );
}
