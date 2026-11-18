import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Lock, RefreshCw, Search } from 'lucide-react';
import { formatNgn } from '../lib/catalog';
import {
  getCachedManualOrders,
  mergeCachedManualOrders,
  saveManualOrderToCache,
} from '../lib/manual-history-cache';
import { OrderReceiptCard } from '../components/OrderReceiptCard';
import type { Order } from '../lib/types';

const TOKEN_STORAGE_KEY = 'bn_order_lookup_token';

type HistorySectionTab = 'all' | 'manual' | 'online';

export function OrderLookupPage() {
  const [token, setToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [pinError, setPinError] = useState('');

  const [queryInput, setQueryInput] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [historySection, setHistorySection] = useState<HistorySectionTab>('all');
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyFilter, setHistoryFilter] = useState('');

  const handleLock = useCallback((message = '') => {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore storage restrictions
    }
    setToken('');
    setPinInput('');
    setSelectedOrder(null);
    setShowHistory(false);
    setHistorySection('all');
    setHistoryOrders([]);
    setLookupError('');
    setHistoryError('');
    setPinError(message);
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinInput.trim();
    if (!pin) {
      setPinError('Please enter the PIN code.');
      return;
    }

    setUnlocking(true);
    setPinError('');
    try {
      const res = await fetch('/api/order-lookup/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Incorrect PIN code.');
      }
      try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      } catch {
        // ignore storage restrictions
      }
      setToken(data.token);
      setPinInput('');
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Unable to unlock right now.');
    } finally {
      setUnlocking(false);
    }
  };

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setLoadingHistory(true);
    setHistoryError('');

    const cachedBefore = getCachedManualOrders();
    if (cachedBefore.length > 0 && historyOrders.length === 0) {
      setHistoryOrders(cachedBefore);
    }

    try {
      const res = await fetch('/api/orders-history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleLock('Your session expired. Enter the PIN code to continue.');
        return;
      }
      const data = (await res.json()) as { orders?: Order[]; error?: string };
      if (!res.ok || !Array.isArray(data.orders)) {
        throw new Error(data.error || 'Unable to load order history.');
      }

      const { cachedManual, missingOnServer } = mergeCachedManualOrders(data.orders);

      if (missingOnServer.length > 0) {
        try {
          await fetch('/api/orders-history/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orders: missingOnServer }),
          });
        } catch {
          // Non-fatal; cachedManual still renders locally
        }
      }

      const onlineServer = data.orders.filter((ord) => ord.paymentMethod !== 'opay');
      const byKey = new Map<string, Order>();
      for (const ord of cachedManual) {
        byKey.set(ord.orderNumber.toUpperCase(), ord);
      }
      for (const ord of onlineServer) {
        byKey.set((ord.paymentReference || ord.orderNumber).toUpperCase(), ord);
      }
      const combined = Array.from(byKey.values()).sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      );

      setHistoryOrders(combined);
    } catch (err) {
      if (cachedBefore.length > 0) {
        setHistoryOrders((prev) => (prev.length > 0 ? prev : cachedBefore));
      }
      setHistoryError(err instanceof Error ? err.message : 'Unable to load order history.');
    } finally {
      setLoadingHistory(false);
    }
  }, [token, handleLock, historyOrders.length]);

  useEffect(() => {
    if (token && showHistory) {
      void loadHistory();
    }
    // Intentionally re-fetch whenever history is toggled ON so new manual orders appear immediately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, showHistory]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = queryInput.trim();
    if (!q) {
      setLookupError('Please paste an Order Number (e.g. BN-1041-XXXX) or 4-Letter Code.');
      return;
    }

    setLookingUp(true);
    setLookupError('');
    try {
      const res = await fetch(`/api/orders-lookup?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleLock('Your session expired. Enter the PIN code to continue.');
        return;
      }
      const data = (await res.json()) as { order?: Order; error?: string };
      if (res.ok && data.order) {
        if (data.order.paymentMethod === 'opay') {
          saveManualOrderToCache(data.order);
        }
        setSelectedOrder(data.order);
        return;
      }

      // Fallback check against local manual archive in case serverless cold start wiped /tmp
      const upper = q.toUpperCase();
      const cachedMatch = getCachedManualOrders().find(
        (ord) =>
          ord.orderNumber.toUpperCase() === upper ||
          (ord.verificationCode || '').toUpperCase() === upper
      );
      if (cachedMatch) {
        setSelectedOrder(cachedMatch);
        void fetch('/api/orders-history/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orders: [cachedMatch] }),
        }).catch(() => {});
        return;
      }

      throw new Error(
        data.error || 'No verified order found for that Order Number or 4-Letter Code.'
      );
    } catch (err) {
      setSelectedOrder(null);
      setLookupError(err instanceof Error ? err.message : 'Unable to look up order.');
    } finally {
      setLookingUp(false);
    }
  };

  const filteredByCodeOrOrderNumber = useMemo(() => {
    const q = historyFilter.trim().toLowerCase();
    if (!q) return historyOrders;
    return historyOrders.filter(
      (ord) =>
        ord.orderNumber.toLowerCase().includes(q) ||
        (ord.verificationCode || '').toLowerCase().includes(q)
    );
  }, [historyOrders, historyFilter]);

  const manualHistoryOrders = useMemo(
    () => filteredByCodeOrOrderNumber.filter((ord) => ord.paymentMethod === 'opay'),
    [filteredByCodeOrOrderNumber]
  );

  const onlineHistoryOrders = useMemo(
    () => filteredByCodeOrOrderNumber.filter((ord) => ord.paymentMethod !== 'opay'),
    [filteredByCodeOrOrderNumber]
  );

  const renderHistoryRow = (ord: Order) => {
    const payable =
      ord.totalNgn ?? ord.subtotalNgn - (ord.discountNgn ?? 0) + (ord.deliveryFeeNgn ?? 0);
    const isSelected = selectedOrder?.orderNumber === ord.orderNumber;
    const isManual = ord.paymentMethod === 'opay';

    return (
      <article
        key={`${ord.orderNumber}-${ord.paymentReference}`}
        className={`rounded-xl border p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isSelected
            ? 'border-[#B85C38] bg-[#FAF5EE] dark:bg-[#1E1814]'
            : 'border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814]'
        }`}
      >
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
            <span className="font-mono-num font-semibold text-sm text-[#1C1410] dark:text-[#F3EBDF]">
              {ord.orderNumber}
            </span>
            {isManual && ord.verificationCode && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num font-bold uppercase text-[#B85C38] dark:text-[#C6A36A]">
                  CODE: {ord.verificationCode}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{new Date(ord.createdAt).toLocaleString('en-NG')}</span>
            <span aria-hidden="true">·</span>
            <span>{ord.shipping.state}</span>
          </div>

          <p className="text-sm font-medium text-[#1C1410] dark:text-[#F3EBDF]">
            {ord.customer.fullName}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
          <p className="font-mono-num text-base font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
            {formatNgn(payable)}
          </p>

          <button
            type="button"
            onClick={() => {
              setSelectedOrder(ord);
              setQueryInput(ord.orderNumber);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="min-h-[38px] px-4 py-2 rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] hover:bg-[#B85C38] dark:hover:bg-[#C6A36A] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            View Details
          </button>
        </div>
      </article>
    );
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-16 lg:py-24">
        <div className="rounded-xl border border-[#1C1410]/12 dark:border-[#F3EBDF]/12 bg-[#FAF5EE] dark:bg-[#1E1814] p-7 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
              <Lock className="w-3.5 h-3.5 text-[#B85C38]" aria-hidden="true" />
              <span>Protected Store Records</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
              Order Lookup
            </h1>
            <p className="text-sm leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
              Enter the PIN code to look up orders by Order Number or 4-Letter Code and manage order history.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="lookup-pin-input"
                className="block text-xs font-semibold text-[#1C1410] dark:text-[#F3EBDF]"
              >
                PIN Code
              </label>
              <input
                id="lookup-pin-input"
                type="password"
                autoComplete="off"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN code"
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 bg-[#F3EBDF] dark:bg-[#14100D] text-sm text-[#1C1410] dark:text-[#F3EBDF] focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
              />
            </div>

            {pinError && (
              <div
                role="alert"
                className="rounded-lg border border-[#B85C38]/40 bg-[#B85C38]/10 px-3.5 py-2.5 text-xs font-medium text-[#1C1410] dark:text-[#F3EBDF]"
              >
                {pinError}
              </div>
            )}

            <button
              type="submit"
              disabled={unlocking}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] disabled:opacity-60 text-sm font-semibold transition-colors cursor-pointer"
            >
              {unlocking ? 'Verifying PIN…' : 'Unlock Order Lookup'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      {/* Unlocked Header & Primary Order Number / 4-Letter Code Search */}
      <section className="space-y-6 pb-8 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
              Bev Naturals Cosmetics · Verified Purchase Records
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
              Order Lookup
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
              Search strictly by Order Number (e.g.{' '}
              <span className="font-mono-num">BN-1041-XXXX</span>) or 4-letter verification code (e.g.{' '}
              <span className="font-mono-num">KRMQ</span>) to inspect full customer, delivery, and product details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={showHistory}
              onClick={() => setShowHistory((prev) => !prev)}
              className={`inline-flex items-center gap-2.5 min-h-[40px] px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                showHistory
                  ? 'border-[#3D5344] bg-[#3D5344]/10 text-[#1C1410] dark:text-[#F3EBDF]'
                  : 'border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-[#5C4E45] dark:text-[#B8AA9B] hover:text-[#1C1410] dark:hover:text-[#F3EBDF]'
              }`}
            >
              {showHistory ? (
                <Eye className="w-3.5 h-3.5 text-[#3D5344] dark:text-[#8FB49B]" aria-hidden="true" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>Order History</span>
              <span
                aria-hidden="true"
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  showHistory ? 'bg-[#3D5344]' : 'bg-[#1C1410]/20 dark:bg-[#F3EBDF]/20'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[#FAF5EE] transition-transform ${
                    showHistory ? 'translate-x-[18px]' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleLock()}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-xs font-semibold text-[#1C1410] dark:text-[#F3EBDF] hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Lock</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleLookup}
          className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C4E45] dark:text-[#B8AA9B]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Paste Order Number (BN-1041-XXXX) or 4-Letter Code (e.g. KRMQ)"
              aria-label="Order Number or 4-Letter Code"
              className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 bg-[#FAF5EE] dark:bg-[#1E1814] font-mono-num text-sm text-[#1C1410] dark:text-[#F3EBDF] placeholder:font-sans placeholder:text-[#5C4E45]/70 dark:placeholder:text-[#B8AA9B]/70 focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
            />
          </div>
          <button
            type="submit"
            disabled={lookingUp}
            className="min-h-[48px] px-6 py-2.5 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] disabled:opacity-60 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {lookingUp ? 'Checking Order…' : 'Look Up Order'}
          </button>
        </form>

        {lookupError && (
          <div
            role="alert"
            className="rounded-lg border border-[#B85C38]/40 bg-[#B85C38]/10 px-4 py-3 text-sm text-[#1C1410] dark:text-[#F3EBDF]"
          >
            {lookupError}
          </div>
        )}
      </section>

      {/* Active Lookup Result */}
      {selectedOrder && (
        <section id="selected-order-detail" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold">Order Details</h2>
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="text-xs font-medium underline underline-offset-4 text-[#5C4E45] dark:text-[#B8AA9B] hover:text-[#1C1410] dark:hover:text-[#F3EBDF] cursor-pointer"
            >
              Clear Result
            </button>
          </div>
          <OrderReceiptCard order={selectedOrder} lookupView={true} />
        </section>
      )}

      {/* Optional Toggled Order History (Hidden by Default, Split into Manual & Online Sections) */}
      {showHistory && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-display text-3xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                Order History
              </h2>
              <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                Track orders by Order Number or 4-Letter Code ({filteredByCodeOrOrderNumber.length}).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="search"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                placeholder="Filter by Order Number or Code…"
                aria-label="Filter order history by Order Number or 4-Letter Code"
                className="min-h-[40px] w-full sm:w-64 px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#FAF5EE] dark:bg-[#1E1814] font-mono-num text-xs placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
              />
              <button
                type="button"
                onClick={loadHistory}
                disabled={loadingHistory}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-xs font-medium hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-xs font-medium hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Hide History</span>
              </button>
            </div>
          </div>

          {/* Section Switcher: Manual First, Followed by Others & All */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10 pb-3">
            {[
              { id: 'manual' as const, label: `Manual (${manualHistoryOrders.length})` },
              { id: 'online' as const, label: `Others (${onlineHistoryOrders.length})` },
              { id: 'all' as const, label: `All (${filteredByCodeOrOrderNumber.length})` },
            ].map((tab) => {
              const active = historySection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHistorySection(tab.id)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'border-[#1C1410] bg-[#1C1410] text-[#F3EBDF] dark:border-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410]'
                      : 'border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-[#5C4E45] dark:text-[#B8AA9B] hover:text-[#1C1410] dark:hover:text-[#F3EBDF]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {historyError && (
            <div
              role="alert"
              className="rounded-lg border border-[#B85C38]/40 bg-[#B85C38]/10 px-4 py-3 text-sm text-[#1C1410] dark:text-[#F3EBDF]"
            >
              {historyError}
            </div>
          )}

          {loadingHistory && historyOrders.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814]">
              <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
                Loading verified order history…
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Manual Section */}
              {(historySection === 'all' || historySection === 'manual') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-2xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                      Manual Section
                    </h3>
                    <span className="text-xs font-mono-num text-[#5C4E45] dark:text-[#B8AA9B]">
                      {manualHistoryOrders.length} orders
                    </span>
                  </div>

                  {manualHistoryOrders.length === 0 ? (
                    <div className="py-10 text-center rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] space-y-1.5">
                      <p className="font-display text-xl">No manual transfer orders recorded yet.</p>
                      <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                        Manual orders appear here once the customer copies their 4-letter verification code.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">{manualHistoryOrders.map(renderHistoryRow)}</div>
                  )}
                </div>
              )}

              {/* Others Section */}
              {(historySection === 'all' || historySection === 'online') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-2xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                      Others
                    </h3>
                    <span className="text-xs font-mono-num text-[#5C4E45] dark:text-[#B8AA9B]">
                      {onlineHistoryOrders.length} orders
                    </span>
                  </div>

                  {onlineHistoryOrders.length === 0 ? (
                    <div className="py-10 text-center rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814]">
                      <p className="font-display text-xl">No other checkout orders found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">{onlineHistoryOrders.map(renderHistoryRow)}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
