import { Moon, Sun } from 'lucide-react';
import { Link } from '../lib/router';
import { useStore } from '../lib/cart-context';
import { storeConfig } from '../lib/store-config';

export function Footer() {
  const { theme, toggleTheme } = useStore();

  return (
    <footer className="border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1A1410] text-[#1C1410] dark:text-[#F3EBDF]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 font-display text-2xl font-semibold tracking-tight">
              <span className="h-9 w-9 rounded-full overflow-hidden shrink-0 border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#14532D]">
                <img
                  src={storeConfig.logoSrc}
                  alt="Bev Naturals emblem"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover scale-[1.24]"
                />
              </span>
              <span>{storeConfig.brandName}</span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
              Small-batch botanical hair treatment formulations for adults and children. Handcrafted in Ibadan and dispatched nationwide across Nigeria.
            </p>
            <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
              Store enquiries:{' '}
              <a
                href={`mailto:${storeConfig.email}`}
                className="underline underline-offset-4 hover:text-[#B85C38]"
              >
                {storeConfig.email}
              </a>
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-[#5C4E45] dark:text-[#B8AA9B]">
              Store Sessions
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/sessions" className="hover:text-[#B85C38] transition-colors">Choose a Session</Link></li>
              <li><Link to="/shop/adult" className="hover:text-[#B85C38] transition-colors">Adult Session</Link></li>
              <li><Link to="/shop/kiddies" className="hover:text-[#B85C38] transition-colors">Kiddies Session</Link></li>
              <li><Link to="/shop/combo" className="hover:text-[#B85C38] transition-colors">Combo/Kits Set</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-[#5C4E45] dark:text-[#B8AA9B]">
              Information & Studio
            </h3>
            <ul className="space-y-2 text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
              <li><Link to="/about" className="hover:text-[#B85C38] transition-colors">Our Story</Link></li>
              <li><Link to="/shipping" className="hover:text-[#B85C38] transition-colors">Shipping & Dispatch</Link></li>
              <li><Link to="/faq" className="hover:text-[#B85C38] transition-colors">Care & Payment FAQ</Link></li>
              <li>
                <Link to="/admin" className="text-[#1C1410] dark:text-[#F3EBDF] hover:text-[#B85C38] transition-colors">
                  Studio Order Ledger
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
            © {new Date().getFullYear()} {storeConfig.brandName}. Ibadan, Nigeria · Secured by Paystack.
          </p>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-[#1C1410] dark:text-[#F3EBDF] hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 transition-colors cursor-pointer whitespace-nowrap"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Dark Appearance</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Light Appearance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
