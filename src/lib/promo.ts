export const PROMO_CONFIG = {
  id: 'fresh-batch-week-10',
  title: '10% Off Fresh-Batch Appreciation Week',
  discountPercent: 10,
  // Kickstarts Monday, 16 Nov 2026 at 1:00 AM WAT (UTC+1)
  startsAtIso: '2026-11-16T01:00:00+01:00',
  // Ends Sunday, 22 Nov 2026 at 1:00 AM WAT (UTC+1)
  endsAtIso: '2026-11-22T01:00:00+01:00',
  windowSummary: 'Mon 16 Nov, 1:00 AM – Sun 22 Nov, 1:00 AM (WAT)',
  awarenessHeadline: 'Why 10% off this week?',
  awarenessBody:
    'To reward our loyal community across Nigeria and celebrate fresh small-batch Ayurvedic compounding from our Ibadan studio, every single product order placed inside this window automatically gets 10% taken off at checkout before Paystack payment.',
  awarenessBenefits: [
    'Applies automatically to Adult treatments, Kiddies Nature Pop & Nature Shield care, and Combo/Kits sets.',
    'Applies strictly to products—shipping fees remain independent and are paid in full at checkout.',
    'Deducted transparently in your Bag Summary right before Paystack payment—no coupon code needed.',
  ],
} as const;

export type PromoPhase = 'upcoming' | 'active' | 'ended';

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export interface PromoSnapshot {
  phase: PromoPhase;
  isActive: boolean;
  discountPercent: number;
  targetTimestampMs: number;
  countdown: CountdownParts;
}

function splitDuration(ms: number): CountdownParts {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalMs: clamped };
}

export function getPromoSnapshot(now: Date | number = Date.now()): PromoSnapshot {
  const nowMs = typeof now === 'number' ? now : now.getTime();
  const startMs = Date.parse(PROMO_CONFIG.startsAtIso);
  const endMs = Date.parse(PROMO_CONFIG.endsAtIso);

  if (nowMs < startMs) {
    return {
      phase: 'upcoming',
      isActive: false,
      discountPercent: PROMO_CONFIG.discountPercent,
      targetTimestampMs: startMs,
      countdown: splitDuration(startMs - nowMs),
    };
  }

  if (nowMs < endMs) {
    return {
      phase: 'active',
      isActive: true,
      discountPercent: PROMO_CONFIG.discountPercent,
      targetTimestampMs: endMs,
      countdown: splitDuration(endMs - nowMs),
    };
  }

  return {
    phase: 'ended',
    isActive: false,
    discountPercent: 0,
    targetTimestampMs: endMs,
    countdown: splitDuration(0),
  };
}

export interface PromoDiscountBreakdown {
  isActive: boolean;
  phase: PromoPhase;
  discountPercent: number;
  discountLabel: string;
  subtotalNgn: number;
  discountNgn: number;
  totalNgn: number;
}

export function calculatePromoDiscount(
  subtotalNgn: number,
  now: Date | number = Date.now()
): PromoDiscountBreakdown {
  const snapshot = getPromoSnapshot(now);
  if (!snapshot.isActive || subtotalNgn <= 0) {
    return {
      isActive: snapshot.isActive,
      phase: snapshot.phase,
      discountPercent: snapshot.isActive ? PROMO_CONFIG.discountPercent : 0,
      discountLabel: '',
      subtotalNgn,
      discountNgn: 0,
      totalNgn: subtotalNgn,
    };
  }

  const discountNgn = Math.round((subtotalNgn * PROMO_CONFIG.discountPercent) / 100);
  const totalNgn = Math.max(0, subtotalNgn - discountNgn);

  return {
    isActive: true,
    phase: 'active',
    discountPercent: PROMO_CONFIG.discountPercent,
    discountLabel: `${PROMO_CONFIG.title} (-${PROMO_CONFIG.discountPercent}%)`,
    subtotalNgn,
    discountNgn,
    totalNgn,
  };
}
