import type { Order } from './types';

const MANUAL_HISTORY_STORAGE_KEY = 'bn_manual_orders_archive_v1';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isConfirmedManualOrder(order: unknown): order is Order {
  if (!order || typeof order !== 'object') return false;
  const candidate = order as Partial<Order>;
  return (
    typeof candidate.orderNumber === 'string' &&
    candidate.orderNumber.trim().length > 0 &&
    candidate.paymentMethod === 'opay' &&
    Boolean(candidate.customer?.fullName) &&
    Array.isArray(candidate.items)
  );
}

export function getCachedManualOrders(): Order[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(MANUAL_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isConfirmedManualOrder)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

export function saveManualOrderToCache(order: Order): Order[] {
  if (!canUseStorage() || !isConfirmedManualOrder(order)) return [];
  const normalizedOrder: Order = {
    ...order,
    codeCopiedAt: order.codeCopiedAt || new Date().toISOString(),
  };
  const existing = getCachedManualOrders();
  const byNumber = new Map<string, Order>();

  for (const item of existing) {
    byNumber.set(item.orderNumber.toUpperCase(), item);
  }
  byNumber.set(normalizedOrder.orderNumber.toUpperCase(), normalizedOrder);

  const merged = Array.from(byNumber.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );

  try {
    window.localStorage.setItem(MANUAL_HISTORY_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage quota errors
  }

  return merged;
}

export function mergeCachedManualOrders(serverOrders: Order[]): {
  cachedManual: Order[];
  missingOnServer: Order[];
} {
  const existingLocal = getCachedManualOrders();
  const serverManual = serverOrders.filter((ord) => ord.paymentMethod === 'opay');

  const serverKeys = new Set(
    serverManual.map((ord) => ord.orderNumber.toUpperCase())
  );
  const missingOnServer = existingLocal.filter(
    (ord) => !serverKeys.has(ord.orderNumber.toUpperCase())
  );

  const byNumber = new Map<string, Order>();
  for (const ord of existingLocal) {
    byNumber.set(ord.orderNumber.toUpperCase(), ord);
  }
  for (const ord of serverManual) {
    byNumber.set(ord.orderNumber.toUpperCase(), ord);
  }

  const mergedManual = Array.from(byNumber.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );

  if (canUseStorage()) {
    try {
      window.localStorage.setItem(MANUAL_HISTORY_STORAGE_KEY, JSON.stringify(mergedManual));
    } catch {
      // ignore storage quota errors
    }
  }

  return { cachedManual: mergedManual, missingOnServer };
}
