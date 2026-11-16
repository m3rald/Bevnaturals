import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { formatNgn } from '../lib/catalog';
import { OrderReceiptCard } from '../components/OrderReceiptCard';
import type { Order } from '../lib/types';

export function OrderLookupPage() {
  const [queryInput, setQueryInput] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('');

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/orders-history');
      const data = (await res.json()) as { orders?: Order[] };
      if (Array.isArray(data.orders)) {
        setHistoryOrders(data.orders);
      }
    } catch {
      // handled cleanly by empty state
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = queryInput.trim();
    if (!q) {
      setLookupError('Please paste an Order Number or Paystack reference.');
      return;
    }

    setLookingUp(true);
    setLookupError('');
    try {
      const res = await fetch(`/api/orders-lookup?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        throw new Error(data.error || 'No order found for that number.');
      }
      setSelectedOrder(data.order);
    } catch (err) {
      setSelectedOrder(null);
      setLookupError(err instanceof Error ? err.message : 'Unable to find order.');
    } finally {
      setLookingUp(false);
    }
  };

  const filteredHistory = useMemo(() => {
    const q = historyFilter.trim().toLowerCase();
    if (!q) return historyOrders;
    return historyOrders.filter((ord) => {
      const haystack = [
        ord.orderNumber,
        ord.paymentReference,
        ord.customer.fullName,
        ord.customer.email,
        ord.customer.phone,
        ord.shipping.state,
        ord.shipping.city,
        ord.shipping.address,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [historyOrders, historyFilter]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 lg:py-16 space-y-12">
      {/* Primary Lookup Input */}
      <section className="space-y-6 pb-8 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
            Bev Naturals Cosmetics · Verified Purchase Records
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
            Order Lookup
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
            Paste an Order Number (e.g. <span className="font-mono-num">BN-1041-XXXX</span>) or Paystack reference to inspect full customer, delivery, and product details for any successful purchase.
          </p>
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
              placeholder="Paste Order Number (BN-...) or Paystack Reference (BN-PS-...)"
              aria-label="Order Number or Paystack Reference"
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
          <OrderReceiptCard order={selectedOrder} />
        </section>
      )}

      {/* Previous Successful Purchases (Synced from Store Ledger + Live Paystack History) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-3xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
              Previous Successful Purchases
            </h2>
            <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
              Includes verified orders recorded in the store and prior Paystack transactions ({filteredHistory.length}).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="search"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              placeholder="Filter by name, email, or state…"
              aria-label="Filter previous purchases"
              className="min-h-[40px] w-full sm:w-64 px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#FAF5EE] dark:bg-[#1E1814] text-xs focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
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
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-14 text-center rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814]">
            <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
              Syncing previous Paystack purchases…
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-14 text-center rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] space-y-2">
            <p className="font-display text-2xl">No matching successful purchases found.</p>
            <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
              Paste an Order Number or Paystack reference above to look up a specific transaction directly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((ord) => {
              const payable =
                ord.totalNgn ??
                ord.subtotalNgn - (ord.discountNgn ?? 0) + (ord.deliveryFeeNgn ?? 0);
              const isSelected = selectedOrder?.paymentReference === ord.paymentReference;

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
                      <span aria-hidden="true">·</span>
                      <span>{new Date(ord.createdAt).toLocaleString('en-NG')}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ord.paymentChannel}</span>
                    </div>

                    <p className="text-sm font-medium text-[#1C1410] dark:text-[#F3EBDF]">
                      {ord.customer.fullName} · {ord.customer.email}
                      {ord.customer.phone && ord.customer.phone !== '—'
                        ? ` · ${ord.customer.phone}`
                        : ''}
                    </p>

                    <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                      {ord.shipping.address}, {ord.shipping.city}, {ord.shipping.state}
                      {ord.items.length > 0
                        ? ` · ${ord.items
                            .map((i) => `${i.productName} × ${i.quantity}`)
                            .join(', ')}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="font-mono-num text-base font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                        {formatNgn(payable)}
                      </p>
                      <p className="font-mono-num text-[11px] text-[#5C4E45] dark:text-[#B8AA9B]">
                        {ord.paymentReference}
                      </p>
                    </div>

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
            })}
          </div>
        )}
      </section>
    </div>
  );
}
