import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'burguer_cart_v1';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage indisponível
    }
  }, [items]);

  function itemKey(product, addons, notes) {
    const addonPart = [...addons]
      .sort((a, b) => a.id - b.id)
      .map((a) => `${a.id}:${Number(a.price).toFixed(2)}`)
      .join('|');
    return `${product.id}__${addonPart}__${notes || ''}`;
  }

  function addItem({ product, addons = [], notes = '', quantity = 1 }) {
    setItems((prev) => {
      const key = itemKey(product, addons, notes);
      const existing = prev.find((it) => it.key === key);
      if (existing) {
        return prev.map((it) =>
          it.key === key ? { ...it, quantity: it.quantity + quantity } : it
        );
      }
      const basePrice =
        product.promo_price != null ? Number(product.promo_price) : Number(product.price);
      const item = {
        key,
        productId: product.id,
        name: product.name,
        image: product.image,
        basePrice,
        addons,
        notes,
        quantity,
      };
      return [...prev, item];
    });
  }

  function updateQty(key, quantity) {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((it) => it.key !== key)
        : prev.map((it) => (it.key === key ? { ...it, quantity } : it))
    );
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, it) =>
          sum +
          (Number(it.basePrice) +
            (it.addons || []).reduce((s, a) => s + Number(a.price || 0), 0)) *
            Number(it.quantity),
        0
      ),
    [items]
  );

  const count = useMemo(() => items.reduce((s, it) => s + Number(it.quantity), 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        count,
        addItem,
        updateQty,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
