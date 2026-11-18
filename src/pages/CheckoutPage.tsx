import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Truck,
  User,
} from 'lucide-react';
import { findProductAndVariant, formatNgn } from '../lib/catalog';
import { calculatePromoDiscount } from '../lib/promo';
import {
  SHIPPING_REGIONS,
  findRegionById,
  resolveShippingQuote,
  type ShippingMethodId,
  type ShippingRegionId,
} from '../lib/shipping';
import { storeConfig } from '../lib/store-config';
import { useStore } from '../lib/cart-context';
import { Link, useRouter } from '../lib/router';
import { OrderReceiptCard } from '../components/OrderReceiptCard';
import { PromoCountdownCard, useLivePromoSnapshot } from '../components/PromoCountdownCard';
import { saveManualOrderToCache } from '../lib/manual-history-cache';
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

const MANUAL_WAIT_SECONDS = 60;

type CheckoutStage = 'contact' | 'delivery' | 'payment';

type ManualPhase =
  | 'idle'
  | 'deposit'
  | 'countdown'
  | 'confirm'
  | 'copy_code'
  | 'submit_proof';

export function CheckoutPage() {
  const { items, subtotalNgn, clearBag } = useStore();
  const { navigate, search } = useRouter();
  useLivePromoSnapshot();
  const promo = calculatePromoDiscount(subtotalNgn);

  // Paystack remains intact under the hood but is masked from plain sight unless explicitly enabled
  const usePaystackGateway =
    storeConfig.paystack.enabled || new URLSearchParams(search).get('gateway') === 'paystack';

  // Link-to-link outer stage: 1. Contact -> 2. Delivery & Shipping -> 3. Payment
  const [checkoutStage, setCheckoutStage] = useState<CheckoutStage>('contact');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [regionId, setRegionId] = useState<ShippingRegionId>('ibadan');
  const [state, setState] = useState<string>(SHIPPING_REGIONS[0].states[0]);
  const [methodId, setMethodId] = useState<ShippingMethodId>(SHIPPING_REGIONS[0].methods[0].id);
  const [city, setCity] = useState('Ibadan');
  const [address, setAddress] = useState('Ibadan Studio Pick Up');
  const [note, setNote] = useState('');

  // Link-to-link sequential manual OPay checkout state
  const paymentSectionRef = useRef<HTMLElement | null>(null);
  const [opaySenderName, setOpaySenderName] = useState('');
  const [manualPhase, setManualPhase] = useState<ManualPhase>('idle');
  const [waitSecondsLeft, setWaitSecondsLeft] = useState(MANUAL_WAIT_SECONDS);
  const [paymentMadeChecked, setPaymentMadeChecked] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [verifyingPending, setVerifyingPending] = useState(false);
  const [error, setError] = useState('');
  const [pendingCheckout, setPendingCheckout] = useState<{
    orderNumber: string;
    reference: string;
    authorizationUrl: string;
  } | null>(null);

  useEffect(() => {
    if (manualPhase !== 'countdown') return;
    if (waitSecondsLeft <= 0) {
      setManualPhase('confirm');
      return;
    }
    const timer = window.setInterval(() => {
      setWaitSecondsLeft((prev) => {
        if (prev <= 1) {
          setManualPhase('confirm');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [manualPhase, waitSecondsLeft]);

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

  const validateContactStage = (): boolean => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setError('Please enter your full name to continue.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address for your order receipt.');
      return false;
    }
    if (trimmedPhone.replace(/\D/g, '').length < 7) {
      setError('Please enter a valid phone number so our rider or studio can reach you.');
      return false;
    }
    return true;
  };

  const validateDeliveryStage = (): boolean => {
    if (!address.trim()) {
      setError('Please enter your delivery address or pick up landmark.');
      return false;
    }
    if (!city.trim()) {
      setError('Please enter your city or town.');
      return false;
    }
    return true;
  };

  const goToDeliveryStage = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateContactStage()) return;
    setCheckoutStage('delivery');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPaymentStage = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateContactStage()) {
      setCheckoutStage('contact');
      return;
    }
    if (!validateDeliveryStage()) return;
    setManualPhase('idle');
    setWaitSecondsLeft(MANUAL_WAIT_SECONDS);
    setPaymentMadeChecked(false);
    setCheckoutStage('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditStage = (target: 'contact' | 'delivery') => {
    if (!usePaystackGateway && manualPhase !== 'idle') return;
    setError('');
    setCheckoutStage(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (items.length === 0 && !completedOrder) {
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

  // Phase 4 & Phase 5: Sequential post-confirmation screens (Copy 4-letter code -> Link to Submit Proof + Receipt)
  if (completedOrder && (manualPhase === 'copy_code' || manualPhase === 'submit_proof')) {
    const syncManualCodeCopied = async (advancePhase: boolean) => {
      const locallySavedOrder: Order = {
        ...completedOrder,
        codeCopiedAt: completedOrder.codeCopiedAt || new Date().toISOString(),
      };
      saveManualOrderToCache(locallySavedOrder);
      setCompletedOrder(locallySavedOrder);

      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(completedOrder.orderNumber)}/copy-code`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              verificationCode: completedOrder.verificationCode,
              order: locallySavedOrder,
            }),
          }
        );
        if (res.ok) {
          const data = (await res.json()) as { order?: Order };
          if (data.order) {
            saveManualOrderToCache(data.order);
            setCompletedOrder(data.order);
          }
        }
      } catch {
        // non-blocking network safety; local archive retains order for Lookup sync
      }

      if (advancePhase) {
        setManualPhase('submit_proof');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const handleCopyFourLetterCode = async () => {
      if (completedOrder.verificationCode) {
        try {
          await navigator.clipboard.writeText(completedOrder.verificationCode);
        } catch {
          // clipboard may be restricted in embedded views; still record & unlock proof step
        }
      }
      await syncManualCodeCopied(true);
    };

    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 lg:py-16 space-y-8">
        <div className="space-y-2 pb-6 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
          <p className="text-xs font-bold uppercase tracking-wider text-[#3D5344] dark:text-[#8FB49B]">
            Order Placed ·{' '}
            {manualPhase === 'copy_code'
              ? 'Step 4 of 5: Copy Your 4-Letter Code'
              : 'Step 5 of 5: Send Screenshot & Code on WhatsApp'}
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
            Order <span className="font-mono-num">{completedOrder.orderNumber}</span>
          </h1>
        </div>

        {manualPhase === 'copy_code' ? (
          <section className="rounded-2xl border-2 border-[#B85C38] bg-[#FAF5EE] dark:bg-[#1E1814] p-7 sm:p-9 space-y-6 text-center max-w-xl mx-auto">
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#B85C38] dark:text-[#C6A36A]">
                Copy This 4-Letter Verification Code First
              </p>
              <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
                Once you copy your 4-letter code below, the link to submit your payment proof and full order receipt will appear.
              </p>
            </div>

            <div
              onCopy={() => {
                void syncManualCodeCopied(false);
              }}
              className="rounded-xl border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] py-6 px-4 select-all"
            >
              <span className="font-mono-num text-5xl font-extrabold tracking-[0.35em] text-[#1C1410] dark:text-[#F3EBDF] uppercase">
                {completedOrder.verificationCode || '—'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyFourLetterCode}
              className="w-full min-h-[50px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-[#B85C38] hover:bg-[#9E4C2C] text-[#FAF5EE] text-sm font-extrabold uppercase tracking-wide transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              <span>Copy 4-Letter Code &amp; Reveal Proof Link</span>
            </button>
          </section>
        ) : (
          <div className="space-y-8">
            <div className="rounded-xl border-2 border-[#059669] bg-[#059669]/10 p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Check
                  className="w-5 h-5 text-[#059669] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-2 text-xs sm:text-sm text-[#1C1410] dark:text-[#F3EBDF]">
                  <p className="font-extrabold uppercase tracking-wide text-[#059669]">
                    4-LETTER CODE COPIED: {completedOrder.verificationCode}
                  </p>
                  <p className="font-bold leading-relaxed">
                    STRICT INSTRUCTION: TAKE A SCREENSHOT OF YOUR FULL ORDER RECEIPT BELOW AND SEND YOUR PAYMENT PROOF + THE 4-LETTER CODE ({completedOrder.verificationCode}) TO WHATSAPP NUMBER{' '}
                    <span className="font-mono-num font-extrabold underline">
                      {storeConfig.opay.whatsappNumber}
                    </span>{' '}
                    NOW:
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pl-8">
                <a
                  href={storeConfig.opay.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 min-h-[46px] px-6 py-2.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] ring-2 ring-[#10B981]/60 shadow-md text-sm font-extrabold tracking-wide transition-colors"
                >
                  <span>Click this</span>
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
                <span className="text-xs font-bold text-[#1C1410] dark:text-[#F3EBDF]">
                  Redirects straight to WhatsApp ({storeConfig.opay.whatsappNumber}) to submit proof
                </span>
              </div>
            </div>

            <OrderReceiptCard
              order={completedOrder}
              showScreenshotPrompt={true}
              hideWhatsappButton={true}
            />

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
        )}
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
      throw new Error(data.error || 'Payment could not be verified.');
    }
    clearBag();
    navigate(`/order/${encodeURIComponent(orderNumber)}`);
  };

  const handlePaystackSubmit = async () => {
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
      throw new Error('Checkout session could not be initialized.');
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
                `Payment window closed. Your order ${createdOrder.orderNumber} is saved — you can resume payment below.`
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
                  'Inline checkout could not open here. Use the direct payment button below.'
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

    throw new Error('Checkout URL was not returned.');
  };

  const handleCopyAccountForPayment = async () => {
    try {
      await navigator.clipboard.writeText(storeConfig.opay.accountNumber);
    } catch {
      // ignore clipboard restrictions in embedded previews so flow never gets stuck
    }
    setError('');
    setWaitSecondsLeft(MANUAL_WAIT_SECONDS);
    setPaymentMadeChecked(false);
    setManualPhase('countdown');
  };

  const handleConfirmManualPayment = async () => {
    setError('');
    if (manualPhase !== 'confirm' || waitSecondsLeft > 0) {
      setError(`Please wait ${waitSecondsLeft}s before confirming payment.`);
      return;
    }
    if (!paymentMadeChecked) {
      setError('Please tick the Payment Made confirmation box first.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'opay',
          paymentConfirmed: true,
          opaySenderName,
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
      };

      if (!res.ok || !data.order) {
        throw new Error(data.error || 'Unable to submit your order right now.');
      }

      setCompletedOrder(data.order);
      clearBag();
      setManualPhase('copy_code');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to confirm payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingCheckout(null);

    if (!validateContactStage()) {
      setCheckoutStage('contact');
      return;
    }
    if (!validateDeliveryStage()) {
      setCheckoutStage('delivery');
      return;
    }

    if (usePaystackGateway) {
      setSubmitting(true);
      try {
        await handlePaystackSubmit();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed.');
        setSubmitting(false);
      }
      return;
    }

    // Manual link-to-link Phase 0 -> Phase 1 ("Make payment" brings deposit account details)
    if (manualPhase === 'idle') {
      setManualPhase('deposit');
      window.setTimeout(() => {
        paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
      return;
    }

    if (manualPhase === 'confirm') {
      await handleConfirmManualPayment();
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
          : 'Payment not yet confirmed. Complete payment first, then verify again.'
      );
    } finally {
      setVerifyingPending(false);
    }
  };

  const detailsLocked = !usePaystackGateway && manualPhase !== 'idle';
  const stageIndex = checkoutStage === 'contact' ? 1 : checkoutStage === 'delivery' ? 2 : 3;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      {/* Header & Link-to-Link Progress Stepper */}
      <div className="space-y-6 pb-6 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
            Guest Checkout · Step {stageIndex} of 3
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
            Delivery &amp; Payment
          </h1>
        </div>

        <nav aria-label="Checkout Steps" className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { id: 'contact' as const, num: 1, label: 'Contact Details' },
            { id: 'delivery' as const, num: 2, label: 'Delivery & Shipping' },
            { id: 'payment' as const, num: 3, label: 'Payment' },
          ].map((step) => {
            const isCurrent = checkoutStage === step.id;
            const isDone = stageIndex > step.num;
            const canClick = isDone && !detailsLocked;

            return (
              <button
                key={step.id}
                type="button"
                disabled={!canClick}
                onClick={() => {
                  if (canClick && (step.id === 'contact' || step.id === 'delivery')) {
                    handleEditStage(step.id);
                  }
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                  isCurrent
                    ? 'border-[#B85C38] bg-[#B85C38]/10 text-[#1C1410] dark:text-[#F3EBDF]'
                    : isDone
                      ? 'border-[#3D5344]/40 bg-[#3D5344]/8 text-[#1C1410] dark:text-[#F3EBDF] hover:border-[#3D5344] cursor-pointer'
                      : 'border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE]/60 dark:bg-[#1E1814]/60 text-[#5C4E45]/70 dark:text-[#B8AA9B]/60 cursor-not-allowed'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold font-mono-num ${
                    isCurrent
                      ? 'bg-[#B85C38] text-[#FAF5EE]'
                      : isDone
                        ? 'bg-[#3D5344] text-[#FAF5EE]'
                        : 'bg-[#1C1410]/10 dark:bg-[#F3EBDF]/10 text-[#5C4E45] dark:text-[#B8AA9B]'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : step.num}
                </span>
                <span className="text-xs sm:text-sm font-semibold truncate">{step.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[#B85C38]/40 bg-[#B85C38]/10 px-4 py-3 text-sm text-[#1C1410] dark:text-[#F3EBDF]"
        >
          {error}
        </div>
      )}

      {usePaystackGateway && pendingCheckout && pendingCheckout.authorizationUrl && (
        <div className="rounded-xl border border-[#3D5344]/40 bg-[#3D5344]/8 dark:border-[#567560]/40 dark:bg-[#567560]/12 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
              Order <span className="font-mono-num">{pendingCheckout.orderNumber}</span> is ready for payment
            </p>
            <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
              Open checkout to complete payment, then click Verify Payment if you aren&apos;t redirected automatically.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={pendingCheckout.authorizationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] text-xs font-semibold transition-colors"
            >
              <span>Open Checkout</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Main Stage Column — Only the active step is expanded */}
        <div className="lg:col-span-7 space-y-6">
          {/* STAGE 1: CONTACT DETAILS */}
          {checkoutStage === 'contact' && (
            <form
              onSubmit={goToDeliveryStage}
              className="rounded-xl border border-[#1C1410]/12 dark:border-[#F3EBDF]/12 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 sm:p-7 space-y-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#B85C38]" aria-hidden="true" />
                  <h2 className="font-display text-2xl font-semibold">1. Contact Details</h2>
                </div>
                <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                  Enter your details for your official receipt and delivery coordination before selecting shipping.
                </p>
              </div>

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
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
                    Email Address (for order receipt)
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
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
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] text-sm font-semibold transition-colors cursor-pointer"
                >
                  <span>Continue to Delivery &amp; Shipping</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {/* STAGE 2: DELIVERY & SHIPPING */}
          {checkoutStage === 'delivery' && (
            <div className="space-y-5">
              {/* Confirmed Contact Summary Chip */}
              <div className="rounded-xl border border-[#3D5344]/30 bg-[#FAF5EE] dark:bg-[#1E1814] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Check className="w-4 h-4 text-[#3D5344] dark:text-[#8FB49B] shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-[#1C1410] dark:text-[#F3EBDF] truncate">
                    {fullName}
                  </span>
                  <span className="text-[#5C4E45] dark:text-[#B8AA9B] truncate">
                    · {email} · {phone}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleEditStage('contact')}
                  className="font-semibold underline underline-offset-4 text-[#B85C38] dark:text-[#C6A36A] cursor-pointer"
                >
                  Edit Contact
                </button>
              </div>

              <form
                onSubmit={goToPaymentStage}
                className="rounded-xl border border-[#1C1410]/12 dark:border-[#F3EBDF]/12 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 sm:p-7 space-y-6"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#B85C38]" aria-hidden="true" />
                    <h2 className="font-display text-2xl font-semibold">2. Delivery &amp; Shipping</h2>
                  </div>
                  <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                    Select your region, state, delivery option, and address to unlock payment.
                  </p>
                </div>

                {/* 2A. Region Selector */}
                <div className="space-y-2.5">
                  <span className="block text-xs font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                    A. Select Your Region
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SHIPPING_REGIONS.map((region) => {
                      const isActiveRegion = activeRegion.id === region.id;
                      const minFee = Math.min(...region.methods.map((m) => m.feeNgn));
                      const maxFee = Math.max(...region.methods.map((m) => m.feeNgn));
                      const feeRangeLabel =
                        minFee === maxFee
                          ? formatNgn(minFee)
                          : `${formatNgn(minFee)} – ${formatNgn(maxFee)}`;

                      return (
                        <button
                          key={region.id}
                          type="button"
                          onClick={() => handleRegionChange(region.id)}
                          aria-pressed={isActiveRegion}
                          className={`text-left rounded-xl border p-3.5 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                            isActiveRegion
                              ? 'border-[#B85C38] bg-[#B85C38]/10 dark:bg-[#B85C38]/15'
                              : 'border-[#1C1410]/12 dark:border-[#F3EBDF]/12 bg-[#F3EBDF]/70 dark:bg-[#14100D]/70 hover:border-[#B85C38]/50'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                            {region.label}
                          </span>
                          <span className="font-mono-num text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B] shrink-0">
                            {feeRangeLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2B. State Selector (Focused to Selected Region Only) */}
                <div className="space-y-2.5 pt-2 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
                  <span className="block text-xs font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                    B. Select State in {activeRegion.label}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeRegion.states.map((st) => {
                      const isSelectedState = shippingQuote.state === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleRegionChange(activeRegion.id, st)}
                          aria-pressed={isSelectedState}
                          className={`min-h-[38px] px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            isSelectedState
                              ? 'border-[#B85C38] bg-[#B85C38] text-[#FAF5EE]'
                              : 'border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-[#1C1410] dark:text-[#F3EBDF] hover:border-[#B85C38]/60'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2C. Delivery / Pick Up Method */}
                <div className="space-y-2.5 pt-2 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
                  <span className="block text-xs font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                    C. Delivery / Pick Up Option for {shippingQuote.state}
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

                {/* 2D. Destination Address & Note */}
                <div className="space-y-3 pt-2 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
                  <span className="block text-xs font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                    D. Destination Details
                  </span>
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
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
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
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
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
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleEditStage('contact')}
                    className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-xs font-semibold hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Back to Contact</span>
                  </button>

                  <button
                    type="submit"
                    className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STAGE 3: SEQUENTIAL LINK-TO-LINK PAYMENT */}
          {checkoutStage === 'payment' && (
            <div className="space-y-5">
              {/* Confirmed Contact & Delivery Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-[#3D5344]/30 bg-[#FAF5EE] dark:bg-[#1E1814] p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                      <User className="w-3.5 h-3.5 text-[#3D5344] dark:text-[#8FB49B]" aria-hidden="true" />
                      <span>Contact Confirmed</span>
                    </span>
                    {!detailsLocked && (
                      <button
                        type="button"
                        onClick={() => handleEditStage('contact')}
                        className="font-semibold underline underline-offset-4 text-[#B85C38] dark:text-[#C6A36A] cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <p className="font-medium text-[#1C1410] dark:text-[#F3EBDF]">{fullName}</p>
                  <p className="text-[#5C4E45] dark:text-[#B8AA9B] truncate">
                    {email} · {phone}
                  </p>
                </div>

                <div className="rounded-xl border border-[#3D5344]/30 bg-[#FAF5EE] dark:bg-[#1E1814] p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                      <MapPin className="w-3.5 h-3.5 text-[#3D5344] dark:text-[#8FB49B]" aria-hidden="true" />
                      <span>Delivery Confirmed</span>
                    </span>
                    {!detailsLocked && (
                      <button
                        type="button"
                        onClick={() => handleEditStage('delivery')}
                        className="font-semibold underline underline-offset-4 text-[#B85C38] dark:text-[#C6A36A] cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <p className="font-medium text-[#1C1410] dark:text-[#F3EBDF]">
                    {shippingQuote.method.label} · {shippingQuote.state}
                  </p>
                  <p className="text-[#5C4E45] dark:text-[#B8AA9B] truncate">
                    {address}, {city}
                  </p>
                </div>
              </div>

              {usePaystackGateway ? (
                <form
                  onSubmit={handlePaymentSubmit}
                  className="rounded-xl border border-[#1C1410]/12 dark:border-[#F3EBDF]/12 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 sm:p-7 space-y-5"
                >
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

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleEditStage('delivery')}
                      className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-xs font-semibold hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                      <span>Back to Delivery</span>
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] disabled:opacity-60 text-sm font-semibold transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {submitting
                          ? 'Initializing Paystack…'
                          : `Pay ${formatNgn(finalTotalNgn)} with Paystack`}
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handlePaymentSubmit}
                  ref={paymentSectionRef as unknown as React.RefObject<HTMLFormElement>}
                  className="rounded-xl border-2 border-[#B85C38]/60 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 sm:p-7 space-y-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-[#B85C38]" aria-hidden="true" />
                      <span>3. Payment</span>
                    </h2>
                    {manualPhase === 'idle' ? (
                      <button
                        type="button"
                        onClick={() => handleEditStage('delivery')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#5C4E45] dark:text-[#B8AA9B] hover:text-[#B85C38] cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Back to Delivery</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setManualPhase('idle');
                          setWaitSecondsLeft(MANUAL_WAIT_SECONDS);
                          setPaymentMadeChecked(false);
                          setError('');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#5C4E45] dark:text-[#B8AA9B] hover:text-[#B85C38] cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Restart Payment Step</span>
                      </button>
                    )}
                  </div>

                  {/* Phase 0: Click "Make Payment" to reveal deposit details */}
                  {manualPhase === 'idle' && (
                    <div className="space-y-4">
                      <p className="text-xs leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
                        Your contact and delivery details are locked in. Click{' '}
                        <strong className="text-[#1C1410] dark:text-[#F3EBDF]">Make Payment</strong>{' '}
                        to view the deposit account details.
                      </p>
                      <button
                        type="submit"
                        className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] text-sm font-extrabold uppercase tracking-wide transition-colors cursor-pointer"
                      >
                        <Banknote className="w-4 h-4" aria-hidden="true" />
                        <span>Make Payment</span>
                      </button>
                    </div>
                  )}

                  {/* Phase 1: Show ONLY Deposit Account Details + Copy button (Amount & timer wait until copied) */}
                  {manualPhase === 'deposit' && (
                    <div className="space-y-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#B85C38] dark:text-[#C6A36A]">
                        Step 1: Copy the account number below to reveal the exact amount &amp; timer
                      </p>

                      <div className="rounded-xl border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 bg-[#F3EBDF] dark:bg-[#14100D] p-5 space-y-4">
                        <div className="space-y-1.5 uppercase">
                          <p className="font-mono-num text-2xl sm:text-3xl font-extrabold tracking-wider text-[#1C1410] dark:text-[#F3EBDF]">
                            {storeConfig.opay.accountNumber}
                          </p>
                          <p className="text-base sm:text-lg font-extrabold tracking-wide text-[#B85C38] dark:text-[#C6A36A]">
                            {storeConfig.opay.bankName}
                          </p>
                          <p className="text-sm sm:text-base font-extrabold tracking-wide text-[#1C1410] dark:text-[#F3EBDF]">
                            {storeConfig.opay.accountName}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyAccountForPayment}
                          className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] hover:bg-[#B85C38] dark:hover:bg-[#C6A36A] text-xs sm:text-sm font-extrabold uppercase tracking-wide transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4" aria-hidden="true" />
                          <span>Copy Account Number ({storeConfig.opay.accountNumber})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Phase 2: Copied -> Exact Amount to Pay + 60-Second Countdown Timer */}
                  {manualPhase === 'countdown' && (
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-[#3D5344] dark:text-[#8FB49B]">
                        <Check className="w-4 h-4" aria-hidden="true" />
                        <span>
                          Account Copied: {storeConfig.opay.accountNumber} ({storeConfig.opay.bankName} ·{' '}
                          {storeConfig.opay.accountName})
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 bg-[#F3EBDF] dark:bg-[#14100D] p-5 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5C4E45] dark:text-[#B8AA9B]">
                          Exact Amount to Transfer{promo.isActive ? ' (10% Product Off Applied)' : ''}
                        </p>
                        <p className="font-mono-num text-3xl font-extrabold text-[#1C1410] dark:text-[#F3EBDF]">
                          {formatNgn(finalTotalNgn)}
                        </p>
                        <div className="pt-2 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 text-xs font-bold uppercase tracking-wide text-[#1C1410] dark:text-[#F3EBDF] space-y-0.5">
                          <p>{storeConfig.opay.accountNumber}</p>
                          <p>{storeConfig.opay.bankName}</p>
                          <p>{storeConfig.opay.accountName}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border-2 border-[#B85C38] bg-[#B85C38]/10 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#B85C38] dark:text-[#C6A36A]">
                            <Clock className="w-4 h-4" aria-hidden="true" />
                            <span>Transfer Countdown</span>
                          </span>
                          <span className="font-mono-num tabular-nums text-xl font-extrabold text-[#1C1410] dark:text-[#F3EBDF]">
                            {waitSecondsLeft}s
                          </span>
                        </div>
                        <p className="text-xs font-semibold leading-relaxed text-[#1C1410] dark:text-[#F3EBDF]">
                          Complete your transfer of {formatNgn(finalTotalNgn)} now. Wait {waitSecondsLeft}{' '}
                          seconds for the Payment Made confirmation and code step to unlock.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Phase 3: 60 Seconds Elapsed -> Payment Made Checkbox + Confirm */}
                  {manualPhase === 'confirm' && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-[#3D5344] bg-[#3D5344]/8 dark:bg-[#3D5344]/15 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-wide text-[#3D5344] dark:text-[#8FB49B]">
                          <span>Transfer Countdown Complete</span>
                          <span className="font-mono-num">{formatNgn(finalTotalNgn)}</span>
                        </div>
                        <p className="text-xs font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                          Tick Payment Made below to generate your 4-letter verification code.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="opaySenderName"
                          className="block text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]"
                        >
                          Sender Name on OPay Transfer (optional)
                        </label>
                        <input
                          id="opaySenderName"
                          type="text"
                          value={opaySenderName}
                          onChange={(e) => setOpaySenderName(e.target.value)}
                          placeholder="Account name used for transfer"
                          className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#F3EBDF] dark:bg-[#14100D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
                        />
                      </div>

                      <label
                        htmlFor="payment-made-checkbox"
                        className="flex items-start gap-3 rounded-xl border-2 border-[#3D5344] bg-[#FAF5EE] dark:bg-[#14100D] p-3.5 text-xs font-bold uppercase tracking-wide cursor-pointer"
                      >
                        <input
                          id="payment-made-checkbox"
                          type="checkbox"
                          checked={paymentMadeChecked}
                          onChange={(e) => setPaymentMadeChecked(e.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-[#3D5344] cursor-pointer shrink-0"
                        />
                        <span className="leading-relaxed text-[#1C1410] dark:text-[#F3EBDF]">
                          PAYMENT MADE — I HAVE TRANSFERRED {formatNgn(finalTotalNgn)} TO{' '}
                          {storeConfig.opay.accountNumber} ({storeConfig.opay.bankName} ·{' '}
                          {storeConfig.opay.accountName})
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={handleConfirmManualPayment}
                        disabled={submitting || !paymentMadeChecked}
                        className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#3D5344] text-[#FAF5EE] hover:bg-[#314437] disabled:opacity-55 text-sm font-extrabold uppercase tracking-wide transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        <span>
                          {submitting
                            ? 'Generating 4-Letter Code…'
                            : !paymentMadeChecked
                              ? 'Tick Payment Made Above'
                              : 'Confirm Payment & Reveal Code'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Bold Strict WhatsApp Reminder (shown subtly from deposit step onward without exposing link prematurely) */}
                  {manualPhase !== 'idle' && (
                    <div className="rounded-lg border border-[#B85C38]/40 bg-[#B85C38]/8 p-3.5 flex items-start gap-2.5">
                      <AlertTriangle
                        className="w-4 h-4 text-[#B85C38] dark:text-[#C6A36A] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <p className="text-[11px] font-bold leading-relaxed text-[#1C1410] dark:text-[#F3EBDF]">
                        STRICT INSTRUCTION: AFTER PAYMENT AND COPYING YOUR 4-LETTER CODE, SCREENSHOT YOUR ORDER RECEIPT AND SEND YOUR PROOF + CODE TO WHATSAPP{' '}
                        <span className="font-mono-num font-extrabold underline">
                          {storeConfig.opay.whatsappNumber}
                        </span>{' '}
                        USING THE LINK UNLOCKED AT THE FINAL STEP.
                      </p>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
        </div>

        {/* Sticky Order & Shipping Summary Sidebar */}
        <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <section className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 space-y-5">
            <h2 className="font-display text-2xl font-semibold">Bag &amp; Shipping Summary</h2>

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
                  {checkoutStage === 'contact'
                    ? 'Shipping (Selected next)'
                    : `Shipping · ${shippingQuote.method.label} (${shippingQuote.state})`}
                </span>
                <span className="font-mono-num font-semibold shrink-0">
                  {checkoutStage === 'contact' ? '—' : formatNgn(shippingFeeNgn)}
                </span>
              </div>

              {promo.isActive && (
                <p className="text-[11px] text-[#5C4E45] dark:text-[#B8AA9B]">
                  Shipping fee is independent of the 10% product promo and paid in full.
                </p>
              )}

              <div className="flex justify-between pt-3 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
                <span className="font-semibold">
                  {checkoutStage === 'contact'
                    ? 'Products Total'
                    : usePaystackGateway
                      ? 'Total to Pay on Paystack'
                      : 'Checkout Total'}
                </span>
                <span className="font-mono-num text-lg font-semibold">
                  {formatNgn(checkoutStage === 'contact' ? promo.totalNgn : finalTotalNgn)}
                </span>
              </div>
            </div>
          </section>

          <PromoCountdownCard variant="compact" />
        </aside>
      </div>
    </div>
  );
}
