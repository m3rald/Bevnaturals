import { formatNgn } from '../lib/catalog';
import { SHIPPING_REGIONS } from '../lib/shipping';
import { Link } from '../lib/router';

export function ShippingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-2 pb-6 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
        <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
          Fulfilment & Dispatch
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
          Nigeria Regional Shipping Rates
        </h1>
        <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
          Every Nigerian state is listed under its region below. Your selected shipping fee is added at checkout and paid in full alongside your order total (promotional discounts apply strictly to products).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SHIPPING_REGIONS.map((region) => (
          <section
            key={region.id}
            className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 space-y-4"
          >
            <h2 className="font-display text-2xl font-semibold">{region.label}</h2>

            <ul className="space-y-2 text-sm border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 pt-3">
              {region.methods.map((method) => (
                <li key={method.id} className="flex items-center justify-between gap-3">
                  <span className="text-[#5C4E45] dark:text-[#B8AA9B]">{method.label}</span>
                  <span className="font-mono-num font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                    {formatNgn(method.feeNgn)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                States in {region.shortLabel} ({region.states.length}):
              </p>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                {region.states.map((st) => (
                  <li key={st} className="truncate">
                    · {st}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <div>
        <Link
          to="/sessions"
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] text-xs font-semibold"
        >
          Choose a Shopping Session
        </Link>
      </div>
    </div>
  );
}
