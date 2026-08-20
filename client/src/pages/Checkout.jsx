import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Banknote, CreditCard, QrCode, Smartphone } from 'lucide-react';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { formatMoney, formatPhone, onlyDigits, PAYMENT_LABELS } from '../utils/format.js';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { config, open: isOpen } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    orderType: 'delivery',
    addressStreet: '',
    addressNumber: '',
    addressComplement: '',
    addressNeighborhood: '',
    addressReference: '',
    paymentMethod: 'pix',
    changeFor: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fee = form.orderType === 'delivery' ? Number(config.deliveryFee) || 0 : 0;
  const total = subtotal + fee;
  const minOrder = Number(config.minOrder) || 0;
  const belowMin = total < minOrder;

  const methods = useMemo(
    () => [
      { id: 'pix', label: 'Pix', icon: QrCode },
      { id: 'cash', label: 'Dinheiro', icon: Banknote },
      { id: 'credit', label: 'Crédito', icon: CreditCard },
      { id: 'debit', label: 'Débito', icon: Smartphone },
    ],
    []
  );

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!isOpen && config.blockWhenClosed !== false) {
      setError('A hamburgueria está fechada no momento e não estamos recebendo pedidos.');
      return;
    }
    if (belowMin) {
      setError(`O pedido mínimo é de R$ ${formatMoney(minOrder)}`);
      return;
    }
    if (!form.customerName.trim()) {
      setError('Informe seu nome');
      return;
    }
    if (onlyDigits(form.customerPhone).length < 10) {
      setError('Informe um telefone válido');
      return;
    }
    if (form.orderType === 'delivery') {
      if (!form.addressStreet.trim()) { setError('Informe a rua do endereço'); return; }
      if (!form.addressNumber.trim()) { setError('Informe o número'); return; }
      if (!form.addressNeighborhood.trim()) { setError('Informe o bairro'); return; }
    }
    if (form.paymentMethod === 'cash' && form.changeFor) {
      const change = Number(form.changeFor);
      if (change <= total) {
        setError('O valor para troco deve ser maior que o total do pedido');
        return;
      }
    }

    const payload = {
      customerName: form.customerName.trim(),
      customerPhone: onlyDigits(form.customerPhone),
      orderType: form.orderType,
      addressStreet: form.addressStreet.trim(),
      addressNumber: form.addressNumber.trim(),
      addressComplement: form.addressComplement.trim(),
      addressNeighborhood: form.addressNeighborhood.trim(),
      addressReference: form.addressReference.trim(),
      paymentMethod: form.paymentMethod,
      changeFor: form.paymentMethod === 'cash' && form.changeFor ? Number(form.changeFor) : null,
      notes: form.notes.trim(),
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        addons: it.addons || [],
        notes: it.notes || '',
      })),
    };

    setSubmitting(true);
    try {
      const data = await api.post('/orders', payload);
      clearCart();
      navigate(`/pedido/${data.order.id}`, {
        state: { whatsapp: data.whatsapp, message: data.message },
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container empty-state">
        <h2>Seu carrinho está vazio</h2>
        <button className="btn btn-primary" onClick={() => navigate('/cardapio')}>
          Ver cardápio
        </button>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <h1 className="page-title">Finalizar pedido</h1>

      <form onSubmit={handleSubmit} className="checkout-layout">
        <div className="checkout-form">
          <section className="checkout-section">
            <h3>Seus dados</h3>
            <div className="form-grid two">
              <div className="form-field">
                <label htmlFor="name">Nome*</label>
                <input
                  id="name"
                  value={form.customerName}
                  onChange={(e) => set('customerName', e.target.value)}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                />
              </div>
              <div className="form-field">
                <label htmlFor="phone">Telefone / WhatsApp*</label>
                <input
                  id="phone"
                  value={form.customerPhone}
                  onChange={(e) => set('customerPhone', formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                />
              </div>
            </div>
          </section>

          <section className="checkout-section">
            <h3>Tipo de pedido</h3>
            <div className="segmented">
              {config.acceptDelivery !== false && (
                <button
                  type="button"
                  className={`segment ${form.orderType === 'delivery' ? 'active' : ''}`}
                  onClick={() => set('orderType', 'delivery')}
                >
                  Entrega
                </button>
              )}
              {config.acceptPickup !== false && (
                <button
                  type="button"
                  className={`segment ${form.orderType === 'pickup' ? 'active' : ''}`}
                  onClick={() => set('orderType', 'pickup')}
                >
                  Retirada
                </button>
              )}
            </div>

            {form.orderType === 'delivery' && (
              <div className="form-grid two">
                <div className="form-field">
                  <label htmlFor="street">Rua / Avenida*</label>
                  <input
                    id="street"
                    value={form.addressStreet}
                    onChange={(e) => set('addressStreet', e.target.value)}
                    placeholder="Rua das Palmeiras"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="number">Número*</label>
                  <input
                    id="number"
                    value={form.addressNumber}
                    onChange={(e) => set('addressNumber', e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="complement">Complemento</label>
                  <input
                    id="complement"
                    value={form.addressComplement}
                    onChange={(e) => set('addressComplement', e.target.value)}
                    placeholder="Apto, bloco, casa..."
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="neighborhood">Bairro*</label>
                  <input
                    id="neighborhood"
                    value={form.addressNeighborhood}
                    onChange={(e) => set('addressNeighborhood', e.target.value)}
                    placeholder="Centro"
                    list="neighborhoods"
                  />
                  <datalist id="neighborhoods">
                    {(config.neighborhoods || []).map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>
                <div className="form-field">
                  <label htmlFor="reference">Ponto de referência</label>
                  <input
                    id="reference"
                    value={form.addressReference}
                    onChange={(e) => set('addressReference', e.target.value)}
                    placeholder="Próximo à praça"
                  />
                </div>
              </div>
            )}
          </section>

          <section className="checkout-section">
            <h3>Pagamento</h3>
            <div className="payment-grid">
              {methods.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className={`payment-option ${form.paymentMethod === m.id ? 'active' : ''}`}
                  onClick={() => set('paymentMethod', m.id)}
                >
                  <m.icon size={20} />
                  {m.label}
                </button>
              ))}
            </div>
            {form.paymentMethod === 'cash' && (
              <div className="form-field">
                <label htmlFor="change">Troco para</label>
                <input
                  id="change"
                  value={form.changeFor}
                  onChange={(e) => set('changeFor', e.target.value)}
                  placeholder="R$ 0,00"
                  inputMode="decimal"
                />
              </div>
            )}
            {form.paymentMethod === 'pix' && config.pixKey && (
              <p className="pix-note">Chave Pix: <strong>{config.pixKey}</strong></p>
            )}
          </section>

          <section className="checkout-section">
            <h3>Observações</h3>
            <div className="form-field">
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={4}
                placeholder="Ex.: ponto da carne, sem cebola, entregar no portão..."
              />
            </div>
          </section>

          {error && <div className="alert-error">{error}</div>}

          <div className="checkout-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/carrinho')}>
              <ArrowLeft size={16} /> Voltar ao carrinho
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={20} className="spin" /> Enviando pedido...
                </>
              ) : (
                <>
                  Confirmar pedido <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>

        <aside className="cart-summary checkout-summary">
          <h3>Seu pedido</h3>
          <div className="summary-items">
            {items.map((it) => {
              const addonsTotal = (it.addons || []).reduce((s, a) => s + Number(a.price || 0), 0);
              return (
                <div className="summary-item" key={it.key}>
                  <span className="summary-qty">{it.quantity}x</span>
                  <div>
                    <strong>{it.name}</strong>
                    {it.addons?.length > 0 && (
                      <small>{it.addons.map((a) => a.name).join(', ')}</small>
                    )}
                  </div>
                  <b>
                    R$ {formatMoney((Number(it.basePrice) + addonsTotal) * it.quantity)}
                  </b>
                </div>
              );
            })}
          </div>
          <div className="summary-row"><span>Subtotal</span><strong>R$ {formatMoney(subtotal)}</strong></div>
          <div className="summary-row">
            <span>{form.orderType === 'delivery' ? 'Taxa de entrega' : 'Retirada'}</span>
            <strong>{form.orderType === 'delivery' ? `R$ ${formatMoney(fee)}` : 'Grátis'}</strong>
          </div>
          <div className="summary-row total"><span>Total</span><strong>R$ {formatMoney(total)}</strong></div>
          <div className="summary-row"><span>Pagamento</span><strong>{PAYMENT_LABELS[form.paymentMethod]}</strong></div>
          {belowMin && (
            <p className="warning-text">
              Faltam R$ {formatMoney(minOrder - total)} para o pedido mínimo.
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}
