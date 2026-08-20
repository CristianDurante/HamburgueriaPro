import { getStoreConfig } from '../settings.js';

export function formatMoney(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function line(name, value) {
  if (value === null || value === undefined || value === '') return null;
  return `${name}: ${value}`;
}

function buildItems(items) {
  return items
    .map((it) => {
      const addons = JSON.parse(it.addons_json || '[]');
      const addonText =
        addons.length > 0
          ? `\n   Adicionais: ${addons.map((a) => a.name).join(', ')}`
          : '';
      const note = it.notes ? `\n   Obs. item: ${it.notes}` : '';
      return `• ${it.quantity}x ${it.product_name}${addonText}${note}\n   Valor: R$ ${formatMoney(it.quantity * it.unit_price + (addons.reduce((s, a) => s + Number(a.price || 0), 0) * it.quantity))}`;
    })
    .join('\n');
}

export function buildOrderMessage(order, items) {
  const isDelivery = order.order_type === 'delivery';
  const typeLabel = isDelivery ? 'Entrega' : 'Retirada';

  const paymentLabels = {
    pix: 'Pix',
    cash: 'Dinheiro',
    credit: 'Cartão de crédito',
    debit: 'Cartão de débito',
  };

  const lines = [
    '🍔 NOVO PEDIDO',
    '',
    `Cliente: ${order.customer_name}`,
    `Telefone: ${order.customer_phone}`,
    '',
    `Tipo: ${typeLabel}`,
    '',
    'ITENS:',
    buildItems(items),
    '',
    `Subtotal: R$ ${formatMoney(order.subtotal)}`,
  ];

  if (order.delivery_fee > 0) {
    lines.push(`Taxa de entrega: R$ ${formatMoney(order.delivery_fee)}`);
  }

  lines.push(`TOTAL: R$ ${formatMoney(order.total)}`);
  lines.push('');
  lines.push(`Pagamento: ${paymentLabels[order.payment_method] || order.payment_method}`);

  if (order.payment_method === 'cash' && order.change_for) {
    lines.push(`Troco para: R$ ${formatMoney(order.change_for)}`);
  }

  if (isDelivery) {
    lines.push('');
    lines.push('ENDEREÇO:');
    const addr = [
      order.address_street,
      order.address_number ? `nº ${order.address_number}` : null,
      order.address_complement,
      order.address_neighborhood ? `Bairro: ${order.address_neighborhood}` : null,
      order.address_reference ? `Ref: ${order.address_reference}` : null,
    ]
      .filter(Boolean)
      .join(', ');
    lines.push(addr);
  }

  if (order.notes) {
    lines.push('');
    lines.push(`Observações: ${order.notes}`);
  }

  lines.push('');
  lines.push('_Pedido enviado pelo site_');

  return lines.filter((l) => l !== null).join('\n');
}
