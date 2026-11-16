import React, { useMemo, useState } from 'react';
import { ExternalLink, CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { findProductAndVariant, formatNgn } from '../lib/catalog';
import { calculatePromoDiscount } from '../lib/promo';
import {
  SHIPPING_REGIONS,
  findRegionById,
  resolveShippingQuote,
  type ShippingMethodId,
  type ShippingRegionId,
} from '../lib/shipping';
import { useStore } from '../lib/cart-context';
import { Link, useRouter } from '../lib/router';
import { PromoCountdownCard, useLivePromoSnapshot } from '../components/PromoCountdownCard';
import type { Order } from '../lib/types';

interface PaystackV2Instance {
  resumeTransaction: (
    accessCode: string,
    callbacks?: {
      onSuccess?: (transaction?: { reference?: string }) => void;
      onCancel?: () => void;
      onError?: (error?: { message?: string }) => void;
    }
  ) => void;
}

declare global {
  interface Window {
    PaystackPop?: (new () => PaystackV2Instance) & {
      setup?: (options: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref: string;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

async function ensurePaystackV2Loaded(timeoutMs = 3500): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (typeof window.PaystackPop === 'function') return true;

  const existing = document.querySelector<HTMLScriptElement>(
    'script[src*="js.paystack.co/v2/inline.js"]'
  );
  if (!existing) {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    document.head.appendChild(script);
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (typeof window.PaystackPop === 'function') return true;
    await new Promise((r) => setTimeout(r, 120));
  }
  return typeof window.PaystackPop === 'function';
}

export function CheckoutPage() {
  const { items, subtotalNgn, clearBag } = useStore();
  const { navigate } = useRouter();
  useLivePromoSnapshot();
  const promo = calculatePromoDiscount(subtotalNgn);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [regionId, setRegionId] = useState<ShippingRegionId>('ibadan');
  const [state, setState] = useState<string>(SHIPPING_REGIONS[0].states[0]);
  const [methodId, setMethodId] = useState<ShippingMethodId>(SHIPPING_REGIONS[0].methods[0].id);
  const [city, setCity] = useState('Ibadan');
  const [address, setAddress] = useState('Ibadan Studio Pick Up');
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [verifyingPending, setVerifyingPending] = useState(false);
  const [error, setError] = useState('');
  const [pendingCheckout, setPendingCheckout] = useState<{
    orderNumber: string;
    reference: string;
    authorizationUrl: string;
  } | null>(null);

  const activeRegion = useMemo(
    () => findRegionById(regionId) || SHIPPING_REGIONS[0],
    [regionId]
  );

  const shippingQuote = useMemo(
    () =>
      resolveShippingQuote({
        regionId: activeRegion.id,
        state,
        methodId,
      })!,
    [activeRegion.id, state, methodId]
  );

  const handleRegionChange = (nextRegionId: ShippingRegionId, chosenState?: string) => {
    const nextRegion = findRegionById(nextRegionId) || SHIPPING_REGIONS[0];
    const nextMethod =
      nextRegion.id === regionId && nextRegion.methods.some((m) => m.id === methodId)
        ? methodId
        : nextRegion.methods[0].id;
    const nextState =
      chosenState && nextRegion.states.includes(chosenState)
        ? chosenState
        : nextRegion.states[0];
    setRegionId(nextRegion.id);
    setState(nextState);
    setMethodId(nextMethod);
    if (nextRegion.id === 'ibadan') {
      setCity('Ibadan');
      setAddress(nextMethod === 'pickup' ? 'Ibadan Studio Pick Up' : '');
    } else {
      setCity(nextState === 'FCT Abuja' ? 'Abuja' : '');
      if (address === 'Ibadan Studio Pick Up') setAddress('');
    }
  };

  const handleMethodChange = (nextMethodId: ShippingMethodId) => {
    setMethodId(nextMethodId);
    if (activeRegion.id === 'ibadan' && nextMethodId === 'pickup') {
      setAddress('Ibadan Studio Pick Up');
      setCity('Ibadan');
    } else if (address === 'Ibadan Studio Pick Up') {
      setAddress('');
    }
  };

  const shippingFeeNgn = shippingQuote.method.feeNgn;
  // Promo applies strictly to products; shipping fee is independent and paid in full
  const finalTotalNgn = promo.totalNgn + shippingFeeNgn;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center space-y-5">
        <h1 className="font-display text-3xl font-semibold">Your bag is empty</h1>
        <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
          Pick a store session and add at least one Bev Naturals treatment before checking out.
        </p>
        <Link
          to="/sessions"
          className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] text-xs font-semibold"
        >
          Choose a Session
        </Link>
      </div>
    );
  }

  const verifyPaystackAndRedirect = async (reference: string, orderNumber: string) => {
    const res = await fetch('/api/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    });
    const data = (await res.json()) as { verified?: boolean; error?: string };
    if (!res.ok || !data.verified) {
      throw new Error(data.error || 'Paystack payment could not be verified.');
    }
    clearBag();
    navigate(`/order/${encodeURIComponent(orderNumber)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingCheckout(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'paystack',
          customer: { fullName, email, phone },
          shipping: {
            address,
            city,
            state: shippingQuote.state,
            regionId: shippingQuote.region.id,
            methodId: shippingQuote.method.id,
            note,
          },
          items,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        order?: Order;
        paystack?: {
          mode: 'live';
          authorizationUrl?: string;
          accessCode?: string;
          reference: string;
          amountKobo: number;
          publicKey?: string;
        };
      };

      if (!res.ok || !data.order) {
        throw new Error(data.error || 'Unable to place order.');
      }

      const createdOrder = data.order;
      const ps = data.paystack;
      if (!ps) {
        throw new Error('Paystack checkout session could not be initialized.');
      }

      const nextPending = {
        orderNumber: createdOrder.orderNumber,
        reference: ps.reference,
        authorizationUrl: ps.authorizationUrl || '',
      };

      const v2Ready = Boolean(ps.accessCode) && (await ensurePaystackV2Loaded());

      if (v2Ready && ps.accessCode && typeof window.PaystackPop === 'function') {
        try {
          const popup = new window.PaystackPop();
          if (typeof popup.resumeTransaction === 'function') {
            popup.resumeTransaction(ps.accessCode, {
              onSuccess: (trx) => {
                verifyPaystackAndRedirect(
                  trx?.reference || ps.reference,
                  createdOrder.orderNumber
                ).catch((err) => {
                  setSubmitting(false);
                  setPendingCheckout(nextPending);
                  setError(err instanceof Error ? err.message : 'Verification error');
                });
              },
              onCancel: () => {
                setSubmitting(false);
                setPendingCheckout(nextPending);
                setError(
                  `Paystack window closed. Your order ${createdOrder.orderNumber} is saved — you can resume payment below.`
                );
              },
              onError: (psErr) => {
                if (ps.authorizationUrl && window.self === window.top) {
                  window.location.href = ps.authorizationUrl;
                  return;
                }
                setSubmitting(false);
                setPendingCheckout(nextPending);
                setError(
                  psErr?.message ||
                    'Paystack inline checkout could not open here. Use the direct Paystack button below.'
                );
              },
            });
            return;
          }
        } catch {
          // Fall through cleanly to hosted Paystack checkout URL
        }
      }

      if (ps.authorizationUrl) {
        if (window.self === window.top) {
          window.location.href = ps.authorizationUrl;
          return;
        }
        setSubmitting(false);
        setPendingCheckout(nextPending);
        return;
      }

      throw new Error('Paystack live checkout URL was not returned.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
      setSubmitting(false);
    }
  };

  const handleManualVerifyPending = async () => {
    if (!pendingCheckout) return;
    setError('');
    setVerifyingPending(true);
    try {
      await verifyPaystackAndRedirect(pendingCheckout.reference, pendingCheckout.orderNumber);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Payment not yet confirmed on Paystack. Complete payment first, then verify again.'
      );
    } finally {
      setVerifyingPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-2 pb-6 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
        <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
          Guest Checkout · No Account Required
        </p>
        <h1 className="font-display text-4xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
          Delivery & Payment
        </h1>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[#B85C38]/40 bg-[#B85C38]/10 px-4 py-3 text-sm text-[#1C1410] dark:text-[#F3EBDF]"
        >
          {error}
        </div>
      )}

      {pendingCheckout && pendingCheckout.authorizationUrl && (
        <div className="rounded-xl border border-[#3D5344]/40 bg-[#3D5344]/8 dark:border-[#567560]/40 dark:bg-[#567560]/12 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
              Order <span className="font-mono-num">{pendingCheckout.orderNumber}</span> is ready for Paystack payment
            </p>
            <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
              Open Paystack to complete payment, then click Verify Payment if you aren&apos;t redirected automatically.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={pendingCheckout.authorizationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] text-xs font-semibold transition-colors"
            >
              <span>Open Paystack Checkout</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={handleManualVerifyPending}
              disabled={verifyingPending}
              className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 text-xs font-semibold hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 disabled:opacity-60 cursor-pointer"
            >
              {verifyingPending ? 'Verifying…' : 'Verify Payment'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 space-y-8">
          {/* Customer Details */}
          <section className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 space-y-5">
            <h2 className="font-display text-2xl font-semibold">1. Contact Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="fullName" className="block text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Adebisi Ogunleye"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
                  Email Address (for Paystack receipt)
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0803 000 0000"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
                />
              </div>
            </div>
          </section>

          {/* Regional Shipping & Destination */}
          <section className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#B85C38]" aria-hidden="true" />
                <h2 className="font-display text-2xl font-semibold">2. Pick Your State & Shipping</h2>
              </div>
              <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                Every state is listed directly under its region below. Just tap your state to select it—your region and shipping rate will be set automatically.
              </p>
            </div>

            <div className="space-y-3">
              {SHIPPING_REGIONS.map((region) => {
                const isActiveRegion = activeRegion.id === region.id;
                const minFee = Math.min(...region.methods.map((m) => m.feeNgn));
                const maxFee = Math.max(...region.methods.map((m) => m.feeNgn));
                const feeRangeLabel =
                  minFee === maxFee
                    ? formatNgn(minFee)
                    : `${formatNgn(minFee)} – ${formatNgn(maxFee)}`;

                return (
                  <div
                    key={region.id}
                    className={`rounded-xl border p-4 space-y-3 transition-colors ${
                      isActiveRegion
                        ? 'border-[#B85C38] bg-[#B85C38]/8 dark:bg-[#B85C38]/12'
                        : 'border-[#1C1410]/12 dark:border-[#F3EBDF]/12 bg-[#F3EBDF]/70 dark:bg-[#14100D]/70'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleRegionChange(region.id)}
                        className="text-left text-sm font-semibold text-[#1C1410] dark:text-[#F3EBDF] hover:text-[#B85C38] transition-colors cursor-pointer"
                      >
                        {region.label}
                      </button>
                      <span className="font-mono-num text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
                        {feeRangeLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {region.states.map((st) => {
                        const isSelectedState =
                          isActiveRegion && shippingQuote.state === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleRegionChange(region.id, st)}
                            aria-pressed={isSelectedState}
                            className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                              isSelectedState
                                ? 'border-[#B85C38] bg-[#B85C38] text-[#FAF5EE]'
                                : 'border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#FAF5EE] dark:bg-[#1E1814] text-[#1C1410] dark:text-[#F3EBDF] hover:border-[#B85C38]/60'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shipping Method Options for Chosen Region */}
            <div className="space-y-2.5">
              <span className="block text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
                Delivery / Pick Up Option for {shippingQuote.state}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeRegion.methods.map((option) => {
                  const selected = shippingQuote.method.id === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleMethodChange(option.id)}
                      className={`text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-1 ${
                        selected
                          ? 'border-[#B85C38] bg-[#B85C38]/8 dark:bg-[#B85C38]/15'
                          : 'border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] hover:border-[#B85C38]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                          {option.label}
                        </span>
                        <span className="font-mono-num text-sm font-semibold text-[#B85C38] dark:text-[#C6A36A] shrink-0">
                          {formatNgn(option.feeNgn)}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="address" className="block text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
                  {shippingQuote.method.id === 'pickup'
                    ? 'Pick Up Contact Landmark'
                    : shippingQuote.method.id === 'logistics_pickup'
                      ? 'Preferred Logistics Park / Terminal'
                      : 'Street Delivery Address'}
                </label>
                <input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={
                    shippingQuote.method.id === 'logistics_pickup'
                      ? 'Preferred motor park or waybill logistics office'
                      : 'House number, street, and nearest landmark'
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="city" className="block text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
                  City / Town
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Ikeja, Wuse, Port Harcourt"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="note" className="block text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
                  Delivery Note (optional)
                </label>
                <input
                  id="note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Preferred call time or park instruction"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Paystack Payment + Order Summary */}
        <aside className="lg:col-span-5 space-y-6">
          <section className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold">3. Payment</h2>

            <div className="rounded-xl border border-[#3D5344]/40 bg-[#3D5344]/8 dark:border-[#567560]/40 dark:bg-[#567560]/12 p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="w-4 h-4 text-[#3D5344] dark:text-[#8FB49B]" aria-hidden="true" />
                  <span>Paystack Checkout</span>
                </span>
                <span className="text-[11px] font-medium text-[#3D5344] dark:text-[#8FB49B]">
                  Live
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
                Pay securely with Visa, Mastercard, Verve, Bank Transfer, or USSD via Paystack. Includes products and your selected regional shipping fee.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 space-y-5">
            <h2 className="font-display text-2xl font-semibold">Bag & Shipping Summary</h2>

            <ul className="space-y-3 text-sm divide-y divide-[#1C1410]/10 dark:divide-[#F3EBDF]/10">
              {items.map((item) => {
                const match = findProductAndVariant(item.productId, item.variantId);
                if (!match) return null;
                return (
                  <li
                    key={`${item.productId}-${item.variantId}`}
                    className="pt-3 first:pt-0 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{match.product.name}</p>
                      <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                        {match.variant.sizeLabel} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono-num text-sm shrink-0">
                      {formatNgn(match.variant.priceNgn * item.quantity)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="pt-4 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5C4E45] dark:text-[#B8AA9B]">Products Subtotal</span>
                <span className="font-mono-num font-semibold">
                  {formatNgn(subtotalNgn)}
                </span>
              </div>

              {promo.isActive && (
                <div className="flex justify-between text-[#3D5344] dark:text-[#8FB49B]">
                  <span>10% Launch Week Off (Products)</span>
                  <span className="font-mono-num font-semibold">
                    -{formatNgn(promo.discountNgn)}
                  </span>
                </div>
              )}

              <div className="flex justify-between gap-3">
                <span className="text-[#5C4E45] dark:text-[#B8AA9B]">
                  Shipping · {shippingQuote.method.label} ({shippingQuote.state})
                </span>
                <span className="font-mono-num font-semibold shrink-0">
                  {formatNgn(shippingFeeNgn)}
                </span>
              </div>

              {promo.isActive && (
                <p className="text-[11px] text-[#5C4E45] dark:text-[#B8AA9B]">
                  Shipping fee is independent of the 10% product promo and paid in full.
                </p>
              )}

              <div className="flex justify-between pt-3 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
                <span className="font-semibold">Total to Pay on Paystack</span>
                <span className="font-mono-num text-lg font-semibold">
                  {formatNgn(finalTotalNgn)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] disabled:opacity-60 text-sm font-semibold transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>
                {submitting
                  ? 'Initializing Paystack…'
                  : `Pay ${formatNgn(finalTotalNgn)} with Paystack`}
              </span>
            </button>
          </section>

          <PromoCountdownCard variant="compact" />
        </aside>
      </form>
    </div>
  );
}
