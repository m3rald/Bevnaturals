import { Minus, Plus, Trash2 } from 'lucide-react';
import { findProductAndVariant, formatNgn } from '../lib/catalog';
import { useStore } from '../lib/cart-context';
import { resolveProductImage } from '../lib/product-images';
import { calculatePromoDiscount } from '../lib/promo';
import { Link, useRouter } from '../lib/router';
import { PromoCountdownCard, useLivePromoSnapshot } from '../components/PromoCountdownCard';

export function CartPage() {
  const { items, subtotalNgn, updateQuantity, removeItem } = useStore();
  const { navigate } = useRouter();
  useLivePromoSnapshot();
  const promo = calculatePromoDiscount(subtotalNgn);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-2 pb-6 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
        <h1 className="font-display text-4xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
          Shopping Bag
        </h1>
        <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
          Review your hair treatment selections before continuing to checkout.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center space-y-4 rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814]">
          <p className="font-display text-2xl">Your bag is empty.</p>
          <Link
            to="/sessions"
            className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] text-xs font-semibold"
          >
            Choose a Session
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => {
              const match = findProductAndVariant(item.productId, item.variantId);
              if (!match) return null;
              const { product, variant } = match;
              return (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814]"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {resolveProductImage(product) ? (
                      <img
                        src={resolveProductImage(product)}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="aspect-[4/3] w-24 shrink-0 rounded-lg object-cover bg-[#EAE0D2]/70 dark:bg-[#261F1A]"
                      />
                    ) : (
                      <div className="aspect-[4/3] w-24 shrink-0 rounded-lg bg-[#EAE0D2]/70 dark:bg-[#261F1A] flex items-center justify-center p-2 text-center">
                        <span className="font-display text-xs font-semibold leading-tight">
                          {product.name}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <Link
                        to={`/product/${product.slug}`}
                        className="font-display text-xl font-semibold hover:text-[#B85C38] transition-colors block truncate"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
                        {variant.sizeLabel} · <span className="font-mono-num">{formatNgn(variant.priceNgn)}</span> each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="inline-flex items-center rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="h-10 w-10 inline-flex items-center justify-center hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center font-mono-num text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="h-10 w-10 inline-flex items-center justify-center hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-mono-num text-base font-medium min-w-[90px] text-right">
                      {formatNgn(variant.priceNgn * item.quantity)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.variantId)}
                      aria-label={`Remove ${product.name}`}
                      className="p-2 text-[#5C4E45] dark:text-[#B8AA9B] hover:text-[#B85C38] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] p-6 space-y-5">
              <h2 className="font-display text-2xl font-semibold">Order Summary</h2>
              <div className="space-y-3 text-sm pt-2 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
                <div className="flex justify-between">
                  <span className="text-[#5C4E45] dark:text-[#B8AA9B]">Products Subtotal</span>
                  <span className="font-mono-num font-semibold">{formatNgn(subtotalNgn)}</span>
                </div>
                {promo.isActive && (
                  <>
                    <div className="flex justify-between text-[#3D5344] dark:text-[#8FB49B]">
                      <span>10% Launch Week Off</span>
                      <span className="font-mono-num font-semibold">-{formatNgn(promo.discountNgn)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
                      <span className="font-semibold">Total Before Delivery</span>
                      <span className="font-mono-num text-base font-semibold">{formatNgn(promo.totalNgn)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-[#5C4E45] dark:text-[#B8AA9B]">Nigerian Shipping Fee</span>
                  <span className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">Selected at checkout</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full min-h-[46px] px-5 py-3 rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] text-sm font-semibold transition-colors cursor-pointer"
              >
                Proceed to Checkout
              </button>
            </div>

            <PromoCountdownCard variant="compact" />
          </aside>
        </div>
      )}
    </div>
  );
}
