import React, { useCallback, useEffect, useState } from 'react';
import { Lock, LogOut, RefreshCw } from 'lucide-react';
import { formatNgn } from '../lib/catalog';
import type { Order, OrderStatus } from '../lib/types';

const TOKEN_STORAGE_KEY = 'bev_studio_session_v1';

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'shipped', label: 'Shipped' },
];

function getStatusLabel(status: OrderStatus): string {
  return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
}

export function AdminPage() {
  const [token, setToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [feeInputs, setFeeInputs] = useState<Record<string, string>>({});

  const fetchOrders = useCallback(async (authToken: string) => {
    if (!authToken) return;
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken('');
        return;
      }
      const data = (await res.json()) as { orders?: Order[] };
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
        const nextFees: Record<string, string> = {};
        for (const ord of data.orders) {
          nextFees[ord.orderNumber] =
            ord.deliveryFeeNgn !== null ? String(ord.deliveryFeeNgn) : '';
        }
        setFeeInputs(nextFees);
      }
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchOrders(token);
    }
  }, [token, fetchOrders]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthenticating(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Invalid Studio PIN.');
      }
      sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      setPin('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authorization failed.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken('');
    setOrders([]);
  };

  const handleStatusChange = async (orderNumber: string, status: OrderStatus) => {
    setUpdatingOrder(orderNumber);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { order?: Order };
      if (res.ok && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === orderNumber ? data.order! : o))
        );
      }
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleSaveDeliveryFee = async (orderNumber: string) => {
    const raw = feeInputs[orderNumber]?.trim() ?? '';
    const parsed = raw === '' ? null : Number(raw);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) return;
    setUpdatingOrder(orderNumber);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deliveryFeeNgn: parsed }),
      });
      const data = (await res.json()) as { order?: Order };
      if (res.ok && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === orderNumber ? data.order! : o))
        );
      }
    } finally {
      setUpdatingOrder(null);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-20">
        <form
          onSubmit={handleLogin}
          className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-7 space-y-5"
        >
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#B85C38]" aria-hidden="true" />
            <h1 className="font-display text-2xl font-semibold">Studio Order Ledger</h1>
          </div>

          <p className="text-xs leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
            Enter the Ibadan Studio PIN to view orders, track Paystack confirmations, and update dispatch progress.
          </p>

          {authError && (
            <p role="alert" className="text-xs font-medium text-[#B85C38]">
              {authError}
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="studioPin" className="block text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
              Studio PIN
            </label>
            <input
              id="studioPin"
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter Studio PIN"
              className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
            />
          </div>

          <button
            type="submit"
            disabled={authenticating}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] text-sm font-semibold cursor-pointer"
          >
            {authenticating ? 'Verifying…' : 'Open Ledger'}
          </button>
        </form>
      </div>
    );
  }

  const visibleOrders = orders.filter((o) =>
    statusFilter === 'all' ? true : o.status === statusFilter
  );

  const counts = {
    all: orders.length,
    awaiting_payment: orders.filter((o) => o.status === 'awaiting_payment').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
        <div>
          <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
            Bev Naturals Cosmetics · Ibadan Fulfilment
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
            Studio Order Ledger
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchOrders(token)}
            disabled={loadingOrders}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-xs font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Lock Studio</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#EAE0D2] dark:bg-[#261F1A] w-fit">
        {(['all', 'awaiting_payment', 'paid', 'preparing', 'shipped'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`min-h-[36px] px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === st
                ? 'bg-[#FAF5EE] dark:bg-[#14100D] text-[#1C1410] dark:text-[#F3EBDF] shadow-sm'
                : 'text-[#5C4E45] dark:text-[#B8AA9B]'
            }`}
          >
            {st === 'all' ? 'All' : getStatusLabel(st)} ({counts[st]})
          </button>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] space-y-2">
          <p className="font-display text-2xl">No orders in this view yet.</p>
          <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
            New orders submitted via Paystack appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <article
              key={order.id}
              className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 space-y-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                    <span className="font-mono-num font-semibold text-sm text-[#1C1410] dark:text-[#F3EBDF]">
                      {order.orderNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                    <span aria-hidden="true">·</span>
                    <span>{order.paymentChannel}</span>
                  </div>
                  <p className="text-sm font-medium">
                    {order.customer.fullName} · {order.customer.phone} · {order.customer.email}
                  </p>
                  <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                    {order.shipping.address}, {order.shipping.city}, {order.shipping.state}
                    {order.shipping.methodLabel ? ` · ${order.shipping.methodLabel}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="font-mono-num text-lg font-semibold">
                      {formatNgn(order.totalNgn ?? order.subtotalNgn)}
                    </p>
                    <p className="text-[11px] text-[#5C4E45] dark:text-[#B8AA9B]">
                      Products {formatNgn(order.subtotalNgn)}
                      {(order.discountNgn ?? 0) > 0 ? ` · -${formatNgn(order.discountNgn ?? 0)} (10%)` : ''}
                      {order.deliveryFeeNgn !== null ? ` · Ship ${formatNgn(order.deliveryFeeNgn)}` : ''}
                    </p>
                    <p className="text-[11px] text-[#5C4E45] dark:text-[#B8AA9B]">
                      Ref: <span className="font-mono-num">{order.paymentReference}</span>
                    </p>
                  </div>

                  <select
                    aria-label={`Order status for ${order.orderNumber}`}
                    value={order.status}
                    disabled={updatingOrder === order.orderNumber}
                    onChange={(e) =>
                      handleStatusChange(order.orderNumber, e.target.value as OrderStatus)
                    }
                    className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 bg-[#F3EBDF] dark:bg-[#14100D] text-xs font-semibold"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <ul className="md:col-span-7 space-y-1.5 text-xs">
                  {order.items.map((item) => (
                    <li
                      key={`${item.productId}-${item.variantId}`}
                      className="flex justify-between gap-4"
                    >
                      <span>
                        {item.productName} ({item.sizeLabel}) × {item.quantity}
                      </span>
                      <span className="font-mono-num">{formatNgn(item.lineTotalNgn)}</span>
                    </li>
                  ))}
                  {order.shipping.note && (
                    <li className="pt-2 text-[#5C4E45] dark:text-[#B8AA9B]">
                      Customer note: {order.shipping.note}
                    </li>
                  )}
                </ul>

                <div className="md:col-span-5 flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor={`fee-${order.orderNumber}`}
                      className="block text-[11px] font-medium text-[#5C4E45] dark:text-[#B8AA9B]"
                    >
                      Quoted Delivery Fee (NGN)
                    </label>
                    <input
                      id={`fee-${order.orderNumber}`}
                      type="number"
                      min={0}
                      value={feeInputs[order.orderNumber] ?? ''}
                      onChange={(e) =>
                        setFeeInputs((prev) => ({
                          ...prev,
                          [order.orderNumber]: e.target.value,
                        }))
                      }
                      placeholder="e.g. 3500"
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] font-mono-num text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={updatingOrder === order.orderNumber}
                    onClick={() => handleSaveDeliveryFee(order.orderNumber)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Save Quote
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
