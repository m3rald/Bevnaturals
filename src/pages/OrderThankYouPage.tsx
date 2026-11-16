import { useEffect, useState } from 'react';
import { useStore } from '../lib/cart-context';
import { Link, useRouter } from '../lib/router';
import { OrderReceiptCard } from '../components/OrderReceiptCard';
import type { Order } from '../lib/types';

export function OrderThankYouPage({ orderNumber }: { orderNumber: string }) {
  const { search } = useRouter();
  const { clearBag } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadAndMaybeVerify() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams(search);
        const verifyType = params.get('verify');
        const reference = params.get('reference') || params.get('trxref');

        if (verifyType === 'paystack' && reference) {
          const vRes = await fetch('/api/paystack/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference }),
          });
          if (vRes.ok) {
            clearBag();
          }
        }

        const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
        const data = (await res.json()) as { order?: Order; error?: string };
        if (!res.ok || !data.order) {
          throw new Error(data.error || 'Order receipt could not be loaded.');
        }
        if (active) setOrder(data.order);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load order.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAndMaybeVerify();
    return () => {
      active = false;
    };
  }, [orderNumber, search, clearBag]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center">
        <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">Loading order receipt…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center space-y-4">
        <h1 className="font-display text-3xl font-semibold">Order Receipt Unavailable</h1>
        <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">{error}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/order-lookup"
            className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] text-xs font-semibold"
          >
            Open Order Lookup
          </Link>
          <Link
            to="/sessions"
            className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 text-xs font-semibold"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <OrderReceiptCard order={order} showScreenshotPrompt={true} />

      <div className="print:hidden flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/sessions"
          className="min-h-[42px] inline-flex items-center px-5 py-2.5 rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 text-xs font-semibold hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5"
        >
          Continue Shopping
        </Link>
        <Link
          to="/order-lookup"
          className="min-h-[42px] inline-flex items-center px-5 py-2.5 rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] text-xs font-semibold"
        >
          Order Lookup
        </Link>
      </div>
    </div>
  );
}
