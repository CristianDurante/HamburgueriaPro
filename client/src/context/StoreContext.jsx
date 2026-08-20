import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const StoreContext = createContext(null);

const DEFAULT_STORE = {
  config: {},
  hours: [],
  open: true,
  openStatus: 'open',
};

export function StoreProvider({ children }) {
  const [store, setStore] = useState({
    ...DEFAULT_STORE,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/store');
      setStore((current) => ({
        ...DEFAULT_STORE,
        ...current,
        ...data,
        config: { ...DEFAULT_STORE.config, ...(data?.config || {}) },
        hours: Array.isArray(data?.hours) ? data.hours : DEFAULT_STORE.hours,
        loading: false,
      }));
    } catch {
      setStore((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <StoreContext.Provider value={{ ...store, refresh }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
