export function formatMoney(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function formatPhone(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const PAYMENT_LABELS = {
  pix: 'Pix',
  cash: 'Dinheiro',
  credit: 'Cartão de crédito',
  debit: 'Cartão de débito',
};

export const ORDER_STATUS = {
  new: { label: 'Novo', color: '#38bdf8' },
  preparing: { label: 'Em preparação', color: '#fbbf24' },
  out_for_delivery: { label: 'Saiu para entrega', color: '#a78bfa' },
  ready: { label: 'Pronto para retirada', color: '#34d399' },
  finished: { label: 'Finalizado', color: '#64748b' },
  cancelled: { label: 'Cancelado', color: '#ef4444' },
};
