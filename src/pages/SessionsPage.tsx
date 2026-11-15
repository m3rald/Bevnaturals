import { ArrowLeft } from 'lucide-react';
import { Link } from '../lib/router';
import { PromoCountdownCard } from '../components/PromoCountdownCard';

const SHELF_BUTTONS = [
  {
    id: 'adult',
    label: 'Adult session',
    description: 'Ayurvedic shampoos, deep conditioners, oils, hair butter, clays, herbs & colors',
    to: '/shop/adult',
    className:
      'bg-[#B85C38] text-[#FAF5EE] border-2 border-[#7E442C] hover:bg-[#A44F2E] dark:border-[#8D5037]',
  },
  {
    id: 'kiddies',
    label: 'Kiddies session',
    description: 'Gentle NaturePop & NatureShield formulations crafted specifically for children',
    to: '/shop/kiddies',
    className:
      'bg-[#3D5344] text-[#FAF5EE] border-2 border-[#4F6857] hover:bg-[#324638] dark:border-[#5D7866]',
  },
  {
    id: 'combo',
    label: 'Combo/Kits set',
    description: 'Complete multi-step wash day & scalp repair sets packaged together',
    to: '/shop/combo',
    className:
      'bg-[#C6A36A] text-[#1C1410] border-2 border-[#8F744A] hover:bg-[#B89459] dark:border-[#9E8255]',
  },
] as const;

export function SessionsPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8 py-12 sm:py-16 lg:py-20">
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B] hover:text-[#1C1410] dark:hover:text-[#F3EBDF] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Welcome</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.22em] text-[#8E6F52] dark:text-[#C5A98A] uppercase">
              Shop a shelf
            </p>
            <h1 className="font-display text-[clamp(2.5rem,5vw,3.75rem)] font-semibold leading-[1.04] tracking-tight text-[#1C1410] dark:text-[#F3EBDF] text-balance">
              Pick Your Shopping Session
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[#5C4E45] dark:text-[#C2B6AA]">
              Each shelf stays separate so products never overlap. Select Adult session, Kiddies session, or Combo/Kits set to shop.
            </p>
          </div>

          <nav aria-label="Choose a store session" className="flex flex-col gap-4 max-w-lg">
            {SHELF_BUTTONS.map((shelf) => (
              <div key={shelf.id} className="space-y-1.5">
                <Link
                  to={shelf.to}
                  className={`w-full min-h-[60px] sm:min-h-[64px] px-6 py-4 rounded-full inline-flex items-center justify-center text-center text-lg sm:text-xl font-semibold tracking-tight transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85C38] ${shelf.className}`}
                >
                  {shelf.label}
                </Link>
                <p className="text-xs text-center text-[#5C4E45] dark:text-[#B8AA9B] px-3">
                  {shelf.description}
                </p>
              </div>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-5">
          <PromoCountdownCard variant="frontal" />
        </div>
      </div>
    </section>
  );
}
