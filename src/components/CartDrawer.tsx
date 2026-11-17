import { Minus, Plus, Trash2, X } from 'lucide-react';
import { findProductAndVariant, formatNgn } from '../lib/catalog';
import { useStore } from '../lib/cart-context';
import { resolveProductImage } from '../lib/product-images';
import { calculatePromoDiscount } from '../lib/promo';
import { useRouter } from '../lib/router';
import { useLivePromoSnapshot } from './PromoCountdownCard';

export function CartDrawer() {
  const { items, subtotalNgn, isBagOpen, closeBag, updateQuantity, removeItem } = useStore();
  const { navigate } = useRouter();
  const promoSnapshot = useLivePromoSnapshot();
  const promo = calculatePromoDiscount(subtotalNgn);

  if (!isBagOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Bag">
      <div
        className="fixed inset-0 bg-[#1C1410]/50 backdrop-blur-[2px]"
        onClick={closeBag}
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#FAF5EE] dark:bg-[#1E1814] text-[#1C1410] dark:text-[#F3EBDF] border-l border-[#1C1410]/10 dark:border-[#F3EBDF]/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
          <h2 className="font-display text-2xl font-semibold">Shopping Bag</h2>
          <button
            type="button"
            onClick={closeBag}
            aria-label="Close bag"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="text-sm text-[#5C4E45] dark:text-[#B8AA9B]">
                Your treatment bag is currently empty.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeBag();
                  navigate('/sessions');
                }}
                className="min-h-[42px] px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#1C1410] text-[#F3EBDF] dark:bg-[#F3EBDF] dark:text-[#1C1410] cursor-pointer"
              >
                Choose a Session
              </button>
            </div>
          ) : (
            items.map((item) => {
              const match = findProductAndVariant(item.productId, item.variantId);
              if (!match) return null;
              const { product, variant } = match;

              return (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-4 pb-5 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10"
                >
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

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug truncate">
                          {product.name}
                        </h3>
                        <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B] mt-0.5">
                          {variant.sizeLabel} · {formatNgn(variant.priceNgn)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        aria-label={`Remove ${product.name}`}
                        className="p-1.5 text-[#5C4E45] dark:text-[#B8AA9B] hover:text-[#B85C38] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center rounded-lg border border-[#1C1410]/15 dark:border-[#F3EBDF]/15">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="h-9 w-9 inline-flex items-center justify-center hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono-num text-xs font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="h-9 w-9 inline-flex items-center justify-center hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="font-mono-num text-sm font-medium">
                        {formatNgn(variant.priceNgn * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10 px-6 py-5 space-y-3 bg-[#F3EBDF] dark:bg-[#14100D]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#5C4E45] dark:text-[#B8AA9B]">Subtotal</span>
              <span className="font-mono-num text-sm font-semibold">
                {formatNgn(subtotalNgn)}
              </span>
            </div>
            {promo.isActive && (
              <>
                <div className="flex items-center justify-between text-sm text-[#3D5344] dark:text-[#8FB49B]">
                  <span>10% Launch Week Off</span>
                  <span className="font-mono-num font-semibold">-{formatNgn(promo.discountNgn)}</span>
                </div>
                <div className="flex items-center justify-between text-base pt-2 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
                  <span className="font-semibold">Checkout Total</span>
                  <span className="font-mono-num font-semibold">{formatNgn(promo.totalNgn)}</span>
                </div>
              </>
            )}
            {promoSnapshot.phase === 'upcoming' && (
              <p className="text-xs text-[#B85C38] dark:text-[#C6A36A]">
                10% off unlocks Mon 16 Nov, 1:00 AM WAT and applies automatically before payment.
              </p>
            )}
            <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
              Regional Nigerian shipping (from ₦0 Ibadan pickup) is added at checkout before payment.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  closeBag();
                  navigate('/cart');
                }}
                className="min-h-[44px] px-4 py-2.5 text-xs font-semibold rounded-lg border border-[#1C1410]/20 dark:border-[#F3EBDF]/20 hover:bg-[#1C1410]/5 dark:hover:bg-[#F3EBDF]/5 cursor-pointer whitespace-nowrap"
              >
                View Bag
              </button>
              <button
                type="button"
                onClick={() => {
                  closeBag();
                  navigate('/checkout');
                }}
                className="min-h-[44px] px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#B85C38] text-[#FAF5EE] hover:bg-[#9E4C2C] transition-colors cursor-pointer whitespace-nowrap"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
