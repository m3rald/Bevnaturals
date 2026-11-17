import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  Package,
  Printer,
  Truck,
} from 'lucide-react';
import { formatNgn } from '../lib/catalog';
import { storeConfig } from '../lib/store-config';
import type { Order, OrderStatus } from '../lib/types';

function getStatusMeta(order: Order, lookupView = false): {
  label: string;
  description: string;
  icon: typeof Clock;
} {
  const isOpay = order.paymentMethod === 'opay';
  const map: Record<OrderStatus, { label: string; description: string; icon: typeof Clock }> = {
    awaiting_payment: {
      label: lookupView
        ? isOpay
          ? 'Manual OPay Order'
          : 'Awaiting Payment'
        : isOpay
          ? 'Transfer Submitted · Verify on WhatsApp'
          : 'Awaiting Payment',
      description: lookupView
        ? isOpay
          ? 'Manual bank transfer order recorded for store verification.'
          : 'Order awaiting payment confirmation.'
        : isOpay
          ? `Send a screenshot of this placed order and your 4-letter verification code to WhatsApp ${storeConfig.opay.whatsappNumber}.`
          : 'Complete your payment to queue your order for packing.',
      icon: Clock,
    },
    paid: {
      label: 'Payment Confirmed',
      description: lookupView
        ? 'Verified payment record.'
        : 'Your payment is verified and queued for fresh batch packing in Ibadan.',
      icon: CheckCircle2,
    },
    preparing: {
      label: 'Preparing Dispatch',
      description: lookupView
        ? 'Order is being prepared for dispatch.'
        : 'Our Ibadan studio is packing your bottles and confirming waybill routing.',
      icon: Package,
    },
    shipped: {
      label: 'Shipped',
      description: lookupView
        ? 'Order has been shipped.'
        : 'Your parcel has left our Ibadan studio for your destination.',
      icon: Truck,
    },
  };
  return map[order.status];
}

export function OrderReceiptCard({
  order,
  showScreenshotPrompt = false,
  hideWhatsappButton = false,
  lookupView = false,
}: {
  order: Order;
  showScreenshotPrompt?: boolean;
  hideWhatsappButton?: boolean;
  lookupView?: boolean;
}) {
  const [copiedOrderNum, setCopiedOrderNum] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const statusMeta = getStatusMeta(order, lookupView);
  const StatusIcon = statusMeta.icon;
  const isOpay = order.paymentMethod === 'opay';

  const payable =
    order.totalNgn ??
    order.subtotalNgn - (order.discountNgn ?? 0) + (order.deliveryFeeNgn ?? 0);

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopiedOrderNum(true);
      setTimeout(() => setCopiedOrderNum(false), 1800);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const handleCopyVerificationCode = async () => {
    if (!order.verificationCode) return;
    try {
      await navigator.clipboard.writeText(order.verificationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
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
              {copiedOrderNum ? (
                <Check className="w-3.5 h-3.5 text-[#3D5344]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedOrderNum ? 'Copied' : 'Copy Number'}</span>
            </button>
          </div>
          <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
            {lookupView
              ? `${order.customer.fullName} · ${statusMeta.description}`
              : `Thank you, ${order.customer.fullName}. ${statusMeta.description}`}
          </p>
          {showScreenshotPrompt && !lookupView && (
            <p className="text-xs font-bold uppercase tracking-wide text-[#B85C38] dark:text-[#C6A36A]">
              Screenshot this placed order receipt and send to WhatsApp {storeConfig.opay.whatsappNumber}.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          {lookupView && order.verificationCode && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#B85C38]/35 bg-[#B85C38]/10 text-xs font-bold uppercase tracking-wider text-[#1C1410] dark:text-[#F3EBDF] whitespace-nowrap">
              <span className="text-[#B85C38] dark:text-[#C6A36A]">Code:</span>
              <span className="font-mono-num text-sm">{order.verificationCode}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-xs font-semibold whitespace-nowrap">
            <StatusIcon className="w-4 h-4 text-[#3D5344] dark:text-[#8FB49B]" aria-hidden="true" />
            <span>{statusMeta.label}</span>
          </div>
        </div>
      </div>

      {/* 4-Letter Verification Code & Strict WhatsApp Screenshot Requirement (Customer Receipt Only) */}
      {(isOpay || order.verificationCode) && !lookupView && (
        <div className="rounded-xl border-2 border-[#B85C38] bg-[#B85C38]/10 dark:bg-[#B85C38]/15 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[#B85C38] dark:text-[#C6A36A]">
                Your 4-Letter Payment Verification Code
              </p>
              <div className="flex items-center gap-3">
                <span className="font-mono-num text-3xl sm:text-4xl font-bold tracking-[0.28em] text-[#1C1410] dark:text-[#F3EBDF] uppercase">
                  {order.verificationCode || '—'}
                </span>
                {order.verificationCode && (
                  <button
                    type="button"
                    onClick={handleCopyVerificationCode}
                    className="print:hidden inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 bg-[#FAF5EE] dark:bg-[#1E1814] text-xs font-semibold cursor-pointer"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-[#3D5344]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-[#FAF5EE] dark:bg-[#14100D] border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 px-4 py-3 text-xs space-y-0.5 font-bold uppercase tracking-wide text-[#1C1410] dark:text-[#F3EBDF]">
              <p className="font-mono-num text-sm">{storeConfig.opay.accountNumber}</p>
              <p>{storeConfig.opay.bankName}</p>
              <p>{storeConfig.opay.accountName}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-[#1C1410] dark:text-[#F3EBDF] pt-2 border-t border-[#B85C38]/25">
            <AlertTriangle className="w-5 h-5 text-[#B85C38] dark:text-[#C6A36A] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              <span className="font-extrabold uppercase">STRICT INSTRUCTION:</span> SEND YOUR PAYMENT PROOF (SCREENSHOT OF THIS PLACED ORDER) AND YOUR 4-LETTER VERIFICATION CODE{' '}
              <span className="font-mono-num font-extrabold uppercase underline">
                ({order.verificationCode || 'CODE'})
              </span>{' '}
              TO WHATSAPP NUMBER{' '}
              <span className="font-mono-num font-extrabold underline">
                {storeConfig.opay.whatsappNumber}
              </span>{' '}
              IMMEDIATELY TO CONFIRM YOUR ORDER.
            </p>
          </div>

          {!hideWhatsappButton && (
            <div className="print:hidden pt-1 flex flex-wrap items-center gap-3">
              <a
                href={storeConfig.opay.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] ring-2 ring-[#10B981]/50 shadow-sm text-xs sm:text-sm font-extrabold tracking-wide transition-colors"
              >
                <span>Click this</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
              <span className="text-xs font-bold text-[#1C1410] dark:text-[#F3EBDF]">
                Redirects straight to WhatsApp ({storeConfig.opay.whatsappNumber}) to send your proof &amp; code
              </span>
            </div>
          )}
        </div>
      )}

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
          <p className="font-semibold text-[#1C1410] dark:text-[#F3EBDF]">Payment &amp; Date</p>
          <p className="font-semibold text-[#1C1410] dark:text-[#F3EBDF]">{order.paymentChannel}</p>
          <p className="font-mono-num text-[#1C1410] dark:text-[#F3EBDF]">
            Order Number: <span className="font-semibold">{order.orderNumber}</span>
          </p>
          {order.verificationCode && (
            <p className="font-mono-num text-[#B85C38] dark:text-[#C6A36A] font-bold uppercase">
              Code Number: {order.verificationCode}
            </p>
          )}
          <p className="font-mono-num text-[#5C4E45] dark:text-[#B8AA9B] break-all">
            Ref: {order.paymentReference}
          </p>
          <p className="text-[#5C4E45] dark:text-[#B8AA9B]">
            Time &amp; Date: {new Date(order.createdAt).toLocaleString('en-NG')}
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
            Verified order transaction ({order.paymentReference}).
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
            <span className="font-semibold">
              {isOpay ? 'Total Transferred (OPay)' : 'Total Paid on Paystack'}
            </span>
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
              {lookupView
                ? `Order ${order.orderNumber}${order.verificationCode ? ` · Code ${order.verificationCode}` : ''} · ${new Date(order.createdAt).toLocaleString('en-NG')}`
                : order.emailFeedback?.customerNotified && order.emailFeedback?.ownerNotified
                  ? `Confirmation receipt sent to ${order.customer.email} and store owner (${storeConfig.email}).`
                  : isOpay
                    ? `Order receipt recorded for ${order.customer.email}. Remember to send your screenshot & 4-letter code to WhatsApp ${storeConfig.opay.whatsappNumber}.`
                    : `Receipt details recorded for ${order.customer.email} & store owner (${storeConfig.email}).`}
            </p>
            {!lookupView && (
              <p>
                Questions? Contact{' '}
                <a href={`mailto:${storeConfig.email}`} className="underline">
                  {storeConfig.email}
                </a>
              </p>
            )}
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
