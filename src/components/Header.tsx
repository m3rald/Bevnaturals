import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { useStore } from '../lib/cart-context';
import { PRODUCT_IMAGES } from '../lib/product-images';

const NAV_LINKS = [
  { to: '/shop/adult', label: 'Adult' },
  { to: '/shop/kiddies', label: 'Kiddies' },
  { to: '/shop/combo', label: 'Combo' },
  { to: '/about', label: 'About' },
  { to: '/admin', label: 'Studio' },
];

export function Header() {
  const { pathname } = useRouter();
  const { totalCount, openBag } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#F3EBDF]/95 dark:bg-[#14100D]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 h-16">
        {/* Zone 1: Brand logo emblem + wordmark */}
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 font-display text-2xl font-semibold tracking-tight text-[#1C1410] dark:text-[#F3EBDF] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85C38]"
        >
          <img
            src={PRODUCT_IMAGES.logo}
            alt="Bev Naturals emblem"
            referrerPolicy="no-referrer"
            className="h-10 w-10 shrink-0 object-contain"
          />
          <span>Bev Naturals</span>
        </Link>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                ariaCurrent={active ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b ${
                  active
                    ? 'text-[#1C1410] dark:text-[#F3EBDF] border-[#B85C38]'
                    : 'border-transparent hover:text-[#1C1410] dark:hover:text-[#F3EBDF] hover:border-[#1C1410]/30 dark:hover:border-[#F3EBDF]/30'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={openBag}
            className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-xs font-semibold tracking-wide rounded-lg bg-[#1C1410] text-[#F3EBDF] hover:bg-[#3D5344] dark:bg-[#F3EBDF] dark:text-[#1C1410] dark:hover:bg-[#C6A36A] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85C38]"
          >
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="tabular-nums">Bag ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-[#1C1410] dark:text-[#F3EBDF]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] px-4 py-3">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`py-2.5 px-2 text-sm font-medium rounded-md whitespace-nowrap ${
                    active
                      ? 'text-[#B85C38] bg-[#1C1410]/5 dark:bg-[#F3EBDF]/5'
                      : 'text-[#1C1410] dark:text-[#F3EBDF]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
