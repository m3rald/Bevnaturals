import { useState } from 'react';
import { Check, CheckCircle2, Clock, Copy, Mail, Package, Printer, Truck } from 'lucide-react';
import { formatNgn } from '../lib/catalog';
import { storeConfig } from '../lib/store-config';
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

export function OrderReceiptCard({
  order,
  showScreenshotPrompt = false,
}: {
  order: Order;
  showScreenshotPrompt?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const statusMeta = STATUS_META[order.status];
  const StatusIcon = statusMeta.icon;

  const payable =
    order.totalNgn ??
    order.subtotalNgn - (order.discountNgn ?? 0) + (order.deliveryFeeNgn ?? 0);

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard restrictions
    }
  };

  return (
    <div className="rounded-xl border border-[#1C1410]/12 dark:border-[#F3EBDF]/12 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
            {storeConfig.brandName} · Official Order Receipt
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
              Order <span className="font-mono-num">{order.orderNumber}</span>
            </h2>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="print:hidden inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-xs font-medium hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#3D5344]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Number'}</span>
            </button>
          </div>
          <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
            Thank you, {order.customer.fullName}. {statusMeta.description}
          </p>
          {showScreenshotPrompt && (
            <p className="text-xs font-medium text-[#3D5344] dark:text-[#8FB49B]">
              Screenshot or save this page — keep your Order Number for Order Lookup anytime.
            </p>
          )}
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-xs font-semibold whitespace-nowrap self-start">
          <StatusIcon className="w-4 h-4 text-[#3D5344] dark:text-[#8FB49B]" aria-hidden="true" />
          <span>{statusMeta.label}</span>
        </div>
      </div>

      {/* Full Customer & Delivery Details for Screenshot & Records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10 text-xs">
        <div className="rounded-lg bg-[#F3EBDF] dark:bg-[#14100D] p-4 space-y-1.5">
          <p className="font-semibold text-[#1C1410] dark:text-[#F3EBDF]">Customer Details</p>
          <p className="text-sm font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
            {order.customer.fullName}
          </p>
          <p className="text-[#5C4E45] dark:text-[#B8AA9B] break-all">{order.customer.email}</p>
          <p className="font-mono-num text-[#1C1410] dark:text-[#F3EBDF]">{order.customer.phone}</p>
        </div>

        <div className="rounded-lg bg-[#F3EBDF] dark:bg-[#14100D] p-4 space-y-1.5">
          <p className="font-semibold text-[#1C1410] dark:text-[#F3EBDF]">Delivery Destination</p>
          {order.shipping.regionLabel && (
            <p className="text-[#5C4E45] dark:text-[#B8AA9B]">{order.shipping.regionLabel}</p>
          )}
          {order.shipping.methodLabel && (
            <p className="font-medium text-[#1C1410] dark:text-[#F3EBDF]">
              {order.shipping.methodLabel}
            </p>
          )}
          <p className="text-[#5C4E45] dark:text-[#B8AA9B]">{order.shipping.address}</p>
          <p className="text-[#1C1410] dark:text-[#F3EBDF]">
            {order.shipping.city}, {order.shipping.state}
          </p>
          {order.shipping.note && (
            <p className="text-[#5C4E45] dark:text-[#B8AA9B] pt-0.5">
              Note: {order.shipping.note}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-[#F3EBDF] dark:bg-[#14100D] p-4 space-y-1.5 sm:col-span-2 lg:col-span-1">
          <p className="font-semibold text-[#1C1410] dark:text-[#F3EBDF]">Payment & Date</p>
          <p className="text-[#1C1410] dark:text-[#F3EBDF]">{order.paymentChannel}</p>
          <p className="font-mono-num text-[#5C4E45] dark:text-[#B8AA9B] break-all">
            Ref: {order.paymentReference}
          </p>
          <p className="text-[#5C4E45] dark:text-[#B8AA9B]">
            Date: {new Date(order.createdAt).toLocaleString('en-NG')}
          </p>
        </div>
      </div>

      {/* Itemized Receipt */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold tracking-wide text-[#5C4E45] dark:text-[#B8AA9B]">
          Items Ordered
        </h3>
        {order.items.length > 0 ? (
          <ul className="divide-y divide-[#1C1410]/10 dark:divide-[#F3EBDF]/10 text-sm">
            {order.items.map((item, idx) => (
              <li
                key={`${item.productId}-${item.variantId}-${idx}`}
                className="py-3 flex justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-[#1C1410] dark:text-[#F3EBDF]">
                    {item.productName}
                  </p>
                  <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                    {item.sizeLabel} × {item.quantity} · {formatNgn(item.unitPriceNgn)}
                  </p>
                </div>
                <span className="font-mono-num font-medium shrink-0">
                  {formatNgn(item.lineTotalNgn)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
            Paystack transaction verified ({order.paymentReference}).
          </p>
        )}

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
            <span className="font-semibold">Total Paid on Paystack</span>
            <span className="font-mono-num text-base font-semibold">{formatNgn(payable)}</span>
          </div>
        </div>
      </div>

      {/* Email Feedback & Print Actions */}
      <div className="pt-5 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
        <div className="flex items-start gap-2">
          <Mail className="w-4 h-4 text-[#3D5344] dark:text-[#8FB49B] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <p className="text-[#1C1410] dark:text-[#F3EBDF] font-medium">
              {order.emailFeedback?.customerNotified && order.emailFeedback?.ownerNotified
                ? `Confirmation receipt sent to ${order.customer.email} and store owner (${storeConfig.email}).`
                : `Paystack receipt details recorded for ${order.customer.email} & store owner (${storeConfig.email}).`}
            </p>
            <p>
              Questions? Contact{' '}
              <a href={`mailto:${storeConfig.email}`} className="underline">
                {storeConfig.email}
              </a>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="print:hidden inline-flex items-center justify-center gap-2 min-h-[38px] px-4 py-2 rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 text-[#1C1410] dark:text-[#F3EBDF] font-semibold hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Print / Save Receipt</span>
        </button>
      </div>
    </div>
  );
}
