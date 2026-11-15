import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CATALOG } from '../lib/catalog';
import { Link, useRouter } from '../lib/router';
import { ProductCard } from '../components/ProductCard';
import { PromoCountdownCard } from '../components/PromoCountdownCard';
import type { ProductCategory, ProductLine } from '../lib/types';

const CATEGORIES: Array<'All' | ProductCategory> = [
  'All',
  'Scalp & Roots',
  'Cleanse',
  'Moisture & Masks',
  'Daily Styling',
];

const SESSION_LINKS: Array<{ line: ProductLine; to: string; label: string }> = [
  { line: 'adult', to: '/shop/adult', label: 'Adult Session' },
  { line: 'kiddies', to: '/shop/kiddies', label: 'Kiddies Session' },
  { line: 'combo', to: '/shop/combo', label: 'Combo/Kits' },
];

const SESSION_HEADINGS: Record<ProductLine, { title: string; subtitle: string }> = {
  adult: {
    title: 'Adult Session',
    subtitle: 'Targeted scalp elixirs, clarifying shampoos, deep conditioning masks, hair butter, clays, and herbal treatments.',
  },
  kiddies: {
    title: 'Kiddies Session',
    subtitle: 'Gentle Kiddies Nature Pop & Nature Shield shampoos, leave-in detanglers, hair butter, and growth oil.',
  },
  combo: {
    title: 'Combo/Kits Set',
    subtitle: 'Paired wash-day sets and full-routine kits packaged together for bundled savings.',
  },
};

export function ShopPage({ initialLine = 'adult' }: { initialLine?: ProductLine }) {
  const { search } = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<'All' | ProductCategory>('All');
  const [query, setQuery] = useState('');

  const params = new URLSearchParams(search);
  const queryLine = params.get('line');
  const activeLine: ProductLine =
    queryLine === 'adult' || queryLine === 'kiddies' || queryLine === 'combo'
      ? queryLine
      : initialLine;

  useEffect(() => {
    setCategoryFilter('All');
    setQuery('');
  }, [activeLine]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((product) => {
      if (product.line !== activeLine) return false;
      if (categoryFilter !== 'All' && product.category !== categoryFilter) return false;
      if (q) {
        const haystack = [
          product.name,
          product.shortNote,
          product.category,
          ...product.botanicals,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [activeLine, categoryFilter, query]);

  const heading = SESSION_HEADINGS[activeLine];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
            <Link to="/" className="hover:text-[#B85C38] underline underline-offset-4">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/sessions" className="hover:text-[#B85C38] underline underline-offset-4">
              Sessions
            </Link>
            <span aria-hidden="true">/</span>
            <span>{heading.title}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{filtered.length} products</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#1C1410] dark:text-[#F3EBDF]">
            {heading.title}
          </h1>
          <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">{heading.subtitle}</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C4E45] dark:text-[#B8AA9B]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search within this session…"
            aria-label="Search treatments"
            className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#FAF5EE] dark:bg-[#1E1814] text-sm text-[#1C1410] dark:text-[#F3EBDF] placeholder:text-[#5C4E45]/70 dark:placeholder:text-[#B8AA9B]/70 focus:outline-none focus:ring-2 focus:ring-[#B85C38]"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Strictly separate session switcher (no mixed all-products wall) */}
        <nav
          aria-label="Store sessions"
          className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#EAE0D2] dark:bg-[#261F1A] self-start"
        >
          {SESSION_LINKS.map((tab) => {
            const isActive = activeLine === tab.line;
            return (
              <Link
                key={tab.line}
                to={tab.to}
                ariaCurrent={isActive ? 'page' : undefined}
                className={`inline-flex items-center min-h-[38px] px-4 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#FAF5EE] dark:bg-[#14100D] text-[#1C1410] dark:text-[#F3EBDF] shadow-sm'
                    : 'text-[#5C4E45] dark:text-[#B8AA9B] hover:text-[#1C1410] dark:hover:text-[#F3EBDF]'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === category
                  ? 'border-[#1C1410] bg-[#1C1410] text-[#F3EBDF] dark:border-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410]'
                  : 'border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-[#5C4E45] dark:text-[#B8AA9B] hover:border-[#1C1410]/35 dark:hover:border-[#F3EBDF]/35'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <PromoCountdownCard variant="compact" />

      {filtered.length === 0 ? (
        <div className="py-20 text-center space-y-4 rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814]">
          <p className="font-display text-2xl text-[#1C1410] dark:text-[#F3EBDF]">
            No treatments in {heading.title} match your current filter.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('All');
                setQuery('');
              }}
              className="min-h-[40px] px-5 py-2 text-xs font-semibold rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] cursor-pointer"
            >
              Clear Filter
            </button>
            <Link
              to="/sessions"
              className="min-h-[40px] inline-flex items-center px-5 py-2 text-xs font-semibold rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20"
            >
              Switch Session
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
