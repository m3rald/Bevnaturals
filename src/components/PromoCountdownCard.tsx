import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { PROMO_CONFIG, getPromoSnapshot, type PromoSnapshot } from '../lib/promo';

export function useLivePromoSnapshot(): PromoSnapshot {
  const [snapshot, setSnapshot] = useState<PromoSnapshot>(() => getPromoSnapshot());

  useEffect(() => {
    const id = window.setInterval(() => {
      setSnapshot(getPromoSnapshot());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return snapshot;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function PromoCountdownCard({ variant = 'frontal' }: { variant?: 'frontal' | 'compact' }) {
  const snapshot = useLivePromoSnapshot();

  if (snapshot.phase === 'ended') {
    return null;
  }

  const isUpcoming = snapshot.phase === 'upcoming';
  const { days, hours, minutes, seconds } = snapshot.countdown;

  if (variant === 'compact') {
    return (
      <div className="rounded-xl border border-[#1C1410]/12 dark:border-[#F3EBDF]/12 bg-[#FAF5EE] dark:bg-[#1E1814] p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#B85C38] dark:text-[#C6A36A]">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>
              {isUpcoming
                ? '10% Off Launch Week Starts Soon'
                : '10% Off Active · Deducted Before Payment'}
            </span>
          </div>
          <span className="font-mono-num tabular-nums text-xs font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
            {days > 0 ? `${days}d ` : ''}
            {pad2(hours)}:{pad2(minutes)}:{pad2(seconds)}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
          {isUpcoming
            ? `Unlocks Mon 16 Nov, 1:00 AM until Sun 22 Nov, 1:00 AM (WAT). ${PROMO_CONFIG.awarenessBody}`
            : `Every product ordered before Sun 22 Nov, 1:00 AM (WAT) automatically gets 10% deducted at checkout before Paystack payment.`}
        </p>
      </div>
    );
  }

  return (
    <aside
      aria-label="10% off timed appreciation event"
      className="rounded-2xl border border-[#1C1410]/12 dark:border-[#F3EBDF]/12 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 sm:p-7 space-y-6"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-[#B85C38] dark:text-[#C6A36A]">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            {isUpcoming
              ? 'Starts Monday 1:00 AM WAT'
              : 'Live Now · 10% Deducted at Checkout'}
          </span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight text-[#1C1410] dark:text-[#F3EBDF] text-balance">
          {PROMO_CONFIG.title}
        </h2>

        <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
          {PROMO_CONFIG.windowSummary}
        </p>
      </div>

      {/* Live Ticking Timer */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
          {isUpcoming ? 'Countdown to kickoff (1:00 AM Monday)' : 'Time left to claim 10% off'}
        </p>
        <div className="grid grid-cols-4 gap-2.5 text-center">
          {[
            { label: 'Days', value: pad2(days) },
            { label: 'Hours', value: pad2(hours) },
            { label: 'Mins', value: pad2(minutes) },
            { label: 'Secs', value: pad2(seconds) },
          ].map((unit) => (
            <div
              key={unit.label}
              className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#F3EBDF] dark:bg-[#14100D] py-3 px-2"
            >
              <div className="font-mono-num tabular-nums text-2xl sm:text-3xl font-semibold text-[#1C1410] dark:text-[#F3EBDF] leading-none">
                {unit.value}
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
                {unit.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why 10% Off & Customer Benefits */}
      <div className="pt-5 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 space-y-3">
        <h3 className="text-sm font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
          {PROMO_CONFIG.awarenessHeadline}
        </h3>
        <p className="text-sm leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
          {PROMO_CONFIG.awarenessBody}
        </p>
        <ul className="space-y-2 text-xs leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
          {PROMO_CONFIG.awarenessBenefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="font-mono-num text-[#B85C38] dark:text-[#C6A36A] shrink-0">
                {String(index + 1).padStart(2, '0')}.
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
