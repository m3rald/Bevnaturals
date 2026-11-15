import { ArrowRight } from 'lucide-react';
import { Link } from '../lib/router';
import { PromoCountdownCard } from '../components/PromoCountdownCard';

export function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8 py-12 sm:py-16 lg:py-20 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Short Welcome Message + Direct Link-to-Link Redirect */}
        <div className="lg:col-span-6 space-y-7">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-[0.22em] text-[#8E6F52] dark:text-[#C5A98A] uppercase">
              Ibadan · Nigeria
            </p>

            <h1 className="font-display text-[clamp(3rem,6.5vw,4.75rem)] font-semibold leading-[0.98] tracking-tight text-[#1C1410] dark:text-[#F3EBDF] text-balance">
              Welcome to Bev Naturals.
            </h1>

            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-[#5C4E45] dark:text-[#C2B6AA]">
              Small-batch Ayurvedic hair treatments packed fresh in Ibadan and dispatched across Nigeria. Adult treatments, Kiddies NaturePop essentials, and Combo/Kits stay on separate shelves so every routine is effortless to shop.
            </p>
          </div>

          <div className="space-y-3 pt-1 max-w-md">
            <Link
              to="/sessions"
              className="w-full min-h-[60px] px-7 py-4 rounded-full inline-flex items-center justify-center gap-3 bg-[#B85C38] text-[#FAF5EE] border-2 border-[#7E442C] hover:bg-[#A44F2E] text-base sm:text-lg font-semibold tracking-tight transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85C38]"
            >
              <span>Choose Adult, Kiddies or Combo</span>
              <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
            </Link>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B] pt-1">
              <span>Direct link to:</span>
              <Link
                to="/shop/adult"
                className="underline underline-offset-4 hover:text-[#1C1410] dark:hover:text-[#F3EBDF]"
              >
                Adult Session
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                to="/shop/kiddies"
                className="underline underline-offset-4 hover:text-[#1C1410] dark:hover:text-[#F3EBDF]"
              >
                Kiddies Session
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                to="/shop/combo"
                className="underline underline-offset-4 hover:text-[#1C1410] dark:hover:text-[#F3EBDF]"
              >
                Combo/Kits
              </Link>
            </div>
          </div>
        </div>

        {/* Real Product Showcase Preview Picture */}
        <div className="lg:col-span-6">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#1C1410]/12 dark:border-[#F3EBDF]/12 bg-[#EAE0D2]/70 dark:bg-[#261F1A]">
            <img
              src="/assets/aistudio/IMG-20261003-WA0003_f717a6bf.jpg"
              alt="Bev Naturals Cosmetics full Ayurvedic haircare collection"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Timed 10% Appreciation Week Countdown & Benefit Details */}
      <PromoCountdownCard variant="frontal" />
    </section>
  );
}
