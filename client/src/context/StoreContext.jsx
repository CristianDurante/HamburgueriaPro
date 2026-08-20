import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [store, setStore] = useState({
    config: {},
    hours: [],
    open: true,
    openStatus: 'open',
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/store');
      setStore({ ...data, loading: false });
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
