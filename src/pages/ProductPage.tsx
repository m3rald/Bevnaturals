import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Minus, Plus } from 'lucide-react';
import { CATALOG, findProductBySlug, formatNgn, getLineLabel } from '../lib/catalog';
import { useStore } from '../lib/cart-context';
import { resolveProductImage } from '../lib/product-images';
import { Link } from '../lib/router';
import { ProductCard } from '../components/ProductCard';

export function ProductPage({ slug }: { slug: string }) {
  const product = findProductBySlug(slug);
  const { addItem } = useStore();
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedVariantId(product.variants[0].id);
      setQuantity(1);
      setAddedFeedback(false);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-24 text-center space-y-5">
        <h1 className="font-display text-3xl font-semibold">Treatment not found</h1>
        <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
          The formulation you requested may have moved or been renamed.
        </p>
        <Link
          to="/sessions"
          className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2.5 rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] text-xs font-semibold"
        >
          Choose a Session
        </Link>
      </div>
    );
  }

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const related = CATALOG.filter((p) => p.id !== product.id && p.line === product.line).slice(0, 3);

  const handleAdd = () => {
    addItem(product.id, activeVariant.id, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1600);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 lg:py-16 space-y-16 pb-28 md:pb-16">
      <div>
        <Link
          to={`/shop/${product.line}`}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B] hover:text-[#1C1410] dark:hover:text-[#F3EBDF] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to {getLineLabel(product.line)} Session</span>
        </Link>
      </div>

      {/* Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#EAE0D2]/70 dark:bg-[#261F1A]">
            {resolveProductImage(product) ? (
              <img
                src={resolveProductImage(product)}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center space-y-2">
                <span className="font-display text-3xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                  {product.name}
                </span>
                <span className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                  {activeVariant.sizeLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 space-y-7">
          <div className="space-y-3 pb-6 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
            <div className="flex items-center gap-2 text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
              <span>
                {product.line === 'adult'
                  ? 'Adult Session'
                  : product.line === 'kiddies'
                    ? 'Kiddies Session'
                    : 'Combo Session'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{product.category}</span>
              <span aria-hidden="true">·</span>
              <span>{activeVariant.inStock ? 'In Stock' : 'Sold Out'}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight text-[#1C1410] dark:text-[#F3EBDF] text-balance">
              {product.name}
            </h1>

            <p className="font-mono-num text-2xl font-medium text-[#1C1410] dark:text-[#F3EBDF]">
              {formatNgn(activeVariant.priceNgn)}
            </p>
          </div>

          <p className="text-base leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
            {product.description}
          </p>

          {product.includes && product.includes.length > 0 && (
            <div className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-5 space-y-2.5">
              <h2 className="text-xs font-semibold tracking-wide text-[#5C4E45] dark:text-[#B8AA9B]">
                Included in This Combo ({product.includes.length} Items)
              </h2>
              <ul className="space-y-1.5 text-sm text-[#1C1410] dark:text-[#F3EBDF]">
                {product.includes.map((entry, i) => (
                  <li key={entry} className="flex items-baseline gap-2">
                    <span className="font-mono-num text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    <span>{entry}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Size / Variant Selector */}
          <div className="space-y-2.5">
            <span className="block text-xs font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
              Pack Size
            </span>
            <div className="flex flex-wrap gap-2.5">
              {product.variants.map((variant) => {
                const selected = variant.id === activeVariant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`min-h-[42px] px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      selected
                        ? 'border-[#1C1410] bg-[#1C1410] text-[#F3EBDF] dark:border-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410]'
                        : 'border-[#1C1410]/20 dark:border-[#F3EBDF]/20 text-[#1C1410] dark:text-[#F3EBDF] hover:border-[#B85C38]'
                    }`}
                  >
                    {variant.sizeLabel} · <span className="font-mono-num">{formatNgn(variant.priceNgn)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity + Primary Buy CTA */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="inline-flex items-center rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 bg-[#FAF5EE] dark:bg-[#1E1814]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="h-11 w-11 inline-flex items-center justify-center hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-mono-num text-sm font-medium">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="Increase quantity"
                className="h-11 w-11 inline-flex items-center justify-center hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 min-w-[200px] min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {addedFeedback ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <span>
                  Add to Bag · {formatNgn(activeVariant.priceNgn * quantity)}
                </span>
              )}
            </button>
          </div>

          {/* Key Botanicals & Ritual */}
          <div className="pt-6 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 space-y-5">
            <div>
              <h2 className="text-xs font-semibold tracking-wide text-[#5C4E45] dark:text-[#B8AA9B]">
                Key Botanicals
              </h2>
              <p className="mt-1.5 text-sm text-[#1C1410] dark:text-[#F3EBDF]">
                {product.botanicals.join(' · ')}
              </p>
            </div>

            <div>
              <h2 className="text-xs font-semibold tracking-wide text-[#5C4E45] dark:text-[#B8AA9B]">
                Application Ritual
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
                {product.ritual}
              </p>
            </div>

            <div>
              <h2 className="text-xs font-semibold tracking-wide text-[#5C4E45] dark:text-[#B8AA9B]">
                Fulfilment & Payment
              </h2>
              <p className="mt-1.5 text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
                Dispatched from Ibadan across all Nigerian regions. Regional pick up or doorstep shipping is added at checkout and paid via Paystack.
              </p>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pt-12 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 space-y-8">
          <h2 className="font-display text-3xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
            More in {getLineLabel(product.line)} Session
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky bottom buy bar (compact <= 15% cap) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE]/95 dark:bg-[#1E1814]/95 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{product.name}</p>
          <p className="font-mono-num text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
            {formatNgn(activeVariant.priceNgn)} · {activeVariant.sizeLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="min-h-[40px] px-4 py-2 rounded-lg bg-[#B85C38] text-[#FAF5EE] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          {addedFeedback ? 'Added' : 'Add to Bag'}
        </button>
      </div>
    </div>
  );
}
