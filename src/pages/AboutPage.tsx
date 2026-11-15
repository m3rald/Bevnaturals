import { ArrowRight } from 'lucide-react';
import { storeConfig } from '../lib/store-config';
import { Link } from '../lib/router';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 lg:py-16 space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
          <p className="text-xs font-medium text-[#3D5344] dark:text-[#8FB49B]">
            About Bev Naturals Cosmetics
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight text-[#1C1410] dark:text-[#F3EBDF] text-balance">
            Rooted in Ibadan, crafted for textured hair at every age.
          </h1>
          <p className="text-base leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
            Bev Naturals Cosmetics began with a practical standard: hair treatments should strengthen the scalp barrier, soften dense curls without heavy mineral build-up, and rely on honest botanicals rather than synthetic perfume.
          </p>
          <p className="text-base leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
            From slow-infused Ayurvedic Scalp Elixir and Chebe & Shea Deep Moisture Mask to our gentle Kiddies Nature Pop line, every batch is mixed and jarred in Ibadan before shipping nationwide across Nigeria.
          </p>
        </div>

        <div className="lg:col-span-6">
          <div className="aspect-[4/3] lg:h-full lg:aspect-auto min-h-[320px] w-full overflow-hidden rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#EAE0D2]/70 dark:bg-[#261F1A]">
            <img
              src="/assets/aistudio/IMG-20261003-WA0008_2ebc23ac.jpg"
              alt="Bev Naturals Cosmetics Ayurvedic hair treatment bottles and jars"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
        <div className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 space-y-2">
          <h2 className="font-display text-2xl font-semibold">Ayurvedic Infusions</h2>
          <p className="text-sm leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
            Hibiscus calyces, neem leaf, fenugreek seed, amla, and moringa are steeped carefully to nourish the scalp and strengthen natural coils.
          </p>
        </div>
        <div className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 space-y-2">
          <h2 className="font-display text-2xl font-semibold">Kiddies Nature Pop</h2>
          <p className="text-sm leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
            Formulated separately for children using raw honey, coconut, oats, shea butter, almond oil, and calming lavender so wash days stay gentle.
          </p>
        </div>
        <div className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 space-y-2">
          <h2 className="font-display text-2xl font-semibold">Direct Studio Care</h2>
          <p className="text-sm leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
            Questions about your hair porosity or order dispatch? Reach us directly at{' '}
            <a href={`mailto:${storeConfig.email}`} className="underline">
              {storeConfig.email}
            </a>
            .
          </p>
        </div>
      </div>

      <div className="flex justify-start">
        <Link
          to="/sessions"
          className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] text-sm font-semibold transition-colors"
        >
          <span>Choose a Shopping Session</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
