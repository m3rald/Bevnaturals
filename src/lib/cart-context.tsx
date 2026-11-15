import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { findProductAndVariant } from './catalog';
import type { CartItem } from './types';

const BAG_STORAGE_KEY = 'bev_naturals_bag_v1';
const THEME_STORAGE_KEY = 'bev_naturals_theme_v1';

interface StoreContextValue {
  items: CartItem[];
  totalCount: number;
  subtotalNgn: number;
  isBagOpen: boolean;
  openBag: () => void;
  closeBag: () => void;
  addItem: (productId: string, variantId: string, quantity?: number) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  clearBag: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function loadInitialBag(): CartItem[] {
  try {
    const raw = localStorage.getItem(BAG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        Boolean(item) &&
        typeof item.productId === 'string' &&
        typeof item.variantId === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0 &&
        Boolean(findProductAndVariant(item.productId, item.variantId))
    );
  } catch {
    return [];
  }
}

function loadInitialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // ignore storage errors
  }
  return 'light';
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadInitialBag);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(loadInitialTheme);

  useEffect(() => {
    try {
      localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const openBag = useCallback(() => setIsBagOpen(true), []);
  const closeBag = useCallback(() => setIsBagOpen(false), []);

  const addItem = useCallback((productId: string, variantId: string, quantity = 1) => {
    if (!findProductAndVariant(productId, variantId)) return;
    setItems((prev) => {
      const idx = prev.findIndex(
        (item) => item.productId === productId && item.variantId === variantId
      );
      if (idx === -1) {
        return [...prev, { productId, variantId, quantity: Math.max(1, quantity) }];
      }
      return prev.map((item, i) =>
        i === idx ? { ...item, quantity: Math.min(50, item.quantity + quantity) } : item
      );
    });
    setIsBagOpen(true);
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) =>
        prev.filter((item) => !(item.productId === productId && item.variantId === variantId))
      );
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: Math.min(50, quantity) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((productId: string, variantId: string) => {
    setItems((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variantId === variantId))
    );
  }, []);

  const clearBag = useCallback(() => {
    setItems([]);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const { totalCount, subtotalNgn } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const item of items) {
      const match = findProductAndVariant(item.productId, item.variantId);
      if (match) {
        count += item.quantity;
        total += match.variant.priceNgn * item.quantity;
      }
    }
    return { totalCount: count, subtotalNgn: total };
  }, [items]);

  return (
    <StoreContext.Provider
      value={{
        items,
        totalCount,
        subtotalNgn,
        isBagOpen,
        openBag,
        closeBag,
        addItem,
        updateQuantity,
        removeItem,
        clearBag,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
