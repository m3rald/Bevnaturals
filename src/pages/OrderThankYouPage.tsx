import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Package, Truck } from 'lucide-react';
import { formatNgn } from '../lib/catalog';
import { storeConfig } from '../lib/store-config';
import { useStore } from '../lib/cart-context';
import { Link, useRouter } from '../lib/router';
import type { Order, OrderStatus } from '../lib/types';

const STATUS_META: Record<
  OrderStatus,
  { label: string; description: string; icon: typeof Clock }
> = {
  awaiting_payment: {
    label: 'Awaiting Payment',
    description: 'Complete your Paystack payment to queue your order for packing.',
    icon: Clock,
  },
  paid: {
    label: 'Payment Confirmed',
    description: 'Your Paystack payment is verified and queued for fresh batch packing in Ibadan.',
    icon: CheckCircle2,
  },
  preparing: {
    label: 'Preparing Dispatch',
    description: 'Our Ibadan studio is packing your bottles and confirming waybill routing.',
    icon: Package,
  },
  shipped: {
    label: 'Shipped',
    description: 'Your parcel has left our Ibadan studio for your destination.',
    icon: Truck,
  },
};

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
        <Link
          to="/shop"
          className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] text-xs font-semibold"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const statusMeta = STATUS_META[order.status];
  const StatusIcon = statusMeta.icon;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
              Order Confirmation
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
              Order <span className="font-mono-num">{order.orderNumber}</span>
            </h1>
            <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
              Thank you, {order.customer.fullName}. {statusMeta.description}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-xs font-semibold whitespace-nowrap self-start">
            <StatusIcon className="w-4 h-4 text-[#3D5344] dark:text-[#8FB49B]" aria-hidden="true" />
            <span>{statusMeta.label}</span>
          </div>
        </div>

        {/* Itemized Receipt */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold tracking-wide text-[#5C4E45] dark:text-[#B8AA9B]">
            Items Ordered
          </h2>
          <ul className="divide-y divide-[#1C1410]/10 dark:divide-[#F3EBDF]/10 text-sm">
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.variantId}`} className="py-3 flex justify-between gap-4">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                    {item.sizeLabel} × {item.quantity} · {formatNgn(item.unitPriceNgn)}
                  </p>
                </div>
                <span className="font-mono-num font-medium">{formatNgn(item.lineTotalNgn)}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#5C4E45] dark:text-[#B8AA9B]">Products Subtotal</span>
              <span className="font-mono-num font-semibold">{formatNgn(order.subtotalNgn)}</span>
            </div>
            {(order.discountNgn ?? 0) > 0 && (
              <div className="flex justify-between text-[#3D5344] dark:text-[#8FB49B]">
                <span>{order.discountLabel || '10% Launch Week Off (Products)'}</span>
                <span className="font-mono-num font-semibold">
                  -{formatNgn(order.discountNgn ?? 0)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#5C4E45] dark:text-[#B8AA9B]">
                Shipping{order.shipping.methodLabel ? ` (${order.shipping.methodLabel})` : ''}
              </span>
              <span className="font-mono-num font-semibold">
                {order.deliveryFeeNgn !== null
                  ? formatNgn(order.deliveryFeeNgn)
                  : 'Quoted after confirmation'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
              <span className="font-semibold">Total Paid / Payable</span>
              <span className="font-mono-num font-semibold">
                {formatNgn(
                  order.totalNgn ??
                    order.subtotalNgn - (order.discountNgn ?? 0) + (order.deliveryFeeNgn ?? 0)
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
          <div className="space-y-1">
            <p className="font-semibold text-[#1C1410] dark:text-[#F3EBDF]">Delivery Destination</p>
            <p>{order.customer.fullName}</p>
            {order.shipping.regionLabel && <p>{order.shipping.regionLabel}</p>}
            <p>{order.shipping.address}</p>
            <p>
              {order.shipping.city}, {order.shipping.state}
            </p>
            <p>{order.customer.phone}</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-[#1C1410] dark:text-[#F3EBDF]">Payment Reference</p>
            <p>{order.paymentChannel}</p>
            <p className="font-mono-num">{order.paymentReference}</p>
            <p className="pt-1">
              Questions? Contact{' '}
              <a href={`mailto:${storeConfig.email}`} className="underline">
                {storeConfig.email}
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/sessions"
          className="min-h-[42px] inline-flex items-center px-5 py-2.5 rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 text-xs font-semibold hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
